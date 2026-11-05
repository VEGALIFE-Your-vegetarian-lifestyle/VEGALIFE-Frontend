import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/common/Pagination";
import { CommentComposer } from "@/features/posts/components/CommentComposer";
import { CommentThread } from "@/features/posts/components/CommentThread";
import { PostVoteButtons } from "@/features/posts/components/PostVoteButtons";
import { useCategoryNames } from "@/features/categories/usePublicCategories";
import { FALLBACK_IMAGE, showFallbackImage, stripMarkdown } from "@/shared/utils/display";
import { estimateReadMinutes, formatDateLocale } from "@/shared/utils/formatDate";
import { useUiStore } from "@/shared/ui/uiStore";
import type { PostListResponse } from "../../types";
import { getPostComments } from "../../api";

/** 20 comment gốc/trang — cùng cỡ với `CommentsSection` ở Post Detail. */
const PER_PAGE = 20;

interface PostCommentsDialogProps {
    /** `null` = đóng. Giữ nguyên bài đang xem khi đang đóng để nội dung không nhấp nháy. */
    post: PostListResponse | null;
    onClose: () => void;
}

/**
 * Dialog bình luận của một bài trong feed Explore.
 *
 * Mở từ nút 💬 trên card: hiện lại phần tóm tắt bài (ảnh, tiêu đề, trích đoạn, vote) rồi
 * danh sách bình luận phân trang + form gửi, **ngay trong dialog** — user không phải rời
 * trang. Muốn đọc đầy đủ thì link "Đọc bài đầy đủ" sang `/posts/{id}`.
 *
 * Chỉ tải comment khi `post` khác null (`enabled`) → mở dialog mới có request.
 */
export function PostCommentsDialog({ post, onClose }: PostCommentsDialogProps) {
    const { t } = useTranslation(["explore", "post", "home"]);
    const language = useUiStore((state) => state.language);
    const categoryNames = useCategoryNames();
    const [page, setPage] = useState(1);

    const { data: comments, isLoading, isError, refetch } = useQuery({
        queryKey: ["post-comments", post?.id, page],
        queryFn: () => getPostComments(post!.id, { page: page - 1, size: PER_PAGE }),
        enabled: !!post,
    });

    const categoryName = post?.categoryIds.map((id) => categoryNames.get(id)).find(Boolean);
    const total = comments?.totalElements ?? 0;

    return (
        <Dialog
            open={!!post}
            onClose={onClose}
            title={post?.title ?? ""}
            className="max-w-2xl"
        >
            {post && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
                        <Badge variant="lightgreen" size="sm">
                            {categoryName ?? t("home:card.blog")}
                        </Badge>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {t(post.categoryIds.length > 0 ? "home:card.mins" : "home:card.minRead", {
                                count: estimateReadMinutes(post.content),
                            })}
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            {post.viewCount}
                        </span>
                        <span>{formatDateLocale(post.createdAt, language)}</span>
                    </div>

                    <div className="flex gap-4 rounded-xl border border-border bg-surface p-3">
                        <img
                            src={post.featuredImageUrl || FALLBACK_IMAGE}
                            onError={showFallbackImage()}
                            alt=""
                            className="h-20 w-28 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                {stripMarkdown(post.content)}
                            </p>
                            <Link
                                to={`/posts/${post.id}`}
                                className="mt-1.5 inline-block text-xs font-semibold text-vegan-green hover:underline"
                            >
                                {t("explore:card.readFullPost")}
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 border-y border-border py-2">
                        <PostVoteButtons postId={post.id} />
                        <span className="ml-auto text-xs font-semibold text-muted-foreground">
                            {t("post:comments.eyebrow", { count: total })}
                        </span>
                    </div>

                    <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
                        {isLoading ? (
                            <>
                                <Skeleton className="h-20 w-full rounded-xl" />
                                <Skeleton className="h-20 w-full rounded-xl" />
                            </>
                        ) : isError && (!comments || comments.content.length === 0) ? (
                            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
                                <p className="text-sm text-destructive">{t("post:error")}</p>
                                <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                                    {t("common:actions.retry")}
                                </Button>
                            </div>
                        ) : total === 0 ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                                {t("post:comments.empty")}
                            </p>
                        ) : (
                            (comments?.content ?? []).map((comment) => (
                                <CommentThread
                                    key={comment.id}
                                    postId={post.id}
                                    comment={comment}
                                    language={language}
                                />
                            ))
                        )}
                    </div>

                    <Pagination page={page} totalPages={comments?.totalPages ?? 1} onChange={setPage} />

                    <CommentComposer postId={post.id} />
                </div>
            )}
        </Dialog>
    );
}
