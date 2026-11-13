import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import { PostVoteButtons } from "../PostVoteButtons";
import { toast } from "sonner";

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

const { POST_ID, getPostVotes, setPostVote, mockAuth } = vi.hoisted(() => ({
    POST_ID: "post-vote-123",
    getPostVotes: vi.fn(),
    setPostVote: vi.fn(),
    mockAuth: {
        isAuthenticated: false,
        user: null,
    },
}));

vi.mock("../../api", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../api")>();
    return {
        ...actual,
        getPostVotes,
        setPostVote,
    };
});

vi.mock("@/features/auth/useAuth", () => ({
    useAuth: () => mockAuth,
}));

describe("PostVoteButtons", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.isAuthenticated = false;
        mockAuth.user = null;

        getPostVotes.mockResolvedValue({
            postId: POST_ID,
            likeCount: 10,
            dislikeCount: 2,
            userVote: null,
        });

        setPostVote.mockResolvedValue({
            postId: POST_ID,
            likeCount: 11,
            dislikeCount: 2,
            userVote: "UPVOTE",
        });
    });

    it("hiển thị số like và dislike khi chưa đăng nhập", async () => {
        renderWithProviders(<PostVoteButtons postId={POST_ID} />);

        await waitFor(() => {
            expect(screen.getByText("10")).toBeInTheDocument();
            expect(screen.getByText("2")).toBeInTheDocument();
        });
    });

    it("khi chưa đăng nhập, bấm vote thì hiện toast yêu cầu đăng nhập và không gọi API", async () => {
        renderWithProviders(<PostVoteButtons postId={POST_ID} />);

        await waitFor(() => expect(screen.getByText("10")).toBeInTheDocument());

        const upvoteButton = screen.getByRole("button", { name: /^like$/i });
        await userEvent.click(upvoteButton);

        expect(toast.error).toHaveBeenCalled();
        expect(setPostVote).not.toHaveBeenCalled();
    });

    it("khi đã đăng nhập, bấm vote sẽ gọi setPostVote với đúng voteType và cập nhật lạc quan", async () => {
        mockAuth.isAuthenticated = true;
        mockAuth.user = { id: "user-1", email: "test@vegalife.com" } as any;

        renderWithProviders(<PostVoteButtons postId={POST_ID} />);

        await waitFor(() => expect(screen.getByText("10")).toBeInTheDocument());

        const upvoteButton = screen.getByRole("button", { name: /^like$/i });
        await userEvent.click(upvoteButton);

        expect(setPostVote).toHaveBeenCalledWith(POST_ID, "UPVOTE");
        // Optimistic update: likeCount tăng lên 11 ngay tức thì
        await waitFor(() => expect(screen.getByText("11")).toBeInTheDocument());
    });

    it("rollback số đếm về trạng thái cũ nếu API setPostVote bị lỗi", async () => {
        mockAuth.isAuthenticated = true;
        mockAuth.user = { id: "user-1", email: "test@vegalife.com" } as any;

        setPostVote.mockRejectedValueOnce(new Error("Network Error"));

        renderWithProviders(<PostVoteButtons postId={POST_ID} />);

        await waitFor(() => expect(screen.getByText("10")).toBeInTheDocument());

        const upvoteButton = screen.getByRole("button", { name: /^like$/i });
        await userEvent.click(upvoteButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
            // Đã rollback lại về 10
            expect(screen.getByText("10")).toBeInTheDocument();
        });
    });
});
