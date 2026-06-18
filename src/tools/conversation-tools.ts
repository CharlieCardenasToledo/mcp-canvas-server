import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { z } from "zod";

export const conversationTools: ToolDefinition[] = [
    {
        name: "canvas_list_conversations",
        tool: {
            name: "canvas_list_conversations",
            description: "List conversations (inbox messages) for the current user",
            inputSchema: {
                type: "object",
                properties: {
                    scope: {
                        type: "string",
                        enum: ["inbox", "unread", "archived", "sent"],
                        description: "Which mailbox to list (default: inbox)"
                    }
                },
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                scope: z.enum(["inbox", "unread", "archived", "sent"]).optional()
            }).parse(args);
            const result = await client.listConversations(input.scope);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_conversation",
        tool: {
            name: "canvas_get_conversation",
            description: "Get a full conversation thread including all messages",
            inputSchema: {
                type: "object",
                properties: {
                    conversation_id: { type: "number", description: "The ID of the conversation" }
                },
                required: ["conversation_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({ conversation_id: z.coerce.number() }).parse(args);
            const result = await client.getConversation(input.conversation_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_conversation_unread_count",
        tool: {
            name: "canvas_get_conversation_unread_count",
            description: "Get the number of unread messages in the inbox",
            inputSchema: { type: "object", properties: {} },
        },
        handler: async (client: CanvasClient, _args: any) => {
            const result = await client.getConversationUnreadCount();
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_send_conversation",
        tool: {
            name: "canvas_send_conversation",
            description: "Send a new message to one or more users (private message or course announcement)",
            inputSchema: {
                type: "object",
                properties: {
                    recipients: {
                        type: "array",
                        items: { anyOf: [{ type: "number" }, { type: "string" }] },
                        description: "Array of user IDs or login IDs to send the message to"
                    },
                    subject: { type: "string", description: "Message subject" },
                    body: { type: "string", description: "Message body" },
                    course_id: {
                        type: "number",
                        description: "Associate message with a course context (optional but recommended)"
                    },
                    group_conversation: {
                        type: "boolean",
                        description: "If true, all recipients share one thread. If false, each gets an individual message (default: false)"
                    }
                },
                required: ["recipients", "subject", "body"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                recipients: z.array(z.union([z.coerce.number(), z.string()])),
                subject: z.string(),
                body: z.string(),
                course_id: z.coerce.number().optional(),
                group_conversation: z.boolean().optional()
            }).parse(args);
            const result = await client.sendConversation(input);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_reply_to_conversation",
        tool: {
            name: "canvas_reply_to_conversation",
            description: "Reply to an existing conversation thread",
            inputSchema: {
                type: "object",
                properties: {
                    conversation_id: { type: "number", description: "The ID of the conversation to reply to" },
                    body: { type: "string", description: "The reply message text" }
                },
                required: ["conversation_id", "body"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                conversation_id: z.coerce.number(),
                body: z.string()
            }).parse(args);
            const result = await client.replyToConversation(input.conversation_id, input.body);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    }
];
