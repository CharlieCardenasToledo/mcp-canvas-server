#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    Tool
} from "@modelcontextprotocol/sdk/types.js";
import * as dotenv from "dotenv";
import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";

import { CanvasClient } from "./services/canvas-client.js";
import { ConfigManager } from "./common/config-manager.js";

// Import Modular Components
import { courseTools } from "./tools/course-tools.js";
import { assignmentTools } from "./tools/assignment-tools.js";
import { gradingTools } from "./tools/grading-tools.js";
import { communicationTools } from "./tools/communication-tools.js";
import { canvasResources } from "./resources/canvas-resources.js";
import { canvasPrompts } from "./prompts/canvas-prompts.js";
import { ToolDefinition } from "./common/tool-model.js";
import { startHttpServer } from "./http-server.js";

// Load env vars if present
dotenv.config();

const configManager = new ConfigManager();
const program = new Command();

program
    .name("canvas-mcp")
    .description("MCP Server for Canvas LMS (Refactored)")
    .version("1.1.0");

// --- CLI Commands ---

program
    .command("config")
    .description("Configure Canvas credentials interactively")
    .action(async () => {
        console.log(chalk.blue.bold("\nCanvas MCP Server Configuration\n"));

        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "domain",
                message: "Canvas Domain (e.g., uide.instructure.com):",
                default: configManager.get("CANVAS_API_DOMAIN"),
                validate: (input: string) => input.trim().length > 0
            },
            {
                type: "password",
                name: "token",
                message: "Canvas API Token:",
                mask: "*",
                validate: (input: string) => input.trim().length > 0
            }
        ]);

        configManager.set("CANVAS_API_DOMAIN", answers.domain);
        configManager.set("CANVAS_API_TOKEN", answers.token);

        console.log(chalk.green("\n✅ Configuration saved successfully!"));
        console.log(chalk.gray(`Saved to: ${configManager.path}`));
    });

// Helper to get authenticated client
function getClient(): CanvasClient {
    const token = process.env.CANVAS_API_TOKEN || configManager.get("CANVAS_API_TOKEN");
    const domain = process.env.CANVAS_API_DOMAIN || configManager.get("CANVAS_API_DOMAIN");

    if (!token || !domain) {
        console.error(chalk.red("Error: Missing configuration."));
        console.error(`Please run ${chalk.cyan("canvas-mcp config")} or set env vars.`);
        process.exit(1);
    }
    return new CanvasClient(token, domain);
}

// NOTE: We could keep CLI commands for grading/auditing here calling the client directly,
// but for the sake of the MCP Server refactor, we are focusing on the 'start' command.
// I'll leave the 'start' command as the default.

program
    .command("start", { isDefault: true })
    .description("Start the MCP server (stdio mode)")
    .action(async () => {
        const client = getClient();
        const server = new Server(
            {
                name: "canvas-lms-server",
                version: "1.0.0",
            },
            {
                capabilities: {
                    tools: {},
                    prompts: {},
                    resources: {},
                },
            }
        );

        // --- Aggregation ---
        const allTools: ToolDefinition[] = [
            ...courseTools,
            ...assignmentTools,
            ...gradingTools,
            ...communicationTools
        ];

        // --- Tool Handlers ---
        server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: allTools.map(t => t.tool)
            };
        });

        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const toolDef = allTools.find(t => t.name === request.params.name);
            if (!toolDef) {
                throw new Error(`Tool ${request.params.name} not found`);
            }
            try {
                return await toolDef.handler(client, request.params.arguments);
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error: ${error.message}` }],
                    isError: true
                };
            }
        });

        // --- Resource Handlers ---
        server.setRequestHandler(ListResourcesRequestSchema, async () => {
            return {
                resources: canvasResources.list
            };
        });

        server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const uri = new URL(request.params.uri);
            return await canvasResources.read(uri, client);
        });

        // --- Prompt Handlers ---
        server.setRequestHandler(ListPromptsRequestSchema, async () => {
            return {
                prompts: canvasPrompts.map(p => p.prompt)
            };
        });

        server.setRequestHandler(GetPromptRequestSchema, async (request) => {
            const promptDef = canvasPrompts.find(p => p.name === request.params.name);
            if (!promptDef) {
                throw new Error("Prompt not found");
            }
            return await promptDef.handler(request.params.arguments);
        });

        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Canvas MCP Server running on stdio");
    });

program
    .command("serve-http")
    .description("Start HTTP API (Fastify) for GPT Builder Actions")
    .option("--host <host>", "Host to bind", process.env.HTTP_HOST || "0.0.0.0")
    .option("--port <port>", "Port to bind", process.env.HTTP_PORT || "3000")
    .action(async (options: { host: string; port: string }) => {
        const client = getClient();
        const port = Number.parseInt(options.port, 10);
        await startHttpServer(client, options.host, port);
    });

program.parse(process.argv);
