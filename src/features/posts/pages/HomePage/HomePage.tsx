import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Leaf, Search, Sparkles, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "../../components/PostCard";
import { useFeedPosts } from "../../useFeedPosts";
import { usePublicCategories } from "@/features/categories/usePublicCategories";
import { useUiStore } from "@/shared/ui/uiStore";

export default function HomePage() {
    const { t } = useTranslation("home");
    const navigate = useNavigate();
    const language = useUiStore((state) => state.language);
    const [keyword, setKeyword] = useState("");

    const { data: categoriesData, isLoading: isCategoriesLoading } = usePublicCategories({
        page: 0,
        size: 10,
        sort: "name,asc",
    });
    const { data: feed, isLoading: isFeedLoading, isError: isFeedError } = useFeedPosts({ page: 0, size: 10 });

    const categories = categoriesData?.content ?? [];
    const posts = feed?.content ?? [];
    const featured = posts.slice(0, 3);
    const latest = posts.slice(3, 7);

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        const trimmed = keyword.trim();
        navigate(trimmed ? `/explore?q=${encodeURIComponent(trimmed)}` : "/explore");
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <section className="border-b border-border bg-gradient-to-b from-vegan-green-subtle to-background px-4 pb-14 pt-12 sm:px-6 lg:px-8 lg:pt-16">
                <div className="mx-auto max-w-3xl text-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-vegan-green-light px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-vegan-green">
                        <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("badge")}
                    </span>

                    <h1 className="mt-5 text-4xl font-extrabold leading-tight text-dark sm:text-5xl lg:text-6xl">
                        {t("title")}
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">{t("subtitle")}</p>

                    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                        <Button size="lg" onClick={() => navigate("/explore")}>
                            <Utensils className="h-4 w-4" aria-hidden="true" />
                            {t("ctaExplore")}
                        </Button>
                        <Button size="lg" variant="outline" onClick={() => navigate("/ai-nutrition")}>
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                            {t("ctaAi")}
                        </Button>
                    </div>

                    {/* Search — nút "Find Ideas" nằm trong ô, theo mockup. */}
                    <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-2xl" role="search">
                        <div className="relative">
                            <Search
                                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                placeholder={t("searchPlaceholder")}
                                aria-label={t("searchPlaceholder")}
                                className="h-14 w-full rounded-full border border-border bg-surface pl-11 pr-32 text-sm text-dark shadow-sm focus-visible:border-vegan-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green"
                            />
                            <Button type="submit" shape="pill" className="absolute right-1.5 top-1.5 h-11 px-5">
                                {t("searchButton")}
                            </Button>
                        </div>
                    </form>

                    {/* Trust metrics */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                        {(["recipes", "masterclasses", "nutritionists"] as const).map((key) => (
                            <span key={key} className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-vegan-green" aria-hidden="true" />
                                {t(`metrics.${key}`)}
                            </span>
                        ))}
                    </div>

                    {/* Category pills */}
                    <div className="mt-8 flex flex-wrap justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate("/explore")}
                            className="rounded-full bg-vegan-green px-4 py-1.5 text-xs font-semibold text-white"
                        >
                            {t("explore:tab.all")}
                        </button>
                        {isCategoriesLoading
                            ? Array.from({ length: 5 }).map((_, index) => (
                                  <Skeleton key={index} className="h-7 w-20 rounded-full" />
                              ))
                            : categories.map((category) => (
                                  <button
                                      key={category.id}
                                      type="button"
                                      onClick={() => navigate(`/explore?q=${encodeURIComponent(category.name)}`)}
                                      className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-vegan-green-muted hover:text-vegan-green"
                                  >
                                      {category.name}
                                  </button>
                              ))}
                    </div>
                </div>
            </section>

            {/* Featured Content */}
            <section className="px-4 py-14 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <Badge variant="lightgreen" className="mb-2">
                                <Sparkles className="h-3 w-3" aria-hidden="true" />
                                {t("editorsPicks")}
                            </Badge>
                            <h2 className="text-2xl font-bold text-dark sm:text-3xl">{t("featuredTitle")}</h2>
                        </div>
                        <p className="max-w-md text-sm text-muted-foreground">{t("featuredSubtitle")}</p>
                    </div>

                    {isFeedError ? (
                        <p className="text-sm text-danger" role="alert">
                            {t("error")}
                        </p>
                    ) : isFeedLoading ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Skeleton key={index} className="h-80 rounded-2xl" />
                            ))}
                        </div>
                    ) : featured.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("empty")}</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {featured.map((post) => (
                                <PostCard key={post.id} post={post} language={language} bookmark />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* AI banner */}
            <section className="px-4 pb-14 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col items-start gap-4 rounded-2xl bg-vegan-green-light p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-vegan-green text-white">
                                <Leaf className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div>
                                <h3 className="font-bold text-dark">{t("aiBanner.title")}</h3>
                                <p className="mt-0.5 text-sm text-muted-foreground">{t("aiBanner.subtitle")}</p>
                            </div>
                        </div>
                        <Button onClick={() => navigate("/ai-nutrition")}>
                            {t("aiBanner.cta")}
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* Latest */}
            <section className="border-t border-border bg-muted-bg px-4 py-14 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-dark sm:text-3xl">{t("latestTitle")}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{t("latestSubtitle")}</p>
                        </div>
                        <Link
                            to="/explore"
                            className="hidden items-center gap-1 whitespace-nowrap text-sm font-bold text-vegan-green hover:underline sm:flex"
                        >
                            {t("viewAllFeed")}
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </div>

                    {isFeedLoading ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <Skeleton key={index} className="h-72 rounded-2xl" />
                            ))}
                        </div>
                    ) : latest.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("empty")}</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {latest.map((post) => (
                                <PostCard key={post.id} post={post} language={language} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
