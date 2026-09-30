import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/shared/components/FormField";
import { useAuth } from "@/hooks/useAuth";
import { login } from "@/services/authService";
import type { LoginRequest } from "@/types/user";

const loginSchema = Yup.object({
    identifier: Yup.string().trim().required("Vui lòng nhập email hoặc username"),
    password: Yup.string().required("Vui lòng nhập mật khẩu"),
});

export default function LoginPage() {
    const navigate = useNavigate();
    const { setAuth } = useAuth();

    const loginMutation = useMutation({
        mutationFn: (values: LoginRequest) => login(values),
        onSuccess: (data) => {
            setAuth({
                user: {
                    id: data.userId,
                    username: data.username,
                    email: data.email,
                    role: data.role,
                    status: data.status,
                },
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
            });
            toast.success("Đăng nhập thành công");
            navigate(data.role === "ADMIN" ? "/admin/posts" : "/profile", { replace: true });
        },
        onError: () => {
            toast.error("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
        },
    });

    const formik = useFormik<LoginRequest>({
        initialValues: { identifier: "", password: "" },
        validationSchema: loginSchema,
        onSubmit: (values) => loginMutation.mutate(values),
    });

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-vegan-green-light">
                        <Leaf className="h-6 w-6 text-vegan-green" />
                    </div>
                    <h1 className="text-2xl font-semibold text-dark">Đăng nhập VEGALIFE</h1>
                    <p className="text-sm text-muted-foreground">Nhập thông tin tài khoản để tiếp tục</p>
                </div>

                <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
                    <FormField
                        label="Email hoặc username"
                        htmlFor="identifier"
                        required
                        error={formik.touched.identifier ? formik.errors.identifier : undefined}
                    >
                        <Input
                            id="identifier"
                            name="identifier"
                            type="text"
                            placeholder="you@example.com"
                            value={formik.values.identifier}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            aria-invalid={formik.touched.identifier && !!formik.errors.identifier}
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

                    <Button type="submit" className="w-full" disabled={loginMutation.isPending || formik.isSubmitting}>
                        {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
                    </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    Chưa có tài khoản?{" "}
                    <Link to="/register" className="font-medium text-vegan-green hover:underline">
                        Đăng ký
                    </Link>
                </div>
                <div className="text-center text-sm">
                    <Link to="/forgot-password" className="font-medium text-vegan-green hover:underline">
                        Quên mật khẩu?
                    </Link>
                </div>
            </div>
        </div>
    );
}
