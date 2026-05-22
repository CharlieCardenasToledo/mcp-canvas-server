# 🎓 Canvas LMS MCP Server

[![npm version](https://img.shields.io/npm/v/@charlie.act7/canvas-mcp-server)](https://www.npmjs.com/package/@charlie.act7/canvas-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Bring AI to your Canvas Virtual Classroom! 🚀

This project is a **Model Context Protocol (MCP)** server for **Canvas LMS**. It acts as a bridge that allows AI assistants (like Claude Desktop, Claude Code, Cursor, etc.) to query and manage your Canvas courses using natural language.

---

## Table of Contents
- [How It Works](#how-it-works)
- [Use Cases & Examples](#use-cases--examples)
- [Setup Guide](#setup-guide)
  - [Step 1: Obtain Canvas Credentials](#step-1-obtain-canvas-credentials)
  - [Step 2: Connect to your AI Client](#step-2-connect-to-your-ai-client)
- [CLI Configuration](#cli-configuration)
- [Supported Tools & Resources](#supported-tools--resources)
- [Local Development](#local-development)
- [License](#license)

---

## How It Works

When you interact with the server, communication flows as follows:

```mermaid
graph LR
    User([User]) -->|Natural Language Instruction| AI["AI Assistant (e.g., Claude)"]
    AI -->|MCP Request| MCP["Canvas MCP Server"]
    MCP -->|REST API - HTTPS| Canvas["Canvas LMS"]
    Canvas -->|Response| MCP
    MCP -->|Processed Data| AI
    AI -->|Friendly Answer| User
```

1. **You ask the AI** (e.g., *"Create an assignment due next Friday"*).
2. **The AI detects your intent** and communicates with the **Canvas MCP Server**, sending the required parameters.
3. **The server makes a secure call** to the official Canvas API.
4. **Canvas processes the action** and returns the response.
5. **The AI confirms the success of the action** back to you in plain, natural language.

---

## Use Cases & Examples

Here are some realistic, everyday prompts you can use with your AI assistant:

> [!TIP]
> **Token Saving & Efficiency:** Whenever possible, specify the Canvas ID or the direct Canvas URL (e.g., `https://[your_institution].instructure.com/courses/[course_id]/assignments/[assignment_id]`) in your prompts. This prevents the AI from scanning all your courses/resources, leading to faster responses and substantial token savings.

### 📖 Course Auditing & Querying
* 💬 *"What active courses do I have this semester? Check if there are multiple active sections/parallels."*
* 💬 *"Show me all ungraded submissions for 'PE-2.1: Sorting Algorithms' in Programming 101."*
* 💬 *"Who is in Student Group B for the Physics class?"*
* 💬 *"Does the assignment 'PE-2.1' have an active rubric associated? If so, retrieve its criteria."*

### ✍️ Creating & Organizing Course Content
* 💬 *"Create a new module named 'Week 4: Data Structures' in my course."*
* 💬 *"Add a SubHeader 'LEARNING RESOURCES' inside the 'Week 4' module, and link the study materials page to it."*
* 💬 *"In my Programming course, create an assignment called 'PE-2.1: Sorting Algorithms'. Add an instructions table with columns for Activity, Specific Instructions, and Deliverable."*

### 💯 Grading & Absence Management
* 💬 *"For assignment 'PE-2.1', find all students who haven't submitted their work. Assign them a grade of 0 and add the comment: 'Student was absent. To recover this activity, please contact the instructor.'"*
* 💬 *"Grade Maria's submission for 'PE-2.1' with a 90 based on the rubric, and add a comment: 'Great job! The analysis of sorting algorithms is correct, though the complexity analysis could be deeper. Keep it up!'"*

---

## Setup Guide

To connect your AI assistant to Canvas, you need to configure **two things**: your Canvas credentials and your AI client (like Claude).

### Step 1: Obtain Canvas Credentials
To let the server act on your behalf, it needs permission:
1. Log in to your **Canvas LMS** account.
2. Go to **Account** ➡️ **Settings** in the sidebar menu.
3. Scroll down to the **Approved Integrations** section and click **+ New Access Token**.
4. Enter a purpose (e.g., "Claude Assistant") and click **Generate Token**.
5. **Copy the generated token immediately** and store it somewhere safe (you won't be able to see it again after closing the page).

> [!IMPORTANT]
> You will also need your Canvas Domain. This is the web address of your school/university, for example: `myschool.instructure.com`.

---

### Step 2: Connect to your AI Client

#### Option A: Claude Desktop (Desktop Application)
1. Open your Claude Desktop configuration file. On Windows, it is located at:
   `%APPDATA%\Claude\claude_desktop_config.json`
   *(On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`)*
2. Add the Canvas server configuration under `mcpServers`:

```json
{
  "mcpServers": {
    "canvas": {
      "command": "npx",
      "args": ["-y", "@charlie.act7/canvas-mcp-server"],
      "env": {
        "CANVAS_API_TOKEN": "YOUR_ACCESS_TOKEN_HERE",
        "CANVAS_API_DOMAIN": "myschool.instructure.com"
      }
    }
  }
}
```
3. Save the file and restart Claude Desktop. You will see a socket/plug icon indicating the server is successfully connected.

#### Option B: Claude Code (Terminal CLI)
If you are using the Claude Code terminal tool, install the plugin by running:
```bash
/plugin install canvas-lms@claude-community
```
Then, configure your credentials interactively:
```bash
/canvas-lms:config
```

---

## CLI Configuration
If you prefer to configure your credentials locally for development, run:
```bash
npx @charlie.act7/canvas-mcp-server config
```
This will guide you step-by-step to input your domain and API token, storing them securely in a local configuration file.

---

## Supported Tools & Resources

<details>
<summary><b>View Detailed List of Supported Tools & Resources (Technical)</b></summary>

### Tools List

The server exposes the following tools organized by category:

| Category | Included Tools |
|---|---|
| **Courses** | List courses, get course details, set basic configuration |
| **Modules** | List and manage course modules |
| **Pages** | List pages, read page content HTML |
| **Files** | List files uploaded to a course |
| **Announcements** | List and create announcements |
| **Assignments** | List, create, and update assignments; bulk update due dates |
| **Submissions** | View student submissions and attachments |
| **Grading** | Grade submissions, audit course grades |
| **Quizzes** | List quizzes, manage questions, update quiz dates |
| **Students** | Course roster, progress tracking, and student details |
| **Groups** | List and manage student groups |
| **Calendar** | List and create calendar events/reminders |
| **Rubrics** | Create and manage grading rubrics |
| **Communication** | Send direct messages, manage discussions and threads |

### Supported MCP Resources
For clients supporting direct resources:
* `canvas://courses/{id}/readme` — Formatted course summary.
* `canvas://courses/{id}/pages/{slug}` — Direct HTML content of Canvas pages.
</details>

---

## Local Development

To clone this repository and modify the code:

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Build the Project (TypeScript to JavaScript):**
   ```bash
   npm run build
   ```
3. **Start Server in Stdio Mode (MCP):**
   ```bash
   npm start
   ```
4. **Start HTTP Server with Swagger Documentation:**
   If you want to use this as an OpenAI GPT Custom Action, spin up the web server with:
   ```bash
   npm run start:http
   ```
   Then visit `http://localhost:3000` to view the interactive Swagger interface.

---

## License
This project is licensed under the MIT License. Created by [Charlie Cárdenas Toledo](https://github.com/charlie-act7).
