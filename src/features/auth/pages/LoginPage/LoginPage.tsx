import { useRef, useState } from "react";
import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";
import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/common/FormField";
import { AuthLayout } from "../../AuthLayout";
import { useAuth } from "../../useAuth";
import { login } from "../../api";
import { decodeJwt } from "@/shared/utils/jwt";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { getRememberedIdentifier, setRememberedIdentifier } from "@/shared/auth/authStore";
import type { LoginRequest, UserRole } from "@/shared/types/user";

interface LoginFormValues extends LoginRequest {
    rememberMe: boolean;
}

export default function LoginPage() {
    const { t } = useTranslation("auth");
    const navigate = useNavigate();
    const { setAuth } = useAuth();
    const rememberMeRef = useRef(false);
    const [showPassword, setShowPassword] = useState(false);

    const loginSchema = Yup.object({
        // Ô này nhận cả email lẫn username, nên chỉ bắt định dạng khi có "@".
        identifier: Yup.string()
            .trim()
            .required(t("errors.identifierRequired"))
            .test("emailFormat", t("errors.emailFormat"), (value) =>
                !value || !value.includes("@") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            ),
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
            toast.error(getApiErrorMessage(error, t("errors.loginFailed")));
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
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-border bg-muted-bg p-1">
                <Link
                    to="/login"
                    aria-current="page"
                    className="rounded-full bg-surface px-4 py-2 text-center text-sm font-semibold text-vegan-green shadow-sm"
                >
                    {t("tabs.login")}
                </Link>
                <Link
                    to="/register"
                    className="rounded-full px-4 py-2 text-center text-sm font-semibold text-muted-foreground transition hover:text-vegan-green"
                >
                    {t("tabs.register")}
                </Link>
            </div>

            <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
                <FormField
                    label={t("login.identifierLabel")}
                    htmlFor="identifier"
                    required
                    helper={t("login.identifierHint")}
                    error={formik.touched.identifier ? formik.errors.identifier : undefined}
                >
                    <Input
                        id="identifier"
                        name="identifier"
                        type="text"
                        leadingIcon={Mail}
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
                        type={showPassword ? "text" : "password"}
                        leadingIcon={Lock}
                        placeholder="••••••••"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        aria-invalid={formik.touched.password && !!formik.errors.password}
                        trailing={
                            <button
                                type="button"
                                onClick={() => setShowPassword((visible) => !visible)}
                                aria-label={t(showPassword ? "hidePassword" : "showPassword")}
                                className="rounded-lg p-2 text-muted-foreground transition hover:text-dark"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                                ) : (
                                    <Eye className="h-4 w-4" aria-hidden="true" />
                                )}
                            </button>
                        }
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
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    {loginMutation.isPending ? t("login.loggingIn") : t("login.loginButton")}
                </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase text-muted-foreground">{t("divider")}</span>
                <span className="h-px flex-1 bg-border" />
            </div>

            {/* ponytail: backend chưa có OAuth Google — nút báo "đang phát triển", nối khi có endpoint. */}
            <Button
                type="button"
                variant="white"
                className="w-full"
                onClick={() => toast.info(t("common:featureDeveloping"))}
            >
                <GoogleMark />
                {t("google")}
            </Button>

            <p className="mt-5 text-center text-sm">
                <Link to="/" className="font-medium text-muted-foreground hover:text-vegan-green hover:underline">
                    {t("guest")}
                </Link>
            </p>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                {t("login.noAccount")}{" "}
                <Link to="/register" className="font-medium text-vegan-green hover:underline">
                    {t("login.registerNow")}
                </Link>
            </p>
        </AuthLayout>
    );
}

/** Logo Google vẽ bằng SVG — lucide không có icon thương hiệu. */
function GoogleMark() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" focusable="false">
            <path
                fill="#4285F4"
                d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.55Z"
            />
            <path
                fill="#34A853"
                d="M12 24c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.75H1.7v2.98A11.5 11.5 0 0 0 12 24Z"
            />
            <path
                fill="#FBBC05"
                d="M5.55 14.67a6.9 6.9 0 0 1 0-4.4V7.29H1.7a11.5 11.5 0 0 0 0 10.36l3.85-2.98Z"
            />
            <path
                fill="#EA4335"
                d="M12 4.75c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.72 1.24 15.1 0 12 0 7.5 0 3.6 2.58 1.7 7.29l3.85 2.98C6.46 7.55 9 4.75 12 4.75Z"
            />
        </svg>
    );
}
