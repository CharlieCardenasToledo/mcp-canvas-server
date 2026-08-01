#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import chalk from "chalk";
import { Command } from "commander";
import * as dotenv from "dotenv";
import inquirer from "inquirer";
import { ConfigManager } from "./common/config-manager.js";
import { getConfiguredTools } from "./common/tool-registry.js";
import { startRestServer } from "./http-server.js";
import { startMcpHttpServer } from "./mcp-http-server.js";
import { createMcpServer } from "./server-factory.js";
import { CanvasClient } from "./services/canvas-client.js";
import { packageMetadata } from "./version.js";

dotenv.config();

const configManager = new ConfigManager();
const program = new Command();

program.name("canvas-mcp").description("Secure MCP server for Canvas LMS").version(packageMetadata.version);

program
    .command("config")
    .description("Configure Canvas credentials interactively")
    .action(async () => {
        console.log(chalk.blue.bold("\nCanvas MCP Server Configuration\n"));

        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "domain",
                message: "Canvas Domain (e.g., uide.instructure.com):",
                default: configManager.get("CANVAS_API_DOMAIN"),
                validate: (input: string) => input.trim().length > 0
            },
            {
                type: "password",
                name: "token",
                message: "Canvas API Token:",
                mask: "*",
                validate: (input: string) => input.trim().length > 0
            }
        ]);

        configManager.set("CANVAS_API_DOMAIN", answers.domain);
        configManager.set("CANVAS_API_TOKEN", answers.token);

        console.log(chalk.green("\nConfiguration saved successfully."));
        console.log(chalk.gray(`Saved to: ${configManager.path}`));
    });

function getClient(): CanvasClient {
    const token = process.env.CANVAS_API_TOKEN || configManager.get("CANVAS_API_TOKEN");
    const domain = process.env.CANVAS_API_DOMAIN || configManager.get("CANVAS_API_DOMAIN");

    if (!token || !domain) {
        console.error(chalk.red("Error: Missing configuration."));
        console.error(`Please run ${chalk.cyan("canvas-mcp config")} or set env vars.`);
        process.exit(1);
    }

    return new CanvasClient(token, domain, {
        autoRenewToken: process.env.CANVAS_TOKEN_AUTO_RENEW === "true",
        renewThresholdHours: process.env.CANVAS_TOKEN_RENEW_THRESHOLD_HOURS
            ? Number.parseFloat(process.env.CANVAS_TOKEN_RENEW_THRESHOLD_HOURS)
            : undefined,
        onTokenRenewed: (newToken: string) => {
            configManager.set("CANVAS_API_TOKEN", newToken);
            console.error(chalk.green("Canvas access token auto-renewed and persisted."));
        }
    });
}

program
    .command("start", { isDefault: true })
    .description("Start the MCP server over stdio")
    .action(async () => {
        const server = createMcpServer(getClient(), getConfiguredTools());
        await server.connect(new StdioServerTransport());
        console.error("Canvas MCP Server running on stdio");
    });

program
    .command("serve-http")
    .description("Start the MCP Streamable HTTP server")
    .option("--host <host>", "Host to bind", process.env.MCP_HTTP_HOST || "127.0.0.1")
    .option("--port <port>", "Port to bind", process.env.MCP_HTTP_PORT || "3000")
    .action(async (options: { host: string; port: string }) => {
        await startMcpHttpServer(getClient(), {
            host: options.host,
            port: Number.parseInt(options.port, 10),
            tools: getConfiguredTools()
        });
    });

program
    .command("serve-rest")
    .description("Start the separate REST API for GPT Actions")
    .option("--host <host>", "Host to bind", process.env.REST_HOST || "127.0.0.1")
    .option("--port <port>", "Port to bind", process.env.REST_PORT || "3001")
    .action(async (options: { host: string; port: string }) => {
        await startRestServer(getClient(), options.host, Number.parseInt(options.port, 10), getConfiguredTools());
    });

program.parseAsync(process.argv).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unexpected startup error";
    console.error(chalk.red(message));
    process.exitCode = 1;
});
