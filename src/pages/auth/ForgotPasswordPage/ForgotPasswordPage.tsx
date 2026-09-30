import { useState } from "react";
import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/shared/components/FormField";
import { forgotPassword, resetPassword, verifyPasswordReset } from "@/services/authService";

type Step = "email" | "otp" | "newPassword";

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");

    const forgotMutation = useMutation({
        mutationFn: (value: string) => forgotPassword({ email: value }),
        onSuccess: () => {
            toast.success("Mã xác nhận đã được gửi nếu email tồn tại.");
            setStep("otp");
        },
        onError: () => {
            toast.error("Không thể gửi yêu cầu. Vui lòng thử lại.");
        },
    });

    const verifyMutation = useMutation({
        mutationFn: (otp: string) => verifyPasswordReset({ email, otp }),
        onSuccess: () => {
            toast.success("Mã OTP hợp lệ. Vui lòng nhập mật khẩu mới.");
            setStep("newPassword");
        },
        onError: () => {
            toast.error("Mã OTP không hợp lệ hoặc đã hết hạn.");
        },
    });

    const resetMutation = useMutation({
        mutationFn: (newPassword: string) => resetPassword({ email, newPassword }),
        onSuccess: () => {
            toast.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập.");
            navigate("/login", { replace: true });
        },
        onError: () => {
            toast.error("Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
        },
    });

    const emailFormik = useFormik({
        initialValues: { email: "" },
        validationSchema: Yup.object({
            email: Yup.string().trim().required("Vui lòng nhập email").email("Email không hợp lệ"),
        }),
        onSubmit: (values) => {
            setEmail(values.email);
            forgotMutation.mutate(values.email);
        },
    });

    const otpFormik = useFormik({
        initialValues: { otp: "" },
        validationSchema: Yup.object({
            otp: Yup.string().required("Vui lòng nhập mã OTP").matches(/^\d{6}$/, "OTP phải là 6 chữ số"),
        }),
        onSubmit: (values) => verifyMutation.mutate(values.otp),
    });

    const passwordFormik = useFormik({
        initialValues: { newPassword: "" },
        validationSchema: Yup.object({
            newPassword: Yup.string()
                .required("Vui lòng nhập mật khẩu mới")
                .min(8, "Mật khẩu ít nhất 8 ký tự"),
        }),
        onSubmit: (values) => resetMutation.mutate(values.newPassword),
    });

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-vegan-green-light">
                        <Leaf className="h-6 w-6 text-vegan-green" />
                    </div>
                    <h1 className="text-2xl font-semibold text-dark">Khôi phục mật khẩu</h1>
                    <p className="text-sm text-muted-foreground">
                        {step === "email" && "Nhập email để nhận mã xác nhận"}
                        {step === "otp" && "Nhập mã OTP đã gửi đến email của bạn"}
                        {step === "newPassword" && "Nhập mật khẩu mới"}
                    </p>
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
                    <Link to="/login" className="font-medium text-vegan-green hover:underline">
                        Quay lại đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
}
