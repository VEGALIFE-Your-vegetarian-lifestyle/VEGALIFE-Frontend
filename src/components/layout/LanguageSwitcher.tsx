import { useTranslation } from "react-i18next";
import { useUiStore } from "@/stores/uiStore";
import type { SupportedLanguage } from "@/i18n";

const LANGUAGES: { value: SupportedLanguage; label: string }[] = [
    { value: "en", label: "EN" },
    { value: "vi", label: "VI" },
];

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const { language, setLanguage } = useUiStore();

    const handleChange = (value: SupportedLanguage) => {
        setLanguage(value);
        i18n.changeLanguage(value);
    };

    return (
        <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1">
            {LANGUAGES.map((lang) => (
                <button
                    key={lang.value}
                    type="button"
                    aria-label={lang.label}
                    onClick={() => handleChange(lang.value)}
                    className={`flex h-7 items-center rounded-lg px-2 text-xs font-semibold transition-colors ${
                        language === lang.value
                            ? "bg-vegan-green text-white shadow-sm"
                            : "text-muted-foreground hover:text-vegan-green"
                    }`}
                >
                    {lang.label}
                </button>
            ))}
        </div>
    );
}
