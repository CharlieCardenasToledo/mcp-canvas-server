import { ReadResourceResult, Resource } from "@modelcontextprotocol/sdk/types.js";
import { CanvasClient } from "../services/canvas-client.js";
import { ResourceHandler, ResourceManager } from "../common/tool-model.js";

const resources: Resource[] = [
    {
        uri: "canvas://courses/{course_id}/readme",
        name: "Course Readme/Summary",
        mimeType: "text/markdown",
        description: "A summary of the course structure"
    }
];

// We'll manual dispatch for now to keep it simple as per original index.ts logic
async function readResource(uri: URL, client: CanvasClient): Promise<ReadResourceResult> {
    if (uri.protocol !== "canvas:") {
        throw new Error("Invalid protocol");
    }

    const pathParts = uri.pathname.split("/").filter(Boolean);
    // Expected patterns:
    // courses/{id}/pages/{page_id}
    // courses/{id}/files/{file_id}
    // courses/{id}/readme

    if (pathParts[0] !== "courses") {
        throw new Error("Unknown resource type");
    }

    const courseId = parseInt(pathParts[1]);
    const subResource = pathParts[2];

    if (subResource === "readme") {
        const modules = await client.getModules(courseId);
        const assignments = await client.getAssignments(courseId);
        const summary = `# Course ${courseId} Summary\n\n## Modules\n${modules.map((m: any) => `- ${m.name} (${m.items_count} items)`).join("\n")}\n\n## Assignments\n${assignments.map((a: any) => `- ${a.name} (Due: ${a.due_at})`).join("\n")}`;
        return {
            contents: [{
                uri: uri.toString(),
                mimeType: "text/markdown",
                text: summary
            }]
        };
    }

    if (subResource === "pages") {
        const pageId = pathParts[3];
        const page = await client.getPage(courseId, pageId);
        return {
            contents: [{
                uri: uri.toString(),
                mimeType: "text/html",
                text: page.body || ""
            }]
        };
    }

    // Note: Files are tricky because we need to stream content or return text.
    // For now, we won't implement file binary reading in this text-based resource handler,
    // but we could return the metadata or download URL.

    throw new Error(`Resource type ${subResource} not supported yet`);
}

export const canvasResources: ResourceManager = {
    list: resources,
    read: readResource
};
