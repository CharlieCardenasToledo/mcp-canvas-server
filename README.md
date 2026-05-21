# Canvas MCP Server

[![npm version](https://img.shields.io/npm/v/@charlie.act7/canvas-mcp-server)](https://www.npmjs.com/package/@charlie.act7/canvas-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for **Canvas LMS**. Lets AI agents (Claude, etc.) interact with your courses, assignments, grades, quizzes, modules, files, and more — all through natural language.

## Quick Start (Claude Desktop / Claude Code)

### Option 1: npx (recommended — no install needed)

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "canvas": {
      "command": "npx",
      "args": ["-y", "@charlie.act7/canvas-mcp-server"],
      "env": {
        "CANVAS_API_TOKEN": "your_token_here",
        "CANVAS_API_DOMAIN": "your_school.instructure.com"
      }
    }
  }
}
```

### Option 2: Docker

```json
{
  "mcpServers": {
    "canvas": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "CANVAS_API_TOKEN=your_token_here",
        "-e", "CANVAS_API_DOMAIN=your_school.instructure.com",
        "charliecardenas/canvas-mcp"
      ]
    }
  }
}
```

> **Note:** Build the image first: `docker build -t charliecardenas/canvas-mcp .`

## Getting Your Canvas Credentials

1. Log in to Canvas
2. Go to **Account → Settings**
3. Scroll to **Approved Integrations** → click **New Access Token**
4. Copy the token — you won't see it again

Your domain is the hostname of your Canvas instance (e.g. `uide.instructure.com`).

## Available Tools

| Category | Tools |
|---|---|
| **Courses** | `canvas_list_courses`, `set_canvas_config` |
| **Modules** | `canvas_list_modules` |
| **Pages** | `canvas_list_pages`, `canvas_get_page_content` |
| **Files** | `canvas_list_files` |
| **Announcements** | `canvas_list_announcements` |
| **Assignments** | `canvas_get_assignments`, `canvas_get_submissions` |
| **Grading** | `canvas_grade_submission`, `canvas_audit_course` |
| **Quizzes** | Quiz listing and question management |
| **Students** | Student roster and progress |
| **Groups** | Group management |
| **Calendar** | Calendar events |
| **Rubrics** | Rubric creation and management |
| **Create** | Create assignments, pages, announcements |
| **Communication** | Messaging and discussions |

## Resources

MCP clients that support resources can access Canvas content directly:

- `canvas://courses/{id}/readme` — Course summary
- `canvas://courses/{id}/pages/{slug}` — Page HTML content

## Local Development

```bash
# Install dependencies
npm install

# Configure credentials interactively
npx canvas-mcp config

# Build
npm run build

# Start MCP server (stdio)
npm start

# Start HTTP API (for GPT Builder / OpenAPI)
npm run start:http
```

The HTTP server runs on `http://localhost:3000`:
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

## Deploy on Render

This repo includes `render.yaml` for one-click deploy as a Web Service.

Required environment variables:
- `CANVAS_API_TOKEN`
- `CANVAS_API_DOMAIN` (e.g. `your-school.instructure.com`)

## License

MIT © Charlie Cárdenas Toledo
