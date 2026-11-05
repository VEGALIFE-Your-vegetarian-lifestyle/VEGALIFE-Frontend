import type { Difficulty, ModerationStatus, Recipe } from "../../types";

/** Mockup: 6 thẻ một trang. `GET /api/recipes/me` trả mảng phẳng → cắt ở client. */
export const PAGE_SIZE = 6;
/** Ngưỡng "món nhanh" cho thẻ thống kê. */
export const QUICK_MINUTES = 30;

export type SortKey = "updated" | "created" | "name";
export type TabKey = "all" | ModerationStatus;

export interface RecipeFilters {
    tab: TabKey;
    difficulty: Difficulty | "";
    keyword: string;
}

/** Khớp tab trạng thái + độ khó + từ khoá (tên công thức / tên món / tên nguyên liệu). */
export function matchesRecipe(recipe: Recipe, { tab, difficulty, keyword }: RecipeFilters): boolean {
    if (tab !== "all" && recipe.moderationStatus !== tab) return false;
    if (difficulty && recipe.difficulty !== difficulty) return false;
    const needle = keyword.trim().toLowerCase();
    if (!needle) return true;
    return (
        recipe.name.toLowerCase().includes(needle) ||
        recipe.dishName.toLowerCase().includes(needle) ||
        recipe.ingredients.some((ingredient) => ingredient.name.toLowerCase().includes(needle))
    );
}

/** Sắp xếp tại client — endpoint không nhận tham số `sort`. */
export function sortRecipes(
    items: Recipe[],
    key: SortKey,
    direction: "asc" | "desc",
    locale: string,
): Recipe[] {
    const factor = direction === "asc" ? 1 : -1;
    return [...items].sort((a, b) => {
        if (key === "name") return factor * a.name.localeCompare(b.name, locale);
        const left = Date.parse(key === "updated" ? a.updatedAt : a.createdAt);
        const right = Date.parse(key === "updated" ? b.updatedAt : b.createdAt);
        // Ngày hỏng đẩy xuống cuối thay vì làm cả danh sách nhảy loạn.
        if (Number.isNaN(left) || Number.isNaN(right)) return Number.isNaN(left) ? 1 : -1;
        return factor * (left - right);
    });
}

export interface RecipeStats {
    total: number;
    approved: number;
    pending: number;
    quick: number;
}

export function recipeStats(recipes: Recipe[]): RecipeStats {
    let approved = 0;
    let pending = 0;
    let quick = 0;
    for (const recipe of recipes) {
        if (recipe.moderationStatus === "APPROVED") approved += 1;
        else if (recipe.moderationStatus === "PENDING") pending += 1;
        const minutes = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
        if (minutes > 0 && minutes <= QUICK_MINUTES) quick += 1;
    }
    return { total: recipes.length, approved, pending, quick };
}
