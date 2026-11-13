import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { PostListResponse } from "../../../types";
import { FeedPostCard } from "../FeedPostCard";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// `vi.mock` bị hoist lên đầu file → mọi biến nó dùng phải khai báo qua `vi.hoisted`.
const { POST_ID, getPostVotes, getPostComments } = vi.hoisted(() => ({
    POST_ID: "11111111-1111-1111-1111-111111111111",
    getPostVotes: vi.fn(),
    getPostComments: vi.fn(),
}));

const POST: PostListResponse = {
    id: POST_ID,
    title: "Creamy Coconut Curry",
    content: "A rich coconut curry with chickpeas.",
    featuredImageUrl: null,
    categoryIds: [],
    mediaIds: [],
    recipeIds: [],
    status: "published",
    viewCount: 42,
    publishedAt: "2026-10-01T00:00:00Z",
    createdAt: "2026-10-01T00:00:00Z",
};

vi.mock("../../../api", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../../api")>();
    return { ...actual, getPostVotes, getPostComments };
});

beforeEach(() => {
    getPostVotes.mockReset().mockResolvedValue({
        postId: POST_ID,
        likeCount: 3,
        dislikeCount: 1,
        userVote: null,
    });
    getPostComments.mockReset().mockResolvedValue({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
    });
});

describe("FeedPostCard", () => {
    it("hiện tiêu đề + số vote đọc được khi chưa đăng nhập", async () => {
        renderWithProviders(<FeedPostCard post={POST} onOpenComments={vi.fn()} />);

        expect(screen.getByRole("link", { name: POST.title })).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText("3")).toBeInTheDocument());
    });

    it("bấm nút bình luận thì gọi onOpenComments", async () => {
        const onOpenComments = vi.fn();
        renderWithProviders(<FeedPostCard post={POST} onOpenComments={onOpenComments} />);

        await userEvent.click(screen.getByRole("button", { name: "Comment" }));

        expect(onOpenComments).toHaveBeenCalledWith(POST);
    });

    it("hiện số bình luận lấy từ `totalElements` (chỉ 1 comment/trang)", async () => {
        getPostComments.mockResolvedValue({
            content: [],
            page: 0,
            size: 1,
            totalElements: 48,
            totalPages: 48,
            first: true,
            last: false,
        });

        renderWithProviders(<FeedPostCard post={POST} onOpenComments={vi.fn()} />);

        await waitFor(() => expect(screen.getByText("48 Comments")).toBeInTheDocument());
        expect(getPostComments).toHaveBeenCalledWith(POST_ID, { page: 0, size: 1 });
    });
});
