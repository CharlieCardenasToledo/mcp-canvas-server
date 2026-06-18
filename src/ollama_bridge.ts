#!/usr/bin/env tsx
/**
 * Bridge — conecta el servidor MCP de Canvas con Ollama o Gemini.
 *
 * Uso:
 *   npx tsx src/ollama_bridge.ts                              # Ollama qwen2.5
 *   npx tsx src/ollama_bridge.ts --model phi4:14b             # Ollama phi4
 *   npx tsx src/ollama_bridge.ts --model qwen2.5 --mode native
 *   npx tsx src/ollama_bridge.ts --provider gemini            # Gemini (lee GEMINI_API_KEY)
 *   npx tsx src/ollama_bridge.ts --provider gemini --gemini-key TU_KEY
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Ollama } from "ollama";
import type { Message, Tool, ToolCall } from "ollama";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigManager } from "./common/config-manager.js";
import { GeminiRunner } from "./services/gemini-runner.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = "qwen2.5";
const DEFAULT_HOST  = "http://localhost:11434";

function parseArgs(): { model: string; host: string; mode: "auto" | "native" | "prompt"; provider: "ollama" | "gemini"; geminiKey: string } {
    const args = process.argv.slice(2);
    let model     = DEFAULT_MODEL;
    let host      = DEFAULT_HOST;
    let mode: "auto" | "native" | "prompt" = "auto";
    let provider: "ollama" | "gemini" = "ollama";
    let geminiKey = process.env.GEMINI_API_KEY ?? "";

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--model"      && args[i + 1]) model     = args[++i];
        if (args[i] === "--host"       && args[i + 1]) host      = args[++i];
        if (args[i] === "--gemini-key" && args[i + 1]) geminiKey = args[++i];
        if (args[i] === "--provider"   && args[i + 1]) {
            const p = args[++i];
            if (p === "gemini" || p === "ollama") provider = p;
        }
        if (args[i] === "--mode" && args[i + 1]) {
            const m = args[++i];
            if (m === "native" || m === "prompt") mode = m;
        }
    }
    return { model, host, mode, provider, geminiKey };
}

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

interface McpTool {
    name: string;
    description?: string;
    inputSchema: Record<string, unknown>;
}

interface ParsedToolCall {
    name: string;
    arguments: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Modo NATIVE — convierte herramientas MCP al formato Ollama
// ---------------------------------------------------------------------------

function mcpToolToOllama(t: McpTool): Tool {
    return {
        type: "function",
        function: {
            name: t.name,
            description: t.description ?? "",
            parameters: t.inputSchema as Tool["function"]["parameters"]
        }
    };
}

// ---------------------------------------------------------------------------
// Modo PROMPT — inyecta herramientas en el system prompt y parsea respuesta
// ---------------------------------------------------------------------------

function buildPromptModeSystemPrompt(tools: McpTool[]): string {
    // Solo incluir las herramientas más relevantes para no saturar el contexto.
    // phi4:14b tiene 16K de contexto — con 81 tools completas lo excede.
    const RELEVANT = [
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
    ];

    const selected = tools.filter(t => RELEVANT.includes(t.name));

    const toolDefs = selected.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.inputSchema
    }));

    return `Eres un asistente educativo con acceso a Canvas LMS.
Responde SIEMPRE en español. Sé conciso y presenta los datos de forma clara.

Tienes acceso a las siguientes herramientas de Canvas:
${JSON.stringify(toolDefs, null, 2)}

REGLAS PARA USAR HERRAMIENTAS:
1. Cuando necesites datos de Canvas, responde ÚNICAMENTE con un bloque JSON así:
<tool_call>
{"name": "nombre_herramienta", "arguments": {"param": "valor"}}
</tool_call>

2. No escribas nada más cuando hagas una tool call — solo el bloque <tool_call>.
3. Después de recibir el resultado de la herramienta, responde al usuario en español.
4. Si necesitas varias herramientas, úsalas de una en una.`;
}

function parsePromptModeResponse(content: string): ParsedToolCall[] {
    const results: ParsedToolCall[] = [];

    // Buscar bloques <tool_call>...</tool_call>
    const tagPattern = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
    let match: RegExpExecArray | null;
    while ((match = tagPattern.exec(content)) !== null) {
        try {
            const parsed = JSON.parse(match[1]);
            if (parsed.name && parsed.arguments) {
                results.push({ name: parsed.name, arguments: parsed.arguments });
            }
        } catch { /* JSON malformado */ }
    }

    if (results.length > 0) return results;

    // Fallback: buscar JSON con "name" + "arguments" suelto
    const jsonPattern = /\{[\s\S]*?"name"\s*:\s*"([^"]+)"[\s\S]*?"arguments"\s*:\s*(\{[\s\S]*?\})\s*\}/g;
    while ((match = jsonPattern.exec(content)) !== null) {
        try {
            results.push({ name: match[1], arguments: JSON.parse(match[2]) });
        } catch { /* ignorar */ }
    }

    return results;
}

// ---------------------------------------------------------------------------
// Detectar si el modelo soporta tools nativo
// ---------------------------------------------------------------------------

async function detectMode(
    ollama: Ollama,
    model: string,
    sampleTools: Tool[]
): Promise<"native" | "prompt"> {
    try {
        await ollama.chat({
            model,
            messages: [{ role: "user", content: "ping" }],
            tools: sampleTools.slice(0, 1),
            stream: false
        });
        return "native";
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("does not support tools")) return "prompt";
        throw err; // error inesperado
    }
}

// ---------------------------------------------------------------------------
// Ejecutar una tool call via MCP
// ---------------------------------------------------------------------------

async function executeTool(
    mcpClient: Client,
    toolCall: ParsedToolCall
): Promise<string> {
    const result = await mcpClient.callTool({
        name: toolCall.name,
        arguments: toolCall.arguments
    });
    const content = result.content as Array<{ type: string; text?: string }>;
    return content
        .filter(b => b.type === "text" && b.text)
        .map(b => b.text!)
        .join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const { model, host, mode: modeArg, provider, geminiKey } = parseArgs();

    const __dirname  = path.dirname(fileURLToPath(import.meta.url));
    const serverEntry = path.resolve(__dirname, "../dist/index.js");

    const configManager = new ConfigManager();
    const token  = process.env.CANVAS_API_TOKEN  || configManager.get("CANVAS_API_TOKEN");
    const domain = process.env.CANVAS_API_DOMAIN || configManager.get("CANVAS_API_DOMAIN");

    if (!token || !domain) {
        console.error(
            "Error: Falta CANVAS_API_TOKEN o CANVAS_API_DOMAIN.\n" +
            "Ejecuta: npm run start -- config"
        );
        process.exit(1);
    }

    // 1. Conectar al servidor MCP
    console.log("Conectando al servidor MCP de Canvas...");
    const transport = new StdioClientTransport({
        command: "node",
        args: [serverEntry, "start"],
        env: { ...process.env, CANVAS_API_TOKEN: token, CANVAS_API_DOMAIN: domain }
    });
    const mcpClient = new Client({ name: "ollama-bridge", version: "1.0.0" }, { capabilities: {} });
    await mcpClient.connect(transport);

    // 2. Obtener herramientas
    const { tools: mcpTools } = await mcpClient.listTools();
    const ollamaTools = (mcpTools as McpTool[]).map(mcpToolToOllama);
    console.log(`Servidor MCP listo. ${ollamaTools.length} herramientas disponibles.`);

    // --- Rama Gemini ---
    if (provider === "gemini") {
        if (!geminiKey) {
            console.error("Error: se necesita una API key de Gemini.\nUsa --gemini-key TU_KEY o define GEMINI_API_KEY.");
            await mcpClient.close();
            process.exit(1);
        }

        // Importar las herramientas MCP como ToolDefinition para GeminiRunner
        // Las reconstruimos desde mcpTools + handlers directos via MCP client
        const toolDefs = (mcpTools as McpTool[]).map(t => ({
            name: t.name,
            tool: { name: t.name, description: t.description ?? "", inputSchema: t.inputSchema },
            handler: async (_client: any, args: any) => {
                const result = await mcpClient.callTool({ name: t.name, arguments: args ?? {} });
                return result;
            }
        }));

        const geminiModel = model !== DEFAULT_MODEL ? model : "gemini-2.5-flash";
        const runner = new GeminiRunner(geminiKey, {} as any, toolDefs as any);

        console.log(`Usando Gemini: ${geminiModel}`);
        console.log('Escribe tu pregunta (o "salir" para terminar)\n');

        const rl = readline.createInterface({ input, output });
        while (true) {
            let userInput: string;
            try { userInput = await rl.question("Tú: "); } catch { break; }
            if (!userInput.trim()) continue;
            if (userInput.trim().toLowerCase() === "salir") break;

            try {
                const result = await runner.run(userInput.trim(), { model: geminiModel });
                console.log(`\nAsistente: ${result.answer}`);
                if (result.tools_used.length) {
                    console.log(`  (herramientas usadas: ${result.tools_used.join(", ")})\n`);
                } else {
                    console.log();
                }
            } catch (err: unknown) {
                console.error(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
            }
        }

        console.log("\nHasta luego.");
        rl.close();
        await mcpClient.close();
        return;
    }

    // 3. Conectar a Ollama y resolver modelo
    const ollama = new Ollama({ host });
    let resolvedModel = model;
    try {
        await ollama.show({ model: resolvedModel });
    } catch {
        const withLatest = model.includes(":") ? model : `${model}:latest`;
        try {
            await ollama.show({ model: withLatest });
            resolvedModel = withLatest;
        } catch {
            console.error(`Modelo '${model}' no encontrado. Descárgalo con: ollama pull ${model}`);
            await mcpClient.close();
            process.exit(1);
        }
    }

    // 4. Detectar modo si es "auto"
    let mode: "native" | "prompt";
    if (modeArg === "auto") {
        process.stdout.write("Detectando capacidades del modelo... ");
        mode = await detectMode(ollama, resolvedModel, ollamaTools);
        console.log(mode === "native" ? "✓ tools nativo" : "✓ modo prompt-engineering");
    } else {
        mode = modeArg;
        console.log(`Modo forzado: ${mode}`);
    }

    console.log(`Usando modelo: ${resolvedModel}`);
    console.log('Escribe tu pregunta (o "salir" para terminar)\n');

    // 5. Construir historial inicial según modo
    const systemContent = mode === "prompt"
        ? buildPromptModeSystemPrompt(mcpTools as McpTool[])
        : "Eres un asistente educativo con acceso a Canvas LMS. " +
          "Usa las herramientas disponibles para consultar cursos, tareas, estudiantes y calificaciones. " +
          "Responde SIEMPRE en español. Sé conciso y presenta los datos de forma clara.";

    const messages: Message[] = [{ role: "system", content: systemContent }];

    // 6. Loop de conversación
    const rl = readline.createInterface({ input, output });

    while (true) {
        let userInput: string;
        try {
            userInput = await rl.question("Tú: ");
        } catch { break; }

        if (!userInput.trim()) continue;
        if (userInput.trim().toLowerCase() === "salir") break;

        messages.push({ role: "user", content: userInput });

        // Agentic loop
        while (true) {
            const response = await ollama.chat({
                model: resolvedModel,
                messages,
                ...(mode === "native" ? { tools: ollamaTools } : {}),
                stream: false
            });

            const assistantMessage = response.message;
            messages.push(assistantMessage);

            // Resolver tool calls según el modo
            let toolCalls: ParsedToolCall[] = [];

            if (mode === "native") {
                if (assistantMessage.tool_calls?.length) {
                    toolCalls = (assistantMessage.tool_calls as ToolCall[]).map(tc => ({
                        name: tc.function.name,
                        arguments: (tc.function.arguments ?? {}) as Record<string, unknown>
                    }));
                }
            } else {
                if (assistantMessage.content) {
                    toolCalls = parsePromptModeResponse(assistantMessage.content);
                }
            }

            // Sin tool calls → respuesta final
            if (toolCalls.length === 0) {
                // En modo prompt limpiar las etiquetas <tool_call> si quedaron
                const finalText = assistantMessage.content?.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "").trim();
                console.log(`\nAsistente: ${finalText}\n`);
                break;
            }

            // Ejecutar herramientas
            for (const tc of toolCalls) {
                process.stdout.write(`  [${tc.name}] `);
                try {
                    const result = await executeTool(mcpClient, tc);
                    process.stdout.write("✓\n");
                    messages.push({
                        role: mode === "native" ? "tool" : "user",
                        content: mode === "native"
                            ? `[${tc.name}]\n${result}`
                            : `Resultado de ${tc.name}:\n${result}`
                    });
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    process.stdout.write(`✗ ${msg}\n`);
                    messages.push({
                        role: mode === "native" ? "tool" : "user",
                        content: `Error en ${tc.name}: ${msg}`
                    });
                }
            }
        }
    }

    console.log("\nHasta luego.");
    rl.close();
    await mcpClient.close();
}

main().catch(err => {
    console.error("Error fatal:", err);
    process.exit(1);
});
