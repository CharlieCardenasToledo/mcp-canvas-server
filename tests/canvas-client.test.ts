import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { CanvasApiError, CanvasClient } from "../src/services/canvas-client.js";

function startMock(
    handler: (req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse) => void
): Promise<{ server: Server; port: number; origin: string }> {
    return new Promise((resolve, reject) => {
        const server = createServer(handler);
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => {
            const { port } = server.address() as AddressInfo;
            resolve({ server, port, origin: `http://127.0.0.1:${port}` });
        });
    });
}

function sendJson(
    res: import("node:http").ServerResponse,
    status: number,
    data: unknown,
    headers: Record<string, string> = {}
): void {
    res.writeHead(status, { "content-type": "application/json", ...headers });
    res.end(JSON.stringify(data));
}

function testClient(port: number, options: ConstructorParameters<typeof CanvasClient>[2] = {}): CanvasClient {
    return new CanvasClient("t", `http://127.0.0.1:${port}`, {
        autoRenewToken: false,
        allowInsecureScheme: true,
        ...options
    });
}

test("domain normalization rejects insecure schemes, paths, and credentials", () => {
    assert.throws(() => new CanvasClient("t", "http://canvas.example"), /HTTPS/);
    assert.throws(() => new CanvasClient("t", "https://canvas.example/some/path"), /bare origin/);
    assert.throws(() => new CanvasClient("t", "https://user:pass@canvas.example"), /credentials/);
    assert.doesNotThrow(() => new CanvasClient("t", "https://canvas.example"));
    assert.doesNotThrow(() => new CanvasClient("t", "http://localhost:3000", { allowInsecureScheme: true }));
});

test("domain normalization rejects malformed domains", () => {
    assert.throws(() => new CanvasClient("t", "not a url with spaces"), CanvasApiError);
});

test("idempotent GET retries transient failures and succeeds", async () => {
    let attempts = 0;
    const { server, port } = await startMock((_req, res) => {
        attempts += 1;
        if (attempts < 3) {
            sendJson(res, 429, { message: "rate limited" });
        } else {
            sendJson(res, 200, [{ id: 1, name: "Course" }]);
        }
    });
    try {
        const client = testClient(port, { maxRetries: 3 });
        const courses = await client.getCourses();
        assert.equal(courses.length, 1);
        assert.equal(attempts, 3);
    } finally {
        server.close();
    }
});

test("non-idempotent POST is not retried", async () => {
    let attempts = 0;
    const { server, port } = await startMock((_req, res) => {
        attempts += 1;
        sendJson(res, 429, { message: "rate limited" });
    });
    try {
        const client = testClient(port, { maxRetries: 3 });
        await assert.rejects(
            async () => client.createCourse(1, { name: "New Course" }),
            (error: unknown) => error instanceof CanvasApiError && error.kind === "rate_limited"
        );
        assert.equal(attempts, 1);
    } finally {
        server.close();
    }
});

test("exhausted retries surface a rate limited error", async () => {
    const { server, port } = await startMock((_req, res) => {
        sendJson(res, 429, { message: "rate limited" });
    });
    try {
        const client = testClient(port, { maxRetries: 1 });
        await assert.rejects(
            async () => client.getCourses(),
            (error: unknown) => error instanceof CanvasApiError && error.kind === "rate_limited"
        );
    } finally {
        server.close();
    }
});

test("requests that exceed the timeout are classified as timeouts", async () => {
    const { server, port } = await startMock((_req, res) => {
        setTimeout(() => sendJson(res, 200, []), 500);
    });
    try {
        const client = testClient(port, { timeoutMs: 100, maxRetries: 0 });
        await assert.rejects(
            async () => client.getCourses(),
            (error: unknown) => error instanceof CanvasApiError && error.kind === "timeout"
        );
    } finally {
        server.close();
    }
});

test("pagination is bounded by a maximum number of pages", async () => {
    const { server, port } = await startMock((req, res) => {
        const url = new URL(req.url ?? "/", "http://127.0.0.1");
        const page = url.searchParams.get("page") ?? "1";
        sendJson(res, 200, [{ id: Number(page), name: `Course ${page}` }], {
            link: `<http://127.0.0.1:${port}/api/v1/courses?page=${Number(page) + 1}>; rel="next"`
        });
    });
    try {
        const client = testClient(port, { maxPages: 3 });
        await assert.rejects(
            async () => client.getCourses(),
            (error: unknown) => error instanceof CanvasApiError && error.kind === "pagination_limit"
        );
    } finally {
        server.close();
    }
});

test("pagination links to a different origin are rejected", async () => {
    const { server, port } = await startMock((_req, res) => {
        sendJson(res, 200, [{ id: 1, name: "Course" }], {
            link: `<http://evil.example/api/v1/courses?page=2>; rel="next"`
        });
    });
    try {
        const client = testClient(port);
        await assert.rejects(
            async () => client.getCourses(),
            (error: unknown) => error instanceof CanvasApiError && error.kind === "unsafe_domain"
        );
    } finally {
        server.close();
    }
});

test("errors are classified into stable sanitized kinds", async () => {
    const cases: Array<{ status: number; kind: string }> = [
        { status: 401, kind: "auth" },
        { status: 403, kind: "auth" },
        { status: 404, kind: "not_found" },
        { status: 500, kind: "server" },
        { status: 422, kind: "client" }
    ];
    for (const { status, kind } of cases) {
        const { server, port } = await startMock((_req, res) => {
            sendJson(res, status, { message: "boom Bearer secret-token" });
        });
        try {
            const client = testClient(port, { maxRetries: 0 });
            await assert.rejects(
                async () => client.getCourses(),
                (error: unknown) => {
                    if (!(error instanceof CanvasApiError)) return false;
                    assert.equal(error.kind, kind);
                    assert.doesNotMatch(error.message, /secret-token/);
                    return true;
                }
            );
        } finally {
            server.close();
        }
    }
});
