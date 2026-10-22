import { create } from "zustand";
import type { SupportedLanguage } from "@/i18n";

interface UiState {
    sidebarCollapsed: boolean;
    language: SupportedLanguage;
    toggleSidebar: () => void;
    setLanguage: (language: SupportedLanguage) => void;
}

const STORAGE_KEY = "vegalife-language";

function getInitialLanguage(): SupportedLanguage {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
    return saved === "vi" ? "vi" : "en";
}

export const useUiStore = create<UiState>((set) => ({
    sidebarCollapsed: window.innerWidth < 1024,
    language: getInitialLanguage(),
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setLanguage: (language) => {
        localStorage.setItem(STORAGE_KEY, language);
        set({ language });
    },
}));