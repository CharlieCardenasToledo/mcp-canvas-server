import assert from "node:assert/strict";
import test from "node:test";
import { canvasResources } from "../src/resources/canvas-resources.js";
import type { CanvasClient } from "../src/services/canvas-client.js";

function fakeClient(): CanvasClient {
    return {
        getModules: async (courseId: number) => [{ id: 1, name: `Module for ${courseId}`, items_count: 2 }],
        getAssignments: async () => [{ id: 3, name: "Activity", due_at: null }],
        getPage: async (courseId: number, pageId: string) => ({
            page_id: `${courseId}:${pageId}`,
            body: "<p>Page body</p>"
        })
    } as unknown as CanvasClient;
}

test("resources are exposed as URI templates instead of placeholder resources", () => {
    assert.deepEqual(canvasResources.list, []);
    assert.deepEqual(
        canvasResources.templates.map((template) => template.uriTemplate),
        ["canvas://courses/{course_id}/readme", "canvas://courses/{course_id}/pages/{page_id}"]
    );
});

test("course resource routing includes the URI hostname", async () => {
    const result = await canvasResources.read(new URL("canvas://courses/42/readme"), fakeClient());
    const content = result.contents[0];
    assert.ok(content && "text" in content);
    assert.match(content.text, /Course 42 Summary/);
    assert.match(content.text, /Module for 42/);
});

test("page resources validate and pass course and page identifiers", async () => {
    const result = await canvasResources.read(new URL("canvas://courses/42/pages/welcome"), fakeClient());
    const content = result.contents[0];
    assert.ok(content && "text" in content);
    assert.equal(content.mimeType, "text/html");
    assert.equal(content.text, "<p>Page body</p>");

    await assert.rejects(
        canvasResources.read(new URL("canvas://courses/42/pages"), fakeClient()),
        /Missing Canvas page ID/
    );
});

test("resource routing rejects invalid protocols, types, and course IDs", async () => {
    await assert.rejects(canvasResources.read(new URL("https://courses/42/readme"), fakeClient()), /Invalid protocol/);
    await assert.rejects(
        canvasResources.read(new URL("canvas://users/42/readme"), fakeClient()),
        /Unknown resource type/
    );
    await assert.rejects(
        canvasResources.read(new URL("canvas://courses/not-a-number/readme"), fakeClient()),
        /Invalid Canvas course ID/
    );
});
