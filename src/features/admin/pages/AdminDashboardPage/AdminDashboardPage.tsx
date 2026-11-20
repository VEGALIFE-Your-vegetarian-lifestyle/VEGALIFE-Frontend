import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
    AlertTriangle,
    ArrowUpRight,
    BadgeCheck,
    ChefHat,
    CheckCircle2,
    CreditCard,
    FileText,
    Heart,
    RefreshCw,
    ShieldAlert,
    ThumbsDown,
    ThumbsUp,
    TrendingUp,
    Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/ErrorState";
import { SectionCard } from "@/components/common/SectionCard";
import { getAdminDashboard, getAdminDashboardCharts } from "../../dashboardApi";
import type {
    DashboardChartsResponse,
    DashboardRangeType,
    DashboardResponse,
} from "../../types";
import { formatVnd, formatRate, formatHoursAge } from "../../dashboardFormat";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { cn } from "@/shared/utils/cn";
import { useUiStore } from "@/shared/ui/uiStore";

// recharts chỉ cần ở trang này → tách chunk riêng, user thường không tải.
const DashboardCharts = lazy(() =>
    import("./DashboardCharts").then((m) => ({ default: m.DashboardCharts })),
);

export default function AdminDashboardPage() {
    const { t } = useTranslation("admin");
    const language = useUiStore((state) => state.language);
    const [range, setRange] = useState<DashboardRangeType>("week");

    // Summary: lifetime/trạng thái hiện tại, không tham số thời gian.
    const summary = useQuery<DashboardResponse>({
        queryKey: ["admin-dashboard"],
        queryFn: () => getAdminDashboard(),
    });

    // Charts: cửa sổ thời gian, cache riêng theo từng range.
    const charts = useQuery<DashboardChartsResponse>({
        queryKey: ["admin-dashboard-charts", range],
        queryFn: () => getAdminDashboardCharts({ range }),
        placeholderData: keepPreviousData,
    });

    const { data, isLoading, isFetching } = summary;
    const currency = data?.meta.currency ?? "VND";
    const money = (amount: number) => formatVnd(amount, language, currency);

    if (summary.isError) {
        return (
            <div className="space-y-6">
                <PageHeader
                    breadcrumb={[t("dashboard.adminLabel"), t("dashboard.title")]}
                    title={t("dashboard.title")}
                    description={t("dashboard.subtitle")}
                />
                <div className="rounded-2xl border border-border bg-card p-6">
                    <ErrorState onRetry={() => void summary.refetch()} />
                </div>
            </div>
        );
    }

    const totalPending =
        (data?.moderationQueue.pendingPosts ?? 0) +
        (data?.moderationQueue.pendingRecipes ?? 0) +
        (data?.moderationQueue.reportedComments ?? 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <PageHeader
                    breadcrumb={[t("dashboard.adminLabel"), t("dashboard.title")]}
                    title={t("dashboard.title")}
                    description={t("dashboard.subtitle")}
                />

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:self-start lg:self-auto">
                    {data && (
                        <span className="text-xs text-muted-foreground">
                            {t("dashboard.asOf", { time: formatDateLocale(data.meta.generatedAt, language) })}
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            void summary.refetch();
                            void charts.refetch();
                        }}
                        disabled={isFetching || charts.isFetching}
                        className="gap-2 self-start sm:self-auto"
                        title={t("dashboard.refresh")}
                    >
                        <RefreshCw
                            className={cn("h-4 w-4", (isFetching || charts.isFetching) && "animate-spin text-vegan-green")}
                        />
                        <span className="hidden sm:inline">{t("dashboard.refresh")}</span>
                    </Button>
                </div>
            </div>

            {/* Tổng quan: 5 chỉ số chính */}
            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
            ) : data ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {/* Thành viên */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                {t("dashboard.metrics.users")}
                            </span>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-vegan-green-light text-vegan-green">
                                <Users className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-dark">
                            {data.users.total.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t("dashboard.users.activationRate", {
                                value: formatRate(data.users.activationRate, language),
                            })}
                        </p>
                    </div>

                    {/* Bài viết */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                {t("dashboard.metrics.posts")}
                            </span>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-vegan-green-light text-vegan-green">
                                <FileText className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-dark">
                            {data.content.totalPosts.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.metrics.postsDesc")}</p>
                    </div>

                    {/* Công thức */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                {t("dashboard.metrics.recipes")}
                            </span>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-terracotta">
                                <ChefHat className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-dark">
                            {data.content.totalRecipes.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.metrics.recipesDesc")}</p>
                    </div>

                    {/* Thành viên trả phí */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                {t("dashboard.money.payingUsersTotal")}
                            </span>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-dark">
                                <CreditCard className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-dark">
                            {data.money.payingUsersTotal.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {formatRate(data.money.payerConversionRate, language)}{" "}
                            {t("dashboard.money.payerConversionRate")}
                        </p>
                    </div>

                    {/* Doanh thu */}
                    <div className="rounded-2xl border border-border bg-vegan-green-light/50 p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                {t("dashboard.money.revenueTotal")}
                            </span>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-vegan-green">
                                <TrendingUp className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-dark">
                            {money(data.money.revenueTotal)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.money.revenueGross")}</p>
                    </div>
                </div>
            ) : null}

            {/* Charts theo thời gian — range chỉ còn ý nghĩa ở đây */}
            <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
                <DashboardCharts
                    data={charts.data}
                    isLoading={charts.isLoading}
                    isError={charts.isError}
                    onRetry={() => void charts.refetch()}
                    range={range}
                    onRangeChange={setRange}
                    language={language}
                />
            </Suspense>

            {/* Hàng chờ kiểm duyệt */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                <div className="border-b border-border pb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta">
                            {t("dashboard.moderation.eyebrow")}
                        </span>
                        {totalPending > 0 ? (
                            <Badge variant="destructive" size="sm">
                                {t("dashboard.moderation.pendingCount", { count: totalPending })}
                            </Badge>
                        ) : (
                            <Badge variant="secondary" size="sm" className="bg-vegan-green-light text-vegan-green">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                {t("dashboard.moderation.cleanQueue")}
                            </Badge>
                        )}
                    </div>
                    <h2 className="mt-1 text-lg font-bold text-dark">{t("dashboard.moderation.title")}</h2>
                    <p className="text-sm text-muted-foreground">{t("dashboard.moderation.subtitle")}</p>
                    {data && data.moderationQueue.oldestPendingAgeHours > 0 && (
                        <p className="mt-2 text-xs font-semibold text-terracotta">
                            {t("dashboard.moderation.oldest", {
                                age: formatHoursAge(data.moderationQueue.oldestPendingAgeHours, language),
                            })}
                        </p>
                    )}
                    {data && data.moderationQueue.filterSkippedPosts > 0 && (
                        <p className="mt-1 text-xs font-semibold text-amber-strong">
                            {t("dashboard.moderation.filterSkipped", {
                                count: data.moderationQueue.filterSkippedPosts,
                            })}
                        </p>
                    )}
                </div>

                {isLoading ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Skeleton className="h-28 rounded-xl" />
                        <Skeleton className="h-28 rounded-xl" />
                        <Skeleton className="h-28 rounded-xl" />
                    </div>
                ) : data ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div
                            className={cn(
                                "flex flex-col justify-between rounded-xl border p-4 transition-all",
                                data.moderationQueue.pendingPosts > 0
                                    ? "border-amber-300 bg-amber-50/60 dark:bg-amber-950/20"
                                    : "border-border bg-background",
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        {t("dashboard.moderation.pendingPosts")}
                                    </span>
                                    <p className="mt-1 text-2xl font-bold text-dark">
                                        {data.moderationQueue.pendingPosts}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {t("dashboard.moderation.pendingPostsDesc")}
                                    </p>
                                </div>
                                <ShieldAlert
                                    className={cn(
                                        "h-5 w-5",
                                        data.moderationQueue.pendingPosts > 0
                                            ? "text-amber-600"
                                            : "text-muted-foreground",
                                    )}
                                />
                            </div>
                            <div className="mt-4">
                                {/* Counter đếm `status=pending` (ADR-029) — mở đúng hàng chờ đó. */}
                                <Link to="/admin/posts?status=pending">
                                    <Button
                                        variant={data.moderationQueue.pendingPosts > 0 ? "primary" : "outline"}
                                        size="sm"
                                        className="w-full text-xs"
                                    >
                                        <span>{t("dashboard.moderation.actionReview")}</span>
                                        <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div
                            className={cn(
                                "flex flex-col justify-between rounded-xl border p-4 transition-all",
                                data.moderationQueue.pendingRecipes > 0
                                    ? "border-amber-300 bg-amber-50/60 dark:bg-amber-950/20"
                                    : "border-border bg-background",
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        {t("dashboard.moderation.pendingRecipes")}
                                    </span>
                                    <p className="mt-1 text-2xl font-bold text-dark">
                                        {data.moderationQueue.pendingRecipes}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {t("dashboard.moderation.pendingRecipesDesc")}
                                    </p>
                                </div>
                                <ChefHat
                                    className={cn(
                                        "h-5 w-5",
                                        data.moderationQueue.pendingRecipes > 0
                                            ? "text-amber-600"
                                            : "text-muted-foreground",
                                    )}
                                />
                            </div>
                            <div className="mt-4">
                                <Link to="/admin/recipes">
                                    <Button
                                        variant={data.moderationQueue.pendingRecipes > 0 ? "primary" : "outline"}
                                        size="sm"
                                        className="w-full text-xs"
                                    >
                                        <span>{t("dashboard.moderation.actionReview")}</span>
                                        <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div
                            className={cn(
                                "flex flex-col justify-between rounded-xl border p-4 transition-all",
                                data.moderationQueue.reportedComments > 0
                                    ? "border-rose-300 bg-rose-50/60 dark:bg-rose-950/20"
                                    : "border-border bg-background",
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        {t("dashboard.moderation.reportedComments")}
                                    </span>
                                    <p className="mt-1 text-2xl font-bold text-dark">
                                        {data.moderationQueue.reportedComments}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {t("dashboard.moderation.reportedCommentsDesc")}
                                    </p>
                                </div>
                                <AlertTriangle
                                    className={cn(
                                        "h-5 w-5",
                                        data.moderationQueue.reportedComments > 0
                                            ? "text-terracotta"
                                            : "text-muted-foreground",
                                    )}
                                />
                            </div>
                            <div className="mt-4">
                                <Link to="/admin/comments">
                                    <Button
                                        variant={data.moderationQueue.reportedComments > 0 ? "destructive" : "outline"}
                                        size="sm"
                                        className="w-full text-xs"
                                    >
                                        <span>{t("dashboard.moderation.actionReview")}</span>
                                        <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Tương tác — toàn bộ là số LIFETIME (không còn số theo kỳ) */}
            {data && (
                <SectionCard title={t("dashboard.engagement.title")} subtitle={t("dashboard.engagement.subtitle")}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-border bg-background p-4">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-xs font-semibold">{t("dashboard.engagement.totalVotes")}</span>
                                <ThumbsUp className="h-4 w-4 text-vegan-green" />
                            </div>
                            <p className="mt-2 text-3xl font-bold text-dark">
                                {data.engagement.totalVotes.toLocaleString()}
                            </p>
                            <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1 text-vegan-green">
                                    <ThumbsUp className="h-3 w-3" />
                                    {data.engagement.votesUp.toLocaleString()}
                                </span>
                                <span className="inline-flex items-center gap-1 text-terracotta">
                                    <ThumbsDown className="h-3 w-3" />
                                    {data.engagement.votesDown.toLocaleString()}
                                </span>
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-background p-4">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-xs font-semibold">{t("dashboard.engagement.totalSaves")}</span>
                                <Heart className="h-4 w-4 text-terracotta" />
                            </div>
                            <p className="mt-2 text-3xl font-bold text-dark">
                                {data.engagement.totalSaves.toLocaleString()}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t("dashboard.engagement.savesBreakdown", {
                                    posts: data.engagement.savedPosts,
                                    recipes: data.engagement.savedRecipes,
                                })}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-background p-4">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-xs font-semibold">{t("dashboard.engagement.emailVerified")}</span>
                                <BadgeCheck className="h-4 w-4 text-vegan-green" />
                            </div>
                            <p className="mt-2 text-3xl font-bold text-dark">
                                {data.users.emailVerified.toLocaleString()}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t("dashboard.engagement.activationRate", {
                                    value: formatRate(data.users.activationRate, language),
                                })}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-background p-4">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="text-xs font-semibold">{t("dashboard.engagement.accountState")}</span>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {t("dashboard.engagement.suspendedCount", { count: data.users.suspended })}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {t("dashboard.engagement.deactivatedCount", { count: data.users.deactivated })}
                            </p>
                        </div>
                    </div>
                </SectionCard>
            )}

        </div>
    );
}
