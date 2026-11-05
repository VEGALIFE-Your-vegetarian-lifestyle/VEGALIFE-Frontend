import type { TFunction } from "i18next";
import type { Recipe } from "@/features/recipes/types";

/**
 * Dòng meta của một recipe đã gắn — mockup screen05: "Prep: 10 mins • Cook: 15 mins •
 * Yield: 2 Servings • 6 Ingredients". Field nào backend không trả thì bỏ khỏi dòng.
 */
export function recipeCardMeta(t: TFunction, recipe: Recipe): string {
    const parts: string[] = [];
    if (recipe.prepTimeMinutes != null) parts.push(t("posts.composer.recipePrep", { count: recipe.prepTimeMinutes }));
    if (recipe.cookTimeMinutes != null) parts.push(t("posts.composer.recipeCook", { count: recipe.cookTimeMinutes }));
    parts.push(t("posts.composer.recipeServings", { count: recipe.servings }));
    parts.push(t("posts.composer.recipeIngredients", { count: recipe.ingredients.length }));
    return parts.join(" • ");
}

/** Lọc theo tên công thức, tên món và tên nguyên liệu — giống `MyRecipesPage`. */
export function recipeMatches(recipe: Recipe, keyword: string): boolean {
    const needle = keyword.trim().toLowerCase();
    if (!needle) return true;
    if (recipe.name.toLowerCase().includes(needle)) return true;
    if (recipe.dishName.toLowerCase().includes(needle)) return true;
    return recipe.ingredients.some((item) => item.name.toLowerCase().includes(needle));
}
