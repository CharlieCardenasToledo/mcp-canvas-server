import { CanvasClient } from './services/canvas-client.js';

const token = process.env.CANVAS_API_TOKEN || '15834~Kt29VhEFPfnVZ7R7TV4xFXBTAuD8ww97LeccQF88XB4ZCMvueca8WGV46UfvcRhJ';
const domain = process.env.CANVAS_API_DOMAIN || 'uide.instructure.com';

async function main() {
    const client = new CanvasClient(token, domain);
    try {
        const courses = await client.getCourses();
        const middlewareCourses = courses.filter(c =>
            (c.name && c.name.toLowerCase().includes('middleware')) ||
            (c.course_code && c.course_code.toLowerCase().includes('middleware'))
        );

        if (middlewareCourses.length === 0) {
            console.log('No courses found with "middleware" in the name.');
        } else {
            console.log(JSON.stringify(middlewareCourses, null, 2));
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
}

main();
