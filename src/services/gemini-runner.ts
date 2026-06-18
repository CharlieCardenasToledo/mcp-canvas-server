import { GoogleGenAI } from "@google/genai";
import type { CanvasClient } from "./canvas-client.js";
import type { ToolDefinition } from "../common/tool-model.js";

export interface GeminiRunOptions {
    model?: string;
    systemPrompt?: string;
}

export interface AgentResult {
    answer: string;
    tools_used: string[];
    model: string;
    provider: "gemini";
}

const DEFAULT_MODEL = "gemini-2.5-flash";

// Gemini no acepta: $schema, additionalProperties, anyOf multi-tipo, nullable
function sanitizeSchema(schema: Record<string, unknown>): Record<string, unknown> {
    const { $schema, additionalProperties, nullable, ...clean } = schema as any;

    // anyOf con un solo elemento → aplanar
    if (Array.isArray(clean.anyOf) && clean.anyOf.length === 1) {
        return sanitizeSchema(clean.anyOf[0] as Record<string, unknown>);
    }
    // anyOf con múltiples tipos (ej: number | string | null) → convertir a string
    if (Array.isArray(clean.anyOf)) {
        return { type: "string", description: clean.description ?? "" };
    }
    // type: ["string", "null"] → type: "string"
    if (Array.isArray(clean.type)) {
        clean.type = clean.type.find((t: string) => t !== "null") ?? "string";
    }

    if (clean.properties) {
        const cleanProps: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(clean.properties as Record<string, unknown>)) {
            cleanProps[k] = sanitizeSchema(v as Record<string, unknown>);
        }
        clean.properties = cleanProps;
    }
    if (clean.items) {
        clean.items = sanitizeSchema(clean.items as Record<string, unknown>);
    }
    return clean;
}

function toolsToGemini(tools: ToolDefinition[]) {
    const seen = new Set<string>();
    const unique = tools.filter(t => {
        if (seen.has(t.tool.name)) return false;
        seen.add(t.tool.name);
        return true;
    });
    return [{
        functionDeclarations: unique.map(t => ({
            name: t.tool.name,
            description: (t.tool.description as string) ?? "",
            parameters: sanitizeSchema(t.tool.inputSchema as Record<string, unknown>)
        }))
    }];
}

export class GeminiRunner {
    private ai: GoogleGenAI;
    private tools: ToolDefinition[];
    private client: CanvasClient;

    constructor(apiKey: string, client: CanvasClient, tools: ToolDefinition[]) {
        this.ai     = new GoogleGenAI({ apiKey });
        this.client = client;
        this.tools  = tools;
    }

    async run(userMessage: string, options: GeminiRunOptions = {}): Promise<AgentResult> {
        const model    = options.model ?? DEFAULT_MODEL;
        const geminiTools = toolsToGemini(this.tools);
        const systemInstruction = options.systemPrompt ??
            "Eres un asistente educativo con acceso a Canvas LMS. " +
            "Usa las herramientas disponibles para responder sobre cursos, tareas, estudiantes y calificaciones. " +
            "Responde SIEMPRE en español. Sé conciso y claro.";
        const toolsUsed: string[] = [];

        // Historial de conversación en formato Gemini
        const contents: any[] = [
            { role: "user", parts: [{ text: userMessage }] }
        ];


        // Agentic loop (máx. 10 iteraciones)
        for (let i = 0; i < 10; i++) {
            const response = await this.ai.models.generateContent({
                model,
                contents,
                config: {
                    tools: geminiTools,
                    systemInstruction,
                    thinkingConfig: { thinkingBudget: 0 }  // deshabilitar thinking para evitar respuestas vacías
                }
            });

            const candidate = response.candidates?.[0];
            if (!candidate) throw new Error("Gemini no devolvió ningún candidato.");

            const parts = candidate.content?.parts ?? [];

            // Agregar respuesta del modelo al historial
            contents.push({ role: "model", parts });

            // Separar texto y function calls
            const functionCalls = parts.filter((p: any) => p.functionCall);
            const textParts     = parts.filter((p: any) => p.text);

            // Sin function calls → respuesta final
            if (functionCalls.length === 0) {
                const answer = textParts.map((p: any) => p.text).join("").trim();
                return { answer, tools_used: toolsUsed, model, provider: "gemini" };
            }

            // Ejecutar cada function call
            const functionResponses: any[] = [];
            for (const part of functionCalls) {
                const { name, args } = part.functionCall as { name: string; args: Record<string, unknown> };
                const toolDef = this.tools.find(t => t.name === name);
                let resultText: string;

                if (!toolDef) {
                    resultText = `Error: herramienta '${name}' no existe.`;
                } else {
                    try {
                        const result = await toolDef.handler(this.client, args ?? {});
                        const blocks = result?.content as Array<{ type: string; text?: string }> ?? [];
                        resultText = blocks
                            .filter(b => b.type === "text" && b.text)
                            .map(b => b.text!)
                            .join("\n");
                        toolsUsed.push(name);
                    } catch (err: unknown) {
                        resultText = `Error: ${err instanceof Error ? err.message : String(err)}`;
                    }
                }

                functionResponses.push({
                    functionResponse: { name, response: { result: resultText } }
                });
            }

            // Devolver resultados al modelo
            contents.push({ role: "user", parts: functionResponses });
        }

        throw new Error("El agente excedió el límite de iteraciones (10).");
    }
}
