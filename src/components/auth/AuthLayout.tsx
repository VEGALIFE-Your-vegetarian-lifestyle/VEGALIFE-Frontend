import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Leaf, Lock, Sparkles, Utensils } from "lucide-react";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

const SHOWCASE_IMAGE = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop";

/**
 * Layout xác thực 2 panel nền sáng theo mockup.
 * ponytail: panel trái là gradient mint/tím nhạt dựng bằng CSS, không dùng ảnh nền tối.
 */
export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    const { t } = useTranslation("auth");

    return (
        <div className="min-h-screen bg-background">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
                <Link to="/" className="flex items-center gap-2 text-dark">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-vegan-green-light">
                        <Leaf className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                    </span>
                    <span className="text-base font-bold tracking-tight">{t("common:appName")}</span>
                </Link>
                <div className="flex items-center gap-3">
                    <span className="hidden items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:flex">
                        <Lock className="h-3.5 w-3.5 text-vegan-green" aria-hidden="true" />
                        {t("topbar.secure")}
                    </span>
                    <Link
                        to="/"
                        className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-dark transition hover:border-vegan-green-muted hover:text-vegan-green"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("guest")}
                    </Link>
                </div>
            </div>

            <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 sm:px-8 lg:grid-cols-2 lg:gap-12">
                {/* Panel trái — giới thiệu, nền gradient sáng */}
                <section className="relative hidden overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-vegan-green-subtle via-lavender to-cream p-10 lg:flex lg:flex-col lg:justify-between">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-vegan-green backdrop-blur-sm">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                            {t("split.badge")}
                        </span>
                        <h2 className="mt-6 text-4xl font-extrabold leading-tight text-dark">{t("split.headline")}</h2>
                        <p className="mt-4 max-w-md text-base text-muted-foreground">{t("split.description")}</p>
                    </div>

                    <div className="relative my-8 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                        <img src={SHOWCASE_IMAGE} alt="" className="h-52 w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-dark/80 to-transparent p-4">
                            <p className="text-sm font-semibold text-white">{t("split.caption")}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-border bg-surface/85 p-4 backdrop-blur-sm">
                            <Utensils className="mb-2 h-5 w-5 text-vegan-green" aria-hidden="true" />
                            <p className="text-xl font-bold text-dark">10,000+</p>
                            <p className="text-xs text-muted-foreground">{t("split.recipes")}</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-surface/85 p-4 backdrop-blur-sm">
                            <Sparkles className="mb-2 h-5 w-5 text-lavender-strong" aria-hidden="true" />
                            <p className="text-xl font-bold text-dark">4.2</p>
                            <p className="text-xs text-muted-foreground">{t("split.nutritionModel")}</p>
                        </div>
                    </div>
                </section>

                {/* Panel phải — form */}
                <section className="flex flex-col justify-center py-4 lg:py-10">
                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-dark sm:text-3xl">{title}</h1>
                            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
                        </div>

                        {children}
                    </div>
                </section>
            </div>
        </div>
    );
}
