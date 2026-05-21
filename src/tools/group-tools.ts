import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { resolveCourseId, resolveStudentId } from "../common/helpers.js";
import { z } from "zod";

export const groupTools: ToolDefinition[] = [
    {
        name: "canvas_list_group_categories",
        tool: {
            name: "canvas_list_group_categories",
            description: "List group categories (Group Sets) in a course",
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
            const categories = await client.getGroupCategories(courseId);
            return {
                content: [{ type: "text", text: JSON.stringify(categories, null, 2) }]
            };
        }
    },
    {
        name: "canvas_create_group_category",
        tool: {
            name: "canvas_create_group_category",
            description: "Create a new group category (Group Set) in a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    name: { type: "string", description: "Name of the group category" },
                    self_signup: { type: "string", enum: ["enabled", "restricted"], description: "Allow students to sign up themselves" },
                    auto_leader: { type: "string", enum: ["first", "random"], description: "Auto-assign a leader" },
                    group_limit: { type: "number", description: "Maximum number of users in each group (requires self_signup)" },
                    create_group_count: { type: "number", description: "Automatically create this number of groups" },
                    split_group_count: { type: "number", description: "Create this many groups and randomly assign students" }
                },
                required: ["course_id", "name"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                name: z.string(),
                self_signup: z.enum(["enabled", "restricted"]).optional(),
                auto_leader: z.enum(["first", "random"]).optional(),
                group_limit: z.number().optional(),
                create_group_count: z.number().optional(),
                split_group_count: z.number().optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const category = await client.createGroupCategory(courseId, {
                name: input.name,
                self_signup: input.self_signup,
                auto_leader: input.auto_leader,
                group_limit: input.group_limit,
                create_group_count: input.create_group_count,
                split_group_count: input.split_group_count
            });
            return {
                content: [{ type: "text", text: JSON.stringify(category, null, 2) }]
            };
        }
    },
    {
        name: "canvas_create_group",
        tool: {
            name: "canvas_create_group",
            description: "Create a new group within a group category",
            inputSchema: {
                type: "object",
                properties: {
                    group_category_id: { type: "number", description: "The ID of the group category" },
                    name: { type: "string", description: "Name of the group" },
                    description: { type: "string", description: "Description of the group" },
                    join_level: { type: "string", enum: ["parent_context_auto_join", "parent_context_request", "invitation_only"], description: "How people can join" },
                    is_public: { type: "boolean", description: "Whether the group is public" }
                },
                required: ["group_category_id", "name"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                group_category_id: z.number(),
                name: z.string(),
                description: z.string().optional(),
                join_level: z.enum(["parent_context_auto_join", "parent_context_request", "invitation_only"]).optional(),
                is_public: z.boolean().optional()
            }).parse(args);
            const group = await client.createGroup(input.group_category_id, {
                name: input.name,
                description: input.description,
                join_level: input.join_level,
                is_public: input.is_public
            });
            return {
                content: [{ type: "text", text: JSON.stringify(group, null, 2) }]
            };
        }
    },
    {
        name: "canvas_list_groups_in_category",
        tool: {
            name: "canvas_list_groups_in_category",
            description: "List groups inside a group category",
            inputSchema: {
                type: "object",
                properties: {
                    group_category_id: { type: "number", description: "The ID of the group category" }
                },
                required: ["group_category_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({ group_category_id: z.number() }).parse(args);
            const groups = await client.getGroupsInCategory(input.group_category_id);
            return {
                content: [{ type: "text", text: JSON.stringify(groups, null, 2) }]
            };
        }
    },
    {
        name: "canvas_assign_unassigned_members",
        tool: {
            name: "canvas_assign_unassigned_members",
            description: "Randomly assign unassigned students to existing groups in a category",
            inputSchema: {
                type: "object",
                properties: {
                    group_category_id: { type: "number", description: "The ID of the group category" },
                    sync: { type: "boolean", description: "Run assignment synchronously" }
                },
                required: ["group_category_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                group_category_id: z.number(),
                sync: z.boolean().optional().default(false)
            }).parse(args);
            const result = await client.assignUnassignedMembers(input.group_category_id, input.sync);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }
    },
    {
        name: "canvas_add_group_member",
        tool: {
            name: "canvas_add_group_member",
            description: "Add a student to a group",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    group_id: { type: "number", description: "The ID of the group" },
                    student_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the student"
                    }
                },
                required: ["course_id", "group_id", "student_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                group_id: z.number(),
                student_id: z.union([z.number(), z.string()])
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const studentId = await resolveStudentId(client, courseId, input.student_id);
            const membership = await client.addGroupMember(input.group_id, studentId);
            return {
                content: [{ type: "text", text: JSON.stringify(membership, null, 2) }]
            };
        }
    }
];
