import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormField";
import { DIFFICULTIES } from "../../pages/CreateRecipePage/schema";
import type { AdminRecipe, AdminRecipeUpdateRequest } from "../../types";
import { buildRecipePatch, toForm, type RecipeEditValues } from "./editRecipeForm";

/** Khớp backend: `name` ≤255, `description` ≤2000, `instructions` ≤20000. */
const MAX_NAME = 255;
const MAX_DESCRIPTION = 2000;
const MAX_INSTRUCTIONS = 20000;

type FormValues = RecipeEditValues;

function EditForm({
    recipe,
    loading,
    onSubmit,
    onClose,
}: {
    recipe: AdminRecipe;
    loading: boolean;
    onSubmit: (patch: AdminRecipeUpdateRequest) => void;
    onClose: () => void;
}) {
    const { t } = useTranslation(["admin", "recipe", "validation"]);
    const initial = toForm(recipe);

    const schema = Yup.object({
        name: Yup.string()
            .trim()
            .required(t("validation:required"))
            .max(MAX_NAME, t("validation:maxLength", { count: MAX_NAME })),
        description: Yup.string().max(MAX_DESCRIPTION, t("validation:maxLength", { count: MAX_DESCRIPTION })),
        instructions: Yup.string()
            .trim()
            .required(t("validation:required"))
            .max(MAX_INSTRUCTIONS, t("validation:maxLength", { count: MAX_INSTRUCTIONS })),
        // Rỗng = giữ nguyên giá trị cũ, nên chỉ validate khi có nhập.
        prepTimeMinutes: Yup.string()
            .trim()
            .test("minutes", t("recipe:errors.minutesInvalid"), (v) => !v || /^\d+$/.test(v)),
        cookTimeMinutes: Yup.string()
            .trim()
            .test("minutes", t("recipe:errors.minutesInvalid"), (v) => !v || /^\d+$/.test(v)),
        servings: Yup.string()
            .required(t("validation:required"))
            .test("servings", t("recipe:errors.servingsMin"), (v) => !!v && /^\d+$/.test(v.trim()) && Number(v) >= 1),
        difficulty: Yup.string().oneOf([...DIFFICULTIES, ""]),
    });

    const formik = useFormik<FormValues>({
        initialValues: initial,
        validationSchema: schema,
        onSubmit: (values) => {
            const patch = buildRecipePatch(initial, values);
            if (!patch) {
                onClose();
                return;
            }
            onSubmit(patch);
        },
    });

    return (
        <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
            <FormField
                label={t("recipe:field.name")}
                htmlFor="recipe-name"
                required
                error={formik.touched.name ? formik.errors.name : undefined}
            >
                <Input
                    id="recipe-name"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-invalid={formik.touched.name && !!formik.errors.name}
                />
            </FormField>

            <FormField
                label={t("recipe:field.dishName")}
                htmlFor="recipe-dish"
                helper={t("recipes.edit.dishLocked")}
            >
                {/* `dishName` không nằm trong `AdminRecipeUpdateRequest` — hiện chỉ đọc. */}
                <Input id="recipe-dish" value={recipe.dishName ?? "—"} disabled readOnly />
            </FormField>

            <FormField
                label={t("recipe:field.description")}
                htmlFor="recipe-description"
                error={formik.touched.description ? formik.errors.description : undefined}
            >
                <Textarea
                    id="recipe-description"
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-invalid={formik.touched.description && !!formik.errors.description}
                />
            </FormField>

            <FormField
                label={t("recipes.detail.instructions")}
                htmlFor="recipe-instructions"
                required
                error={formik.touched.instructions ? formik.errors.instructions : undefined}
            >
                {/* Mỗi bước một dòng — cùng định dạng `joinSteps` ở form tạo recipe. */}
                <Textarea
                    id="recipe-instructions"
                    name="instructions"
                    className="min-h-[180px]"
                    value={formik.values.instructions}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-invalid={formik.touched.instructions && !!formik.errors.instructions}
                />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                    label={t("recipe:field.prepTime")}
                    htmlFor="recipe-prep"
                    error={formik.touched.prepTimeMinutes ? formik.errors.prepTimeMinutes : undefined}
                >
                    <Input
                        id="recipe-prep"
                        name="prepTimeMinutes"
                        inputMode="numeric"
                        value={formik.values.prepTimeMinutes}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        aria-invalid={formik.touched.prepTimeMinutes && !!formik.errors.prepTimeMinutes}
                    />
                </FormField>

                <FormField
                    label={t("recipe:field.cookTime")}
                    htmlFor="recipe-cook"
                    error={formik.touched.cookTimeMinutes ? formik.errors.cookTimeMinutes : undefined}
                >
                    <Input
                        id="recipe-cook"
                        name="cookTimeMinutes"
                        inputMode="numeric"
                        value={formik.values.cookTimeMinutes}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        aria-invalid={formik.touched.cookTimeMinutes && !!formik.errors.cookTimeMinutes}
                    />
                </FormField>

                <FormField
                    label={t("recipe:field.servings")}
                    htmlFor="recipe-servings"
                    required
                    error={formik.touched.servings ? formik.errors.servings : undefined}
                >
                    <Input
                        id="recipe-servings"
                        name="servings"
                        inputMode="numeric"
                        value={formik.values.servings}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        aria-invalid={formik.touched.servings && !!formik.errors.servings}
                    />
                </FormField>
            </div>

            <FormField label={t("recipe:field.difficulty")} htmlFor="recipe-difficulty">
                <Select
                    id="recipe-difficulty"
                    name="difficulty"
                    value={formik.values.difficulty}
                    onChange={formik.handleChange}
                >
                    <option value="">{t("recipes.edit.difficultyKeep")}</option>
                    {DIFFICULTIES.map((item) => (
                        <option key={item} value={item}>
                            {t(`recipe:difficulty.${item}`)}
                        </option>
                    ))}
                </Select>
            </FormField>

            <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {t("recipes.edit.ingredientsLocked")}
            </p>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    {t("common:cancel")}
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? t("recipes.edit.saving") : t("recipes.edit.submit")}
                </Button>
            </div>
        </form>
    );
}

interface EditRecipeDialogProps {
    /** `null` = đóng. */
    recipe: AdminRecipe | null;
    loading: boolean;
    onSubmit: (patch: AdminRecipeUpdateRequest) => void;
    onClose: () => void;
}

export function EditRecipeDialog({ recipe, loading, onSubmit, onClose }: EditRecipeDialogProps) {
    const { t } = useTranslation("admin");

    return (
        <Dialog
            open={recipe !== null}
            onClose={onClose}
            title={t("recipes.edit.title")}
            description={recipe ? t("recipes.edit.subtitle", { name: recipe.name }) : undefined}
            className="max-w-2xl"
        >
            {/* `key` để formik dựng lại state khi mở recipe khác. */}
            {recipe && (
                <EditForm
                    key={recipe.id}
                    recipe={recipe}
                    loading={loading}
                    onSubmit={onSubmit}
                    onClose={onClose}
                />
            )}
        </Dialog>
    );
}
