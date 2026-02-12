import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Course, Module, Assignment, Quiz, Submission, User, Page, FileAttachment, Announcement, DiscussionTopic, DiscussionEntry } from '../common/types.js';

export class CanvasClient {
    private client: AxiosInstance;

    constructor(token: string, domain: string) {
        const baseURL = `https://${domain}/api/v1`;
        this.client = axios.create({
            baseURL,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    }

    private parseLinkHeader(header: string | undefined): Record<string, string> {
        if (!header) return {};
        const links: Record<string, string> = {};
        const parts = header.split(',');
        parts.forEach(part => {
            const section = part.split(';');
            if (section.length < 2) return;
            const url = section[0].replace(/<(.*)>/, '$1').trim();
            const name = section[1].replace(/rel="?([^"]+)"?/, '$1').trim();
            links[name] = url;
        });
        return links;
    }

    private async getAllPages<T>(initialUrl: string, params?: Record<string, any>): Promise<T[]> {
        let allResults: T[] = [];
        let nextUrl: string | null = initialUrl;

        while (nextUrl) {
            const response: AxiosResponse<T[]> = await this.client.get(nextUrl, { params: nextUrl === initialUrl ? params : undefined });

            if (response.data) {
                allResults = allResults.concat(response.data);
            }

            const links = this.parseLinkHeader(response.headers['link']);
            nextUrl = links['next'] || null;
        }

        return allResults;
    }

    async getCourses(): Promise<Course[]> {
        return this.getAllPages<Course>('courses', {
            include: ['term'],
            enrollment_state: 'active',
            per_page: 100
        });
    }

    async getModules(courseId: number): Promise<Module[]> {
        return this.getAllPages<Module>(`courses/${courseId}/modules`, {
            include: ['items']
        });
    }

    async getAssignments(courseId: number): Promise<Assignment[]> {
        return this.getAllPages<Assignment>(`courses/${courseId}/assignments`, {
            per_page: 100
        });
    }

    async getQuizzes(courseId: number): Promise<Quiz[]> {
        return this.getAllPages<Quiz>(`courses/${courseId}/quizzes`, {
            per_page: 100
        });
    }

    async getAssignment(courseId: number, assignmentId: number): Promise<Assignment> {
        const response = await this.client.get<Assignment>(`courses/${courseId}/assignments/${assignmentId}`, {
            params: {
                include: ['submission', 'rubric_settings', 'overrides']
            }
        });
        return response.data;
    }

    async updateAssignmentDates(
        courseId: number,
        assignmentId: number,
        dates: {
            due_at?: string | null;
            unlock_at?: string | null;
            lock_at?: string | null;
        }
    ): Promise<Assignment> {
        const response = await this.client.put<Assignment>(
            `courses/${courseId}/assignments/${assignmentId}`,
            {
                assignment: dates
            }
        );
        return response.data;
    }

    async getQuiz(courseId: number, quizId: number): Promise<Quiz> {
        const response = await this.client.get<Quiz>(`courses/${courseId}/quizzes/${quizId}`);
        return response.data;
    }

    async updateQuizDates(
        courseId: number,
        quizId: number,
        dates: {
            due_at?: string | null;
            unlock_at?: string | null;
            lock_at?: string | null;
        }
    ): Promise<Quiz> {
        const response = await this.client.put<Quiz>(
            `courses/${courseId}/quizzes/${quizId}`,
            {
                quiz: dates
            }
        );
        return response.data;
    }

    async getSubmissions(courseId: number, assignmentId: number): Promise<Submission[]> {
        return this.getAllPages<Submission>(`courses/${courseId}/assignments/${assignmentId}/submissions`, {
            include: ['user'],
            per_page: 100
        });
    }

    async gradeSubmission(
        courseId: number,
        assignmentId: number,
        userId: number,
        grade: number | string,
        comment?: string,
        rubric_assessment?: Record<string, { rating_id?: string; points: number; comments?: string }>
    ): Promise<Submission> {
        const url = `courses/${courseId}/assignments/${assignmentId}/submissions/${userId}`;
        const data: any = {
            submission: {
                posted_grade: grade
            }
        };

        if (comment) {
            data.comment = {
                text_comment: comment
            };
        }

        if (rubric_assessment) {
            data.rubric_assessment = rubric_assessment;
        }

        const response = await this.client.put<Submission>(url, data);
        return response.data;
    }
    async getSingleSubmission(courseId: number, assignmentId: number, userId: number): Promise<Submission> {
        const url = `courses/${courseId}/assignments/${assignmentId}/submissions/${userId}`;
        const response = await this.client.get<Submission>(url, {
            params: {
                include: ['submission_history', 'submission_comments', 'rubric_assessment', 'visibility', 'user']
            }
        });
        return response.data;
    }

    async getEnrollments(courseId: number): Promise<User[]> {
        return this.getAllPages<User>(`courses/${courseId}/users`, {
            enrollment_type: ['student'],
            include: ['email', 'enrollments'],
            per_page: 100
        });
    }

    async getStudentInCourse(courseId: number, studentId: number): Promise<User> {
        const response = await this.client.get<User>(`courses/${courseId}/users/${studentId}`, {
            params: {
                include: ['email', 'enrollments']
            }
        });
        return response.data;
    }

    async getStudentCourseSubmissions(courseId: number, studentId: number): Promise<any[]> {
        return this.getAllPages<any>(`courses/${courseId}/students/submissions`, {
            student_ids: [studentId],
            include: ['assignment'],
            per_page: 100
        });
    }

    async getPages(courseId: number): Promise<Page[]> {
        return this.getAllPages<Page>(`courses/${courseId}/pages`);
    }

    async getPage(courseId: number, pageUrlOrId: string | number): Promise<Page> {
        const response = await this.client.get<Page>(`courses/${courseId}/pages/${pageUrlOrId}`);
        return response.data;
    }

    async getFiles(courseId: number): Promise<FileAttachment[]> {
        return this.getAllPages<FileAttachment>(`courses/${courseId}/files`);
    }

    async getAnnouncements(courseIds: number[]): Promise<Announcement[]> {
        return this.getAllPages<Announcement>('announcements', {
            context_codes: courseIds.map(id => `course_${id}`)
        });
    }

    async deleteSubmissionComment(
        courseId: number,
        assignmentId: number,
        userId: number,
        commentId: number
    ): Promise<{ deleted: boolean; comment_id: number }> {
        const url = `courses/${courseId}/assignments/${assignmentId}/submissions/${userId}/comments/${commentId}`;
        await this.client.delete(url);
        return { deleted: true, comment_id: commentId };
    }


    async getSubmissionComments(
        courseId: number,
        assignmentId: number,
        userId: number
    ): Promise<Submission> {
        return this.getSingleSubmission(courseId, assignmentId, userId);
    }

    async getDiscussionTopics(courseId: number): Promise<DiscussionTopic[]> {
        return this.getAllPages<DiscussionTopic>(`courses/${courseId}/discussion_topics`);
    }

    async getDiscussionEntries(courseId: number, topicId: number): Promise<DiscussionEntry[]> {
        return this.getAllPages<DiscussionEntry>(`courses/${courseId}/discussion_topics/${topicId}/entries`);
    }

    async postDiscussionReply(courseId: number, topicId: number, message: string): Promise<DiscussionEntry> {
        const url = `courses/${courseId}/discussion_topics/${topicId}/entries`;
        const response = await this.client.post<DiscussionEntry>(url, { message });
        return response.data;
    }

    async postAnnouncement(courseId: number, title: string, message: string): Promise<DiscussionTopic> {
        // Announcements are technically discussion topics with is_announcement=true
        const url = `courses/${courseId}/discussion_topics`;
        const response = await this.client.post<DiscussionTopic>(url, {
            title,
            message,
            is_announcement: true
        });
        return response.data;
    }
}
