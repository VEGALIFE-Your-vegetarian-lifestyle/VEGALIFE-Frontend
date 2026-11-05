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
        // `unit` chỉ gửi khi hàng là nguyên liệu **mới** và có giá trị — BE bỏ qua unit
        // của nguyên liệu đã tồn tại, gửi kèm chỉ gây hiểu nhầm.
        ingredients: values.ingredients.map((item) => {
            const line: CreateRecipeRequest["ingredients"][number] = {
                name: item.name.trim(),
                amount: Number(item.amount.trim()),
            };
            const unit = item.unit.trim();
            if (!item.existing && unit) line.unit = unit.toLowerCase();
            return line;
        }),
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
