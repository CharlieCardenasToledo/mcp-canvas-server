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
                url: "https://your-deployed-domain.com"
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
                    summary: "List course assignments",
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

    app.get("/openapi.json", async () => app.swagger());

    app.get("/courses", async () => {
        return client.getCourses();
    });

    app.get<{ Params: { courseId: string } }>("/courses/:courseId/assignments", async (request) => {
        const courseId = Number.parseInt(request.params.courseId, 10);
        return client.getAssignments(courseId);
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

    await app.listen({ host, port });
}
