import type { CreateRecipeRequest } from "../../types";
import { visibleSteps, type RecipeFormValues, type RecipeStep } from "./schema";

/** Chuỗi → số, rỗng/không hợp lệ → `undefined` (field optional không gửi). */
function toOptionalNumber(value: string): number | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Các ô bước → một chuỗi `instructions`.
 * Mỗi bước một dòng, tiêu đề và thân cách nhau `" — "`; bước không tiêu đề thì chỉ có thân.
 * Xuống dòng đơn để `RecipeDetailDialog` (`whitespace-pre-line`) vẫn hiện đúng từng bước.
 */
export function joinSteps(steps: RecipeStep[]): string {
    return visibleSteps(steps)
        .map((step) => [step.title.trim(), step.body.trim()].filter(Boolean).join(" — "))
        .join("\n");
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
        instructions: joinSteps(values.steps),
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

    const calories = toOptionalNumber(values.calories);
    if (calories !== undefined) payload.calories = calories;

    const proteinG = toOptionalNumber(values.proteinG);
    if (proteinG !== undefined) payload.proteinG = proteinG;

    const carbohydrateG = toOptionalNumber(values.carbohydrateG);
    if (carbohydrateG !== undefined) payload.carbohydrateG = carbohydrateG;

    const fatG = toOptionalNumber(values.fatG);
    if (fatG !== undefined) payload.fatG = fatG;

    const fiberG = toOptionalNumber(values.fiberG);
    if (fiberG !== undefined) payload.fiberG = fiberG;

    return payload;
}
