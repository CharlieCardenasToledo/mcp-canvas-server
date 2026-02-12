import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { resolveCourseId, resolveStudentId } from "../common/helpers.js";
import { z } from "zod";

function pickStudentGradeInfo(student: any) {
    const enrollment = (student.enrollments || [])[0];
    const grades = enrollment?.grades || {};
    return {
        student_id: student.id,
        student_name: student.name,
        email: student.email,
        current_grade: grades.current_grade ?? null,
        final_grade: grades.final_grade ?? null,
        current_score: grades.current_score ?? null,
        final_score: grades.final_score ?? null
    };
}

export const studentTools: ToolDefinition[] = [
    {
        name: "canvas_list_students_with_grades",
        tool: {
            name: "canvas_list_students_with_grades",
            description: "List students in a course with their current/final grade and score",
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
            const input = z.object({ course_id: z.union([z.number(), z.string()]) }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const students = await client.getEnrollments(courseId);
            const rows = students.map(pickStudentGradeInfo);
            return {
                content: [{ type: "text", text: JSON.stringify(rows, null, 2) }]
            };
        }
    },
    {
        name: "canvas_get_student_grades",
        tool: {
            name: "canvas_get_student_grades",
            description: "Get grade summary for one student in a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    student_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "Student ID or student name"
                    }
                },
                required: ["course_id", "student_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                student_id: z.union([z.number(), z.string()])
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            const studentId = await resolveStudentId(client, courseId, input.student_id);
            const student = await client.getStudentInCourse(courseId, studentId);

            return {
                content: [{ type: "text", text: JSON.stringify(pickStudentGradeInfo(student), null, 2) }]
            };
        }
    },
    {
        name: "canvas_get_student_assignments",
        tool: {
            name: "canvas_get_student_assignments",
            description: "Get all assignments for one student with due dates and submission status",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    student_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "Student ID or student name"
                    }
                },
                required: ["course_id", "student_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                student_id: z.union([z.number(), z.string()])
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            const studentId = await resolveStudentId(client, courseId, input.student_id);
            const submissions = await client.getStudentCourseSubmissions(courseId, studentId);

            const rows = submissions.map((item: any) => ({
                assignment_id: item.assignment_id,
                assignment_name: item.assignment?.name ?? null,
                due_at: item.assignment?.due_at ?? null,
                unlock_at: item.assignment?.unlock_at ?? null,
                lock_at: item.assignment?.lock_at ?? null,
                submitted_at: item.submitted_at ?? null,
                late: item.late ?? false,
                missing: item.missing ?? false,
                workflow_state: item.workflow_state ?? null,
                grade: item.grade ?? null,
                score: item.score ?? null
            }));

            return {
                content: [{ type: "text", text: JSON.stringify(rows, null, 2) }]
            };
        }
    },
    {
        name: "canvas_list_assignment_due_dates",
        tool: {
            name: "canvas_list_assignment_due_dates",
            description: "List assignment due dates in a course (optionally only upcoming)",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    only_upcoming: {
                        type: "boolean",
                        description: "If true, return only assignments with due_at >= now"
                    }
                },
                required: ["course_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                only_upcoming: z.boolean().optional()
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            const assignments = await client.getAssignments(courseId);
            const now = new Date();

            const rows = assignments
                .map((a) => ({
                    assignment_id: a.id ?? null,
                    assignment_name: a.name,
                    due_at: a.due_at ?? null,
                    unlock_at: a.unlock_at ?? null,
                    lock_at: a.lock_at ?? null,
                    points_possible: a.points_possible ?? null,
                    published: a.published ?? null
                }))
                .filter((a) => {
                    if (!input.only_upcoming) return true;
                    if (!a.due_at) return false;
                    return new Date(a.due_at) >= now;
                });

            return {
                content: [{ type: "text", text: JSON.stringify(rows, null, 2) }]
            };
        }
    }
];
