import * as Yup from "yup";
import type { TFunction } from "i18next";
import type { Difficulty, RecipeIngredientInput } from "../../types";
import { UNITS } from "../../types";

export const MAX_NAME_LENGTH = 255;
export const MAX_INGREDIENT_NAME_LENGTH = 100;
export const MAX_INGREDIENTS = 50;

export const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

/** Nhãn mức độ công sức theo độ khó — phản hồi tĩnh dưới segmented control. */
export function difficultyRankKey(difficulty: string): "outline" | "balanced" | "challenging" {
    if (difficulty === "EASY") return "balanced";
    if (difficulty === "HARD") return "challenging";
    return "outline";
}

/**
 * Một bước nấu trong form — mỗi bước là **một ô riêng** (mockup: tiêu đề đậm + thân bài).
 * Backend chỉ nhận `instructions` là một chuỗi TEXT nên `payload.ts` gộp lại khi gửi.
 */
export interface RecipeStep {
    title: string;
    body: string;
}

/** Toàn bộ field của form. Số nhập dạng chuỗi (input HTML) — `payload.ts` đổi sang number. */
export interface RecipeFormValues {
    name: string;
    dishName: string;
    description: string;
    prepTimeMinutes: string;
    cookTimeMinutes: string;
    servings: string;
    difficulty: Difficulty | "";
    steps: RecipeStep[];
    ingredients: RecipeIngredientInput[];
}

export function emptyIngredient(): RecipeIngredientInput {
    return { name: "", amount: "", unit: "" };
}

export function emptyStep(): RecipeStep {
    return { title: "", body: "" };
}

/**
 * Bỏ các ô bước còn trống hoàn toàn (người dùng bấm "Thêm bước" rồi thôi).
 * Trả bản **đã chuẩn hoá**: `Yup.object()` rỗng không fill khoá thiếu, nên một bước
 * `{ title: undefined }` (hoặc không phải object) sẽ làm mọi chỗ đọc `.trim()` nổ.
 */
export function visibleSteps(steps: RecipeStep[]): RecipeStep[] {
    if (!Array.isArray(steps)) return [];
    return steps
        .map((step) => ({
            title: typeof step?.title === "string" ? step.title : "",
            body: typeof step?.body === "string" ? step.body : "",
        }))
        .filter((step) => step.title.trim() !== "" || step.body.trim() !== "");
}

export function initialRecipeValues(): RecipeFormValues {
    return {
        name: "",
        dishName: "",
        description: "",
        prepTimeMinutes: "",
        cookTimeMinutes: "",
        // ponytail: BE không có servings mặc định — chỉ là số hay dùng nhất, sửa được.
        servings: "2",
        difficulty: "",
        steps: [emptyStep()],
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
            // Bỏ trống được: nguyên liệu đã tồn tại thì BE bỏ qua `unit`, amount đọc theo
            // đơn vị lưu sẵn. Khác rỗng thì phải là 1 trong 3 mã BE nhận, nếu không → 400.
            .test("unit", t("recipe:errors.unitInvalid"), (value) => {
                if (!value || value.trim() === "") return true;
                return (UNITS as readonly string[]).includes(value.trim().toLowerCase());
            }),
    });

/**
 * Một bước nấu: ô bấm "Thêm bước" rồi bỏ trống thì không tính là lỗi, nhưng đã gõ
 * tiêu đề hoặc thân thì thân **phải** có chữ (BE chỉ nhận `instructions` là 1 chuỗi,
 * bước rỗng sẽ thành dòng trống vô nghĩa).
 */
const stepSchema = (t: TFunction) =>
    Yup.object().test("stepBody", t("recipe:errors.stepBodyRequired"), (step) => {
        const row = step as Partial<Record<keyof RecipeStep, unknown>> | undefined;
        if (!row) return true;
        const title = typeof row.title === "string" ? row.title.trim() : "";
        const body = typeof row.body === "string" ? row.body.trim() : "";
        if (title === "" && body === "") return true;
        return body !== "";
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
        steps: Yup.array()
            .of(stepSchema(t))
            // Bỏ hết ô trống thì chuỗi gộp ra `""` — BE chặn `minLength: 1`, chặn luôn ở đây.
            .test("steps", t("validation:required"), (steps) =>
                Array.isArray(steps) && visibleSteps(steps as RecipeStep[]).length > 0,
            ),
        ingredients: Yup.array()
            .of(ingredientSchema(t))
            .min(1, t("recipe:errors.ingredientsMin"))
            .max(MAX_INGREDIENTS, t("recipe:errors.ingredientsMax")),
    });
}
