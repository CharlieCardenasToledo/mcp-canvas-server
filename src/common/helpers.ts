import { CanvasClient } from "../services/canvas-client.js";

interface Identifiable {
    id: number;
    name?: string;
}

function findIdentifier(
    identifier: string,
    candidates: Identifiable[],
    typeLabel: string,
    originalIdentifier: string | number
): number {
    if (typeof originalIdentifier === "number" || !isNaN(Number(originalIdentifier))) {
        return Number(originalIdentifier);
    }

    const searchTerm = identifier.toLowerCase();
    const matches = candidates.filter((candidate) => {
        const name = (candidate.name || "").toLowerCase();
        const code = (candidate as { course_code?: string }).course_code?.toLowerCase() ?? "";
        const originalName = (candidate as { original_name?: string }).original_name?.toLowerCase() ?? "";
        return (
            name === searchTerm || code === searchTerm || name.includes(searchTerm) || originalName.includes(searchTerm)
        );
    });

    if (matches.length === 0) {
        throw new Error(
            `${typeLabel} not found matching: "${originalIdentifier}". Please provide a valid ${typeLabel.toLowerCase()} ID or a more specific name.`
        );
    }
    if (matches.length > 1) {
        const candidatesList = matches
            .map((candidate) => `${candidate.id} (${candidate.name ?? "unnamed"})`)
            .join(", ");
        throw new Error(
            `Ambiguous ${typeLabel.toLowerCase()} "${originalIdentifier}" matched ${matches.length} entries: ${candidatesList}. Provide the exact ID to continue.`
        );
    }
    return matches[0].id;
}

export async function resolveCourseId(client: CanvasClient, courseIdentifier: string | number): Promise<number> {
    // If it's already a number or a string that looks like a number, return it as number
    if (typeof courseIdentifier === "number" || !isNaN(Number(courseIdentifier))) {
        return Number(courseIdentifier);
    }

    const courses = await client.getCourses();
    return findIdentifier(String(courseIdentifier), courses, "Course", courseIdentifier);
}

export async function resolveStudentId(
    client: CanvasClient,
    courseId: number,
    studentIdentifier: string | number
): Promise<number> {
    if (typeof studentIdentifier === "number" || !isNaN(Number(studentIdentifier))) {
        return Number(studentIdentifier);
    }

    const students = await client.getEnrollments(courseId);
    return findIdentifier(
        String(studentIdentifier),
        students.map((student) => ({
            id: student.id,
            name: student.sortable_name ?? student.name
        })),
        "Student",
        studentIdentifier
    );
}
