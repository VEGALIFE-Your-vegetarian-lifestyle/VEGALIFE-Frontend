import { useMemo } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/common/SectionCard";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { PillTabs } from "@/components/ui/pill-tabs";
import { formatVnd } from "../../dashboardFormat";
import type {
    DashboardChartsResponse,
    DashboardInterval,
    DashboardRangeType,
} from "../../types";

/** Màu lấy từ `@theme` trong src/index.css — recharts cần literal cho thuộc tính SVG. */
const C = {
    green: "#12724a",
    terracotta: "#c2653f",
    grid: "#e3e6ea",
    muted: "#5c6675",
};

interface DashboardChartsProps {
    data?: DashboardChartsResponse;
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    range: DashboardRangeType;
    onRangeChange: (range: DashboardRangeType) => void;
    language: string;
}

export function DashboardCharts({
    data,
    isLoading,
    isError,
    onRetry,
    range,
    onRangeChange,
    language,
}: DashboardChartsProps) {
    const { t } = useTranslation("admin");
    const currency = data?.meta.currency ?? "VND";
    const interval: DashboardInterval = data?.meta.interval ?? "day";

    const money = (amount: number) => formatVnd(amount, language, currency);
    const moneyCompact = useMemo(
        () =>
            new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
                notation: "compact",
                maximumFractionDigits: 1,
            }),
        [language],
    );

    // Bucket là UTC (00:00 UTC = 07:00 giờ VN) → format cưỡng bức theo UTC và nói rõ trên trục.
    const bucketLabel = (iso: string) => {
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return iso;
        if (interval === "hour") {
            return date.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
            });
        }
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            timeZone: "UTC",
        });
    };

    /** Bucket cuối luôn thiếu giờ (cửa sổ kết thúc ở "now") — gắn `*` để không đọc thành sụt giảm. */
    const markLast = <T extends { bucketStart: string }>(points: T[]) =>
        points.map((p, i) => ({
            ...p,
            label: i === points.length - 1 ? `${bucketLabel(p.bucketStart)}*` : bucketLabel(p.bucketStart),
        }));

    const rangeTabs = (
        <PillTabs
            value={range}
            onChange={(key) => onRangeChange(key as DashboardRangeType)}
            items={(["day", "week", "month"] as const).map((key) => ({
                key,
                label: t(`dashboard.charts.range.${key}`),
            }))}
        />
    );

    if (isError) {
        return (
            <SectionCard title={t("dashboard.charts.title")} subtitle={t("dashboard.charts.subtitle")} aside={rangeTabs}>
                <ErrorState onRetry={onRetry} />
            </SectionCard>
        );
    }

    if (isLoading || !data) {
        return (
            <SectionCard title={t("dashboard.charts.title")} subtitle={t("dashboard.charts.subtitle")} aside={rangeTabs}>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-64 rounded-xl" />
                    ))}
                </div>
            </SectionCard>
        );
    }

    const published = markLast(data.publishedPosts.points);

    return (
        <SectionCard
            title={t("dashboard.charts.title")}
            subtitle={t("dashboard.charts.subtitle")}
            aside={rangeTabs}
            footnote={t("dashboard.charts.partialBucket")}
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Doanh thu theo gói — ít hạng mục có tên, một đại lượng → bar ngang */}
                <div>
                    <h3 className="mb-1 text-sm font-bold text-dark">{t("dashboard.charts.revenueByPlan.title")}</h3>
                    <p className="mb-3 text-xs text-muted-foreground">{t("dashboard.charts.revenueByPlan.subtitle")}</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                            data={data.revenueByPlan.items}
                            layout="vertical"
                            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid stroke={C.grid} horizontal={false} />
                            <XAxis
                                type="number"
                                tick={{ fontSize: 11, fill: C.muted }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => moneyCompact.format(Number(value))}
                            />
                            <YAxis
                                type="category"
                                dataKey="code"
                                tick={{ fontSize: 11, fill: C.muted }}
                                tickLine={false}
                                axisLine={false}
                                width={72}
                            />
                            <Tooltip
                                formatter={(value, _name, item) => [
                                    money(Number(value)),
                                    t("dashboard.charts.revenueByPlan.amount", {
                                        purchases: item?.payload?.purchases ?? 0,
                                    }),
                                ]}
                                contentStyle={{ fontSize: 12, borderRadius: 10 }}
                            />
                            <Bar dataKey="amount" fill={C.terracotta} radius={[0, 6, 6, 0]} barSize={18} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {data.revenueByPlan.items
                            .filter((item) => !item.active)
                            .map((item) => (
                                <Badge key={item.planId} variant="secondary" size="sm">
                                    {item.name} · {t("dashboard.charts.revenueByPlan.inactive")}
                                </Badge>
                            ))}
                    </div>
                </div>

                {/* Bài viết đã đăng — đếm rời rạc theo cột → bar dọc */}
                <div>
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                        <h3 className="text-sm font-bold text-dark">{t("dashboard.charts.publishedPosts.title")}</h3>
                        <span className="text-xs text-muted-foreground">
                            {t("dashboard.charts.axisUtc")} · {interval === "hour" ? "HH:mm" : "dd/MM"}
                        </span>
                    </div>
                    <p className="mb-3 text-xs text-muted-foreground">{t("dashboard.charts.publishedPosts.subtitle")}</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={published} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke={C.grid} vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.muted }} tickLine={false} axisLine={false} />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 11, fill: C.muted }}
                                tickLine={false}
                                axisLine={false}
                                width={32}
                            />
                            <Tooltip
                                formatter={(value) => [Number(value), t("dashboard.charts.publishedPosts.published")]}
                                labelFormatter={(label) => `${label} UTC`}
                                contentStyle={{ fontSize: 12, borderRadius: 10 }}
                            />
                            <Bar dataKey="published" fill={C.green} radius={[4, 4, 0, 0]} barSize={18} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </SectionCard>
    );
}
