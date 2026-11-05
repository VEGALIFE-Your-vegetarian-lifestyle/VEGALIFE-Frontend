import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import {
    createComment,
    deleteComment,
    getLocalComments,
    getPostComments,
    removeLocalComment,
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
        expect(res.totalElements).toBe(2);
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

    it("getPostComments trả về mảng rỗng an toàn khi server lỗi 500 và chưa có/đã xoá hết bình luận local", async () => {
        vi.mocked(api.get).mockRejectedValueOnce(new Error("500 Internal Server Error"));

        const res = await getPostComments(postId, { page: 0, size: 20 });
        expect(res.content).toEqual([]);
        expect(res.totalElements).toBe(0);
    });

    it("removeLocalComment xoá comment khỏi localStorage", () => {
        const mockComment: PostCommentThread = {
            id: "local-c1",
            userId: "u-1",
            parentId: null,
            replyToUsername: null,
            username: "MySelf",
            displayName: "MySelf",
            avatarUrl: null,
            content: "Will be removed",
            edited: false,
            deleted: false,
            createdAt: "2026-11-05T10:00:00Z",
            updatedAt: "2026-11-05T10:00:00Z",
            replies: [],
        };
        saveLocalComment(postId, mockComment);
        expect(getLocalComments(postId).length).toBe(1);

        removeLocalComment(postId, "local-c1");
        expect(getLocalComments(postId)).toEqual([]);
    });

    it("removeLocalComment đánh dấu deleted nếu comment có replies", () => {
        const parent: PostCommentThread = {
            id: "parent-1",
            userId: "u-1",
            parentId: null,
            replyToUsername: null,
            username: "Author",
            displayName: "Author",
            avatarUrl: null,
            content: "Parent comment",
            edited: false,
            deleted: false,
            createdAt: "2026-11-05T10:00:00Z",
            updatedAt: "2026-11-05T10:00:00Z",
            replies: [{
                id: "reply-1",
                userId: "u-2",
                parentId: "parent-1",
                replyToUsername: "Author",
                username: "Replier",
                displayName: "Replier",
                avatarUrl: null,
                content: "Reply",
                edited: false,
                deleted: false,
                createdAt: "2026-11-05T10:05:00Z",
                updatedAt: "2026-11-05T10:05:00Z",
                replies: [],
            }],
        };
        saveLocalComment(postId, parent);
        removeLocalComment(postId, "parent-1");

        const result = getLocalComments(postId);
        expect(result.length).toBe(1);
        expect(result[0].deleted).toBe(true);
        expect(result[0].content).toBe("[deleted]");
        expect(result[0].replies.length).toBe(1);
        expect(result[0].replies[0].content).toBe("Reply");
    });

    it("mergeComments không re-inject local comment đã bị xoá trên server", async () => {
        // Lưu comment vào local
        const mockComment: PostCommentThread = {
            id: "server-c1",
            userId: "u-1",
            parentId: null,
            replyToUsername: null,
            username: "MySelf",
            displayName: "MySelf",
            avatarUrl: null,
            content: "Old content",
            edited: false,
            deleted: false,
            createdAt: "2026-11-05T10:00:00Z",
            updatedAt: "2026-11-05T10:00:00Z",
            replies: [],
        };
        saveLocalComment(postId, mockComment);

        // Server trả về cùng id nhưng đã xoá
        vi.mocked(api.get).mockResolvedValueOnce({
            data: {
                status: 200,
                message: "OK",
                data: {
                    content: [{
                        id: "server-c1",
                        userId: null,
                        displayName: null,
                        avatarUrl: null,
                        content: "[deleted]",
                        edited: false,
                        deleted: true,
                        createdAt: "2026-11-05T10:00:00Z",
                        updatedAt: "2026-11-05T10:01:00Z",
                        replies: [],
                    }],
                    page: 0,
                    size: 20,
                    totalElements: 1,
                    totalPages: 1,
                    first: true,
                    last: true,
                },
            },
        });

        const res = await getPostComments(postId, { page: 0, size: 20 });
        // Server version (deleted) phải thắng, không bị đè bởi local
        expect(res.content[0].deleted).toBe(true);
        expect(res.content[0].content).toBe("[deleted]");
        // deleted comment không nên tính vào totalElements
        expect(res.totalElements).toBe(0);
    });

    it("deleteComment hoàn tất thành công khi server trả 404 (idempotent, comment đã không còn)", async () => {
        const error404: any = new Error("Comment not found");
        error404.response = { status: 404, data: { message: "Comment not found" } };
        vi.mocked(api.delete).mockRejectedValueOnce(error404);

        // Không ném lỗi ra ngoài
        await expect(deleteComment(postId, "not-found-id")).resolves.toBeUndefined();
    });

    it("deleteComment ném lỗi 403 nếu người dùng không có quyền", async () => {
        const error403: any = new Error("Forbidden");
        error403.response = { status: 403, data: { message: "Forbidden" } };
        vi.mocked(api.delete).mockRejectedValueOnce(error403);

        await expect(deleteComment(postId, "forbidden-id")).rejects.toThrow();
    });
});

