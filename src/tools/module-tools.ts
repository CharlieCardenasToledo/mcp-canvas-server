
import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { resolveCourseId } from "../common/helpers.js";
import { z } from "zod";

export const moduleTools: ToolDefinition[] = [
    {
        name: "canvas_list_modules",
        tool: {
            name: "canvas_list_modules",
            description: "List modules and their items for a specific course",
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
            const modules = await client.getModules(courseId);
            return {
                content: [{ type: "text", text: JSON.stringify(modules, null, 2) }],
            };
        }
    },
    {
        name: "canvas_create_module",
        tool: {
            name: "canvas_create_module",
            description: "Create a new module in a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    name: { type: "string", description: "The name of the module" },
                    published: { type: "boolean", description: "Whether the module is published" },
                    position: { type: "number", description: "The position of the module" }
                },
                required: ["course_id", "name"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                name: z.string(),
                published: z.boolean().optional().default(false),
                position: z.number().optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const module = await client.createModule(courseId, input.name, input.published, input.position);
            return {
                content: [{ type: "text", text: JSON.stringify(module, null, 2) }],
            };
        }
    },
    {
        name: "canvas_update_module",
        tool: {
            name: "canvas_update_module",
            description: "Update an existing module (name, published, position, prerequisites, completion requirements)",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    module_id: { type: "number", description: "The ID of the module" },
                    name: { type: "string", description: "The new name of the module" },
                    published: { type: "boolean", description: "Whether the module is published" },
                    position: { type: "number", description: "The new position of the module" },
                    prerequisite_module_ids: {
                        type: "array",
                        items: { type: "number" },
                        description: "IDs of modules that must be completed before this one unlocks"
                    },
                    require_sequential_progress: {
                        type: "boolean",
                        description: "Whether items in the module must be completed in order"
                    },
                    completion_requirements: {
                        type: "array",
                        description: "Completion requirements for module items. Replaces ALL existing requirements — include every item that needs one.",
                        items: {
                            type: "object",
                            properties: {
                                id: { type: "number", description: "The module item ID" },
                                type: {
                                    type: "string",
                                    description: "must_view, must_submit, must_contribute, min_score, must_mark_done"
                                },
                                min_score: { type: "number", description: "Required when type is min_score" }
                            },
                            required: ["id", "type"]
                        }
                    }
                },
                required: ["course_id", "module_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                module_id: z.number(),
                name: z.string().optional(),
                published: z.boolean().optional(),
                position: z.number().optional(),
                prerequisite_module_ids: z.array(z.number()).optional(),
                require_sequential_progress: z.boolean().optional(),
                completion_requirements: z.array(z.object({
                    id: z.number(),
                    type: z.string(),
                    min_score: z.number().optional()
                })).optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const module = await client.updateModule(courseId, input.module_id, {
                name: input.name,
                published: input.published,
                position: input.position,
                prerequisite_module_ids: input.prerequisite_module_ids,
                require_sequential_progress: input.require_sequential_progress,
                completion_requirements: input.completion_requirements
            });
            return {
                content: [{ type: "text", text: JSON.stringify(module, null, 2) }],
            };
        }
    },
    {
        name: "canvas_delete_module",
        tool: {
            name: "canvas_delete_module",
            description: "Delete a module from a course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    module_id: { type: "number", description: "The ID of the module to delete" },
                },
                required: ["course_id", "module_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                module_id: z.number()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.deleteModule(courseId, input.module_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_create_module_item",
        tool: {
            name: "canvas_create_module_item",
            description: "Create a module item (Assignment, Quiz, File, Page, DiscussionTopic, ExternalUrl, ExternalTool, or SubHeader)",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    module_id: { type: "number", description: "The ID of the module" },
                    type: {
                        type: "string",
                        description: "The type of item (Assignment, Quiz, File, Page, DiscussionTopic, ExternalUrl, ExternalTool, SubHeader)"
                    },
                    content_id: {
                        anyOf: [{ type: "string" }, { type: "number" }],
                        description: "The ID of the content (not needed for SubHeader, ExternalUrl)"
                    },
                    title: { type: "string", description: "The title of the item" },
                    page_url: { type: "string", description: "The URL of the page (for Page type)" },
                    external_url: { type: "string", description: "The URL for ExternalUrl or ExternalTool" },
                    new_tab: { type: "boolean", description: "Whether to open in a new tab" },
                    indent: { type: "number", description: "The level of indentation (0-3)" },
                    position: { type: "number", description: "The position in the module" }
                },
                required: ["course_id", "module_id", "type"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                module_id: z.number(),
                type: z.enum(['Assignment', 'Quiz', 'File', 'Page', 'DiscussionTopic', 'ExternalUrl', 'ExternalTool', 'SubHeader']),
                content_id: z.union([z.string(), z.number()]).optional(),
                title: z.string().optional(),
                page_url: z.string().optional(),
                external_url: z.string().optional(),
                new_tab: z.boolean().optional(),
                indent: z.number().optional(),
                position: z.number().optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            
            const item: any = {
                type: input.type,
                title: input.title,
                content_id: input.content_id,
                page_url: input.page_url,
                external_url: input.external_url,
                new_tab: input.new_tab,
                indent: input.indent,
                position: input.position
            };

            const result = await client.createModuleItem(courseId, input.module_id, item);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_update_module_item",
        tool: {
            name: "canvas_update_module_item",
            description: "Update an existing module item",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    module_id: { type: "number", description: "The ID of the module" },
                    item_id: { type: "number", description: "The ID of the module item" },
                    title: { type: "string", description: "The new title of the item" },
                    position: { type: "number", description: "The new position of the item" },
                    indent: { type: "number", description: "The new level of indentation (0-3)" },
                    published: { type: "boolean", description: "Whether the item is published" },
                    new_module_id: { type: "number", description: "Move the item to a new module" },
                    completion_requirement_type: {
                        type: "string",
                        description: "Completion requirement type: must_view, must_submit, must_contribute, min_score, must_mark_done"
                    }
                },
                required: ["course_id", "module_id", "item_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                module_id: z.number(),
                item_id: z.number(),
                title: z.string().optional(),
                position: z.number().optional(),
                indent: z.number().optional(),
                published: z.boolean().optional(),
                new_module_id: z.number().optional(),
                completion_requirement_type: z.string().optional()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.updateModuleItem(courseId, input.module_id, input.item_id, {
                title: input.title,
                position: input.position,
                indent: input.indent,
                published: input.published,
                module_id: input.new_module_id,
                ...(input.completion_requirement_type && {
                    completion_requirement: { type: input.completion_requirement_type }
                })
            });
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    },
    {
        name: "canvas_delete_module_item",
        tool: {
            name: "canvas_delete_module_item",
            description: "Delete an item from a module",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    module_id: { type: "number", description: "The ID of the module" },
                    item_id: { type: "number", description: "The ID of the module item to delete" },
                },
                required: ["course_id", "module_id", "item_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                module_id: z.number(),
                item_id: z.number()
            }).parse(args);
            const courseId = await resolveCourseId(client, input.course_id);
            const result = await client.deleteModuleItem(courseId, input.module_id, input.item_id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    }
];
