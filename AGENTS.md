# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains all TypeScript source code.
- `src/index.ts` is the MCP server entrypoint and CLI bootstrap.
- `src/tools/` holds Canvas tool groups (`course`, `assignment`, `grading`, `communication`).
- `src/services/` contains API client logic (`canvas-client.ts`).
- `src/resources/`, `src/prompts/`, and `src/common/` provide MCP resources/prompts and shared types/config helpers.
- `dist/` is compiled output from `tsc`; treat it as build artifacts, not primary edit targets.
- Root files: `.env.example` for config template, `Dockerfile` and `docker-compose.yml` for container execution.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run build`: compile TypeScript from `src/` to `dist/`.
- `npm run dev`: run `tsc --watch` for incremental compilation.
- `npm start`: start the MCP server from `dist/index.js`.
- `npm run chat`: run the local bridge script (`src/ollama_bridge.ts`) with `tsx`.
- `docker compose build` / `docker compose up -d`: build and run containerized server.

## Coding Style & Naming Conventions
- Language: TypeScript (ES modules, `NodeNext`, `strict: true`).
- Use 4-space indentation and trailing semicolons, matching current files.
- Filenames use kebab-case (example: `canvas-client.ts`).
- Use `PascalCase` for classes/types, `camelCase` for functions/variables, and explicit named exports for shared modules.
- Keep tool handlers modular: add new Canvas capabilities under `src/tools/` and aggregate in `src/index.ts`.

## Testing Guidelines
- No formal test framework is currently configured (`npm test` is not defined).
- Minimum validation for changes:
  1. `npm run build` succeeds with zero TypeScript errors.
  2. Start locally with valid `.env` values and verify key MCP flows.
- If adding tests, place them near source as `*.test.ts` or in a dedicated `tests/` directory and document the run command.

## Commit & Pull Request Guidelines
- Git history is not available in this workspace snapshot; use Conventional Commit style going forward.
- Commit format: `type(scope): short description` (example: `feat(tools): add discussion listing endpoint`).
- PRs should include:
  - Purpose and behavioral summary.
  - Linked issue/task reference.
  - Local validation steps and results (`npm run build`, smoke checks).
  - Config/env impacts (new variables, permission scope, Canvas API changes).