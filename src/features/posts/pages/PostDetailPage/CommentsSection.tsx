import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MessageCircle, Send, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { SectionCard } from "@/components/common/SectionCard";
import { useAuth } from "@/features/auth/useAuth";
import { createComment, getPostComments } from "../../api";
import { useUiStore } from "@/shared/ui/uiStore";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { cn } from "@/shared/utils/cn";
import type { PostComment } from "../../types";

/** BE chưa khai báo giới hạn — chặn ở client cho khỏi gửi payload vô hạn. */
const MAX_COMMENT_LENGTH = 1000;

interface Props {
    postId: string;
    /** Bấm vào phần chưa có API → báo đang phát triển thay vì im lặng. */
    onFeatureDeveloping: () => void;
}

/** Khối bình luận — tự lo query, mutation và state, không phụ thuộc page cha. */
export function CommentsSection({ postId, onFeatureDeveloping }: Props) {
    const { t } = useTranslation("post");
    const language = useUiStore((state) => state.language);
    const { isAuthenticated, user } = useAuth();
    const [draft, setDraft] = useState("");

    // ponytail: chưa có endpoint đọc comment (issue #41) — danh sách vẫn là mock.
    const { data: comments = [] } = useQuery({
        queryKey: ["post-comments", postId],
        queryFn: () => getPostComments(postId),
        enabled: postId !== "",
    });

    // Comment vừa gửi chỉ hiện ở client vì chưa có GET để refetch.
    const [posted, setPosted] = useState<PostComment[]>([]);

    const commentMutation = useMutation({
        mutationFn: (content: string) => createComment(postId, { content, parentId: null }),
        onSuccess: (created) => {
            setPosted((prev) => [
                {
                    id: created.id,
                    author: user?.username ?? t("comments.you"),
                    date: formatDateLocale(created.createdAt, language),
                    content: created.content,
                    likes: 0,
                },
                ...prev,
            ]);
            setDraft("");
            toast.success(t("comments.posted"));
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("common:error")));
        },
    });

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const content = draft.trim();
        if (!content) return;
        commentMutation.mutate(content);
    };

    return (
        <SectionCard
            className="mt-8"
            eyebrow={t("comments.eyebrow", { count: comments.length + posted.length })}
            title={t("comments.title")}
        >
            <div className="space-y-4">
                {[...posted, ...comments].map((comment) => (
                    <div
                        key={comment.id}
                        className={cn(
                            "rounded-xl border p-4",
                            comment.isAuthor ? "border-vegan-green-muted bg-vegan-green-subtle" : "border-border bg-muted-bg",
                        )}
                    >
                        <div className="flex items-center gap-2.5">
                            <Avatar name={comment.author} size="sm" verified={comment.isAuthor} />
                            <div className="min-w-0">
                                <p className="flex items-center gap-1.5 text-sm font-bold text-dark">
                                    {comment.author}
                                    {comment.badge && (
                                        <Badge variant={comment.isAuthor ? "lightgreen" : "secondary"} size="sm">
                                            {comment.badge}
                                        </Badge>
                                    )}
                                </p>
                                <p className="text-[11px] text-muted-foreground">{comment.date}</p>
                            </div>
                            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                                <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                                {comment.likes}
                            </span>
                        </div>
                        <p className="mt-2.5 text-sm leading-relaxed text-dark">{comment.content}</p>
                        {comment.tip && (
                            <p className="mt-2.5 rounded-lg bg-surface px-3 py-2 text-xs text-muted-foreground">
                                <span className="font-bold text-amber-strong">{t("comments.tip")}: </span>
                                {comment.tip}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* POST /api/posts/{postId}/comments — cần đăng nhập, bài phải published. */}
            {isAuthenticated ? (
                <form className="mt-5 flex gap-2" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        maxLength={MAX_COMMENT_LENGTH}
                        placeholder={t("comments.placeholder")}
                        aria-label={t("comments.placeholder")}
                        disabled={commentMutation.isPending}
                        className="h-11 flex-1 rounded-xl border border-border bg-surface px-4 text-sm text-dark placeholder:text-muted-foreground focus-visible:border-vegan-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green disabled:opacity-50"
                    />
                    <Button
                        type="submit"
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
            ) : (
                <p className="mt-5 text-sm text-muted-foreground">
                    <Link to="/login" className="font-semibold text-vegan-green hover:underline">
                        {t("comments.loginToComment")}
                    </Link>
                </p>
            )}

            {/* ponytail: chưa có GET comment (issue #41) nên "xem thêm" chưa phân trang được. */}
            <Button variant="ghost" block className="mt-3" onClick={onFeatureDeveloping}>
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {t("comments.loadMore")}
            </Button>
        </SectionCard>
    );
}
