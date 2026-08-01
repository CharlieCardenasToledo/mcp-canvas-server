import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
    CallToolRequestSchema,
    GetPromptRequestSchema,
    ListPromptsRequestSchema,
    ListResourcesRequestSchema,
    ListResourceTemplatesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "./common/tool-model.js";
import { getConfiguredTools } from "./common/tool-registry.js";
import { canvasPrompts } from "./prompts/canvas-prompts.js";
import { canvasResources } from "./resources/canvas-resources.js";
import type { CanvasClient } from "./services/canvas-client.js";
import { packageMetadata } from "./version.js";

function safeErrorMessage(error: unknown): string {
    if (!(error instanceof Error)) return "Unexpected tool error";
    return error.message.replace(/Bearer\s+\S+/gi, "Bearer [redacted]").slice(0, 1000);
}

export function createMcpServer(client: CanvasClient, tools: ToolDefinition[] = getConfiguredTools()): Server {
    const server = new Server(
        {
            name: "canvas-lms-server",
            version: packageMetadata.version
        },
        {
            capabilities: {
                tools: {},
                prompts: {},
                resources: {}
            }
        }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: tools.map((definition) => definition.tool)
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const definition = tools.find((tool) => tool.name === request.params.name);
        if (!definition) {
            return {
                content: [{ type: "text", text: `Tool ${request.params.name} is not enabled.` }],
                isError: true
            };
        }

        try {
            return await definition.handler(client, request.params.arguments ?? {});
        } catch (error: unknown) {
            return {
                content: [{ type: "text", text: `Error: ${safeErrorMessage(error)}` }],
                isError: true
            };
        }
    });

    server.setRequestHandler(ListResourcesRequestSchema, async () => ({
        resources: canvasResources.list
    }));

    server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
        resourceTemplates: canvasResources.templates
    }));

    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        return canvasResources.read(new URL(request.params.uri), client);
    });

    server.setRequestHandler(ListPromptsRequestSchema, async () => ({
        prompts: canvasPrompts.map((definition) => definition.prompt)
    }));

    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
        const definition = canvasPrompts.find((prompt) => prompt.name === request.params.name);
        if (!definition) throw new Error(`Prompt ${request.params.name} not found.`);
        return definition.handler(request.params.arguments);
    });

    server.onerror = (error) => {
        console.error(`[canvas-mcp] ${safeErrorMessage(error)}`);
    };

    return server;
}
