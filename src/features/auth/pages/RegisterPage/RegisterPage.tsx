import { useMemo, useState } from "react";
import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/common/FormField";
import { AuthLayout } from "../../AuthLayout";
import { register } from "../../api";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import type { RegisterRequest } from "@/shared/types/user";

const MIN_USERNAME = 3;
const MAX_USERNAME = 50;
const MAX_EMAIL = 100;
const MIN_PASSWORD = 8;

export default function RegisterPage() {
    const { t } = useTranslation("auth");
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const registerSchema = useMemo(
        () =>
            Yup.object({
                username: Yup.string()
                    .trim()
                    .required(t("errors.usernameRequired"))
                    .min(MIN_USERNAME, t("errors.usernameMin"))
                    .max(MAX_USERNAME, t("errors.usernameMax"))
                    .matches(/^[a-zA-Z0-9_.]+$/, t("errors.usernameFormat")),
                email: Yup.string()
                    .trim()
                    .required(t("errors.emailRequired"))
                    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, t("errors.emailInvalid"))
                    .max(MAX_EMAIL, t("errors.emailMax")),
                password: Yup.string()
                    .required(t("errors.passwordRequired"))
                    .min(MIN_PASSWORD, t("errors.passwordMin"))
                    .matches(/[A-Z]/, t("errors.passwordUpper"))
                    .matches(/[a-z]/, t("errors.passwordLower"))
                    .matches(/[0-9]/, t("errors.passwordDigit"))
                    .matches(/[^A-Za-z0-9]/, t("errors.passwordSpecial")),
                confirmPassword: Yup.string()
                    .required(t("errors.confirmPasswordRequired"))
                    .oneOf([Yup.ref("password")], t("errors.passwordMismatch")),
            }),
        [t],
    );

    const registerMutation = useMutation({
        mutationFn: (values: RegisterRequest) => register(values),
        onSuccess: (data) => {
            toast.success(t("register.success"));
            navigate("/verify-email", { replace: true, state: { email: data.email } });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("register.failed")));
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
        <AuthLayout title={t("register.title")} subtitle={t("register.subtitle")}>
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                <Link
                    to="/login"
                    className="rounded-lg px-4 py-2 text-center text-sm font-semibold text-muted-foreground transition hover:text-vegan-green"
                >
                    {t("tabs.login")}
                </Link>
                <Link
                    to="/register"
                    aria-current="page"
                    className="rounded-lg bg-surface px-4 py-2 text-center text-sm font-semibold text-vegan-green shadow-sm"
                >
                    {t("tabs.register")}
                </Link>
            </div>

            <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
                <FormField
                    label={t("register.usernameLabel")}
                    htmlFor="username"
                    required
                    error={formik.touched.username ? formik.errors.username : undefined}
                >
                    <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder={t("register.usernamePlaceholder")}
                        value={formik.values.username}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        aria-invalid={formik.touched.username && !!formik.errors.username}
                    />
                </FormField>

                <FormField
                    label={t("register.emailLabel")}
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
                    label={t("register.passwordLabel")}
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
                            aria-label={t(showPassword ? "hidePassword" : "showPassword")}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </FormField>

                <FormField
                    label={t("register.confirmPasswordLabel")}
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
                            aria-label={t(showConfirmPassword ? "hidePassword" : "showPassword")}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </FormField>

                <Button type="submit" className="w-full" disabled={registerMutation.isPending || formik.isSubmitting}>
                    <UserPlus className="h-4 w-4" />
                    {t(registerMutation.isPending ? "register.submitting" : "register.submit")}
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                {t("haveAccount")}{" "}
                <Link to="/login" className="font-medium text-vegan-green hover:underline">
                    {t("tabs.login")}
                </Link>
            </p>
        </AuthLayout>
    );
}
