
import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { resolveCourseId } from "../common/helpers.js";
import { z } from "zod";

export const fileTools: ToolDefinition[] = [
    {
        name: "canvas_upload_file",
        tool: {
            name: "canvas_upload_file",
            description: "Upload a local file to a Canvas course and optionally add it to a module",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    file_path: { type: "string", description: "The local path to the file to upload" },
                    file_name: { type: "string", description: "The name to give the file in Canvas" },
                    content_type: { type: "string", description: "The MIME type of the file (e.g., application/pdf)" },
                    parent_folder_id: { type: "number", description: "Optional folder ID in Canvas to upload to" },
                    module_id: { type: "number", description: "Optional: Add the uploaded file to this module" },
                    position: { type: "number", description: "Optional position in the module" },
                    indent: { type: "number", description: "Optional level of indentation (0-3)" }
                },
                required: ["course_id", "file_path", "file_name", "content_type"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                file_path: z.string(),
                file_name: z.string(),
                content_type: z.string(),
                parent_folder_id: z.number().optional(),
                module_id: z.number().optional(),
                position: z.number().optional(),
                indent: z.number().optional()
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            
            // 1. Upload the file
            const file = await client.uploadFile(
                courseId,
                input.file_path,
                input.file_name,
                input.content_type,
                input.parent_folder_id
            );

            let resultText = `File uploaded successfully: ${file.display_name} (ID: ${file.id})`;

            // 2. Optionally add to module
            if (input.module_id && file.id) {
                const moduleItem = await client.createModuleItem(courseId, input.module_id, {
                    type: 'File',
                    content_id: file.id,
                    position: input.position,
                    indent: input.indent
                });
                resultText += `\nAnd added to module ${input.module_id} as item ${moduleItem.id}`;
            }

            return {
                content: [{ type: "text", text: resultText }],
            };
        }
    },
    {
        name: "canvas_list_folders",
        tool: {
            name: "canvas_list_folders",
            description: "List folders in a Canvas course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    }
                },
                required: ["course_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()])
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            const folders = await client.getFolders(courseId);

            return {
                content: [{ type: "text", text: JSON.stringify(folders, null, 2) }],
            };
        }
    },
    {
        name: "canvas_create_folder",
        tool: {
            name: "canvas_create_folder",
            description: "Create a new folder in a Canvas course",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    name: { type: "string", description: "The name of the new folder" },
                    parent_folder_id: { type: "number", description: "Optional parent folder ID" }
                },
                required: ["course_id", "name"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                name: z.string(),
                parent_folder_id: z.number().optional()
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            const folder = await client.createFolder(courseId, input.name, input.parent_folder_id);

            return {
                content: [{ type: "text", text: `Folder created successfully: ${folder.name} (ID: ${folder.id})` }],
            };
        }
    },
    {
        name: "canvas_update_folder",
        tool: {
            name: "canvas_update_folder",
            description: "Update a folder's name or location",
            inputSchema: {
                type: "object",
                properties: {
                    folder_id: { type: "number", description: "The ID of the folder to update" },
                    name: { type: "string", description: "The new name for the folder" },
                    parent_folder_id: { type: "number", description: "The ID of the new parent folder" }
                },
                required: ["folder_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                folder_id: z.number(),
                name: z.string().optional(),
                parent_folder_id: z.number().optional()
            }).parse(args);

            const folder = await client.updateFolder(input.folder_id, {
                name: input.name,
                parent_folder_id: input.parent_folder_id
            });

            return {
                content: [{ type: "text", text: `Folder updated successfully: ${folder.name} (ID: ${folder.id})` }],
            };
        }
    },
    {
        name: "canvas_delete_folder",
        tool: {
            name: "canvas_delete_folder",
            description: "Delete a folder from Canvas",
            inputSchema: {
                type: "object",
                properties: {
                    folder_id: { type: "number", description: "The ID of the folder to delete" },
                    force: { type: "boolean", description: "Set to true to delete even if folder is not empty" }
                },
                required: ["folder_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                folder_id: z.number(),
                force: z.boolean().optional().default(false)
            }).parse(args);

            await client.deleteFolder(input.folder_id, input.force);

            return {
                content: [{ type: "text", text: `Folder ${input.folder_id} deleted successfully.` }],
            };
        }
    },
    {
        name: "canvas_update_file",
        tool: {
            name: "canvas_update_file",
            description: "Update a file's metadata (name, folder, visibility)",
            inputSchema: {
                type: "object",
                properties: {
                    file_id: { type: "number", description: "The ID of the file to update" },
                    name: { type: "string", description: "The new name for the file" },
                    parent_folder_id: { type: "number", description: "The ID of the new parent folder" },
                    locked: { type: "boolean", description: "Whether the file is locked" },
                    hidden: { type: "boolean", description: "Whether the file is hidden" }
                },
                required: ["file_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                file_id: z.number(),
                name: z.string().optional(),
                parent_folder_id: z.number().optional(),
                locked: z.boolean().optional(),
                hidden: z.boolean().optional()
            }).parse(args);

            const file = await client.updateFile(input.file_id, {
                name: input.name,
                parent_folder_id: input.parent_folder_id,
                locked: input.locked,
                hidden: input.hidden
            });

            return {
                content: [{ type: "text", text: `File updated successfully: ${file.display_name} (ID: ${file.id})` }],
            };
        }
    },
    {
        name: "canvas_delete_file",
        tool: {
            name: "canvas_delete_file",
            description: "Delete a file from Canvas",
            inputSchema: {
                type: "object",
                properties: {
                    file_id: { type: "number", description: "The ID of the file to delete" }
                },
                required: ["file_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                file_id: z.number()
            }).parse(args);

            await client.deleteFile(input.file_id);

            return {
                content: [{ type: "text", text: `File ${input.file_id} deleted successfully.` }],
            };
        }
    }
];
