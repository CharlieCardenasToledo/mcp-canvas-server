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
            const input = z.object({
                course_id: z.union([z.number(), z.string()])
            }).parse(args);

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
                quiz_id: z.number()
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
                    due_at: { type: "string", description: "ISO-8601 due date. Use null to clear.", nullable: true },
                    unlock_at: { type: "string", description: "ISO-8601 unlock date. Use null to clear.", nullable: true },
                    lock_at: { type: "string", description: "ISO-8601 lock date. Use null to clear.", nullable: true }
                },
                required: ["course_id", "quiz_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.number(),
                due_at: z.string().nullable().optional(),
                unlock_at: z.string().nullable().optional(),
                lock_at: z.string().nullable().optional()
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            const quiz = await client.updateQuiz(courseId, input.quiz_id, {
                due_at: input.due_at,
                unlock_at: input.unlock_at,
                lock_at: input.lock_at
            });

            return {
                content: [{ type: "text", text: JSON.stringify(quiz, null, 2) }]
            };
        }
    },
    {
        name: "canvas_create_quiz",
        tool: {
            name: "canvas_create_quiz",
            description: "Create a new quiz for a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { anyOf: [{ type: "number" }, { type: "string" }] },
                    title: { type: "string" },
                    description: { type: "string" },
                    quiz_type: { type: "string", enum: ["practice_quiz", "assignment", "graded_survey", "survey"] },
                    time_limit: { type: "number" },
                    shuffle_answers: { type: "boolean" },
                    published: { type: "boolean" },
                    assignment_group_id: { type: "number" },
                    allowed_attempts: { type: "number" },
                    require_lockdown_browser: { type: "boolean" },
                    show_correct_answers: { type: "boolean" },
                    show_correct_answers_at: { type: "string", description: "ISO-8601 date to show correct answers" }
                },
                required: ["course_id", "title"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                title: z.string(),
                description: z.string().optional(),
                quiz_type: z.enum(["practice_quiz", "assignment", "graded_survey", "survey"]).optional(),
                time_limit: z.number().optional(),
                shuffle_answers: z.boolean().optional(),
                published: z.boolean().optional(),
                assignment_group_id: z.number().optional(),
                allowed_attempts: z.number().optional(),
                require_lockdown_browser: z.boolean().optional(),
                show_correct_answers: z.boolean().optional(),
                show_correct_answers_at: z.string().optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const quizData = { ...input };
            delete (quizData as any).course_id;
            const quiz = await client.createQuiz(courseId, quizData);
            return { content: [{ type: "text", text: JSON.stringify(quiz, null, 2) }] };
        }
    },
    {
        name: "canvas_update_quiz",
        tool: {
            name: "canvas_update_quiz",
            description: "Update an existing quiz",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { anyOf: [{ type: "number" }, { type: "string" }] },
                    quiz_id: { type: "number" },
                    title: { type: "string" },
                    description: { type: "string" },
                    published: { type: "boolean" },
                    require_lockdown_browser: { type: "boolean" },
                    show_correct_answers: { type: "boolean" },
                    show_correct_answers_at: { type: "string", description: "ISO-8601 date to show correct answers" }
                },
                required: ["course_id", "quiz_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.number(),
                title: z.string().optional(),
                description: z.string().optional(),
                published: z.boolean().optional(),
                require_lockdown_browser: z.boolean().optional(),
                show_correct_answers: z.boolean().optional(),
                show_correct_answers_at: z.string().optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const quizData = { ...input };
            delete (quizData as any).course_id;
            delete (quizData as any).quiz_id;
            const quiz = await client.updateQuiz(courseId, input.quiz_id, quizData);
            return { content: [{ type: "text", text: JSON.stringify(quiz, null, 2) }] };
        }
    }
];