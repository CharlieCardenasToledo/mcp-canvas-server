# Canvas LMS MCP Server

[![npm version](https://img.shields.io/npm/v/@charlie.act7/canvas-mcp-server)](https://www.npmjs.com/package/@charlie.act7/canvas-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for **Canvas LMS**. Lets AI agents (Claude, etc.) interact with your courses, assignments, grades, quizzes, modules, files, and more — all through natural language.

## Install as a Claude Code Plugin

```
/plugin install canvas-lms@claude-community
```

Then set your credentials:

```
/canvas-lms:config
```

Or set them as environment variables (see [Getting Your Canvas Credentials](#getting-your-canvas-credentials)).

## Quick Start (Claude Desktop / other MCP clients)

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

## Getting Your Canvas Credentials

1. Log in to Canvas
2. Go to **Account → Settings**
3. Scroll to **Approved Integrations** → click **New Access Token**
4. Copy the token — you won't see it again

Your domain is the hostname of your Canvas instance, e.g. `myschool.instructure.com`.

| Variable | Example |
|---|---|
| `CANVAS_API_TOKEN` | `1234~abcdefg...` |
| `CANVAS_API_DOMAIN` | `myschool.instructure.com` |

## What You Can Do

Ask Claude things like:

- *"List all my active courses"*
- *"Show me ungraded submissions for Assignment 3 in Biology 101"*
- *"Grade María's essay with a 90 and leave feedback"*
- *"Create a new assignment due next Friday in my Math course"*
- *"List all students in group B of Chemistry"*
- *"Show me the quiz questions for the midterm"*
- *"Send an announcement to all students in my course"*

## Available Tools

| Category | Tools |
|---|---|
| **Courses** | List courses, get course details, set config |
| **Modules** | List and manage course modules |
| **Pages** | List pages, read page content |
| **Files** | List course files |
| **Announcements** | List and create announcements |
| **Assignments** | List, create, and update assignments; bulk update due dates |
| **Submissions** | View student submissions |
| **Grading** | Grade submissions, audit course grades |
| **Quizzes** | List quizzes, manage questions, update dates |
| **Students** | Roster, progress, and student details |
| **Groups** | List and manage student groups |
| **Calendar** | List and create calendar events |
| **Rubrics** | Create and manage grading rubrics |
| **Communication** | Send messages and manage discussions |

## Resources

MCP clients that support resources can access Canvas content directly:

- `canvas://courses/{id}/readme` — Course summary
- `canvas://courses/{id}/pages/{slug}` — Page HTML content

## Local Development

```bash
npm install
npm run build
npm start          # MCP stdio server
npm run start:http # HTTP/Swagger server on http://localhost:3000
```

## License

MIT © Charlie Cárdenas Toledo
