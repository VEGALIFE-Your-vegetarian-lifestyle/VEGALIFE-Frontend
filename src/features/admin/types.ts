export interface DashboardStats {
    totalCategories: number;
    activeCategories: number;
    softDeletedCategories: number;
    associatedContent: number;
}

export interface DashboardRecentItem {
    id: string;
    title: string;
    type: "post" | "video" | "user";
    status: string;
    createdAt: string;
}

export type CommentStatus = "active" | "removed";

/** `GET /api/admin/comments` — một bình luận trong hàng chờ kiểm duyệt. */
export interface AdminComment {
    id: string;
    postId: string;
    userId: string;
    username: string;
    avatarUrl: string | null;
    content: string;
    parentId: string | null;
    status: CommentStatus;
    reportCount: number;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export type AdminCommentSort = "createdAt" | "updatedAt";

export interface AdminCommentListParams {
    /** 1-based trong UI, map sang 0-based khi gọi API. */
    page: number;
    size: number;
    /** Lọc từ khoá client-side theo nội dung hoặc username. */
    q?: string;
    /** "all" = không gửi param status (lấy cả 2 trạng thái). */
    status?: CommentStatus | "all";
    userId?: string;
    postId?: string;
    sort?: AdminCommentSort;
    createdFrom?: string;
    createdTo?: string;
}

export interface ModerateCommentRequest {
    /** Bắt buộc, tối đa 1000 ký tự. */
    reason: string;
}
