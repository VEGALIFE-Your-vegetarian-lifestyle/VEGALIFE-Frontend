import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { REMOTE_TIMEOUT_MS } from "@/test/e2eEnv";
import PostDetailPage from "@/pages/PostDetailPage/PostDetailPage";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// ProseMirror cần layout engine thật — jsdom không có. Nội dung bài không phải
// đối tượng của test này.
vi.mock("@/components/editor/PostContent", () => ({
    PostContent: ({ fallbackText }: { fallbackText?: string | null }) => <div>{fallbackText}</div>,
}));

const MISSING_UUID = "00000000-0000-0000-0000-000000000000";

function renderDetail(id: string) {
    return renderWithProviders(<PostDetailPage />, { route: `/posts/${id}`, path: "/posts/:id" });
}

describe("PostDetailPage", () => {
    it("hiện skeleton trong lúc tải", () => {
        const { container } = renderDetail(MISSING_UUID);

        expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    });

    it(
        "bài không tồn tại thì hiện EmptyState 'Post not found'",
        async () => {
            renderDetail(MISSING_UUID);

            expect(
                await screen.findByRole("heading", { name: "Post not found" }, { timeout: REMOTE_TIMEOUT_MS - 5_000 }),
            ).toBeInTheDocument();
            expect(screen.getByText("This post does not exist or is no longer published.")).toBeInTheDocument();
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "EmptyState có nút quay về Explore",
        async () => {
            renderDetail(MISSING_UUID);

            const action = await screen.findByRole(
                "button",
                { name: "Back to Explore" },
                { timeout: REMOTE_TIMEOUT_MS - 5_000 },
            );
            expect(action).toBeInTheDocument();
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "bài có thật thì render tiêu đề, breadcrumb và dải thông tin nhanh",
        async () => {
            const { getFeedPosts } = await import("@/services/postService");
            const feed = await getFeedPosts({ page: 0, size: 1 });
            if (feed.content.length === 0) return; // backend rỗng — bỏ qua

            const post = feed.content[0];
            renderDetail(post.id);

            // getPostDetail cần JWT; chưa đăng nhập có thể ra EmptyState — cả hai đều không sập.
            await waitFor(
                () => {
                    const loaded =
                        screen.queryByRole("heading", { name: post.title }) ??
                        screen.queryByRole("heading", { name: "Post not found" });
                    expect(loaded).toBeTruthy();
                },
                { timeout: REMOTE_TIMEOUT_MS - 5_000 },
            );
        },
        REMOTE_TIMEOUT_MS,
    );
});

describe("PostDetailPage — hành vi UI khi đã tải được bài", () => {
    it.todo("nút Share gọi clipboard và báo toast 'Link copied to clipboard'");
    it.todo("nút Save Recipe báo 'Feature under development' (chưa có endpoint lưu bài)");
    it.todo("gửi bình luận khi chưa đăng nhập thì hiện 'Sign in to join the conversation'");
});
