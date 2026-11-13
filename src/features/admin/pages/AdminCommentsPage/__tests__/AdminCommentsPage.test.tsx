import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import AdminCommentsPage from "../AdminCommentsPage";
import type { AdminComment } from "../../../types";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const { getAdminComments, moderateComment } = vi.hoisted(() => ({
    getAdminComments: vi.fn(),
    moderateComment: vi.fn(),
}));

vi.mock("../../../commentApi", () => ({
    getAdminComments,
    moderateComment,
}));

const MOCK_ADMIN_COMMENTS: AdminComment[] = [
    {
        id: "c-1",
        postId: "post-1111",
        userId: "user-2222",
        username: "SpamBot",
        avatarUrl: null,
        content: "Spam link http://spam.example.com",
        parentId: null,
        status: "active",
        reportCount: 3,
        deletedAt: null,
        createdAt: "2026-11-01T12:00:00Z",
        updatedAt: "2026-11-01T12:00:00Z",
    },
    {
        id: "c-2",
        postId: "post-1111",
        userId: "user-3333",
        username: "NiceUser",
        avatarUrl: null,
        content: "Binh luan da bi go",
        parentId: null,
        status: "removed",
        reportCount: 0,
        deletedAt: "2026-11-02T12:00:00Z",
        createdAt: "2026-11-01T12:00:00Z",
        updatedAt: "2026-11-02T12:00:00Z",
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    getAdminComments.mockResolvedValue({
        data: MOCK_ADMIN_COMMENTS,
        total: 2,
        page: 1,
        size: 10,
        totalPages: 1,
    });
    moderateComment.mockResolvedValue(undefined);
});

describe("AdminCommentsPage", () => {
    it("render tiêu đề, ô tìm kiếm và bộ lọc trạng thái", async () => {
        renderWithProviders(<AdminCommentsPage />);

        expect(screen.getByRole("heading", { name: "Comments" })).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Search by content, author, or ID")).toBeInTheDocument();
        expect(screen.getByRole("combobox", { name: "Filter status" })).toBeInTheDocument();
    });

    it("hiển thị danh sách bình luận kiểm duyệt trong bảng", async () => {
        renderWithProviders(<AdminCommentsPage />);

        await waitFor(() => {
            expect(screen.getByText("SpamBot")).toBeInTheDocument();
            expect(screen.getByText("Spam link http://spam.example.com")).toBeInTheDocument();
            expect(screen.getByText("3 reports")).toBeInTheDocument();
            expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText("Removed").length).toBeGreaterThanOrEqual(1);
        });
    });

    it("bấm nút Gỡ bình luận mở hộp thoại và gửi lý do kiểm duyệt", async () => {
        const user = userEvent.setup();
        renderWithProviders(<AdminCommentsPage />);

        await waitFor(() => {
            expect(screen.getByText("SpamBot")).toBeInTheDocument();
        });

        const moderateButton = screen.getByRole("button", { name: "Moderate" });
        await user.click(moderateButton);

        expect(screen.getByRole("heading", { name: "Moderate / Remove Comment" })).toBeInTheDocument();

        const reasonInput = screen.getByPlaceholderText("Enter reason (spam, inappropriate language, guidelines violation...)");
        await user.type(reasonInput, "Violates guidelines with spam link");

        const submitBtn = screen.getByRole("button", { name: "Confirm Moderation" });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(moderateComment).toHaveBeenCalledWith("c-1", {
                reason: "Violates guidelines with spam link",
            });
        });
    });

    it("hiển thị EmptyState khi không có bình luận nào", async () => {
        getAdminComments.mockResolvedValueOnce({
            data: [],
            total: 0,
            page: 1,
            size: 10,
            totalPages: 0,
        });

        renderWithProviders(<AdminCommentsPage />);

        await waitFor(() => {
            expect(screen.getByText("No comments found")).toBeInTheDocument();
        });
    });
});
