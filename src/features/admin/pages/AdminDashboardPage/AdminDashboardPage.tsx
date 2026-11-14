import { useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
    AlertTriangle,
    Apple,
    ArrowUpRight,
    CheckCircle2,
    ChefHat,
    FileText,
    MapPin,
    MessageSquare,
    RefreshCw,
    ShieldAlert,
    Tags,
    ThumbsUp,
    TrendingUp,
    Users,
    Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/ErrorState";
import { getAdminDashboard } from "../../dashboardApi";
import type { DashboardRangeType, DashboardResponse } from "../../types";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { cn } from "@/shared/utils/cn";
import { useUiStore } from "@/shared/ui/uiStore";

const RANGE_OPTIONS: { key: DashboardRangeType; labelKey: string }[] = [
    { key: "day", labelKey: "range.day" },
    { key: "week", labelKey: "range.week" },
    { key: "month", labelKey: "range.month" },
    { key: "custom", labelKey: "range.custom" },
];

export default function AdminDashboardPage() {
    const { t } = useTranslation("admin");
    const language = useUiStore((state) => state.language);
    const [range, setRange] = useState<DashboardRangeType>("week");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");

    const isCustomValid = range !== "custom" || (Boolean(customFrom) && Boolean(customTo) && customFrom <= customTo);

    const { data, isLoading, isError, isFetching, refetch } = useQuery<DashboardResponse>({
        queryKey: ["admin-dashboard", range, range === "custom" ? customFrom : undefined, range === "custom" ? customTo : undefined],
        queryFn: () =>
            getAdminDashboard({
                range,
                from: range === "custom" ? customFrom : undefined,
                to: range === "custom" ? customTo : undefined,
            }),
        enabled: isCustomValid,
        placeholderData: keepPreviousData,
    });

    if (isError) {
        return (
            <div className="space-y-6">
                <PageHeader
                    breadcrumb={[t("dashboard.adminLabel"), t("dashboard.title")]}
                    title={t("dashboard.title")}
                    description={t("dashboard.subtitle")}
                />
                <div className="rounded-2xl border border-border bg-card p-6">
                    <ErrorState onRetry={() => void refetch()} />
                </div>
            </div>
        );
    }

    const totalContent = (data?.content.totalPosts ?? 0) + (data?.content.totalRecipes ?? 0) + (data?.content.totalComments ?? 0);
    const postsShare = totalContent > 0 ? (((data?.content.totalPosts ?? 0) / totalContent) * 100).toFixed(1) : "0";
    const recipesShare = totalContent > 0 ? (((data?.content.totalRecipes ?? 0) / totalContent) * 100).toFixed(1) : "0";
    const commentsShare = totalContent > 0 ? (((data?.content.totalComments ?? 0) / totalContent) * 100).toFixed(1) : "0";

    const totalPending =
        (data?.moderationQueue.pendingPosts ?? 0) +
        (data?.moderationQueue.pendingRecipes ?? 0) +
        (data?.moderationQueue.reportedComments ?? 0);

    const activeUsers = data?.users.activeInRange ?? 0;
    const totalInteractions = (data?.engagement.votesInRange ?? 0) + (data?.engagement.commentsInRange ?? 0);
    const avgInteractions = activeUsers > 0 ? (totalInteractions / activeUsers).toFixed(1) : "0";

    return (
        <div className="space-y-6">
            {/* Header + Range Filter Bar */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <PageHeader
                    breadcrumb={[t("dashboard.adminLabel"), t("dashboard.title")]}
                    title={t("dashboard.title")}
                    description={t("dashboard.subtitle")}
                />

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:self-start lg:self-auto">
                    {/* Range Tabs */}
                    <div className="inline-flex items-center rounded-xl border border-border bg-card p-1 shadow-sm">
                        {RANGE_OPTIONS.map((opt) => (
                            <button
                                key={opt.key}
                                type="button"
                                onClick={() => setRange(opt.key)}
                                className={cn(
                                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                                    range === opt.key
                                        ? "bg-vegan-green text-white shadow-xs"
                                        : "text-muted-foreground hover:text-dark hover:bg-muted",
                                )}
                            >
                                {t(`dashboard.${opt.labelKey}`)}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void refetch()}
                        disabled={isFetching}
                        className="gap-2 self-start sm:self-auto"
                        title={t("dashboard.refresh")}
                    >
                        <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin text-vegan-green")} />
                        <span className="hidden sm:inline">{t("dashboard.refresh")}</span>
                    </Button>
                </div>
            </div>

            {/* Custom Date Pickers (if custom range selected) */}
            {range === "custom" && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-dark">
                        <span>{t("dashboard.range.from")}:</span>
                        <Input
                            type="date"
                            value={customFrom}
                            onChange={(e) => setCustomFrom(e.target.value)}
                            className="h-8 w-auto text-xs"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-dark">
                        <span>{t("dashboard.range.to")}:</span>
                        <Input
                            type="date"
                            value={customTo}
                            onChange={(e) => setCustomTo(e.target.value)}
                            className="h-8 w-auto text-xs"
                        />
                    </div>
                    {customFrom && customTo && customFrom > customTo && (
                        <p className="text-xs text-destructive">
                            {language === "vi" ? "Ngày bắt đầu phải trước ngày kết thúc" : "Start date must be before end date"}
                        </p>
                    )}
                </div>
            )}

            {/* Date Window Indicator */}
            {data?.range && !isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-vegan-green" />
                    <span>{t("dashboard.range.window")}</span>
                    <span className="font-semibold text-dark">
                        {formatDateLocale(data.range.from, language)} — {formatDateLocale(data.range.to, language)}
                    </span>
                    <Badge variant="secondary" size="sm" className="uppercase text-[10px]">
                        {data.range.type}
                    </Badge>
                </div>
            )}

            {/* Top KPI Cards (4 columns) */}
            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                </div>
            ) : data ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Users KPI */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">{t("dashboard.metrics.users")}</span>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-vegan-green-light text-vegan-green">
                                <Users className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-dark">{data.users.total.toLocaleString()}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 font-semibold text-vegan-green">
                                +{data.users.newInRange} {t("dashboard.metrics.usersNew")}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                                {data.users.activeInRange} {t("dashboard.metrics.usersActive")}
                            </span>
                        </div>
                    </div>

                    {/* Posts KPI */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">{t("dashboard.metrics.posts")}</span>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-vegan-green-light text-vegan-green">
                                <FileText className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-dark">{data.content.totalPosts.toLocaleString()}</p>
                        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-vegan-green">
                            +{data.content.newPosts} {t("dashboard.metrics.postsNew")}
                        </div>
                    </div>

                    {/* Recipes KPI */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">{t("dashboard.metrics.recipes")}</span>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-terracotta">
                                <ChefHat className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-dark">{data.content.totalRecipes.toLocaleString()}</p>
                        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-terracotta">
                            +{data.content.newRecipes} {t("dashboard.metrics.recipesNew")}
                        </div>
                    </div>

                    {/* Comments KPI */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">{t("dashboard.metrics.comments")}</span>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-dark">
                                <MessageSquare className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-dark">{data.content.totalComments.toLocaleString()}</p>
                        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                            +{data.content.newComments} {t("dashboard.metrics.commentsNew")}
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Moderation Queue - Attention Required Snapshot */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta">
                                {t("dashboard.moderation.eyebrow")}
                            </span>
                            {totalPending > 0 ? (
                                <Badge variant="destructive" size="sm">
                                    {totalPending} {language === "vi" ? "cần duyệt" : "pending"}
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
                    </div>
                </div>

                {isLoading ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Skeleton className="h-28 rounded-xl" />
                        <Skeleton className="h-28 rounded-xl" />
                        <Skeleton className="h-28 rounded-xl" />
                    </div>
                ) : data ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {/* Pending Posts */}
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
                                        data.moderationQueue.pendingPosts > 0 ? "text-amber-600" : "text-muted-foreground",
                                    )}
                                />
                            </div>
                            <div className="mt-4">
                                <Link to="/admin/posts">
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

                        {/* Pending Recipes */}
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
                                        data.moderationQueue.pendingRecipes > 0 ? "text-amber-600" : "text-muted-foreground",
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

                        {/* Reported Comments */}
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
                                        data.moderationQueue.reportedComments > 0 ? "text-terracotta" : "text-muted-foreground",
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

            {/* Content & Engagement Breakdown Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Content Distribution Panel */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                    <h2 className="text-lg font-bold text-dark">{t("dashboard.breakdown.contentTitle")}</h2>
                    <p className="text-sm text-muted-foreground">{t("dashboard.breakdown.contentSubtitle")}</p>

                    {isLoading ? (
                        <div className="mt-5 space-y-4">
                            <Skeleton className="h-4 w-full rounded-full" />
                            <Skeleton className="h-20 w-full rounded-xl" />
                        </div>
                    ) : data ? (
                        <div className="mt-5 space-y-5">
                            {/* Proportional visual bar chart */}
                            <div>
                                <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        style={{ width: `${postsShare}%` }}
                                        title={`Posts: ${postsShare}%`}
                                        className="bg-vegan-green transition-all"
                                    />
                                    <div
                                        style={{ width: `${recipesShare}%` }}
                                        title={`Recipes: ${recipesShare}%`}
                                        className="bg-terracotta transition-all"
                                    />
                                    <div
                                        style={{ width: `${commentsShare}%` }}
                                        title={`Comments: ${commentsShare}%`}
                                        className="bg-dark transition-all"
                                    />
                                </div>
                                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-vegan-green" />
                                        <span>{t("dashboard.metrics.posts")} ({postsShare}%)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-terracotta" />
                                        <span>{t("dashboard.metrics.recipes")} ({recipesShare}%)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-dark" />
                                        <span>{t("dashboard.metrics.comments")} ({commentsShare}%)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed breakdown list */}
                            <div className="divide-y divide-border rounded-xl border border-border">
                                <div className="flex items-center justify-between p-3 text-xs">
                                    <span className="font-semibold text-dark">{t("dashboard.metrics.posts")}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-muted-foreground">
                                            {t("dashboard.breakdown.lifetimeTotal")}: <strong className="text-dark">{data.content.totalPosts}</strong>
                                        </span>
                                        <Badge variant="secondary" size="sm" className="bg-vegan-green-light text-vegan-green">
                                            +{data.content.newPosts}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 text-xs">
                                    <span className="font-semibold text-dark">{t("dashboard.metrics.recipes")}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-muted-foreground">
                                            {t("dashboard.breakdown.lifetimeTotal")}: <strong className="text-dark">{data.content.totalRecipes}</strong>
                                        </span>
                                        <Badge variant="secondary" size="sm" className="bg-cream text-terracotta">
                                            +{data.content.newRecipes}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 text-xs">
                                    <span className="font-semibold text-dark">{t("dashboard.metrics.comments")}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-muted-foreground">
                                            {t("dashboard.breakdown.lifetimeTotal")}: <strong className="text-dark">{data.content.totalComments}</strong>
                                        </span>
                                        <Badge variant="secondary" size="sm">
                                            +{data.content.newComments}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Community Engagement Insights */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                    <h2 className="text-lg font-bold text-dark">{t("dashboard.breakdown.engagementTitle")}</h2>
                    <p className="text-sm text-muted-foreground">{t("dashboard.breakdown.engagementSubtitle")}</p>

                    {isLoading ? (
                        <div className="mt-5 space-y-4">
                            <Skeleton className="h-16 w-full rounded-xl" />
                            <Skeleton className="h-16 w-full rounded-xl" />
                        </div>
                    ) : data ? (
                        <div className="mt-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border border-border bg-background p-4">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span className="text-xs font-semibold">{t("dashboard.breakdown.votes")}</span>
                                        <ThumbsUp className="h-4 w-4 text-vegan-green" />
                                    </div>
                                    <p className="mt-2 text-2xl font-bold text-dark">
                                        {data.engagement.votesInRange.toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                        {t("dashboard.breakdown.votesDesc")}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-border bg-background p-4">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span className="text-xs font-semibold">{t("dashboard.breakdown.commentsCount")}</span>
                                        <MessageSquare className="h-4 w-4 text-terracotta" />
                                    </div>
                                    <p className="mt-2 text-2xl font-bold text-dark">
                                        {data.engagement.commentsInRange.toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                        {t("dashboard.breakdown.commentsCountDesc")}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-border bg-vegan-green-light/40 p-4">
                                <div>
                                    <p className="text-xs font-semibold text-dark">
                                        {t("dashboard.breakdown.avgInteractions")}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {data.users.activeInRange} {t("dashboard.metrics.usersActive")}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-vegan-green">{avgInteractions}</span>
                                    <span className="ml-1 text-xs text-muted-foreground">/ user</span>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Quick Management Shortcuts */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                <h2 className="mb-4 text-lg font-bold text-dark">{t("dashboard.quickManagement")}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Link
                        to="/admin/posts"
                        className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition hover:border-vegan-green-muted hover:bg-vegan-green-light"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vegan-green-light text-vegan-green">
                            <FileText className="h-4 w-4" />
                        </div>
                        <span className="truncate text-sm font-semibold text-dark">{t("dashboard.quickLink.posts")}</span>
                    </Link>

                    <Link
                        to="/admin/recipes"
                        className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition hover:border-vegan-green-muted hover:bg-vegan-green-light"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-terracotta">
                            <ChefHat className="h-4 w-4" />
                        </div>
                        <span className="truncate text-sm font-semibold text-dark">{t("dashboard.quickLink.recipes")}</span>
                    </Link>

                    <Link
                        to="/admin/categories"
                        className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition hover:border-vegan-green-muted hover:bg-vegan-green-light"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vegan-green-light text-vegan-green">
                            <Tags className="h-4 w-4" />
                        </div>
                        <span className="truncate text-sm font-semibold text-dark">{t("dashboard.quickLink.categories")}</span>
                    </Link>

                    <Link
                        to="/admin/comments"
                        className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition hover:border-vegan-green-muted hover:bg-vegan-green-light"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-dark">
                            <MessageSquare className="h-4 w-4" />
                        </div>
                        <span className="truncate text-sm font-semibold text-dark">{t("dashboard.quickLink.comments")}</span>
                    </Link>

                    <Link
                        to="/admin/ingredients"
                        className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition hover:border-vegan-green-muted hover:bg-vegan-green-light"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vegan-green-light text-vegan-green">
                            <Apple className="h-4 w-4" />
                        </div>
                        <span className="truncate text-sm font-semibold text-dark">{t("dashboard.quickLink.ingredients")}</span>
                    </Link>

                    <Link
                        to="/admin/locations"
                        className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition hover:border-vegan-green-muted hover:bg-vegan-green-light"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-terracotta">
                            <MapPin className="h-4 w-4" />
                        </div>
                        <span className="truncate text-sm font-semibold text-dark">{t("dashboard.quickLink.locations")}</span>
                    </Link>

                    <Link
                        to="/admin/users"
                        className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition hover:border-vegan-green-muted hover:bg-vegan-green-light"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vegan-green-light text-vegan-green">
                            <Users className="h-4 w-4" />
                        </div>
                        <span className="truncate text-sm font-semibold text-dark">{t("dashboard.quickLink.users")}</span>
                    </Link>

                    <Link
                        to="/admin/videos"
                        className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition hover:border-vegan-green-muted hover:bg-vegan-green-light"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-dark">
                            <Video className="h-4 w-4" />
                        </div>
                        <span className="truncate text-sm font-semibold text-dark">{t("dashboard.quickLink.videos")}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
