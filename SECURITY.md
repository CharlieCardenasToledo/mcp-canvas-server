# Security Policy

## Supported versions

Only the latest published version on npm receives security fixes.
Older versions are not patched.

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Send a private report through GitHub's
[Security Advisories](https://github.com/CharlieCardenasToledo/mcp-canvas-server/security/advisories/new)
feature. Include:

- a clear description of the vulnerability;
- steps to reproduce or a proof-of-concept;
- the version(s) affected;
- any suggested mitigation.

You will receive an acknowledgment within **5 business days** and a status
update within **10 business days**. Critical vulnerabilities will be patched
as soon as possible and disclosed publicly via a GitHub Security Advisory
once a fix is released.

## Scope

This project is an MCP server that bridges an AI assistant to a Canvas LMS
instance. Relevant attack surfaces include:

- **Token exposure** — the Canvas access token must never appear in logs,
  tool results, error messages, or network responses.
- **Remote bind without auth** — `serve-http` must not accept connections
  from outside loopback without a valid Bearer token
  (`MCP_HTTP_AUTH_TOKEN`).
- **Unsafe domains** — the client rejects non-HTTPS schemes, embedded
  credentials, and paths unless explicitly opted in.
- **Pagination link injection** — next-page URLs are validated to share the
  configured Canvas origin.
- **Path traversal** — file tools require `CANVAS_FILE_ROOT` and confine
  all paths within it after resolving symlinks.
- **Credential tools** — disabled by default; enabled only via
  `CANVAS_ENABLE_CREDENTIAL_TOOLS=true`.

## Out of scope

- Vulnerabilities in Canvas LMS itself.
- Issues in third-party dependencies that have an upstream fix already
  published and simply require a dependency bump (open a regular issue or
  PR instead).
- Attacks requiring physical access to the host machine.

## Security-sensitive environment variables

| Variable                         | Purpose                                    | Default                        |
| -------------------------------- | ------------------------------------------ | ------------------------------ |
| `MCP_HTTP_AUTH_TOKEN`            | Bearer token for remote MCP HTTP bind      | — (required when not loopback) |
| `REST_AUTH_TOKEN`                | Bearer token for REST API bind             | — (required when not loopback) |
| `CANVAS_ENABLE_CREDENTIAL_TOOLS` | Enable access-token management tools       | `false`                        |
| `CANVAS_ENABLE_FILE_TOOLS`       | Enable file upload/download tools          | `false`                        |
| `CANVAS_READ_ONLY`               | Restrict all tools to read-only operations | `true`                         |
| `CANVAS_TOKEN_AUTO_RENEW`        | Automatically regenerate expiring tokens   | `false`                        |
| `CANVAS_REQUEST_TIMEOUT_MS`      | Per-request timeout in milliseconds        | `30000`                        |

## Dependency updates

Dependabot is configured to open weekly pull requests for npm and
GitHub Actions dependencies. Security-relevant updates are prioritized.
Run `npm audit --audit-level=high` locally before any release.
