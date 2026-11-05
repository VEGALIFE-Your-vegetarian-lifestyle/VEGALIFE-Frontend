import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { cn } from "@/shared/utils/cn";
import { getPostVotes, setPostVote, type PostVotes } from "../api";

interface PostVoteButtonsProps {
    postId: string;
    /** Ẩn nhãn chữ (mobile ở card feed). Luôn còn `aria-label`. */
    compact?: boolean;
}

/**
 * `GET/PUT /api/posts/{id}/votes`. GET **public** (curl anon 2026-11-02 → 200) nên khách
 * vẫn đọc được số; PUT cần JWT, khách bấm thì toast thay vì gửi request chắc chắn 401.
 *
 * Dùng ở card feed Explore và dialog bình luận — cùng `queryKey` nên số luôn khớp nhau.
 */
export function PostVoteButtons({ postId, compact = false }: PostVoteButtonsProps) {
    const { t } = useTranslation(["post", "common"]);
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    const { data: votes } = useQuery({
        queryKey: ["post-votes", postId],
        queryFn: () => getPostVotes(postId),
        staleTime: 60_000,
    });

    const voteMutation = useMutation({
        mutationFn: (voteType: "UPVOTE" | "DOWNVOTE") => setPostVote(postId, voteType),
        onMutate: async (voteType: "UPVOTE" | "DOWNVOTE") => {
            await queryClient.cancelQueries({ queryKey: ["post-votes", postId] });
            const previous = queryClient.getQueryData<PostVotes>(["post-votes", postId]);

            if (previous) {
                let nextLike = previous.likeCount;
                let nextDislike = previous.dislikeCount;
                let nextVote: "UPVOTE" | "DOWNVOTE" | null = null;

                if (previous.userVote === voteType) {
                    // Toggle off (bỏ vote)
                    if (voteType === "UPVOTE") nextLike = Math.max(0, nextLike - 1);
                    else nextDislike = Math.max(0, nextDislike - 1);
                    nextVote = null;
                } else {
                    // Chuyển vote hoặc vote mới
                    if (previous.userVote === "UPVOTE") nextLike = Math.max(0, nextLike - 1);
                    if (previous.userVote === "DOWNVOTE") nextDislike = Math.max(0, nextDislike - 1);

                    if (voteType === "UPVOTE") nextLike += 1;
                    else nextDislike += 1;
                    nextVote = voteType;
                }

                queryClient.setQueryData<PostVotes>(["post-votes", postId], {
                    ...previous,
                    likeCount: nextLike,
                    dislikeCount: nextDislike,
                    userVote: nextVote,
                });
            }

            return { previous };
        },
        onError: (error: unknown, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["post-votes", postId], context.previous);
            }
            toast.error(getApiErrorMessage(error, t("common:error")));
        },
        onSettled: (data) => {
            if (data) {
                queryClient.setQueryData(["post-votes", postId], data);
            }
        },
    });

    const handleVote = (voteType: "UPVOTE" | "DOWNVOTE") => {
        if (!isAuthenticated) {
            toast.error(t("post:votes.loginRequired"));
            return;
        }
        voteMutation.mutate(voteType);
    };

    const buttons = [
        { type: "UPVOTE" as const, icon: ArrowBigUp, label: t("post:votes.like"), count: votes?.likeCount ?? 0, active: "bg-vegan-green-light text-vegan-green" },
        { type: "DOWNVOTE" as const, icon: ArrowBigDown, label: t("post:votes.dislike"), count: votes?.dislikeCount ?? 0, active: "bg-danger-soft text-danger" },
    ];

    return (
        <>
            {buttons.map(({ type, icon: Icon, label, count, active }) => (
                <button
                    key={type}
                    type="button"
                    onClick={() => handleVote(type)}
                    disabled={voteMutation.isPending}
                    aria-pressed={votes?.userVote === type}
                    aria-label={label}
                    className={cn(
                        "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 sm:px-3",
                        votes?.userVote === type ? active : "text-muted-foreground hover:bg-muted-bg hover:text-dark",
                    )}
                >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {!compact && <span className="hidden sm:inline">{label}</span>}
                    <span className="tabular-nums">{count.toLocaleString()}</span>
                </button>
            ))}
        </>
    );
}
