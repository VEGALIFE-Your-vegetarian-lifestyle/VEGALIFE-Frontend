import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { PillTabs } from "@/components/ui/pill-tabs";
import { Pagination } from "@/components/common/Pagination";
import { ErrorState } from "@/components/common/ErrorState";
import { RecipeDetailDialog } from "@/features/recipes/components/RecipeDetailDialog";
import type { Recipe } from "@/features/recipes/types";
import { useUiStore } from "@/shared/ui/uiStore";
import { getSavedPosts, getSavedRecipes } from "./api";
import { SavedEmpty, SavedPostCard, SavedRecipeRow, SavedSkeleton } from "./components/SavedCards";
import { useRemoveSaved } from "./useSaved";

type TabKey = "posts" | "recipes";

const PAGE_SIZE = 8;

/**
 * `/saved` — nội dung của tác giả khác đã lưu, **chỉ đọc**.
 * `GET /api/saved/*` nhận `page`/`size` thật nên phân trang ở server (khác My Posts).
 * ponytail: backend không nhận `sort` → thứ tự mặc định của nó; ô sort đã bỏ khỏi
 * mockup vì không có tham số. Backend thêm `sort` thì thêm lại một `Select`.
 */
export default function SavedPage() {
    const { t } = useTranslation(["saved", "recipe"]);
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = (searchParams.get("tab") === "recipes" ? "recipes" : "posts") as TabKey;
    const page = Math.max(0, Number(searchParams.get("page") ?? 0) || 0);

    const language = useUiStore((state) => state.language);
    const openComposer = useUiStore((state) => state.openComposer);
    const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
    const { removePost, removeRecipe } = useRemoveSaved();

    const posts = useQuery({
        queryKey: ["saved-posts", page],
        queryFn: () => getSavedPosts(page, PAGE_SIZE),
        enabled: tab === "posts",
        placeholderData: keepPreviousData,
    });
    const recipes = useQuery({
        queryKey: ["saved-recipes", page],
        queryFn: () => getSavedRecipes(page, PAGE_SIZE),
        enabled: tab === "recipes",
        placeholderData: keepPreviousData,
    });

    const active = tab === "posts" ? posts : recipes;
    const goTo = (next: { tab?: TabKey; page?: number }) => {
        const params = new URLSearchParams();
        const nextTab = next.tab ?? tab;
        if (nextTab !== "posts") params.set("tab", nextTab);
        const nextPage = next.page ?? 0;
        if (nextPage > 0) params.set("page", String(nextPage));
        setSearchParams(params, { replace: true });
    };

    const postsTotal = posts.data?.totalElements ?? 0;
    const recipesTotal = recipes.data?.totalElements ?? 0;

    return (
        <>
            <header className="flex flex-wrap items-end justify-between gap-3 px-0.5">
                <div>
                    <h1 className="text-2xl font-semibold leading-tight text-dark sm:text-[25px]">
                        {t("saved:title")}
                    </h1>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">
                        {t("saved:subtitle", { posts: postsTotal, recipes: recipesTotal })}
                    </p>
                </div>
            </header>

            <PillTabs
                items={[
                    { key: "posts" as const, label: t("saved:tab.posts"), count: postsTotal },
                    { key: "recipes" as const, label: t("saved:tab.recipes"), count: recipesTotal },
                ]}
                value={tab}
                onChange={(key) => goTo({ tab: key, page: 0 })}
                className="border-b border-border pb-3"
            />

            {active.isError ? (
                <ErrorState onRetry={() => void active.refetch()} />
            ) : active.isLoading ? (
                <SavedSkeleton count={tab === "posts" ? 2 : 3} />
            ) : tab === "posts" ? (
                (posts.data?.content.length ?? 0) === 0 ? (
                    <SavedEmpty tab="posts" />
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {posts.data?.content.map((post) => (
                                <SavedPostCard
                                    key={post.id}
                                    post={post}
                                    removing={removePost.isPending}
                                    onRemove={() => removePost.mutate(post.id)}
                                />
                            ))}
                        </div>
                        <Pagination
                            page={page + 1}
                            totalPages={posts.data?.totalPages ?? 1}
                            onChange={(next) => goTo({ page: next - 1 })}
                        />
                    </>
                )
            ) : (recipes.data?.content.length ?? 0) === 0 ? (
                <SavedEmpty tab="recipes" />
            ) : (
                <>
                    <div className="space-y-3">
                        {recipes.data?.content.map((recipe) => (
                            <SavedRecipeRow
                                key={recipe.id}
                                recipe={recipe}
                                removing={removeRecipe.isPending}
                                onOpen={() => setOpenRecipe(recipe)}
                                onCompose={() => openComposer(null, [recipe.id])}
                                onRemove={() => removeRecipe.mutate(recipe.id)}
                            />
                        ))}
                    </div>
                    <Pagination
                        page={page + 1}
                        totalPages={recipes.data?.totalPages ?? 1}
                        onChange={(next) => goTo({ page: next - 1 })}
                    />
                </>
            )}

            <RecipeDetailDialog recipe={openRecipe} language={language} onClose={() => setOpenRecipe(null)} />
        </>
    );
}
