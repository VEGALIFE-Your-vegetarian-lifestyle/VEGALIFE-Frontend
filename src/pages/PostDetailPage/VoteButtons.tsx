import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getVotes, putVote } from "@/services/postService";
import { getApiErrorMessage } from "@/utils/apiError";
import { cn } from "@/lib/utils";
import type { VoteType } from "@/types/vote";

/**
 * #33/#34 — toggle 3 trạng thái (BR-VOTE-001): gửi trùng type thì gỡ vote,
 * gửi type khác thì chuyển vote. Server trả lại state mới, không tự cộng trừ ở client.
 */
export function VoteButtons({ postId }: { postId: string }) {
    const { t } = useTranslation("post");
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // `isAuthenticated` nằm trong key: đăng nhập xong phải đọc lại để có `userVote`.
    const { data } = useQuery({
        queryKey: ["post-votes", postId, isAuthenticated],
        queryFn: () => getVotes(postId),
        enabled: postId !== "",
    });

    const mutation = useMutation({
        mutationFn: (voteType: VoteType) => putVote(postId, { voteType }),
        onSuccess: (state) => queryClient.setQueryData(["post-votes", postId, isAuthenticated], state),
        onError: (error: unknown) => toast.error(getApiErrorMessage(error, t("common:error"))),
    });

    const vote = (voteType: VoteType) => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
        mutation.mutate(voteType);
    };

    const likes = data?.likeCount ?? 0;
    const dislikes = data?.dislikeCount ?? 0;

    return (
        <div className="flex items-center gap-1" role="group" aria-label={t("votes.label")}>
            <Button
                variant="outline"
                disabled={mutation.isPending}
                aria-pressed={data?.userVote === "UPVOTE"}
                onClick={() => vote("UPVOTE")}
                className={cn(data?.userVote === "UPVOTE" && "border-vegan-green bg-vegan-green-subtle text-vegan-green")}
            >
                <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                {likes.toLocaleString()}
            </Button>
            <Button
                variant="outline"
                disabled={mutation.isPending}
                aria-pressed={data?.userVote === "DOWNVOTE"}
                onClick={() => vote("DOWNVOTE")}
                className={cn(data?.userVote === "DOWNVOTE" && "border-danger text-danger")}
            >
                <ThumbsDown className="h-4 w-4" aria-hidden="true" />
                {dislikes.toLocaleString()}
            </Button>
        </div>
    );
}
