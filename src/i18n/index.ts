import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enAdmin from "./locales/en/admin.json";
import enValidation from "./locales/en/validation.json";
import enProfile from "./locales/en/profile.json";
import viCommon from "./locales/vi/common.json";
import viAuth from "./locales/vi/auth.json";
import viAdmin from "./locales/vi/admin.json";
import viValidation from "./locales/vi/validation.json";
import viProfile from "./locales/vi/profile.json";

export const SUPPORTED_LANGUAGES = ["en", "vi"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const savedLanguage = (typeof window !== "undefined" && (localStorage.getItem("vegalife-language") as SupportedLanguage)) || "en";

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                common: enCommon,
                auth: enAuth,
                admin: enAdmin,
                validation: enValidation,
                profile: enProfile,
            },
            vi: {
                common: viCommon,
                auth: viAuth,
                admin: viAdmin,
                validation: viValidation,
                profile: viProfile,
            },
        },
        lng: savedLanguage,
        fallbackLng: "en",
        defaultNS: "common",
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
