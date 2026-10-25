import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/common/ErrorState";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { usePayment } from "../../useBilling";

/** VNPay redirect về `/payment/result/{paymentId}` — trang này chỉ hiển thị, IPN mới kích hoạt gói. */
export default function PaymentResultPage() {
    const { t, i18n } = useTranslation("subscription");
    const { paymentId = "" } = useParams();
    const payment = usePayment(paymentId);

    if (payment.isLoading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-vegan-green" aria-label={t("result.loading")} />
            </div>
        );
    }

    if (payment.isError || !payment.data) {
        return (
            <div className="mx-auto max-w-md px-4 py-16">
                <ErrorState onRetry={() => payment.refetch()} />
            </div>
        );
    }

    const { status, plan, amount, currency, paidAt } = payment.data;
    const Icon = status === "succeeded" ? CheckCircle2 : status === "pending" ? Loader2 : XCircle;
    const color = status === "succeeded" ? "text-vegan-green" : status === "pending" ? "text-amber-strong" : "text-terracotta";

    return (
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
            <Icon className={`mb-4 h-16 w-16 ${color} ${status === "pending" ? "animate-spin" : ""}`} aria-hidden="true" />
            <h1 className="text-2xl font-bold text-dark">{t(`result.${status}.title`)}</h1>
            <p className="mt-2 text-muted-foreground">{t(`result.${status}.description`)}</p>

            <dl className="mt-6 w-full space-y-2 rounded-2xl border border-border bg-card p-5 text-left text-sm">
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("payments.plan")}</dt>
                    <dd className="font-semibold text-dark">{plan.name}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("payments.amount")}</dt>
                    <dd className="font-semibold text-dark">
                        {new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US", { style: "currency", currency }).format(amount)}
                    </dd>
                </div>
                {paidAt && (
                    <div className="flex justify-between">
                        <dt className="text-muted-foreground">{t("payments.date")}</dt>
                        <dd className="font-semibold text-dark">{formatDateLocale(paidAt)}</dd>
                    </div>
                )}
            </dl>

            <div className="mt-6 flex gap-2">
                <Link to="/subscription">
                    <Button variant="outline">{t("result.backToPlans")}</Button>
                </Link>
                <Link to="/ai-nutrition">
                    <Button>{t("result.toAi")}</Button>
                </Link>
            </div>
        </div>
    );
}
