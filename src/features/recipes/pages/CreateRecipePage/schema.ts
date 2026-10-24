import * as Yup from "yup";
import type { TFunction } from "i18next";
import type { Difficulty, RecipeIngredientInput } from "../../types";

export const MAX_NAME_LENGTH = 255;
export const MAX_INGREDIENT_NAME_LENGTH = 100;
export const MAX_UNIT_LENGTH = 30;
export const MAX_INGREDIENTS = 50;

export const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

/** Toàn bộ field của form. Số nhập dạng chuỗi (input HTML) — `payload.ts` đổi sang number. */
export interface RecipeFormValues {
    name: string;
    dishName: string;
    description: string;
    prepTimeMinutes: string;
    cookTimeMinutes: string;
    servings: string;
    difficulty: Difficulty | "";
    instructions: string;
    ingredients: RecipeIngredientInput[];
}

export function emptyIngredient(): RecipeIngredientInput {
    return { name: "", amount: "", unit: "" };
}

export function initialRecipeValues(): RecipeFormValues {
    return {
        name: "",
        dishName: "",
        description: "",
        prepTimeMinutes: "",
        cookTimeMinutes: "",
        servings: "2",
        difficulty: "",
        instructions: "",
        ingredients: [emptyIngredient()],
    };
}

/** Chuẩn hoá để so trùng — khớp cách backend trim+lowercase tên nguyên liệu. */
function normalizeName(name: string): string {
    return name.trim().toLowerCase();
}

/**
 * Index của các hàng trùng tên với một hàng phía trên.
 * Dùng ở `onSubmit` (chặn gửi) và trong `IngredientEditor` (tô đỏ hàng).
 */
export function duplicateIngredientIndexes(ingredients: RecipeIngredientInput[]): number[] {
    const seen = new Set<string>();
    const duplicates: number[] = [];
    ingredients.forEach((item, index) => {
        const key = normalizeName(item.name);
        if (!key) return;
        if (seen.has(key)) duplicates.push(index);
        else seen.add(key);
    });
    return duplicates;
}

/** Số nguyên ≥ 0 hoặc rỗng (field thời gian không bắt buộc). */
const optionalMinutes = (t: TFunction) =>
    Yup.string().test("minutes", t("recipe:errors.minutesInvalid"), (value) => {
        if (!value || value.trim() === "") return true;
        return /^\d+$/.test(value.trim());
    });

const ingredientSchema = (t: TFunction) =>
    Yup.object({
        name: Yup.string()
            .trim()
            .required(t("validation:required"))
            .max(MAX_INGREDIENT_NAME_LENGTH, t("validation:maxLength", { count: MAX_INGREDIENT_NAME_LENGTH })),
        amount: Yup.string()
            .required(t("validation:required"))
            // > 0 và tối đa 3 chữ số thập phân — khớp `@Digits(integer=…, fraction=3)` của backend.
            .test("amount", t("recipe:errors.amountInvalid"), (value) => {
                if (!value) return false;
                const trimmed = value.trim();
                if (!/^\d+(\.\d{1,3})?$/.test(trimmed)) return false;
                return Number(trimmed) > 0;
            }),
        unit: Yup.string()
            .trim()
            .required(t("validation:required"))
            .max(MAX_UNIT_LENGTH, t("validation:maxLength", { count: MAX_UNIT_LENGTH })),
    });

export function buildRecipeSchema(t: TFunction) {
    return Yup.object({
        name: Yup.string()
            .trim()
            .required(t("validation:required"))
            .max(MAX_NAME_LENGTH, t("validation:maxLength", { count: MAX_NAME_LENGTH })),
        dishName: Yup.string()
            .trim()
            .required(t("validation:required"))
            .max(MAX_NAME_LENGTH, t("validation:maxLength", { count: MAX_NAME_LENGTH })),
        description: Yup.string(),
        prepTimeMinutes: optionalMinutes(t),
        cookTimeMinutes: optionalMinutes(t),
        servings: Yup.string()
            .required(t("validation:required"))
            .test("servings", t("recipe:errors.servingsMin"), (value) => {
                if (!value) return false;
                const trimmed = value.trim();
                return /^\d+$/.test(trimmed) && Number(trimmed) >= 1;
            }),
        difficulty: Yup.string().oneOf([...DIFFICULTIES, ""]),
        instructions: Yup.string().trim().required(t("validation:required")),
        ingredients: Yup.array()
            .of(ingredientSchema(t))
            .min(1, t("recipe:errors.ingredientsMin"))
            .max(MAX_INGREDIENTS, t("recipe:errors.ingredientsMax")),
    });
}
