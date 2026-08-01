import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../src/server-factory.js";
import type { CanvasClient } from "../src/services/canvas-client.js";

test("the MCP factory exposes tools, resources, templates, and prompts", async () => {
    const server = createMcpServer({} as CanvasClient, []);
    const client = new Client({ name: "factory-test", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    assert.deepEqual((await client.listTools()).tools, []);
    assert.deepEqual((await client.listResources()).resources, []);
    assert.equal((await client.listResourceTemplates()).resourceTemplates.length, 2);
    assert.ok((await client.listPrompts()).prompts.length > 0);

    await client.close();
});
