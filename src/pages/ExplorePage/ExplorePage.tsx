import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BadgeCheck, Bookmark, Clock, FileText, Heart, MessageCircle, Play, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { PillTabs } from "@/components/ui/pill-tabs";
import { EmptyState } from "@/shared/components/EmptyState";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { useCategoryNames } from "@/hooks/usePublicCategories";
import { cn } from "@/lib/utils";
import type { PostListResponse } from "@/types/post";

type Tab = "all" | "recipe" | "blog" | "video";
type SortKey = "popular" | "recent";

const PAGE_SIZE = 60;

const RELATED_SEARCH_KEYS = ["tempeh", "highProtein", "crispyTofu", "nutritionalYeast"] as const;

const PLACEHOLDER = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop";

function matchesTab(post: PostListResponse, tab: Tab): boolean {
    if (tab === "all") return true;
    if (tab === "video") return post.type === "video";
    if (tab === "blog") return post.type === "blog" && post.categoryIds.length === 0;
    return post.type === "blog" && post.categoryIds.length > 0;
}

function ExploreCard({ post }: { post: PostListResponse }) {
    const { t } = useTranslation(["home", "explore"]);
    const isVideo = post.type === "video";
    const isRecipe = !isVideo && post.categoryIds.length > 0;

    return (
        <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
            <div className="relative h-48 overflow-hidden">
                <img
                    src={post.featuredImageUrl || PLACEHOLDER}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                />
                <Badge variant="lightgreen" size="sm" className="absolute left-3 top-3">
                    {isVideo ? t("home:card.video") : isRecipe ? t("home:card.recipe") : t("home:card.blog")}
                </Badge>
                {/* ponytail: lưu bài chưa có API — nút chỉ để đủ UI, xoá khi BE có endpoint. */}
                <span
                    aria-hidden="true"
                    className="absolute right-3 top-3 rounded-full bg-white/85 p-2 text-dark transition group-hover:text-vegan-green"
                >
                    <Bookmark className="h-4 w-4" />
                </span>
                {isVideo && (
                    <span className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-11 w-11 text-white/85 drop-shadow-md" aria-hidden="true" />
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col p-5">
                {/* Meta đổi theo loại bài, theo mockup. */}
                <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                    {isVideo ? (
                        <>
                            <span className="flex items-center gap-1 font-semibold text-amber-strong">
                                <Star className="h-3.5 w-3.5 fill-amber-soft text-amber-strong" aria-hidden="true" />
                                {post.rating?.toFixed(1) ?? "4.8"}
                            </span>
                            <span>{t("explore:masterclass")}</span>
                        </>
                    ) : (
                        <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {post.durationLabel ?? t("home:card.minRead", { count: 5 })}
                        </span>
                    )}
                </div>

                <h3 className="mb-2 line-clamp-2 font-bold text-dark">{post.title}</h3>
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
                        {post.saveCount ?? 0}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5 text-info" aria-hidden="true" />
                        {post.commentCount ?? 0}
                    </span>
                    <span className="ml-auto flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("explore:votes", { count: post.viewCount })}
                    </span>
                </div>

                <a
                    href={`/posts/${post.id}`}
                    className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-lavender text-sm font-semibold text-lavender-strong transition-colors hover:bg-lavender-hover"
                >
                    {isVideo ? t("home:card.viewVideo") : isRecipe ? t("home:card.viewRecipe") : t("home:card.viewBlog")}
                </a>
            </div>
        </article>
    );
}

export default function ExplorePage() {
    const { t } = useTranslation(["explore", "home"]);
    const [searchParams, setSearchParams] = useSearchParams();

    const urlQuery = searchParams.get("q") ?? "";
    const [draftQuery, setDraftQuery] = useState(urlQuery);
    const [tab, setTab] = useState<Tab>("all");
    const [sort, setSort] = useState<SortKey>("popular");

    const { data, isLoading, isError } = useFeedPosts({ page: 0, size: PAGE_SIZE });
    const categoryNames = useCategoryNames();

    // useMemo để danh tính mảng ổn định — nếu không, các useMemo dưới tính lại mỗi render.
    const allPosts = useMemo(() => data?.content ?? [], [data]);

    // ponytail: backend feed chỉ có page/size — lọc q/type/sort ở client trên tối đa 60 bài.
    const filtered = useMemo(() => {
        const keyword = urlQuery.trim().toLowerCase();

        const result = allPosts.filter((post) => {
            if (!matchesTab(post, tab)) return false;
            if (!keyword) return true;
            const categoryText = post.categoryIds.map((id) => categoryNames.get(id) ?? "").join(" ");
            return `${post.title} ${post.content} ${categoryText}`.toLowerCase().includes(keyword);
        });

        switch (sort) {
            case "recent":
                return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            default:
                return result.sort((a, b) => b.viewCount - a.viewCount);
        }
    }, [allPosts, tab, urlQuery, sort, categoryNames]);

    const counts = useMemo(
        () => ({
            all: allPosts.filter((post) => matchesTab(post, "all")).length,
            recipe: allPosts.filter((post) => matchesTab(post, "recipe")).length,
            blog: allPosts.filter((post) => matchesTab(post, "blog")).length,
            video: allPosts.filter((post) => matchesTab(post, "video")).length,
        }),
        [allPosts],
    );

    const activeFilters = (tab !== "all" ? 1 : 0) + (sort !== "popular" ? 1 : 0) + (urlQuery ? 1 : 0);

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        const next = new URLSearchParams(searchParams);
        const trimmed = draftQuery.trim();
        if (trimmed) next.set("q", trimmed);
        else next.delete("q");
        setSearchParams(next, { replace: true });
    };

    const clearFilters = () => {
        setDraftQuery("");
        setTab("all");
        setSort("popular");
        setSearchParams({}, { replace: true });
    };

    const tabs = [
        { key: "all" as const, label: t("tab.all"), count: counts.all },
        { key: "recipe" as const, label: t("tab.recipe"), count: counts.recipe },
        { key: "blog" as const, label: t("tab.blog"), count: counts.blog },
        { key: "video" as const, label: t("tab.video"), count: counts.video },
    ];

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Thẻ tìm kiếm lớn — icon + input + X + Filters + Search, theo mockup. */}
            <form onSubmit={handleSearch} className="rounded-2xl border border-border bg-card p-4 shadow-sm" role="search">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search
                            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            value={draftQuery}
                            onChange={(event) => setDraftQuery(event.target.value)}
                            placeholder={t("searchPlaceholder")}
                            aria-label={t("searchPlaceholder")}
                            className="h-12 w-full rounded-xl border border-border bg-muted-bg pl-12 pr-11 text-sm text-dark placeholder:text-muted-foreground focus-visible:border-vegan-green focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green"
                        />
                        {draftQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setDraftQuery("");
                                    setSearchParams({}, { replace: true });
                                }}
                                aria-label={t("clearSearch")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition hover:bg-accent hover:text-dark"
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => setSearchParams({}, { replace: true })}
                            disabled={activeFilters === 0}
                        >
                            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                            {t("filtersActive", { count: activeFilters })}
                        </Button>
                        <Button type="submit" size="lg">
                            {t("searchButton")}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Tabs + verified badge */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <PillTabs items={tabs} value={tab} onChange={setTab} />
                <span className="flex items-center gap-1.5 text-xs font-semibold text-vegan-green">
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                    {t("verified")}
                </span>
            </div>

            {/* Result header */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-dark">
                    {urlQuery ? (
                        <>
                            {t("resultsFor", { count: filtered.length })} <em className="not-italic text-vegan-green">“{urlQuery}”</em>
                        </>
                    ) : (
                        t("title")
                    )}
                </h1>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    {t("sortBy")}
                    <Select
                        value={sort}
                        onChange={(event) => setSort(event.target.value as SortKey)}
                        className="w-44"
                        aria-label={t("sortBy")}
                    >
                        <option value="popular">{t("sort.popular")}</option>
                        <option value="recent">{t("sort.recent")}</option>
                    </Select>
                </label>
            </div>

            {/* Results */}
            <div className="mt-6">
                {isError ? (
                    <p className="text-sm text-danger" role="alert">
                        {t("error")}
                    </p>
                ) : isLoading ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Skeleton key={index} className="h-96 rounded-2xl" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-card py-6">
                        <EmptyState
                            icon={Search}
                            title={t("empty.title")}
                            description={t("empty.description")}
                            action={<Button onClick={clearFilters}>{t("empty.action")}</Button>}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((post) => (
                            <ExploreCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </div>

            {/* Related searches */}
            <section className="mt-10 rounded-2xl border border-border bg-muted-bg p-6">
                <h2 className="flex items-center gap-2 font-bold text-dark">
                    <Search className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                    {t("relatedTitle")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("relatedSubtitle")}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                    {RELATED_SEARCH_KEYS.map((key) => {
                        const label = t(`related.${key}`);
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    setDraftQuery(label);
                                    setSearchParams({ q: label }, { replace: true });
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground transition",
                                    "hover:border-vegan-green-muted hover:text-vegan-green",
                                )}
                            >
                                <Search className="h-3 w-3" aria-hidden="true" />
                                {label}
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
