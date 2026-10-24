import type { CreateRecipeRequest } from "../../types";
import type { RecipeFormValues } from "./schema";

/** Chuỗi → số, rỗng/không hợp lệ → `undefined` (field optional không gửi). */
function toOptionalNumber(value: string): number | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Form → body `POST /api/recipes`.
 * Field optional rỗng thì **bỏ khỏi object** thay vì gửi `""`/`null` — backend coi `""`
 * là giá trị hợp lệ và sẽ lưu chuỗi rỗng.
 */
export function buildRecipePayload(values: RecipeFormValues): CreateRecipeRequest {
    const payload: CreateRecipeRequest = {
        name: values.name.trim(),
        dishName: values.dishName.trim(),
        instructions: values.instructions.trim(),
        servings: Number(values.servings.trim()),
        ingredients: values.ingredients.map((item) => ({
            name: item.name.trim(),
            amount: Number(item.amount.trim()),
            unit: item.unit.trim(),
        })),
    };

    const description = values.description.trim();
    if (description) payload.description = description;

    const prepTime = toOptionalNumber(values.prepTimeMinutes);
    if (prepTime !== undefined) payload.prepTimeMinutes = prepTime;

    const cookTime = toOptionalNumber(values.cookTimeMinutes);
    if (cookTime !== undefined) payload.cookTimeMinutes = cookTime;

    if (values.difficulty) payload.difficulty = values.difficulty;

    return payload;
}
