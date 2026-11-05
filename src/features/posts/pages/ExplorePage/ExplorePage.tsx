import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PillTabs } from "@/components/ui/pill-tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { useFeedPosts } from "../../useFeedPosts";
import { usePublicCategories, useCategoryNames } from "@/features/categories/usePublicCategories";
import { estimateReadMinutes } from "@/shared/utils/formatDate";
import { FeedPostCard } from "./FeedPostCard";
import { PostCommentsDialog } from "./PostCommentsDialog";
import { ExploreFilterPanel, type FilterStats, type FormatFilter, type ReadingFilter } from "./ExploreFilterPanel";
import type { PostListResponse } from "../../types";

type Tab = "all" | "recipe" | "blog";
type SortKey = "popular" | "recent";

const PAGE_SIZE = 60;
/** Số card mỗi trang. Phân trang số như mockup. */
const PER_PAGE = 8;
/** Ngưỡng đọc nhanh / chuyên sâu — `estimateReadMinutes` tính từ `content`. */
const QUICK_MAX = 5;
const DEEP_MIN = 10;

/**
 * Trang khám phá — bám `stich_design/screen_explore`: header + search pill, pill tab,
 * lọc cột trái, feed cột phải, phân trang số ở chân.
 *
 * ponytail: `GET /api/search` **chưa có** và feed chỉ nhận `page`/`size` → từ khoá,
 * category, định dạng, thời gian đọc đều lọc client trên tối đa 60 bài. Prod nhiều bài
 * hơn thì phải nới backend.
 *
 * Mockup vẽ "Topic & Dietary Focus", "Author Role", bookmark/share — không có field
 * hay API nào, đã bỏ thay vì bịa (xem `DOCS/MOCK-FIELDS.md`).
 */
export default function ExplorePage() {
    const { t } = useTranslation(["explore", "home"]);
    const [searchParams, setSearchParams] = useSearchParams();

    const urlQuery = searchParams.get("q") ?? "";
    // `cat` lặp nhiều lần trên URL → giữ mảng ổn định qua chuỗi key để memo không tính lại mỗi render.
    const catKey = searchParams.getAll("cat").join(",");
    const selectedCats = useMemo(() => (catKey ? catKey.split(",") : []), [catKey]);

    const [draftQuery, setDraftQuery] = useState(urlQuery);
    const [tab, setTab] = useState<Tab>("all");
    const [sort, setSort] = useState<SortKey>("popular");
    const [format, setFormat] = useState<FormatFilter>("all");
    const [reading, setReading] = useState<ReadingFilter>("any");
    const [dialogPost, setDialogPost] = useState<PostListResponse | null>(null);

    const { data, isLoading, isError } = useFeedPosts({ page: 0, size: PAGE_SIZE });
    const categoryNames = useCategoryNames();
    // Cùng tham số với `useCategoryNames` → dùng chung cache, không thêm request.
    const { data: categoriesData } = usePublicCategories({ page: 0, size: 100, sort: "name,asc" });
    const categories = categoriesData?.content ?? [];

    // useMemo để danh tính mảng ổn định — nếu không, các useMemo dưới tính lại mỗi render.
    const allPosts = useMemo(() => data?.content ?? [], [data]);

    const keyword = urlQuery.trim().toLowerCase();
    const filterKey = `${urlQuery}|${tab}|${sort}|${catKey}|${format}|${reading}`;

    /**
     * Đổi bộ lọc thì tự về trang 1 — so khoá thay vì `useEffect` gọi `setState`
     * (React coi đó là cascading render). Cùng cách `MyRecipesPage`.
     */
    const [pager, setPager] = useState({ key: filterKey, page: 1 });
    const currentPage = pager.key === filterKey ? pager.page : 1;
    const goToPage = (next: number) => setPager({ key: filterKey, page: next });

    const filtered = useMemo(() => {
        const result = allPosts.filter((post) => {
            if (!matchesTab(post, tab)) return false;
            if (selectedCats.length > 0 && !post.categoryIds.some((id) => selectedCats.includes(id))) return false;
            if (!matchesFormat(post, format)) return false;
            if (!matchesReading(post, reading)) return false;
            return matchesKeyword(post, keyword, categoryNames);
        });

        return result.sort((a, b) =>
            sort === "recent"
                ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                : b.viewCount - a.viewCount,
        );
    }, [allPosts, tab, sort, selectedCats, format, reading, keyword, categoryNames]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

    // Số trên pill = số bài sẽ thấy khi bấm vào pill đó: đã áp từ khoá + category,
    // CHƯA áp tab (mỗi pill đếm tập của chính nó). Nhờ vậy pill "All" khớp badge cạnh tiêu đề.
    const counts = useMemo(() => {
        const base = allPosts.filter(
            (post) =>
                (selectedCats.length === 0 || post.categoryIds.some((id) => selectedCats.includes(id))) &&
                matchesKeyword(post, keyword, categoryNames),
        );
        return {
            all: base.length,
            recipe: base.filter((post) => matchesTab(post, "recipe")).length,
            blog: base.filter((post) => matchesTab(post, "blog")).length,
        };
    }, [allPosts, selectedCats, keyword, categoryNames]);

    /** Số đếm cho panel lọc — cùng tập `base` của pill (đã áp từ khoá + category). */
    const stats: FilterStats = useMemo(() => {
        const base = allPosts.filter(
            (post) =>
                (selectedCats.length === 0 || post.categoryIds.some((id) => selectedCats.includes(id))) &&
                matchesKeyword(post, keyword, categoryNames),
        );
        const byCategory = new Map<string, number>();
        for (const post of base) {
            for (const id of post.categoryIds) byCategory.set(id, (byCategory.get(id) ?? 0) + 1);
        }
        return {
            byCategory,
            recipe: base.filter((post) => post.recipeIds.length > 0).length,
            article: base.filter((post) => post.recipeIds.length === 0).length,
            quick: base.filter((post) => estimateReadMinutes(post.content) < QUICK_MAX).length,
            deep: base.filter((post) => estimateReadMinutes(post.content) > DEEP_MIN).length,
        };
    }, [allPosts, selectedCats, keyword, categoryNames]);

    const activeFilters =
        selectedCats.length + (tab !== "all" ? 1 : 0) + (sort !== "popular" ? 1 : 0) +
        (format !== "all" ? 1 : 0) + (reading !== "any" ? 1 : 0);

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        const next = new URLSearchParams(searchParams);
        const trimmed = draftQuery.trim();
        if (trimmed) next.set("q", trimmed);
        else next.delete("q");
        setSearchParams(next, { replace: true });
    };

    const clearSearch = () => {
        setDraftQuery("");
        const next = new URLSearchParams(searchParams);
        next.delete("q");
        setSearchParams(next, { replace: true });
    };

    const toggleCategory = (id: string) => {
        const next = new URLSearchParams(searchParams);
        const current = next.getAll("cat");
        next.delete("cat");
        for (const cat of current) if (cat !== id) next.append("cat", cat);
        if (!current.includes(id)) next.append("cat", id);
        setSearchParams(next, { replace: true });
    };

    const clearFilters = () => {
        setDraftQuery("");
        setTab("all");
        setSort("popular");
        setFormat("all");
        setReading("any");
        setSearchParams({}, { replace: true });
    };

    const tabs = [
        { key: "all" as const, label: t("tab.all"), count: counts.all },
        { key: "recipe" as const, label: t("tab.recipe"), count: counts.recipe },
        { key: "blog" as const, label: t("tab.blog"), count: counts.blog },
    ];

    // `max-w-6xl` chứ không `max-w-app`: feed 3/4 của 96rem cho ra card ~1100px — quá rộng
    // để đọc, và đẩy ảnh bìa thành khối cao lấn màn.
    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Hero: eyebrow + tiêu đề + phụ đề + search pill. */}
            <div className="flex flex-col items-center pb-6 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-vegan-green-light px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-vegan-green">
                    {t("hero.eyebrow")}
                </span>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-dark sm:text-4xl">{t("hero.title")}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {t("hero.subtitle")}
                </p>
            </div>

            <form
                onSubmit={handleSearch}
                role="search"
                className="mx-auto flex max-w-2xl items-center gap-1.5 rounded-full bg-card p-1.5 shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-2 focus-within:ring-vegan-green/40"
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

            {/* Pill tab + thanh điều khiển feed. */}
            <div className="mt-6 flex flex-col gap-4">
                <PillTabs items={tabs} value={tab} onChange={setTab} className="lg:justify-center" />

                <div className="flex flex-col items-start justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-dark">{t("items", { count: filtered.length })}</span>{" "}
                        {t("filteredAcross")}
                    </p>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        {t("sortBy")}
                        <Select
                            value={sort}
                            onChange={(event) => setSort(event.target.value as SortKey)}
                            className="w-40"
                            aria-label={t("sortBy")}
                        >
                            <option value="popular">{t("sort.popular")}</option>
                            <option value="recent">{t("sort.recent")}</option>
                        </Select>
                    </label>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
                <aside className="hidden lg:sticky lg:top-20 lg:col-span-1 lg:block">
                    <ExploreFilterPanel
                        categories={categories}
                        stats={stats}
                        selectedCats={selectedCats}
                        onToggleCategory={toggleCategory}
                        format={format}
                        onFormatChange={setFormat}
                        reading={reading}
                        onReadingChange={setReading}
                        onReset={clearFilters}
                        canReset={activeFilters > 0 || !!urlQuery}
                    />
                </aside>

                <div className="flex flex-col gap-5 lg:col-span-3">
                    {/* Mobile: chip category thay sidebar bị ẩn. */}
                    <div className="flex flex-wrap gap-2 lg:hidden">
                        {categories.map((category) => {
                            const checked = selectedCats.includes(category.id);
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
                        })}
                        <button
                            type="button"
                            onClick={() => (reading === "quick" ? setReading("any") : setReading("quick"))}
                            aria-pressed={reading === "quick"}
                            className={
                                reading === "quick"
                                    ? "rounded-full bg-vegan-green px-3 py-1.5 text-xs font-medium text-white"
                                    : "rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-vegan-green-muted hover:text-vegan-green"
                            }
                        >
                            {t("reading.quick")}
                        </button>
                    </div>

                    {isError ? (
                        <p className="text-sm text-danger" role="alert">
                            {t("error")}
                        </p>
                    ) : isLoading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton key={index} className="h-[460px] rounded-2xl" />
                        ))
                    ) : filtered.length === 0 ? (
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
                            {pageItems.map((post, index) => (
                                <FeedPostCard
                                    key={post.id}
                                    post={post}
                                    onOpenComments={setDialogPost}
                                    featured={index === 0 && safePage === 1}
                                />
                            ))}

                            <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
                                <p className="text-sm text-muted-foreground">
                                    {t("showing", {
                                        shown: pageItems.length,
                                        total: filtered.length,
                                    })}
                                </p>
                                <Pagination page={safePage} totalPages={totalPages} onChange={goToPage} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <PostCommentsDialog post={dialogPost} onClose={() => setDialogPost(null)} />
        </div>
    );
}

/** Có category = recipe, không = blog. ponytail: BE bỏ `type`/`videoUrl` khỏi `PostListResponse`
 *  → không cách nào phân biệt video (tab Videos luôn rỗng nên đã bỏ). */
function matchesTab(post: PostListResponse, tab: Tab): boolean {
    if (tab === "all") return true;
    if (tab === "recipe") return post.categoryIds.length > 0;
    return post.categoryIds.length === 0;
}

/** Định dạng suy từ `recipeIds` — mockup gọi là "Content Format". */
function matchesFormat(post: PostListResponse, format: FormatFilter): boolean {
    if (format === "all") return true;
    return format === "recipe" ? post.recipeIds.length > 0 : post.recipeIds.length === 0;
}

/** Thời gian đọc suy từ `content` — mockup gọi là "Reading Time". */
function matchesReading(post: PostListResponse, reading: ReadingFilter): boolean {
    if (reading === "any") return true;
    const minutes = estimateReadMinutes(post.content);
    return reading === "quick" ? minutes < QUICK_MAX : minutes > DEEP_MIN;
}

/** Từ khoá khớp `title` / `content` / tên category (đã hạ chữ thường). Rỗng thì khớp tất. */
function matchesKeyword(post: PostListResponse, keyword: string, categoryNames: Map<string, string>): boolean {
    if (!keyword) return true;
    const categoryText = post.categoryIds.map((id) => categoryNames.get(id) ?? "").join(" ");
    return `${post.title} ${post.content} ${categoryText}`.toLowerCase().includes(keyword);
}
