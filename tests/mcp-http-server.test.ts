import assert from "node:assert/strict";
import { request, type IncomingHttpHeaders } from "node:http";
import test from "node:test";
import { createMcpHttpServer } from "../src/mcp-http-server.js";
import type { CanvasClient } from "../src/services/canvas-client.js";

interface HttpResult {
    status: number;
    headers: IncomingHttpHeaders;
    body: string;
}

function call(
    port: number,
    method: string,
    path: string,
    headers: Record<string, string> = {},
    body?: string
): Promise<HttpResult> {
    return new Promise((resolve, reject) => {
        const req = request(
            {
                hostname: "127.0.0.1",
                port,
                method,
                path,
                headers: {
                    host: "127.0.0.1",
                    ...headers,
                    ...(body ? { "content-length": String(Buffer.byteLength(body)) } : {})
                }
            },
            (response) => {
                const chunks: Buffer[] = [];
                response.on("data", (chunk: Buffer) => chunks.push(chunk));
                response.on("end", () => {
                    resolve({
                        status: response.statusCode ?? 0,
                        headers: response.headers,
                        body: Buffer.concat(chunks).toString("utf8")
                    });
                });
            }
        );
        req.on("error", reject);
        if (body) req.write(body);
        req.end();
    });
}

const initializeBody = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "http-test", version: "1.0.0" }
    }
});

const mcpHeaders = {
    accept: "application/json, text/event-stream",
    "content-type": "application/json"
};

test("Streamable HTTP creates, uses, and deletes an isolated MCP session", async () => {
    const instance = createMcpHttpServer({} as CanvasClient, {
        host: "127.0.0.1",
        port: 0,
        tools: [],
        allowedHosts: ["127.0.0.1"]
    });
    await instance.listen();
    const port = instance.address()?.port;
    assert.ok(port);

    try {
        const health = await call(port, "GET", "/healthz");
        assert.equal(health.status, 200);

        const initialized = await call(port, "POST", "/mcp", mcpHeaders, initializeBody);
        assert.equal(initialized.status, 200);
        const sessionId = initialized.headers["mcp-session-id"];
        assert.equal(typeof sessionId, "string");
        assert.equal(instance.sessions.size, 1);

        const listed = await call(
            port,
            "POST",
            "/mcp",
            {
                ...mcpHeaders,
                "mcp-session-id": sessionId as string,
                "mcp-protocol-version": "2025-11-25"
            },
            JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} })
        );
        assert.equal(listed.status, 200);

        const deleted = await call(port, "DELETE", "/mcp", {
            accept: "application/json, text/event-stream",
            "mcp-session-id": sessionId as string,
            "mcp-protocol-version": "2025-11-25"
        });
        assert.equal(deleted.status, 200);
        assert.equal(instance.sessions.size, 0);

        const invalidSession = await call(port, "GET", "/mcp", {
            "mcp-session-id": "missing"
        });
        assert.equal(invalidSession.status, 404);
    } finally {
        await instance.close();
    }
});

test("Streamable HTTP rejects bad auth, hosts, origins, and oversized bodies", async () => {
    const instance = createMcpHttpServer({} as CanvasClient, {
        host: "127.0.0.1",
        port: 0,
        tools: [],
        authToken: "secret",
        allowedHosts: ["127.0.0.1"],
        allowedOrigins: ["https://allowed.example"],
        bodyLimitBytes: 300
    });
    await instance.listen();
    const port = instance.address()?.port;
    assert.ok(port);

    try {
        assert.equal((await call(port, "POST", "/mcp", mcpHeaders, initializeBody)).status, 401);
        assert.equal(
            (
                await call(
                    port,
                    "POST",
                    "/mcp",
                    { ...mcpHeaders, host: "evil.example", authorization: "Bearer secret" },
                    initializeBody
                )
            ).status,
            403
        );
        assert.equal(
            (
                await call(
                    port,
                    "POST",
                    "/mcp",
                    {
                        ...mcpHeaders,
                        authorization: "Bearer secret",
                        origin: "https://evil.example"
                    },
                    initializeBody
                )
            ).status,
            403
        );
        assert.equal(
            (
                await call(
                    port,
                    "POST",
                    "/mcp",
                    { ...mcpHeaders, authorization: "Bearer secret" },
                    JSON.stringify({ payload: "x".repeat(400) })
                )
            ).status,
            413
        );
    } finally {
        await instance.close();
    }
});

test("non-loopback MCP HTTP requires an authentication token", () => {
    assert.throws(
        () =>
            createMcpHttpServer({} as CanvasClient, {
                host: "0.0.0.0",
                port: 3000,
                authToken: ""
            }),
        /MCP_HTTP_AUTH_TOKEN is required/
    );
});
