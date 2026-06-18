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
        name: "canvas_list_quiz_questions",
        tool: {
            name: "canvas_list_quiz_questions",
            description: "List all questions in a specific quiz",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { anyOf: [{ type: "number" }, { type: "string" }], description: "The ID or name of the course" },
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
            const questions = await client.listQuizQuestions(courseId, input.quiz_id);
            return { content: [{ type: "text", text: JSON.stringify(questions, null, 2) }] };
        }
    },
    {
        name: "canvas_get_quiz_question",
        tool: {
            name: "canvas_get_quiz_question",
            description: "Get details of a single quiz question",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { anyOf: [{ type: "number" }, { type: "string" }], description: "The ID or name of the course" },
                    quiz_id: { type: "number", description: "The quiz ID" },
                    question_id: { type: "number", description: "The question ID" }
                },
                required: ["course_id", "quiz_id", "question_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.number(),
                question_id: z.number()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const question = await client.getQuizQuestion(courseId, input.quiz_id, input.question_id);
            return { content: [{ type: "text", text: JSON.stringify(question, null, 2) }] };
        }
    },
    {
        name: "canvas_create_quiz_question",
        tool: {
            name: "canvas_create_quiz_question",
            description: `Create a new question in a quiz. Supports all 12 Canvas question types:
- multiple_choice_question: answers with answer_text + answer_weight (100=correct, 0=wrong)
- true_false_question: two answers ("True"/"False") with answer_weight
- short_answer_question: one or more correct answer_text values, all with answer_weight 100
- fill_in_multiple_blanks_question: answers with blank_id + answer_text + answer_weight 100
- multiple_answers_question: checkboxes; correct answers get answer_weight 100, wrong get 0
- multiple_dropdowns_question: answers with blank_id + answer_text + answer_weight
- matching_question: answers with answer_match_left + answer_match_right; add distractors via matching_answer_incorrect_matches on any one answer
- numerical_question: answers with numerical_answer_type (exact_answer: exact+margin; range_answer: start+end; precision_answer: approximate+precision)
- calculated_question: answers with variables and formulas (advanced)
- essay_question: no answers needed
- file_upload_question: no answers needed
- text_only_question: no answers needed, just displays text`,
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { anyOf: [{ type: "number" }, { type: "string" }], description: "The ID or name of the course" },
                    quiz_id: { type: "number", description: "The quiz ID" },
                    question_name: { type: "string", description: "Short label for the question (e.g. 'Question 1')" },
                    question_type: {
                        type: "string",
                        enum: [
                            "multiple_choice_question",
                            "true_false_question",
                            "short_answer_question",
                            "fill_in_multiple_blanks_question",
                            "multiple_answers_question",
                            "multiple_dropdowns_question",
                            "matching_question",
                            "numerical_question",
                            "calculated_question",
                            "essay_question",
                            "file_upload_question",
                            "text_only_question"
                        ],
                        description: "The type of question"
                    },
                    question_text: { type: "string", description: "HTML or plain text of the question. For fill_in_multiple_blanks/multiple_dropdowns use [blank_id] placeholders." },
                    points_possible: { type: "number", description: "Points this question is worth" },
                    position: { type: "number", description: "Display order position within the quiz" },
                    quiz_group_id: { type: "number", description: "Assign to a quiz group/bank (optional)" },
                    correct_comments: { type: "string", description: "Feedback shown when answer is correct" },
                    incorrect_comments: { type: "string", description: "Feedback shown when answer is incorrect" },
                    neutral_comments: { type: "string", description: "Feedback always shown after answering" },
                    text_after_answers: { type: "string", description: "Text displayed after the answers (used in missing word questions)" },
                    answers: {
                        type: "array",
                        description: "Answer objects. Fields used depend on question_type.",
                        items: {
                            type: "object",
                            properties: {
                                answer_text: { type: "string", description: "The answer text (most question types)" },
                                answer_weight: { type: "number", description: "100 = correct, 0 = incorrect. For multiple_answers each correct option is 100." },
                                answer_comments: { type: "string", description: "Per-answer feedback shown after selection" },
                                blank_id: { type: "string", description: "For fill_in_multiple_blanks / multiple_dropdowns: which blank this answer belongs to" },
                                answer_match_left: { type: "string", description: "For matching: left-side item (the prompt)" },
                                answer_match_right: { type: "string", description: "For matching: right-side correct match" },
                                matching_answer_incorrect_matches: { type: "string", description: "For matching: comma-separated distractor values for the right column" },
                                numerical_answer_type: { type: "string", enum: ["exact_answer", "range_answer", "precision_answer"], description: "For numerical questions: accepted answer format" },
                                exact: { type: "number", description: "For numerical exact_answer: the exact correct value" },
                                margin: { type: "number", description: "For numerical exact_answer: allowed margin of error" },
                                approximate: { type: "number", description: "For numerical precision_answer: the approximate value" },
                                precision: { type: "number", description: "For numerical precision_answer: significant figures required" },
                                start: { type: "number", description: "For numerical range_answer: start of accepted range" },
                                end: { type: "number", description: "For numerical range_answer: end of accepted range" }
                            }
                        }
                    }
                },
                required: ["course_id", "quiz_id", "question_type", "question_text", "points_possible"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const answerSchema = z.object({
                answer_text: z.string().optional(),
                answer_weight: z.number().optional(),
                answer_comments: z.string().optional(),
                blank_id: z.string().optional(),
                answer_match_left: z.string().optional(),
                answer_match_right: z.string().optional(),
                matching_answer_incorrect_matches: z.string().optional(),
                numerical_answer_type: z.enum(["exact_answer", "range_answer", "precision_answer"]).optional(),
                exact: z.number().optional(),
                margin: z.number().optional(),
                approximate: z.number().optional(),
                precision: z.number().optional(),
                start: z.number().optional(),
                end: z.number().optional()
            });
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.number(),
                question_name: z.string().optional(),
                question_type: z.enum([
                    "multiple_choice_question", "true_false_question", "short_answer_question",
                    "fill_in_multiple_blanks_question", "multiple_answers_question", "multiple_dropdowns_question",
                    "matching_question", "numerical_question", "calculated_question",
                    "essay_question", "file_upload_question", "text_only_question"
                ]),
                question_text: z.string(),
                points_possible: z.number(),
                position: z.number().optional(),
                quiz_group_id: z.number().optional(),
                correct_comments: z.string().optional(),
                incorrect_comments: z.string().optional(),
                neutral_comments: z.string().optional(),
                text_after_answers: z.string().optional(),
                answers: z.array(answerSchema).optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const { course_id: _, quiz_id: __, ...questionData } = input;
            const question = await client.createQuizQuestion(courseId, input.quiz_id, questionData);
            return { content: [{ type: "text", text: JSON.stringify(question, null, 2) }] };
        }
    },
    {
        name: "canvas_update_quiz_question",
        tool: {
            name: "canvas_update_quiz_question",
            description: "Update an existing quiz question. Supports all 12 question types. Provide only the fields you want to change.",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { anyOf: [{ type: "number" }, { type: "string" }], description: "The ID or name of the course" },
                    quiz_id: { type: "number", description: "The quiz ID" },
                    question_id: { type: "number", description: "The question ID to update" },
                    question_name: { type: "string" },
                    question_type: {
                        type: "string",
                        enum: [
                            "multiple_choice_question", "true_false_question", "short_answer_question",
                            "fill_in_multiple_blanks_question", "multiple_answers_question", "multiple_dropdowns_question",
                            "matching_question", "numerical_question", "calculated_question",
                            "essay_question", "file_upload_question", "text_only_question"
                        ]
                    },
                    question_text: { type: "string" },
                    points_possible: { type: "number" },
                    position: { type: "number" },
                    quiz_group_id: { type: "number", nullable: true },
                    correct_comments: { type: "string" },
                    incorrect_comments: { type: "string" },
                    neutral_comments: { type: "string" },
                    text_after_answers: { type: "string" },
                    answers: {
                        type: "array",
                        description: "Full replacement of all answers. See canvas_create_quiz_question for field descriptions.",
                        items: {
                            type: "object",
                            properties: {
                                answer_text: { type: "string" },
                                answer_weight: { type: "number" },
                                answer_comments: { type: "string" },
                                blank_id: { type: "string" },
                                answer_match_left: { type: "string" },
                                answer_match_right: { type: "string" },
                                matching_answer_incorrect_matches: { type: "string" },
                                numerical_answer_type: { type: "string", enum: ["exact_answer", "range_answer", "precision_answer"] },
                                exact: { type: "number" },
                                margin: { type: "number" },
                                approximate: { type: "number" },
                                precision: { type: "number" },
                                start: { type: "number" },
                                end: { type: "number" }
                            }
                        }
                    }
                },
                required: ["course_id", "quiz_id", "question_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const answerSchema = z.object({
                answer_text: z.string().optional(),
                answer_weight: z.number().optional(),
                answer_comments: z.string().optional(),
                blank_id: z.string().optional(),
                answer_match_left: z.string().optional(),
                answer_match_right: z.string().optional(),
                matching_answer_incorrect_matches: z.string().optional(),
                numerical_answer_type: z.enum(["exact_answer", "range_answer", "precision_answer"]).optional(),
                exact: z.number().optional(),
                margin: z.number().optional(),
                approximate: z.number().optional(),
                precision: z.number().optional(),
                start: z.number().optional(),
                end: z.number().optional()
            });
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.number(),
                question_id: z.number(),
                question_name: z.string().optional(),
                question_type: z.enum([
                    "multiple_choice_question", "true_false_question", "short_answer_question",
                    "fill_in_multiple_blanks_question", "multiple_answers_question", "multiple_dropdowns_question",
                    "matching_question", "numerical_question", "calculated_question",
                    "essay_question", "file_upload_question", "text_only_question"
                ]).optional(),
                question_text: z.string().optional(),
                points_possible: z.number().optional(),
                position: z.number().optional(),
                quiz_group_id: z.number().nullable().optional(),
                correct_comments: z.string().optional(),
                incorrect_comments: z.string().optional(),
                neutral_comments: z.string().optional(),
                text_after_answers: z.string().optional(),
                answers: z.array(answerSchema).optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const { course_id: _, quiz_id: __, question_id, ...questionData } = input;
            const question = await client.updateQuizQuestion(courseId, input.quiz_id, question_id, questionData);
            return { content: [{ type: "text", text: JSON.stringify(question, null, 2) }] };
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
                    course_id: { anyOf: [{ type: "number" }, { type: "string" }], description: "The ID or name of the course" },
                    quiz_id: { type: "number", description: "The quiz ID" },
                    question_id: { type: "number", description: "The question ID to delete" }
                },
                required: ["course_id", "quiz_id", "question_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                quiz_id: z.number(),
                question_id: z.number()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.deleteQuizQuestion(courseId, input.quiz_id, input.question_id);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
    },
    {
        name: "canvas_update_quiz",
        tool: {
            name: "canvas_update_quiz",
            description: "Update an existing quiz. Can change title, description, time limit, attempts, dates, shuffle, and publish state.",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { anyOf: [{ type: "number" }, { type: "string" }] },
                    quiz_id: { type: "number" },
                    title: { type: "string" },
                    description: { type: "string" },
                    quiz_type: { type: "string", enum: ["practice_quiz", "assignment", "graded_survey", "survey"] },
                    time_limit: { type: "number", description: "Time limit in minutes. Use null to remove limit.", nullable: true },
                    shuffle_answers: { type: "boolean" },
                    allowed_attempts: { type: "number", description: "Number of allowed attempts. Use -1 for unlimited." },
                    due_at: { type: "string", description: "ISO-8601 due date. Use null to clear.", nullable: true },
                    unlock_at: { type: "string", description: "ISO-8601 unlock date. Use null to clear.", nullable: true },
                    lock_at: { type: "string", description: "ISO-8601 lock date. Use null to clear.", nullable: true },
                    published: { type: "boolean" },
                    require_lockdown_browser: { type: "boolean" },
                    show_correct_answers: { type: "boolean" },
                    show_correct_answers_at: { type: "string", description: "ISO-8601 date to show correct answers", nullable: true }
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
                quiz_type: z.enum(["practice_quiz", "assignment", "graded_survey", "survey"]).optional(),
                time_limit: z.number().nullable().optional(),
                shuffle_answers: z.boolean().optional(),
                allowed_attempts: z.number().optional(),
                due_at: z.string().nullable().optional(),
                unlock_at: z.string().nullable().optional(),
                lock_at: z.string().nullable().optional(),
                published: z.boolean().optional(),
                require_lockdown_browser: z.boolean().optional(),
                show_correct_answers: z.boolean().optional(),
                show_correct_answers_at: z.string().nullable().optional()
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