import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/shared/components/FormField";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { resendVerifyEmail, verifyEmail } from "@/services/authService";
import type { ResendVerifyEmailRequest, VerifyEmailRequest } from "@/types/user";

const verifyEmailSchema = Yup.object({
    email: Yup.string().trim().required("Vui lòng nhập email").email("Email không hợp lệ"),
    otp: Yup.string().required("Vui lòng nhập mã OTP").matches(/^\d{6}$/, "OTP phải là 6 chữ số"),
});

export default function VerifyEmailPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const emailFromState = (location.state as { email?: string })?.email ?? "";

    const verifyMutation = useMutation({
        mutationFn: (values: VerifyEmailRequest) => verifyEmail(values),
        onSuccess: () => {
            toast.success("Xác nhận email thành công. Vui lòng đăng nhập.");
            navigate("/login", { replace: true });
        },
        onError: (error: unknown) => {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message =
                axiosError.response?.data?.message ||
                (error instanceof Error ? error.message : undefined) ||
                "Xác nhận email thất bại. Vui lòng thử lại.";
            toast.error(message);
        },
    });

    const resendMutation = useMutation({
        mutationFn: (request: ResendVerifyEmailRequest) => resendVerifyEmail(request),
        onSuccess: () => {
            toast.success("Mã xác nhận mới đã được gửi. Vui lòng kiểm tra email.");
        },
        onError: (error: unknown) => {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message =
                axiosError.response?.data?.message ||
                (error instanceof Error ? error.message : undefined) ||
                "Gửi lại mã thất bại. Vui lòng thử lại.";
            toast.error(message);
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
        <AuthLayout title="Xác nhận email" subtitle="Nhập mã OTP đã được gửi đến email của bạn">
            <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="flex flex-col items-center gap-2 text-center lg:hidden">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-vegan-green-light">
                        <MailCheck className="h-6 w-6 text-vegan-green" />
                    </div>
                </div>

                <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
                    <FormField
                        label="Email"
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
                            aria-invalid={formik.touched.email && !!formik.errors.email}
                        />
                    </FormField>

                    <FormField
                        label="Mã OTP"
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
                        {verifyMutation.isPending ? "Đang xác nhận..." : "Xác nhận email"}
                    </Button>
                </form>

                <div className="flex flex-col items-center gap-2 text-center text-sm">
                    <button
                        type="button"
                        onClick={() => resendMutation.mutate({ email: formik.values.email })}
                        disabled={resendMutation.isPending || !formik.values.email}
                        className="font-semibold text-vegan-green hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {resendMutation.isPending ? "Đang gửi lại..." : "Gửi lại mã xác nhận"}
                    </button>
                    <Link to="/login" className="font-semibold text-vegan-green hover:underline">
                        Quay lại đăng nhập
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
