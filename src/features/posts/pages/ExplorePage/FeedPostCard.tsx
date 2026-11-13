import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, Eye, Flame, MessageCircle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useCategoryNames } from "@/features/categories/usePublicCategories";
import { PostVoteButtons } from "@/features/posts/components/PostVoteButtons";
import { SavePostButton } from "@/features/saved/components/SaveButton";
import { getRecipe } from "@/features/recipes/api";
import { RecipeNutritionLine } from "@/features/recipes/components/RecipeNutritionLine";
import { FALLBACK_IMAGE, showFallbackImage, stripMarkdown } from "@/shared/utils/display";
import { estimateReadMinutes, formatDateLocale } from "@/shared/utils/formatDate";
import { cn } from "@/shared/utils/cn";
import { useUiStore } from "@/shared/ui/uiStore";
import { getPostComments } from "../../api";
import type { PostListResponse } from "../../types";

interface FeedPostCardProps {
    post: PostListResponse;
    /** Mở dialog bình luận của bài này. */
    onOpenComments: (post: PostListResponse) => void;
    /** Card đầu tiên trong feed — ảnh cao hơn, chữ to hơn (bám mockup). */
    featured?: boolean;
}

/**
 * Card feed Explore — bám `stich_design/screen_explore`.
 *
 * Hai khối phải gọi API riêng, cả hai đều `enabled` theo dữ liệu có sẵn nên bài
 * không có recipe/không cần số comment thì không tốn request:
 * - `AttachedRecipeBlock`: `GET /api/recipes/{id}` cho `recipeIds[0]`.
 * - `PostCommentCount`: `GET /api/posts/{id}/comments?size=1` chỉ lấy `totalElements`.
 *
 * Hàng tác giả lấy từ `post.authorCard` — `mockEnrichment` bơm sẵn vì feed chưa trả
 * `username`/`avatar` (`DOCS/MOCK-FIELDS.md`).
 */
export function FeedPostCard({ post, onOpenComments, featured = false }: FeedPostCardProps) {
    const { t } = useTranslation(["explore", "home"]);
    const language = useUiStore((state) => state.language);
    const categoryNames = useCategoryNames();
    const categoryName = post.categoryIds.map((id) => categoryNames.get(id)).find(Boolean);
    const isRecipe = post.recipeIds.length > 0;

    return (
        <article className="overflow-hidden rounded-2xl bg-card shadow-sm transition-shadow hover:shadow-md">
            {/* Hàng tác giả — mock, xem doc comment. */}
            {post.authorCard && (
                <div className="flex items-center gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
                    <Avatar name={post.authorCard.username} size="md" verified />
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-sm font-bold text-dark">{post.authorCard.username}</span>
                            <Badge variant="lightgreen" size="sm">
                                {post.authorCard.role}
                            </Badge>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{formatDateLocale(post.createdAt, language)}</span>
                            {categoryName && (
                                <>
                                    <span aria-hidden="true">•</span>
                                    <span className="truncate">{categoryName}</span>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            )}

            {/* Ảnh bìa cao cố định chứ không theo tỉ lệ: cột feed rộng ~1000px nên 16:9 cho ra
                ảnh cao ~570px — lấn hết màn. Chiều cao cố định giữ ảnh vừa phải ở mọi bề rộng. */}
            <Link
                to={`/posts/${post.id}`}
                className={cn(
                    "relative mt-4 block overflow-hidden bg-muted-bg",
                    featured ? "h-56 sm:h-72" : "h-44 sm:h-52",
                )}
            >
                <img
                    src={post.featuredImageUrl || FALLBACK_IMAGE}
                    onError={showFallbackImage()}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                />
                <span className="absolute bottom-3 left-4 flex flex-wrap gap-2">
                    <span className="flex items-center gap-1 rounded-full bg-dark/80 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {t("home:card.minRead", { count: estimateReadMinutes(post.content) })}
                    </span>
                    {categoryName && (
                        <span className="rounded-full bg-surface/90 px-3 py-1 text-[11px] font-semibold text-vegan-green backdrop-blur-sm">
                            {categoryName}
                        </span>
                    )}
                </span>
            </Link>

            <div className={cn("space-y-2.5 p-4 sm:p-5", featured && "sm:p-6")}>
                <div className="space-y-1.5">
                    <h2
                        className={cn(
                            "font-display line-clamp-2 font-semibold leading-snug text-dark",
                            featured ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
                        )}
                    >
                        <Link to={`/posts/${post.id}`} className="transition-colors hover:text-vegan-green">
                            {post.title}
                        </Link>
                    </h2>
                    <p
                        className={cn(
                            "text-muted-foreground",
                            // Trích đoạn đủ dài để card có nội dung, nhưng không để chữ lấn ảnh.
                            featured ? "line-clamp-3 text-base leading-relaxed" : "line-clamp-2 text-base leading-relaxed",
                        )}
                    >
                        {stripMarkdown(post.content)}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        {post.viewCount.toLocaleString()}
                    </span>
                    {isRecipe && (
                        <span className="flex items-center gap-1 text-vegan-green">
                            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                            {t("format.recipe")}
                        </span>
                    )}
                </div>

                {isRecipe && <AttachedRecipeBlock recipeId={post.recipeIds[0]} postId={post.id} />}

                {/* Thanh hành động — vote + lưu + số bình luận + đọc tiếp. */}
                <div className="flex items-center gap-1 border-t border-border pt-3">
                    <PostVoteButtons postId={post.id} />

                    <SavePostButton postId={post.id} iconOnly />

                    <button
                        type="button"
                        onClick={() => onOpenComments(post)}
                        aria-label={t("explore:card.comments")}
                        className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted-bg hover:text-dark sm:px-3"
                    >
                        <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <PostCommentCount postId={post.id} />
                    </button>

                    <Link
                        to={`/posts/${post.id}`}
                        className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-vegan-green hover:bg-vegan-green-light sm:px-3"
                    >
                        <span className="hidden sm:inline">{t("explore:card.readMore")}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </article>
    );
}

/**
 * `GET /api/posts/{id}/comments?size=1` chỉ để lấy `totalElements`.
 * `staleTime` dài vì đếm comment không cần tươi; dialog bình luận dùng key khác nên
 * không đụng nhau. Lỗi thì im lặng — số bình luận không đáng làm hỏng card.
 */
function PostCommentCount({ postId }: { postId: string }) {
    const { t } = useTranslation("explore");
    const { data } = useQuery({
        queryKey: ["post-comment-count", postId],
        queryFn: () => getPostComments(postId, { page: 0, size: 1 }),
        staleTime: 5 * 60 * 1000,
        retry: false,
    });

    return <span className="tabular-nums">{t("card.commentsWithCount", { count: data?.totalElements ?? 0 })}</span>;
}

/** Thẻ công thức đính kèm — chỉ bài có `recipeIds`. Lỗi/404 thì ẩn, không chặn card. */
function AttachedRecipeBlock({ recipeId, postId }: { recipeId: string; postId: string }) {
    const { t } = useTranslation(["explore", "post", "home"]);

    const { data: recipe } = useQuery({
        queryKey: ["recipe", recipeId],
        queryFn: () => getRecipe(recipeId),
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    if (!recipe) return null;

    const totalMinutes = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

    return (
        <div className="flex flex-col gap-3 rounded-xl bg-muted-bg p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-vegan-green">
                    {t("post:recipes.eyebrow")}
                </p>
                <p className="mt-0.5 truncate text-sm font-bold text-dark">{recipe.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {totalMinutes > 0 && (
                        <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {t("home:card.mins", { count: totalMinutes })}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("post:recipes.servings", { count: recipe.servings })}
                    </span>
                    <RecipeNutritionLine recipe={recipe} className="flex" />
                </div>            </div>
            <Link
                to={`/posts/${postId}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-surface px-4 py-2 text-sm font-semibold text-vegan-green shadow-sm transition-colors hover:bg-vegan-green hover:text-white"
            >
                {t("post:recipes.viewRecipe")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
        </div>
    );
}
