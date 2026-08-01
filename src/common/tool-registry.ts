import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { accessTokenTools } from "../tools/access-token-tools.js";
import { analyticsTools } from "../tools/analytics-tools.js";
import { assignmentTools } from "../tools/assignment-tools.js";
import { calendarTools } from "../tools/calendar-tools.js";
import { communicationTools } from "../tools/communication-tools.js";
import { configTools } from "../tools/config-tools.js";
import { conversationTools } from "../tools/conversation-tools.js";
import { courseTools } from "../tools/course-tools.js";
import { createTools } from "../tools/create-tools.js";
import { enrollmentTools } from "../tools/enrollment-tools.js";
import { fileTools } from "../tools/file-tools.js";
import { gradingTools } from "../tools/grading-tools.js";
import { groupTools } from "../tools/group-tools.js";
import { moduleTools } from "../tools/module-tools.js";
import { newQuizTools } from "../tools/new-quiz-tools.js";
import { peerReviewTools } from "../tools/peer-review-tools.js";
import { quizQuestionTools } from "../tools/quiz-question-tools.js";
import { quizTools } from "../tools/quiz-tools.js";
import { rubricTools } from "../tools/rubric-tools.js";
import { studentTools } from "../tools/student-tools.js";
import type { ToolDefinition } from "./tool-model.js";

const readOnlyName = /^canvas_(list|get|search|find|check|audit|resolve|view|test)_/;
const destructiveName = /^canvas_(delete|remove|regenerate|grade|submit|send|post|reply|enroll|upload|update|set)_/;
const credentialToolNames = new Set([...accessTokenTools, ...configTools].map((tool) => tool.name));
const fileToolNames = new Set(fileTools.map((tool) => tool.name));

// quiz-tools.ts is canonical for question CRUD. This legacy module contributes only quiz groups.
const quizGroupTools = quizQuestionTools.filter((tool) => tool.name === "canvas_create_quiz_group");

export const rawTools: ToolDefinition[] = [
    ...courseTools,
    ...assignmentTools,
    ...quizTools,
    ...gradingTools,
    ...communicationTools,
    ...studentTools,
    ...quizGroupTools,
    ...createTools,
    ...moduleTools,
    ...fileTools,
    ...configTools,
    ...rubricTools,
    ...calendarTools,
    ...groupTools,
    ...enrollmentTools,
    ...conversationTools,
    ...newQuizTools,
    ...analyticsTools,
    ...peerReviewTools,
    ...accessTokenTools
];

export interface ToolProfileOptions {
    readOnly?: boolean;
    enableCredentialTools?: boolean;
    enableFileTools?: boolean;
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) return defaultValue;
    return value.trim().toLowerCase() === "true";
}

function humanizeToolName(name: string): string {
    return name
        .replace(/^canvas_/, "")
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function isReadOnlyTool(name: string): boolean {
    return readOnlyName.test(name);
}

export function assertUniqueTools(tools: ToolDefinition[]): void {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const tool of tools) {
        if (seen.has(tool.name)) duplicates.add(tool.name);
        seen.add(tool.name);
    }
    if (duplicates.size > 0) {
        throw new Error(`Duplicate MCP tool names: ${[...duplicates].sort().join(", ")}`);
    }
}

function addMetadata(definition: ToolDefinition): ToolDefinition {
    const readOnly = isReadOnlyTool(definition.name);
    const tool: Tool = {
        ...definition.tool,
        title: definition.tool.title ?? humanizeToolName(definition.name),
        annotations: {
            ...definition.tool.annotations,
            title: definition.tool.annotations?.title ?? humanizeToolName(definition.name),
            readOnlyHint: readOnly,
            destructiveHint: destructiveName.test(definition.name),
            idempotentHint: readOnly,
            openWorldHint: true
        }
    };
    return { ...definition, tool };
}

export function getConfiguredTools(options: ToolProfileOptions = {}): ToolDefinition[] {
    assertUniqueTools(rawTools);
    const readOnly = options.readOnly ?? parseBoolean(process.env.CANVAS_READ_ONLY, true);
    const enableCredentialTools =
        options.enableCredentialTools ?? parseBoolean(process.env.CANVAS_ENABLE_CREDENTIAL_TOOLS, false);
    const enableFileTools = options.enableFileTools ?? parseBoolean(process.env.CANVAS_ENABLE_FILE_TOOLS, false);

    return rawTools
        .filter((tool) => !readOnly || isReadOnlyTool(tool.name))
        .filter((tool) => enableCredentialTools || !credentialToolNames.has(tool.name))
        .filter((tool) => enableFileTools || !fileToolNames.has(tool.name))
        .map(addMetadata);
}
