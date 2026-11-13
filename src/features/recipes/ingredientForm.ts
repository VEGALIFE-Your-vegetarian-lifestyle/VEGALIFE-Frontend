import type {
    AdminIngredient,
    AdminIngredientCreateRequest,
    AdminIngredientUpdateRequest,
    IngredientUnit,
} from "./types";

/** Năm giá trị dinh dưỡng **trên một đơn vị** — backend đòi đủ cả 5 hoặc không cái nào. */
export const NUTRITION_FIELDS = ["calories", "proteinG", "carbohydrateG", "fatG", "fiberG"] as const;

export type NutritionField = (typeof NUTRITION_FIELDS)[number];

/** Key i18n của 5 ô — dùng chung cho form, bảng và dialog duyệt recipe. */
export const NUTRITION_LABEL_KEYS: Record<NutritionField, string> = {
    calories: "ingredients.nutrition.calories",
    proteinG: "ingredients.nutrition.proteinG",
    carbohydrateG: "ingredients.nutrition.carbohydrateG",
    fatG: "ingredients.nutrition.fatG",
    fiberG: "ingredients.nutrition.fiberG",
};

export type NutritionInput = Record<NutritionField, string>;

export interface IngredientFormValues extends NutritionInput {
    name: string;
    unit: IngredientUnit | "";
}

/**
 * Lỗi quan hệ giữa các ô — Yup chỉ soi từng field, không bắt được:
 * - `partialNutrition`: nhập 1–4 giá trị (BE trả 400).
 * - `unitRequired`: có dinh dưỡng mà không có đơn vị (dinh dưỡng "/1 đơn vị" vô nghĩa).
 * - `invalidNumber`: không phải số ≥ 0.
 */
export type IngredientFormError = "partialNutrition" | "unitRequired" | "invalidNumber";

export type IngredientFormResult<T> = { ok: true; payload: T | null } | { ok: false; error: IngredientFormError };

export const emptyIngredientForm = (): IngredientFormValues => ({
    name: "",
    unit: "",
    calories: "",
    proteinG: "",
    carbohydrateG: "",
    fatG: "",
    fiberG: "",
});

export function toIngredientForm(ingredient: AdminIngredient | null): IngredientFormValues {
    if (!ingredient) return emptyIngredientForm();
    const values = emptyIngredientForm();
    values.name = ingredient.name;
    values.unit = ingredient.unit ?? "";
    // `0` là giá trị thật (nước = 0 kcal) — chỉ `null` mới là "chưa có".
    for (const field of NUTRITION_FIELDS) {
        const value = ingredient[field];
        values[field] = value == null ? "" : String(value);
    }
    return values;
}

const filledNutrition = (values: NutritionInput): NutritionField[] =>
    NUTRITION_FIELDS.filter((field) => values[field].trim() !== "");

/** Đọc 5 ô thành số; trả `null` khi có ô không hợp lệ. */
function readNutrition(values: NutritionInput): Record<NutritionField, number> | null {
    const numbers = {} as Record<NutritionField, number>;
    for (const field of NUTRITION_FIELDS) {
        const parsed = Number(values[field].trim());
        if (!Number.isFinite(parsed) || parsed < 0) return null;
        numbers[field] = parsed;
    }
    return numbers;
}

/** Kiểm tra chéo dùng chung cho cả create và update. */
function checkNutrition<T extends NutritionInput>(
    values: T,
    unit: IngredientUnit | "",
): IngredientFormError | null {
    const filled = filledNutrition(values);
    if (filled.length === 0) return null;
    if (filled.length < NUTRITION_FIELDS.length) return "partialNutrition";
    if (!unit) return "unitRequired";
    return readNutrition(values) ? null : "invalidNumber";
}

/** `POST /api/admin/ingredients` — chỉ `name` bắt buộc. */
export function buildIngredientCreate(values: IngredientFormValues): IngredientFormResult<AdminIngredientCreateRequest> {
    const error = checkNutrition(values, values.unit);
    if (error) return { ok: false, error };

    const payload: AdminIngredientCreateRequest = { name: values.name.trim() };
    if (values.unit) payload.unit = values.unit;
    const nutrition = filledNutrition(values).length === NUTRITION_FIELDS.length ? readNutrition(values) : null;
    if (nutrition) Object.assign(payload, nutrition);
    return { ok: true, payload };
}

/**
 * `PATCH /api/admin/ingredients/{id}` — chỉ gửi field **đã đổi**; `null` payload = không
 * đổi gì, chỗ gọi khỏi gọi API.
 *
 * ponytail: không xoá được `unit` về rỗng — `AdminIngredientUpdateRequest` không phân biệt
 * "vắng mặt" với `null`. Cùng lý do, xoá trắng cả 5 ô dinh dưỡng là "giữ nguyên", không
 * phải "xoá dinh dưỡng".
 */
export function buildIngredientUpdate(
    initial: AdminIngredient,
    values: IngredientFormValues,
): IngredientFormResult<AdminIngredientUpdateRequest> {
    const payload: AdminIngredientUpdateRequest = {};
    const name = values.name.trim();
    if (name !== initial.name) payload.name = name;
    if (values.unit && values.unit !== initial.unit) payload.unit = values.unit;

    const filled = filledNutrition(values);
    if (filled.length > 0 && filled.length < NUTRITION_FIELDS.length) {
        return { ok: false, error: "partialNutrition" };
    }
    if (filled.length === NUTRITION_FIELDS.length) {
        if (!values.unit) return { ok: false, error: "unitRequired" };
        const numbers = readNutrition(values);
        if (!numbers) return { ok: false, error: "invalidNumber" };
        // Gửi lại giá trị y cũ là request thừa — chỉ đưa vào payload khi thật sự đổi.
        for (const field of NUTRITION_FIELDS) {
            if (numbers[field] !== initial[field]) payload[field] = numbers[field];
        }
    }

    return { ok: true, payload: Object.keys(payload).length > 0 ? payload : null };
}

/** Một dòng nguyên liệu thiếu trong dialog duyệt recipe. */
export interface MissingIngredientRow extends NutritionInput {
    ingredientId: string;
    name: string;
    unit: IngredientUnit | "";
}

export const emptyMissingRow = (ingredientId: string, name: string): MissingIngredientRow => ({
    ingredientId,
    name,
    unit: "",
    calories: "",
    proteinG: "",
    carbohydrateG: "",
    fatG: "",
    fiberG: "",
});

/**
 * Payload cho từng nguyên liệu thiếu lúc duyệt recipe.
 * `unit` để trống = **bỏ qua** nguyên liệu đó (điền sau ở trang Nguyên liệu).
 */
export function buildMissingIngredientsPatch(
    rows: MissingIngredientRow[],
): { ok: true; patches: { ingredientId: string; payload: AdminIngredientUpdateRequest }[] } | { ok: false; error: IngredientFormError } {
    const patches: { ingredientId: string; payload: AdminIngredientUpdateRequest }[] = [];

    for (const row of rows) {
        const error = checkNutrition(row, row.unit);
        if (error) return { ok: false, error };
        const payload: AdminIngredientUpdateRequest = {};
        if (row.unit) payload.unit = row.unit;
        const nutrition = filledNutrition(row).length === NUTRITION_FIELDS.length ? readNutrition(row) : null;
        if (nutrition) Object.assign(payload, nutrition);
        // Không unit, không dinh dưỡng → admin chọn điền sau, bỏ qua.
        if (Object.keys(payload).length > 0) patches.push({ ingredientId: row.ingredientId, payload });
    }

    return { ok: true, patches };
}
