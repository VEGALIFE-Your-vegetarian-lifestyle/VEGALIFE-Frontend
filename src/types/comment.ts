/**
 * Nhóm 16 — comment component. `DOCS/API-REFERENCE.md` #30–#32.
 * #30 trả cây lồng sẵn: phân trang theo comment gốc, `replies` mang trọn subtree.
 */

export interface CommentResponse {
    id: string;
    userId: string;
    /** `null` khi bình luận đã xoá (server trả placeholder `[deleted]`, BR-COMMENT-003). */
    username: string | null;
    avatarUrl: string | null;
    /** Bình luận đã xoá mang placeholder `"[deleted]"` do BE trả về. */
    content: string;
    /** `true` sau lần sửa đầu tiên và giữ nguyên mãi. */
    edited: boolean;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
    replies: CommentResponse[];
}

/** #31 — chỉ chủ bình luận sửa được (BR-COMMENT-002). */
export interface UpdateCommentRequest {
    content: string;
}
