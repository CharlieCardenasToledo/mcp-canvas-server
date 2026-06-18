import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { resolveCourseId } from "../common/helpers.js";
import { z } from "zod";

export const analyticsTools: ToolDefinition[] = [
    {
        name: "canvas_get_course_analytics",
        tool: {
            name: "canvas_get_course_analytics",
            description: "Get participation and activity analytics for a course (page views, participations per day)",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    }
                },
                required: ["course_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({ course_id: z.union([z.number(), z.string()]) }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.getCourseAnalytics(courseId);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_student_analytics",
        tool: {
            name: "canvas_get_student_analytics",
            description: "Get activity analytics for a specific student in a course (page views, participations, tardiness breakdown)",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    student_id: { type: "number", description: "The Canvas user ID of the student" }
                },
                required: ["course_id", "student_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                student_id: z.coerce.number()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.getStudentAnalytics(courseId, input.student_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_course_activity_stream",
        tool: {
            name: "canvas_get_course_activity_stream",
            description: "Get a summary of recent activity in a course (submissions, discussions, announcements, etc.)",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    }
                },
                required: ["course_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({ course_id: z.union([z.number(), z.string()]) }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.getCourseActivityStream(courseId);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_search_course_content",
        tool: {
            name: "canvas_search_course_content",
            description: "Search for content across a course by keyword (assignments, pages, discussions, quizzes, files)",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    query: { type: "string", description: "Search keyword" },
                    content_types: {
                        type: "array",
                        items: { type: "string" },
                        description: "Limit search to specific types: assignments, pages, discussion_topics, quizzes, files. Defaults to all."
                    }
                },
                required: ["course_id", "query"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                query: z.string().min(1),
                content_types: z.array(z.string()).optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.searchCourseContent(courseId, input.query, input.content_types);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    }
];
