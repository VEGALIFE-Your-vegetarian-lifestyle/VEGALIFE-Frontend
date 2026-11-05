import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import {
    createComment,
    deleteComment,
    getLocalComments,
    getPostComments,
    reportComment,
    saveLocalComment,
    updateComment,
} from "../api";
import type { PostCommentThread } from "../types";

vi.mock("@/shared/api/client", () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
});

describe("commentApi — post comment endpoints", () => {
    const postId = "post-123";
    const commentId = "comment-456";

    it("getPostComments gọi GET /api/posts/{postId}/comments với params phân trang và chuẩn hóa displayName", async () => {
        vi.mocked(api.get).mockResolvedValueOnce({
            data: {
                status: 200,
                message: "OK",
                data: {
                    content: [
                        {
                            id: "c-1",
                            userId: "u-1",
                            displayName: "Chef Green",
                            avatarUrl: "https://example.com/avatar.png",
                            content: "Very healthy",
                            edited: false,
                            deleted: false,
                            createdAt: "2026-11-01T10:00:00Z",
                            updatedAt: "2026-11-01T10:00:00Z",
                            replies: [
                                {
                                    id: "c-2",
                                    userId: "u-2",
                                    displayName: "Foodie",
                                    avatarUrl: null,
                                    content: "I agree",
                                    edited: false,
                                    deleted: false,
                                    createdAt: "2026-11-01T11:00:00Z",
                                    updatedAt: "2026-11-01T11:00:00Z",
                                    replies: [],
                                },
                            ],
                        },
                    ],
                    page: 0,
                    size: 20,
                    totalElements: 1,
                    totalPages: 1,
                    first: true,
                    last: true,
                },
            },
        });

        const res = await getPostComments(postId, { page: 1, size: 10 });
        expect(api.get).toHaveBeenCalledWith(`/api/posts/${postId}/comments`, {
            params: { page: 1, size: 10 },
        });
        expect(res.content[0].displayName).toBe("Chef Green");
        expect(res.content[0].username).toBe("Chef Green");
        expect(res.content[0].replies[0].displayName).toBe("Foodie");
        expect(res.content[0].replies[0].username).toBe("Foodie");
    });

    it("createComment với parentId null/undefined chỉ gửi content và bỏ parentId", async () => {
        vi.mocked(api.post).mockResolvedValueOnce({
            data: {
                status: 200,
                message: "OK",
                data: { id: "new-comment-id", content: "Great recipe!", parentId: null },
            },
        });

        const res = await createComment(postId, { content: "Great recipe!", parentId: null });
        expect(api.post).toHaveBeenCalledWith(`/api/posts/${postId}/comments`, {
            content: "Great recipe!",
        });
        expect(res.id).toBe("new-comment-id");
    });

    it("createComment với parentId hợp lệ gửi kèm parentId trong payload", async () => {
        vi.mocked(api.post).mockResolvedValueOnce({
            data: {
                status: 200,
                message: "OK",
                data: { id: "reply-id", content: "Thank you!", parentId: "c-1" },
            },
        });

        const res = await createComment(postId, { content: "Thank you!", parentId: "c-1" });
        expect(api.post).toHaveBeenCalledWith(`/api/posts/${postId}/comments`, {
            content: "Thank you!",
            parentId: "c-1",
        });
        expect(res.id).toBe("reply-id");
    });

    it("updateComment gọi PATCH /api/posts/{postId}/comments/{commentId}", async () => {
        vi.mocked(api.patch).mockResolvedValueOnce({
            data: {
                status: 200,
                message: "OK",
                data: { id: commentId, content: "Updated content" },
            },
        });

        const res = await updateComment(postId, commentId, { content: "Updated content" });
        expect(api.patch).toHaveBeenCalledWith(`/api/posts/${postId}/comments/${commentId}`, {
            content: "Updated content",
        });
        expect(res.content).toBe("Updated content");
    });

    it("deleteComment gọi DELETE /api/posts/{postId}/comments/{commentId}", async () => {
        vi.mocked(api.delete).mockResolvedValueOnce({
            data: { status: 200, message: "OK", data: null },
        });

        await deleteComment(postId, commentId);
        expect(api.delete).toHaveBeenCalledWith(`/api/posts/${postId}/comments/${commentId}`);
    });

    it("reportComment gọi POST /api/posts/{postId}/comments/{commentId}/report", async () => {
        vi.mocked(api.post).mockResolvedValueOnce({
            data: { status: 200, message: "OK", data: null },
        });

        await reportComment(postId, commentId, { reason: "Spam content" });
        expect(api.post).toHaveBeenCalledWith(`/api/posts/${postId}/comments/${commentId}/report`, {
            reason: "Spam content",
        });
    });

    it("saveLocalComment và getLocalComments lưu trữ và đọc lại từ localStorage", () => {
        const mockComment: PostCommentThread = {
            id: "local-c1",
            userId: "u-1",
            parentId: null,
            replyToUsername: null,
            username: "MySelf",
            displayName: "MySelf",
            avatarUrl: null,
            content: "Locally saved comment",
            edited: false,
            deleted: false,
            createdAt: "2026-11-05T10:00:00Z",
            updatedAt: "2026-11-05T10:00:00Z",
            replies: [],
        };

        expect(getLocalComments(postId)).toEqual([]);
        saveLocalComment(postId, mockComment);
        expect(getLocalComments(postId)).toEqual([mockComment]);
    });

    it("getPostComments fallback về local comments khi API server trả lỗi 500", async () => {
        const mockComment: PostCommentThread = {
            id: "local-c1",
            userId: "u-1",
            parentId: null,
            replyToUsername: null,
            username: "MySelf",
            displayName: "MySelf",
            avatarUrl: null,
            content: "Locally saved comment",
            edited: false,
            deleted: false,
            createdAt: "2026-11-05T10:00:00Z",
            updatedAt: "2026-11-05T10:00:00Z",
            replies: [],
        };
        saveLocalComment(postId, mockComment);

        vi.mocked(api.get).mockRejectedValueOnce(new Error("500 Internal Server Error"));

        const res = await getPostComments(postId, { page: 0, size: 20 });
        expect(res.content).toEqual([mockComment]);
        expect(res.totalElements).toBe(1);
    });
});

