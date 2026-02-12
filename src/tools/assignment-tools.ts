import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { resolveCourseId } from "../common/helpers.js";
import { z } from "zod";

export const assignmentTools: ToolDefinition[] = [
    {
        name: "canvas_get_assignments",
        tool: {
            name: "canvas_get_assignments",
            description: "List assignments for a course (supports search, upcoming filter, and limit)",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    search: {
                        type: "string",
                        description: "Filter by assignment name (contains, case-insensitive)"
                    },
                    limit: {
                        type: "number",
                        description: "Max number of items to return (default 50, max 200)"
                    },
                    upcoming_only: {
                        type: "boolean",
                        description: "If true, only assignments with due_at >= now"
                    },
                    full: {
                        type: "boolean",
                        description: "If true, return full assignment objects. Default false returns compact payload."
                    }
                },
                required: ["course_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                search: z.string().optional(),
                limit: z.coerce.number().optional(),
                upcoming_only: z.boolean().optional(),
                full: z.boolean().optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const assignments = await client.getAssignments(courseId);
            const search = (input.search || "").toLowerCase().trim();
            const now = new Date();
            const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);

            const filtered = assignments.filter((a) => {
                const matchesSearch = !search || (a.name || "").toLowerCase().includes(search);
                if (!matchesSearch) return false;
                if (!input.upcoming_only) return true;
                if (!a.due_at) return false;
                return new Date(a.due_at) >= now;
            });

            if (input.full) {
                return {
                    content: [{ type: "text", text: JSON.stringify(filtered.slice(0, limit), null, 2) }],
                };
            }

            const compact = filtered.slice(0, limit).map((a) => ({
                id: a.id ?? null,
                name: a.name,
                due_at: a.due_at ?? null,
                unlock_at: a.unlock_at ?? null,
                lock_at: a.lock_at ?? null,
                points_possible: a.points_possible ?? null,
                published: a.published ?? null
            }));

            return {
                content: [{ type: "text", text: JSON.stringify(compact, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_assignment",
        tool: {
            name: "canvas_get_assignment",
            description: "Get details for a specific assignment",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    assignment_id: { type: "number", description: "The ID of the assignment" },
                },
                required: ["course_id", "assignment_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                assignment_id: z.coerce.number()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const assignment = await client.getAssignment(courseId, input.assignment_id);
            return {
                content: [{ type: "text", text: JSON.stringify(assignment, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_submissions",
        tool: {
            name: "canvas_get_submissions",
            description: "Get submissions for a specific assignment in a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    assignment_id: { type: "number", description: "The ID of the assignment" },
                },
                required: ["course_id", "assignment_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                assignment_id: z.coerce.number()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const submissions = await client.getSubmissions(courseId, input.assignment_id);
            return {
                content: [{ type: "text", text: JSON.stringify(submissions, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_submission",
        tool: {
            name: "canvas_get_submission",
            description: "Get a specific submission details, including file download URLs and text content",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    assignment_id: { type: "number", description: "The ID of the assignment" },
                    student_id: { type: "number", description: "The ID of the student" },
                },
                required: ["course_id", "assignment_id", "student_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                assignment_id: z.coerce.number(),
                student_id: z.coerce.number()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const submission = await client.getSingleSubmission(courseId, input.assignment_id, input.student_id);
            return {
                content: [{ type: "text", text: JSON.stringify(submission, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_submission_comments",
        tool: {
            name: "canvas_get_submission_comments",
            description: "Get all comments for a specific submission",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    assignment_id: { type: "number", description: "The ID of the assignment" },
                    student_id: { type: "number", description: "The ID of the student" },
                },
                required: ["course_id", "assignment_id", "student_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                assignment_id: z.coerce.number(),
                student_id: z.coerce.number()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const submission = await client.getSubmissionComments(courseId, input.assignment_id, input.student_id);
            return {
                content: [{ type: "text", text: JSON.stringify(submission.submission_comments || [], null, 2) }],
            };
        }
    },
    {
        name: "canvas_delete_submission_comment",
        tool: {
            name: "canvas_delete_submission_comment",
            description: "Delete a specific submission comment",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    assignment_id: { type: "number", description: "The ID of the assignment" },
                    student_id: { type: "number", description: "The ID of the student" },
                    comment_id: { type: "number", description: "The ID of the comment to delete" },
                },
                required: ["course_id", "assignment_id", "student_id", "comment_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                assignment_id: z.coerce.number(),
                student_id: z.coerce.number(),
                comment_id: z.coerce.number()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.deleteSubmissionComment(courseId, input.assignment_id, input.student_id, input.comment_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_update_assignment_dates",
        tool: {
            name: "canvas_update_assignment_dates",
            description: "Update due/unlock/lock dates for a specific assignment",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    assignment_id: { type: "number", description: "The ID of the assignment" },
                    due_at: {
                        anyOf: [{ type: "string" }, { type: "null" }],
                        description: "New due date in ISO-8601 format (e.g., 2026-02-15T23:59:00Z). Use null to clear."
                    },
                    unlock_at: {
                        anyOf: [{ type: "string" }, { type: "null" }],
                        description: "New unlock date in ISO-8601 format. Use null to clear."
                    },
                    lock_at: {
                        anyOf: [{ type: "string" }, { type: "null" }],
                        description: "New lock date in ISO-8601 format. Use null to clear."
                    }
                },
                required: ["course_id", "assignment_id"]
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                assignment_id: z.coerce.number(),
                due_at: z.string().nullable().optional(),
                unlock_at: z.string().nullable().optional(),
                lock_at: z.string().nullable().optional()
            }).parse(args);

            if (input.due_at === undefined && input.unlock_at === undefined && input.lock_at === undefined) {
                throw new Error("At least one date field is required: due_at, unlock_at, or lock_at.");
            }

            const courseId = await resolveCourseId(client, input.course_id);
            const updatedAssignment = await client.updateAssignmentDates(courseId, input.assignment_id, {
                due_at: input.due_at,
                unlock_at: input.unlock_at,
                lock_at: input.lock_at
            });

            return {
                content: [{ type: "text", text: JSON.stringify(updatedAssignment, null, 2) }],
            };
        }
    },
    {
        name: "canvas_bulk_update_assignment_due_date_by_query",
        tool: {
            name: "canvas_bulk_update_assignment_due_date_by_query",
            description: "Update due date in bulk for assignments matched by query terms in assignment name",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
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
                        type: "number",
                        description: "Max assignments to process (default 20, max 100)"
                    },
                    dry_run: {
                        type: "boolean",
                        description: "If true, show matches without applying updates"
                    }
                },
                required: ["course_id", "query_terms", "due_at"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                query_terms: z.array(z.string()).min(1),
                due_at: z.string(),
                limit: z.coerce.number().optional(),
                dry_run: z.boolean().optional()
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            const terms = input.query_terms.map((t) => t.toLowerCase().trim()).filter(Boolean);
            const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
            const dryRun = input.dry_run === true;

            const assignments = await client.getAssignments(courseId);
            const matched = assignments
                .filter((a) => {
                    const name = (a.name || "").toLowerCase();
                    return terms.every((term) => name.includes(term));
                })
                .slice(0, limit);

            const results: any[] = [];
            for (const assignment of matched) {
                if (!assignment.id) continue;
                if (dryRun) {
                    results.push({
                        assignment_id: assignment.id,
                        assignment_name: assignment.name,
                        old_due_at: assignment.due_at ?? null,
                        new_due_at: input.due_at,
                        status: "matched_only"
                    });
                    continue;
                }

                try {
                    const updated = await client.updateAssignmentDates(courseId, assignment.id, {
                        due_at: input.due_at
                    });
                    results.push({
                        assignment_id: updated.id ?? assignment.id,
                        assignment_name: updated.name,
                        old_due_at: assignment.due_at ?? null,
                        new_due_at: updated.due_at ?? input.due_at,
                        status: "updated"
                    });
                } catch (error: any) {
                    results.push({
                        assignment_id: assignment.id,
                        assignment_name: assignment.name,
                        old_due_at: assignment.due_at ?? null,
                        new_due_at: input.due_at,
                        status: "error",
                        error: error?.message || "Unknown error"
                    });
                }
            }

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        course_id: courseId,
                        matched_count: matched.length,
                        updated_count: results.filter((r) => r.status === "updated").length,
                        dry_run: dryRun,
                        results
                    }, null, 2)
                }],
            };
        }
    }
];
