import { useRef } from "react";
import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/shared/components/FormField";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { login } from "@/services/authService";
import { decodeJwt } from "@/utils/jwt";
import { getRememberedIdentifier, setRememberedIdentifier } from "@/stores/authStore";
import type { LoginRequest, UserRole } from "@/types/user";

interface LoginFormValues extends LoginRequest {
    rememberMe: boolean;
}

export default function LoginPage() {
    const { t } = useTranslation("auth");
    const navigate = useNavigate();
    const { setAuth } = useAuth();
    const rememberMeRef = useRef(false);

    const loginSchema = Yup.object({
        identifier: Yup.string().trim().required(t("errors.identifierRequired")),
        password: Yup.string().required(t("errors.passwordRequired")),
    });

    const loginMutation = useMutation({
        mutationFn: (values: LoginRequest) => login(values),
        onSuccess: (data) => {
            const payload = decodeJwt(data.accessToken);
            const role: UserRole = payload?.role === "ADMIN" ? "ADMIN" : "USER";

            setAuth(
                {
                    user: {
                        id: data.userId,
                        username: data.username,
                        email: data.email,
                        role,
                        status: "activated",
                    },
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    expiresIn: data.expiresIn,
                },
                rememberMeRef.current,
            );
            toast.success(t("login.success"));
            navigate(role === "ADMIN" ? "/admin/dashboard" : "/", { replace: true });
        },
        onError: (error: unknown) => {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message =
                axiosError.response?.data?.message ||
                (error instanceof Error ? error.message : undefined) ||
                t("errors.loginFailed");
            toast.error(message);
        },
    });

    const formik = useFormik<LoginFormValues>({
        initialValues: { identifier: getRememberedIdentifier() ?? "", password: "", rememberMe: false },
        validationSchema: loginSchema,
        onSubmit: async (values, { setSubmitting }) => {
            rememberMeRef.current = values.rememberMe;
            if (values.rememberMe) {
                setRememberedIdentifier(values.identifier.trim());
            }
            try {
                await loginMutation.mutateAsync({
                    identifier: values.identifier.trim(),
                    password: values.password.trim(),
                });
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <AuthLayout title={t("login.title")} subtitle={t("login.subtitle")}>
            <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
                <FormField
                    label={t("login.identifierLabel")}
                    htmlFor="identifier"
                    required
                    error={formik.touched.identifier ? formik.errors.identifier : undefined}
                >
                    <Input
                        id="identifier"
                        name="identifier"
                        type="text"
                        placeholder={t("login.identifierPlaceholder")}
                        value={formik.values.identifier}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        aria-invalid={formik.touched.identifier && !!formik.errors.identifier}
                    />
                </FormField>

                <FormField
                    label={t("login.passwordLabel")}
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

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-muted-foreground">
                        <input
                            id="rememberMe"
                            name="rememberMe"
                            type="checkbox"
                            checked={formik.values.rememberMe}
                            onChange={formik.handleChange}
                            className="h-4 w-4 rounded border-border text-vegan-green focus:ring-vegan-green"
                        />
                        {t("login.rememberMe")}
                    </label>
                    <Link to="/forgot-password" className="font-medium text-vegan-green hover:underline">
                        {t("login.forgotPassword")}
                    </Link>
                </div>

                <Button type="submit" className="w-full" disabled={loginMutation.isPending || formik.isSubmitting}>
                    <LogIn className="h-4 w-4" />
                    {loginMutation.isPending ? t("login.loggingIn") : t("login.loginButton")}
                </Button>
            </form>


            <p className="mt-6 text-center text-sm text-muted-foreground">
                {t("login.noAccount")}{" "}
                <Link to="/register" className="font-medium text-vegan-green hover:underline">
                    {t("login.registerNow")}
                </Link>
            </p>
        </AuthLayout>
    );
}
