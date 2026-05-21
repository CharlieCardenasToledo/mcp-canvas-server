import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Course, Module, Assignment, Quiz, Submission, User, Page, FileAttachment, Announcement, DiscussionTopic, DiscussionEntry, QuizQuestion, QuizGroup, Folder, AppointmentGroup } from '../common/types.js';

export class CanvasClient {
    private client: AxiosInstance;
    private token: string;
    private domain: string;

    constructor(token: string, domain: string) {
        this.token = token;
        this.domain = domain;
        this.client = this.createAxiosInstance(token, domain);
    }

    private createAxiosInstance(token: string, domain: string): AxiosInstance {
        const baseURL = `https://${domain}/api/v1`;
        return axios.create({
            baseURL,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    }

    public updateConfig(token: string, domain: string): void {
        this.token = token;
        this.domain = domain;
        this.client = this.createAxiosInstance(token, domain);
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

    async getAssignmentGroups(courseId: number): Promise<any[]> {
        return this.getAllPages<any>(`courses/${courseId}/assignment_groups`, {
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

    async createAssignment(courseId: number, assignment: any): Promise<Assignment> {
        const response = await this.client.post<Assignment>(
            `courses/${courseId}/assignments`,
            {
                assignment: assignment
            }
        );
        return response.data;
    }

    async updateAssignment(courseId: number, assignmentId: number, assignment: any): Promise<Assignment> {
        const response = await this.client.put<Assignment>(
            `courses/${courseId}/assignments/${assignmentId}`,
            {
                assignment: assignment
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

    // --- Quiz Questions ---

    async listQuizQuestions(courseId: number, quizId: number): Promise<QuizQuestion[]> {
        return this.getAllPages<QuizQuestion>(`courses/${courseId}/quizzes/${quizId}/questions`, {
            per_page: 100
        });
    }

    async getQuizQuestion(courseId: number, quizId: number, questionId: number): Promise<QuizQuestion> {
        const response = await this.client.get<QuizQuestion>(
            `courses/${courseId}/quizzes/${quizId}/questions/${questionId}`
        );
        return response.data;
    }

    async createQuizQuestion(
        courseId: number,
        quizId: number,
        data: {
            question_name: string;
            question_type: string;
            question_text: string;
            points_possible: number;
            quiz_group_id?: number;
            answers?: { text: string; weight: number; comments?: string; blank_id?: string }[];
        }
    ): Promise<QuizQuestion> {
        const response = await this.client.post<QuizQuestion>(
            `courses/${courseId}/quizzes/${quizId}/questions`,
            { question: data }
        );
        return response.data;
    }

    async updateQuizQuestion(
        courseId: number,
        quizId: number,
        questionId: number,
        data: {
            question_name?: string;
            question_type?: string;
            question_text?: string;
            points_possible?: number;
            quiz_group_id?: number | null;
            answers?: { text: string; weight: number; comments?: string; blank_id?: string }[];
        }
    ): Promise<QuizQuestion> {
        const response = await this.client.put<QuizQuestion>(
            `courses/${courseId}/quizzes/${quizId}/questions/${questionId}`,
            { question: data }
        );
        return response.data;
    }

    async deleteQuizQuestion(courseId: number, quizId: number, questionId: number): Promise<{ deleted: boolean }> {
        await this.client.delete(`courses/${courseId}/quizzes/${quizId}/questions/${questionId}`);
        return { deleted: true };
    }

    // --- Quiz Groups ---

    async createQuizGroup(
        courseId: number,
        quizId: number,
        groupData: {
            name: string;
            pick_count: number;
            question_points: number;
            assessment_question_bank_id?: number;
        }
    ): Promise<QuizGroup> {
        const response = await this.client.post<{ quiz_groups: QuizGroup[] }>(
            `courses/${courseId}/quizzes/${quizId}/groups`,
            { quiz_groups: [groupData] }
        );
        return response.data.quiz_groups[0];
    }
    async createPage(
        courseId: number,
        title: string,
        body: string,
        published: boolean = false
    ): Promise<Page> {
        const response = await this.client.post<Page>(
            `courses/${courseId}/pages`,
            {
                wiki_page: {
                    title,
                    body,
                    published
                }
            }
        );
        return response.data;
    }

    async updatePage(
        courseId: number,
        pageUrlOrId: string | number,
        data: {
            title?: string;
            body?: string;
            published?: boolean;
        }
    ): Promise<Page> {
        const response = await this.client.put<Page>(
            `courses/${courseId}/pages/${pageUrlOrId}`,
            {
                wiki_page: data
            }
        );
        return response.data;
    }

    // --- Modules ---

    async createModule(
        courseId: number,
        name: string,
        published: boolean = false,
        position?: number
    ): Promise<Module> {
        const response = await this.client.post<Module>(
            `courses/${courseId}/modules`,
            {
                module: {
                    name,
                    published,
                    position
                }
            }
        );
        return response.data;
    }

    async updateModule(
        courseId: number,
        moduleId: number,
        data: {
            name?: string;
            published?: boolean;
            position?: number;
        }
    ): Promise<Module> {
        const response = await this.client.put<Module>(
            `courses/${courseId}/modules/${moduleId}`,
            {
                module: data
            }
        );
        return response.data;
    }

    async deleteModule(courseId: number, moduleId: number): Promise<{ deleted: boolean }> {
        await this.client.delete(`courses/${courseId}/modules/${moduleId}`);
        return { deleted: true };
    }

    // --- Module Items ---

    async createModuleItem(
        courseId: number,
        moduleId: number,
        item: {
            type: 'Assignment' | 'Quiz' | 'File' | 'Page' | 'DiscussionTopic' | 'ExternalUrl' | 'ExternalTool' | 'SubHeader';
            content_id?: string | number;
            page_url?: string;
            title?: string;
            external_url?: string;
            new_tab?: boolean;
            indent?: number;
            position?: number;
        }
    ): Promise<any> {
        const response = await this.client.post(
            `courses/${courseId}/modules/${moduleId}/items`,
            {
                module_item: item
            }
        );
        return response.data;
    }

    async updateModuleItem(
        courseId: number,
        moduleId: number,
        itemId: number,
        data: {
            title?: string;
            position?: number;
            indent?: number;
            published?: boolean;
            module_id?: number;
        }
    ): Promise<any> {
        const response = await this.client.put(
            `courses/${courseId}/modules/${moduleId}/items/${itemId}`,
            {
                module_item: data
            }
        );
        return response.data;
    }

    async deleteModuleItem(courseId: number, moduleId: number, itemId: number): Promise<{ deleted: boolean }> {
        await this.client.delete(`courses/${courseId}/modules/${moduleId}/items/${itemId}`);
        return { deleted: true };
    }

    // --- File Uploads ---

    async uploadFile(
        courseId: number,
        filePath: string,
        fileName: string,
        contentType: string,
        parentFolderId?: number | string
    ): Promise<FileAttachment> {
        // Step 1: Pre-flight request to Canvas
        const preflightData: any = {
            name: fileName,
            content_type: contentType
        };
        if (parentFolderId) {
            preflightData.parent_folder_id = parentFolderId;
        }

        const preflightResponse = await this.client.post(
            `courses/${courseId}/files`,
            preflightData
        );

        const { upload_url, upload_params } = preflightResponse.data;

        // Step 2: Upload to S3 (or other storage)
        // Note: Using dynamic import for 'fs' and 'form-data' to avoid issues in some environments
        const fs = await import('node:fs');
        const FormData = (await import('form-data')).default;

        const form = new FormData();
        Object.entries(upload_params).forEach(([key, value]) => {
            form.append(key, value);
        });
        form.append('file', fs.createReadStream(filePath));

        const uploadResponse = await axios.post(upload_url, form, {
            headers: form.getHeaders()
        });

        // Step 3: Handle redirection if necessary (Canvas sometimes returns a 303 or a Location header)
        if (uploadResponse.status === 301 || uploadResponse.status === 201 || uploadResponse.headers.location) {
            const finalUrl = uploadResponse.headers.location || uploadResponse.data.location;
            if (finalUrl) {
                const finalResponse = await this.client.get(finalUrl);
                return finalResponse.data;
            }
        }

        return uploadResponse.data;
    }

    async createQuiz(courseId: number, quiz: any): Promise<Quiz> {
        const response = await this.client.post<Quiz>(
            `courses/${courseId}/quizzes`,
            {
                quiz: quiz
            }
        );
        return response.data;
    }

    async updateQuiz(courseId: number, quizId: number, quiz: any): Promise<Quiz> {
        const response = await this.client.put<Quiz>(
            `courses/${courseId}/quizzes/${quizId}`,
            {
                quiz: quiz
            }
        );
        return response.data;
    }

    // --- Folders ---

    async getFolders(courseId: number): Promise<Folder[]> {
        return this.getAllPages<Folder>(`courses/${courseId}/folders`);
    }

    async getFolder(folderId: number): Promise<Folder> {
        const response = await this.client.get<Folder>(`folders/${folderId}`);
        return response.data;
    }

    async createFolder(courseId: number, name: string, parentFolderId?: number): Promise<Folder> {
        const data: any = { name };
        if (parentFolderId) {
            data.parent_folder_id = parentFolderId;
        }
        const response = await this.client.post<Folder>(`courses/${courseId}/folders`, data);
        return response.data;
    }

    async updateFolder(folderId: number, data: { name?: string; parent_folder_id?: number }): Promise<Folder> {
        const response = await this.client.put<Folder>(`folders/${folderId}`, data);
        return response.data;
    }

    async deleteFolder(folderId: number, force: boolean = false): Promise<{ deleted: boolean }> {
        await this.client.delete(`folders/${folderId}`, { params: { force } });
        return { deleted: true };
    }

    // --- Files (More) ---

    async getFile(fileId: number): Promise<FileAttachment> {
        const response = await this.client.get<FileAttachment>(`files/${fileId}`);
        return response.data;
    }

    async updateFile(fileId: number, data: { name?: string; parent_folder_id?: number; locked?: boolean; hidden?: boolean }): Promise<FileAttachment> {
        const response = await this.client.put<FileAttachment>(`files/${fileId}`, data);
        return response.data;
    }

    async deleteFile(fileId: number): Promise<{ deleted: boolean }> {
        await this.client.delete(`files/${fileId}`);
        return { deleted: true };
    }

    // --- Rubrics ---

    async createRubric(courseId: number, rubricData: any, rubricAssociationData?: any): Promise<any> {
        const payload: any = { rubric: rubricData };
        if (rubricAssociationData) {
            payload.rubric_association = rubricAssociationData;
        }
        const response = await this.client.post(`courses/${courseId}/rubrics`, payload);
        return response.data;
    }

    async createRubricAssociation(courseId: number, associationData: any): Promise<any> {
        const response = await this.client.post(`courses/${courseId}/rubric_associations`, {
            rubric_association: associationData
        });
        return response.data;
    }

    // --- Appointment Groups ---

    async listAppointmentGroups(scope: 'all' | 'manageable' = 'all', include?: string[]): Promise<AppointmentGroup[]> {
        return this.getAllPages<AppointmentGroup>('appointment_groups', {
            scope,
            include
        });
    }

    async getAppointmentGroup(id: number, include?: string[]): Promise<AppointmentGroup> {
        const response = await this.client.get<AppointmentGroup>(`appointment_groups/${id}`, {
            params: { include }
        });
        return response.data;
    }

    async createAppointmentGroup(data: Partial<AppointmentGroup>): Promise<AppointmentGroup> {
        const response = await this.client.post<AppointmentGroup>('appointment_groups', {
            appointment_group: data
        });
        return response.data;
    }

    async updateAppointmentGroup(id: number, data: Partial<AppointmentGroup>): Promise<AppointmentGroup> {
        const response = await this.client.put<AppointmentGroup>(`appointment_groups/${id}`, {
            appointment_group: data
        });
        return response.data;
    }

    async deleteAppointmentGroup(id: number, cancelReason?: string): Promise<{ deleted: boolean }> {
        await this.client.delete(`appointment_groups/${id}`, {
            params: { cancel_reason: cancelReason }
        });
        return { deleted: true };
    }

    async listAppointmentGroupUsers(id: number): Promise<User[]> {
        return this.getAllPages<User>(`appointment_groups/${id}/users`);
    }

    async listAppointmentGroupGroups(id: number): Promise<any[]> {
        return this.getAllPages<any>(`appointment_groups/${id}/groups`);
    }

    async getNextAppointment(): Promise<AppointmentGroup> {
        const response = await this.client.get<AppointmentGroup>('appointment_groups/next_appointment');
        return response.data;
    }

    // --- Groups and Group Categories ---

    async getGroupCategories(courseId: number): Promise<any[]> {
        return this.getAllPages<any>(`courses/${courseId}/group_categories`);
    }

    async createGroupCategory(courseId: number, data: {
        name: string;
        self_signup?: string;
        auto_leader?: string;
        group_limit?: number;
        create_group_count?: number;
        split_group_count?: number;
    }): Promise<any> {
        const response = await this.client.post(`courses/${courseId}/group_categories`, data);
        return response.data;
    }

    async createGroup(groupCategoryId: number, data: {
        name: string;
        description?: string;
        join_level?: string;
        is_public?: boolean;
    }): Promise<any> {
        const response = await this.client.post(`group_categories/${groupCategoryId}/groups`, data);
        return response.data;
    }

    async getGroupsInCategory(groupCategoryId: number): Promise<any[]> {
        return this.getAllPages<any>(`group_categories/${groupCategoryId}/groups`);
    }

    async assignUnassignedMembers(groupCategoryId: number, sync: boolean = false): Promise<any[]> {
        const response = await this.client.post(`group_categories/${groupCategoryId}/assign_unassigned_members`, { sync });
        return response.data;
    }

    async addGroupMember(groupId: number, userId: number): Promise<any> {
        const response = await this.client.post(`groups/${groupId}/memberships`, { user_id: userId });
        return response.data;
    }
}