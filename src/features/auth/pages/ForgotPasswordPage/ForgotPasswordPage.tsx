import { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/common/FormField";
import { AuthLayout } from "../../AuthLayout";
import { forgotPassword, resetPassword, verifyPasswordReset } from "../../api";
import { getApiErrorMessage } from "@/shared/utils/apiError";

type Step = "email" | "otp" | "newPassword";

const RESEND_DELAY_SECONDS = 30;
const MIN_PASSWORD = 8;

export default function ForgotPasswordPage() {
    const { t } = useTranslation("auth");
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [resendCountdown, setResendCountdown] = useState(0);

    const forgotMutation = useMutation({
        mutationFn: (value: string) => forgotPassword({ email: value }),
        onSuccess: () => {
            toast.success(t("forgotPassword.sent"));
            setResendCountdown(RESEND_DELAY_SECONDS);
            setStep("otp");
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("forgotPassword.sentFailed")));
        },
    });

    const verifyMutation = useMutation({
        mutationFn: (otp: string) => verifyPasswordReset({ email, otp }),
        onSuccess: () => {
            toast.success(t("forgotPassword.otpValid"));
            setStep("newPassword");
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("forgotPassword.otpInvalid")));
        },
    });

    const resetMutation = useMutation({
        mutationFn: (newPassword: string) => resetPassword({ email, newPassword }),
        onSuccess: () => {
            toast.success(t("forgotPassword.resetSuccess"));
            navigate("/login", { replace: true });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("forgotPassword.resetFailed")));
        },
    });

    const emailSchema = useMemo(
        () =>
            Yup.object({
                email: Yup.string()
                    .trim()
                    .required(t("errors.emailRequired"))
                    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, t("errors.emailInvalid")),
            }),
        [t],
    );

    const otpSchema = useMemo(
        () =>
            Yup.object({
                otp: Yup.string().required(t("errors.otpRequired")).matches(/^\d{6}$/, t("errors.otpFormat")),
            }),
        [t],
    );

    const passwordSchema = useMemo(
        () =>
            Yup.object({
                newPassword: Yup.string()
                    .required(t("errors.newPasswordRequired"))
                    .min(MIN_PASSWORD, t("errors.passwordMin")),
            }),
        [t],
    );

    const emailFormik = useFormik({
        initialValues: { email: "" },
        validationSchema: emailSchema,
        onSubmit: async (values, { setSubmitting }) => {
            setEmail(values.email);
            try {
                await forgotMutation.mutateAsync(values.email);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const otpFormik = useFormik({
        initialValues: { otp: "" },
        validationSchema: otpSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                await verifyMutation.mutateAsync(values.otp);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const passwordFormik = useFormik({
        initialValues: { newPassword: "" },
        validationSchema: passwordSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                await resetMutation.mutateAsync(values.newPassword);
            } finally {
                setSubmitting(false);
            }
        },
    });

    useEffect(() => {
        if (resendCountdown <= 0) return;
        const timer = setInterval(() => {
            setResendCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCountdown]);

    const handleResendOtp = () => {
        if (!email || resendCountdown > 0) return;
        forgotMutation.mutate(email);
    };

    const stepTitle = t(
        step === "email" ? "forgotPassword.emailTitle" : step === "otp" ? "forgotPassword.otpTitle" : "forgotPassword.newPasswordTitle",
    );
    const stepSubtitle = t(
        step === "email"
            ? "forgotPassword.emailSubtitle"
            : step === "otp"
              ? "forgotPassword.otpSubtitle"
              : "forgotPassword.newPasswordSubtitle",
    );

    return (
        <AuthLayout title={stepTitle} subtitle={stepSubtitle}>
            <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-vegan-green-light">
                        <Leaf className="h-6 w-6 text-vegan-green" />
                    </div>
                    <h1 className="text-2xl font-bold text-dark">{stepTitle}</h1>
                    <p className="text-sm text-muted-foreground">{stepSubtitle}</p>
                </div>

                {step === "email" && (
                    <form onSubmit={emailFormik.handleSubmit} noValidate className="space-y-4">
                        <FormField
                            label={t("forgotPassword.emailLabel")}
                            htmlFor="email"
                            required
                            error={emailFormik.touched.email ? emailFormik.errors.email : undefined}
                        >
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={emailFormik.values.email}
                                onChange={emailFormik.handleChange}
                                onBlur={emailFormik.handleBlur}
                                aria-invalid={emailFormik.touched.email && !!emailFormik.errors.email}
                            />
                        </FormField>
                        <Button type="submit" className="w-full" disabled={forgotMutation.isPending || emailFormik.isSubmitting}>
                            {t(forgotMutation.isPending ? "forgotPassword.sending" : "forgotPassword.sendCode")}
                        </Button>
                    </form>
                )}

                {step === "otp" && (
                    <form onSubmit={otpFormik.handleSubmit} noValidate className="space-y-4">
                        <FormField
                            label={t("forgotPassword.otpLabel")}
                            htmlFor="otp"
                            required
                            error={otpFormik.touched.otp ? otpFormik.errors.otp : undefined}
                        >
                            <Input
                                id="otp"
                                name="otp"
                                type="text"
                                placeholder="123456"
                                value={otpFormik.values.otp}
                                onChange={otpFormik.handleChange}
                                onBlur={otpFormik.handleBlur}
                                aria-invalid={otpFormik.touched.otp && !!otpFormik.errors.otp}
                            />
                        </FormField>
                        <Button type="submit" className="w-full" disabled={verifyMutation.isPending || otpFormik.isSubmitting}>
                            {t(verifyMutation.isPending ? "forgotPassword.confirming" : "forgotPassword.confirmOtp")}
                        </Button>
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendCountdown > 0 || forgotMutation.isPending}
                            className="w-full text-sm text-vegan-green hover:underline disabled:text-muted-foreground disabled:no-underline"
                        >
                            {forgotMutation.isPending
                                ? t("forgotPassword.sending")
                                : resendCountdown > 0
                                  ? t("forgotPassword.resendIn", { seconds: resendCountdown })
                                  : t("forgotPassword.resend")}
                        </button>
                    </form>
                )}

                {step === "newPassword" && (
                    <form onSubmit={passwordFormik.handleSubmit} noValidate className="space-y-4">
                        <FormField
                            label={t("forgotPassword.newPasswordLabel")}
                            htmlFor="newPassword"
                            required
                            error={passwordFormik.touched.newPassword ? passwordFormik.errors.newPassword : undefined}
                        >
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                placeholder="••••••••"
                                value={passwordFormik.values.newPassword}
                                onChange={passwordFormik.handleChange}
                                onBlur={passwordFormik.handleBlur}
                                aria-invalid={passwordFormik.touched.newPassword && !!passwordFormik.errors.newPassword}
                            />
                        </FormField>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={resetMutation.isPending || passwordFormik.isSubmitting}
                        >
                            {t(resetMutation.isPending ? "forgotPassword.resetting" : "forgotPassword.reset")}
                        </Button>
                    </form>
                )}

                <div className="text-center text-sm">
                    <Link to="/login" className="font-semibold text-vegan-green hover:underline">
                        {t("forgotPassword.backToLogin")}
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
