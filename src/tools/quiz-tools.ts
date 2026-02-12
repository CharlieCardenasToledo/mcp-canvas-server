import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { resolveCourseId } from "../common/helpers.js";
import { z } from "zod";

export const quizTools: ToolDefinition[] = [
    {
        name: "canvas_list_quizzes",
        tool: {
            name: "canvas_list_quizzes",
            description: "List quizzes for a specific course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    }
                },
                required: ["course_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({ course_id: z.union([z.number(), z.string()]) }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const quizzes = await client.getQuizzes(courseId);
            return {
                content: [{ type: "text", text: JSON.stringify(quizzes, null, 2) }]
            };
        }
    },
    {
        name: "canvas_get_quiz",
        tool: {
            name: "canvas_get_quiz",
            description: "Get details for a specific quiz",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    quiz_id: { type: "number", description: "The quiz ID" }
                },
                required: ["course_id", "quiz_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.coerce.number()
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            const quiz = await client.getQuiz(courseId, input.quiz_id);
            return {
                content: [{ type: "text", text: JSON.stringify(quiz, null, 2) }]
            };
        }
    },
    {
        name: "canvas_update_quiz_dates",
        tool: {
            name: "canvas_update_quiz_dates",
            description: "Update due/unlock/lock dates for a specific quiz",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    quiz_id: { type: "number", description: "The quiz ID" },
                    due_at: {
                        anyOf: [{ type: "string" }, { type: "null" }],
                        description: "ISO-8601 due date. Use null to clear."
                    },
                    unlock_at: {
                        anyOf: [{ type: "string" }, { type: "null" }],
                        description: "ISO-8601 unlock date. Use null to clear."
                    },
                    lock_at: {
                        anyOf: [{ type: "string" }, { type: "null" }],
                        description: "ISO-8601 lock date. Use null to clear."
                    }
                },
                required: ["course_id", "quiz_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.coerce.number(),
                due_at: z.string().nullable().optional(),
                unlock_at: z.string().nullable().optional(),
                lock_at: z.string().nullable().optional()
            }).parse(args);

            if (input.due_at === undefined && input.unlock_at === undefined && input.lock_at === undefined) {
                throw new Error("At least one date field is required: due_at, unlock_at, or lock_at.");
            }

            const courseId = await resolveCourseId(client, input.course_id);
            const quiz = await client.updateQuizDates(courseId, input.quiz_id, {
                due_at: input.due_at,
                unlock_at: input.unlock_at,
                lock_at: input.lock_at
            });

            return {
                content: [{ type: "text", text: JSON.stringify(quiz, null, 2) }]
            };
        }
    }
];
