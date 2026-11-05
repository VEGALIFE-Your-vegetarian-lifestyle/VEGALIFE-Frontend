import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import type { PageResponse } from "@/shared/types/common";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { createComment, saveLocalComment } from "../api";
import type { PostCommentThread } from "../types";

/** BE chưa khai báo giới hạn — chặn ở client cho khỏi gửi payload vô hạn. */
const MAX_COMMENT_LENGTH = 1000;

function addCommentToTree(
    threads: PostCommentThread[],
    newComment: PostCommentThread,
    parentId?: string | null,
): PostCommentThread[] {
    if (!parentId) {
        if (threads.some((c) => c.id === newComment.id)) return threads;
        return [newComment, ...threads];
    }
    return threads.map((c) => {
        if (c.id === parentId) {
            if (c.replies?.some((r) => r.id === newComment.id)) return c;
            return { ...c, replies: [...(c.replies ?? []), newComment] };
        }
        if (c.replies && c.replies.length > 0) {
            return { ...c, replies: addCommentToTree(c.replies, newComment, parentId) };
        }
        return c;
    });
}

interface CommentComposerProps {
    postId: string;
    /** null = comment gốc; UUID = reply dưới comment đó. */
    parentId?: string | null;
    /** Tên người dùng đang được reply để hiện placeholder thân thiện. */
    replyToUsername?: string;
    /** Compact = ô cao 9, dùng trong card feed hoặc reply. */
    compact?: boolean;
    /** Tự động focus ô nhập khi mở form reply. */
    autoFocus?: boolean;
    /** Callback gọi khi gửi thành công. */
    onSuccess?: () => void;
    /** Callback khi bấm Hủy (nếu truyền thì hiện nút Hủy). */
    onCancel?: () => void;
}

/**
 * Form gửi bình luận gốc hoặc reply — dùng chung Post Detail, card feed Explore và reply thread.
 *
 * `POST` trả `CommentResponse` (thiếu `username`/`replies`) nên sau khi gửi **phải**
 * invalidate `["post-comments", postId]` để đọc lại cây từ `GET`, không render từ response.
 */
export function CommentComposer({
    postId,
    parentId = null,
    replyToUsername,
    compact = false,
    autoFocus = false,
    onSuccess,
    onCancel,
}: CommentComposerProps) {
    const { t } = useTranslation("post");
    const { isAuthenticated, user, profile } = useAuth();
    const queryClient = useQueryClient();
    const [draft, setDraft] = useState("");

    const commentMutation = useMutation({
        mutationFn: (content: string) => createComment(postId, { content, parentId }),
        onSuccess: async (created) => {
            setDraft("");
            toast.success(parentId ? t("comments.replyPosted") : t("comments.posted"));

            const authorName = profile?.displayName || user?.username || "You";
            const newThreadItem: PostCommentThread = {
                id: created.id,
                userId: created.userId || user?.id || null,
                parentId: parentId || created.parentId || null,
                replyToUsername: replyToUsername || null,
                username: authorName,
                displayName: authorName,
                avatarUrl: profile?.avatarUrl ?? null,
                content: created.content,
                edited: false,
                deleted: false,
                createdAt: created.createdAt || new Date().toISOString(),
                updatedAt: created.updatedAt || new Date().toISOString(),
                replies: [],
            };

            // Lưu dự phòng vào localStorage để F5 vẫn còn nếu backend gặp sự cố 500
            saveLocalComment(postId, newThreadItem, parentId, replyToUsername);

            // 1. Cập nhật ngay bộ nhớ đệm danh sách bình luận (mọi phân trang)
            queryClient.setQueriesData<PageResponse<PostCommentThread>>(
                { queryKey: ["post-comments", postId] },
                (old) => {
                    if (!old) {
                        return {
                            content: [newThreadItem],
                            page: 0,
                            size: 20,
                            totalElements: 1,
                            totalPages: 1,
                            first: true,
                            last: true,
                        };
                    }
                    return {
                        ...old,
                        totalElements: (old.totalElements ?? 0) + 1,
                        content: addCommentToTree(old.content ?? [], newThreadItem, parentId),
                    };
                },
            );

            // 2. Cập nhật ngay bộ nhớ đệm số lượng bình luận ở card feed
            queryClient.setQueriesData<PageResponse<PostCommentThread>>(
                { queryKey: ["post-comment-count", postId] },
                (old) => {
                    if (!old) {
                        return {
                            content: [],
                            page: 0,
                            size: 1,
                            totalElements: 1,
                            totalPages: 1,
                            first: true,
                            last: true,
                        };
                    }
                    return {
                        ...old,
                        totalElements: (old.totalElements ?? 0) + 1,
                    };
                },
            );

            // 3. Invalidate để đồng bộ ngầm với backend
            await queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
            await queryClient.invalidateQueries({ queryKey: ["post-comment-count", postId] });
            onSuccess?.();
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

    const placeholder = replyToUsername
        ? t("comments.replyPlaceholder", { username: replyToUsername })
        : t("comments.placeholder");

    return (
        <form className="flex gap-2" onSubmit={handleSubmit}>
            <input
                type="text"
                value={draft}
                autoFocus={autoFocus}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={MAX_COMMENT_LENGTH}
                placeholder={placeholder}
                aria-label={placeholder}
                disabled={commentMutation.isPending}
                className={
                    compact
                        ? "h-9 flex-1 rounded-full border border-border bg-surface px-4 text-sm text-dark placeholder:text-muted-foreground focus-visible:border-vegan-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green disabled:opacity-50"
                        : "h-11 flex-1 rounded-xl border border-border bg-surface px-4 text-sm text-dark placeholder:text-muted-foreground focus-visible:border-vegan-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green disabled:opacity-50"
                }
            />
            {onCancel && (
                <Button
                    type="button"
                    variant="ghost"
                    size={compact ? "sm" : "default"}
                    onClick={onCancel}
                    disabled={commentMutation.isPending}
                >
                    {t("comments.cancel")}
                </Button>
            )}
            <Button
                type="submit"
                size={compact ? "sm" : "default"}
                shape={compact ? "pill" : "default"}
                aria-label={parentId ? t("comments.replySubmit") : t("comments.submit")}
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
