import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { resolveCourseId } from "../common/helpers.js";
import { z } from "zod";

export const courseTools: ToolDefinition[] = [
    {
        name: "canvas_list_courses",
        tool: {
            name: "canvas_list_courses",
            description: "List active courses for the current user in Canvas",
            inputSchema: { type: "object", properties: {} },
        },
        handler: async (client: CanvasClient, args: any) => {
            const courses = await client.getCourses();
            return {
                content: [{ type: "text", text: JSON.stringify(courses, null, 2) }],
            };
        }
    },
    {
        name: "canvas_list_modules",
        tool: {
            name: "canvas_list_modules",
            description: "List modules and their items for a specific course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                },
                required: ["course_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({ course_id: z.union([z.number(), z.string()]) }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const modules = await client.getModules(courseId);
            return {
                content: [{ type: "text", text: JSON.stringify(modules, null, 2) }],
            };
        }
    },
    {
        name: "canvas_list_pages",
        tool: {
            name: "canvas_list_pages",
            description: "List pages in a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                },
                required: ["course_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({ course_id: z.union([z.number(), z.string()]) }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const pages = await client.getPages(courseId);
            return {
                content: [{ type: "text", text: JSON.stringify(pages, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_page_content",
        tool: {
            name: "canvas_get_page_content",
            description: "Get the content of a specific page",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    page_id: { type: "string", description: "The ID or URL-slug of the page" },
                },
                required: ["course_id", "page_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                page_id: z.union([z.string(), z.number()])
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const pageId = String(input.page_id);
            const page = await client.getPage(courseId, pageId);
            return {
                content: [{ type: "text", text: page.body || page.title + "\n(No content)" }],
            };
        }
    },
    {
        name: "canvas_list_files",
        tool: {
            name: "canvas_list_files",
            description: "List files in a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                },
                required: ["course_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({ course_id: z.union([z.number(), z.string()]) }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const files = await client.getFiles(courseId);
            return {
                content: [{ type: "text", text: JSON.stringify(files, null, 2) }],
            };
        }
    },
    {
        name: "canvas_list_students",
        tool: {
            name: "canvas_list_students",
            description: "List all students enrolled in a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                },
                required: ["course_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({ course_id: z.union([z.number(), z.string()]) }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const students = await client.getEnrollments(courseId);
            return {
                content: [{ type: "text", text: JSON.stringify(students, null, 2) }],
            };
        }
    }
];
