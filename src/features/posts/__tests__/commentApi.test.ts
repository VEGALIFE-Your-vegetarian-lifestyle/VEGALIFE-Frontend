import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { createComment, deleteComment, getPostComments, reportComment, updateComment } from "../api";

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
});

describe("commentApi — post comment endpoints", () => {
    const postId = "post-123";
    const commentId = "comment-456";

    it("getPostComments gọi GET /api/posts/{postId}/comments với params phân trang", async () => {
        vi.mocked(api.get).mockResolvedValueOnce({
            data: {
                status: 200,
                message: "OK",
                data: {
                    content: [],
                    page: 0,
                    size: 20,
                    totalElements: 0,
                    totalPages: 0,
                    first: true,
                    last: true,
                },
            },
        });

        const res = await getPostComments(postId, { page: 1, size: 10 });
        expect(api.get).toHaveBeenCalledWith(`/api/posts/${postId}/comments`, {
            params: { page: 1, size: 10 },
        });
        expect(res.content).toEqual([]);
    });

    it("createComment gọi POST /api/posts/{postId}/comments với payload", async () => {
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
            parentId: null,
        });
        expect(res.id).toBe("new-comment-id");
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
});
