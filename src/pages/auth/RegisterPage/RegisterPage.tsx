import { useState } from "react";
import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/shared/components/FormField";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { register } from "@/services/authService";
import type { RegisterRequest } from "@/types/user";

const registerSchema = Yup.object({
    username: Yup.string()
        .trim()
        .required("Vui lòng nhập username")
        .min(3, "Username phải có ít nhất 3 ký tự")
        .max(50, "Username tối đa 50 ký tự")
        .matches(/^[a-zA-Z0-9_.]+$/, "Username chỉ chứa chữ, số, dấu chấm và gạch dưới"),
    email: Yup.string()
        .trim()
        .required("Vui lòng nhập email")
        .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email không hợp lệ (ví dụ: user@example.com)")
        .max(100, "Email tối đa 100 ký tự"),
    password: Yup.string()
        .required("Vui lòng nhập mật khẩu")
        .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
        .matches(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
        .matches(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
        .matches(/[0-9]/, "Mật khẩu phải có ít nhất 1 số")
        .matches(/[^A-Za-z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
    confirmPassword: Yup.string()
        .required("Vui lòng xác nhận mật khẩu")
        .oneOf([Yup.ref("password")], "Mật khẩu xác nhận không khớp"),
});

export default function RegisterPage() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const registerMutation = useMutation({
        mutationFn: (values: RegisterRequest) => register(values),
        onSuccess: (data) => {
            toast.success("Đăng ký thành công. Vui lòng xác nhận email.");
            navigate("/verify-email", { replace: true, state: { email: data.email } });
        },
        onError: (error: unknown) => {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message =
                axiosError.response?.data?.message ||
                (error instanceof Error ? error.message : undefined) ||
                "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
            toast.error(message);
        },
    });

    const formik = useFormik<RegisterRequest>({
        initialValues: { username: "", email: "", password: "", confirmPassword: "" },
        validationSchema: registerSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                await registerMutation.mutateAsync(values);
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <AuthLayout title="Tạo tài khoản VEGALIFE" subtitle="Tham gia cộng đồng yêu thích lối sống thực vật">
            <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
                <FormField
                    label="Username"
                    htmlFor="username"
                    required
                    error={formik.touched.username ? formik.errors.username : undefined}
                >
                    <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="username"
                        value={formik.values.username}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        aria-invalid={formik.touched.username && !!formik.errors.username}
                    />
                </FormField>

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
                    label="Mật khẩu"
                    htmlFor="password"
                    required
                    error={formik.touched.password ? formik.errors.password : undefined}
                >
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            aria-invalid={formik.touched.password && !!formik.errors.password}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-dark"
                            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </FormField>

                <FormField
                    label="Xác nhận mật khẩu"
                    htmlFor="confirmPassword"
                    required
                    error={formik.touched.confirmPassword ? formik.errors.confirmPassword : undefined}
                >
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={formik.values.confirmPassword}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            aria-invalid={formik.touched.confirmPassword && !!formik.errors.confirmPassword}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-dark"
                            aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </FormField>

                <Button type="submit" className="w-full" disabled={registerMutation.isPending || formik.isSubmitting}>
                    <UserPlus className="h-4 w-4" />
                    {registerMutation.isPending ? "Đang đăng ký..." : "Đăng ký"}
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link to="/login" className="font-medium text-vegan-green hover:underline">
                    Đăng nhập
                </Link>
            </p>
        </AuthLayout>
    );
}
