import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { resolveCourseId } from "../common/helpers.js";
import { z } from "zod";

export const rubricTools: ToolDefinition[] = [
    {
        name: "canvas_list_rubrics",
        tool: {
            name: "canvas_list_rubrics",
            description: "List all rubrics in a course",
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
            const input = z.object({
                course_id: z.union([z.number(), z.string()])
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            const rubrics = await client.getRubrics(courseId);
            return {
                content: [{ type: "text", text: JSON.stringify(rubrics, null, 2) }]
            };
        }
    },
    {
        name: "canvas_get_rubric",
        tool: {
            name: "canvas_get_rubric",
            description: "Get a specific rubric from a course, optionally including associations and assessments",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    rubric_id: { type: "number", description: "The ID of the rubric" },
                    include: {
                        type: "array",
                        items: { type: "string", enum: ["assessments", "graded_assessments", "peer_assessments", "associations", "assignment_associations", "course_associations"] },
                        description: "Optional extra data to include"
                    }
                },
                required: ["course_id", "rubric_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                rubric_id: z.number(),
                include: z.array(z.string()).optional()
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            const rubric = await client.getRubric(courseId, input.rubric_id, input.include);
            return {
                content: [{ type: "text", text: JSON.stringify(rubric, null, 2) }]
            };
        }
    },
    {
        name: "canvas_update_rubric",
        tool: {
            name: "canvas_update_rubric",
            description: "Update an existing rubric in a course. You can change its title, criteria, ratings, and association settings.",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    rubric_id: { type: "number", description: "The ID of the rubric to update" },
                    title: { type: "string", description: "New title for the rubric" },
                    criteria: {
                        type: "array",
                        description: "Updated list of criteria. Replaces all existing criteria.",
                        items: {
                            type: "object",
                            properties: {
                                description: { type: "string" },
                                long_description: { type: "string" },
                                points: { type: "number" },
                                ratings: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            description: { type: "string" },
                                            points: { type: "number" },
                                            long_description: { type: "string" }
                                        },
                                        required: ["description", "points"]
                                    }
                                }
                            },
                            required: ["description", "points", "ratings"]
                        }
                    },
                    association_id: { type: "number", description: "Optional Assignment ID to update the association" },
                    association_type: { type: "string", description: "Type of association, defaults to 'Assignment'" },
                    use_for_grading: { type: "boolean", description: "Whether to use the rubric for grading" },
                    purpose: { type: "string", description: "Purpose of association, e.g. 'grading'" }
                },
                required: ["course_id", "rubric_id"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                rubric_id: z.number(),
                title: z.string().optional(),
                criteria: z.array(z.object({
                    description: z.string(),
                    long_description: z.string().optional(),
                    points: z.number(),
                    ratings: z.array(z.object({
                        description: z.string(),
                        points: z.number(),
                        long_description: z.string().optional()
                    }))
                })).optional(),
                association_id: z.number().optional(),
                association_type: z.string().optional().default("Assignment"),
                use_for_grading: z.boolean().optional(),
                purpose: z.string().optional().default("grading")
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);

            const rubricData: any = {};
            if (input.title) rubricData.title = input.title;

            if (input.criteria) {
                const criteriaRecord: Record<string, any> = {};
                input.criteria.forEach((c, index) => {
                    const ratingsRecord: Record<string, any> = {};
                    c.ratings.forEach((r, rIndex) => {
                        ratingsRecord[rIndex.toString()] = r;
                    });
                    criteriaRecord[index.toString()] = { ...c, ratings: ratingsRecord };
                });
                rubricData.criteria = criteriaRecord;
            }

            let associationData: any = undefined;
            if (input.association_id) {
                associationData = {
                    association_id: input.association_id,
                    association_type: input.association_type,
                    use_for_grading: input.use_for_grading,
                    purpose: input.purpose
                };
            }

            const rubric = await client.updateRubric(courseId, input.rubric_id, rubricData, associationData);
            return {
                content: [{ type: "text", text: JSON.stringify(rubric, null, 2) }]
            };
        }
    },
    {
        name: "canvas_create_rubric",
        tool: {
            name: "canvas_create_rubric",
            description: "Create a new rubric in a course and optionally associate it with an assignment",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    title: { type: "string", description: "The title of the rubric" },
                    criteria: {
                        type: "array",
                        description: "List of criteria objects for the rubric",
                        items: {
                            type: "object",
                            properties: {
                                description: { type: "string" },
                                long_description: { type: "string" },
                                points: { type: "number" },
                                ratings: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            description: { type: "string" },
                                            points: { type: "number" },
                                            long_description: { type: "string" }
                                        },
                                        required: ["description", "points"]
                                    }
                                }
                            },
                            required: ["description", "points", "ratings"]
                        }
                    },
                    association_id: { type: "number", description: "Optional Assignment ID to associate the rubric with" },
                    association_type: { type: "string", description: "Optional Type of association, defaults to 'Assignment'" },
                    use_for_grading: { type: "boolean", description: "Optional Whether to use the rubric for grading" },
                    purpose: { type: "string", description: "Optional Purpose of association, e.g. 'grading'" }
                },
                required: ["course_id", "title", "criteria"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                title: z.string(),
                criteria: z.array(z.object({
                    description: z.string(),
                    long_description: z.string().optional(),
                    points: z.number(),
                    ratings: z.array(z.object({
                        description: z.string(),
                        points: z.number(),
                        long_description: z.string().optional()
                    }))
                })),
                association_id: z.number().optional(),
                association_type: z.string().optional().default("Assignment"),
                use_for_grading: z.boolean().optional(),
                purpose: z.string().optional().default("grading")
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            
            // Format criteria as a dictionary keyed by index as Canvas API requires indexed hash/array
            const criteriaRecord: Record<string, any> = {};
            input.criteria.forEach((c, index) => {
                const ratingsRecord: Record<string, any> = {};
                c.ratings.forEach((r, rIndex) => {
                    ratingsRecord[rIndex.toString()] = r;
                });
                criteriaRecord[index.toString()] = {
                    ...c,
                    ratings: ratingsRecord
                };
            });

            const rubricData = {
                title: input.title,
                criteria: criteriaRecord
            };

            let associationData: any = undefined;
            if (input.association_id) {
                associationData = {
                    association_id: input.association_id,
                    association_type: input.association_type,
                    use_for_grading: input.use_for_grading,
                    purpose: input.purpose
                };
            }

            const rubric = await client.createRubric(courseId, rubricData, associationData);
            return {
                content: [{ type: "text", text: JSON.stringify(rubric, null, 2) }],
            };
        }
    },
    {
        name: "canvas_create_rubric_association",
        tool: {
            name: "canvas_create_rubric_association",
            description: "Associate an existing rubric with an object like an Assignment",
            inputSchema: {
                type: "object",
                properties: {
                    course_id: {
                        anyOf: [{ type: "number" }, { type: "string" }],
                        description: "The ID or name of the course"
                    },
                    rubric_id: { type: "number", description: "The ID of the rubric to associate" },
                    association_id: { type: "number", description: "The ID of the object (e.g., Assignment ID)" },
                    association_type: { type: "string", description: "Type of object, defaults to 'Assignment'" },
                    use_for_grading: { type: "boolean", description: "Whether to use the rubric for grading" },
                    purpose: { type: "string", description: "Purpose of association, e.g. 'grading'" }
                },
                required: ["course_id", "rubric_id", "association_id"],
            },
        },
        handler: async (client: CanvasClient, args: any) => {
            const input = z.object({
                course_id: z.union([z.number(), z.string()]),
                rubric_id: z.number(),
                association_id: z.number(),
                association_type: z.string().optional().default("Assignment"),
                use_for_grading: z.boolean().optional(),
                purpose: z.string().optional().default("grading")
            }).parse(args);

            const courseId = await resolveCourseId(client, input.course_id);
            const associationData = {
                rubric_id: input.rubric_id,
                association_id: input.association_id,
                association_type: input.association_type,
                use_for_grading: input.use_for_grading,
                purpose: input.purpose
            };

            const association = await client.createRubricAssociation(courseId, associationData);
            return {
                content: [{ type: "text", text: JSON.stringify(association, null, 2) }],
            };
        }
    }
];