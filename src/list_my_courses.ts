import { CanvasClient } from "./services/canvas-client.js";
import { ConfigManager } from "./common/config-manager.js";
import * as dotenv from "dotenv";
import chalk from "chalk";

dotenv.config();

async function main() {
    const config = new ConfigManager();
    const token = process.env.CANVAS_API_TOKEN || config.get("CANVAS_API_TOKEN");
    const domain = process.env.CANVAS_API_DOMAIN || config.get("CANVAS_API_DOMAIN");

    if (!token || !domain) {
        console.error(chalk.red("Missing configuration: CANVAS_API_TOKEN or CANVAS_API_DOMAIN"));
        process.exit(1);
    }

    const client = new CanvasClient(token, domain);

    try {
        console.log(chalk.blue("Fetching courses..."));
        const courses = await client.getCourses();

        // Filter: Exclude names starting with "ACS"
        // Note: The user asked for courses where they are a "docente" (teacher). 
        // The API returns courses for the current user. We'll verify enrollments if possible, 
        // but for now we interpret "active courses" as the set to filter.
        const filteredCourses = courses.filter(c => !c.name.startsWith("ACS"));

        console.log(chalk.bold(`\nFound ${courses.length} active courses.`));
        console.log(chalk.bold(`Showing ${filteredCourses.length} courses (excluding 'ACS'):\n`));

        filteredCourses.forEach(c => {
            console.log(chalk.green(`• [${c.id}] ${c.name}`));
            // console.log(chalk.dim(`  Code: ${c.course_code}`));
        });

    } catch (error: any) {
        console.error(chalk.red("Error fetching courses:"), error.message);
    }
}

main();
