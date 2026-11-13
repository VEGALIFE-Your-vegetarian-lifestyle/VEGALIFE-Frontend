import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { useFeedPosts } from "../../useFeedPosts";
import { usePublicCategories } from "@/features/categories/usePublicCategories";
import { getPublicRecipes } from "@/features/recipes/api";
import { RecipeDetailDialog } from "@/features/recipes/components/RecipeDetailDialog";
import { FeedPostCard } from "./FeedPostCard";
import { RecipeFeedCard } from "./RecipeFeedCard";
import { PostCommentsDialog } from "./PostCommentsDialog";
import { ExploreFilterPanel, type MaxTimeFilter } from "./ExploreFilterPanel";
import { useUiStore } from "@/shared/ui/uiStore";
import type { PostListResponse } from "../../types";
import type { Difficulty, Recipe } from "@/features/recipes/types";

/** Số item một trang. Mỗi tab gọi đúng một endpoint nên phân trang là server-side thật. */
const PER_PAGE = 8;

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
const MAX_TIMES: MaxTimeFilter[] = ["", "15", "30", "60"];

type Tab = "posts" | "recipes";

/**
 * Trang khám phá — hai tab **Bài viết** và **Công thức**, mỗi tab **một endpoint, một bộ lọc,
 * một dãy phân trang riêng**:
 *
 * - Bài viết: `GET /api/posts?keyword=&categoryId=` (public, chỉ published).
 * - Công thức: `GET /api/recipes?keyword=&difficulty=&maxTotalTimeMinutes=` (public, chỉ APPROVED).
 *
 * Từ khoá dùng chung cho cả hai tab. Category thuộc tab Bài viết, độ khó/thời gian thuộc tab
 * Công thức — sidebar đổi nhóm lọc theo tab.
 *
 * Filter của mỗi tab **giữ riêng**: đổi tab chỉ đổi `?tab=`, các tham số kia nằm nguyên trên URL
 * nên quay lại tab cũ vẫn còn lọc. Chỉ `?page=` bị xoá khi đổi tab (mỗi tab có dãy trang riêng).
 */
export default function ExplorePage() {
    const { t } = useTranslation(["explore", "home", "recipe"]);
    const [searchParams, setSearchParams] = useSearchParams();
    const language = useUiStore((state) => state.language);

    const tab: Tab = searchParams.get("tab") === "recipes" ? "recipes" : "posts";
    const keyword = searchParams.get("q") ?? "";
    const categoryId = searchParams.get("cat") ?? "";
    const difficulty = (searchParams.get("diff") ?? "") as Difficulty | "";
    const maxTime = (searchParams.get("time") ?? "") as MaxTimeFilter;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);

    const [draftQuery, setDraftQuery] = useState(keyword);
    const [dialogPost, setDialogPost] = useState<PostListResponse | null>(null);
    const [dialogRecipe, setDialogRecipe] = useState<Recipe | null>(null);

    // Chỉ tab đang chọn mới gọi API — tab kia không tốn request.
    const postsQuery = useFeedPosts({
        page: page - 1,
        size: PER_PAGE,
        keyword: keyword.trim() || undefined,
        categoryId: categoryId || undefined,
        enabled: tab === "posts",
    });

    const recipesQuery = useQuery({
        queryKey: ["public-recipes", { page, keyword, difficulty, maxTime }],
        queryFn: () =>
            getPublicRecipes({
                page: page - 1,
                size: PER_PAGE,
                keyword: keyword.trim() || undefined,
                difficulty: difficulty || undefined,
                maxTotalTimeMinutes: maxTime ? Number(maxTime) : undefined,
            }),
        enabled: tab === "recipes",
    });

    const { data: categoriesData } = usePublicCategories({ page: 0, size: 100, sort: "name,asc" });
    const categories = categoriesData?.content ?? [];

    const active = tab === "posts" ? postsQuery : recipesQuery;
    const isLoading = active.isLoading;
    const isError = active.isError;

    const posts = tab === "posts" ? (postsQuery.data?.content ?? []) : [];
    const recipes = tab === "recipes" ? (recipesQuery.data?.content ?? []) : [];
    const total = active.data?.totalElements ?? 0;
    const totalPages = Math.max(1, active.data?.totalPages ?? 1);
    const shown = tab === "posts" ? posts.length : recipes.length;

    const canReset =
        tab === "posts" ? !!(categoryId || keyword) : !!(difficulty || maxTime || keyword);

    /** Ghi bộ lọc lên URL; đổi bộ lọc luôn xoá `page` (về trang 1). */
    const applyFilters = (next: Record<string, string>) => {
        const params = new URLSearchParams(searchParams);
        params.delete("page");
        for (const [key, value] of Object.entries(next)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        setSearchParams(params, { replace: true });
    };

    const switchTab = (next: Tab) => {
        const params = new URLSearchParams(searchParams);
        params.set("tab", next);
        params.delete("page");
        setSearchParams(params, { replace: true });
    };

    const goToPage = (next: number) => {
        const params = new URLSearchParams(searchParams);
        if (next > 1) params.set("page", String(next));
        else params.delete("page");
        setSearchParams(params, { replace: true });
    };

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        applyFilters({ q: draftQuery.trim() });
    };

    const clearSearch = () => {
        setDraftQuery("");
        applyFilters({ q: "" });
    };

    const toggleCategory = (id: string) => applyFilters({ cat: categoryId === id ? "" : id });

    const setDifficulty = (value: Difficulty | "") => applyFilters({ diff: value });

    const setMaxTime = (value: MaxTimeFilter) => applyFilters({ time: value });

    const clearFilters = () => {
        setDraftQuery("");
        // Giữ nguyên tab đang xem, chỉ xoá bộ lọc của cả hai.
        setSearchParams(tab === "recipes" ? { tab } : {}, { replace: true });
    };

    return (
        <div>
            {/*
             * Dải hero full-bleed — dùng lại `.hero-canvas` của HomePage để hai trang cùng một
             * tông nền. `overflow-hidden` ở đây an toàn: nó KHÔNG bọc lưới nội dung nên không
             * tạo scroll container làm hỏng `sticky` của cột lọc.
             */}
            <div className="hero-canvas">
                <span className="hero-aurora" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </span>

                <div className="relative z-[1] mx-auto w-full max-w-app px-4 py-10 sm:px-6 lg:px-8">
                    {/* Hero: eyebrow + tiêu đề + phụ đề + search pill + tab. */}
                    <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-vegan-green-light px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-vegan-green">
                            {t("hero.eyebrow")}
                        </span>
                        <h1 className="font-display mt-3 text-2xl font-semibold tracking-tight text-dark sm:text-4xl">
                            {t("hero.title")}
                        </h1>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                            {t("hero.subtitle")}
                        </p>

                        <form
                            onSubmit={handleSearch}
                            role="search"
                            className="mt-6 flex w-full max-w-2xl items-center gap-1.5 rounded-full bg-card p-1.5 shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-2 focus-within:ring-vegan-green/40"
                        >
                            <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <input
                                type="search"
                                value={draftQuery}
                                onChange={(event) => setDraftQuery(event.target.value)}
                                placeholder={t("searchPlaceholder")}
                                aria-label={t("searchPlaceholder")}
                                className="h-10 w-full min-w-0 bg-transparent text-sm text-dark placeholder:text-muted-foreground focus:outline-none"
                            />
                            {draftQuery && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    aria-label={t("clearSearch")}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:text-dark"
                                >
                                    <X className="h-4 w-4" aria-hidden="true" />
                                </button>
                            )}
                            <Button type="submit" className="shrink-0 rounded-full">
                                {t("searchButton")}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Lưới nội dung: 1240px canh giữa, 2 cột lọc + feed. */}
            <div className="mx-auto w-full max-w-app px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1240px]">
                    <div className="flex flex-col items-start justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
                        <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-dark">{t("items", { count: total })}</span>{" "}
                            {t("filteredAcross")}
                        </p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-[264px_minmax(0,1fr)]">
                        {/* Navbar không sticky → không cần chừa 80px; `top-6` bám mép trên. */}
                        <aside className="hidden lg:sticky lg:top-6 lg:block">
                            <ExploreFilterPanel
                                tab={tab}
                                onTabChange={switchTab}
                                categories={categories}
                                selectedCat={categoryId}
                                onToggleCategory={toggleCategory}
                                difficulties={DIFFICULTIES}
                                difficulty={difficulty}
                                onDifficultyChange={setDifficulty}
                                maxTimes={MAX_TIMES}
                                maxTime={maxTime}
                                onMaxTimeChange={setMaxTime}
                                onReset={clearFilters}
                                canReset={canReset}
                            />
                        </aside>

                        <div className="flex min-w-0 flex-col gap-5">
                            {/* Mobile: chip/select thay sidebar bị ẩn. */}
                            <div className="flex flex-wrap gap-2 lg:hidden">
                                {tab === "posts"
                                    ? categories.map((category) => {
                                          const checked = categoryId === category.id;
                                          return (
                                              <button
                                                  key={category.id}
                                                  type="button"
                                                  onClick={() => toggleCategory(category.id)}
                                                  aria-pressed={checked}
                                                  className={
                                                      checked
                                                          ? "rounded-full bg-vegan-green px-3 py-1.5 text-xs font-medium text-white"
                                                          : "rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-vegan-green-muted hover:text-vegan-green"
                                                  }
                                              >
                                                  {category.name}
                                              </button>
                                          );
                                      })
                                    : [...DIFFICULTIES.map((value) => ({ kind: "diff" as const, value })), ...MAX_TIMES.filter(Boolean).map((value) => ({ kind: "time" as const, value }))].map(
                                          (chip) => {
                                              const checked =
                                                  chip.kind === "diff"
                                                      ? difficulty === chip.value
                                                      : maxTime === chip.value;
                                              return (
                                                  <button
                                                      key={`${chip.kind}-${chip.value}`}
                                                      type="button"
                                                      onClick={() =>
                                                          chip.kind === "diff"
                                                              ? setDifficulty(difficulty === chip.value ? "" : (chip.value as Difficulty))
                                                              : setMaxTime(maxTime === chip.value ? "" : (chip.value as MaxTimeFilter))
                                                      }
                                                      aria-pressed={checked}
                                                      className={
                                                          checked
                                                              ? "rounded-full bg-vegan-green px-3 py-1.5 text-xs font-medium text-white"
                                                              : "rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-vegan-green-muted hover:text-vegan-green"
                                                      }
                                                  >
                                                      {chip.kind === "diff"
                                                          ? t(`recipe:difficulty.${chip.value}`)
                                                          : t("timeOption", { count: Number(chip.value) })}
                                                  </button>
                                              );
                                          },
                                      )}
                            </div>

                            {isError ? (
                                <p className="text-sm text-danger" role="alert">
                                    {t("error")}
                                </p>
                            ) : isLoading ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                    <Skeleton key={index} className="h-[460px] rounded-2xl" />
                                ))
                            ) : shown === 0 ? (
                                <div className="rounded-2xl bg-card py-6">
                                    <EmptyState
                                        icon={Search}
                                        title={t("empty.title")}
                                        description={t("empty.description")}
                                        action={<Button onClick={clearFilters}>{t("empty.action")}</Button>}
                                    />
                                </div>
                            ) : (
                                <>
                                    {tab === "posts"
                                        ? posts.map((post, index) => (
                                              <FeedPostCard
                                                  key={post.id}
                                                  post={post}
                                                  onOpenComments={setDialogPost}
                                                  featured={index === 0 && page === 1}
                                              />
                                          ))
                                        : recipes.map((recipe) => (
                                              <RecipeFeedCard
                                                  key={recipe.id}
                                                  recipe={recipe}
                                                  onOpen={() => setDialogRecipe(recipe)}
                                              />
                                          ))}

                                    <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
                                        <p className="text-sm text-muted-foreground">
                                            {t("showing", { shown, total })}
                                        </p>
                                        <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <PostCommentsDialog post={dialogPost} onClose={() => setDialogPost(null)} />
            <RecipeDetailDialog
                recipe={dialogRecipe}
                language={language}
                onClose={() => setDialogRecipe(null)}
            />
        </div>
    );
}
