import { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
import { PromptDefinition } from "../common/tool-model.js";

export const canvasPrompts: PromptDefinition[] = [
    {
        name: "audit_course",
        prompt: {
            name: "audit_course",
            description: "Audit a course to find students who are missing assignments.",
            arguments: [
                {
                    name: "course_id",
                    description: "The ID of the course to audit",
                    required: true
                }
            ]
        },
        handler: async (args) => {
            const courseId = args?.course_id;
            if (!courseId) throw new Error("course_id is required");
            return {
                description: "Audit course for missing submissions",
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Please audit course ${courseId} to find any students who have not submitted assignments that are due soon or past due. Use the canvas_audit_course tool.`
                        }
                    }
                ]
            };
        }
    },
    {
        name: "summarize_course",
        prompt: {
            name: "summarize_course",
            description: "Summarize the content and structure of a course.",
            arguments: [
                {
                    name: "course_id",
                    description: "The ID of the course",
                    required: true
                }
            ]
        },
        handler: async (args) => {
            const courseId = args?.course_id;
            if (!courseId) throw new Error("course_id is required");
            return {
                description: "Summarize course content",
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Please provide a summary of the course ${courseId}. List the modules, pages, and files available to understand the course structure.`
                        }
                    }
                ]
            };
        }
    }
];
