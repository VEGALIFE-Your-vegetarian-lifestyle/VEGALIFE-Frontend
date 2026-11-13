import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Leaf, ShieldCheck } from "lucide-react";

const NAV_KEYS = ["home", "explore", "nearby", "aiNutrition"] as const;
const NAV_HREFS: Record<(typeof NAV_KEYS)[number], string> = {
    home: "/",
    explore: "/explore",
    nearby: "/nearby",
    aiNutrition: "/ai-nutrition",
};

export function Footer() {
    const { t } = useTranslation("common");

    return (
        <footer className="chrome-field border-t border-white/10 text-white">
            <div className="mx-auto max-w-app px-4 py-10 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                    <div className="text-center md:text-left">
                        <Link to="/" className="flex items-center justify-center gap-2 text-white md:justify-start">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                                <Leaf className="h-4 w-4 text-white" />
                            </span>
                            <span className="text-base font-bold tracking-tight">{t("appName")}</span>
                        </Link>
                        <p className="mt-2 max-w-sm text-sm text-white/70">{t("footer.tagline")}</p>
                    </div>

                    <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                        {NAV_KEYS.map((key) => (
                            <Link
                                key={key}
                                to={NAV_HREFS[key]}
                                className="text-sm font-semibold text-white/90 transition-colors hover:text-white"
                            >
                                {t(key)}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-6 text-xs text-white/70 md:flex-row">
                    <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-white/80" aria-hidden="true" />
                        {t("footer.community")}
                    </span>
                </div>
            </div>
        </footer>
    );
}
