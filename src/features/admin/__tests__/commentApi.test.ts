import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { getAdminComments, moderateComment } from "../commentApi";

vi.mock("@/shared/api/client", () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("admin commentApi", () => {
    it("getAdminComments gửi đúng params sang GET /api/admin/comments", async () => {
        vi.mocked(api.get).mockResolvedValueOnce({
            data: {
                status: 200,
                message: "OK",
                data: {
                    content: [
                        {
                            id: "c-1",
                            postId: "p-1",
                            userId: "u-1",
                            username: "Hater",
                            avatarUrl: null,
                            content: "Very bad comment",
                            parentId: null,
                            status: "active",
                            reportCount: 5,
                            deletedAt: null,
                            createdAt: "2026-11-01T00:00:00Z",
                            updatedAt: "2026-11-01T00:00:00Z",
                        },
                    ],
                    page: 0,
                    size: 10,
                    totalElements: 1,
                    totalPages: 1,
                    first: true,
                    last: true,
                },
            },
        });

        const res = await getAdminComments({
            page: 1,
            size: 10,
            status: "active",
            sort: "createdAt",
        });

        expect(api.get).toHaveBeenCalledWith("/api/admin/comments", {
            params: {
                page: 0,
                size: 10,
                sort: "createdAt,desc",
                status: "active",
            },
        });

        expect(res.data.length).toBe(1);
        expect(res.page).toBe(1);
        expect(res.total).toBe(1);
    });

    it("getAdminComments lọc từ khoá client-side theo q", async () => {
        vi.mocked(api.get).mockResolvedValueOnce({
            data: {
                status: 200,
                message: "OK",
                data: {
                    content: [
                        {
                            id: "c-1",
                            postId: "p-1",
                            userId: "u-1",
                            username: "PlantFan",
                            avatarUrl: null,
                            content: "Delicious healthy food",
                            parentId: null,
                            status: "active",
                            reportCount: 0,
                            deletedAt: null,
                            createdAt: "2026-11-01T00:00:00Z",
                            updatedAt: "2026-11-01T00:00:00Z",
                        },
                        {
                            id: "c-2",
                            postId: "p-2",
                            userId: "u-2",
                            username: "SpamBot",
                            avatarUrl: null,
                            content: "Casino link free money",
                            parentId: null,
                            status: "active",
                            reportCount: 10,
                            deletedAt: null,
                            createdAt: "2026-11-01T00:00:00Z",
                            updatedAt: "2026-11-01T00:00:00Z",
                        },
                    ],
                    page: 0,
                    size: 10,
                    totalElements: 2,
                    totalPages: 1,
                    first: true,
                    last: true,
                },
            },
        });

        const res = await getAdminComments({
            page: 1,
            size: 10,
            q: "casino",
        });

        expect(res.data.length).toBe(1);
        expect(res.data[0].id).toBe("c-2");
    });

    it("moderateComment gọi POST /api/admin/comments/{commentId}/moderate kèm lý do", async () => {
        vi.mocked(api.post).mockResolvedValueOnce({
            data: { status: 200, message: "OK", data: null },
        });

        await moderateComment("c-123", { reason: "Inappropriate advertising" });

        expect(api.post).toHaveBeenCalledWith("/api/admin/comments/c-123/moderate", {
            reason: "Inappropriate advertising",
        });
    });
});
