import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enAdmin from "./locales/en/admin.json";
import enValidation from "./locales/en/validation.json";
import enProfile from "./locales/en/profile.json";
import enHome from "./locales/en/home.json";
import enExplore from "./locales/en/explore.json";
import enPost from "./locales/en/post.json";
import enNearby from "./locales/en/nearby.json";
import enAiNutrition from "./locales/en/aiNutrition.json";
import enMealPlan from "./locales/en/mealPlan.json";
import enRecipe from "./locales/en/recipe.json";
import viCommon from "./locales/vi/common.json";
import viAuth from "./locales/vi/auth.json";
import viAdmin from "./locales/vi/admin.json";
import viValidation from "./locales/vi/validation.json";
import viProfile from "./locales/vi/profile.json";
import viHome from "./locales/vi/home.json";
import viExplore from "./locales/vi/explore.json";
import viPost from "./locales/vi/post.json";
import viNearby from "./locales/vi/nearby.json";
import viAiNutrition from "./locales/vi/aiNutrition.json";
import viMealPlan from "./locales/vi/mealPlan.json";
import viRecipe from "./locales/vi/recipe.json";

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
                home: enHome,
                explore: enExplore,
                post: enPost,
                nearby: enNearby,
                aiNutrition: enAiNutrition,
                mealPlan: enMealPlan,
                recipe: enRecipe,
            },
            vi: {
                common: viCommon,
                auth: viAuth,
                admin: viAdmin,
                validation: viValidation,
                profile: viProfile,
                home: viHome,
                explore: viExplore,
                post: viPost,
                nearby: viNearby,
                aiNutrition: viAiNutrition,
                mealPlan: viMealPlan,
                recipe: viRecipe,
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
