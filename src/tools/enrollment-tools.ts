import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { resolveCourseId } from "../common/helpers.js";
import { z } from "zod";

export const enrollmentTools: ToolDefinition[] = [
    {
        name: "canvas_health_check",
        tool: {
            name: "canvas_health_check",
            description: "Verify Canvas API connectivity and token validity",
            inputSchema: { type: "object", properties: {} },
        },
        handler: async (client: CanvasClient, _args: any) => {
            const result = await client.healthCheck();
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_profile",
        tool: {
            name: "canvas_get_profile",
            description: "Get the profile of the currently authenticated user",
            inputSchema: { type: "object", properties: {} },
        },
        handler: async (client: CanvasClient, _args: any) => {
            const result = await client.getProfile();
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_user",
        tool: {
            name: "canvas_get_user",
            description: "Get details of a specific user by their Canvas user ID",
            inputSchema: {
                type: "object",
                properties: {
                    user_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "Canvas user ID (number) or 'self' for current user"
                    }
                },
                required: ["user_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                user_id: z.union([z.coerce.number(), z.literal("self")])
            }).parse(args);
            const result = await client.getUser(input.user_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_search_users",
        tool: {
            name: "canvas_search_users",
            description: "Search for users in a Canvas account by name or email",
            inputSchema: {
                type: "object",
                properties: {
                    account_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "Account ID to search in (use 1 for root account or your institution's account ID)"
                    },
                    search_term: {
                        type: "string",
                        description: "Name, email, or login to search for (min 3 characters)"
                    },
                    enrollment_type: {
                        type: "string",
                        description: "Filter by role: student, teacher, ta, observer, designer"
                    }
                },
                required: ["account_id", "search_term"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                account_id: z.union([z.coerce.number(), z.string()]),
                search_term: z.string().min(3),
                enrollment_type: z.string().optional()
            }).parse(args);
            const result = await client.searchUsers(input.account_id, input.search_term, input.enrollment_type);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_list_course_enrollments",
        tool: {
            name: "canvas_list_course_enrollments",
            description: "List all enrollments in a course, optionally filtered by role",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    type: {
                        type: "array",
                        items: { type: "string" },
                        description: "Filter by enrollment type(s): StudentEnrollment, TeacherEnrollment, TaEnrollment, ObserverEnrollment, DesignerEnrollment"
                    }
                },
                required: ["course_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                type: z.array(z.string()).optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.listCourseEnrollments(courseId, input.type);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_enroll_user",
        tool: {
            name: "canvas_enroll_user",
            description: "Enroll a user in a course with a specific role",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    user_id: { type: "number", description: "Canvas user ID to enroll" },
                    enrollment_type: {
                        type: "string",
                        description: "Role: StudentEnrollment, TeacherEnrollment, TaEnrollment, ObserverEnrollment, DesignerEnrollment",
                        default: "StudentEnrollment"
                    },
                    notify: {
                        type: "boolean",
                        description: "Send enrollment notification email to the user (default: false)"
                    }
                },
                required: ["course_id", "user_id", "enrollment_type"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                user_id: z.coerce.number(),
                enrollment_type: z.string(),
                notify: z.boolean().optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.enrollUser(courseId, input.user_id, input.enrollment_type, input.notify);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_remove_enrollment",
        tool: {
            name: "canvas_remove_enrollment",
            description: "Remove or deactivate a user's enrollment from a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    enrollment_id: { type: "number", description: "The enrollment ID to remove (get it from canvas_list_course_enrollments)" },
                    task: {
                        type: "string",
                        enum: ["conclude", "delete", "deactivate"],
                        description: "Action: conclude (end gracefully), delete (remove permanently), deactivate (temporarily disable). Default: conclude"
                    }
                },
                required: ["course_id", "enrollment_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                enrollment_id: z.coerce.number(),
                task: z.enum(["conclude", "delete", "deactivate"]).optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.removeEnrollment(courseId, input.enrollment_id, input.task ?? "conclude");
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    }
];
