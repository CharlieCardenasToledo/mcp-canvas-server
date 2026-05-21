import * as dotenv from "dotenv";
import { CanvasClient } from "./src/services/canvas-client.js";

dotenv.config();

const token = process.env.CANVAS_API_TOKEN!;
const domain = process.env.CANVAS_API_DOMAIN!;
const courseId = 35041;
const assignmentId = 648019;
const newGroupId = 299747; // Gestión de la práctica y experimentación P1

async function run() {
    const client = new CanvasClient(token, domain);

    try {
        console.log(`Moving assignment ${assignmentId} to group ${newGroupId}...`);
        const updated = await client.updateAssignment(courseId, assignmentId, {
            assignment_group_id: newGroupId
        });

        console.log("✅ Assignment moved successfully!");
        console.log(`New Group: ${updated.assignment_group_id}`);
        console.log(`URL: https://${domain}/courses/${courseId}/assignments/${assignmentId}`);
    } catch (error: any) {
        console.error("❌ Error:", error?.response?.data || error.message);
    }
}

run();
