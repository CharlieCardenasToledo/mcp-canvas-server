import Fastify, { FastifyError } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { CanvasClient } from "./services/canvas-client.js";
import { AgentRunner, AgentMode } from "./services/agent-runner.js";
import { GeminiRunner } from "./services/gemini-runner.js";
import type { ToolDefinition } from "./common/tool-model.js";
import type { QuizQuestionAnswer } from "./common/types.js";

function buildOpenApiSpec(): any {
    return {
        openapi: "3.1.0",
        info: {
            title: "Canvas MCP HTTP API",
            version: "1.0.0",
            description: "HTTP facade for Canvas operations, suitable for GPT Builder Actions."
        },
        servers: [
            {
                url: "https://mcp-canvas-server.onrender.com"
            }
        ],
        paths: {
            "/health": {
                get: {
                    operationId: "health",
                    summary: "Health check",
                    responses: {
                        "200": {
                            description: "Server is healthy",
                            content: {
                                "application/json": {
                                    schema: { type: "object", properties: { ok: { type: "boolean" } } }
                                }
                            }
                        }
                    }
                }
            },
            "/privacy": {
                get: {
                    operationId: "getPrivacyPolicy",
                    summary: "Privacy policy",
                    responses: {
                        "200": {
                            description: "Privacy policy text",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            service: { type: "string" },
                                            effective_date: { type: "string" },
                                            summary: { type: "array", items: { type: "string" } },
                                            contact: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/courses": {
                get: {
                    operationId: "listCourses",
                    summary: "List active Canvas courses",
                    responses: {
                        "200": {
                            description: "Courses list",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                id: { type: "integer" },
                                                name: { type: "string" },
                                                course_code: { type: "string" },
                                                workflow_state: { type: "string" },
                                                enrollment_term_id: { type: "integer" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/courses/{courseId}/assignments": {
                get: {
                    operationId: "listAssignments",
                    summary: "List course assignments (compact by default to avoid large responses)",
                    parameters: [
                        {
                            name: "courseId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        },
                        {
                            name: "search",
                            in: "query",
                            required: false,
                            schema: { type: "string" }
                        },
                        {
                            name: "limit",
                            in: "query",
                            required: false,
                            schema: { type: "integer", default: 50, minimum: 1, maximum: 200 }
                        },
                        {
                            name: "upcomingOnly",
                            in: "query",
                            required: false,
                            schema: { type: "boolean", default: false }
                        },
                        {
                            name: "full",
                            in: "query",
                            required: false,
                            schema: { type: "boolean", default: false }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Assignments list",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                id: { type: "integer" },
                                                name: { type: "string" },
                                                due_at: { type: "string", nullable: true },
                                                unlock_at: { type: "string", nullable: true },
                                                lock_at: { type: "string", nullable: true },
                                                points_possible: { type: "number", nullable: true },
                                                published: { type: "boolean", nullable: true }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/courses/{courseId}/assignments/{assignmentId}": {
                get: {
                    operationId: "getAssignment",
                    summary: "Get assignment details",
                    parameters: [
                        {
                            name: "courseId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        },
                        {
                            name: "assignmentId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Assignment details"
                        }
                    }
                }
            },
            "/courses/{courseId}/assignments/{assignmentId}/dates": {
                patch: {
                    operationId: "updateAssignmentDates",
                    summary: "Update assignment due/unlock/lock dates",
                    parameters: [
                        {
                            name: "courseId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        },
                        {
                            name: "assignmentId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        due_at: {
                                            type: ["string", "null"],
                                            description: "ISO-8601 date. Example: 2026-02-20T23:59:00Z"
                                        },
                                        unlock_at: {
                                            type: ["string", "null"],
                                            description: "ISO-8601 date or null"
                                        },
                                        lock_at: {
                                            type: ["string", "null"],
                                            description: "ISO-8601 date or null"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Updated assignment"
                        },
                        "400": {
                            description: "Invalid payload"
                        }
                    }
                }
            },
            "/courses/{courseId}/quizzes": {
                get: {
                    operationId: "listQuizzes",
                    summary: "List quizzes in a course",
                    parameters: [
                        {
                            name: "courseId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Quizzes list"
                        }
                    }
                }
            },
            "/courses/{courseId}/quizzes/{quizId}": {
                get: {
                    operationId: "getQuiz",
                    summary: "Get quiz details",
                    parameters: [
                        {
                            name: "courseId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        },
                        {
                            name: "quizId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Quiz details"
                        }
                    }
                }
            },
            "/courses/{courseId}/quizzes/{quizId}/dates": {
                patch: {
                    operationId: "updateQuizDates",
                    summary: "Update quiz due/unlock/lock dates",
                    parameters: [
                        {
                            name: "courseId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        },
                        {
                            name: "quizId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        due_at: { type: ["string", "null"] },
                                        unlock_at: { type: ["string", "null"] },
                                        lock_at: { type: ["string", "null"] }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Updated quiz"
                        },
                        "400": {
                            description: "Invalid payload"
                        }
                    }
                }
            },
            "/courses/{courseId}/quizzes/{quizId}/questions": {
                get: {
                    operationId: "listQuizQuestions",
                    summary: "List all questions in a quiz",
                    parameters: [
                        {
                            name: "courseId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        },
                        {
                            name: "quizId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Quiz questions list"
                        }
                    }
                },
                post: {
                    operationId: "createQuizQuestion",
                    summary: "Create a question in a quiz",
                    parameters: [
                        {
                            name: "courseId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        },
                        {
                            name: "quizId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        question_name: { type: "string", description: "Question name/title" },
                                        question_type: { type: "string", description: "e.g. multiple_choice_question, true_false_question, essay_question" },
                                        question_text: { type: "string", description: "Question text (HTML)" },
                                        points_possible: { type: "number", description: "Point value" },
                                        quiz_group_id: { type: "integer", description: "Optional quiz group ID" },
                                        answers: {
                                            type: "array",
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
                                    required: ["question_name", "question_type", "question_text", "points_possible"]
                                }
                            }
                        }
                    },
                    responses: {
                        "201": {
                            description: "Created quiz question"
                        },
                        "400": {
                            description: "Invalid payload"
                        }
                    }
                }
            },
            "/courses/{courseId}/quizzes/{quizId}/questions/{questionId}": {
                put: {
                    operationId: "updateQuizQuestion",
                    summary: "Update a question in a quiz",
                    parameters: [
                        {
                            name: "courseId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        },
                        {
                            name: "quizId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        },
                        {
                            name: "questionId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        question_name: { type: "string" },
                                        question_type: { type: "string" },
                                        question_text: { type: "string" },
                                        points_possible: { type: "number" },
                                        quiz_group_id: { type: ["integer", "null"] },
                                        answers: {
                                            type: "array",
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
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Updated quiz question"
                        },
                        "400": {
                            description: "Invalid payload"
                        }
                    }
                },
                delete: {
                    operationId: "deleteQuizQuestion",
                    summary: "Delete a question from a quiz",
                    parameters: [
                        {
                            name: "courseId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        },
                        {
                            name: "quizId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        },
                        {
                            name: "questionId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Deletion result"
                        }
                    }
                }
            },
            "/courses/{courseId}/quizzes/{quizId}/groups": {
                post: {
                    operationId: "createQuizGroup",
                    summary: "Create a quiz group linked to a question bank",
                    parameters: [
                        {
                            name: "courseId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        },
                        {
                            name: "quizId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string", description: "Group name" },
                                        pick_count: { type: "integer", description: "Number of questions to pick" },
                                        question_points: { type: "number", description: "Points per question" },
                                        assessment_question_bank_id: { type: "integer", description: "Question bank to link" }
                                    },
                                    required: ["name", "pick_count", "question_points"]
                                }
                            }
                        }
                    },
                    responses: {
                        "201": {
                            description: "Created quiz group"
                        },
                        "400": {
                            description: "Invalid payload"
                        }
                    }
                }
            },
            "/courses/{courseId}/assignments/bulk-due-date": {
                patch: {
                    operationId: "bulkUpdateAssignmentDueDateByQuery",
                    summary: "Update due date for assignments matched by query terms in their names",
                    parameters: [
                        {
                            name: "courseId",
                            in: "path",
                            required: true,
                            schema: { type: "integer" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        query_terms: {
                                            type: "array",
                                            items: { type: "string" },
                                            description: "All terms must appear in assignment name (case-insensitive)"
                                        },
                                        due_at: {
                                            type: "string",
                                            description: "ISO-8601 due date to apply (e.g., 2026-02-12T23:59:00-05:00)"
                                        },
                                        limit: {
                                            type: "integer",
                                            default: 20,
                                            minimum: 1,
                                            maximum: 100
                                        },
                                        dry_run: {
                                            type: "boolean",
                                            default: false
                                        }
                                    },
                                    required: ["query_terms", "due_at"]
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Bulk update result"
                        }
                    }
                }
            }
        }
    };
}

export async function startHttpServer(client: CanvasClient, host = "0.0.0.0", port = 3000, tools: ToolDefinition[] = []): Promise<void> {
    const app = Fastify({ logger: true });

    await app.register(swagger, {
        openapi: buildOpenApiSpec()
    });
    await app.register(swaggerUi, {
        routePrefix: "/docs"
    });

    app.setErrorHandler((error: FastifyError, _request, reply) => {
        const status = error.statusCode ?? 500;
        const message = status >= 500 ? "Internal server error" : error.message;
        reply.code(status).send({ error: message });
    });

    app.get("/health", async () => ({ ok: true }));
    app.get("/privacy", async () => ({
        service: "Canvas MCP HTTP API",
        effective_date: "2026-02-12",
        summary: [
            "This service processes Canvas API data strictly to fulfill user requests.",
            "Canvas API tokens are provided via environment variables and are not exposed in API responses.",
            "Do not send sensitive data beyond what is required for course operations."
        ],
        contact: "Set a maintainer contact before production use."
    }));

    app.get("/openapi.json", async () => buildOpenApiSpec());

    app.get("/courses", async () => {
        return client.getCourses();
    });

    app.get<{
        Params: { courseId: string };
        Querystring: { search?: string; limit?: string; upcomingOnly?: string; full?: string };
    }>("/courses/:courseId/assignments", async (request) => {
        const courseId = Number.parseInt(request.params.courseId, 10);
        const search = (request.query.search || "").toLowerCase().trim();
        const upcomingOnly = request.query.upcomingOnly === "true";
        const full = request.query.full === "true";

        const requestedLimit = Number.parseInt(request.query.limit || "50", 10);
        const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 200) : 50;

        const assignments = await client.getAssignments(courseId);
        const now = new Date();

        const filtered = assignments.filter((a) => {
            const matchesSearch = !search || (a.name || "").toLowerCase().includes(search);
            if (!matchesSearch) return false;
            if (!upcomingOnly) return true;
            if (!a.due_at) return false;
            return new Date(a.due_at) >= now;
        });

        if (full) {
            return filtered.slice(0, limit);
        }

        return filtered.slice(0, limit).map((a) => ({
            id: a.id ?? null,
            name: a.name,
            due_at: a.due_at ?? null,
            unlock_at: a.unlock_at ?? null,
            lock_at: a.lock_at ?? null,
            points_possible: a.points_possible ?? null,
            published: a.published ?? null
        }));
    });

    app.get<{ Params: { courseId: string; assignmentId: string } }>(
        "/courses/:courseId/assignments/:assignmentId",
        async (request) => {
            const courseId = Number.parseInt(request.params.courseId, 10);
            const assignmentId = Number.parseInt(request.params.assignmentId, 10);
            return client.getAssignment(courseId, assignmentId);
        }
    );

    app.patch<{
        Params: { courseId: string; assignmentId: string };
        Body: { due_at?: string | null; unlock_at?: string | null; lock_at?: string | null };
    }>("/courses/:courseId/assignments/:assignmentId/dates", async (request, reply) => {
        const { due_at, unlock_at, lock_at } = request.body || {};
        if (due_at === undefined && unlock_at === undefined && lock_at === undefined) {
            return reply.code(400).send({
                error: "At least one date field is required: due_at, unlock_at, or lock_at."
            });
        }

        const courseId = Number.parseInt(request.params.courseId, 10);
        const assignmentId = Number.parseInt(request.params.assignmentId, 10);
        return client.updateAssignmentDates(courseId, assignmentId, {
            due_at,
            unlock_at,
            lock_at
        });
    });

    app.get<{ Params: { courseId: string } }>("/courses/:courseId/quizzes", async (request) => {
        const courseId = Number.parseInt(request.params.courseId, 10);
        return client.getQuizzes(courseId);
    });

    app.get<{ Params: { courseId: string; quizId: string } }>(
        "/courses/:courseId/quizzes/:quizId",
        async (request) => {
            const courseId = Number.parseInt(request.params.courseId, 10);
            const quizId = Number.parseInt(request.params.quizId, 10);
            return client.getQuiz(courseId, quizId);
        }
    );

    app.patch<{
        Params: { courseId: string; quizId: string };
        Body: { due_at?: string | null; unlock_at?: string | null; lock_at?: string | null };
    }>("/courses/:courseId/quizzes/:quizId/dates", async (request, reply) => {
        const { due_at, unlock_at, lock_at } = request.body || {};
        if (due_at === undefined && unlock_at === undefined && lock_at === undefined) {
            return reply.code(400).send({
                error: "At least one date field is required: due_at, unlock_at, or lock_at."
            });
        }

        const courseId = Number.parseInt(request.params.courseId, 10);
        const quizId = Number.parseInt(request.params.quizId, 10);
        return client.updateQuizDates(courseId, quizId, {
            due_at,
            unlock_at,
            lock_at
        });
    });

    // --- Quiz Questions ---

    app.get<{ Params: { courseId: string; quizId: string } }>(
        "/courses/:courseId/quizzes/:quizId/questions",
        async (request) => {
            const courseId = Number.parseInt(request.params.courseId, 10);
            const quizId = Number.parseInt(request.params.quizId, 10);
            return client.listQuizQuestions(courseId, quizId);
        }
    );

    app.post<{
        Params: { courseId: string; quizId: string };
        Body: {
            question_name?: string;
            question_type?: string;
            question_text?: string;
            points_possible?: number;
            quiz_group_id?: number;
            answers?: QuizQuestionAnswer[];
        };
    }>("/courses/:courseId/quizzes/:quizId/questions", async (request, reply) => {
        const { question_name, question_type, question_text, points_possible, quiz_group_id, answers } = request.body || {};
        if (!question_name || !question_type || !question_text || points_possible === undefined) {
            return reply.code(400).send({
                error: "question_name, question_type, question_text and points_possible are required."
            });
        }
        const courseId = Number.parseInt(request.params.courseId, 10);
        const quizId = Number.parseInt(request.params.quizId, 10);
        const question = await client.createQuizQuestion(courseId, quizId, {
            question_name,
            question_type,
            question_text,
            points_possible,
            quiz_group_id,
            answers
        });
        return reply.code(201).send(question);
    });

    app.put<{
        Params: { courseId: string; quizId: string; questionId: string };
        Body: {
            question_name?: string;
            question_type?: string;
            question_text?: string;
            points_possible?: number;
            quiz_group_id?: number | null;
            answers?: QuizQuestionAnswer[];
        };
    }>("/courses/:courseId/quizzes/:quizId/questions/:questionId", async (request) => {
        const courseId = Number.parseInt(request.params.courseId, 10);
        const quizId = Number.parseInt(request.params.quizId, 10);
        const questionId = Number.parseInt(request.params.questionId, 10);
        const { question_name, question_type, question_text, points_possible, quiz_group_id, answers } = request.body || {};
        const data: any = {};
        if (question_name !== undefined) data.question_name = question_name;
        if (question_type !== undefined) data.question_type = question_type;
        if (question_text !== undefined) data.question_text = question_text;
        if (points_possible !== undefined) data.points_possible = points_possible;
        if (quiz_group_id !== undefined) data.quiz_group_id = quiz_group_id;
        if (answers !== undefined) data.answers = answers;
        return client.updateQuizQuestion(courseId, quizId, questionId, data);
    });

    app.delete<{
        Params: { courseId: string; quizId: string; questionId: string };
    }>("/courses/:courseId/quizzes/:quizId/questions/:questionId", async (request) => {
        const courseId = Number.parseInt(request.params.courseId, 10);
        const quizId = Number.parseInt(request.params.quizId, 10);
        const questionId = Number.parseInt(request.params.questionId, 10);
        return client.deleteQuizQuestion(courseId, quizId, questionId);
    });

    app.post<{
        Params: { courseId: string; quizId: string };
        Body: {
            name?: string;
            pick_count?: number;
            question_points?: number;
            assessment_question_bank_id?: number;
        };
    }>("/courses/:courseId/quizzes/:quizId/groups", async (request, reply) => {
        const { name, pick_count, question_points, assessment_question_bank_id } = request.body || {};
        if (!name || pick_count === undefined || question_points === undefined) {
            return reply.code(400).send({
                error: "name, pick_count and question_points are required."
            });
        }
        const courseId = Number.parseInt(request.params.courseId, 10);
        const quizId = Number.parseInt(request.params.quizId, 10);
        const group = await client.createQuizGroup(courseId, quizId, {
            name,
            pick_count,
            question_points,
            assessment_question_bank_id
        });
        return reply.code(201).send(group);
    });

    app.patch<{
        Params: { courseId: string };
        Body: { query_terms?: string[]; due_at?: string; limit?: number; dry_run?: boolean };
    }>("/courses/:courseId/assignments/bulk-due-date", async (request, reply) => {
        const courseId = Number.parseInt(request.params.courseId, 10);
        const terms = (request.body.query_terms || []).map((t) => t.toLowerCase().trim()).filter(Boolean);
        const dueAt = request.body.due_at;
        const dryRun = request.body.dry_run === true;
        const rawLimit = request.body.limit ?? 20;
        const limit = Math.min(Math.max(rawLimit, 1), 100);

        if (!terms.length || !dueAt) {
            return reply.code(400).send({
                error: "query_terms and due_at are required."
            });
        }

        const assignments = await client.getAssignments(courseId);
        const matched = assignments
            .filter((a) => {
                const name = (a.name || "").toLowerCase();
                return terms.every((term) => name.includes(term));
            })
            .slice(0, limit);

        const results = [];
        for (const assignment of matched) {
            if (!assignment.id) continue;
            if (dryRun) {
                results.push({
                    assignment_id: assignment.id,
                    assignment_name: assignment.name,
                    old_due_at: assignment.due_at ?? null,
                    new_due_at: dueAt,
                    status: "matched_only"
                });
                continue;
            }

            try {
                const updated = await client.updateAssignmentDates(courseId, assignment.id, { due_at: dueAt });
                results.push({
                    assignment_id: updated.id ?? assignment.id,
                    assignment_name: updated.name,
                    old_due_at: assignment.due_at ?? null,
                    new_due_at: updated.due_at ?? dueAt,
                    status: "updated"
                });
            } catch (error: any) {
                results.push({
                    assignment_id: assignment.id,
                    assignment_name: assignment.name,
                    old_due_at: assignment.due_at ?? null,
                    new_due_at: dueAt,
                    status: "error",
                    error: error?.message || "Unknown error"
                });
            }
        }

        return {
            course_id: courseId,
            matched_count: matched.length,
            updated_count: results.filter((r) => r.status === "updated").length,
            dry_run: dryRun,
            results
        };
    });

    // --- POST /chat ---

    const ollamaRunner = new AgentRunner(
        client,
        tools,
        process.env.OLLAMA_HOST ?? "http://localhost:11434"
    );

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
    const geminiRunner = GEMINI_API_KEY
        ? new GeminiRunner(GEMINI_API_KEY, client, tools)
        : null;

    app.post<{
        Body: {
            message: string;
            model?: string;
            mode?: AgentMode;
            provider?: "ollama" | "gemini";
            gemini_key?: string;
        };
    }>("/chat", async (request, reply) => {
        const { message, model, mode, provider = "ollama", gemini_key } = request.body ?? {};

        if (!message || typeof message !== "string" || !message.trim()) {
            return reply.code(400).send({ error: "El campo 'message' es requerido." });
        }

        if (tools.length === 0) {
            return reply.code(503).send({ error: "El servidor no tiene herramientas cargadas. Inicia con 'serve-http'." });
        }

        if (provider === "gemini") {
            const apiKey = gemini_key || GEMINI_API_KEY;
            if (!apiKey) {
                return reply.code(400).send({ error: "Se necesita gemini_key en el body o GEMINI_API_KEY en el entorno." });
            }
            const runner = gemini_key
                ? new GeminiRunner(gemini_key, client, tools)
                : geminiRunner!;
            return runner.run(message.trim(), { model });
        }

        return ollamaRunner.run(message.trim(), { model, mode });
    });

    // --- POST /audit ---

    const SKILL_PATH = process.env.AUDIT_SKILL_PATH ?? path.resolve(
        process.env.USERPROFILE ?? process.env.HOME ?? ".",
        "Proyectos Personales",
        "material-docente - UIDE",
        ".claude", "commands",
        "canvas-module-auditor-uide-v2.md"
    );

    app.post<{
        Body: {
            course_id: number;
            week: number;
            course_name?: string;
            provider?: "ollama" | "gemini";
            model?: string;
            gemini_key?: string;
        };
    }>("/audit", async (request, reply) => {
        const {
            course_id,
            week,
            course_name,
            provider = "gemini",
            model,
            gemini_key
        } = request.body ?? {};

        if (!course_id || !week) {
            return reply.code(400).send({ error: "course_id y week son requeridos." });
        }

        if (tools.length === 0) {
            return reply.code(503).send({ error: "El servidor no tiene herramientas cargadas." });
        }

        // Leer el skill de auditoría
        let skillContent: string;
        try {
            skillContent = await fs.readFile(SKILL_PATH, "utf-8");
        } catch {
            return reply.code(500).send({
                error: `No se encontró el archivo de skill en: ${SKILL_PATH}. Define AUDIT_SKILL_PATH como variable de entorno.`
            });
        }

        // Construir el mensaje de auditoría
        const courseLabel = course_name ? `${course_name} (course_id: ${course_id})` : `course_id: ${course_id}`;
        const auditMessage =
            `Ejecuta una auditoría instruccional completa de la Semana ${week} del curso ${courseLabel}. ` +
            `Sigue exactamente el flujo de los pasos 1 al 4 definidos en las instrucciones. ` +
            `Genera el reporte markdown completo con todas las secciones y la calificación global.`;

        if (provider === "gemini") {
            const apiKey = gemini_key || GEMINI_API_KEY;
            if (!apiKey) {
                return reply.code(400).send({ error: "Se necesita gemini_key en el body o GEMINI_API_KEY en el entorno." });
            }
            const runner = gemini_key
                ? new GeminiRunner(gemini_key, client, tools)
                : geminiRunner!;
            const result = await runner.run(auditMessage, {
                model: model ?? "gemini-2.5-flash",
                systemPrompt: skillContent
            });
            return { ...result, course_id, week };
        }

        const result = await ollamaRunner.run(auditMessage, {
            model,
            systemPrompt: skillContent
        });
        return { ...result, course_id, week };
    });

    await app.listen({ host, port });
}
