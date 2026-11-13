import { create } from "zustand";
import type { SupportedLanguage } from "@/i18n";

/**
 * `postId: null` = tạo mới; có id = sửa bài. `recipeIds` = công thức gắn sẵn khi mở
 * từ trang Saved hoặc dialog công thức. Dialog mount một lần ở Layout.
 */
export interface ComposerTarget {
    postId: string | null;
    recipeIds?: string[];
}

interface UiState {
    sidebarCollapsed: boolean;
    language: SupportedLanguage;
    composer: ComposerTarget | null;
    /** Dialog tạo thực đơn tuần. `from` = thứ 2 của tuần muốn lập (null = tuần hiện tại). */
    mealPlanComposer: { from: string | null } | null;
    /** Dialog tạo công thức — mount một lần ở `Layout`, mở bằng `openRecipeComposer()`. */
    recipeComposer: boolean;
    openComposer: (postId?: string | null, recipeIds?: string[]) => void;
    closeComposer: () => void;
    openMealPlanComposer: (from?: string | null) => void;
    closeMealPlanComposer: () => void;
    openRecipeComposer: () => void;
    closeRecipeComposer: () => void;
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
    composer: null,
    openComposer: (postId = null, recipeIds) => set({ composer: { postId, recipeIds } }),
    closeComposer: () => set({ composer: null }),
    mealPlanComposer: null,
    openMealPlanComposer: (from = null) => set({ mealPlanComposer: { from } }),
    closeMealPlanComposer: () => set({ mealPlanComposer: null }),
    recipeComposer: false,
    openRecipeComposer: () => set({ recipeComposer: true }),
    closeRecipeComposer: () => set({ recipeComposer: false }),
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setLanguage: (language) => {
        localStorage.setItem(STORAGE_KEY, language);
        set({ language });
    },
}));