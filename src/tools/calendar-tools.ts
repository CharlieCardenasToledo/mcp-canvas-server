import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { z } from "zod";

export const calendarTools: ToolDefinition[] = [
    {
        name: "canvas_list_appointment_groups",
        tool: {
            name: "canvas_list_appointment_groups",
            description: "List appointment groups",
            inputSchema: {
                type: "object",
                properties: {
                    scope: { type: "string", enum: ["all", "manageable"], description: "Scope of appointment groups to list" },
                    include: { type: "array", items: { type: "string" }, description: "Additional associations to include" }
                }
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                scope: z.enum(["all", "manageable"]).optional().default("all"),
                include: z.array(z.string()).optional()
            }).parse(args);
            const groups = await client.listAppointmentGroups(input.scope, input.include);
            return {
                content: [{ type: "text", text: JSON.stringify(groups, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_appointment_group",
        tool: {
            name: "canvas_get_appointment_group",
            description: "Get a single appointment group by ID",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "number", description: "The ID of the appointment group" },
                    include: { type: "array", items: { type: "string" }, description: "Additional associations to include" }
                },
                required: ["id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                id: z.coerce.number(),
                include: z.array(z.string()).optional()
            }).parse(args);
            const group = await client.getAppointmentGroup(input.id, input.include);
            return {
                content: [{ type: "text", text: JSON.stringify(group, null, 2) }],
            };
        }
    },
    {
        name: "canvas_create_appointment_group",
        tool: {
            name: "canvas_create_appointment_group",
            description: "Create a new appointment group",
            inputSchema: {
                type: "object",
                properties: {
                    context_codes: { type: "array", items: { type: "string" }, description: "Array of context codes (e.g. course_123)" },
                    title: { type: "string", description: "Title of the appointment group" },
                    description: { type: "string", description: "Description of the appointment group" },
                    location_name: { type: "string", description: "Name of the location" },
                    location_address: { type: "string", description: "Address of the location" },
                    publish: { type: "boolean", description: "Whether to publish the group immediately" },
                    participants_per_appointment: { type: "number", description: "Max participants per slot" },
                    min_appointments_per_participant: { type: "number", description: "Min slots per participant" },
                    max_appointments_per_participant: { type: "number", description: "Max slots per participant" },
                    new_appointments: {
                        type: "array",
                        items: {
                            type: "array",
                            items: { type: "string" },
                            minItems: 2,
                            maxItems: 2,
                            description: "[start_time, end_time] pair"
                        },
                        description: "Nested array of start/end time pairs"
                    },
                    participant_visibility: { type: "string", enum: ["private", "protected"] }
                },
                required: ["context_codes", "title"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                context_codes: z.array(z.string()),
                title: z.string(),
                description: z.string().optional(),
                location_name: z.string().optional(),
                location_address: z.string().optional(),
                publish: z.boolean().optional(),
                participants_per_appointment: z.number().optional(),
                min_appointments_per_participant: z.number().optional(),
                max_appointments_per_participant: z.number().optional(),
                new_appointments: z.array(z.tuple([z.string(), z.string()])).optional(),
                participant_visibility: z.enum(["private", "protected"]).optional()
            }).parse(args);
            const group = await client.createAppointmentGroup(input);
            return {
                content: [{ type: "text", text: JSON.stringify(group, null, 2) }],
            };
        }
    },
    {
        name: "canvas_update_appointment_group",
        tool: {
            name: "canvas_update_appointment_group",
            description: "Update an existing appointment group",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "number", description: "The ID of the appointment group" },
                    context_codes: { type: "array", items: { type: "string" }, description: "Array of context codes" },
                    title: { type: "string", description: "Title of the appointment group" },
                    description: { type: "string", description: "Description of the appointment group" },
                    location_name: { type: "string", description: "Name of the location" },
                    location_address: { type: "string", description: "Address of the location" },
                    publish: { type: "boolean", description: "Whether to publish the group" },
                    participants_per_appointment: { type: "number", description: "Max participants per slot" },
                    min_appointments_per_participant: { type: "number", description: "Min slots per participant" },
                    max_appointments_per_participant: { type: "number", description: "Max slots per participant" },
                    new_appointments: {
                        type: "array",
                        items: {
                            type: "array",
                            items: { type: "string" },
                            minItems: 2,
                            maxItems: 2
                        }
                    },
                    participant_visibility: { type: "string", enum: ["private", "protected"] }
                },
                required: ["id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                id: z.coerce.number(),
                context_codes: z.array(z.string()).optional(),
                title: z.string().optional(),
                description: z.string().optional(),
                location_name: z.string().optional(),
                location_address: z.string().optional(),
                publish: z.boolean().optional(),
                participants_per_appointment: z.number().optional(),
                min_appointments_per_participant: z.number().optional(),
                max_appointments_per_participant: z.number().optional(),
                new_appointments: z.array(z.tuple([z.string(), z.string()])).optional(),
                participant_visibility: z.enum(["private", "protected"]).optional()
            }).parse(args);
            const { id, ...data } = input;
            const group = await client.updateAppointmentGroup(id, data);
            return {
                content: [{ type: "text", text: JSON.stringify(group, null, 2) }],
            };
        }
    },
    {
        name: "canvas_delete_appointment_group",
        tool: {
            name: "canvas_delete_appointment_group",
            description: "Delete an appointment group",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "number", description: "The ID of the appointment group" },
                    cancel_reason: { type: "string", description: "Reason for canceling the appointment group" }
                },
                required: ["id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                id: z.coerce.number(),
                cancel_reason: z.string().optional()
            }).parse(args);
            const result = await client.deleteAppointmentGroup(input.id, input.cancel_reason);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_list_appointment_group_users",
        tool: {
            name: "canvas_list_appointment_group_users",
            description: "List users participating in an appointment group",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "number", description: "The ID of the appointment group" }
                },
                required: ["id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({ id: z.coerce.number() }).parse(args);
            const users = await client.listAppointmentGroupUsers(input.id);
            return {
                content: [{ type: "text", text: JSON.stringify(users, null, 2) }],
            };
        }
    },
    {
        name: "canvas_list_appointment_group_groups",
        tool: {
            name: "canvas_list_appointment_group_groups",
            description: "List student groups participating in an appointment group",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "number", description: "The ID of the appointment group" }
                },
                required: ["id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({ id: z.coerce.number() }).parse(args);
            const groups = await client.listAppointmentGroupGroups(input.id);
            return {
                content: [{ type: "text", text: JSON.stringify(groups, null, 2) }],
            };
        }
    },
    {
        name: "canvas_get_next_appointment",
        tool: {
            name: "canvas_get_next_appointment",
            description: "Get the next appointment group for the current user",
            inputSchema: { type: "object", properties: {} },
        },
        handler: async (client: CanvasClient) => {
            const group = await client.getNextAppointment();
            return {
                content: [{ type: "text", text: JSON.stringify(group, null, 2) }],
            };
        }
    }
];
