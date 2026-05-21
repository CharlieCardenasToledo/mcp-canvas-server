import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { resolveCourseId } from "../common/helpers.js";
import { z } from "zod";

export const quizQuestionTools: ToolDefinition[] = [
    {
        name: "canvas_list_quiz_questions",
        tool: {
            name: "canvas_list_quiz_questions",
            description: "List all questions in a quiz",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    quiz_id: {
                        type: "number",
                        description: "The quiz ID"
                    }
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
            const questions = await client.listQuizQuestions(courseId, input.quiz_id);
            return {
                content: [{ type: "text", text: JSON.stringify(questions, null, 2) }]
            };
        }
    },
    {
        name: "canvas_create_quiz_question",
        tool: {
            name: "canvas_create_quiz_question",
            description: "Create a question in a quiz. Supports types: multiple_choice_question, true_false_question, essay_question, short_answer_question, fill_in_multiple_blanks_question, multiple_answers_question, matching_question, numerical_question. Use quiz_group_id to assign the question to a group for random selection.",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    quiz_id: {
                        type: "number",
                        description: "The quiz ID"
                    },
                    question_name: {
                        type: "string",
                        description: "Short name/title for the question"
                    },
                    question_type: {
                        type: "string",
                        description: "Question type (e.g. multiple_choice_question, true_false_question, essay_question)"
                    },
                    question_text: {
                        type: "string",
                        description: "The question text (HTML supported)"
                    },
                    points_possible: {
                        type: "number",
                        description: "Point value for the question"
                    },
                    quiz_group_id: {
                        type: "number",
                        description: "Optional quiz group ID to assign this question to (for random picking)"
                    },
                    answers: {
                        type: "array",
                        description: "Array of answer objects. For multiple_choice: weight=100 for correct, weight=0 for incorrect.",
                        items: {
                            type: "object",
                            properties: {
                                text: { type: "string", description: "Answer text" },
                                weight: { type: "number", description: "100 for correct, 0 for incorrect" },
                                comments: { type: "string", description: "Optional feedback comment" }
                            },
                            required: ["text", "weight"]
                        }
                    }
                },
                required: ["course_id", "quiz_id", "question_name", "question_type", "question_text", "points_possible"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const answerSchema = z.object({
                text: z.string(),
                        blank_id: z.string().optional(),
                weight: z.number(),
                comments: z.string().optional()
            });

            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.coerce.number(),
                question_name: z.string().min(1),
                question_type: z.string().min(1),
                question_text: z.string().min(1),
                points_possible: z.coerce.number(),
                quiz_group_id: z.coerce.number().optional(),
                answers: z.array(answerSchema).optional()
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            const question = await client.createQuizQuestion(courseId, input.quiz_id, {
                question_name: input.question_name,
                question_type: input.question_type,
                question_text: input.question_text,
                points_possible: input.points_possible,
                quiz_group_id: input.quiz_group_id,
                answers: input.answers
            });
            return {
                content: [{ type: "text", text: JSON.stringify(question, null, 2) }]
            };
        }
    },
    {
        name: "canvas_update_quiz_question",
        tool: {
            name: "canvas_update_quiz_question",
            description: "Update an existing question in a quiz",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    quiz_id: {
                        type: "number",
                        description: "The quiz ID"
                    },
                    question_id: {
                        type: "number",
                        description: "The question ID to update"
                    },
                    question_name: {
                        type: "string",
                        description: "New name/title for the question"
                    },
                    question_type: {
                        type: "string",
                        description: "New question type"
                    },
                    question_text: {
                        type: "string",
                        description: "New question text (HTML supported)"
                    },
                    points_possible: {
                        type: "number",
                        description: "New point value"
                    },
                    quiz_group_id: {
                        anyOf: [{ type: "number" }, { type: "null" }],
                        description: "Quiz group ID to assign to, or null to remove from group"
                    },
                    answers: {
                        type: "array",
                        description: "New answers array (replaces existing answers)",
                        items: {
                            type: "object",
                            properties: {
                                text: { type: "string" },
                                weight: { type: "number" },
                                comments: { type: "string" }
                            },
                            required: ["text", "weight"]
                        }
                    }
                },
                required: ["course_id", "quiz_id", "question_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const answerSchema = z.object({
                text: z.string(),
                        blank_id: z.string().optional(),
                weight: z.number(),
                comments: z.string().optional()
            });

            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.coerce.number(),
                question_id: z.coerce.number(),
                question_name: z.string().min(1).optional(),
                question_type: z.string().min(1).optional(),
                question_text: z.string().min(1).optional(),
                points_possible: z.coerce.number().optional(),
                quiz_group_id: z.coerce.number().nullable().optional(),
                answers: z.array(answerSchema).optional()
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            const data: any = {};
            if (input.question_name !== undefined) data.question_name = input.question_name;
            if (input.question_type !== undefined) data.question_type = input.question_type;
            if (input.question_text !== undefined) data.question_text = input.question_text;
            if (input.points_possible !== undefined) data.points_possible = input.points_possible;
            if (input.quiz_group_id !== undefined) data.quiz_group_id = input.quiz_group_id;
            if (input.answers !== undefined) data.answers = input.answers;

            const question = await client.updateQuizQuestion(courseId, input.quiz_id, input.question_id, data);
            return {
                content: [{ type: "text", text: JSON.stringify(question, null, 2) }]
            };
        }
    },
    {
        name: "canvas_delete_quiz_question",
        tool: {
            name: "canvas_delete_quiz_question",
            description: "Delete a question from a quiz",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    quiz_id: {
                        type: "number",
                        description: "The quiz ID"
                    },
                    question_id: {
                        type: "number",
                        description: "The question ID to delete"
                    }
                },
                required: ["course_id", "quiz_id", "question_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.coerce.number(),
                question_id: z.coerce.number()
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.deleteQuizQuestion(courseId, input.quiz_id, input.question_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }
    },
    {
        name: "canvas_create_quiz_group",
        tool: {
            name: "canvas_create_quiz_group",
            description: "Create a quiz group in a quiz. Questions assigned to the group via quiz_group_id will be randomly picked (pick_count) when students take the quiz.",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    quiz_id: {
                        type: "number",
                        description: "The quiz ID"
                    },
                    name: {
                        type: "string",
                        description: "Name for the quiz group"
                    },
                    pick_count: {
                        type: "number",
                        description: "Number of questions to randomly pick from this group"
                    },
                    question_points: {
                        type: "number",
                        description: "Points per question in this group"
                    }
                },
                required: ["course_id", "quiz_id", "name", "pick_count", "question_points"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.coerce.number(),
                name: z.string().min(1),
                pick_count: z.coerce.number().min(1),
                question_points: z.coerce.number().min(0)
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            const group = await client.createQuizGroup(courseId, input.quiz_id, {
                name: input.name,
                pick_count: input.pick_count,
                question_points: input.question_points
            });
            return {
                content: [{ type: "text", text: JSON.stringify(group, null, 2) }]
            };
        }
    }
];
