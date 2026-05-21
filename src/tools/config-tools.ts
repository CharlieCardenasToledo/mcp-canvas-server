import { ToolDefinition } from "../common/tool-model.js";
import { CanvasClient } from "../services/canvas-client.js";
import { ConfigManager } from "../common/config-manager.js";

const configManager = new ConfigManager();

export const configTools: ToolDefinition[] = [
    {
        name: "set_canvas_config",
        tool: {
            name: "set_canvas_config",
            description: "Update Canvas API configuration (token and domain). This change is persistent.",
            inputSchema: {
                type: "object",
                properties: {
                    domain: {
                        type: "string",
                        description: "Canvas Domain (e.g., uide.instructure.com)"
                    },
                    token: {
                        type: "string",
                        description: "Canvas API Access Token"
                    }
                },
                required: ["domain", "token"]
            }
        },
        handler: async (client: CanvasClient, args: any) => {
            const { domain, token } = args;
            
            // Update the running client
            client.updateConfig(token, domain);
            
            // Persist the changes
            configManager.set("CANVAS_API_DOMAIN", domain);
            configManager.set("CANVAS_API_TOKEN", token);
            
            return {
                content: [{ 
                    type: "text", 
                    text: `✅ Configuration updated and persisted successfully.\nDomain: ${domain}\nToken: updated (hidden)` 
                }]
            };
        }
    }
];
