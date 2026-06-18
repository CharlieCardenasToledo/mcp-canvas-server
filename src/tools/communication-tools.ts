import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { z } from "zod";

export const communicationTools: ToolDefinition[] = [
    {
        name: "canvas_list_announcements",
        tool: {
            name: "canvas_list_announcements",
            description: "List announcements for one or more courses",
            inputSchema: {
                type: "object",
                properties: {
                    course_ids: {
                        type: "array",
                        items: { type: "number" },
                        description: "List of course IDs"
                    },
                },
                required: ["course_ids"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_ids: z.array(z.number())
            }).parse(args);
            const announcements = await client.getAnnouncements(input.course_ids);
            return {
                content: [{ type: "text", text: JSON.stringify(announcements, null, 2) }],
            };
        }
    },
    {
        name: "canvas_list_discussions",
        tool: {
            name: "canvas_list_discussions",
            description: "List discussion topics in a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { type: "number", description: "The ID of the course" },
                },
                required: ["course_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({ course_id: z.coerce.number() }).parse(args);
            const discussions = await client.getDiscussionTopics(input.course_id);
            return {
                content: [{ type: "text", text: JSON.stringify(discussions, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_discussion_entries",
        tool: {
            name: "canvas_get_discussion_entries",
            description: "Read replies/entries in a discussion topic",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { type: "number", description: "The ID of the course" },
                    topic_id: { type: "number", description: "The ID of the discussion topic" },
                },
                required: ["course_id", "topic_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.coerce.number(),
                topic_id: z.coerce.number()
            }).parse(args);
            const entries = await client.getDiscussionEntries(input.course_id, input.topic_id);
            return {
                content: [{ type: "text", text: JSON.stringify(entries, null, 2) }],
            };
        }
    },
    {
        name: "canvas_post_announcement",
        tool: {
            name: "canvas_post_announcement",
            description: "Post a new announcement to a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { type: "number", description: "The ID of the course" },
                    title: { type: "string", description: "The title of the announcement" },
                    message: { type: "string", description: "The content/message of the announcement" },
                },
                required: ["course_id", "title", "message"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.coerce.number(),
                title: z.string(),
                message: z.string()
            }).parse(args);
            const result = await client.postAnnouncement(input.course_id, input.title, input.message);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_update_announcement",
        tool: {
            name: "canvas_update_announcement",
            description: "Update the title or message of an existing announcement in a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { type: "number", description: "The ID of the course" },
                    topic_id: { type: "number", description: "The ID of the announcement (discussion topic)" },
                    title: { type: "string", description: "New title for the announcement (optional)" },
                    message: { type: "string", description: "New HTML message body for the announcement (optional)" },
                },
                required: ["course_id", "topic_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.coerce.number(),
                topic_id: z.coerce.number(),
                title: z.string().optional(),
                message: z.string().optional(),
            }).parse(args);
            const fields: { title?: string; message?: string } = {};
            if (input.title)   fields.title   = input.title;
            if (input.message) fields.message = input.message;
            const result = await client.updateAnnouncement(input.course_id, input.topic_id, fields);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_create_discussion",
        tool: {
            name: "canvas_create_discussion",
            description: "Create a new discussion topic in a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { type: "number", description: "The ID of the course" },
                    title: { type: "string", description: "Title of the discussion" },
                    message: { type: "string", description: "Body/message of the discussion" },
                    discussion_type: {
                        type: "string",
                        enum: ["side_comment", "threaded"],
                        description: "Discussion type (default: side_comment)"
                    },
                    published: { type: "boolean", description: "Whether to publish immediately (default: true)" },
                    pinned: { type: "boolean", description: "Pin to top of discussion list" },
                    require_initial_post: { type: "boolean", description: "Students must post before seeing replies" },
                    allow_rating: { type: "boolean", description: "Allow students to rate posts" }
                },
                required: ["course_id", "title", "message"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.coerce.number(),
                title: z.string(),
                message: z.string(),
                discussion_type: z.enum(["side_comment", "threaded"]).optional(),
                published: z.boolean().optional(),
                pinned: z.boolean().optional(),
                require_initial_post: z.boolean().optional(),
                allow_rating: z.boolean().optional()
            }).parse(args);
            const { course_id, ...data } = input;
            const result = await client.createDiscussion(course_id, data);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_delete_discussion",
        tool: {
            name: "canvas_delete_discussion",
            description: "Delete a discussion topic from a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { type: "number", description: "The ID of the course" },
                    topic_id: { type: "number", description: "The ID of the discussion topic to delete" }
                },
                required: ["course_id", "topic_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.coerce.number(),
                topic_id: z.coerce.number()
            }).parse(args);
            const result = await client.deleteDiscussion(input.course_id, input.topic_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_post_discussion_reply",
        tool: {
            name: "canvas_post_discussion_reply",
            description: "Post a reply to a discussion topic",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { type: "number", description: "The ID of the course" },
                    topic_id: { type: "number", description: "The ID of the discussion topic" },
                    message: { type: "string", description: "The reply message" },
                },
                required: ["course_id", "topic_id", "message"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.coerce.number(),
                topic_id: z.coerce.number(),
                message: z.string()
            }).parse(args);
            const result = await client.postDiscussionReply(input.course_id, input.topic_id, input.message);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    }
];
