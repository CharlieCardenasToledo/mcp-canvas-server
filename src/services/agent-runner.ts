import { Ollama } from "ollama";
import type { Message, Tool, ToolCall } from "ollama";
import type { CanvasClient } from "./canvas-client.js";
import type { ToolDefinition } from "../common/tool-model.js";

export type AgentMode = "auto" | "native" | "prompt";

export interface AgentRunOptions {
    model?: string;
    ollamaHost?: string;
    mode?: AgentMode;
    systemPrompt?: string;
}

export interface AgentResult {
    answer: string;
    tools_used: string[];
    model: string;
    mode: "native" | "prompt";
}

interface ParsedToolCall {
    name: string;
    arguments: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Detección de modo
// ---------------------------------------------------------------------------

async function detectMode(ollama: Ollama, model: string, sampleTool: Tool): Promise<"native" | "prompt"> {
    try {
        await ollama.chat({
            model,
            messages: [{ role: "user", content: "ping" }],
            tools: [sampleTool],
            stream: false
        });
        return "native";
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("does not support tools")) return "prompt";
        throw err;
    }
}

// ---------------------------------------------------------------------------
// Parseo de tool calls en texto plano (modo prompt)
// ---------------------------------------------------------------------------

function parseTextToolCalls(content: string): ParsedToolCall[] {
    const results: ParsedToolCall[] = [];

    const tagPattern = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
    let match: RegExpExecArray | null;
    while ((match = tagPattern.exec(content)) !== null) {
        try {
            const parsed = JSON.parse(match[1]);
            if (parsed.name && parsed.arguments) {
                results.push({ name: parsed.name, arguments: parsed.arguments });
            }
        } catch { /* ignorar */ }
    }

    if (results.length > 0) return results;

    // Fallback: JSON suelto con "name" + "arguments"
    const jsonPattern = /\{[\s\S]*?"name"\s*:\s*"([^"]+)"[\s\S]*?"arguments"\s*:\s*(\{[\s\S]*?\})\s*\}/g;
    while ((match = jsonPattern.exec(content)) !== null) {
        try {
            results.push({ name: match[1], arguments: JSON.parse(match[2]) });
        } catch { /* ignorar */ }
    }

    return results;
}

// ---------------------------------------------------------------------------
// System prompt para modo prompt-engineering
// ---------------------------------------------------------------------------

const PROMPT_MODE_TOOLS = [
    "canvas_list_courses",
    "canvas_get_assignments",
    "canvas_get_assignment",
    "canvas_list_students",
    "canvas_list_students_with_grades",
    "canvas_get_student_grades",
    "canvas_list_modules",
    "canvas_list_quizzes",
    "canvas_get_submissions",
    "canvas_get_submission",
    "canvas_grade_submission",
    "canvas_list_announcements",
    "canvas_list_discussions",
    "canvas_audit_course",
    "canvas_list_assignment_groups",
    "canvas_list_assignment_due_dates",
    "canvas_grade_multiple_submissions",
    "canvas_get_submission_comments",
];

function buildPromptSystemPrompt(tools: ToolDefinition[]): string {
    const selected = tools
        .filter(t => PROMPT_MODE_TOOLS.includes(t.name))
        .map(t => ({
            name: t.tool.name,
            description: t.tool.description,
            parameters: t.tool.inputSchema
        }));

    return `Eres un asistente educativo con acceso a Canvas LMS.
Responde SIEMPRE en español. Sé conciso y claro.

Herramientas disponibles:
${JSON.stringify(selected, null, 2)}

REGLAS:
1. Para consultar Canvas, responde SOLO con un bloque <tool_call>:
<tool_call>
{"name": "nombre_herramienta", "arguments": {"param": "valor"}}
</tool_call>
2. No escribas nada más cuando hagas una tool call.
3. Después de recibir el resultado, responde al usuario en español.
4. Una herramienta a la vez.`;
}

const NATIVE_SYSTEM =
    "Eres un asistente educativo con acceso a Canvas LMS. " +
    "Usa las herramientas disponibles para responder sobre cursos, tareas, estudiantes y calificaciones. " +
    "Responde SIEMPRE en español. Sé conciso y claro.";

// ---------------------------------------------------------------------------
// AgentRunner
// ---------------------------------------------------------------------------

export class AgentRunner {
    private ollama: Ollama;
    private tools: ToolDefinition[];
    private client: CanvasClient;
    private ollamaTools: Tool[];

    constructor(client: CanvasClient, tools: ToolDefinition[], ollamaHost = "http://localhost:11434") {
        this.client   = client;
        this.tools    = tools;
        this.ollama   = new Ollama({ host: ollamaHost });
        this.ollamaTools = tools.map(t => ({
            type: "function" as const,
            function: {
                name: t.tool.name,
                description: (t.tool.description as string) ?? "",
                parameters: t.tool.inputSchema as Tool["function"]["parameters"]
            }
        }));
    }

    async run(userMessage: string, options: AgentRunOptions = {}): Promise<AgentResult> {
        const modelRaw  = options.model      ?? "qwen2.5";
        const modeArg   = options.mode       ?? "auto";

        // Resolver nombre del modelo (fallback a :latest)
        let model = modelRaw;
        try {
            await this.ollama.show({ model });
        } catch {
            const withLatest = model.includes(":") ? model : `${model}:latest`;
            try {
                await this.ollama.show({ model: withLatest });
                model = withLatest;
            } catch {
                throw new Error(`Modelo '${modelRaw}' no encontrado en Ollama. Descárgalo con: ollama pull ${modelRaw}`);
            }
        }

        // Detectar modo
        let mode: "native" | "prompt";
        if (modeArg === "auto") {
            mode = await detectMode(this.ollama, model, this.ollamaTools[0]);
        } else {
            mode = modeArg;
        }

        const defaultSystem = mode === "prompt"
            ? buildPromptSystemPrompt(this.tools)
            : NATIVE_SYSTEM;

        const messages: Message[] = [{
            role: "system",
            content: options.systemPrompt ?? defaultSystem
        }];
        messages.push({ role: "user", content: userMessage });

        const toolsUsed: string[] = [];

        // Agentic loop (máx. 10 iteraciones para evitar loops infinitos)
        for (let i = 0; i < 10; i++) {
            const response = await this.ollama.chat({
                model,
                messages,
                ...(mode === "native" ? { tools: this.ollamaTools } : {}),
                stream: false
            });

            const assistantMessage = response.message;
            messages.push(assistantMessage);

            // Extraer tool calls
            let calls: ParsedToolCall[] = [];
            if (mode === "native" && assistantMessage.tool_calls?.length) {
                calls = (assistantMessage.tool_calls as ToolCall[]).map(tc => ({
                    name: tc.function.name,
                    arguments: (tc.function.arguments ?? {}) as Record<string, unknown>
                }));
            } else if (mode === "prompt" && assistantMessage.content) {
                calls = parseTextToolCalls(assistantMessage.content);
            }

            // Sin tool calls → respuesta final
            if (calls.length === 0) {
                const answer = (assistantMessage.content ?? "")
                    .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "")
                    .trim();
                return { answer, tools_used: toolsUsed, model, mode };
            }

            // Ejecutar cada herramienta
            for (const call of calls) {
                const toolDef = this.tools.find(t => t.name === call.name);
                let resultText: string;

                if (!toolDef) {
                    resultText = `Error: herramienta '${call.name}' no existe.`;
                } else {
                    try {
                        const result = await toolDef.handler(this.client, call.arguments);
                        const blocks = result?.content as Array<{ type: string; text?: string }> ?? [];
                        resultText = blocks
                            .filter((b: { type: string; text?: string }) => b.type === "text" && b.text)
                            .map((b: { type: string; text?: string }) => b.text!)
                            .join("\n");
                        toolsUsed.push(call.name);
                    } catch (err: unknown) {
                        resultText = `Error: ${err instanceof Error ? err.message : String(err)}`;
                    }
                }

                messages.push({
                    role: mode === "native" ? "tool" : "user",
                    content: mode === "native"
                        ? `[${call.name}]\n${resultText}`
                        : `Resultado de ${call.name}:\n${resultText}`
                });
            }
        }

        throw new Error("El agente excedió el límite de iteraciones (10).");
    }
}
