import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { resolveCourseId } from "../common/helpers.js";
import { z } from "zod";

export const assignmentTools: ToolDefinition[] = [
    {
        name: "canvas_get_assignments",
        tool: {
            name: "canvas_get_assignments",
            description: "List all assignments for a specific course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                },
                required: ["course_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({ course_id: z.union([z.number(), z.string()]) }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const assignments = await client.getAssignments(courseId);
            return {
                content: [{ type: "text", text: JSON.stringify(assignments, null, 2) }],
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
    }
];
