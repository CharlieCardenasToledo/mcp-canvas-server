import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { resolveCourseId } from "../common/helpers.js";
import { z } from "zod";

export const newQuizTools: ToolDefinition[] = [
    {
        name: "canvas_create_new_quiz",
        tool: {
            name: "canvas_create_new_quiz",
            description: "Create a New Quiz (LTI) in a course. Use this for Canvas's modern quiz engine (not Classic Quizzes).",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    title: { type: "string", description: "Quiz title" },
                    instructions: { type: "string", description: "HTML instructions shown to students before starting" },
                    due_at: { type: "string", description: "Due date (ISO 8601)" },
                    lock_at: { type: "string", description: "Lock date (ISO 8601)" },
                    unlock_at: { type: "string", description: "Available from date (ISO 8601)" },
                    points_possible: { type: "number", description: "Total points possible" },
                    time_limit: { type: "number", description: "Time limit in minutes (null for no limit)" },
                    allowed_attempts: { type: "number", description: "Number of attempts allowed (-1 for unlimited)" },
                    shuffle_answers: { type: "boolean", description: "Randomize answer order" },
                    shuffle_questions: { type: "boolean", description: "Randomize question order" },
                    one_question_at_a_time: { type: "boolean", description: "Show one question per page" },
                    cant_go_back: { type: "boolean", description: "Prevent going back to previous questions" },
                    show_correct_answers: { type: "boolean", description: "Show correct answers after submission" }
                },
                required: ["course_id", "title"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                title: z.string(),
                instructions: z.string().optional(),
                due_at: z.string().optional(),
                lock_at: z.string().optional(),
                unlock_at: z.string().optional(),
                points_possible: z.number().optional(),
                time_limit: z.number().optional(),
                allowed_attempts: z.number().optional(),
                shuffle_answers: z.boolean().optional(),
                shuffle_questions: z.boolean().optional(),
                one_question_at_a_time: z.boolean().optional(),
                cant_go_back: z.boolean().optional(),
                show_correct_answers: z.boolean().optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const { course_id: _, ...quizData } = input;
            const result = await client.createNewQuiz(courseId, quizData);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_update_new_quiz",
        tool: {
            name: "canvas_update_new_quiz",
            description: "Update an existing New Quiz (LTI)",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    quiz_id: { type: "string", description: "The New Quiz ID (assignment ID)" },
                    title: { type: "string" },
                    instructions: { type: "string" },
                    due_at: { type: "string", description: "ISO 8601 date or null to clear" },
                    lock_at: { type: "string" },
                    unlock_at: { type: "string" },
                    points_possible: { type: "number" },
                    time_limit: { type: "number", description: "Minutes (null to remove limit)" },
                    allowed_attempts: { type: "number" },
                    shuffle_answers: { type: "boolean" },
                    shuffle_questions: { type: "boolean" },
                    show_correct_answers: { type: "boolean" }
                },
                required: ["course_id", "quiz_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.string(),
                title: z.string().optional(),
                instructions: z.string().optional(),
                due_at: z.string().optional(),
                lock_at: z.string().optional(),
                unlock_at: z.string().optional(),
                points_possible: z.number().optional(),
                time_limit: z.number().nullable().optional(),
                allowed_attempts: z.number().optional(),
                shuffle_answers: z.boolean().optional(),
                shuffle_questions: z.boolean().optional(),
                show_correct_answers: z.boolean().optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const { course_id: _, quiz_id, ...updateData } = input;
            const result = await client.updateNewQuiz(courseId, quiz_id, updateData);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_delete_new_quiz",
        tool: {
            name: "canvas_delete_new_quiz",
            description: "Delete a New Quiz (LTI) from a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    quiz_id: { type: "string", description: "The New Quiz ID to delete" }
                },
                required: ["course_id", "quiz_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.string()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.deleteNewQuiz(courseId, input.quiz_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_list_new_quiz_items",
        tool: {
            name: "canvas_list_new_quiz_items",
            description: "List all questions/items in a New Quiz (LTI)",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    quiz_id: { type: "string", description: "The New Quiz ID" }
                },
                required: ["course_id", "quiz_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.string()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.listNewQuizItems(courseId, input.quiz_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_new_quiz_item",
        tool: {
            name: "canvas_get_new_quiz_item",
            description: "Get details of a specific item/question in a New Quiz (LTI)",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    quiz_id: { type: "string", description: "The New Quiz ID" },
                    item_id: { type: "string", description: "The item ID" }
                },
                required: ["course_id", "quiz_id", "item_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.string(),
                item_id: z.string()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.getNewQuizItem(courseId, input.quiz_id, input.item_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_create_new_quiz_item",
        tool: {
            name: "canvas_create_new_quiz_item",
            description: "Add a question/item to a New Quiz (LTI). Supports multiple choice, true/false, essay, fill-in-blank, matching, and more.",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    quiz_id: { type: "string", description: "The New Quiz ID" },
                    points_possible: { type: "number", description: "Points for this item (default: 1)" },
                    position: { type: "number", description: "Position order in the quiz" },
                    entry_type: {
                        type: "string",
                        description: "Always use 'Item' for a standard question"
                    },
                    title: { type: "string", description: "Question title/name" },
                    item_body: { type: "string", description: "HTML question text shown to students" },
                    interaction_type_slug: {
                        type: "string",
                        description: "Question type: choice (multiple choice), true-false, essay, short-answer, matching, ordering, file-upload, categorization, hot-spot"
                    },
                    interaction_data: {
                        type: "object",
                        description: "Question-type-specific data (choices, correct answers, etc.)"
                    },
                    scoring_data: {
                        type: "object",
                        description: "Scoring configuration for the question"
                    }
                },
                required: ["course_id", "quiz_id", "entry_type", "item_body", "interaction_type_slug"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.string(),
                points_possible: z.number().optional(),
                position: z.number().optional(),
                entry_type: z.string(),
                title: z.string().optional(),
                item_body: z.string(),
                interaction_type_slug: z.string(),
                interaction_data: z.record(z.any()).optional(),
                scoring_data: z.record(z.any()).optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.createNewQuizItem(courseId, input.quiz_id, {
                position: input.position,
                points_possible: input.points_possible,
                entry_type: input.entry_type,
                entry: {
                    title: input.title,
                    item_body: input.item_body,
                    interaction_type_slug: input.interaction_type_slug,
                    interaction_data: input.interaction_data,
                    scoring_data: input.scoring_data
                }
            });
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_update_new_quiz_item",
        tool: {
            name: "canvas_update_new_quiz_item",
            description: "Update an existing question/item in a New Quiz (LTI)",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    quiz_id: { type: "string", description: "The New Quiz ID" },
                    item_id: { type: "string", description: "The item ID to update" },
                    points_possible: { type: "number" },
                    position: { type: "number" },
                    title: { type: "string" },
                    item_body: { type: "string", description: "HTML question text" },
                    interaction_data: { type: "object" },
                    scoring_data: { type: "object" }
                },
                required: ["course_id", "quiz_id", "item_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.string(),
                item_id: z.string(),
                points_possible: z.number().optional(),
                position: z.number().optional(),
                title: z.string().optional(),
                item_body: z.string().optional(),
                interaction_data: z.record(z.any()).optional(),
                scoring_data: z.record(z.any()).optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const updatePayload: any = {};
            if (input.points_possible !== undefined) updatePayload.points_possible = input.points_possible;
            if (input.position !== undefined) updatePayload.position = input.position;
            if (input.title || input.item_body || input.interaction_data || input.scoring_data) {
                updatePayload.entry = {};
                if (input.title) updatePayload.entry.title = input.title;
                if (input.item_body) updatePayload.entry.item_body = input.item_body;
                if (input.interaction_data) updatePayload.entry.interaction_data = input.interaction_data;
                if (input.scoring_data) updatePayload.entry.scoring_data = input.scoring_data;
            }
            const result = await client.updateNewQuizItem(courseId, input.quiz_id, input.item_id, updatePayload);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_delete_new_quiz_item",
        tool: {
            name: "canvas_delete_new_quiz_item",
            description: "Delete a question/item from a New Quiz (LTI)",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    quiz_id: { type: "string", description: "The New Quiz ID" },
                    item_id: { type: "string", description: "The item ID to delete" }
                },
                required: ["course_id", "quiz_id", "item_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.string(),
                item_id: z.string()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.deleteNewQuizItem(courseId, input.quiz_id, input.item_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    }
];
