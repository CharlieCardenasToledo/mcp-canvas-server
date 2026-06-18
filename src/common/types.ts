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

export interface Folder {
    id: number;
    name: string;
    full_name: string;
    context_id: number;
    context_type: string;
    parent_folder_id?: number;
    created_at: string;
    updated_at: string;
    folders_url: string;
    files_url: string;
    files_count: number;
    folders_count: number;
    hidden?: boolean;
    locked?: boolean;
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

export interface QuizQuestionAnswer {
    id?: number;
    // Common
    answer_text?: string;
    answer_weight?: number;
    answer_comments?: string;
    text_after_answers?: string;
    // Fill-in-blanks / multiple dropdowns
    blank_id?: string;
    // Matching
    answer_match_left?: string;
    answer_match_right?: string;
    matching_answer_incorrect_matches?: string;
    // Numerical
    numerical_answer_type?: 'exact_answer' | 'range_answer' | 'precision_answer';
    exact?: number;
    margin?: number;
    approximate?: number;
    precision?: number;
    start?: number;
    end?: number;
}

export interface QuizQuestion {
    id: number;
    quiz_id: number;
    position: number;
    question_name: string;
    question_type: string;
    question_text: string;
    points_possible: number;
    quiz_group_id: number | null;
    correct_comments?: string;
    incorrect_comments?: string;
    neutral_comments?: string;
    text_after_answers?: string;
    answers: QuizQuestionAnswer[];
}

export interface QuizGroup {
    id: number;
    quiz_id: number;
    name: string;
    pick_count: number;
    question_points: number;
    assessment_question_bank_id?: number;
}

export interface GroupCategory {
    id: number;
    name: string;
    role: string | null;
    self_signup: string | null;
    group_limit: number | null;
    auto_leader: string | null;
    context_type: string;
    account_id: number;
}

export interface Group {
    id: number;
    name: string;
    description: string | null;
    is_public: boolean;
    followed_by_user: boolean;
    join_level: string;
    members_count: number;
    avatar_url: string | null;
    context_type: string;
    course_id: number | null;
    role: string | null;
    group_category_id: number | null;
    sis_group_id: string | null;
    storage_quota_mb: number;
}

export interface ConversationParticipant {
    id: number;
    name: string;
    avatar_url?: string;
}

export interface ConversationMessage {
    id: number;
    created_at: string;
    body: string;
    author_id: number;
    generated: boolean;
    media_comment?: { media_id: string; display_name: string };
    attachments?: FileAttachment[];
    participating_user_ids: number[];
}

export interface Conversation {
    id: number;
    subject: string;
    workflow_state: 'read' | 'unread' | 'archived';
    last_message: string;
    last_message_at: string;
    message_count: number;
    subscribed: boolean;
    private: boolean;
    starred: boolean;
    participants?: ConversationParticipant[];
    messages?: ConversationMessage[];
}

export interface NewQuiz {
    id: string;
    title: string;
    instructions?: string;
    due_at?: string | null;
    lock_at?: string | null;
    unlock_at?: string | null;
    points_possible?: number;
    time_limit?: number | null;
    shuffle_answers?: boolean;
    shuffle_questions?: boolean;
    allowed_attempts?: number;
    one_question_at_a_time?: boolean;
    cant_go_back?: boolean;
    show_correct_answers?: boolean;
    course_id?: string;
    assignment_id?: string;
}

export interface NewQuizItem {
    id: string;
    position?: number;
    points_possible?: number;
    entry_type: string;
    entry: {
        title?: string;
        item_body?: string;
        interaction_type_slug?: string;
        interaction_data?: Record<string, any>;
        scoring_data?: Record<string, any>;
        answer_feedback?: Record<string, any>;
    };
}

export interface AppointmentGroup {
    id: number;
    title: string;
    description?: string;
    location_name?: string;
    location_address?: string;
    context_codes?: string[];
    sub_context_codes?: string[];
    workflow_state?: 'active' | 'deleted';
    require_interaction?: boolean;
    participants_per_appointment?: number;
    min_appointments_per_participant?: number;
    max_appointments_per_participant?: number;
    new_appointments?: [string, string][];
    calendar_events?: any[];
    url?: string;
    html_url?: string;
    created_at?: string;
    updated_at?: string;
    participant_visibility?: 'private' | 'protected';
    participant_type?: 'User' | 'Group';
}
