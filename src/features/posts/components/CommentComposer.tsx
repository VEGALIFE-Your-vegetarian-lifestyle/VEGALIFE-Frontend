import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { createComment } from "../api";

/** BE chưa khai báo giới hạn — chặn ở client cho khỏi gửi payload vô hạn. */
const MAX_COMMENT_LENGTH = 1000;

interface CommentComposerProps {
    postId: string;
    /** Compact = ô cao 9, dùng trong card feed. */
    compact?: boolean;
}

/**
 * Form gửi bình luận gốc — dùng chung Post Detail (sidebar) và card feed Explore.
 *
 * `POST` trả `CommentResponse` (thiếu `username`/`replies`) nên sau khi gửi **phải**
 * invalidate `["post-comments", postId]` để đọc lại cây từ `GET`, không render từ response.
 */
export function CommentComposer({ postId, compact = false }: CommentComposerProps) {
    const { t } = useTranslation("post");
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [draft, setDraft] = useState("");

    const commentMutation = useMutation({
        mutationFn: (content: string) => createComment(postId, { content, parentId: null }),
        onSuccess: () => {
            setDraft("");
            toast.success(t("comments.posted"));
            queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
        },
        onError: (error: unknown) => toast.error(getApiErrorMessage(error, t("common:error"))),
    });

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const content = draft.trim();
        if (!content) return;
        commentMutation.mutate(content);
    };

    if (!isAuthenticated) {
        return (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <Link to="/login" className="font-semibold text-vegan-green hover:underline">
                    {t("comments.loginToComment")}
                </Link>
            </p>
        );
    }

    return (
        <form className="flex gap-2" onSubmit={handleSubmit}>
            <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={MAX_COMMENT_LENGTH}
                placeholder={t("comments.placeholder")}
                aria-label={t("comments.placeholder")}
                disabled={commentMutation.isPending}
                className={
                    compact
                        ? "h-9 flex-1 rounded-full border border-border bg-surface px-4 text-sm text-dark placeholder:text-muted-foreground focus-visible:border-vegan-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green disabled:opacity-50"
                        : "h-11 flex-1 rounded-xl border border-border bg-surface px-4 text-sm text-dark placeholder:text-muted-foreground focus-visible:border-vegan-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green disabled:opacity-50"
                }
            />
            <Button
                type="submit"
                size={compact ? "sm" : "default"}
                shape={compact ? "pill" : "default"}
                aria-label={t("comments.submit")}
                disabled={commentMutation.isPending || draft.trim().length === 0}
            >
                {commentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                )}
            </Button>
        </form>
    );
}
