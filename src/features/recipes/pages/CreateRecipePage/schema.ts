import * as Yup from "yup";
import type { TFunction } from "i18next";
import type { Difficulty, RecipeIngredientInput } from "../../types";

export const MAX_NAME_LENGTH = 255;
export const MAX_INGREDIENT_NAME_LENGTH = 100;
export const MAX_UNIT_LENGTH = 30;
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
    /** 5 field dinh dưỡng optional — chỉ gửi khi có giá trị. */
    calories: string;
    proteinG: string;
    carbohydrateG: string;
    fatG: string;
    fiberG: string;
}

export function emptyIngredient(): RecipeIngredientInput {
    return { name: "", amount: "", unit: "" };
}

export function emptyStep(): RecipeStep {
    return { title: "", body: "" };
}

/** Bỏ các ô bước còn trống hoàn toàn (người dùng bấm "Thêm bước" rồi thôi). */
export function visibleSteps(steps: RecipeStep[]): RecipeStep[] {
    return steps.filter((step) => step.title.trim() !== "" || step.body.trim() !== "");
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
        calories: "",
        proteinG: "",
        carbohydrateG: "",
        fatG: "",
        fiberG: "",
    };
}

/** Số thực ≥ 0 hoặc rỗng. Khớp 5 field dinh dưỡng + số phần, khác `optionalMinutes` (số nguyên). */
const optionalDecimal = (t: TFunction) =>
    Yup.string().test("decimal", t("recipe:errors.numberInvalid"), (value) => {
        if (!value || value.trim() === "") return true;
        const trimmed = value.trim();
        return /^\d+(\.\d+)?$/.test(trimmed) && Number(trimmed) >= 0;
    });

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

/**
 * Một bước nấu: ô bấm "Thêm bước" rồi bỏ trống thì không tính là lỗi, nhưng đã gõ
 * tiêu đề hoặc thân thì thân **phải** có chữ (BE chỉ nhận `instructions` là 1 chuỗi,
 * bước rỗng sẽ thành dòng trống vô nghĩa).
 */
const stepSchema = (t: TFunction) =>
    Yup.object().test("stepBody", t("recipe:errors.stepBodyRequired"), (step) => {
        const row = step as RecipeStep | undefined;
        if (!row) return true;
        if (row.title.trim() === "" && row.body.trim() === "") return true;
        return row.body.trim() !== "";
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
        calories: optionalDecimal(t),
        proteinG: optionalDecimal(t),
        carbohydrateG: optionalDecimal(t),
        fatG: optionalDecimal(t),
        fiberG: optionalDecimal(t),
    });
}
