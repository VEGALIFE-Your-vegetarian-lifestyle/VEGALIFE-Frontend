import type { Recipe } from "./types";

/** 5 tổng dinh dưỡng **cả công thức** đã sẵn sàng hiển thị. */
export interface NutritionTotals {
    kcal: number;
    proteinG: number;
    carbohydrateG: number;
    fatG: number;
    fiberG: number;
}

/**
 * Rẽ nhánh theo `nutritionResolved`, **không** suy ra từ `calories != null`.
 * BE trả cả 5 cùng có hoặc cùng `null`; `0` là giá trị thật (nước = 0 kcal) nên
 * không được coi giá trị `0` là thiếu dữ liệu. Tổng là cả công thức — đừng chia `servings`.
 */
export function nutritionTotals(
    recipe: Pick<Recipe, "nutritionResolved" | "calories" | "proteinG" | "carbohydrateG" | "fatG" | "fiberG">,
): NutritionTotals | null {
    const { nutritionResolved, calories, proteinG, carbohydrateG, fatG, fiberG } = recipe;
    if (
        !nutritionResolved ||
        calories === null ||
        proteinG === null ||
        carbohydrateG === null ||
        fatG === null ||
        fiberG === null
    ) {
        return null;
    }
    return { kcal: calories, proteinG, carbohydrateG, fatG, fiberG };
}
