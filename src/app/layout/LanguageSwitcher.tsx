import { useTranslation } from "react-i18next";
import { useUiStore } from "@/shared/ui/uiStore";
import type { SupportedLanguage } from "@/i18n";

const LANGUAGES: { value: SupportedLanguage; label: string }[] = [
    { value: "en", label: "EN" },
    { value: "vi", label: "VI" },
];

/** `onBrand` — dùng khi đặt trên nền xanh đặc (header/footer). */
export function LanguageSwitcher({ onBrand = false }: { onBrand?: boolean }) {
    const { i18n } = useTranslation();
    const { language, setLanguage } = useUiStore();

    const handleChange = (value: SupportedLanguage) => {
        setLanguage(value);
        i18n.changeLanguage(value);
    };

    return (
        <div
            className={`flex items-center gap-1 rounded-xl border p-1 ${
                onBrand ? "border-white/25 bg-white/10" : "border-border bg-background"
            }`}
        >
            {LANGUAGES.map((lang) => (
                <button
                    key={lang.value}
                    type="button"
                    aria-label={lang.label}
                    onClick={() => handleChange(lang.value)}
                    className={`flex h-7 items-center rounded-lg px-2 text-xs font-semibold transition-colors ${
                        language === lang.value
                            ? onBrand
                                ? "bg-white text-vegan-green shadow-sm"
                                : "bg-vegan-green text-white shadow-sm"
                            : onBrand
                              ? "text-white/90 hover:text-white"
                              : "text-muted-foreground hover:text-vegan-green"
                    }`}
                >
                    {lang.label}
                </button>
            ))}
        </div>
    );
}
