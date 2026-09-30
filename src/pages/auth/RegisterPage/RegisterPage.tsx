import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/shared/components/FormField";
import { register } from "@/services/authService";
import type { RegisterRequest } from "@/types/user";

const registerSchema = Yup.object({
    username: Yup.string()
        .trim()
        .required("Vui lòng nhập username")
        .min(3, "Username phải có ít nhất 3 ký tự")
        .max(50, "Username tối đa 50 ký tự")
        .matches(/^[a-zA-Z0-9_.]+$/, "Username chỉ chứa chữ, số, dấu chấm và gạch dưới"),
    email: Yup.string().trim().required("Vui lòng nhập email").email("Email không hợp lệ").max(100, "Email tối đa 100 ký tự"),
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

    const registerMutation = useMutation({
        mutationFn: (values: RegisterRequest) => register(values),
        onSuccess: () => {
            toast.success("Đăng ký thành công. Vui lòng đăng nhập.");
            navigate("/login", { replace: true });
        },
        onError: () => {
            toast.error("Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
        },
    });

    const formik = useFormik<RegisterRequest>({
        initialValues: { username: "", email: "", password: "", confirmPassword: "" },
        validationSchema: registerSchema,
        onSubmit: (values) => registerMutation.mutate(values),
    });

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-lg space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-vegan-green-light">
                        <Leaf className="h-6 w-6 text-vegan-green" />
                    </div>
                    <h1 className="text-2xl font-semibold text-dark">Tạo tài khoản VEGALIFE</h1>
                    <p className="text-sm text-muted-foreground">Điền thông tin bên dưới để bắt đầu</p>
                </div>

                <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
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
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            aria-invalid={formik.touched.password && !!formik.errors.password}
                        />
                    </FormField>

                    <FormField
                        label="Xác nhận mật khẩu"
                        htmlFor="confirmPassword"
                        required
                        error={formik.touched.confirmPassword ? formik.errors.confirmPassword : undefined}
                    >
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={formik.values.confirmPassword}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            aria-invalid={formik.touched.confirmPassword && !!formik.errors.confirmPassword}
                        />
                    </FormField>

                    <Button type="submit" className="w-full" disabled={registerMutation.isPending || formik.isSubmitting}>
                        {registerMutation.isPending ? "Đang đăng ký..." : "Đăng ký"}
                    </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    Đã có tài khoản?{" "}
                    <Link to="/login" className="font-medium text-vegan-green hover:underline">
                        Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
}
