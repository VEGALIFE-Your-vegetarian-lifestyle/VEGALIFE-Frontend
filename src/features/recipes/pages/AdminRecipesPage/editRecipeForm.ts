import type { AdminRecipe, AdminRecipeUpdateRequest, Difficulty } from "../../types";

export interface RecipeEditValues {
    name: string;
    description: string;
    instructions: string;
    prepTimeMinutes: string;
    cookTimeMinutes: string;
    servings: string;
    difficulty: Difficulty | "";
}

export const toForm = (recipe: AdminRecipe): RecipeEditValues => ({
    name: recipe.name,
    description: recipe.description ?? "",
    instructions: recipe.instructions,
    prepTimeMinutes: recipe.prepTimeMinutes == null ? "" : String(recipe.prepTimeMinutes),
    cookTimeMinutes: recipe.cookTimeMinutes == null ? "" : String(recipe.cookTimeMinutes),
    servings: String(recipe.servings),
    difficulty: recipe.difficulty ?? "",
});

/**
 * Chỉ gửi field **đã đổi** — PATCH bỏ khoá thì giữ nguyên, gửi thừa chỉ tăng nguy cơ 400.
 * Trả `null` khi không có gì đổi để chỗ gọi khỏi gọi API.
 *
 * ponytail: ô thời gian để trống nghĩa là "giữ nguyên", không xoá về `null` được —
 * `AdminRecipeUpdateRequest` không phân biệt "vắng mặt" với "null". Cùng lý do với
 * `difficulty`.
 */
export function buildRecipePatch(
    initial: RecipeEditValues,
    values: RecipeEditValues,
): AdminRecipeUpdateRequest | null {
    const patch: AdminRecipeUpdateRequest = {};
    if (values.name.trim() !== initial.name) patch.name = values.name.trim();
    if (values.description.trim() !== (initial.description ?? "")) patch.description = values.description.trim();
    if (values.instructions.trim() !== initial.instructions) patch.instructions = values.instructions.trim();
    if (values.prepTimeMinutes !== initial.prepTimeMinutes && values.prepTimeMinutes.trim()) {
        patch.prepTimeMinutes = Number(values.prepTimeMinutes.trim());
    }
    if (values.cookTimeMinutes !== initial.cookTimeMinutes && values.cookTimeMinutes.trim()) {
        patch.cookTimeMinutes = Number(values.cookTimeMinutes.trim());
    }
    if (values.servings !== initial.servings) patch.servings = Number(values.servings.trim());
    if (values.difficulty && values.difficulty !== initial.difficulty) patch.difficulty = values.difficulty;
    return Object.keys(patch).length > 0 ? patch : null;
}
