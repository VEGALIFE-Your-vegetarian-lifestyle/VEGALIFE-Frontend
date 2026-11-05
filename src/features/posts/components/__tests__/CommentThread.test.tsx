import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useAuthStore } from "@/shared/auth/authStore";
import { CommentThread } from "../CommentThread";
import type { PostCommentThread } from "../../types";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const { updateComment, deleteComment, reportComment, createComment, removeLocalComment } = vi.hoisted(() => ({
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
    reportComment: vi.fn(),
    createComment: vi.fn(),
    removeLocalComment: vi.fn(),
}));

vi.mock("../../api", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../api")>();
    return {
        ...actual,
        updateComment,
        deleteComment,
        reportComment,
        createComment,
        removeLocalComment,
    };
});

const POST_ID = "post-1234-uuid";
const USER_ID = "user-owner-123";

const MOCK_COMMENT: PostCommentThread = {
    id: "comment-1",
    userId: USER_ID,
    username: "PlantLover",
    avatarUrl: null,
    content: "Mon nay nau bao nhieu phut thi ngon?",
    edited: false,
    deleted: false,
    createdAt: "2026-11-01T10:00:00Z",
    updatedAt: "2026-11-01T10:00:00Z",
    replies: [],
};

const MOCK_DELETED_COMMENT: PostCommentThread = {
    id: "comment-2",
    userId: null,
    username: null,
    avatarUrl: null,
    content: "[deleted]",
    edited: false,
    deleted: true,
    createdAt: "2026-11-01T10:00:00Z",
    updatedAt: "2026-11-01T10:00:00Z",
    replies: [],
};

beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
    updateComment.mockResolvedValue({ id: "comment-1", content: "Updated content" });
    deleteComment.mockResolvedValue(undefined);
    reportComment.mockResolvedValue(undefined);
    createComment.mockResolvedValue({ id: "reply-1", content: "Reply text" });
});

afterEach(() => {
    useAuthStore.getState().clearAuth();
});

describe("CommentThread", () => {
    it("render đúng tên tác giả, nội dung và nút Trả lời khi chưa đăng nhập", () => {
        renderWithProviders(
            <CommentThread postId={POST_ID} comment={MOCK_COMMENT} language="en" />,
        );

        expect(screen.getByText("PlantLover")).toBeInTheDocument();
        expect(screen.getByText("Mon nay nau bao nhieu phut thi ngon?")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Reply" })).toBeInTheDocument();
    });

    it("ưu tiên hiển thị displayName từ backend khi username là null", () => {
        const commentWithDisplayName: PostCommentThread = {
            ...MOCK_COMMENT,
            id: "comment-display-name",
            username: null,
            displayName: "Chef Green",
        };

        renderWithProviders(
            <CommentThread postId={POST_ID} comment={commentWithDisplayName} language="en" />,
        );

        expect(screen.getByText("Chef Green")).toBeInTheDocument();
        expect(screen.queryByText("[deleted]")).not.toBeInTheDocument();
    });

    it("comment đã xoá mềm hiển thị [deleted] và không có nút Trả lời hay nút Sửa/Xoá", () => {
        renderWithProviders(
            <CommentThread postId={POST_ID} comment={MOCK_DELETED_COMMENT} language="en" />,
        );

        expect(screen.getAllByText("[deleted]").length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByRole("button", { name: "Reply" })).not.toBeInTheDocument();
        expect(screen.queryByTitle("Edit comment")).not.toBeInTheDocument();
        expect(screen.queryByTitle("Delete")).not.toBeInTheDocument();
    });

    it("bấm nút Trả lời khi đã đăng nhập thì hiển thị form reply", async () => {
        const user = userEvent.setup();
        useAuthStore.getState().setAuth({
            user: { id: "user-2", username: "VeganCook", email: "cook@example.com", role: "USER", status: "activated" },
            accessToken: "mock-token",
            refreshToken: "mock-refresh",
        });

        renderWithProviders(
            <CommentThread postId={POST_ID} comment={MOCK_COMMENT} language="en" />,
        );

        const replyButton = screen.getByRole("button", { name: "Reply" });
        await user.click(replyButton);

        expect(screen.getByPlaceholderText("Reply to @PlantLover...")).toBeInTheDocument();
    });

    it("chủ comment có thể bấm Sửa và lưu nội dung mới", async () => {
        const user = userEvent.setup();
        useAuthStore.getState().setAuth({
            user: { id: USER_ID, username: "PlantLover", email: "plant@example.com", role: "USER", status: "activated" },
            accessToken: "mock-token",
            refreshToken: "mock-refresh",
        });

        renderWithProviders(
            <CommentThread postId={POST_ID} comment={MOCK_COMMENT} language="en" />,
        );

        const editButton = screen.getByTitle("Edit comment");
        expect(editButton).toBeInTheDocument();
        await user.click(editButton);

        const textarea = screen.getByRole("textbox");
        expect(textarea).toHaveValue("Mon nay nau bao nhieu phut thi ngon?");

        await user.clear(textarea);
        await user.type(textarea, "Noi dung da sua hoan toan!");

        const saveButton = screen.getByRole("button", { name: "Save Changes" });
        await user.click(saveButton);

        await waitFor(() => {
            expect(updateComment).toHaveBeenCalledWith(POST_ID, "comment-1", {
                content: "Noi dung da sua hoan toan!",
            });
        });
    });

    it("chủ comment có thể bấm Xoá và xác nhận trong hộp thoại", async () => {
        const user = userEvent.setup();
        useAuthStore.getState().setAuth({
            user: { id: USER_ID, username: "PlantLover", email: "plant@example.com", role: "USER", status: "activated" },
            accessToken: "mock-token",
            refreshToken: "mock-refresh",
        });

        renderWithProviders(
            <CommentThread postId={POST_ID} comment={MOCK_COMMENT} language="en" />,
        );

        const deleteButton = screen.getByTitle("Delete");
        expect(deleteButton).toBeInTheDocument();
        await user.click(deleteButton);

        expect(screen.getByText("Delete Comment?")).toBeInTheDocument();

        // Bấm nút Delete trong hộp thoại xác nhận
        const confirmButtons = screen.getAllByRole("button", { name: "Delete" });
        const dialogConfirmBtn = confirmButtons[confirmButtons.length - 1];
        await user.click(dialogConfirmBtn);

        await waitFor(() => {
            expect(deleteComment).toHaveBeenCalledWith(POST_ID, "comment-1");
            expect(removeLocalComment).toHaveBeenCalledWith(POST_ID, "comment-1");
        });
    });

    it("người dùng khác không thấy nút Sửa mà thấy nút Báo cáo", async () => {
        useAuthStore.getState().setAuth({
            user: { id: "another-user-999", username: "Reader", email: "reader@example.com", role: "USER", status: "activated" },
            accessToken: "mock-token",
            refreshToken: "mock-refresh",
        });

        renderWithProviders(
            <CommentThread postId={POST_ID} comment={MOCK_COMMENT} language="en" />,
        );

        expect(screen.queryByTitle("Edit comment")).not.toBeInTheDocument();
        expect(screen.getByTitle("Report comment")).toBeInTheDocument();
    });

    it("render cây reply lồng nhau có badge Trả lời @username", () => {
        const commentWithReply: PostCommentThread = {
            ...MOCK_COMMENT,
            replies: [
                {
                    id: "reply-nested-1",
                    userId: "user-nested",
                    parentId: MOCK_COMMENT.id,
                    replyToUsername: "PlantLover",
                    username: "SousChef",
                    displayName: "SousChef",
                    avatarUrl: null,
                    content: "Tam 15 phut la ngon nhat nha!",
                    edited: false,
                    deleted: false,
                    createdAt: "2026-11-01T10:05:00Z",
                    updatedAt: "2026-11-01T10:05:00Z",
                    replies: [],
                },
            ],
        };

        renderWithProviders(
            <CommentThread postId={POST_ID} comment={commentWithReply} language="en" />,
        );

        expect(screen.getByText("PlantLover")).toBeInTheDocument();
        expect(screen.getByText("SousChef")).toBeInTheDocument();
        expect(screen.getByText("Tam 15 phut la ngon nhat nha!")).toBeInTheDocument();
        expect(screen.getByText("@PlantLover")).toBeInTheDocument();
    });
});
