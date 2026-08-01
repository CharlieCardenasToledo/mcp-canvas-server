import assert from "node:assert/strict";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const entry = path.resolve(process.argv[2] ?? "dist/index.js");
const expectedVersion = process.env.npm_package_version;

const client = new Client({ name: "package-smoke", version: "1.0.0" });
const transport = new StdioClientTransport({
    command: process.execPath,
    args: [entry],
    env: {
        ...process.env,
        CANVAS_API_TOKEN: "smoke-test-token",
        CANVAS_DOMAIN: "canvas.instructure.com"
    },
    stderr: "pipe"
});

try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    const serverVersion = client.getServerVersion();

    assert.equal(serverVersion?.name, "canvas-lms-server");
    if (expectedVersion) assert.equal(serverVersion?.version, expectedVersion);
    assert.ok(tools.length >= 50, `Expected at least 50 tools, received ${tools.length}`);
    assert.ok(tools.some((t) => t.name === "canvas_list_courses"));
    assert.ok(tools.some((t) => t.name === "canvas_get_assignments"));
    console.log(`Package smoke passed: ${serverVersion?.version}, ${tools.length} tools`);
} finally {
    await client.close();
}
