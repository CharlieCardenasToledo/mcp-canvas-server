# Canvas LMS MCP Server — Installation Guide for AI Agents

This server requires two environment variables to function.

## Required Environment Variables

| Variable | Description | Example |
|---|---|---|
| `CANVAS_API_TOKEN` | Canvas LMS personal access token | `1234~abcXYZ...` |
| `CANVAS_API_DOMAIN` | Hostname of the Canvas instance (no `https://`) | `myschool.instructure.com` |

## How to Get a Canvas API Token

1. Log in to Canvas at your institution's URL
2. Click your profile picture → **Settings**
3. Scroll to **Approved Integrations**
4. Click **+ New Access Token**
5. Give it a name and click **Generate Token**
6. Copy the token immediately — it will not be shown again

## MCP Configuration

```json
{
  "mcpServers": {
    "canvas": {
      "command": "npx",
      "args": ["-y", "@charlie.act7/canvas-mcp-server"],
      "env": {
        "CANVAS_API_TOKEN": "<paste token here>",
        "CANVAS_API_DOMAIN": "<your school>.instructure.com"
      }
    }
  }
}
```

## Verification

After installation, ask the AI: *"List my Canvas courses"*. If credentials are correct, it will return your active courses.

## Troubleshooting

- **401 Unauthorized**: Token is invalid or expired — generate a new one in Canvas Settings
- **404 Not Found**: Check that `CANVAS_API_DOMAIN` does not include `https://` — use the hostname only
- **No courses returned**: Ensure you are enrolled in at least one active course as a Teacher or Admin
