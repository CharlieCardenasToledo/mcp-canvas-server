# Canvas LMS MCP Server — Master AI Client & Editor Integration Guide

Comprehensive configuration instructions for connecting **Canvas LMS MCP Server** (`@charlie.act7/canvas-mcp-server`) to every major AI assistant, IDE, editor, and framework supporting the **Model Context Protocol (MCP)** or **REST APIs**.

---

## Required Credentials & Environment Variables

Every client configuration requires these core parameters:

| Variable | Required | Description | Example |
|---|---|---|---|
| `CANVAS_API_TOKEN` | **Yes** | Your Canvas LMS personal access token. | `1234~abcXYZ...` |
| `CANVAS_API_DOMAIN` | **Yes** | Domain of your Canvas instance (no `https://` prefix or trailing `/`). | `myschool.instructure.com` |
| `CANVAS_TOKEN_AUTO_RENEW` | Optional | Auto-regenerate expiring token within threshold (`true`/`false`, default: `true`). | `true` |
| `CANVAS_TOKEN_RENEW_THRESHOLD_HOURS` | Optional | Hours before token expiration to trigger auto-renewal (default: `24`). | `24` |

### How to Obtain Your Canvas Access Token
1. Log in to your institution's **Canvas LMS** platform (e.g. `https://myschool.instructure.com`).
2. Navigate to **Account** > **Settings** in the left sidebar.
3. Scroll down to **Approved Integrations** and click **+ New Access Token**.
4. Set a purpose (e.g. `Canvas MCP AI Assistant`) and click **Generate Token**.
5. Copy the full token string immediately (it will not be shown again).

---

## Supported AI Editors & Clients

- [1. Claude Code (CLI)](#1-claude-code-cli)
- [2. Claude Desktop (macOS & Windows)](#2-claude-desktop-macos--windows)
- [3. Cursor Editor](#3-cursor-editor)
- [4. Windsurf Editor (Codeium)](#4-windsurf-editor-codeium)
- [5. Cline (VS Code Extension)](#5-cline-vs-code-extension)
- [6. Roo Code (VS Code Extension)](#6-roo-code-vs-code-extension)
- [7. GitHub Copilot in VS Code](#7-github-copilot-in-vs-code)
- [8. Continue.dev (VS Code, JetBrains, Neovim)](#8-continuedev-vs-code-jetbrains-neovim)
- [9. Zed Editor](#9-zed-editor)
- [10. Codex CLI](#10-codex-cli)
- [11. LibreChat](#11-librechat)
- [12. OpenAI Custom GPTs (Web Action)](#12-openai-custom-gpts-web-action)
- [13. n8n, Zapier, Make & Hosted Agents](#13-n8n-zapier-make--hosted-agents)
- [14. Ollama & Local LLMs](#14-ollama--local-llms)

---

### 1. Claude Code (CLI)

#### Automatic CLI Command:
```bash
claude mcp add canvas \
  --env CANVAS_API_TOKEN=YOUR_ACCESS_TOKEN_HERE \
  --env CANVAS_API_DOMAIN=myschool.instructure.com \
  -- npx -y @charlie.act7/canvas-mcp-server@latest
```

#### Manual File Configuration (`~/.claude.json`):
Add under `mcpServers`:
```json
{
  "mcpServers": {
    "canvas": {
      "command": "npx",
      "args": ["-y", "@charlie.act7/canvas-mcp-server@latest"],
      "env": {
        "CANVAS_API_TOKEN": "YOUR_ACCESS_TOKEN_HERE",
        "CANVAS_API_DOMAIN": "myschool.instructure.com"
      }
    }
  }
}
```

---

### 2. Claude Desktop (macOS & Windows)

#### File Locations:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

#### Configuration:
```json
{
  "mcpServers": {
    "canvas": {
      "command": "npx",
      "args": ["-y", "@charlie.act7/canvas-mcp-server@latest"],
      "env": {
        "CANVAS_API_TOKEN": "YOUR_ACCESS_TOKEN_HERE",
        "CANVAS_API_DOMAIN": "myschool.instructure.com"
      }
    }
  }
}
```
*After saving, restart Claude Desktop. You will see 117 connected tools.*

---

### 3. Cursor Editor

#### Option A: Settings UI
1. Open **Cursor Settings** (⌘+`:` or Ctrl+`,`) > **Features** > **MCP**.
2. Click **+ Add New MCP Server**.
3. Name: `canvas`
4. Type: `command` (stdio)
5. Command: `npx -y @charlie.act7/canvas-mcp-server@latest`
6. Environment Variables:
   - `CANVAS_API_TOKEN`: `YOUR_ACCESS_TOKEN_HERE`
   - `CANVAS_API_DOMAIN`: `myschool.instructure.com`

#### Option B: Configuration File (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "canvas": {
      "command": "npx",
      "args": ["-y", "@charlie.act7/canvas-mcp-server@latest"],
      "env": {
        "CANVAS_API_TOKEN": "YOUR_ACCESS_TOKEN_HERE",
        "CANVAS_API_DOMAIN": "myschool.instructure.com"
      }
    }
  }
}
```

---

### 4. Windsurf Editor (Codeium)

#### File Location:
- **Windows**: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`
- **macOS / Linux**: `~/.codeium/windsurf/mcp_config.json`

#### Configuration:
```json
{
  "mcpServers": {
    "canvas": {
      "command": "npx",
      "args": ["-y", "@charlie.act7/canvas-mcp-server@latest"],
      "env": {
        "CANVAS_API_TOKEN": "YOUR_ACCESS_TOKEN_HERE",
        "CANVAS_API_DOMAIN": "myschool.instructure.com"
      }
    }
  }
}
```

---

### 5. Cline (VS Code Extension)

#### Option A: Extension UI
1. Click the **Cline** icon in the VS Code sidebar.
2. Click the **MCP Servers** tab > **Configure MCP Servers**.
3. Edit `cline_mcp_settings.json`.

#### Option B: Settings File Path:
- **Windows**: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- **macOS**: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "canvas": {
      "command": "npx",
      "args": ["-y", "@charlie.act7/canvas-mcp-server@latest"],
      "env": {
        "CANVAS_API_TOKEN": "YOUR_ACCESS_TOKEN_HERE",
        "CANVAS_API_DOMAIN": "myschool.instructure.com"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

---

### 6. Roo Code (VS Code Extension)

#### File Path:
- **Windows**: `%APPDATA%\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\mcp.json`
- **macOS**: `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp.json`

```json
{
  "mcpServers": {
    "canvas": {
      "command": "npx",
      "args": ["-y", "@charlie.act7/canvas-mcp-server@latest"],
      "env": {
        "CANVAS_API_TOKEN": "YOUR_ACCESS_TOKEN_HERE",
        "CANVAS_API_DOMAIN": "myschool.instructure.com"
      }
    }
  }
}
```

---

### 7. GitHub Copilot in VS Code

Add to workspace `.vscode/mcp.json` or User Settings (`settings.json`):

```json
{
  "github.copilot.mcpServers": {
    "canvas": {
      "command": "npx",
      "args": ["-y", "@charlie.act7/canvas-mcp-server@latest"],
      "env": {
        "CANVAS_API_TOKEN": "YOUR_ACCESS_TOKEN_HERE",
        "CANVAS_API_DOMAIN": "myschool.instructure.com"
      }
    }
  }
}
```

---

### 8. Continue.dev (VS Code, JetBrains, Neovim)

File location: `~/.continue/config.json`

Add to `experimental.modelContextProtocolServers`:

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["-y", "@charlie.act7/canvas-mcp-server@latest"],
          "env": {
            "CANVAS_API_TOKEN": "YOUR_ACCESS_TOKEN_HERE",
            "CANVAS_API_DOMAIN": "myschool.instructure.com"
          }
        }
      }
    ]
  }
}
```

---

### 9. Zed Editor

File location: `~/.config/zed/settings.json` (macOS/Linux) or `%APPDATA%\Zed\settings.json` (Windows)

```json
{
  "context_servers": {
    "canvas": {
      "command": {
        "path": "npx",
        "args": ["-y", "@charlie.act7/canvas-mcp-server@latest"],
        "env": {
          "CANVAS_API_TOKEN": "YOUR_ACCESS_TOKEN_HERE",
          "CANVAS_API_DOMAIN": "myschool.instructure.com"
        }
      }
    }
  }
}
```

---

### 10. Codex CLI

Run in terminal:

```bash
codex mcp add canvas \
  --env CANVAS_API_TOKEN=YOUR_ACCESS_TOKEN_HERE \
  --env CANVAS_API_DOMAIN=myschool.instructure.com \
  npx -y @charlie.act7/canvas-mcp-server@latest
```

---

### 11. LibreChat

File location: `librechat.yaml`

```yaml
mcpServers:
  canvas:
    command: "npx"
    args:
      - "-y"
      - "@charlie.act7/canvas-mcp-server@latest"
    env:
      CANVAS_API_TOKEN: "YOUR_ACCESS_TOKEN_HERE"
      CANVAS_API_DOMAIN: "myschool.instructure.com"
```

---

### 12. OpenAI Custom GPTs (Web Action)

If you are creating an OpenAI Custom GPT Action:

1. Launch the HTTP server mode:
   ```bash
   npx -y @charlie.act7/canvas-mcp-server serve-http --port 3000 --host 0.0.0.0
   ```
2. In your Custom GPT builder, go to **Actions** > **Import from URL**.
3. Input your public server endpoint or local proxy OpenAPI schema:
   `http://localhost:3000/documentation/json`
4. Set API key authentication using `Bearer` token mode matching `CANVAS_API_TOKEN`.

---

### 13. n8n, Zapier, Make & Hosted Agents

Run the server in HTTP mode:

```bash
CANVAS_API_TOKEN=YOUR_ACCESS_TOKEN_HERE \
CANVAS_API_DOMAIN=myschool.instructure.com \
npx -y @charlie.act7/canvas-mcp-server serve-http --port 3000 --host 0.0.0.0
```

- **Interactive Swagger UI**: `http://localhost:3000`
- **REST Endpoints**: `/api/v1/tools/*`
- Send standard HTTP `POST` JSON payloads to execute Canvas MCP tools programmatically.

---

### 14. Ollama & Local LLMs

The repository includes a standalone Ollama bridge script:

```bash
CANVAS_API_TOKEN=YOUR_ACCESS_TOKEN_HERE \
CANVAS_API_DOMAIN=myschool.instructure.com \
npm run chat
```

Supports local models such as `llama3`, `qwen2.5`, and `mistral`.

---

## Verification & Diagnostics

Once installed in your chosen AI client, ask:
> *"List my active Canvas courses"*

If properly configured, the assistant will call the `list_courses` tool and output your course roster.

### Common Troubleshooting Steps

| Issue | Root Cause | Solution |
|---|---|---|
| **401 Unauthorized** | Invalid or expired token | Generate a new token in Canvas Account > Settings > Approved Integrations. |
| **404 Not Found** | Incorrect domain format | Remove `https://` and trailing slashes from `CANVAS_API_DOMAIN` (use `myschool.instructure.com`). |
| **No courses returned** | Roster permissions | Ensure your Canvas account is actively enrolled in at least one course as Teacher, Student, or Admin. |
| **Token Expiry** | Auto-renewal active | Keep server running before token expires so auto-renewal can persist the new token. |
