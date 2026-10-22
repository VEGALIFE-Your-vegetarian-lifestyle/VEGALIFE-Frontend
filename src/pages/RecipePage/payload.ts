import type { CreateRecipeRequest, RecipeDifficulty } from "@/types/recipe";

/** Một dòng nguyên liệu trong form — `amount` giữ dạng chuỗi vì input số cho phép rỗng. */
export interface IngredientRow {
    name: string;
    amount: string;
    unit: string;
}

/** Khoá lỗi theo index dòng. Dòng không có mặt trong map là dòng hợp lệ. */
export type RowErrors = Record<number, string>;

export interface RecipeFormValues {
    name: string;
    dishName: string;
    description: string;
    instructions: string;
    /**
     * Formik tự ép `<input type="number">` sang number (rỗng thành `""`),
     * nên ba field này nhận cả hai kiểu — đừng gọi `.trim()` trực tiếp.
     */
    servings: string | number;
    prepTimeMinutes: string | number;
    cookTimeMinutes: string | number;
    difficulty: RecipeDifficulty | "";
}

/**
 * Kiểm từng dòng nguyên liệu. Spec #38: 1–50 phần tử, `name` unique
 * case-insensitive, `amount > 0`, `unit` bắt buộc. Trùng tên báo ở dòng sau.
 */
export function validateRows(rows: IngredientRow[], messages: { name: string; duplicate: string; unit: string; amount: string }): RowErrors {
    const errors: RowErrors = {};
    const seen = new Set<string>();

    rows.forEach((row, index) => {
        const name = row.name.trim().toLowerCase();
        if (!name) errors[index] = messages.name;
        else if (seen.has(name)) errors[index] = messages.duplicate;
        else if (!row.unit.trim()) errors[index] = messages.unit;
        else if (!(Number(row.amount) > 0)) errors[index] = messages.amount;
        if (name) seen.add(name);
    });

    return errors;
}

/**
 * Dựng body gửi #38. Field optional bỏ trống gửi `null` — spec nhận `null`,
 * không nhận chuỗi rỗng. Không gửi `userId`/`dishId`/`id`/timestamps.
 */
export function buildRecipeRequest(values: RecipeFormValues, rows: IngredientRow[]): CreateRecipeRequest {
    const optionalNumber = (raw: string | number) => (String(raw).trim() === "" ? null : Number(raw));

    return {
        name: values.name.trim(),
        dishName: values.dishName.trim(),
        instructions: values.instructions.trim(),
        servings: Number(values.servings),
        ingredients: rows.map((row) => ({
            name: row.name.trim(),
            amount: Number(row.amount),
            unit: row.unit.trim(),
        })),
        description: values.description.trim() || null,
        prepTimeMinutes: optionalNumber(values.prepTimeMinutes),
        cookTimeMinutes: optionalNumber(values.cookTimeMinutes),
        difficulty: values.difficulty || null,
    };
}
