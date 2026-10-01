import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/shared/components/FormField";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { forgotPassword, resetPassword, verifyPasswordReset } from "@/services/authService";

type Step = "email" | "otp" | "newPassword";

const RESEND_DELAY_SECONDS = 30;

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [resendCountdown, setResendCountdown] = useState(0);

    const forgotMutation = useMutation({
        mutationFn: (value: string) => forgotPassword({ email: value }),
        onSuccess: () => {
            toast.success("Mã xác nhận đã được gửi nếu email tồn tại.");
            setResendCountdown(RESEND_DELAY_SECONDS);
            setStep("otp");
        },
        onError: (error: unknown) => {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message =
                axiosError.response?.data?.message ||
                (error instanceof Error ? error.message : undefined) ||
                "Không thể gửi yêu cầu. Vui lòng thử lại.";
            toast.error(message);
        },
    });

    const verifyMutation = useMutation({
        mutationFn: (otp: string) => verifyPasswordReset({ email, otp }),
        onSuccess: () => {
            toast.success("Mã OTP hợp lệ. Vui lòng nhập mật khẩu mới.");
            setStep("newPassword");
        },
        onError: (error: unknown) => {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message =
                axiosError.response?.data?.message ||
                (error instanceof Error ? error.message : undefined) ||
                "Mã OTP không hợp lệ hoặc đã hết hạn.";
            toast.error(message);
        },
    });

    const resetMutation = useMutation({
        mutationFn: (newPassword: string) => resetPassword({ email, newPassword }),
        onSuccess: () => {
            toast.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập.");
            navigate("/login", { replace: true });
        },
        onError: (error: unknown) => {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message =
                axiosError.response?.data?.message ||
                (error instanceof Error ? error.message : undefined) ||
                "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
            toast.error(message);
        },
    });

    const emailFormik = useFormik({
        initialValues: { email: "" },
        validationSchema: Yup.object({
            email: Yup.string()
                .trim()
                .required("Vui lòng nhập email")
                .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email không hợp lệ (ví dụ: user@example.com)"),
        }),
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
        validationSchema: Yup.object({
            otp: Yup.string().required("Vui lòng nhập mã OTP").matches(/^\d{6}$/, "OTP phải là 6 chữ số"),
        }),
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
        validationSchema: Yup.object({
            newPassword: Yup.string()
                .required("Vui lòng nhập mật khẩu mới")
                .min(8, "Mật khẩu ít nhất 8 ký tự"),
        }),
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

    const stepTitle = step === "email" ? "Khôi phục mật khẩu" : step === "otp" ? "Xác nhận OTP" : "Đặt mật khẩu mới";
    const stepSubtitle =
        step === "email"
            ? "Nhập email để nhận mã xác nhận"
            : step === "otp"
              ? "Nhập mã OTP đã gửi đến email của bạn"
              : "Nhập mật khẩu mới";

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
                            label="Email"
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
                            {forgotMutation.isPending ? "Đang gửi..." : "Gửi mã xác nhận"}
                        </Button>
                    </form>
                )}

                {step === "otp" && (
                    <form onSubmit={otpFormik.handleSubmit} noValidate className="space-y-4">
                        <FormField
                            label="Mã OTP"
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
                            {verifyMutation.isPending ? "Đang xác nhận..." : "Xác nhận OTP"}
                        </Button>
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendCountdown > 0 || forgotMutation.isPending}
                            className="w-full text-sm text-vegan-green hover:underline disabled:text-muted-foreground disabled:no-underline"
                        >
                            {forgotMutation.isPending
                                ? "Đang gửi lại..."
                                : resendCountdown > 0
                                  ? `Gửi lại mã sau ${resendCountdown}s`
                                  : "Gửi lại mã OTP"}
                        </button>
                    </form>
                )}

                {step === "newPassword" && (
                    <form onSubmit={passwordFormik.handleSubmit} noValidate className="space-y-4">
                        <FormField
                            label="Mật khẩu mới"
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
                            {resetMutation.isPending ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
                        </Button>
                    </form>
                )}

                <div className="text-center text-sm">
                    <Link to="/login" className="font-semibold text-vegan-green hover:underline">
                        Quay lại đăng nhập
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
