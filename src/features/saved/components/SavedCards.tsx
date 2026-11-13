import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bookmark, Leaf, PenLine } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { FALLBACK_IMAGE, showFallbackImage, stripMarkdown } from "@/shared/utils/display";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { useUiStore } from "@/shared/ui/uiStore";
import type { Recipe } from "@/features/recipes/types";
import type { SavedPost } from "../types";

/** Card bài đã lưu — khác `PostCard` ở chỗ có tên tác giả thật và nút bỏ lưu. */
export function SavedPostCard({
    post,
    onRemove,
    removing,
}: {
    post: SavedPost;
    onRemove: () => void;
    removing: boolean;
}) {
    const { t } = useTranslation(["saved", "home"]);
    const language = useUiStore((state) => state.language);

    return (
        <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <Link to={`/posts/${post.id}`} className="relative block aspect-[16/9] overflow-hidden bg-muted-bg">
                <img
                    src={post.featuredImageUrl || FALLBACK_IMAGE}
                    onError={showFallbackImage()}
                    alt={post.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                />
            </Link>

            <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-center gap-2.5">
                    <Avatar name={post.displayName} src={post.avatarUrl} size="sm" />
                    <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-dark">{post.displayName}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                            {formatDateLocale(post.publishedAt ?? post.createdAt, language)}
                        </p>
                    </div>
                </div>

                <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-dark">
                    <Link to={`/posts/${post.id}`} className="hover:text-vegan-green">
                        {post.title}
                    </Link>
                </h3>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {stripMarkdown(post.content)}
                </p>

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    <Link
                        to={`/posts/${post.id}`}
                        className="inline-flex h-8 items-center rounded-full bg-vegan-green px-3.5 text-xs font-semibold text-white transition-colors hover:bg-vegan-green-hover"
                    >
                        {t("saved:readPost")}
                    </Link>
                    <Button
                        variant="outline"
                        size="sm"
                        shape="pill"
                        className="h-8 px-3.5 text-xs"
                        disabled={removing}
                        onClick={onRemove}
                    >
                        <Bookmark className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        {t("saved:unsave")}
                    </Button>
                </div>
            </div>
        </article>
    );
}

/** Hàng công thức đã lưu — tên món + meta + 2 hành động. */
export function SavedRecipeRow({
    recipe,
    onOpen,
    onCompose,
    onRemove,
    removing,
}: {
    recipe: Recipe;
    onOpen: () => void;
    onCompose: () => void;
    onRemove: () => void;
    removing: boolean;
}) {
    const { t } = useTranslation(["saved", "recipe"]);

    return (
        <div className="grid grid-cols-1 items-center gap-3.5 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <button type="button" onClick={onOpen} className="min-w-0 text-left">
                <p className="truncate text-[11px] font-bold uppercase tracking-wider text-vegan-green">
                    {recipe.dishName}
                </p>
                <h3 className="mt-0.5 truncate text-[15px] font-bold text-dark hover:text-vegan-green">
                    {recipe.name}
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {recipe.difficulty && (
                        <Badge variant="outline" size="sm">
                            {t(`recipe:difficulty.${recipe.difficulty}`)}
                        </Badge>
                    )}
                    {recipe.prepTimeMinutes != null && (
                        <Badge variant="outline" size="sm">
                            {t("saved:prepCook", {
                                prep: recipe.prepTimeMinutes,
                                cook: recipe.cookTimeMinutes ?? 0,
                            })}
                        </Badge>
                    )}
                    <Badge variant="outline" size="sm">
                        {t("saved:servings", { count: recipe.servings })}
                    </Badge>
                    <Badge variant="lightgreen" size="sm">
                        {t("saved:ingredients", { count: recipe.ingredients.length })}
                    </Badge>
                    {!recipe.nutritionResolved && (
                        <Badge variant="amber" size="sm">
                            {t("saved:nutritionMissing")}
                        </Badge>
                    )}
                </div>
            </button>

            <div className="flex flex-wrap gap-2 sm:justify-end">
                <Button size="sm" shape="pill" className="h-8 px-3.5 text-xs" onClick={onCompose}>
                    <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("saved:composeFromRecipe")}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    shape="pill"
                    className="h-8 px-3.5 text-xs"
                    disabled={removing}
                    onClick={onRemove}
                >
                    <Bookmark className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    {t("saved:unsave")}
                </Button>
            </div>
        </div>
    );
}

export function SavedSkeleton({ count = 2 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, index) => (
                <Skeleton key={index} className="h-40 w-full rounded-2xl" />
            ))}
        </div>
    );
}

export function SavedEmpty({ tab }: { tab: "posts" | "recipes" }) {
    const { t } = useTranslation("saved");
    return (
        <EmptyState
            icon={tab === "posts" ? Bookmark : Leaf}
            title={t(`empty.${tab}.title`)}
            description={t(`empty.${tab}.description`)}
        />
    );
}
