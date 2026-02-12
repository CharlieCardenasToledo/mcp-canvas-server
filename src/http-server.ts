import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { CanvasClient } from "./services/canvas-client.js";

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
                            description: "Server is healthy"
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
                            description: "Privacy policy text"
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
                            description: "Courses list"
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
                            description: "Assignments list"
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

export async function startHttpServer(client: CanvasClient, host = "0.0.0.0", port = 3000): Promise<void> {
    const app = Fastify({ logger: true });

    await app.register(swagger, {
        openapi: buildOpenApiSpec()
    });
    await app.register(swaggerUi, {
        routePrefix: "/docs"
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

    await app.listen({ host, port });
}
