export interface Course {
    id: number;
    name: string;
    course_code?: string;
    workflow_state?: string;
    term?: { id: number; name: string };
    enrollment_term_id: number;
    original_name?: string;
}

export interface Module {
    id: number;
    name: string;
    position?: number;
    workflow_state?: 'active' | 'deleted';
    items_count?: number;
    items_url?: string;
    items?: ModuleItem[] | null;
    published?: boolean;
}

export interface ModuleItem {
    id: number;
    module_id?: number;
    title: string;
    type: 'File' | 'Page' | 'Discussion' | 'Assignment' | 'Quiz' | 'SubHeader' | 'ExternalUrl' | 'ExternalTool';
    html_url?: string;
}

export interface RubricRating {
    id: string;
    description: string;
    long_description: string;
    points: number;
}

export interface RubricCriterion {
    id: string;
    description: string;
    long_description: string;
    points: number;
    criterion_use_range: boolean;
    ratings: RubricRating[];
}

export interface RubricSettings {
    id: number;
    title: string;
    points_possible: number;
    free_form_criterion_comments: boolean;
    hide_score_total: boolean;
    hide_points: boolean;
}

export interface Assignment {
    id?: number;
    name: string;
    description?: string | null;
    points_possible?: number | null;
    due_at?: string | null;
    lock_at?: string | null;
    unlock_at?: string | null;
    published?: boolean;
    has_submitted_submissions?: boolean;
    submission?: Submission;
    rubric?: RubricCriterion[];
    rubric_settings?: RubricSettings;
    use_rubric_for_grading?: boolean;
}

export interface FileAttachment {
    id: number;
    uuid: string;
    folder_id: number;
    display_name: string;
    filename: string;
    content_type: string;
    url: string;
    size: number;
    created_at: string;
    updated_at: string;
    unlock_at?: string;
    locked: boolean;
    hidden: boolean;
    lock_at?: string;
    hidden_for_user: boolean;
    thumbnail_url?: string;
    modified_at: string;
    mime_class: string;
    media_entry_id?: string;
    locked_for_user: boolean;
    preview_url?: string;
}

export interface SubmissionComment {
    id: number;
    author_id: number;
    author_name: string;
    created_at: string;
    edited_at?: string | null;
    comment: string;
    attempt?: number | null;
    author?: {
        id: number;
        anonymous_id?: string;
        display_name: string;
        avatar_image_url?: string;
        html_url?: string;
    };
}

export interface Submission {
    id: number;
    user_id: number;
    assignment_id: number;
    grade?: string | null;
    score?: number | null;
    submitted_at?: string | null;
    workflow_state: 'submitted' | 'unsubmitted' | 'graded' | 'pending_review';
    late?: boolean;
    missing?: boolean;
    excused?: boolean;
    body?: string;
    attachments?: FileAttachment[];
    submission_comments?: SubmissionComment[];
    rubric_assessment?: Record<string, { rating_id?: string; points: number; comments?: string }>;
}

export interface User {
    id: number;
    name: string;
    email?: string;
    sortable_name?: string;
    sis_user_id?: string;
    login_id?: string;
    enrollments?: Enrollment[];
}

export interface Quiz {
    id?: number;
    title: string;
    description?: string | null;
    due_at?: string | null;
    lock_at?: string | null;
    unlock_at?: string | null;
    published?: boolean;
    points_possible?: number | null;
    time_limit?: number | null;
}

export interface Enrollment {
    id?: number;
    course_id?: number;
    user_id?: number;
    type?: string;
    role?: string;
    enrollment_state?: string;
    grades?: {
        html_url?: string;
        current_grade?: string | null;
        final_grade?: string | null;
        current_score?: number | null;
        final_score?: number | null;
        current_points?: number | null;
        unposted_current_grade?: string | null;
        unposted_final_grade?: string | null;
        unposted_current_score?: number | null;
        unposted_final_score?: number | null;
    };
}


export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    pagination?: {
        next?: string;
        prev?: string;
        first?: string;
        last?: string;
    };
}

export interface Page {
    page_id?: number;
    url: string;
    title: string;
    created_at: string;
    updated_at: string;
    body?: string; // Only present in detail view
    published: boolean;
    front_page: boolean;
}

export interface Announcement {
    id: number;
    title: string;
    message: string;
    posted_at: string;
    delayed_post_at: string | null;
    context_code: string;
    url: string;
    author: {
        id: number;
        display_name: string;
        avatar_image_url: string;
        html_url: string;
    };
}

export interface DiscussionTopic {
    id: number;
    title: string;
    message: string;
    html_url: string;
    posted_at: string;
    discussion_type: 'side_comment' | 'threaded';
    lock_at?: string;
    locked: boolean;
    pinned: boolean;
    author: {
        id: number;
        display_name: string;
        avatar_image_url: string;
        html_url: string;
    };
    topic_children: number[];
    group_category_id?: number;
    attachments?: FileAttachment[];
}

export interface DiscussionEntry {
    id: number;
    user_id: number;
    user_name: string;
    message: string;
    created_at: string;
    updated_at?: string;
    parent_id?: number | null;
}
