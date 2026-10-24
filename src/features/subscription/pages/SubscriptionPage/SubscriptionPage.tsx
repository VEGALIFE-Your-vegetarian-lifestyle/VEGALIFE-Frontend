import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Receipt, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PillTabs } from "@/components/ui/pill-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { useAuth } from "@/features/auth/useAuth";
import { useSubscription } from "@/features/nutrition-ai/useSubscription";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { cn } from "@/shared/utils/cn";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { useBuyPlan, useCancelSubscription, usePayments, usePlans, useSubscriptionHistory } from "../../useBilling";

export default function SubscriptionPage() {
    const { t, i18n } = useTranslation("subscription");
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [historyPage, setHistoryPage] = useState(1);
    const [paymentPage, setPaymentPage] = useState(1);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [tab, setTab] = useState<"history" | "payments">("history");

    const plans = usePlans();
    const subscription = useSubscription(isAuthenticated);
    const history = useSubscriptionHistory(historyPage - 1, isAuthenticated);
    const payments = usePayments(paymentPage - 1, isAuthenticated);
    const buyPlan = useBuyPlan();
    const cancel = useCancelSubscription();

    const currentCode = subscription.data?.currentPlan.code;
    const money = (amount: number, currency: string) =>
        new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US", {
            style: "currency",
            currency,
        }).format(amount);

    const handleBuy = (planCode: string) => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
        buyPlan.mutate(planCode, {
            // IPN mới là nguồn sự thật; trang kết quả chỉ để hiển thị.
            onSuccess: (checkout) => window.location.assign(checkout.paymentUrl),
            onError: (error) => toast.error(getApiErrorMessage(error, t("toast.buyFailed"))),
        });
    };

    const handleCancel = () => {
        cancel.mutate(undefined, {
            onSuccess: () => {
                toast.success(t("toast.cancelled"));
                setConfirmCancel(false);
            },
            onError: (error) => {
                toast.error(getApiErrorMessage(error, t("toast.cancelFailed")));
                setConfirmCancel(false);
            },
        });
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
                        <h1 className="text-3xl font-bold tracking-tight text-dark">{t("title")}</h1>
                        <p className="mt-2 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
                    </div>
                    {isAuthenticated && subscription.data && (
                        <div className="rounded-xl bg-vegan-green-light px-4 py-3">
                            <p className="flex items-center gap-2 text-sm font-bold text-vegan-green">
                                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                {subscription.data.currentPlan.name}
                                <Badge variant={subscription.data.status === "active" ? "default" : "amber"} size="sm">
                                    {t(`status.${subscription.data.status}`)}
                                </Badge>
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {t("current.usage", {
                                    used: subscription.data.usage.used,
                                    limit: subscription.data.usage.limit,
                                })}
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
                                    const isCurrent = plan.code === currentCode;
                                    return (
                                        <div
                                            key={plan.code}
                                            className={cn(
                                                "flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
                                                isCurrent
                                                    ? "border-vegan-green ring-1 ring-vegan-green"
                                                    : "border-border",
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-lg font-bold text-dark">{plan.name}</h2>
                                                {isCurrent && <Badge variant="lightgreen">{t("plans.current")}</Badge>}
                                            </div>
                                            <p className="mt-3 text-3xl font-bold text-dark">
                                                {isFree
                                                    ? t("plans.free")
                                                    : money(plan.price.amount, plan.price.currency)}
                                                {!isFree && (
                                                    <span className="text-sm font-normal text-muted-foreground">
                                                        {t("plans.perMonth")}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="mt-4 flex items-center gap-2 text-sm text-dark">
                                                <Check className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                                                {t("plans.requests", {
                                                    count: plan.monthlyRequestLimit,
                                                })}
                                            </p>
                                            <div className="mt-6 flex-1" />
                                            {!isFree && (
                                                <Button
                                                    disabled={buyPlan.isPending}
                                                    onClick={() => handleBuy(plan.code)}
                                                >
                                                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                                                    {isCurrent ? t("plans.renew") : t("plans.buy")}
                                                </Button>
                                            )}
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
                                                        <TableHead>{t("history.status")}</TableHead>
                                                        <TableHead>{t("history.startedAt")}</TableHead>
                                                        <TableHead>{t("history.renewalDate")}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {history.data.content.map((row) => (
                                                        <TableRow key={row.createdAt}>
                                                            <TableCell>{row.planName}</TableCell>
                                                            <TableCell>{t(`rowStatus.${row.status}`)}</TableCell>
                                                            <TableCell>
                                                                {row.startedAt ? formatDateLocale(row.startedAt) : "—"}
                                                            </TableCell>
                                                            <TableCell>
                                                                {row.renewalDate
                                                                    ? formatDateLocale(row.renewalDate)
                                                                    : "—"}
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
                                                    {payments.data.content.map((row) => (
                                                        <TableRow key={row.id}>
                                                            <TableCell>{row.plan?.name ?? "—"}</TableCell>
                                                            <TableCell>{money(row.amount, row.currency)}</TableCell>
                                                            <TableCell>
                                                                {t(`paymentStatus.${row.status}`, {
                                                                    defaultValue: row.status,
                                                                })}
                                                            </TableCell>
                                                            <TableCell>
                                                                {formatDateLocale(row.paidAt ?? row.createdAt)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
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
                            <dl className="mt-3 space-y-2 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">{t("history.plan")}</dt>
                                    <dd className="font-semibold text-vegan-green">
                                        {subscription.data.currentPlan.name}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">{t("history.status")}</dt>
                                    <dd className="font-semibold text-dark">
                                        {t(`status.${subscription.data.status}`)}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-muted-foreground">{t("current.quota")}</dt>
                                    <dd className="font-semibold text-dark">
                                        {subscription.data.usage.used}/{subscription.data.usage.limit}
                                    </dd>
                                </div>
                                {subscription.data.renewalDate && (
                                    <div className="flex items-center justify-between gap-3">
                                        <dt className="text-muted-foreground">{t("history.renewalDate")}</dt>
                                        <dd className="font-semibold text-dark">
                                            {formatDateLocale(subscription.data.renewalDate)}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        ) : (
                            <p className="mt-3 text-sm text-muted-foreground">{t("current.loginRequired")}</p>
                        )}
                        {subscription.data && subscription.data.tier !== "FREE" && (
                            <Button variant="outline" size="sm" className="mt-4" onClick={() => setConfirmCancel(true)}>
                                {t("current.cancel")}
                            </Button>
                        )}
                        <p className="mt-4 rounded-xl bg-accent p-3 text-xs text-muted-foreground">{t("notice")}</p>
                    </section>
                </aside>
            </div>

            <ConfirmDialog
                open={confirmCancel}
                title={t("cancelDialog.title")}
                description={t("cancelDialog.description")}
                confirmLabel={t("cancelDialog.confirm")}
                destructive
                loading={cancel.isPending}
                onConfirm={handleCancel}
                onClose={() => setConfirmCancel(false)}
            />
        </div>
    );
}
