import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useFormik } from "formik";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/shared/components/FormField";
import { SectionCard } from "@/shared/components/SectionCard";
import { useDebounce } from "@/hooks/useDebounce";
import { createRecipe, getIngredients } from "@/services/recipeService";
import { getApiErrorMessage } from "@/utils/apiError";
import type { Recipe, RecipeDifficulty } from "@/types/recipe";
import { buildRecipeRequest, validateRows, type IngredientRow, type RecipeFormValues } from "./payload";

const MAX_TEXT = 255;
const MAX_INGREDIENTS = 50;
const DIFFICULTIES: RecipeDifficulty[] = ["EASY", "MEDIUM", "HARD"];

const EMPTY_VALUES: RecipeFormValues = {
    name: "",
    dishName: "",
    description: "",
    instructions: "",
    servings: "2",
    prepTimeMinutes: "",
    cookTimeMinutes: "",
    difficulty: "",
};

const EMPTY_ROW: IngredientRow = { name: "", amount: "", unit: "" };

interface Props {
    /** Lưu xong gọi callback. Trang tự thay màn xác nhận, dialog tự đóng — cả hai đều unmount form. */
    onCreated?: (recipe: Recipe) => void;
    /** Ẩn nút huỷ khi form nằm trong dialog — dialog tự có nút đóng. */
    embedded?: boolean;
}

/**
 * #38 `POST /api/recipes` — tạo công thức; BE tự find-or-create dish theo `dishName`
 * (BR-RECP-002). Dùng chung cho trang `/recipes/new` và dialog gắn recipe vào bài (#66).
 */
export function RecipeForm({ onCreated, embedded = false }: Props) {
    const { t } = useTranslation("recipe");
    const navigate = useNavigate();
    const [rows, setRows] = useState<IngredientRow[]>([{ ...EMPTY_ROW }]);
    const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
    /** Từ khoá autocomplete #40 — lấy từ nguyên liệu vừa gõ. */
    const [keyword, setKeyword] = useState("");
    const debouncedKeyword = useDebounce(keyword, 300);

    const suggestions = useQuery({
        queryKey: ["ingredients", debouncedKeyword],
        queryFn: () => getIngredients({ name: debouncedKeyword.trim() || undefined }),
        staleTime: 60_000,
    });

    const mutation = useMutation({
        mutationFn: createRecipe,
        onSuccess: (recipe) => {
            toast.success(t("toast.created"));
            // Trang tự thay bằng màn xác nhận, dialog tự đóng — cả hai đều unmount form
            // nên state tự về mặc định, không cần reset tay.
            onCreated?.(recipe);
        },
        onError: (error: unknown) => toast.error(getApiErrorMessage(error, t("toast.failed"))),
    });

    const formik = useFormik<RecipeFormValues>({
        initialValues: EMPTY_VALUES,
        validate: (values) => {
            const errors: Partial<Record<keyof RecipeFormValues, string>> = {};
            if (!values.name.trim()) errors.name = t("errors.name");
            if (!values.dishName.trim()) errors.dishName = t("errors.dishName");
            if (!values.instructions.trim()) errors.instructions = t("errors.instructions");
            const servings = Number(values.servings);
            if (!Number.isInteger(servings) || servings < 1) errors.servings = t("errors.servings");
            for (const key of ["prepTimeMinutes", "cookTimeMinutes"] as const) {
                // Formik ép input number sang number (rỗng = "") — ép về chuỗi trước.
                const raw = String(values[key]).trim();
                if (raw === "") continue;
                const minutes = Number(raw);
                if (!Number.isInteger(minutes) || minutes < 0) errors[key] = t("errors.time");
            }
            return errors;
        },
        onSubmit: (values) => {
            const problems = validateRows(rows, {
                name: t("errors.ingredientName"),
                duplicate: t("errors.duplicateIngredient"),
                unit: t("errors.ingredientUnit"),
                amount: t("errors.ingredientAmount"),
            });
            setRowErrors(problems);
            if (Object.keys(problems).length > 0) return;
            mutation.mutate(buildRecipeRequest(values, rows));
        },
    });

    const setRow = (index: number, patch: Partial<IngredientRow>) => {
        setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
        setRowErrors((prev) => {
            if (!(index in prev)) return prev;
            const next = { ...prev };
            delete next[index];
            return next;
        });
    };

    return (
        <form
            className="space-y-5"
            onSubmit={(event) => {
                event.preventDefault();
                void formik.submitForm();
            }}
        >
            <SectionCard eyebrow={t("section.basicsEyebrow")} title={t("section.basicsTitle")} footnote={t("section.basicsHint")}>
                <div className="space-y-4">
                    <FormField label={t("field.name")} htmlFor="recipe-name" required error={formik.errors.name}>
                        <Input
                            id="recipe-name"
                            name="name"
                            value={formik.values.name}
                            maxLength={MAX_TEXT}
                            placeholder={t("field.namePlaceholder")}
                            aria-invalid={!!formik.errors.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                    </FormField>

                    <FormField label={t("field.dishName")} htmlFor="recipe-dish" required error={formik.errors.dishName}>
                        <Input
                            id="recipe-dish"
                            name="dishName"
                            value={formik.values.dishName}
                            maxLength={MAX_TEXT}
                            placeholder={t("field.dishNamePlaceholder")}
                            aria-invalid={!!formik.errors.dishName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                    </FormField>

                    <FormField label={t("field.description")} htmlFor="recipe-description">
                        <Textarea
                            id="recipe-description"
                            name="description"
                            rows={2}
                            className="min-h-0"
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            placeholder={t("field.descriptionPlaceholder")}
                        />
                    </FormField>
                </div>
            </SectionCard>

            <SectionCard
                eyebrow={t("section.ingredientsEyebrow")}
                title={t("section.ingredientsTitle")}
                footnote={t("section.ingredientsHint")}
            >
                <div className="space-y-2">
                    {rows.map((row, index) => (
                        <div key={index} className="grid gap-2 sm:grid-cols-[1fr_6rem_6rem_auto]">
                            <Input
                                value={row.name}
                                list="ingredient-options"
                                maxLength={100}
                                placeholder={t("field.ingredientNamePlaceholder")}
                                aria-label={t("field.ingredientName")}
                                onChange={(event) => {
                                    setRow(index, { name: event.target.value });
                                    setKeyword(event.target.value);
                                }}
                            />
                            <Input
                                type="number"
                                min={0}
                                step="0.001"
                                value={row.amount}
                                placeholder={t("field.ingredientAmount")}
                                aria-label={t("field.ingredientAmount")}
                                onChange={(event) => setRow(index, { amount: event.target.value })}
                            />
                            <Input
                                value={row.unit}
                                maxLength={30}
                                placeholder={t("field.ingredientUnitPlaceholder")}
                                aria-label={t("field.ingredientUnit")}
                                onChange={(event) => setRow(index, { unit: event.target.value })}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t("field.removeIngredient")}
                                disabled={rows.length === 1}
                                onClick={() => {
                                    setRows((prev) => prev.filter((_, i) => i !== index));
                                    // Index lỗi đổi sau khi xoá — bỏ hết để không báo nhầm dòng.
                                    setRowErrors({});
                                }}
                            >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            {rowErrors[index] && (
                                <p role="alert" className="text-sm text-destructive sm:col-span-4">
                                    {rowErrors[index]}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* ponytail: một <datalist> dùng chung cho mọi dòng — gợi ý theo
                    dòng đang gõ cuối cùng, không phải từng ô. Đủ cho ≤50 dòng. */}
                <datalist id="ingredient-options">
                    {suggestions.data?.map((item) => (
                        <option key={item.id} value={item.name} />
                    ))}
                </datalist>

                <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    disabled={rows.length >= MAX_INGREDIENTS}
                    onClick={() => setRows((prev) => [...prev, { ...EMPTY_ROW }])}
                >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("field.addIngredient")}
                </Button>
            </SectionCard>

            <SectionCard eyebrow={t("section.stepsEyebrow")} title={t("section.stepsTitle")}>
                <div className="space-y-4">
                    <FormField
                        label={t("field.instructions")}
                        htmlFor="recipe-instructions"
                        required
                        error={formik.errors.instructions}
                    >
                        <Textarea
                            id="recipe-instructions"
                            name="instructions"
                            rows={6}
                            value={formik.values.instructions}
                            placeholder={t("field.instructionsPlaceholder")}
                            aria-invalid={!!formik.errors.instructions}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                    </FormField>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            label={t("field.servings")}
                            htmlFor="recipe-servings"
                            required
                            error={formik.errors.servings}
                        >
                            <Input
                                id="recipe-servings"
                                name="servings"
                                type="number"
                                min={1}
                                value={formik.values.servings}
                                aria-invalid={!!formik.errors.servings}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </FormField>

                        <FormField
                            label={t("field.difficulty")}
                            htmlFor="recipe-difficulty"
                            helper={t("section.optional")}
                        >
                            <Select
                                id="recipe-difficulty"
                                name="difficulty"
                                value={formik.values.difficulty}
                                onChange={formik.handleChange}
                            >
                                <option value="">{t("field.difficultyNone")}</option>
                                {DIFFICULTIES.map((value) => (
                                    <option key={value} value={value}>
                                        {t(`field.difficulty${value}`)}
                                    </option>
                                ))}
                            </Select>
                        </FormField>

                        <FormField
                            label={t("field.prepTime")}
                            htmlFor="recipe-prep"
                            error={formik.errors.prepTimeMinutes}
                        >
                            <Input
                                id="recipe-prep"
                                name="prepTimeMinutes"
                                type="number"
                                min={0}
                                value={formik.values.prepTimeMinutes}
                                aria-invalid={!!formik.errors.prepTimeMinutes}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </FormField>

                        <FormField
                            label={t("field.cookTime")}
                            htmlFor="recipe-cook"
                            error={formik.errors.cookTimeMinutes}
                        >
                            <Input
                                id="recipe-cook"
                                name="cookTimeMinutes"
                                type="number"
                                min={0}
                                value={formik.values.cookTimeMinutes}
                                aria-invalid={!!formik.errors.cookTimeMinutes}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </FormField>
                    </div>
                </div>
            </SectionCard>

            <div className="flex flex-wrap justify-end gap-2">
                {!embedded && (
                    <Button variant="outline" onClick={() => navigate("/meal-plan")}>
                        {t("action.cancel")}
                    </Button>
                )}
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {mutation.isPending ? t("action.saving") : t("action.submit")}
                </Button>
            </div>
        </form>
    );
}
