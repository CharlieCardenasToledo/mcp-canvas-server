import assert from "node:assert/strict";
import test from "node:test";
import type { ToolDefinition } from "../src/common/tool-model.js";
import { assertUniqueTools, getConfiguredTools, isReadOnlyTool, rawTools } from "../src/common/tool-registry.js";

test("the canonical registry contains unique tool names", () => {
    assert.doesNotThrow(() => assertUniqueTools(rawTools));
    assert.equal(new Set(rawTools.map((tool) => tool.name)).size, rawTools.length);
});

test("duplicate tool names fail explicitly", () => {
    const definition: ToolDefinition = {
        name: "canvas_get_example",
        tool: {
            name: "canvas_get_example",
            description: "Example",
            inputSchema: { type: "object" }
        },
        handler: async () => ({ content: [] })
    };
    assert.throws(() => assertUniqueTools([definition, definition]), /Duplicate MCP tool names: canvas_get_example/);
});

test("the default profile is read-only and excludes credential and file tools", () => {
    const tools = getConfiguredTools({
        readOnly: true,
        enableCredentialTools: false,
        enableFileTools: false
    });
    const names = new Set(tools.map((tool) => tool.name));

    assert.ok(tools.length > 0);
    assert.ok(tools.every((tool) => isReadOnlyTool(tool.name)));
    assert.equal(names.has("canvas_list_access_tokens"), false);
    assert.equal(names.has("canvas_list_folders"), false);
});

test("opt-in profiles expose credential and file tools", () => {
    const tools = getConfiguredTools({
        readOnly: false,
        enableCredentialTools: true,
        enableFileTools: true
    });
    const names = new Set(tools.map((tool) => tool.name));

    assert.equal(names.has("canvas_list_access_tokens"), true);
    assert.equal(names.has("canvas_list_folders"), true);
    assert.equal(names.has("canvas_update_assignment"), true);
});

test("every configured tool receives MCP titles and behavioral annotations", () => {
    const tools = getConfiguredTools({
        readOnly: false,
        enableCredentialTools: true,
        enableFileTools: true
    });
    const listCourses = tools.find((tool) => tool.name === "canvas_list_courses");
    const updateAssignment = tools.find((tool) => tool.name === "canvas_update_assignment");

    assert.ok(tools.every((tool) => typeof tool.tool.title === "string"));
    assert.equal(listCourses?.tool.annotations?.readOnlyHint, true);
    assert.equal(listCourses?.tool.annotations?.idempotentHint, true);
    assert.equal(updateAssignment?.tool.annotations?.destructiveHint, true);
    assert.equal(updateAssignment?.tool.annotations?.readOnlyHint, false);
});
