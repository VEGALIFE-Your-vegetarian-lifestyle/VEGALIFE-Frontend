import { useMemo } from "react";
import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/common/FormField";
import { AuthLayout } from "../../AuthLayout";
import { resendVerifyEmail, verifyEmail } from "../../api";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import type { ResendVerifyEmailRequest, VerifyEmailRequest } from "@/shared/types/user";

export default function VerifyEmailPage() {
    const { t } = useTranslation("auth");
    const navigate = useNavigate();
    const location = useLocation();
    const emailFromState = (location.state as { email?: string })?.email ?? "";
    // Đến từ trang đăng ký thì email đã cố định — không cho sửa, tránh gửi OTP sang địa chỉ khác.
    const emailLocked = Boolean(emailFromState);

    const verifyEmailSchema = useMemo(
        () =>
            Yup.object({
                email: Yup.string().trim().required(t("errors.emailRequired")).email(t("errors.emailInvalid")),
                otp: Yup.string().required(t("errors.otpRequired")).matches(/^\d{6}$/, t("errors.otpFormat")),
            }),
        [t],
    );

    const verifyMutation = useMutation({
        mutationFn: (values: VerifyEmailRequest) => verifyEmail(values),
        onSuccess: () => {
            toast.success(t("verifyEmail.success"));
            navigate("/login", { replace: true });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("verifyEmail.failed")));
        },
    });

    const resendMutation = useMutation({
        mutationFn: (request: ResendVerifyEmailRequest) => resendVerifyEmail(request),
        onSuccess: () => {
            toast.success(t("verifyEmail.resent"));
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("verifyEmail.resendFailed")));
        },
    });

    const formik = useFormik<VerifyEmailRequest>({
        initialValues: { email: emailFromState, otp: "" },
        enableReinitialize: true,
        validationSchema: verifyEmailSchema,
        onSubmit: async (values, { setSubmitting }) => {
            await verifyMutation.mutateAsync(values);
            setSubmitting(false);
        },
    });

    return (
        <AuthLayout title={t("verifyEmail.title")} subtitle={t("verifyEmail.subtitle")}>
            <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="flex flex-col items-center gap-2 text-center lg:hidden">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-vegan-green-light">
                        <MailCheck className="h-6 w-6 text-vegan-green" />
                    </div>
                </div>

                <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
                    <FormField
                        label={t("verifyEmail.emailLabel")}
                        htmlFor="email"
                        required
                        error={formik.touched.email ? formik.errors.email : undefined}
                    >
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            readOnly={emailLocked}
                            aria-invalid={formik.touched.email && !!formik.errors.email}
                            className={emailLocked ? "cursor-not-allowed bg-muted text-muted-foreground" : undefined}
                        />
                    </FormField>

                    <FormField
                        label={t("verifyEmail.otpLabel")}
                        htmlFor="otp"
                        required
                        error={formik.touched.otp ? formik.errors.otp : undefined}
                    >
                        <Input
                            id="otp"
                            name="otp"
                            type="text"
                            placeholder="123456"
                            value={formik.values.otp}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            aria-invalid={formik.touched.otp && !!formik.errors.otp}
                        />
                    </FormField>

                    <Button type="submit" className="w-full" disabled={verifyMutation.isPending || formik.isSubmitting}>
                        {t(verifyMutation.isPending ? "verifyEmail.submitting" : "verifyEmail.submit")}
                    </Button>
                </form>

                <div className="flex flex-col items-center gap-2 text-center text-sm">
                    <button
                        type="button"
                        onClick={() => resendMutation.mutate({ email: formik.values.email })}
                        disabled={resendMutation.isPending || !formik.values.email}
                        className="font-semibold text-vegan-green hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {t(resendMutation.isPending ? "verifyEmail.resending" : "verifyEmail.resend")}
                    </button>
                    <Link to="/login" className="font-semibold text-vegan-green hover:underline">
                        {t("verifyEmail.backToLogin")}
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
