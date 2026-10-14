import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bookmark, Eye, FileText, Heart, MessageCircle, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDateLocale } from "@/utils/formatDate";
import type { PostListResponse } from "@/types/post";

interface PostCardProps {
    post: PostListResponse;
    language: string;
    /** Hiện nút bookmark góc ảnh (chỉ ở feed Home/Explore). */
    bookmark?: boolean;
    className?: string;
}

const PLACEHOLDER =
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop";

function compactNumber(value: number, language: string): string {
    return value.toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
        notation: value >= 10_000 ? "compact" : "standard",
        maximumFractionDigits: 1,
    });
}

/**
 * Card feed dùng chung cho Home / Explore / Post Detail (related).
 * ponytail: `type` chỉ có blog|video; nhãn "Recipe" suy từ việc bài có category.
 * Nhãn nút "View …" lấy từ `home.card.view*` — đã có sẵn ở cả en và vi.
 */
export function PostCard({ post, language, bookmark = false, className }: PostCardProps) {
    const { t } = useTranslation("home");

    const isVideo = post.type === "video";
    const label = isVideo
        ? t("card.video")
        : post.categoryIds.length > 0
          ? t("card.recipe")
          : t("card.blog");
    const actionLabel = isVideo
        ? t("card.viewVideo")
        : post.categoryIds.length > 0
          ? t("card.viewRecipe")
          : t("card.viewBlog");

    return (
        <article
            className={cn(
                "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md",
                className,
            )}
        >
            <Link to={`/posts/${post.id}`} className="relative block h-48 overflow-hidden">
                <img
                    src={post.featuredImageUrl || PLACEHOLDER}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                />
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-dark backdrop-blur-sm">
                    {isVideo ? <Play className="h-3 w-3" aria-hidden="true" /> : <FileText className="h-3 w-3" aria-hidden="true" />}
                    {label}
                </span>
                {isVideo && (
                    <span className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-12 w-12 text-white/85 drop-shadow-md" aria-hidden="true" />
                    </span>
                )}
                {bookmark && (
                    <span
                        aria-hidden="true"
                        className="absolute right-3 top-3 rounded-full bg-white/80 p-2 text-dark transition group-hover:text-vegan-green"
                    >
                        <Bookmark className="h-4 w-4" />
                    </span>
                )}
                {/* Nhãn thời lượng — mockup đặt ở góc dưới-phải ảnh. */}
                {post.durationLabel && (
                    <span className="absolute bottom-3 right-3 rounded-full bg-dark/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                        {post.durationLabel}
                    </span>
                )}
            </Link>

            <div className="flex flex-1 flex-col p-5">
                <h3 className="mb-2 line-clamp-2 font-bold text-dark">
                    <Link to={`/posts/${post.id}`} className="hover:text-vegan-green">
                        {post.title}
                    </Link>
                </h3>
                <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">{post.content}</p>

                {post.authorCard && (
                    <div className="mb-4 flex items-center gap-2.5">
                        <Avatar name={post.authorCard.username} src={post.authorCard.avatarUrl} size="sm" verified />
                        <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-dark">{post.authorCard.username}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{post.authorCard.role}</p>
                        </div>
                    </div>
                )}

                <div className="mt-auto flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                        {compactNumber(post.saveCount ?? 0, language)}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5 text-info" aria-hidden="true" />
                        {compactNumber(post.commentCount ?? 0, language)}
                    </span>
                    <span className="ml-auto flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        {compactNumber(post.viewCount, language)}
                    </span>
                </div>

                <Link
                    to={`/posts/${post.id}`}
                    className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-lavender text-sm font-semibold text-lavender-strong transition-colors hover:bg-lavender-hover"
                >
                    {actionLabel}
                </Link>
            </div>
        </article>
    );
}

/** Card dạng hàng ngang nhỏ — dùng cho mục "Related" và sidebar. */
export function PostCardCompact({ post, language }: { post: PostListResponse; language: string }) {
    const { t } = useTranslation("home");
    const isVideo = post.type === "video";

    return (
        <Link
            to={`/posts/${post.id}`}
            className={cn(
                "flex gap-3 overflow-hidden rounded-xl border border-border bg-card p-3 transition hover:shadow-md",
            )}
        >
            <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg">
                <img
                    src={post.featuredImageUrl || PLACEHOLDER}
                    alt={post.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
                {isVideo && (
                    <span className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-7 w-7 text-white/85 drop-shadow-sm" aria-hidden="true" />
                    </span>
                )}
            </div>
            <div className="flex min-w-0 flex-col justify-center">
                <Badge variant={isVideo ? "cream" : "lightgreen"} size="sm" className="mb-1 w-fit">
                    {isVideo ? t("card.video") : t("card.recipe")}
                </Badge>
                <h4 className="line-clamp-2 text-sm font-bold text-dark">{post.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateLocale(post.createdAt, language)}</p>
            </div>
        </Link>
    );
}
