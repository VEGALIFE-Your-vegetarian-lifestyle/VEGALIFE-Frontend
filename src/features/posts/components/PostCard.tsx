import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Bookmark, Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCategoryNames } from "@/features/categories/usePublicCategories";
import { cn } from "@/shared/utils/cn";
import { FALLBACK_IMAGE, showFallbackImage, stripMarkdown } from "@/shared/utils/display";
import { estimateReadMinutes, formatDateLocale } from "@/shared/utils/formatDate";
import type { PostListResponse } from "../types";

interface PostCardProps {
    post: PostListResponse;
    language: string;
    /** Hiện nút bookmark ở chân card (chỉ ở feed Home/Explore). */
    bookmark?: boolean;
    className?: string;
}

function compactNumber(value: number, language: string): string {
    return value.toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
        notation: value >= 10_000 ? "compact" : "standard",
        maximumFractionDigits: 1,
    });
}

/**
 * Card feed dùng chung cho Home / Explore / Post Detail (related) — theo mockup Stitch
 * `screen01_home`: card TRẮNG có padding, ảnh nằm trong card (không tràn viền), chân
 * card là hàng meta + bookmark.
 *
 * ponytail: BE bỏ `type`/`videoUrl` khỏi `PostListResponse` (`GET /api/posts/{id}` cũng không
 * trả) → không có field nào phân biệt video/recipe/blog, chỉ còn `categoryIds`. Đang tạm coi
 * "có category = recipe", "còn lại = blog"; nhãn video vẫn giữ trong i18n nhưng không dùng.
 * Xem DOCS/UI-DATA-MAP.md §4.
 */
export function PostCard({ post, language, bookmark = false, className }: PostCardProps) {
    const { t } = useTranslation("home");
    const categoryNames = useCategoryNames();
    const categoryName = post.categoryIds.map((id) => categoryNames.get(id)).find(Boolean);

    return (
        <article
            className={cn(
                "group flex flex-col overflow-hidden rounded-3xl bg-card shadow-sm transition-shadow hover:shadow-xl",
                className,
            )}
        >
            <Link to={`/posts/${post.id}`} className="relative block aspect-[16/11] overflow-hidden bg-muted-bg">
                <img
                    src={post.featuredImageUrl || FALLBACK_IMAGE}
                    onError={showFallbackImage()}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                />
                <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                />
                <span className="absolute left-4 top-4 rounded-full bg-surface/90 px-3 py-1 text-[11px] font-semibold text-dark shadow-sm backdrop-blur-sm">
                    {categoryName ? t("card.recipe") : t("card.blog")}
                </span>
                <span className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-medium text-white">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("card.mins", { count: estimateReadMinutes(post.content) })}
                    </span>
                    <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        {compactNumber(post.viewCount, language)}
                    </span>
                </span>
            </Link>

            <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                <div>
                    <h3 className="line-clamp-2 text-base font-bold leading-snug text-dark transition-colors group-hover:text-vegan-green md:text-lg">
                        <Link to={`/posts/${post.id}`}>{post.title}</Link>
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground md:text-sm">
                        {stripMarkdown(post.content)}
                    </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                    {/* ponytail: BE không trả tác giả trong feed → ô này hiện category (thật).
                        Mockup vẽ avatar + tên tác giả + nút bookmark; cần `GET /api/profile/{userId}`
                        mới có, và chưa có API lưu bài nên bookmark chỉ là icon trang trí. */}
                    {categoryName ? (
                        <Badge variant="lightgreen" size="sm">
                            {categoryName}
                        </Badge>
                    ) : (
                        <span className="text-[11px] text-muted-foreground">
                            {formatDateLocale(post.createdAt, language)}
                        </span>
                    )}

                    {bookmark ? (
                        <span className="text-muted-foreground transition-colors group-hover:text-vegan-green" aria-hidden="true">
                            <Bookmark className="h-4 w-4" />
                        </span>
                    ) : (
                        <Link
                            to={`/posts/${post.id}`}
                            className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-vegan-green hover:underline"
                        >
                            {categoryName ? t("card.viewRecipe") : t("card.viewBlog")}
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
}
