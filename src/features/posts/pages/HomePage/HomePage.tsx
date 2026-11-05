import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowRight,
    CalendarDays,
    Clock,
    Eye,
    Leaf,
    Lock,
    MapPin,
    MessageCircle,
    Navigation,
    Plus,
    Search,
    Sparkles,
    Star,
    Utensils,
    Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/useAuth";
import { usePublicCategories, useCategoryNames } from "@/features/categories/usePublicCategories";
import { searchDishes } from "@/shared/api/dishes";
import { useUiStore } from "@/shared/ui/uiStore";
import { cn } from "@/shared/utils/cn";
import { FALLBACK_IMAGE, showFallbackImage, stripMarkdown } from "@/shared/utils/display";
import { estimateReadMinutes, formatDateLocale } from "@/shared/utils/formatDate";
import { PostCard } from "../../components/PostCard";
import { useFeedPosts } from "../../useFeedPosts";
import type { PostListResponse } from "../../types";
import {
    currentWeekRange,
    getCurrentWeekMenu,
    getTopRatedPlaces,
    toISODate,
    type HomeMenuStatus,
} from "./homeData";

/**
 * Home theo mockup `screen01_home`. Toàn bộ khối của trang nằm trong chính file này để dễ chỉnh;
 * chỉ tách `homeData.ts` (shim gọi API thuộc feature khác) và `__tests__/`.
 *
 * Dữ liệu THẬT: feed (`GET /api/posts/feed`), categories (`GET /api/categories`),
 * món (`GET /api/dishes`), địa điểm (`GET /api/locations`), menu tuần (`GET /api/menus/details`).
 * Ba endpoint sau cần JWT → khối thực đơn tự ẩn với khách, khối món tự ẩn, khối địa điểm hiện
 * lời mời đăng nhập (`HomeNearbyPicks`).
 *
 * ponytail: mockup vẽ "Editor Curated", tỉ lệ macro, kcal/protein, tác giả, số tim, khoảng
 * cách, "Join 45,000+ Green Foodies"… — BE không trả field nào cho chúng, đã bỏ thay vì bịa.
 * Danh sách đầy đủ ở `DOCS/MOCK-FIELDS.md`.
 */
export default function HomePage() {
    const { t } = useTranslation("home");
    const { isAuthenticated } = useAuth();
    const language = useUiStore((state) => state.language);

    const { data: categoriesData, isLoading: isCategoriesLoading } = usePublicCategories({
        page: 0,
        size: 10,
        sort: "name,asc",
    });
    const { data: feed, isLoading: isFeedLoading, isError: isFeedError } = useFeedPosts({ page: 0, size: 12 });

    const categories = categoriesData?.content ?? [];
    const posts = feed?.content ?? [];
    /**
     * ponytail: BE không có cờ `featured`/`pinned` → chia lát tuỳ ý từ 1 trang feed, KHÔNG lặp bài
     * (trước đây hero + featured + spotlights cùng lấy `slice(0,3)` nên 3 bài đầu hiện 3 lần).
     * Thứ tự: hero 1 bài → showcase 3 → cộng đồng 2 (mockup đúng 2 card) → mới nhất 4.
     */
    const [highlight = null, ...together] = posts;
    const featured = together.slice(0, 3);
    const spotlight = together.slice(3, 5);
    const latest = together.slice(5, 9);

    return (
        <div className="relative">
            {/* Vệt sáng xanh mờ sau hero — mockup `screen01_home` có lớp glow này để trang không phẳng. */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[1000px] max-w-full -translate-x-1/2 rounded-full bg-gradient-to-b from-vegan-green-muted/30 via-vegan-green-light/40 to-transparent blur-3xl"
            />

            <div className="relative mx-auto flex w-full max-w-app flex-col gap-8 px-4 py-8 sm:px-6 lg:gap-10 lg:px-8">
                <HomeHero
                    highlight={highlight}
                    stories={feed?.totalElements ?? 0}
                    categories={categoriesData?.totalElements ?? 0}
                />

                {/* Pill category — mockup: pill "All" đang chọn (nền xanh sáng) + các pill còn lại nền trắng. */}
                <section className="flex items-center gap-2 overflow-x-auto pb-2">
                    <Link
                        to="/explore"
                        className="shrink-0 rounded-full bg-vegan-green-bright px-4 py-2 text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-95"
                    >
                        {t("pillBar.all")}
                    </Link>
                    {isCategoriesLoading
                        ? Array.from({ length: 5 }).map((_, index) => (
                              <Skeleton key={index} className="h-8 w-28 shrink-0 rounded-full" />
                          ))
                        : categories.map((category) => (
                              <Link
                                  key={category.id}
                                  to={`/explore?q=${encodeURIComponent(category.name)}`}
                                  className="shrink-0 rounded-full bg-surface px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted-bg hover:text-dark"
                              >
                                  {category.name}
                              </Link>
                          ))}
                </section>

                {/* Editorial Showcase */}
                <section className="flex flex-col gap-6">
                    <SectionHeader
                        large
                        eyebrow={t("featuredEyebrow")}
                        title={t("featuredTitle")}
                        subtitle={t("featuredSubtitle")}
                        action={
                            <Link
                                to="/explore"
                                className="flex shrink-0 items-center gap-1 text-sm font-semibold text-vegan-green hover:underline"
                            >
                                {t("viewAllFeed")}
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        }
                    />

                    {isFeedError ? (
                        <p className="text-sm text-danger" role="alert">
                            {t("error")}
                        </p>
                    ) : isFeedLoading ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Skeleton key={index} className="h-80 rounded-3xl" />
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
                </section>

                {/* AI Weekly Meal Strategy — chỉ có khi đã đăng nhập (endpoint cần JWT). */}
                <HomeWeeklyBar />

                <HomeDishes />

                {/* Community Buzz | Curated Vegan Gems — LUÔN 2 cột 1 hàng (7/5) dù đã đăng nhập hay chưa,
                    để bố cục không nhảy khi khách bấm đăng nhập. Khách vãng lai thấy thẻ mời đăng nhập
                    ở cột phải thay cho list địa điểm (API cần JWT). */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    <section className="flex flex-col gap-6 lg:col-span-7">
                        <SectionHeader
                            eyebrow={t("spotlights.eyebrow")}
                            title={t("spotlights.title")}
                            subtitle={t("spotlights.subtitle")}
                            action={
                                <Link
                                    to="/explore"
                                    className="flex shrink-0 items-center gap-1 text-xs font-semibold text-vegan-green hover:underline"
                                >
                                    {t("spotlights.exploreFeed")}
                                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                </Link>
                            }
                        />

                        {isFeedLoading ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <Skeleton key={index} className="h-72 rounded-2xl" />
                                ))}
                            </div>
                        ) : spotlight.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t("empty")}</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {spotlight.map((post) => (
                                    <CommunityCard key={post.id} post={post} language={language} />
                                ))}
                            </div>
                        )}
                    </section>

                    <HomeNearbyPicks />
                </div>

                {/* Latest Recipes & Stories */}
                <section className="flex flex-col gap-6">
                    <SectionHeader
                        large
                        title={t("latestTitle")}
                        action={
                            <Link
                                to="/explore"
                                className="flex shrink-0 items-center gap-1 text-sm font-semibold text-vegan-green hover:underline"
                            >
                                {t("viewAllFeed")}
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        }
                    />

                    {isFeedLoading ? (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <Skeleton key={index} className="h-72 rounded-3xl" />
                            ))}
                        </div>
                    ) : latest.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("empty")}</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {latest.map((post) => (
                                <PostCard key={post.id} post={post} language={language} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Dải CTA cuối trang. ponytail: mockup ghi "Join 45,000+ Green Foodies" — không có
                    nguồn thật, nên chỉ còn câu mời tĩnh. */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-vegan-green-active via-vegan-green to-vegan-green-bright p-8 text-white shadow-xl md:p-12">
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-2xl"
                    />
                    <div className="relative z-10 flex max-w-2xl flex-col items-start gap-4">
                        <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
                            <Leaf className="h-3 w-3" aria-hidden="true" />
                            {t("ctaBand.eyebrow")}
                        </span>
                        <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight md:text-4xl md:leading-[1.15]">
                            {t("ctaBand.title")}
                        </h2>
                        <p className="text-sm text-white/90 md:text-base">{t("ctaBand.subtitle")}</p>
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <Link
                                to={isAuthenticated ? "/meal-plan/create" : "/register"}
                                className="flex h-12 items-center gap-2 rounded-xl bg-surface px-6 text-sm font-bold text-vegan-green shadow-md transition-colors hover:bg-vegan-green-subtle"
                            >
                                {isAuthenticated ? t("ctaBand.actionAuthed") : t("ctaBand.action")}
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                            <Link
                                to="/explore"
                                className="flex h-12 items-center gap-2 rounded-xl bg-white/15 px-5 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/25"
                            >
                                {t("ctaBand.secondary")}
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Khối con — thứ tự theo bố cục trang.
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
    /** Nhãn nhỏ in hoa phía trên tiêu đề — mockup gọi là eyebrow. */
    eyebrow?: string;
    title: string;
    subtitle?: string;
    /** Nút/link bên phải (đã là `<Link>` hoặc `<button>` sẵn). */
    action?: ReactNode;
    /** `headline-xl` 32px cho khối chính; mặc định `headline-lg` 24px cho cột phụ. */
    large?: boolean;
}

/**
 * Đầu mục dùng chung cho các khối ở Home — eyebrow + tiêu đề + phụ đề + link bên phải.
 * Thang chữ bám `DESIGN.md` của mockup: eyebrow `label-sm` 11px, tiêu đề `headline-xl` 32px
 * (khối chính) hoặc `headline-lg` 24px (cột phụ).
 */
function SectionHeader({ eyebrow, title, subtitle, action, large = false }: SectionHeaderProps) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
                {eyebrow && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-vegan-green">
                        {eyebrow}
                    </span>
                )}
                <h2
                    className={
                        large
                            ? "font-display text-2xl font-semibold tracking-tight text-dark md:text-[2rem] md:leading-10"
                            : "text-xl font-semibold tracking-tight text-dark md:text-2xl md:leading-8"
                    }
                >
                    {title}
                </h2>
                {subtitle && <p className="text-xs text-muted-foreground md:text-sm">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

const CHIPS = [
    { key: "quick", to: "/explore", icon: Zap },
    { key: "mealPlan", to: "/meal-plan/create", icon: CalendarDays },
    { key: "restaurants", to: "/nearby", icon: MapPin },
    { key: "ai", to: "/ai-nutrition", icon: MessageCircle },
] as const;

interface HomeHeroProps {
    /** Bài đầu feed — dựng thẻ "Daily Highlight" bên phải; null khi feed rỗng. */
    highlight: PostListResponse | null;
    stories: number;
    categories: number;
}

/**
 * Hero 2 cột của mockup: khối chữ + search + chip điều hướng bên trái (6/12 cột),
 * ảnh lớn tỉ lệ 4/5 có chữ đè lên bên phải (6/12 cột).
 *
 * ponytail: mockup vẽ "Trending: #HighProtein…", 3 cột số marketing ("2,400+ recipes",
 * "45k+ members"), tỉ lệ macro, "★ 4.9 / 1.2k foodies cooked this", 2 thẻ nổi
 * ("High Iron & Zinc", "Dietitian Certified") — BE không trả field nào cho chúng nên bỏ hẳn
 * thay vì bịa. Hàng metrics dưới cùng vẫn là số THẬT (`feed.totalElements`,
 * `categories.totalElements`).
 */
function HomeHero({ highlight, stories, categories }: HomeHeroProps) {
    const { t } = useTranslation("home");
    const navigate = useNavigate();
    const categoryNames = useCategoryNames();
    const [keyword, setKeyword] = useState("");

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        const trimmed = keyword.trim();
        navigate(trimmed ? `/explore?q=${encodeURIComponent(trimmed)}` : "/explore");
    };

    const highlightCategory = highlight?.categoryIds.map((id) => categoryNames.get(id)).find(Boolean);

    return (
        <section className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <div className={cn("flex flex-col items-start gap-5", highlight ? "lg:col-span-6" : "lg:col-span-12")}>
                <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 shadow-sm">
                    <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vegan-green-muted opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-vegan-green" />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-vegan-green">
                        {t("badge")}
                    </span>
                </span>

                <h1 className="text-3xl font-bold leading-tight tracking-tight text-dark md:text-4xl lg:text-[2.5rem] lg:leading-[1.2]">
                    {t("hero.titleLead")}{" "}
                    <span className="font-normal italic text-vegan-green">{t("hero.titleAccent")}</span>{" "}
                    {t("hero.titleTail")}
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">{t("subtitle")}</p>

                <div className="mt-2 flex w-full max-w-xl flex-col gap-3 rounded-2xl bg-surface p-2 shadow-xl">
                    <form
                        onSubmit={handleSearch}
                        role="search"
                        className="flex items-center gap-2 rounded-xl bg-background px-3 py-2.5"
                    >
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <input
                            type="search"
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                            placeholder={t("searchPlaceholder")}
                            aria-label={t("searchPlaceholder")}
                            className="h-8 min-w-0 flex-1 bg-transparent text-sm text-dark placeholder:text-muted-foreground focus:outline-none"
                        />
                        <button
                            type="submit"
                            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-vegan-green-bright px-4 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
                        >
                            {t("searchButton")}
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                    </form>

                    {/* ponytail: mockup gọi hàng này là "Trending:" với hashtag bịa. Ở đây dùng
                        chip điều hướng tới 4 chỗ dùng được thật. */}
                    <div className="flex flex-wrap items-center gap-2 px-1 pb-0.5">
                        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {t("hero.prompt")}
                        </span>
                        {CHIPS.map(({ key, to, icon: Icon }) => (
                            <Link
                                key={key}
                                to={to}
                                className="inline-flex items-center gap-1.5 rounded-full bg-vegan-green-subtle px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-vegan-green-light hover:text-vegan-green"
                            >
                                <Icon className="h-3 w-3" aria-hidden="true" />
                                {t(`hero.chips.${key}`)}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Số THẬT từ feed + categories (mockup vẽ 3 số marketing, BE không trả). */}
                <div className="grid w-full max-w-lg grid-cols-2 gap-6 pt-4">
                    {(Object.entries({ stories, categories }) as [string, number][]).map(([key, count]) => (
                        <span key={key} className="flex flex-col">
                            <span className="text-xl font-bold text-dark">{count.toLocaleString()}</span>
                            <span className="text-[11px] text-muted-foreground">{t(`metrics.${key}`)}</span>
                        </span>
                    ))}
                </div>
            </div>

            {highlight && (
                <div className="relative flex justify-center lg:col-span-6">
                    <div className="relative w-full max-w-[500px]">
                        <Link
                            to={`/posts/${highlight.id}`}
                            className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-muted-bg shadow-2xl"
                        >
                            <img
                                src={highlight.featuredImageUrl || FALLBACK_IMAGE}
                                onError={showFallbackImage()}
                                alt={highlight.title}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <span
                                aria-hidden="true"
                                className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-dark/20"
                            />
                            <span className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-surface/90 px-3 py-1.5 text-[11px] font-semibold text-vegan-green shadow-sm backdrop-blur-md">
                                <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
                                {t("hero.highlight")}
                            </span>
                            <span className="absolute bottom-6 left-6 right-6 flex flex-col gap-2 text-white">
                                <span className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-md bg-vegan-green-bright px-2 py-0.5 text-[11px] font-medium text-white">
                                        {highlightCategory ?? t("card.blog")}
                                    </span>
                                    <span className="flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-medium backdrop-blur-md">
                                        <Clock className="h-3 w-3" aria-hidden="true" />
                                        {t("card.mins", { count: estimateReadMinutes(highlight.content) })}
                                    </span>
                                </span>
                                <h2 className="font-display line-clamp-2 text-xl font-semibold leading-snug md:text-2xl">
                                    {highlight.title}
                                </h2>
                                <span className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-white/90">
                                    {highlightCategory ? t("card.viewRecipe") : t("card.viewBlog")}
                                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                </span>
                            </span>
                        </Link>
                    </div>
                </div>
            )}
        </section>
    );
}

/** `currentWeekRange().days` luôn bắt đầu từ thứ Hai → index = thứ tự ngày. */
const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const STATUS_VARIANT: Record<HomeMenuStatus, "amber" | "default" | "outline" | "lightgreen"> = {
    drafted: "amber",
    scheduled: "default",
    cancelled: "outline",
    completed: "lightgreen",
};

/**
 * Khối "AI Weekly Meal Strategy" của mockup — MỘT card trắng bo `rounded-3xl` bọc lưới 7 ngày
 * dựng từ `GET /api/menus/details`.
 *
 * Endpoint cần JWT và đây là thực đơn của chính người dùng → khách vãng lai không thấy khối này.
 *
 * ponytail: mockup vẽ tỉ lệ macro (Carb 45%…), kcal + protein mỗi ngày, "Completion 85%" —
 * BE không trả field nào cho chúng. Thay bằng dữ liệu THẬT: món của từng ngày (ảnh + tên),
 * số bữa, trạng thái menu và số ngày đã lên món (thanh tiến độ = ngày có bữa / 7).
 * Ngày không có bữa do BE bỏ khỏi `days` → tự bù từ tuần hiện tại.
 */
function HomeWeeklyBar() {
    const { t } = useTranslation("home");
    const { t: tm } = useTranslation("menu");
    const { isAuthenticated } = useAuth();

    const { from, to, days } = currentWeekRange();
    const { data, isLoading } = useQuery({
        queryKey: ["home-week-menu", from, to],
        queryFn: () => getCurrentWeekMenu(from, to),
        enabled: isAuthenticated,
    });

    const menu = data?.find((item) => item.status === "scheduled") ?? data?.[0];
    const planned = new Set((menu?.days ?? []).filter((day) => day.meals.length > 0).map((day) => day.date));
    const today = toISODate(new Date());

    if (!isAuthenticated) return null;

    return (
        <section className="flex flex-col gap-6 rounded-3xl bg-card p-6 shadow-sm lg:p-8">
            <div className="flex flex-col justify-between gap-6 pb-2 lg:flex-row lg:items-center">
                <div>
                    <span className="mb-2 flex w-fit items-center gap-1.5 rounded-full bg-vegan-green-subtle px-3 py-1 text-[11px] font-semibold text-vegan-green">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        {t("weekly.eyebrow")}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-xl font-semibold tracking-tight text-dark md:text-[2rem] md:leading-10">
                            {t("weekly.title")}
                        </h2>
                        {menu && (
                            <Badge variant={STATUS_VARIANT[menu.status]} size="sm">
                                {tm(`status.${menu.status}`)}
                            </Badge>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                        {menu ? t("weekly.daysPlanned", { count: planned.size }) : t("weekly.empty")}
                    </p>
                </div>

                {/* ponytail: mockup vẽ tỉ lệ macro Carb/Protein/Fat — BE không trả số nào.
                    Ô này thay bằng thanh tiến độ THẬT (ngày đã lên món / 7) + nút mở thực đơn. */}
                <div className="flex flex-col gap-3 rounded-2xl bg-background p-4 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                            {t("weekly.progressLabel")}
                        </span>
                        <span className="mt-1 text-sm font-bold text-vegan-green">
                            {planned.size}/7 {t("weekly.daysUnit")}
                        </span>
                        <Progress value={(planned.size / 7) * 100} className="mt-2 h-2 w-32 bg-vegan-green-light" />
                    </div>
                    <Link
                        to={menu ? "/meal-plan" : "/meal-plan/create"}
                        className="flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-vegan-green-bright px-5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
                    >
                        {menu ? t("weekly.open") : t("weekly.create")}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                </div>
            </div>

            {/* Mockup: ô không viền, nền xám nhạt; ô hôm nay nền đậm hơn + chấm xanh góc phải. */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {isLoading
                    ? Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-44 rounded-2xl" />)
                    : days.map((date, index) => {
                          const day = menu?.days.find((item) => item.date === date);
                          const meals = day?.meals ?? [];
                          const first = meals[0];
                          const isToday = date === today;

                          return (
                              <div
                                  key={date}
                                  className={cn(
                                      "relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl p-3.5",
                                      isToday ? "bg-vegan-green-subtle shadow-sm" : "bg-background",
                                  )}
                              >
                                  {isToday && (
                                      <span
                                          aria-hidden="true"
                                          className="absolute right-2 top-2 h-2 w-2 rounded-full bg-vegan-green"
                                      />
                                  )}
                                  <div>
                                      <span
                                          className={cn(
                                              "text-[11px] font-bold",
                                              isToday ? "text-vegan-green" : "text-dark",
                                          )}
                                      >
                                          {tm(`weekdays.short.${WEEKDAY_KEYS[index]}`)}
                                      </span>
                                      <span className="block text-[11px] font-medium text-muted-foreground">
                                          {isToday
                                              ? t("weekly.today")
                                              : `${date.slice(8).replace(/^0/, "")}/${date.slice(5, 7).replace(/^0/, "")}`}
                                      </span>
                                  </div>

                                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted-bg">
                                      {first?.dish.imageUrl ? (
                                          <img
                                              src={first.dish.imageUrl}
                                              alt={first.dish.name}
                                              className="h-full w-full object-cover"
                                              loading="lazy"
                                          />
                                      ) : (
                                          <span className="flex h-full w-full items-center justify-center">
                                              <Leaf className="h-5 w-5 text-vegan-green-muted" aria-hidden="true" />
                                          </span>
                                      )}
                                  </div>

                                  {first ? (
                                      <div>
                                          <span className="block truncate text-[11px] font-bold text-dark">
                                              {first.dish.name}
                                          </span>
                                          <span className="text-xs font-semibold text-vegan-green">
                                              {meals.length > 1
                                                  ? t("weekly.moreMeals", { count: meals.length - 1 })
                                                  : tm(`mealType.${first.mealType}`)}
                                          </span>
                                      </div>
                                  ) : (
                                      <Link
                                          to="/meal-plan/create"
                                          className="flex h-6 items-center gap-1 text-[10px] font-semibold text-vegan-green hover:underline"
                                      >
                                          <Plus className="h-3 w-3" aria-hidden="true" />
                                          {tm("noMeals")}
                                      </Link>
                                  )}
                              </div>
                          );
                      })}
            </div>
        </section>
    );
}

/**
 * "Chef's Picks" của mockup — món thật từ `GET /api/dishes`.
 *
 * ponytail: endpoint này cần JWT và Home là trang public → chỉ render khi đã đăng nhập.
 * Dish chỉ có `name`/`imageUrl`/`cuisineType` (không kcal/protein/thời gian như mockup vẽ),
 * card dẫn sang `/explore?q=<tên món>` vì chưa có trang chi tiết món.
 */
function HomeDishes() {
    const { t } = useTranslation("home");
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ["home-dishes"],
        queryFn: () => searchDishes({ size: 4 }),
        enabled: isAuthenticated,
    });

    const dishes = data?.content ?? [];
    if (!isAuthenticated || (!isLoading && dishes.length === 0)) return null;

    return (
        <section className="flex flex-col gap-6">
            <SectionHeader
                title={t("dishes.title")}
                subtitle={t("dishes.subtitle")}
                action={
                    <button
                        type="button"
                        onClick={() => navigate("/explore")}
                        className="flex shrink-0 items-center gap-1 text-xs font-semibold text-vegan-green hover:underline"
                    >
                        {t("viewAllFeed")}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                }
            />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {isLoading
                    ? Array.from({ length: 4 }).map((_, index) => (
                          <Skeleton key={index} className="h-56 rounded-3xl" />
                      ))
                    : dishes.map((dish) => (
                          <Link
                              key={dish.id}
                              to={`/explore?q=${encodeURIComponent(dish.name)}`}
                              className="group flex flex-col overflow-hidden rounded-3xl bg-card shadow-sm transition-shadow hover:shadow-md"
                          >
                              <span className="relative block aspect-[16/11] overflow-hidden">
                                  <img
                                      src={dish.imageUrl || FALLBACK_IMAGE}
                                      onError={showFallbackImage()}
                                      alt={dish.name}
                                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                      loading="lazy"
                                  />
                                  <span
                                      aria-hidden="true"
                                      className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                                  />
                                  {dish.cuisineType && (
                                      <span className="absolute left-4 top-4 rounded-full bg-surface/90 px-3 py-1 text-[11px] font-semibold text-dark shadow-sm backdrop-blur-sm">
                                          {dish.cuisineType}
                                      </span>
                                  )}
                              </span>
                              <span className="flex flex-1 flex-col gap-2 p-5">
                                  <span className="line-clamp-2 text-base font-bold leading-snug text-dark transition-colors group-hover:text-vegan-green">
                                      {dish.name}
                                  </span>
                                  <span className="mt-auto flex items-center gap-1 text-[11px] font-semibold text-vegan-green">
                                      <Utensils className="h-3 w-3" aria-hidden="true" />
                                      {t("dishes.viewPosts")}
                                  </span>
                              </span>
                          </Link>
                      ))}
            </div>
        </section>
    );
}

/**
 * Cột "Curated Vegan Gems" của mockup — địa điểm THẬT từ `GET /api/locations`
 * (BE xếp sẵn theo rating giảm dần): 1 thẻ lớn + các hàng nhỏ.
 *
 * ponytail: `GET /api/locations` cần JWT và Home là trang public → không gate ở client được.
 * Query để `enabled: isAuthenticated` cho khỏi gọi API chắc chắn 401; khách vãng lai vì thế
 * KHÔNG thấy list địa điểm (muốn thấy phải nới quyền endpoint ở backend). Cột này chiếm
 * `lg:col-span-5` nên khi ẩn thì "Community Buzz" tự giãn hết 12 cột.
 * `LocationItem` KHÔNG có ảnh và không có toạ độ người dùng ở đây → thẻ lớn dùng nền gradient
 * + icon thay ảnh, không hiện khoảng cách (mockup vẽ "0.4 km away"); muốn "gần đây" thật phải
 * xin GPS như `/nearby`.
 */
function HomeNearbyPicks() {
    const { t } = useTranslation("home");
    const { t: tl } = useTranslation("nearby");
    const { isAuthenticated } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ["home-top-rated-places"],
        queryFn: () => getTopRatedPlaces(4),
        enabled: isAuthenticated,
    });

    const places = data ?? [];
    if (isAuthenticated && !isLoading && places.length === 0) return null;

    const [featured, ...rest] = places;
    const featuredType = featured ? tl(`filter.${featured.placeType}`) : null;

    return (
        <section className="flex flex-col gap-6 lg:col-span-5">
            <SectionHeader
                eyebrow={t("nearbyPicks.eyebrow")}
                title={t("nearbyPicks.title")}
                subtitle={t("nearbyPicks.subtitle")}
                action={
                    <span className="shrink-0 rounded-full bg-vegan-green-subtle px-2.5 py-1 text-[11px] font-bold text-vegan-green">
                        {t("nearbyPicks.badge")}
                    </span>
                }
            />

            {!isAuthenticated ? (
                /* Endpoint cần JWT → khách vãng lai chỉ thấy lời mời đăng nhập. `flex-1` để thẻ
                   cao bằng cột "Community Buzz" bên trái, giống hệt lúc đã đăng nhập. */
                <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl bg-card p-8 text-center shadow-sm">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-vegan-green-subtle">
                        <Lock className="h-5 w-5 text-vegan-green" aria-hidden="true" />
                    </span>
                    <p className="text-sm text-muted-foreground">{t("nearbyPicks.loginRequired")}</p>
                    <Link
                        to="/login"
                        className="flex h-10 items-center gap-1.5 rounded-xl bg-vegan-green-bright px-5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
                    >
                        {t("nearbyPicks.login")}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                </div>
            ) : isLoading ? (
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-72 rounded-3xl" />
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-16 rounded-2xl" />
                    ))}
                </div>
            ) : (
                <>
                    {featured && (
                        <article className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-sm">
                            {/* ponytail: `LocationItem` không có field ảnh → nền gradient + ghim thay ảnh. */}
                            <div className="relative flex h-44 items-center justify-center rounded-2xl bg-gradient-to-br from-vegan-green-light via-vegan-green-subtle to-cream">
                                <MapPin className="h-10 w-10 text-vegan-green-muted" aria-hidden="true" />
                                {featuredType && (
                                    <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1 text-[11px] font-bold text-vegan-green shadow-sm backdrop-blur-md">
                                        <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
                                        {featuredType}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-base font-bold leading-snug text-dark md:text-lg">
                                        <Link to={`/nearby/${featured.id}`} className="hover:text-vegan-green">
                                            {featured.name}
                                        </Link>
                                    </h3>
                                    {featured.rating != null && (
                                        <span className="flex shrink-0 items-center gap-1 text-vegan-green">
                                            <Star className="h-3.5 w-3.5 fill-amber-soft" aria-hidden="true" />
                                            <span className="text-xs font-bold">{featured.rating.toFixed(1)}</span>
                                        </span>
                                    )}
                                </div>
                                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                    {featured.address}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {featuredType && (
                                    <span className="rounded-md bg-vegan-green-subtle px-2.5 py-0.5 text-[11px] text-muted-foreground">
                                        {featuredType}
                                    </span>
                                )}
                                {featured.priceLevel ? (
                                    <span className="rounded-md bg-vegan-green-subtle px-2.5 py-0.5 text-[11px] text-muted-foreground">
                                        {"$".repeat(Math.min(4, featured.priceLevel))}
                                    </span>
                                ) : null}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <Link
                                    to="/nearby"
                                    className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-background text-xs font-semibold text-dark transition-colors hover:bg-muted-bg"
                                >
                                    <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                                    {t("nearbyPicks.viewMap")}
                                </Link>
                                <Link
                                    to={`/nearby/${featured.id}`}
                                    className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-vegan-green-bright text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
                                >
                                    {t("nearbyPicks.viewPlace")}
                                </Link>
                            </div>
                        </article>
                    )}

                    <div className="flex flex-col gap-3">
                        {rest.map((place) => (
                            <Link
                                key={place.id}
                                to={`/nearby/${place.id}`}
                                className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 shadow-sm transition-colors hover:bg-vegan-green-subtle"
                            >
                                <span className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-vegan-green-subtle">
                                        <MapPin className="h-5 w-5 text-vegan-green" aria-hidden="true" />
                                    </span>
                                    <span className="flex min-w-0 flex-col gap-0.5">
                                        <span className="truncate text-xs font-bold text-dark md:text-sm">
                                            {place.name}
                                        </span>
                                        <span className="truncate text-[11px] text-muted-foreground">
                                            {place.address}
                                            {/* `priceLevel` 1–4 là field thật; BE trả null thì bỏ trống. */}
                                            {place.priceLevel
                                                ? ` • ${"$".repeat(Math.min(4, place.priceLevel))}`
                                                : ""}
                                            {place.rating != null ? ` • ★ ${place.rating.toFixed(1)}` : ""}
                                        </span>
                                    </span>
                                </span>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-dark transition-colors hover:bg-muted-bg">
                                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}

/**
 * Card "Community Buzz" — mockup: card trắng có padding, ảnh 4/3 bo `rounded-xl` nằm TRONG card
 * (không tràn viền), tiêu đề + trích đoạn, chân card là lượt xem (thật) và ngày đăng (thật).
 * Mockup vẽ thêm avatar + tên tác giả + số tim/bình luận: BE không trả.
 */
function CommunityCard({ post, language }: { post: PostListResponse; language: string }) {
    const { t } = useTranslation("home");
    const categoryNames = useCategoryNames();
    const categoryName = post.categoryIds.map((id) => categoryNames.get(id)).find(Boolean);

    return (
        <article className="group flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
            <Link to={`/posts/${post.id}`} className="relative block aspect-[4/3] overflow-hidden rounded-xl">
                <img
                    src={post.featuredImageUrl || FALLBACK_IMAGE}
                    onError={showFallbackImage()}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                />
                <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
                />
                <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-vegan-green backdrop-blur-sm">
                    {categoryName ?? t("card.blog")}
                </span>
            </Link>

            <div className="flex flex-1 flex-col gap-1.5">
                <h3 className="line-clamp-2 text-base font-bold leading-snug text-dark transition-colors group-hover:text-vegan-green md:text-lg">
                    <Link to={`/posts/${post.id}`}>{post.title}</Link>
                </h3>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground md:text-sm">
                    {stripMarkdown(post.content)}
                </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    {post.viewCount}
                </span>
                <span className="font-semibold text-vegan-green">{formatDateLocale(post.createdAt, language)}</span>
            </div>
        </article>
    );
}
