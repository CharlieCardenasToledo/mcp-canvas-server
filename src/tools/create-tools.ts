
import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { resolveCourseId } from "../common/helpers.js";
import { z } from "zod";

export const createTools: ToolDefinition[] = [
    {
        name: "canvas_create_page",
        tool: {
            name: "canvas_create_page",
            description: "Create a new page in a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    title: { type: "string", description: "The title of the page" },
                    body: { type: "string", description: "The HTML body of the page" },
                    published: { type: "boolean", description: "Whether the page updates are published" }
                },
                required: ["course_id", "title", "body"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                title: z.string(),
                body: z.string(),
                published: z.boolean().optional().default(false)
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const page = await client.createPage(courseId, input.title, input.body, input.published);
            return {
                content: [{ type: "text", text: JSON.stringify(page, null, 2) }],
            };
        }
    },
    {
        name: "canvas_update_page",
        tool: {
            name: "canvas_update_page",
            description: "Update an existing page in a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    page_url_or_id: { type: "string", description: "The URL or ID of the page to update" },
                    title: { type: "string", description: "The new title of the page" },
                    body: { type: "string", description: "The new HTML body of the page" },
                    published: { type: "boolean", description: "Whether the page is published" }
                },
                required: ["course_id", "page_url_or_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                page_url_or_id: z.union([z.string(), z.number()]),
                title: z.string().optional(),
                body: z.string().optional(),
                published: z.boolean().optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const page = await client.updatePage(courseId, input.page_url_or_id, {
                title: input.title,
                body: input.body,
                published: input.published
            });
            return {
                content: [{ type: "text", text: JSON.stringify(page, null, 2) }],
            };
        }
    }
];
