import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { z } from "zod";

export const gradingTools: ToolDefinition[] = [
    {
        name: "canvas_grade_submission",
        tool: {
            name: "canvas_grade_submission",
            description: "Grade a submission for a specific student",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { type: "number", description: "The ID of the course" },
                    assignment_id: { type: "number", description: "The ID of the assignment" },
                    student_id: { type: "number", description: "The ID of the student" },
                    grade: { type: "number", description: "The numeric grade to assign" },
                    comment: { type: "string", description: "Optional comment" },
                    rubric_assessment: {
                        type: "object",
                        description: "Rubric assessment data. Map of criterion ID to rating/points.",
                        additionalProperties: {
                            type: "object",
                            properties: {
                                points: { type: "number" },
                                rating_id: { type: "string" },
                                comments: { type: "string" }
                            }
                        }
                    }
                },
                required: ["course_id", "assignment_id", "student_id", "grade"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.coerce.number(),
                assignment_id: z.coerce.number(),
                student_id: z.coerce.number(),
                grade: z.union([z.number(), z.string()]),
                comment: z.string().optional(),
                rubric_assessment: z.record(z.string(), z.object({
                    rating_id: z.string().optional(),
                    points: z.number(),
                    comments: z.string().optional()
                })).optional()
            }).parse(args);

            const result = await client.gradeSubmission(
                input.course_id,
                input.assignment_id,
                input.student_id,
                input.grade,
                input.comment,
                input.rubric_assessment
            );
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_grade_multiple_submissions",
        tool: {
            name: "canvas_grade_multiple_submissions",
            description: "Grade multiple submissions at once, either by providing student_ids or filtering by status (e.g. unsubmitted)",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { type: "number", description: "The ID of the course" },
                    assignment_id: { type: "number", description: "The ID of the assignment" },
                    grade: { type: "number", description: "The grade to assign" },
                    comment: { type: "string", description: "Optional comment" },
                    student_ids: {
                        type: "array",
                        items: { type: "number" },
                        description: "List of student IDs to grade"
                    },
                    filter_status: {
                        type: "string",
                        enum: ["unsubmitted", "missing", "late"],
                        description: "Filter student submissions by status"
                    },
                    rubric_assessment: {
                        type: "object",
                        description: "Rubric assessment data. Map of criterion ID to rating/points.",
                        additionalProperties: {
                            type: "object",
                            properties: {
                                points: { type: "number" },
                                rating_id: { type: "string" },
                                comments: { type: "string" }
                            }
                        }
                    }
                },
                required: ["course_id", "assignment_id", "grade"]
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.number(),
                assignment_id: z.number(),
                grade: z.union([z.number(), z.string()]),
                comment: z.string().optional(),
                student_ids: z.array(z.number()).optional(),
                filter_status: z.enum(['unsubmitted', 'missing', 'late']).optional(),
                rubric_assessment: z.record(z.string(), z.object({
                    rating_id: z.string().optional(),
                    points: z.number(),
                    comments: z.string().optional()
                })).optional()
            }).parse(args);

            if (!input.student_ids && !input.filter_status) {
                throw new Error("You must provide either student_ids or a filter_status (e.g. 'unsubmitted')");
            }

            const cid = input.course_id;
            const aid = input.assignment_id;

            let studentsToGrade: number[] = [];

            if (input.student_ids) {
                studentsToGrade = input.student_ids;
            } else if (input.filter_status) {
                const submissions = await client.getSubmissions(cid, aid);
                const status = input.filter_status;

                studentsToGrade = submissions
                    .filter(s => {
                        if (status === 'unsubmitted') return s.workflow_state === 'unsubmitted' || !s.submitted_at;
                        if (status === 'missing') return s.missing;
                        if (status === 'late') return s.late;
                        return false;
                    })
                    .map(s => s.user_id);
            }

            if (studentsToGrade.length === 0) {
                return { content: [{ type: "text", text: "No students found matching the criteria." }] };
            }

            const results = [];
            for (const userId of studentsToGrade) {
                try {
                    await client.gradeSubmission(
                        cid,
                        aid,
                        userId,
                        input.grade,
                        input.comment,
                        input.rubric_assessment
                    );
                    results.push({ student_id: userId, status: 'graded', grade: input.grade });
                } catch (err: any) {
                    results.push({ student_id: userId, status: 'error', error: err.message });
                }
            }

            return {
                content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
            };
        }
    },
    {
        name: "canvas_audit_course",
        tool: {
            name: "canvas_audit_course",
            description: "Audit a course for future assignments and missing submissions",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: { type: "number", description: "The ID of the course" },
                },
                required: ["course_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({ course_id: z.coerce.number() }).parse(args);
            const cid = input.course_id;
            const assignments = await client.getAssignments(cid);
            const now = new Date();
            const future = assignments.filter(a => a.due_at && new Date(a.due_at) > now);

            if (future.length === 0) {
                return { content: [{ type: "text", text: "No future assignments found." }] };
            }

            let report = `Audit for Course ${cid}:\n`;
            for (const a of future) {
                if (!a.id) continue;
                const subs = await client.getSubmissions(cid, a.id);
                const missing = subs.filter(s => s.workflow_state === 'unsubmitted' || !s.submitted_at);

                if (missing.length > 0) {
                    report += `\nAssignment: ${a.name} (Due: ${a.due_at})\n`;
                    report += `  ${missing.length} missing submissions:\n`;
                    missing.forEach(m => {
                        const name = (m as any).user?.name || `User ${m.user_id}`;
                        report += `    - ${name} (ID: ${m.user_id})\n`;
                    });
                }
            }
            return {
                content: [{ type: "text", text: report }],
            };
        }
    }
];
