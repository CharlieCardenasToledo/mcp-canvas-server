import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "./common/tool-model.js";
import { createMcpServer } from "./server-factory.js";
import type { CanvasClient } from "./services/canvas-client.js";

const MINUTE_MS = 60_000;

interface SessionEntry {
    transport: StreamableHTTPServerTransport;
    server: ReturnType<typeof createMcpServer>;
    lastSeen: number;
}

interface RateEntry {
    count: number;
    resetAt: number;
}

export interface McpHttpServerOptions {
    host?: string;
    port?: number;
    tools?: ToolDefinition[];
    authToken?: string;
    allowedHosts?: string[];
    allowedOrigins?: string[];
    bodyLimitBytes?: number;
    maxSessions?: number;
    sessionTimeoutMs?: number;
    rateLimitPerMinute?: number;
}

export interface McpHttpServer {
    readonly server: HttpServer;
    readonly sessions: ReadonlyMap<string, SessionEntry>;
    listen(): Promise<void>;
    close(): Promise<void>;
    address(): { host: string; port: number } | undefined;
}

class BodyTooLargeError extends Error {}

function envInteger(name: string, fallback: number, minimum = 1): number {
    const raw = process.env[name];
    if (raw === undefined) return fallback;
    const value = Number.parseInt(raw, 10);
    if (!Number.isSafeInteger(value) || value < minimum) {
        throw new Error(`${name} must be an integer greater than or equal to ${minimum}.`);
    }
    return value;
}

function splitList(value: string | undefined): string[] | undefined {
    const values = value
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    return values?.length ? values : undefined;
}

function isLoopback(host: string): boolean {
    const value = host
        .trim()
        .toLowerCase()
        .replace(/^\[|\]$/g, "");
    return value === "localhost" || value === "::1" || value.startsWith("127.");
}

function constantTimeEqual(actual: string, expected: string): boolean {
    const actualHash = createHash("sha256").update(actual).digest();
    const expectedHash = createHash("sha256").update(expected).digest();
    return timingSafeEqual(actualHash, expectedHash);
}

function getHeader(request: IncomingMessage, name: string): string | undefined {
    const value = request.headers[name];
    return Array.isArray(value) ? value[0] : value;
}

function isAllowedHost(value: string, allowedHosts: ReadonlySet<string>): boolean {
    if (allowedHosts.has(value)) return true;
    try {
        return allowedHosts.has(new URL(`http://${value}`).hostname.toLowerCase());
    } catch {
        return false;
    }
}

function getBearerToken(request: IncomingMessage): string | undefined {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) return undefined;
    return authorization.slice(7).trim() || undefined;
}

function sendJson(response: ServerResponse, status: number, value: unknown): void {
    if (response.headersSent) return;
    response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(value));
}

function sendRpcError(response: ServerResponse, status: number, message: string): void {
    sendJson(response, status, {
        jsonrpc: "2.0",
        error: { code: -32000, message },
        id: null
    });
}

async function readJsonBody(request: IncomingMessage, limit: number): Promise<unknown> {
    const declaredLength = Number.parseInt(request.headers["content-length"] ?? "0", 10);
    if (Number.isFinite(declaredLength) && declaredLength > limit) throw new BodyTooLargeError();

    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        length += buffer.length;
        if (length > limit) throw new BodyTooLargeError();
        chunks.push(buffer);
    }
    return length === 0 ? undefined : JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function defaultHosts(host: string, port: number): string[] {
    const values = new Set([host, `${host}:${port}`]);
    if (isLoopback(host)) {
        for (const loopback of ["localhost", "127.0.0.1", "[::1]"]) {
            values.add(loopback);
            values.add(`${loopback}:${port}`);
        }
    }
    return [...values].map((value) => value.toLowerCase());
}

function defaultOrigins(host: string, port: number): string[] {
    if (!isLoopback(host)) return [];
    return ["localhost", "127.0.0.1", "[::1]"].flatMap((loopback) => [
        `http://${loopback}:${port}`,
        `https://${loopback}:${port}`
    ]);
}

export function createMcpHttpServer(client: CanvasClient, options: McpHttpServerOptions = {}): McpHttpServer {
    const host = options.host ?? "127.0.0.1";
    const port = options.port ?? 3000;
    const tools = options.tools ?? [];
    const authToken = options.authToken ?? process.env.MCP_HTTP_AUTH_TOKEN;
    const bodyLimit = options.bodyLimitBytes ?? envInteger("MCP_HTTP_BODY_LIMIT_BYTES", 1024 * 1024);
    const maxSessions = options.maxSessions ?? envInteger("MCP_HTTP_MAX_SESSIONS", 100);
    const sessionTimeoutMs =
        options.sessionTimeoutMs ?? envInteger("MCP_HTTP_SESSION_TIMEOUT_MS", 30 * MINUTE_MS, 1000);
    const rateLimit = options.rateLimitPerMinute ?? envInteger("MCP_HTTP_RATE_LIMIT_PER_MINUTE", 120);
    const allowedHosts = new Set(
        (options.allowedHosts ?? splitList(process.env.MCP_HTTP_ALLOWED_HOSTS) ?? defaultHosts(host, port)).map(
            (value) => value.toLowerCase()
        )
    );
    const allowedOrigins = new Set(
        (options.allowedOrigins ?? splitList(process.env.MCP_HTTP_ALLOWED_ORIGINS) ?? defaultOrigins(host, port)).map(
            (value) => value.toLowerCase()
        )
    );

    if (!Number.isSafeInteger(port) || port < 0 || port > 65535) {
        throw new Error("MCP HTTP port must be an integer between 0 and 65535.");
    }
    if (!isLoopback(host) && !authToken) {
        throw new Error("MCP_HTTP_AUTH_TOKEN is required when MCP HTTP binds to a non-loopback host.");
    }

    const sessions = new Map<string, SessionEntry>();
    const rates = new Map<string, RateEntry>();

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const httpServer = createServer(async (request, response) => {
        try {
            const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
            if (url.pathname === "/healthz" && request.method === "GET") {
                sendJson(response, 200, { ok: true });
                return;
            }
            if (url.pathname !== "/mcp") {
                sendJson(response, 404, { error: "Not found" });
                return;
            }
            if (!request.method || !["POST", "GET", "DELETE"].includes(request.method)) {
                response.setHeader("allow", "POST, GET, DELETE");
                sendJson(response, 405, { error: "Method not allowed" });
                return;
            }

            const requestHost = getHeader(request, "host")?.toLowerCase();
            if (!requestHost || !isAllowedHost(requestHost, allowedHosts)) {
                sendJson(response, 403, { error: "Host is not allowed" });
                return;
            }
            const origin = getHeader(request, "origin")?.toLowerCase();
            if (origin && !allowedOrigins.has(origin)) {
                sendJson(response, 403, { error: "Origin is not allowed" });
                return;
            }
            const suppliedToken = getBearerToken(request);
            if (authToken && (!suppliedToken || !constantTimeEqual(suppliedToken, authToken))) {
                response.setHeader("www-authenticate", "Bearer");
                sendJson(response, 401, { error: "Unauthorized" });
                return;
            }

            const now = Date.now();
            const tokenKey = suppliedToken ? createHash("sha256").update(suppliedToken).digest("hex") : "anonymous";
            const rateKey = `${request.socket.remoteAddress ?? "unknown"}:${tokenKey}`;
            const currentRate = rates.get(rateKey);
            if (!currentRate || currentRate.resetAt <= now) {
                rates.set(rateKey, { count: 1, resetAt: now + MINUTE_MS });
            } else if (currentRate.count >= rateLimit) {
                response.setHeader("retry-after", Math.max(1, Math.ceil((currentRate.resetAt - now) / 1000)));
                sendJson(response, 429, { error: "Rate limit exceeded" });
                return;
            } else {
                currentRate.count += 1;
            }

            const sessionId = getHeader(request, "mcp-session-id");
            const entry = sessionId ? sessions.get(sessionId) : undefined;

            if (request.method === "POST") {
                let body: unknown;
                try {
                    body = await readJsonBody(request, bodyLimit);
                } catch (error: unknown) {
                    if (error instanceof BodyTooLargeError) {
                        sendJson(response, 413, { error: "Request body is too large" });
                    } else {
                        sendRpcError(response, 400, "Invalid JSON body");
                    }
                    return;
                }

                if (!entry && !sessionId && isInitializeRequest(body)) {
                    if (sessions.size >= maxSessions) {
                        sendJson(response, 503, { error: "Maximum active sessions reached" });
                        return;
                    }

                    const mcpServer = createMcpServer(client, tools);
                    const transport = new StreamableHTTPServerTransport({
                        sessionIdGenerator: randomUUID,
                        onsessioninitialized: (newSessionId) => {
                            sessions.set(newSessionId, {
                                transport,
                                server: mcpServer,
                                lastSeen: Date.now()
                            });
                        },
                        onsessionclosed: (closedSessionId) => {
                            sessions.delete(closedSessionId);
                        }
                    });
                    transport.onclose = () => {
                        if (transport.sessionId) sessions.delete(transport.sessionId);
                    };
                    await mcpServer.connect(transport);
                    await transport.handleRequest(request, response, body);
                    return;
                }

                if (!entry) {
                    sendRpcError(response, sessionId ? 404 : 400, "Invalid or missing MCP session ID");
                    return;
                }
                entry.lastSeen = now;
                await entry.transport.handleRequest(request, response, body);
                return;
            }

            if (!entry) {
                sendRpcError(response, 404, "Invalid or missing MCP session ID");
                return;
            }
            entry.lastSeen = now;
            await entry.transport.handleRequest(request, response);
        } catch (error: unknown) {
            console.error(`[canvas-mcp:http] ${error instanceof Error ? error.message : "Unexpected request error"}`);
            sendRpcError(response, 500, "Internal server error");
        }
    });

    const cleanupInterval = setInterval(
        () => {
            const expiry = Date.now() - sessionTimeoutMs;
            for (const [sessionId, entry] of sessions) {
                if (entry.lastSeen >= expiry) continue;
                sessions.delete(sessionId);
                void entry.server.close().catch(() => undefined);
            }
            for (const [key, entry] of rates) {
                if (entry.resetAt <= Date.now()) rates.delete(key);
            }
        },
        Math.min(sessionTimeoutMs, MINUTE_MS)
    );
    cleanupInterval.unref();

    return {
        server: httpServer,
        sessions,
        listen: () =>
            new Promise<void>((resolve, reject) => {
                httpServer.once("error", reject);
                httpServer.listen(port, host, () => {
                    httpServer.off("error", reject);
                    resolve();
                });
            }),
        close: async () => {
            clearInterval(cleanupInterval);
            const activeServers = [...sessions.values()].map((entry) => entry.server);
            sessions.clear();
            await Promise.allSettled(activeServers.map((server) => server.close()));
            if (!httpServer.listening) return;
            await new Promise<void>((resolve, reject) => {
                httpServer.close((error) => (error ? reject(error) : resolve()));
            });
        },
        address: () => {
            const address = httpServer.address();
            if (!address || typeof address === "string") return undefined;
            return { host: address.address, port: address.port };
        }
    };
}

export async function startMcpHttpServer(client: CanvasClient, options: McpHttpServerOptions = {}): Promise<void> {
    const instance = createMcpHttpServer(client, options);
    await instance.listen();
    const address = instance.address();
    console.error(
        `Canvas MCP Streamable HTTP server listening on http://${address?.host ?? options.host}:${address?.port ?? options.port}/mcp`
    );

    let closing = false;
    const shutdown = (): void => {
        if (closing) return;
        closing = true;
        void instance
            .close()
            .catch((error: unknown) => {
                console.error(`[canvas-mcp:http] ${error instanceof Error ? error.message : "Shutdown failed"}`);
                process.exitCode = 1;
            })
            .finally(() => {
                process.off("SIGINT", shutdown);
                process.off("SIGTERM", shutdown);
            });
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
