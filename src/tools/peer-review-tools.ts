import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { resolveCourseId } from "../common/helpers.js";
import { z } from "zod";

export const peerReviewTools: ToolDefinition[] = [
    {
        name: "canvas_list_peer_reviews",
        tool: {
            name: "canvas_list_peer_reviews",
            description: "List all peer reviews assigned for an assignment",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    assignment_id: { type: "number", description: "The ID of the assignment" }
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
            const result = await client.listPeerReviews(courseId, input.assignment_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_submission_peer_reviews",
        tool: {
            name: "canvas_get_submission_peer_reviews",
            description: "List peer reviews assigned to a specific student submission",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    assignment_id: { type: "number", description: "The ID of the assignment" },
                    student_id: { type: "number", description: "The Canvas user ID of the student whose submission is being reviewed" }
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
            const result = await client.getSubmissionPeerReviews(courseId, input.assignment_id, input.student_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_create_peer_review",
        tool: {
            name: "canvas_create_peer_review",
            description: "Manually assign a peer review: one student reviews another student's submission",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    assignment_id: { type: "number", description: "The ID of the assignment" },
                    submission_student_id: { type: "number", description: "User ID of the student whose submission will be reviewed" },
                    reviewer_id: { type: "number", description: "User ID of the student who will perform the review" }
                },
                required: ["course_id", "assignment_id", "submission_student_id", "reviewer_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                assignment_id: z.coerce.number(),
                submission_student_id: z.coerce.number(),
                reviewer_id: z.coerce.number()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.createPeerReview(courseId, input.assignment_id, input.submission_student_id, input.reviewer_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_delete_peer_review",
        tool: {
            name: "canvas_delete_peer_review",
            description: "Remove a peer review assignment",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    assignment_id: { type: "number", description: "The ID of the assignment" },
                    submission_student_id: { type: "number", description: "User ID of the student whose submission was being reviewed" },
                    reviewer_id: { type: "number", description: "User ID of the reviewer to remove" }
                },
                required: ["course_id", "assignment_id", "submission_student_id", "reviewer_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                assignment_id: z.coerce.number(),
                submission_student_id: z.coerce.number(),
                reviewer_id: z.coerce.number()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.deletePeerReview(courseId, input.assignment_id, input.submission_student_id, input.reviewer_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    }
];
