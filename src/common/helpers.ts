
import { CanvasClient } from "../services/canvas-client.js";

export async function resolveCourseId(client: CanvasClient, courseIdentifier: string | number): Promise<number> {
    // If it's already a number or a string that looks like a number, return it as number
    if (typeof courseIdentifier === 'number') {
        return courseIdentifier;
    }

    if (!isNaN(Number(courseIdentifier))) {
        return Number(courseIdentifier);
    }

    // It's a string (name), so we need to search for it
    const courses = await client.getCourses();
    const searchTerm = (courseIdentifier as string).toLowerCase();

    const matchedCourse = courses.find(course => {
        const name = (course.name || "").toLowerCase();
        const originalName = (course.original_name as string || "").toLowerCase(); // Cast to string as it might be missing in type def but present in API
        const code = (course.course_code || "").toLowerCase();

        return name.includes(searchTerm) || originalName.includes(searchTerm) || code.includes(searchTerm);
    });

    if (matchedCourse) {
        return matchedCourse.id;
    }

    throw new Error(`Course not found matching: "${courseIdentifier}". Please provide a valid Course ID or a more specific name.`);
}
