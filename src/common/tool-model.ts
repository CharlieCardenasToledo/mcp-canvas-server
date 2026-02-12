import { Tool, Resource, Prompt, GetPromptResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { CanvasClient } from "../services/canvas-client.js";

export interface ToolDefinition {
    name: string;
    tool: Tool;
    handler: (client: CanvasClient, args: any) => Promise<any>;
}

export interface ResourceHandler {
    uriPattern: string | RegExp;
    handler: (uri: URL, client: CanvasClient) => Promise<ReadResourceResult>;
}

// Simple export for the static list vs dynamic handler separation
export interface ResourceManager {
    list: Resource[];
    read: (uri: URL, client: CanvasClient) => Promise<ReadResourceResult>;
}

export interface PromptDefinition {
    name: string;
    prompt: Prompt;
    handler: (args: Record<string, string> | undefined) => Promise<GetPromptResult>;
}
