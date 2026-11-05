import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CornerDownRight, Flag, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { cn } from "@/shared/utils/cn";
import { useAuth } from "@/features/auth/useAuth";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { deleteComment, reportComment, updateComment } from "../api";
import { CommentComposer } from "./CommentComposer";
import type { PostCommentThread } from "../types";
import type { PageResponse } from "@/shared/types/common";

interface CommentThreadProps {
    comment: PostCommentThread;
    postId?: string;
    depth?: number;
    language: string;
    /** Tên tác giả của comment cha (nếu đây là câu trả lời). */
    parentAuthor?: string;
}

const MAX_COMMENT_LENGTH = 1000;

function updateCommentInTree(
    threads: PostCommentThread[],
    commentId: string,
    newContent: string,
): PostCommentThread[] {
    return threads.map((c) => {
        if (c.id === commentId) {
            return { ...c, content: newContent, edited: true };
        }
        if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateCommentInTree(c.replies, commentId, newContent) };
        }
        return c;
    });
}

function markDeletedInTree(
    threads: PostCommentThread[],
    commentId: string,
): PostCommentThread[] {
    return threads.map((c) => {
        if (c.id === commentId) {
            return { ...c, deleted: true, content: "[deleted]" };
        }
        if (c.replies && c.replies.length > 0) {
            return { ...c, replies: markDeletedInTree(c.replies, commentId) };
        }
        return c;
    });
}

/**
 * Một comment gốc + cả cây reply. Comment đã xoá mềm vẫn hiện (giữ chỗ cho reply)
 * nhưng không có tác giả và nội dung là chuỗi `[deleted]` do BE trả.
 *
 * Hỗ trợ:
 * - Trả lời (Reply) lồng vào comment này
 * - Sửa nội dung (nếu là chủ comment)
 * - Xoá comment (nếu là chủ comment hoặc admin)
 * - Báo cáo vi phạm
 */
export function CommentThread({
    comment,
    postId = "",
    depth = 0,
    language,
    parentAuthor,
}: CommentThreadProps) {
    const { t } = useTranslation(["post", "common"]);
    const queryClient = useQueryClient();
    const { user, isAuthenticated, isAdmin } = useAuth();

    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editDraft, setEditDraft] = useState(comment.content);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [reportReason, setReportReason] = useState("");

    const author = comment.displayName ?? comment.username ?? t("comments.deletedAuthor");
    const replyTarget = comment.replyToUsername || (depth > 0 ? parentAuthor : null);
    const isOwner = !comment.deleted && !!user?.id && user.id === comment.userId;
    const canEdit = isOwner;
    const canDelete = !comment.deleted && isAuthenticated && (isOwner || isAdmin);
    const canReport = !comment.deleted && isAuthenticated && !isOwner;
    const canReply = !comment.deleted;

    const invalidate = async () => {
        if (postId) {
            await queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
            await queryClient.invalidateQueries({ queryKey: ["post-comment-count", postId] });
            await queryClient.refetchQueries({ queryKey: ["post-comments", postId] });
            await queryClient.refetchQueries({ queryKey: ["post-comment-count", postId] });
        }
    };

    const updateMutation = useMutation({
        mutationFn: (content: string) => updateComment(postId, comment.id, { content }),
        onSuccess: (updated) => {
            setIsEditing(false);
            toast.success(t("comments.editedSuccess"));
            if (postId) {
                queryClient.setQueriesData<PageResponse<PostCommentThread>>(
                    { queryKey: ["post-comments", postId] },
                    (old) => {
                        if (!old) return old;
                        return {
                            ...old,
                            content: updateCommentInTree(old.content ?? [], comment.id, updated.content),
                        };
                    },
                );
            }
            invalidate();
        },
        onError: (error: unknown) => toast.error(getApiErrorMessage(error, t("common:error"))),
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteComment(postId, comment.id),
        onSuccess: () => {
            setShowDeleteConfirm(false);
            toast.success(t("comments.deletedSuccess"));
            if (postId) {
                queryClient.setQueriesData<PageResponse<PostCommentThread>>(
                    { queryKey: ["post-comments", postId] },
                    (old) => {
                        if (!old) return old;
                        return {
                            ...old,
                            content: markDeletedInTree(old.content ?? [], comment.id),
                        };
                    },
                );
            }
            invalidate();
        },
        onError: (error: unknown) => toast.error(getApiErrorMessage(error, t("common:error"))),
    });

    const reportMutation = useMutation({
        mutationFn: (reason?: string) => reportComment(postId, comment.id, { reason }),
        onSuccess: () => {
            setShowReportDialog(false);
            setReportReason("");
            toast.success(t("comments.reportSuccess"));
        },
        onError: (error: unknown) => toast.error(getApiErrorMessage(error, t("common:error"))),
    });

    const handleSaveEdit = (event: FormEvent) => {
        event.preventDefault();
        const content = editDraft.trim();
        if (!content) return;
        updateMutation.mutate(content);
    };

    const handleConfirmDelete = () => {
        deleteMutation.mutate();
    };

    const handleReportSubmit = (event: FormEvent) => {
        event.preventDefault();
        reportMutation.mutate(reportReason.trim() || undefined);
    };

    return (
        <div
            className={cn(
                "rounded-xl border transition-colors",
                depth > 0
                    ? "p-3 sm:p-3.5 bg-surface border-border/80 shadow-xs"
                    : "p-4 bg-muted-bg border-border",
                comment.deleted && "border-dashed opacity-80",
            )}
        >
            <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                    <Avatar name={comment.deleted ? undefined : author} src={comment.avatarUrl} size="sm" />
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-bold text-dark">{author}</p>
                            {replyTarget && !comment.deleted && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-vegan-green/10 px-1.5 py-0.5 text-[11px] font-medium text-vegan-green">
                                    <CornerDownRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                                    <span>
                                        {t("comments.replyTo")} <span className="font-semibold">@{replyTarget}</span>
                                    </span>
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            {formatDateLocale(comment.createdAt, language)}
                            {comment.edited && !comment.deleted && (
                                <span className="ml-1.5 italic">{t("comments.edited")}</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Actions quick menu */}
                {!comment.deleted && postId && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                        {canEdit && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditDraft(comment.content);
                                    setIsEditing(!isEditing);
                                }}
                                className="rounded p-1 transition hover:bg-surface hover:text-dark"
                                title={t("comments.edit")}
                                aria-label={t("comments.edit")}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        )}
                        {canDelete && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="rounded p-1 transition hover:bg-surface hover:text-danger"
                                title={t("comments.delete")}
                                aria-label={t("comments.delete")}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                        {canReport && (
                            <button
                                type="button"
                                onClick={() => setShowReportDialog(true)}
                                className="rounded p-1 transition hover:bg-surface hover:text-warning"
                                title={t("comments.report")}
                                aria-label={t("comments.report")}
                            >
                                <Flag className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Comment Body */}
            {isEditing ? (
                <form onSubmit={handleSaveEdit} className="mt-2.5 space-y-2">
                    <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        maxLength={MAX_COMMENT_LENGTH}
                        rows={3}
                        className="w-full rounded-xl border border-border bg-surface p-2.5 text-sm text-dark placeholder:text-muted-foreground focus-visible:border-vegan-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green"
                        disabled={updateMutation.isPending}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(false)}
                            disabled={updateMutation.isPending}
                        >
                            {t("comments.cancel")}
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={updateMutation.isPending || editDraft.trim().length === 0}
                        >
                            {updateMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                t("comments.save")
                            )}
                        </Button>
                    </div>
                </form>
            ) : (
                <p
                    className={cn(
                        "mt-2.5 text-sm leading-relaxed",
                        comment.deleted ? "italic text-muted-foreground" : "text-dark",
                    )}
                >
                    {comment.content}
                </p>
            )}

            {/* Reply toggle button */}
            {!comment.deleted && postId && canReply && (
                <div className="mt-2 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsReplying(!isReplying)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-vegan-green"
                    >
                        <CornerDownRight className="h-3 w-3" />
                        {t("comments.reply")}
                    </button>
                </div>
            )}

            {/* Inline reply composer */}
            {isReplying && postId && (
                <div className="mt-3">
                    <CommentComposer
                        postId={postId}
                        parentId={comment.id}
                        replyToUsername={author}
                        compact
                        autoFocus
                        onSuccess={() => setIsReplying(false)}
                        onCancel={() => setIsReplying(false)}
                    />
                </div>
            )}

            {/* Delete confirm dialog */}
            <ConfirmDialog
                open={showDeleteConfirm}
                title={t("comments.deleteConfirmTitle")}
                description={t("comments.deleteConfirmMessage")}
                confirmLabel={t("comments.delete")}
                destructive
                loading={deleteMutation.isPending}
                onConfirm={handleConfirmDelete}
                onClose={() => setShowDeleteConfirm(false)}
            />

            {/* Report dialog */}
            <Dialog
                open={showReportDialog}
                onClose={() => setShowReportDialog(false)}
                title={t("comments.reportTitle")}
                description={t("comments.reportDescription")}
            >
                <form onSubmit={handleReportSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-dark">
                            {t("comments.reportReasonLabel")}
                        </label>
                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder={t("comments.reportReasonPlaceholder")}
                            maxLength={500}
                            rows={3}
                            className="mt-1.5 w-full rounded-xl border border-border bg-surface p-2.5 text-sm text-dark placeholder:text-muted-foreground focus-visible:border-vegan-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green"
                            disabled={reportMutation.isPending}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowReportDialog(false)}
                            disabled={reportMutation.isPending}
                        >
                            {t("comments.cancel")}
                        </Button>
                        <Button type="submit" disabled={reportMutation.isPending}>
                            {reportMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                t("comments.reportSubmit")
                            )}
                        </Button>
                    </div>
                </form>
            </Dialog>

            {/* Recursive replies */}
            {comment.replies.length > 0 && (
                <div className="mt-3 space-y-2.5 border-l-2 border-vegan-green/30 pl-3 sm:pl-5 ml-2 sm:ml-4">
                    {comment.replies.map((reply) => (
                        <CommentThread
                            key={reply.id}
                            comment={reply}
                            postId={postId}
                            depth={depth + 1}
                            language={language}
                            parentAuthor={author}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
