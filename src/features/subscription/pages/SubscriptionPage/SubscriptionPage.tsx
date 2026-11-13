import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Info, Receipt, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PillTabs } from "@/components/ui/pill-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { useAuth } from "@/features/auth/useAuth";
import { useSubscription } from "@/features/nutrition-ai/useSubscription";
import type { AiPlan } from "@/features/nutrition-ai/types";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { cn } from "@/shared/utils/cn";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { useAcquirePlan, usePayments, usePlans, useSubscriptionHistory } from "../../useBilling";

export default function SubscriptionPage({ embedded = false }: { embedded?: boolean }) {
    const { t, i18n } = useTranslation("subscription");
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [historyPage, setHistoryPage] = useState(1);
    const [paymentPage, setPaymentPage] = useState(1);
    const [tab, setTab] = useState<"history" | "payments">("history");

    const plans = usePlans();
    const subscription = useSubscription(isAuthenticated);
    const history = useSubscriptionHistory(historyPage - 1, isAuthenticated);
    const payments = usePayments(paymentPage - 1, isAuthenticated);
    const acquirePlan = useAcquirePlan();

    const money = (amount: number, currency: string) =>
        new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US", {
            style: "currency",
            currency,
        }).format(amount);

    const handleAcquire = (plan: AiPlan) => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        acquirePlan.mutate(plan.code, {
            onSuccess: (res) => {
                if (res.action === "CHECKOUT_CREATED" && res.paymentUrl) {
                    window.location.assign(res.paymentUrl);
                } else if (res.action === "CLAIMED") {
                    toast.success(t("toast.claimed"));
                }
            },
            onError: (error: unknown) => {
                const status = (error as { response?: { status?: number } })?.response?.status;
                if (status === 409) {
                    toast.info(t("toast.alreadyClaimed"));
                } else if (status === 503) {
                    toast.error(t("toast.gatewayUnavailable"));
                } else {
                    toast.error(getApiErrorMessage(error, t("toast.buyFailed")));
                }
            },
        });
    };

    // Đã đăng nhập mà vào `/subscription` (bản ngoài shell) → đưa vào rail tài khoản.
    if (!embedded && isAuthenticated) return <Navigate to="/account/subscription" replace />;

    return (
        <div className={embedded ? undefined : "mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8"}>
            <header className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="mb-2 flex flex-wrap gap-2">
                            <Badge variant="lightgreen" size="md">
                                {t("overline")}
                            </Badge>
                            <Badge variant="info" size="md">
                                {t("pill")}
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-dark">{t("title")}</h1>
                        <p className="mt-2 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
                    </div>
                    {isAuthenticated && subscription.data && (
                        <div className="rounded-xl bg-vegan-green-light px-4 py-3">
                            <p className="flex items-center gap-2 text-sm font-bold text-vegan-green">
                                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                {t("current.remainingBadge", { count: subscription.data.remainingUsage })}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {t("current.lifetimeNotice")}
                            </p>
                        </div>
                    )}
                </div>
            </header>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <section aria-label={t("plans.title")}>
                        {plans.isLoading && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Skeleton className="h-56" />
                                <Skeleton className="h-56" />
                            </div>
                        )}
                        {plans.isError && <ErrorState onRetry={() => plans.refetch()} />}
                        {plans.data && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {plans.data.map((plan) => {
                                    const isFree = plan.price.amount <= 0;
                                    const quota = plan.requestQuota ?? plan.monthlyRequestLimit ?? 0;
                                    return (
                                        <div
                                            key={plan.code}
                                            className={cn(
                                                "flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition",
                                                isFree ? "border-border" : "border-vegan-green/40 shadow-sm",
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-lg font-bold text-dark">{plan.name}</h2>
                                                <Badge variant={isFree ? "lightgreen" : "info"}>
                                                    {isFree ? t("plans.claimHint") : t("plans.stackHint")}
                                                </Badge>
                                            </div>
                                            <p className="mt-3 text-3xl font-bold text-dark">
                                                {isFree
                                                    ? t("plans.free")
                                                    : money(plan.price.amount, plan.price.currency)}
                                                {!isFree && (
                                                    <span className="text-sm font-normal text-muted-foreground">
                                                        {t("plans.perQuota")}
                                                    </span>
                                                )}
                                            </p>
                                            {plan.description && (
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    {plan.description}
                                                </p>
                                            )}
                                            <p className="mt-4 flex items-center gap-2 text-sm text-dark">
                                                <Check className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                                                {t("plans.requests", { count: quota })}
                                            </p>
                                            <div className="mt-6 flex-1" />
                                            <Button
                                                variant={isFree ? "outline" : "primary"}
                                                disabled={acquirePlan.isPending}
                                                onClick={() => handleAcquire(plan)}
                                            >
                                                <Sparkles className="h-4 w-4" aria-hidden="true" />
                                                {acquirePlan.isPending
                                                    ? t("plans.buying")
                                                    : isFree
                                                      ? t("plans.claim")
                                                      : t("plans.buy")}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {isAuthenticated && (
                        <section className="rounded-2xl border border-border bg-card p-5">
                            <PillTabs
                                items={[
                                    {
                                        key: "history",
                                        label: t("history.title"),
                                        count: history.data?.totalElements,
                                    },
                                    {
                                        key: "payments",
                                        label: t("payments.title"),
                                        count: payments.data?.totalElements,
                                    },
                                ]}
                                value={tab}
                                onChange={setTab}
                            />

                            {tab === "history" && (
                                <div className="mt-4">
                                    {history.isError && <ErrorState onRetry={() => history.refetch()} />}
                                    {history.data && history.data.content.length === 0 && (
                                        <EmptyState
                                            icon={Receipt}
                                            title={t("history.emptyTitle")}
                                            description={t("history.emptyDescription")}
                                        />
                                    )}
                                    {history.data && history.data.content.length > 0 && (
                                        <>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>{t("history.plan")}</TableHead>
                                                        <TableHead>{t("history.source")}</TableHead>
                                                        <TableHead>{t("history.grantedAt")}</TableHead>
                                                        <TableHead>{t("history.amount")}</TableHead>
                                                        <TableHead>{t("history.status")}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {history.data.content.map((row) => (
                                                        <TableRow key={row.createdAt + (row.paymentId ?? "")}>
                                                            <TableCell className="font-medium">{row.planName}</TableCell>
                                                            <TableCell>
                                                                <Badge variant={row.source === "PURCHASE" ? "info" : "lightgreen"}>
                                                                    {row.source === "PURCHASE"
                                                                        ? t("history.sourcePurchase")
                                                                        : t("history.sourceClaim")}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {row.grantedAt ? formatDateLocale(row.grantedAt) : "—"}
                                                            </TableCell>
                                                            <TableCell>
                                                                {row.amount
                                                                    ? money(row.amount, row.currency ?? "VND")
                                                                    : t("plans.free")}
                                                            </TableCell>
                                                            <TableCell>
                                                                {row.status ? (
                                                                    <Badge
                                                                        variant={
                                                                            row.status === "succeeded"
                                                                                ? "default"
                                                                                : row.status === "pending"
                                                                                  ? "amber"
                                                                                  : "destructive"
                                                                        }
                                                                    >
                                                                        {t(`paymentStatus.${row.status}`, {
                                                                            defaultValue: row.status,
                                                                        })}
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">—</span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            <Pagination
                                                page={historyPage}
                                                totalPages={history.data.totalPages}
                                                onChange={setHistoryPage}
                                            />
                                        </>
                                    )}
                                </div>
                            )}

                            {tab === "payments" && (
                                <div className="mt-4">
                                    {payments.isError && <ErrorState onRetry={() => payments.refetch()} />}
                                    {payments.data && payments.data.content.length === 0 && (
                                        <EmptyState
                                            icon={Receipt}
                                            title={t("payments.emptyTitle")}
                                            description={t("payments.emptyDescription")}
                                        />
                                    )}
                                    {payments.data && payments.data.content.length > 0 && (
                                        <>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>{t("payments.plan")}</TableHead>
                                                        <TableHead>{t("payments.amount")}</TableHead>
                                                        <TableHead>{t("payments.status")}</TableHead>
                                                        <TableHead>{t("payments.date")}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {payments.data.content.map((row) => {
                                                        const planName =
                                                            history.data?.content.find(
                                                                (h) => h.paymentId === row.id,
                                                            )?.planName ?? t("payments.defaultPlanName");
                                                        return (
                                                            <TableRow key={row.id}>
                                                                <TableCell className="font-medium">{planName}</TableCell>
                                                                <TableCell>{money(row.amount, row.currency)}</TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant={
                                                                            row.status === "succeeded"
                                                                                ? "default"
                                                                                : row.status === "pending"
                                                                                  ? "amber"
                                                                                  : "destructive"
                                                                        }
                                                                    >
                                                                        {t(`paymentStatus.${row.status}`, {
                                                                            defaultValue: row.status,
                                                                        })}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {formatDateLocale(row.paidAt ?? row.createdAt)}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                            <Pagination
                                                page={paymentPage}
                                                totalPages={payments.data.totalPages}
                                                onChange={setPaymentPage}
                                            />
                                        </>
                                    )}
                                </div>
                            )}
                        </section>
                    )}
                </div>

                <aside className="space-y-5">
                    <section className="rounded-2xl border border-border bg-card p-5">
                        <h2 className="flex items-center gap-2 font-bold text-dark">
                            <ShieldCheck className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                            {t("current.eyebrow")}
                        </h2>
                        {isAuthenticated && subscription.data ? (
                            <dl className="mt-3 space-y-2.5 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">{t("current.quota")}</dt>
                                    <dd className="font-bold text-vegan-green">
                                        {t("current.remaining", { count: subscription.data.remainingUsage })}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">{t("pill")}</dt>
                                    <dd className="font-medium text-dark">{t("current.lifetimeNotice")}</dd>
                                </div>
                            </dl>
                        ) : (
                            <p className="mt-3 text-sm text-muted-foreground">{t("current.loginRequired")}</p>
                        )}
                        <div className="mt-4 flex items-start gap-2 rounded-xl bg-accent p-3 text-xs text-muted-foreground">
                            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-vegan-green" aria-hidden="true" />
                            <p>{t("notice")}</p>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}
