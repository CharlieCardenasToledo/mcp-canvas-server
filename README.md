# Canvas MCP Server

A Model Context Protocol (MCP) server for Canvas LMS. This server allows AI agents to interact with your Canvas courses, assignments, submissions, pages, files, and announcements.

## Features

- **Tools**:
  - `canvas_list_courses`: List active courses.
  - `canvas_list_modules`: List modules and items.
  - `canvas_list_pages` / `canvas_get_page_content`: Read course pages.
  - `canvas_list_files`: List course files.
  - `canvas_list_announcements`: Read announcements.
  - `canvas_get_assignments` / `canvas_get_submissions`: Manage coursework.
  - `canvas_grade_submission`: Grade students (individual or bulk).
  - `canvas_audit_course`: Check for missing submissions.
- **Resources**:
  - `canvas://courses/{id}/readme`: Get a summary of the course.
  - `canvas://courses/{id}/pages/{slug}`: Read a specific page directly.

## Setup

1.  **Get your credentials**:
    - Canvas Domain (e.g., `uide.instructure.com`)
    - API Token (Account -> Settings -> New Access Token)

2.  **Configure Environment**:
    Copy `.env.example` to `.env` and fill in your details:
    ```bash
    cp .env.example .env
    ```
    Edit `.env`:
    ```env
    CANVAS_API_TOKEN=your_token_here
    CANVAS_API_DOMAIN=your_school.instructure.com
    ```

## Usage

### Option 1: Docker (Recommended)

Build and run the container:

```bash
# Build the image
docker compose build

# Run in detached mode
docker compose up -d

# View logs
docker compose logs -f
```

**Note**: The Docker container uses `stdin/stdout` for communication, so "running" it like a service isn't how you typically connect an MCP client *unless* using a bridge. 

**For MCP Clients (Claude Desktop, etc.)**:
You usually run the docker command *directly* in your config.

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "canvas": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e", "CANVAS_API_TOKEN=your_token_here",
        "-e", "CANVAS_API_DOMAIN=your_school.instructure.com",
        "canvas-mcp"
      ]
    }
  }
}
```
*Note: You must build the image first (`docker build -t canvas-mcp .`).*

### Option 2: Running Locally (Node.js)

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

### Option 3: HTTP API for GPT Builder (Fastify + Swagger)

Use this mode when you want OpenAPI/REST for Custom GPT Actions.

```bash
# Install dependencies
npm install

# Build project
npm run build

# Start HTTP API
npm run start:http
```

By default it runs on `http://localhost:3000`:
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

## Resources

You can "read" Canvas content directly if your AI client supports resources:

- `canvas://courses/123/readme` -> Returns course summary.
- `canvas://courses/123/pages/my-page-url` -> Returns page HTML content.
