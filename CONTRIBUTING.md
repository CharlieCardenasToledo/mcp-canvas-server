# Contributing to Canvas MCP Server

Thank you for your interest in contributing. This project exposes Canvas LMS functionality to AI assistants via the Model Context Protocol.

---

## What to contribute

Good contributions include:

- Bug fixes in existing tools (`src/tools/`)
- New Canvas API endpoints wrapped as MCP tools
- Improvements to the HTTP server or Swagger documentation
- New integration guides for AI clients (Cursor, Copilot, etc.)
- README and documentation improvements

---

## Setup

```bash
git clone https://github.com/CharlieCardenasToledo/mcp-canvas-server.git
cd mcp-canvas-server
npm install
cp .env.example .env   # fill in your CANVAS_API_TOKEN and CANVAS_API_DOMAIN
npm run build
npm start
```

---

## Adding a new tool

1. Identify the Canvas REST API endpoint in the [Canvas API docs](https://canvas.instructure.com/doc/api/).
2. Add the corresponding method to `src/services/canvas-client.ts`.
3. Create or extend the tool file in `src/tools/` using the existing tool pattern.
4. Register the tool in `src/index.ts`.
5. If the tool has an HTTP equivalent, add the route to `src/http-server.ts`.
6. Update the tool count and table in `README.md` and `README.es.md`.

---

## Workflow

1. **Open an issue first** for any non-trivial change.
2. Fork the repo and create a feature branch: `git checkout -b feat/my-tool`
3. Make your changes — keep commits small and focused.
4. Run the type checker before submitting: `npx tsc --noEmit`
5. Build and verify locally: `npm run build && npm start`
6. Open a pull request with a clear description of what changed and why.

---

## Code style

- TypeScript strict mode (`tsconfig.json`)
- One tool file per Canvas domain (assignments, quizzes, groups, etc.)
- Tool names must match the Canvas API resource they wrap as closely as possible
- All tool parameters must use `zod` schema validation
- No `any` types — use the shared types in `src/common/types.ts`

---

## Reporting issues

If a Canvas API call fails or returns unexpected data:

1. Include the Canvas version and institution type (Cloud, Self-Hosted) in the issue
2. Paste the error response (with credentials redacted)
3. Specify which tool triggered the failure

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
