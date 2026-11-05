import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarDays, ChefHat, ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/useAuth";
import { useProfile } from "@/features/profile/useProfile";
import { getMyPosts } from "@/features/posts/api";
import { getMyRecipes } from "@/features/recipes/api";
import { MODERATION_VARIANT } from "@/features/recipes/constants";
import { useMealPlans } from "@/features/menus/useMealPlans";
import { MENU_STATUS_VARIANT } from "@/features/menus/types";
import { addDays, parseISODate, startOfWeek, toISODate, weekDays } from "@/features/menus/week";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { useUiStore } from "@/shared/ui/uiStore";
import { cn } from "@/shared/utils/cn";

const DAY_LETTERS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const MEALS_PER_DAY = 3;

/** Tổng quan tài khoản — ghép từ 4 nguồn đã có, không thêm endpoint. */
export default function AccountOverviewPage() {
    const { t } = useTranslation(["profile", "common"]);
    const { user } = useAuth();
    const language = useUiStore((state) => state.language);
    const openComposer = useUiStore((state) => state.openComposer);
    const locale = language === "vi" ? "vi-VN" : "en-US";

    const { data: profile } = useProfile();

    const { data: postsPage, isLoading: postsLoading, isError: postsError } = useQuery({
        queryKey: ["my-posts", "summary"],
        queryFn: () => getMyPosts({ page: 1, size: 6 }),
    });
    const { data: recipes = [] } = useQuery({ queryKey: ["my-recipes"], queryFn: getMyRecipes });

    const monday = useMemo(() => startOfWeek(new Date()), []);
    const from = toISODate(monday);
    const to = toISODate(addDays(monday, 6));
    const { data: menus = [] } = useMealPlans({ from, to });

    const counts = postsPage?.counts;
    const pending = recipes.filter((recipe) => recipe.moderationStatus === "PENDING");
    const drafts = (postsPage?.data ?? []).filter((post) => post.status === "created");
    const drafted = menus.filter((menu) => menu.status === "drafted");

    // 7 cột × 3 bữa; đánh dấu ô nào đã có món để vẽ lưới.
    const filled = useMemo(() => {
        const map = new Map<string, number>();
        for (const menu of menus) {
            for (const day of menu.days) map.set(day.date, (map.get(day.date) ?? 0) + day.meals.length);
        }
        return map;
    }, [menus]);

    const mealCount = [...filled.values()].reduce((sum, value) => sum + value, 0);

    const stats = [
        { label: t("account.stats.published"), value: counts?.published },
        { label: t("account.stats.views"), value: counts?.views },
        { label: t("account.stats.pendingRecipes"), value: pending.length, accent: pending.length > 0 },
        { label: t("account.stats.meals"), value: mealCount },
    ];

    // `postId` = mở dialog soạn bài tại chỗ; `to` = điều hướng thường.
    type Task = { key: string; title: string; hint: string; tone: "info" | "amber" } & (
        | { to: string; postId?: never }
        | { postId: string; to?: never }
    );

    const tasks: Task[] = [
        ...pending.map((recipe) => ({
            key: `recipe-${recipe.id}`,
            title: recipe.name,
            hint: t("account.task.recipe"),
            to: "/recipes",
            tone: "amber" as const,
        })),
        ...drafted.map((menu) => ({
            key: `menu-${menu.id}`,
            title: t("account.task.week", { from: shortDate(menu.startDate, language), to: shortDate(menu.endDate, language) }),
            hint: t("account.task.menu"),
            to: "/meal-plan",
            tone: "info" as const,
        })),
        ...drafts.slice(0, 2).map((post) => ({
            key: `post-${post.id}`,
            title: post.title,
            hint: t("account.task.draft", { date: formatDateLocale(post.createdAt, language) }),
            postId: post.id,
            tone: "amber" as const,
        })),
    ];

    const dietary = [
        { label: t("dietary.preferences.label"), value: profile?.preferences?.length ?? 0 },
        { label: t("dietary.dislikes.label"), value: profile?.dislikes?.length ?? 0 },
        { label: t("dietary.allergies.label"), value: profile?.allergies?.length ?? 0, alert: true },
        { label: t("dietary.restrictions.label"), value: profile?.restrictions?.length ?? 0 },
    ].filter((item) => item.value > 0);

    return (
        <>
            <header className="flex flex-wrap items-end justify-between gap-3 px-0.5">
                <div>
                    <h1 className="text-2xl font-semibold leading-tight text-dark sm:text-[25px]">
                        {t("account.greeting", { name: user?.username })}
                    </h1>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">
                        {t("account.week", { from: shortDate(from, language), to: shortDate(to, language) })}
                        {" · "}
                        {t("verifiedAuthor")}
                    </p>
                </div>
                <div className="flex flex-none gap-2 max-sm:w-full">
                    <Link
                        to="/meal-plan/create"
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-semibold text-dark transition-colors hover:border-vegan-green-muted hover:bg-accent max-sm:flex-1"
                    >
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                        {t("account.createPlan")}
                    </Link>
                    <button
                        type="button"
                        onClick={() => openComposer()}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-vegan-green px-4 text-sm font-semibold text-white transition-colors hover:bg-vegan-green-hover max-sm:flex-1"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        {t("account.writePost")}
                    </button>
                </div>
            </header>

            <section className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-4">
                {stats.map((item, index) => (
                    <div
                        key={item.label}
                        className={cn(
                            "border-border px-4 py-3.5",
                            index % 2 === 1 && "border-l",
                            index >= 2 && "border-t lg:border-t-0",
                            index === 2 && "lg:border-l",
                        )}
                    >
                        <p
                            className={cn(
                                "font-display text-2xl font-bold leading-none tabular-nums",
                                item.accent ? "text-amber-strong" : "text-dark",
                            )}
                        >
                            {item.value === undefined ? "—" : item.value.toLocaleString(locale)}
                        </p>
                        <p className="mt-1 text-[10.5px] font-semibold text-muted-foreground">{item.label}</p>
                    </div>
                ))}
            </section>

            <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
                <div className="flex min-w-0 flex-col gap-3.5">
                    {/* Việc đang chờ — chỉ hiện khi thật có. */}
                    {tasks.length > 0 && (
                        <section className="rounded-2xl border border-border bg-card">
                            <div className="border-b border-border px-4 pb-2.5 pt-3.5">
                                <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-vegan-green">
                                    {t("account.tasks.eyebrow")}
                                </p>
                                <h2 className="mt-0.5 text-[15.5px] font-semibold text-dark">
                                    {t("account.tasks.title", { count: tasks.length })}
                                </h2>
                            </div>
                            <div className="px-4 pb-3">
                                {tasks.map((task) => {
                                    const rowClass =
                                        "flex w-full items-center gap-2.5 border-t border-border py-2.5 text-left first:border-t-0";
                                    const content = (
                                        <>
                                            <span
                                                className={cn(
                                                    "flex h-8 w-8 flex-none items-center justify-center rounded-lg",
                                                    task.tone === "info"
                                                        ? "bg-info-soft text-lavender-strong"
                                                        : "bg-amber-soft text-amber-strong",
                                                )}
                                            >
                                                {task.tone === "info" ? (
                                                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                                                ) : (
                                                    <ChefHat className="h-4 w-4" aria-hidden="true" />
                                                )}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <b className="block truncate text-[12.5px] font-semibold text-dark">
                                                    {task.title}
                                                </b>
                                                <span className="block truncate text-[11px] text-muted-foreground">
                                                    {task.hint}
                                                </span>
                                            </span>
                                        </>
                                    );

                                    // Bài nháp mở dialog soạn tại chỗ; task khác vẫn điều hướng.
                                    return "postId" in task ? (
                                        <button
                                            key={task.key}
                                            type="button"
                                            onClick={() => task.postId && openComposer(task.postId)}
                                            className={rowClass}
                                        >
                                            {content}
                                        </button>
                                    ) : (
                                        <Link key={task.key} to={task.to} className={rowClass}>
                                            {content}
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    <section className="rounded-2xl border border-border bg-card">
                        <div className="flex items-start justify-between gap-2.5 border-b border-border px-4 pb-2.5 pt-3.5">
                            <div>
                                <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-vegan-green">
                                    {t("account.posts.eyebrow")}
                                </p>
                                <h2 className="mt-0.5 text-[15.5px] font-semibold text-dark">
                                    {t("account.posts.title")}
                                </h2>
                            </div>
                            <Link to="/my-posts" className="flex-none text-[11px] font-bold text-vegan-green">
                                {t("account.viewAll")}
                            </Link>
                        </div>
                        <div className="px-4 pb-3">
                            {postsLoading ? (
                                <div className="space-y-2 py-2">
                                    {[0, 1, 2].map((key) => (
                                        <Skeleton key={key} className="h-11 rounded-lg" />
                                    ))}
                                </div>
                            ) : postsError || !postsPage?.data.length ? (
                                <p className="py-4 text-[12.5px] text-muted-foreground">{t("empty.posts")}</p>
                            ) : (
                                postsPage.data.slice(0, 4).map((post) => {
                                    const rowClass =
                                        "flex w-full items-center gap-2.5 border-t border-border py-2 text-left first:border-t-0";
                                    const content = (
                                        <>
                                            <span className="min-w-0 flex-1">
                                                <b className="block truncate text-[12.5px] font-semibold text-dark">
                                                    {post.title}
                                                </b>
                                                <span className="block truncate text-[10.5px] text-muted-foreground">
                                                    {formatDateLocale(post.createdAt, language)} ·{" "}
                                                    {t("numViews")}: {post.viewCount.toLocaleString(locale)}
                                                </span>
                                            </span>
                                            <Badge variant={post.status === "published" ? "lightgreen" : "amber"} size="sm">
                                                {t(post.status === "published" ? "statusPublished" : "statusDraft")}
                                            </Badge>
                                        </>
                                    );

                                    return post.status === "created" ? (
                                        <button
                                            key={post.id}
                                            type="button"
                                            onClick={() => openComposer(post.id)}
                                            className={rowClass}
                                        >
                                            {content}
                                        </button>
                                    ) : (
                                        <Link key={post.id} to={`/posts/${post.id}`} className={rowClass}>
                                            {content}
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border bg-card">
                        <div className="flex items-start justify-between gap-2.5 border-b border-border px-4 pb-2.5 pt-3.5">
                            <div>
                                <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-vegan-green">
                                    {t("account.recipes.eyebrow")}
                                </p>
                                <h2 className="mt-0.5 text-[15.5px] font-semibold text-dark">
                                    {t("account.recipes.title")}
                                </h2>
                            </div>
                            <Link to="/recipes" className="flex-none text-[11px] font-bold text-vegan-green">
                                {t("account.viewAll")}
                            </Link>
                        </div>
                        <div className="px-4 pb-3">
                            {recipes.length === 0 ? (
                                <p className="py-4 text-[12.5px] text-muted-foreground">
                                    {t("recipe:myRecipes.empty.title")}
                                </p>
                            ) : (
                                recipes.slice(0, 4).map((recipe) => (
                                    <Link
                                        key={recipe.id}
                                        to="/recipes"
                                        className="flex items-center gap-2.5 border-t border-border py-2 first:border-t-0"
                                    >
                                        <span className="min-w-0 flex-1">
                                            <b className="block truncate text-[12.5px] font-semibold text-dark">
                                                {recipe.name}
                                            </b>
                                            <span className="block truncate text-[10.5px] text-muted-foreground">
                                                {recipe.dishName}
                                            </span>
                                        </span>
                                        <Badge variant={MODERATION_VARIANT[recipe.moderationStatus]} size="sm">
                                            {t(`recipe:myRecipes.status.${recipe.moderationStatus}`)}
                                        </Badge>
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                <div className="flex min-w-0 flex-col gap-3.5">
                    <section className="rounded-2xl border border-vegan-green-light bg-vegan-green-subtle">
                        <div className="flex items-start justify-between gap-2.5 border-b border-vegan-green-light px-4 pb-2.5 pt-3.5">
                            <div>
                                <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-vegan-green">
                                    {t("account.plan.eyebrow")}
                                </p>
                                <h2 className="mt-0.5 text-[15.5px] font-semibold text-dark">{t("account.plan.title")}</h2>
                            </div>
                            {menus[0] && (
                                <Badge variant={MENU_STATUS_VARIANT[menus[0].status]} size="sm">
                                    {t(`menu:status.${menus[0].status}`)}
                                </Badge>
                            )}
                        </div>
                        <div className="px-4 py-3.5">
                            <div className="grid grid-cols-7 gap-1">
                                {weekDays(monday).map((date, index) => {
                                    const iso = toISODate(date);
                                    const used = filled.get(iso) ?? 0;
                                    const isToday = iso === toISODate(new Date());
                                    return (
                                        <div key={iso} className="flex min-w-0 flex-col gap-[3px]">
                                            <span
                                                className={cn(
                                                    "text-center text-[9px] font-bold",
                                                    isToday ? "text-vegan-green" : "text-muted-foreground",
                                                )}
                                            >
                                                {t(`menu:weekdays.short.${DAY_LETTERS[index]}`)}
                                            </span>
                                            {Array.from({ length: MEALS_PER_DAY }, (_, slot) => (
                                                <i
                                                    key={slot}
                                                    className={cn(
                                                        "block h-4 rounded",
                                                        slot < used
                                                            ? isToday && slot === 0
                                                                ? "bg-vegan-green"
                                                                : "bg-vegan-green-muted"
                                                            : "bg-muted-bg",
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-vegan-green-light pt-2.5">
                                <span className="text-[11.5px] font-semibold text-muted-foreground">
                                    <b className="font-display text-[15px] text-dark">{mealCount}</b> /{" "}
                                    {7 * MEALS_PER_DAY} {t("account.plan.slots")}
                                </span>
                                <Link
                                    to="/meal-plan"
                                    className="rounded-full bg-vegan-green px-3 py-1 text-[11.5px] font-bold text-white transition-colors hover:bg-vegan-green-hover"
                                >
                                    {t("account.plan.open")}
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border bg-card">
                        <div className="flex items-start justify-between gap-2.5 border-b border-border px-4 pb-2.5 pt-3.5">
                            <div>
                                <p className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-vegan-green">
                                    {t("account.health.eyebrow")}
                                </p>
                                <h2 className="mt-0.5 text-[15.5px] font-semibold text-dark">
                                    {t("account.health.title")}
                                </h2>
                            </div>
                            <Link to="/profile" className="flex-none text-[11px] font-bold text-vegan-green">
                                {t("editProfile")}
                            </Link>
                        </div>
                        <div className="px-4 py-3.5">
                            <div className="flex items-baseline gap-2">
                                <b className="font-display text-[28px] font-bold leading-none tabular-nums text-dark">
                                    {profile?.bmi ?? "—"}
                                </b>
                                <span className="text-[11px] font-semibold text-muted-foreground">{t("bmi")}</span>
                            </div>

                            {profile?.healthGoal && (
                                <div className="mt-2.5 rounded-lg bg-vegan-green-subtle px-2.5 py-2">
                                    <p className="text-[8.5px] font-extrabold uppercase tracking-[0.08em] text-vegan-green">
                                        {t("dietary.healthGoal.label")}
                                    </p>
                                    <p className="mt-0.5 text-[11.5px] leading-snug text-dark">{profile.healthGoal}</p>
                                </div>
                            )}

                            {dietary.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                    {dietary.map((item) => (
                                        <span
                                            key={item.label}
                                            className={cn(
                                                "whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                                item.alert
                                                    ? "bg-danger-soft text-danger"
                                                    : "bg-muted-bg text-muted-foreground",
                                            )}
                                        >
                                            {item.label} {item.value}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        {profile?.updatedAt && (
                            <Link
                                to="/profile"
                                className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:bg-vegan-green-subtle"
                            >
                                <span>{t("lastUpdated", { date: formatDateLocale(profile.updatedAt, language) })}</span>
                                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

function shortDate(iso: string, language: string): string {
    return parseISODate(iso).toLocaleDateString(language === "vi" ? "vi-VN" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
    });
}
