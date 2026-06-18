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
        name: "canvas_create_course",
        tool: {
            name: "canvas_create_course",
            description: "Create a new course in a Canvas account",
            inputSchema: {
                type: "object",
                properties: {
                    account_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "Account ID where the course will be created (use 'self' or your institution's account ID)"
                    },
                    name: { type: "string", description: "Course name" },
                    course_code: { type: "string", description: "Short course code (e.g. MAT101)" },
                    start_at: { type: "string", description: "Start date (ISO 8601)" },
                    end_at: { type: "string", description: "End date (ISO 8601)" },
                    syllabus_body: { type: "string", description: "HTML content for the syllabus" },
                    time_zone: { type: "string", description: "Time zone (e.g. America/Guayaquil)" },
                    locale: { type: "string", description: "Locale (e.g. es, en)" }
                },
                required: ["account_id", "name"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                account_id: z.union([z.number(), z.string()]),
                name: z.string(),
                course_code: z.string().optional(),
                start_at: z.string().optional(),
                end_at: z.string().optional(),
                syllabus_body: z.string().optional(),
                time_zone: z.string().optional(),
                locale: z.string().optional()
            }).parse(args);
            const { account_id, ...courseData } = input;
            const result = await client.createCourse(account_id, courseData);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_update_course",
        tool: {
            name: "canvas_update_course",
            description: "Update an existing course's settings",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    name: { type: "string", description: "New course name" },
                    course_code: { type: "string", description: "New course code" },
                    start_at: { type: "string", description: "Start date (ISO 8601)" },
                    end_at: { type: "string", description: "End date (ISO 8601)" },
                    syllabus_body: { type: "string", description: "HTML content for the syllabus" },
                    time_zone: { type: "string", description: "Time zone" },
                    locale: { type: "string", description: "Locale (e.g. es, en)" },
                    default_view: {
                        type: "string",
                        description: "Default course home view: feed, wiki, modules, assignments, syllabus"
                    }
                },
                required: ["course_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                name: z.string().optional(),
                course_code: z.string().optional(),
                start_at: z.string().optional(),
                end_at: z.string().optional(),
                syllabus_body: z.string().optional(),
                time_zone: z.string().optional(),
                locale: z.string().optional(),
                default_view: z.string().optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const { course_id: _, ...updateData } = input;
            const result = await client.updateCourse(courseId, updateData);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_syllabus",
        tool: {
            name: "canvas_get_syllabus",
            description: "Get the syllabus content of a course",
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
            const result = await client.getSyllabus(courseId);
            return {
                content: [{ type: "text", text: result.syllabus_body || "(No syllabus content)" }],
            };
        }
    },
    {
        name: "canvas_delete_page",
        tool: {
            name: "canvas_delete_page",
            description: "Delete a page from a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    page_id: { type: "string", description: "The ID or URL-slug of the page to delete" }
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
            const result = await client.deletePage(courseId, String(input.page_id));
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
