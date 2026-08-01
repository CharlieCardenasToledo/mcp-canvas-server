import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { z } from "zod";

const userIdSchema = z.union([z.number(), z.string()]).optional();

function redactTokenValue(result: Record<string, any>): Record<string, any> {
    const { token, ...rest } = result;
    if (token && typeof token === "string") {
        return { ...rest, token_value: "[redacted]" };
    }
    return rest;
}

export const accessTokenTools: ToolDefinition[] = [
    {
        name: "canvas_list_access_tokens",
        tool: {
            name: "canvas_list_access_tokens",
            description:
                "List manually-generated Canvas API access tokens for a user (defaults to the authenticated user)",
            inputSchema: {
                type: "object",
                properties: {
                    user_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "User ID, or 'self' for the authenticated user (default)"
                    }
                }
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({ user_id: userIdSchema }).parse(args ?? {});
            const result = await client.listAccessTokens(input.user_id ?? "self");
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
    },
    {
        name: "canvas_get_access_token",
        tool: {
            name: "canvas_get_access_token",
            description: "Get details of a specific Canvas access token by its database ID or token_hint",
            inputSchema: {
                type: "object",
                properties: {
                    user_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "User ID, or 'self' for the authenticated user (default)"
                    },
                    token_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The token's database ID or its token_hint"
                    }
                },
                required: ["token_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z
                .object({
                    user_id: userIdSchema,
                    token_id: z.union([z.number(), z.string()])
                })
                .parse(args);
            const result = await client.getAccessToken(input.user_id ?? "self", input.token_id);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
    },
    {
        name: "canvas_create_access_token",
        tool: {
            name: "canvas_create_access_token",
            description:
                "Create a new Canvas API access token. The full token value is returned only in this response — save it, it cannot be retrieved again later.",
            inputSchema: {
                type: "object",
                properties: {
                    user_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "User ID, or 'self' for the authenticated user (default)"
                    },
                    purpose: { type: "string", description: "Description of what the token is for" },
                    expires_at: {
                        type: "string",
                        description: "ISO 8601 datetime when the token should expire (omit for no expiration)"
                    },
                    scopes: {
                        type: "array",
                        items: { type: "string" },
                        description:
                            "API scopes to restrict the token to (ignored unless the account has scoped tokens enabled)"
                    }
                },
                required: ["purpose"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z
                .object({
                    user_id: userIdSchema,
                    purpose: z.string(),
                    expires_at: z.string().optional(),
                    scopes: z.array(z.string()).optional()
                })
                .parse(args);
            const { user_id, ...data } = input;
            const result = await client.createAccessToken(user_id ?? "self", data);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(redactTokenValue(result), null, 2)
                    }
                ]
            };
        }
    },
    {
        name: "canvas_update_access_token",
        tool: {
            name: "canvas_update_access_token",
            description: "Update a Canvas access token's purpose, expiration, or scopes",
            inputSchema: {
                type: "object",
                properties: {
                    user_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "User ID, or 'self' for the authenticated user (default)"
                    },
                    token_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The token's database ID or its token_hint"
                    },
                    purpose: { type: "string", description: "New description of what the token is for" },
                    expires_at: {
                        type: "string",
                        description: "New ISO 8601 expiration datetime, or null to remove expiration"
                    },
                    scopes: { type: "array", items: { type: "string" }, description: "New API scopes for the token" }
                },
                required: ["token_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z
                .object({
                    user_id: userIdSchema,
                    token_id: z.union([z.number(), z.string()]),
                    purpose: z.string().optional(),
                    expires_at: z.string().nullable().optional(),
                    scopes: z.array(z.string()).optional()
                })
                .parse(args);
            const { user_id, token_id, ...data } = input;
            const result = await client.updateAccessToken(user_id ?? "self", token_id, data);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
    },
    {
        name: "canvas_regenerate_access_token",
        tool: {
            name: "canvas_regenerate_access_token",
            description:
                "Regenerate a Canvas access token, issuing a new token value while keeping its purpose/scopes. If the regenerated token is the one currently authenticating this MCP server, it is automatically applied and persisted so the server keeps working without reconfiguration.",
            inputSchema: {
                type: "object",
                properties: {
                    user_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "User ID, or 'self' for the authenticated user (default)"
                    },
                    token_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The token's database ID or its token_hint"
                    },
                    confirm: {
                        type: "boolean",
                        description: "Must be true to confirm the token regeneration"
                    }
                },
                required: ["token_id", "confirm"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z
                .object({
                    user_id: userIdSchema,
                    token_id: z.union([z.number(), z.string()]),
                    confirm: z.boolean()
                })
                .parse(args);
            if (input.confirm !== true) {
                throw new Error("Token regeneration requires confirm: true.");
            }
            const result = await client.regenerateAccessToken(input.user_id ?? "self", input.token_id);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(redactTokenValue(result), null, 2)
                    }
                ]
            };
        }
    },
    {
        name: "canvas_delete_access_token",
        tool: {
            name: "canvas_delete_access_token",
            description: "Permanently delete a Canvas access token",
            inputSchema: {
                type: "object",
                properties: {
                    user_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "User ID, or 'self' for the authenticated user (default)"
                    },
                    token_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The token's database ID or its token_hint"
                    },
                    confirm: {
                        type: "boolean",
                        description: "Must be true to confirm the token deletion"
                    }
                },
                required: ["token_id", "confirm"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z
                .object({
                    user_id: userIdSchema,
                    token_id: z.union([z.number(), z.string()]),
                    confirm: z.boolean()
                })
                .parse(args);
            if (input.confirm !== true) {
                throw new Error("Token deletion requires confirm: true.");
            }
            const result = await client.deleteAccessToken(input.user_id ?? "self", input.token_id);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
    }
];
