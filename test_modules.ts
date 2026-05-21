import * as dotenv from "dotenv";
import { CanvasClient } from "./src/services/canvas-client.js";

dotenv.config();

const token = process.env.CANVAS_API_TOKEN!;
const domain = process.env.CANVAS_API_DOMAIN!;
const courseId = 35041;

async function runTest() {
    const client = new CanvasClient(token, domain);

    try {
        console.log(`1. Creating a new test module in course ${courseId}...`);
        const newModule = await client.createModule(courseId, "Test Module (MCP)", false);
        console.log(`✅ Module created with ID: ${newModule.id}`);

        if (newModule.id) {
            console.log(`\n2. Adding a SubHeader to module ${newModule.id}...`);
            const subHeader = await client.createModuleItem(courseId, newModule.id, {
                type: 'SubHeader',
                title: 'Introduction Subheader',
                position: 1
            });
            console.log(`✅ SubHeader created: "${subHeader.title}"`);

            console.log(`\n3. Fetching modules to verify...`);
            const modules = await client.getModules(courseId);
            const foundModule = modules.find(m => m.id === newModule.id);
            if (foundModule) {
                console.log(`✅ Found test module in list. It has ${foundModule.items_count} items.`);
            } else {
                console.log(`❌ Test module not found in list.`);
            }

            console.log(`\n4. Cleaning up: Deleting the test module...`);
            await client.deleteModule(courseId, newModule.id);
            console.log(`✅ Module deleted successfully. Course is clean.`);
        }
    } catch (error: any) {
        console.error("❌ Test failed:", error?.response?.data || error.message);
    }
}

runTest();
