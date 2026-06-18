import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Course, Module, Assignment, Quiz, Submission, User, Page, FileAttachment, Announcement, DiscussionTopic, DiscussionEntry, QuizQuestion, QuizQuestionAnswer, QuizGroup, Folder, AppointmentGroup, Enrollment, Conversation, ConversationMessage, NewQuiz, NewQuizItem } from '../common/types.js';

export class CanvasClient {
    private client: AxiosInstance;
    private quizClient: AxiosInstance;
    private token: string;
    private domain: string;

    constructor(token: string, domain: string) {
        this.token = token;
        this.domain = domain;
        this.client = this.createAxiosInstance(token, domain);
        this.quizClient = this.createAxiosInstance(token, domain, 'api/quiz/v1');
    }

    private createAxiosInstance(token: string, domain: string, apiPath = 'api/v1'): AxiosInstance {
        const baseURL = `https://${domain}/${apiPath}`;
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
        this.quizClient = this.createAxiosInstance(token, domain, 'api/quiz/v1');
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

    async createAssignment(courseId: number, assignment: Partial<Assignment> & { name: string; submission_types?: string[]; grading_type?: string; assignment_group_id?: number; allowed_extensions?: string[] }): Promise<Assignment> {
        const response = await this.client.post<Assignment>(
            `courses/${courseId}/assignments`,
            {
                assignment: assignment
            }
        );
        return response.data;
    }

    async updateAssignment(courseId: number, assignmentId: number, assignment: Partial<Assignment> & { submission_types?: string[]; grading_type?: string; assignment_group_id?: number; allowed_extensions?: string[] }): Promise<Assignment> {
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

    async updateAnnouncement(courseId: number, topicId: number, fields: { title?: string; message?: string }): Promise<DiscussionTopic> {
        const url = `courses/${courseId}/discussion_topics/${topicId}`;
        const response = await this.client.put<DiscussionTopic>(url, fields);
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
            question_name?: string;
            question_type: string;
            question_text: string;
            points_possible: number;
            position?: number;
            quiz_group_id?: number;
            correct_comments?: string;
            incorrect_comments?: string;
            neutral_comments?: string;
            text_after_answers?: string;
            answers?: QuizQuestionAnswer[];
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
            position?: number;
            quiz_group_id?: number | null;
            correct_comments?: string;
            incorrect_comments?: string;
            neutral_comments?: string;
            text_after_answers?: string;
            answers?: QuizQuestionAnswer[];
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

    async createQuiz(courseId: number, quiz: Partial<Quiz> & { title: string }): Promise<Quiz> {
        const response = await this.client.post<Quiz>(
            `courses/${courseId}/quizzes`,
            {
                quiz: quiz
            }
        );
        return response.data;
    }

    async updateQuiz(courseId: number, quizId: number, quiz: Partial<Quiz>): Promise<Quiz> {
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

    async getRubrics(courseId: number): Promise<any[]> {
        return this.getAllPages<any>(`courses/${courseId}/rubrics`);
    }

    async getRubric(courseId: number, rubricId: number, include?: string[]): Promise<any> {
        const response = await this.client.get(`courses/${courseId}/rubrics/${rubricId}`, {
            params: { include }
        });
        return response.data;
    }

    async createRubric(courseId: number, rubricData: any, rubricAssociationData?: any): Promise<any> {
        const payload: any = { rubric: rubricData };
        if (rubricAssociationData) {
            payload.rubric_association = rubricAssociationData;
        }
        const response = await this.client.post(`courses/${courseId}/rubrics`, payload);
        return response.data;
    }

    async updateRubric(courseId: number, rubricId: number, rubricData: any, rubricAssociationData?: any): Promise<any> {
        const payload: any = { rubric: rubricData };
        if (rubricAssociationData) {
            payload.rubric_association = rubricAssociationData;
        }
        const response = await this.client.put(`courses/${courseId}/rubrics/${rubricId}`, payload);
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

    // --- Course Management ---

    async createCourse(accountId: number | string, data: {
        name: string;
        course_code?: string;
        start_at?: string;
        end_at?: string;
        license?: string;
        is_public?: boolean;
        syllabus_body?: string;
        grading_standard_id?: number;
        locale?: string;
        time_zone?: string;
        default_view?: string;
    }): Promise<Course> {
        const response = await this.client.post<Course>(
            `accounts/${accountId}/courses`,
            { course: data }
        );
        return response.data;
    }

    async updateCourse(courseId: number, data: {
        name?: string;
        course_code?: string;
        start_at?: string;
        end_at?: string;
        syllabus_body?: string;
        license?: string;
        is_public?: boolean;
        locale?: string;
        time_zone?: string;
        default_view?: string;
        grading_standard_id?: number;
    }): Promise<Course> {
        const response = await this.client.put<Course>(
            `courses/${courseId}`,
            { course: data }
        );
        return response.data;
    }

    async getSyllabus(courseId: number): Promise<{ id: number; name: string; syllabus_body: string | null }> {
        const response = await this.client.get<{ id: number; name: string; syllabus_body: string | null }>(
            `courses/${courseId}`,
            { params: { include: ['syllabus_body'] } }
        );
        return response.data;
    }

    async healthCheck(): Promise<{ status: string; user: string; domain: string }> {
        const response = await this.client.get<{ name: string }>('users/self/profile');
        return { status: 'ok', user: response.data.name, domain: this.domain };
    }

    // --- Assignment ---

    async deleteAssignment(courseId: number, assignmentId: number): Promise<{ deleted: boolean }> {
        await this.client.delete(`courses/${courseId}/assignments/${assignmentId}`);
        return { deleted: true };
    }

    // --- Pages ---

    async deletePage(courseId: number, pageUrlOrId: string | number): Promise<{ deleted: boolean }> {
        await this.client.delete(`courses/${courseId}/pages/${pageUrlOrId}`);
        return { deleted: true };
    }

    // --- Discussions ---

    async createDiscussion(courseId: number, data: {
        title: string;
        message: string;
        discussion_type?: 'side_comment' | 'threaded';
        published?: boolean;
        lock_at?: string;
        pinned?: boolean;
        allow_rating?: boolean;
        require_initial_post?: boolean;
    }): Promise<DiscussionTopic> {
        const response = await this.client.post<DiscussionTopic>(
            `courses/${courseId}/discussion_topics`,
            data
        );
        return response.data;
    }

    async deleteDiscussion(courseId: number, topicId: number): Promise<{ deleted: boolean }> {
        await this.client.delete(`courses/${courseId}/discussion_topics/${topicId}`);
        return { deleted: true };
    }

    // --- Users & Enrollments ---

    async getProfile(): Promise<User> {
        const response = await this.client.get<User>('users/self/profile');
        return response.data;
    }

    async getUser(userId: number | string): Promise<User> {
        const response = await this.client.get<User>(`users/${userId}`);
        return response.data;
    }

    async searchUsers(accountId: number | string, searchTerm: string, enrollmentType?: string): Promise<User[]> {
        return this.getAllPages<User>(`accounts/${accountId}/users`, {
            search_term: searchTerm,
            enrollment_type: enrollmentType,
            per_page: 50
        });
    }

    async listCourseEnrollments(courseId: number, type?: string[]): Promise<Enrollment[]> {
        return this.getAllPages<Enrollment>(`courses/${courseId}/enrollments`, {
            type,
            include: ['user'],
            per_page: 100
        });
    }

    async enrollUser(courseId: number, userId: number, enrollmentType: string, notify?: boolean): Promise<Enrollment> {
        const response = await this.client.post<Enrollment>(
            `courses/${courseId}/enrollments`,
            {
                enrollment: {
                    user_id: userId,
                    type: enrollmentType,
                    enrollment_state: 'active',
                    notify: notify ?? false
                }
            }
        );
        return response.data;
    }

    async removeEnrollment(courseId: number, enrollmentId: number, task: 'conclude' | 'delete' | 'deactivate' = 'conclude'): Promise<Enrollment> {
        const response = await this.client.delete<Enrollment>(
            `courses/${courseId}/enrollments/${enrollmentId}`,
            { params: { task } }
        );
        return response.data;
    }

    // --- Student Submissions ---

    async submitAssignmentFile(
        courseId: number,
        assignmentId: number,
        filePath: string,
        fileName: string,
        contentType: string
    ): Promise<Submission> {
        // Step 1: Pre-flight to get submission upload URL
        const preflightResponse = await this.client.post(
            `courses/${courseId}/assignments/${assignmentId}/submissions/self/files`,
            { name: fileName, content_type: contentType }
        );
        const { upload_url, upload_params } = preflightResponse.data;

        // Step 2: Upload file to storage
        const fs = await import('node:fs');
        const FormData = (await import('form-data')).default;
        const form = new FormData();
        Object.entries(upload_params).forEach(([key, value]) => {
            form.append(key, value);
        });
        form.append('file', fs.createReadStream(filePath));

        const uploadResponse = await axios.post(upload_url, form, {
            headers: form.getHeaders(),
            maxRedirects: 0,
            validateStatus: (s) => s < 400
        });

        // Step 3: Confirm upload and get file ID
        let fileId: number;
        const location = uploadResponse.headers['location'] || uploadResponse.data?.location;
        if (location) {
            const confirmResponse = await this.client.get(location);
            fileId = confirmResponse.data.id;
        } else {
            fileId = uploadResponse.data.id;
        }

        // Step 4: Submit the assignment with the uploaded file
        const submissionResponse = await this.client.post<Submission>(
            `courses/${courseId}/assignments/${assignmentId}/submissions`,
            {
                submission: {
                    submission_type: 'online_upload',
                    file_ids: [fileId]
                }
            }
        );
        return submissionResponse.data;
    }

    // --- Conversations ---

    async listConversations(scope?: 'inbox' | 'unread' | 'archived' | 'sent', perPage = 50): Promise<Conversation[]> {
        return this.getAllPages<Conversation>('conversations', {
            scope: scope ?? 'inbox',
            per_page: perPage
        });
    }

    async getConversation(conversationId: number): Promise<Conversation> {
        const response = await this.client.get<Conversation>(`conversations/${conversationId}`);
        return response.data;
    }

    async getConversationUnreadCount(): Promise<{ unread_count: number }> {
        const response = await this.client.get<{ unread_count: number }>('conversations/unread_count');
        return response.data;
    }

    async sendConversation(data: {
        recipients: (number | string)[];
        subject: string;
        body: string;
        course_id?: number;
        group_conversation?: boolean;
        bulk_message?: boolean;
    }): Promise<Conversation[]> {
        const payload: any = {
            recipients: data.recipients,
            subject: data.subject,
            body: data.body,
            group_conversation: data.group_conversation ?? false,
            bulk_message: data.bulk_message ?? false
        };
        if (data.course_id) {
            payload.context_code = `course_${data.course_id}`;
        }
        const response = await this.client.post<Conversation[]>('conversations', payload);
        return response.data;
    }

    async replyToConversation(conversationId: number, body: string): Promise<ConversationMessage> {
        const response = await this.client.post<ConversationMessage>(
            `conversations/${conversationId}/add_message`,
            { body }
        );
        return response.data;
    }

    // --- Analytics ---

    async getCourseAnalytics(courseId: number): Promise<any> {
        const response = await this.client.get(`courses/${courseId}/analytics/activity`);
        return response.data;
    }

    async getStudentAnalytics(courseId: number, studentId: number): Promise<any> {
        const response = await this.client.get(`courses/${courseId}/analytics/users/${studentId}/activity`);
        return response.data;
    }

    async getCourseActivityStream(courseId: number): Promise<any[]> {
        const response = await this.client.get(`courses/${courseId}/activity_stream/summary`);
        return response.data;
    }

    async searchCourseContent(courseId: number, query: string, contentTypes?: string[]): Promise<any[]> {
        const types = contentTypes && contentTypes.length > 0 ? contentTypes : ['assignments', 'pages', 'discussion_topics', 'quizzes', 'files'];
        const results: any[] = [];
        for (const type of types) {
            try {
                const items = await this.getAllPages<any>(`courses/${courseId}/${type}`, { per_page: 50 });
                const q = query.toLowerCase();
                const matched = items.filter((i: any) =>
                    (i.name || i.title || '').toLowerCase().includes(q)
                ).map((i: any) => ({ ...i, _content_type: type }));
                results.push(...matched);
            } catch {
                // skip types the user doesn't have access to
            }
        }
        return results;
    }

    // --- Peer Reviews ---

    async listPeerReviews(courseId: number, assignmentId: number): Promise<any[]> {
        return this.getAllPages<any>(
            `courses/${courseId}/assignments/${assignmentId}/peer_reviews`,
            { include: ['submission_comments', 'user'], per_page: 100 }
        );
    }

    async getSubmissionPeerReviews(courseId: number, assignmentId: number, submissionId: number): Promise<any[]> {
        return this.getAllPages<any>(
            `courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/peer_reviews`,
            { include: ['submission_comments', 'user'], per_page: 100 }
        );
    }

    async createPeerReview(courseId: number, assignmentId: number, submissionId: number, revieweeId: number): Promise<any> {
        const response = await this.client.post(
            `courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/peer_reviews`,
            { user_id: revieweeId }
        );
        return response.data;
    }

    async deletePeerReview(courseId: number, assignmentId: number, submissionId: number, revieweeId: number): Promise<{ deleted: boolean }> {
        await this.client.delete(
            `courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/peer_reviews`,
            { params: { user_id: revieweeId } }
        );
        return { deleted: true };
    }

    // --- New Quizzes (LTI) ---

    async createNewQuiz(courseId: number, data: {
        title: string;
        instructions?: string;
        due_at?: string;
        lock_at?: string;
        unlock_at?: string;
        points_possible?: number;
        time_limit?: number;
        allowed_attempts?: number;
        shuffle_answers?: boolean;
        shuffle_questions?: boolean;
        one_question_at_a_time?: boolean;
        cant_go_back?: boolean;
        show_correct_answers?: boolean;
    }): Promise<NewQuiz> {
        const response = await this.quizClient.post<NewQuiz>(`courses/${courseId}/quizzes`, data);
        return response.data;
    }

    async updateNewQuiz(courseId: number, quizId: string, data: Partial<Omit<NewQuiz, 'id' | 'course_id'>>): Promise<NewQuiz> {
        const response = await this.quizClient.patch<NewQuiz>(`courses/${courseId}/quizzes/${quizId}`, data);
        return response.data;
    }

    async deleteNewQuiz(courseId: number, quizId: string): Promise<{ deleted: boolean }> {
        await this.quizClient.delete(`courses/${courseId}/quizzes/${quizId}`);
        return { deleted: true };
    }

    async listNewQuizItems(courseId: number, quizId: string): Promise<NewQuizItem[]> {
        const response = await this.quizClient.get<{ items: NewQuizItem[] }>(
            `courses/${courseId}/quizzes/${quizId}/items`
        );
        return response.data.items ?? (response.data as any) ?? [];
    }

    async getNewQuizItem(courseId: number, quizId: string, itemId: string): Promise<NewQuizItem> {
        const response = await this.quizClient.get<NewQuizItem>(
            `courses/${courseId}/quizzes/${quizId}/items/${itemId}`
        );
        return response.data;
    }

    async createNewQuizItem(courseId: number, quizId: string, data: {
        position?: number;
        points_possible?: number;
        entry_type: string;
        entry: {
            title?: string;
            item_body?: string;
            interaction_type_slug?: string;
            interaction_data?: Record<string, any>;
            scoring_data?: Record<string, any>;
        };
    }): Promise<NewQuizItem> {
        const response = await this.quizClient.post<NewQuizItem>(
            `courses/${courseId}/quizzes/${quizId}/items`,
            data
        );
        return response.data;
    }

    async updateNewQuizItem(courseId: number, quizId: string, itemId: string, data: Partial<NewQuizItem>): Promise<NewQuizItem> {
        const response = await this.quizClient.patch<NewQuizItem>(
            `courses/${courseId}/quizzes/${quizId}/items/${itemId}`,
            data
        );
        return response.data;
    }

    async deleteNewQuizItem(courseId: number, quizId: string, itemId: string): Promise<{ deleted: boolean }> {
        await this.quizClient.delete(`courses/${courseId}/quizzes/${quizId}/items/${itemId}`);
        return { deleted: true };
    }
}