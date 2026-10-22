import { useTranslation } from "react-i18next";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateLocale } from "@/utils/formatDate";
import type { AiSubscription } from "@/types/ai";

interface QuotaCardProps {
    subscription: AiSubscription | undefined;
    isLoading: boolean;
    isError: boolean;
}

/** Hạn mức AI (#52) — `usage` là tháng UTC hiện tại. */
export function QuotaCard({ subscription, isLoading, isError }: QuotaCardProps) {
    const { t } = useTranslation("aiNutrition");

    if (isLoading) {
        return (
            <section className="rounded-2xl border border-border bg-card p-5" aria-busy="true">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-3 h-2 w-full rounded-full" />
                <Skeleton className="mt-3 h-4 w-24" />
            </section>
        );
    }

    // ponytail: lỗi tải hạn mức không chặn chat — chat vẫn gửi được, chỉ thiếu
    // số liệu. Hiện dòng trạng thái thay vì ErrorState chiếm chỗ.
    if (isError || !subscription) {
        return (
            <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="flex items-center gap-2 font-bold text-dark">
                    <ShieldCheck className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                    {t("access.title")}
                </h2>
                <p className="mt-3 text-xs text-muted-foreground">{t("access.usageUnavailable")}</p>
            </section>
        );
    }

    const { tier, status, renewalDate, usage, currentPlan } = subscription;
    const percent = usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
    const exhausted = usage.limit > 0 && usage.used >= usage.limit;

    return (
        <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-bold text-dark">
                    <ShieldCheck className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                    {t("access.title")}
                </h2>
                <Badge variant={tier === "PRO" ? "lightgreen" : "outline"} size="sm">
                    {currentPlan.name}
                </Badge>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">{t("access.tier")}</dt>
                    <dd className="font-semibold text-dark">{t(`access.tierValue.${tier}`)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">{t("access.status")}</dt>
                    <dd className="font-semibold text-vegan-green">{status}</dd>
                </div>
                {renewalDate && (
                    <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">{t("access.renewalDate")}</dt>
                        <dd className="font-semibold text-dark">{formatDateLocale(renewalDate)}</dd>
                    </div>
                )}
            </dl>

            <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t("access.usage")}</span>
                    <span className="font-semibold text-dark">
                        {t("access.usageValue", { used: usage.used, limit: usage.limit })}
                    </span>
                </div>
                <Progress value={percent} className="mt-2" />
                <p className="mt-2 text-[11px] text-muted-foreground">
                    {t("access.period", {
                        from: formatDateLocale(usage.periodStart),
                        to: formatDateLocale(usage.periodEnd),
                    })}
                </p>
            </div>

            {exhausted && (
                <p className="mt-4 flex gap-2 rounded-xl bg-cream p-3 text-[11px] leading-relaxed text-dark">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-danger" aria-hidden="true" />
                    {t("access.exhausted")}
                </p>
            )}
        </section>
    );
}
