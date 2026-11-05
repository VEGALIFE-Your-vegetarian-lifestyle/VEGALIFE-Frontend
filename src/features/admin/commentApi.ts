import { api } from "@/shared/api/client";
import type { ApiResponse, PageResponse, Paginated } from "@/shared/types/common";
import type { AdminComment, AdminCommentListParams, ModerateCommentRequest } from "./types";

/**
 * GET /api/admin/comments — danh sách bình luận kiểm duyệt.
 * Nhận page, size, status (active|removed), userId, postId, sort (createdAt|updatedAt), createdFrom, createdTo.
 * Lưu ý: BE không nhận giá trị 'all' cho status — bỏ trống param để lấy cả 2 trạng thái.
 */
export async function getAdminComments({
    page,
    size,
    q,
    status = "all",
    sort = "createdAt",
    userId,
    postId,
    createdFrom,
    createdTo,
}: AdminCommentListParams): Promise<Paginated<AdminComment>> {
    const params: Record<string, string | number> = {
        page: page - 1,
        size,
        sort: `${sort},desc`,
    };
    if (status && status !== "all") {
        params.status = status;
    }
    if (userId) params.userId = userId;
    if (postId) params.postId = postId;
    if (createdFrom) params.createdFrom = createdFrom;
    if (createdTo) params.createdTo = createdTo;

    const { data } = await api.get<ApiResponse<PageResponse<AdminComment>>>("/api/admin/comments", { params });
    const pageData = data.data;

    let items = pageData.content;
    const keyword = q?.trim().toLowerCase();
    if (keyword) {
        items = items.filter(
            (c) =>
                c.content.toLowerCase().includes(keyword) ||
                c.username?.toLowerCase().includes(keyword) ||
                c.userId.toLowerCase().includes(keyword) ||
                c.postId.toLowerCase().includes(keyword),
        );
    }

    return {
        data: items,
        total: Number(pageData.totalElements),
        page: pageData.page + 1,
        size: pageData.size,
        totalPages: pageData.totalPages,
    };
}

/**
 * POST /api/admin/comments/{commentId}/moderate — kiểm duyệt/gỡ bình luận vi phạm.
 * Yêu cầu `{ reason: string }` bắt buộc, ≤1000 ký tự.
 * Backend soft-delete (chuyển status sang 'removed' hoặc xoá mềm), reply giữ `parentId`.
 */
export async function moderateComment(commentId: string, request: ModerateCommentRequest): Promise<void> {
    await api.post<ApiResponse<unknown>>(`/api/admin/comments/${commentId}/moderate`, request);
}
