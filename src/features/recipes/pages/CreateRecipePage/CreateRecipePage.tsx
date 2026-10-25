import { useMemo } from "react";
import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Clock, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { createRecipe, searchDishes } from "../../api";
import type { Dish } from "../../types";
import { AutocompleteField } from "./AutocompleteField";
import { IngredientEditor } from "./IngredientEditor";
import { RecipeSidebar, type ReadinessItem } from "./RecipeSidebar";
import {
    DIFFICULTIES,
    MAX_NAME_LENGTH,
    buildRecipeSchema,
    duplicateIngredientIndexes,
    emptyIngredient,
    initialRecipeValues,
    type RecipeFormValues,
} from "./schema";
import { buildRecipePayload } from "./payload";

const FORM_ID = "create-recipe-form";

/** Đếm bước: mỗi dòng không rỗng là một bước (khớp cách người dùng gõ "mỗi bước một dòng"). */
function countSteps(instructions: string): number {
    return instructions.split("\n").filter((line) => line.trim() !== "").length;
}

export default function CreateRecipePage() {
    // `validation` cần cho các message dùng chung trong `buildRecipeSchema`.
    const { t } = useTranslation(["recipe", "validation", "common"]);
    const navigate = useNavigate();

    const validationSchema = useMemo(() => buildRecipeSchema(t), [t]);

    const createMutation = useMutation({
        mutationFn: (values: RecipeFormValues) => createRecipe(buildRecipePayload(values)),
        onSuccess: () => {
            toast.success(t("recipe:toast.created"));
            // ponytail: chưa có trang danh sách recipe — tạm về My Posts. Đổi sang
            // `/recipes/:id` khi có GET /api/recipes.
            navigate("/my-posts");
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("recipe:toast.failed")));
        },
    });

    const formik = useFormik<RecipeFormValues>({
        initialValues: initialRecipeValues(),
        validationSchema,
        // Trùng tên cần so cả mảng nên không đặt ở Yup field-level — chặn ở đây.
        // Hàng trùng đã được tô đỏ sẵn bởi `duplicateIngredientIndexes`.
        onSubmit: (values) => {
            if (duplicateIngredientIndexes(values.ingredients).length > 0) {
                toast.error(t("recipe:errors.ingredientDuplicate"));
                return;
            }
            createMutation.mutate(values);
        },
    });

    const duplicates = duplicateIngredientIndexes(formik.values.ingredients);
    const isSubmitting = createMutation.isPending;

    const addIngredient = () => formik.setFieldValue("ingredients", [...formik.values.ingredients, emptyIngredient()]);

    const removeIngredient = (index: number) =>
        formik.setFieldValue(
            "ingredients",
            formik.values.ingredients.filter((_, itemIndex) => itemIndex !== index),
        );

    // Formik gom lỗi mảng thành `errors.ingredients[index]` — page chỉ cần đẩy xuống editor.
    const ingredientErrors = Array.isArray(formik.errors.ingredients)
        ? (formik.errors.ingredients as unknown as Array<{ name?: string; amount?: string; unit?: string } | undefined>)
        : undefined;
    const ingredientTouched = Array.isArray(formik.touched.ingredients)
        ? (formik.touched.ingredients as unknown as Array<{ name?: boolean; amount?: boolean; unit?: boolean } | undefined>)
        : undefined;

    const { values } = formik;
    const filledIngredients = values.ingredients.filter(
        (item) => item.name.trim() && item.amount.trim() && item.unit.trim(),
    ).length;
    const steps = countSteps(values.instructions);

    // Chỉ phản hồi tức thì cho người nhập liệu — không phải điều kiện gửi.
    const readiness: ReadinessItem[] = [
        {
            key: "name",
            label: t("recipe:readiness.name"),
            value: t("recipe:readiness.value.valid"),
            done: values.name.trim().length > 0,
        },
        {
            key: "dish",
            label: t("recipe:readiness.dish"),
            value: t("recipe:readiness.value.assigned"),
            done: values.dishName.trim().length > 0,
        },
        {
            key: "ingredients",
            label: t("recipe:readiness.ingredients"),
            value: t("recipe:readiness.value.items", { count: filledIngredients }),
            done:
                filledIngredients > 0 &&
                filledIngredients === values.ingredients.length &&
                duplicates.length === 0,
        },
        {
            key: "instructions",
            label: t("recipe:readiness.instructions"),
            value: t("recipe:readiness.value.provided"),
            done: values.instructions.trim().length > 0,
        },
        {
            key: "servings",
            label: t("recipe:readiness.servings"),
            value: t("recipe:readiness.value.servings", { count: Number(values.servings) || 0 }),
            done: Number(values.servings) >= 1,
        },
    ];

    const payloadPreview = buildRecipePayload(values);

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                breadcrumb={[t("common:home"), t("recipe:breadcrumb"), t("recipe:title")]}
                title={t("recipe:title")}
                action={
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
                            {t("recipe:action.cancel")}
                        </Button>
                        <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : null}
                            {isSubmitting ? t("recipe:action.submitting") : t("recipe:action.submit")}
                        </Button>
                    </div>
                }
            />

            <form id={FORM_ID} onSubmit={formik.handleSubmit} noValidate>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-5">
                        <SectionCard eyebrow={t("recipe:sectionLabel", { letter: "A" })} title={t("recipe:section.basic")}>
                            <div className="space-y-4">
                                <FormField
                                    label={t("recipe:field.name")}
                                    htmlFor="recipe-name"
                                    required
                                    helper={t("recipe:hint.name")}
                                    error={formik.touched.name ? formik.errors.name : undefined}
                                    aside={
                                        <span className="text-xs tabular-nums text-muted-foreground">
                                            {t("recipe:counter.characters", {
                                                count: values.name.length,
                                                max: MAX_NAME_LENGTH,
                                            })}
                                        </span>
                                    }
                                >
                                    <Input
                                        id="recipe-name"
                                        name="name"
                                        value={values.name}
                                        placeholder={t("recipe:placeholder.name")}
                                        aria-invalid={Boolean(formik.touched.name && formik.errors.name)}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                </FormField>

                                <FormField
                                    label={t("recipe:field.dishName")}
                                    htmlFor="recipe-dish"
                                    required
                                    helper={t("recipe:hint.autocomplete")}
                                    error={formik.touched.dishName ? formik.errors.dishName : undefined}
                                >
                                    <AutocompleteField<Dish>
                                        id="recipe-dish"
                                        value={values.dishName}
                                        onChange={(value) => formik.setFieldValue("dishName", value)}
                                        onBlur={() => formik.setFieldTouched("dishName", true)}
                                        placeholder={t("recipe:placeholder.dishName")}
                                        invalid={Boolean(formik.touched.dishName && formik.errors.dishName)}
                                        queryKey="recipe-dish-suggestions"
                                        search={(name) => searchDishes({ name, size: 8 })}
                                        getLabel={(dish) => dish.name}
                                        emptyLabel={t("recipe:hint.noSuggestions")}
                                    />
                                </FormField>

                                <FormField label={t("recipe:field.description")} htmlFor="recipe-description">
                                    <Textarea
                                        id="recipe-description"
                                        name="description"
                                        rows={4}
                                        value={values.description}
                                        placeholder={t("recipe:placeholder.description")}
                                        onChange={formik.handleChange}
                                    />
                                </FormField>
                            </div>
                        </SectionCard>

                        <SectionCard
                            eyebrow={t("recipe:sectionLabel", { letter: "B" })}
                            title={t("recipe:section.ingredients")}
                        >
                            <IngredientEditor
                                items={values.ingredients}
                                errors={ingredientErrors}
                                touched={ingredientTouched}
                                duplicates={duplicates}
                                onChange={(index, field, value) =>
                                    formik.setFieldValue(`ingredients.${index}.${field}`, value)
                                }
                                onBlur={(index, field) => formik.setFieldTouched(`ingredients.${index}.${field}`, true)}
                                onAdd={addIngredient}
                                onRemove={removeIngredient}
                            />
                        </SectionCard>

                        <SectionCard
                            eyebrow={t("recipe:sectionLabel", { letter: "C" })}
                            title={t("recipe:section.instructions")}
                        >
                            <FormField
                                label={t("recipe:field.instructions")}
                                htmlFor="recipe-instructions"
                                required
                                helper={t("recipe:hint.instructions")}
                                error={formik.touched.instructions ? formik.errors.instructions : undefined}
                                aside={
                                    <span className="text-xs tabular-nums text-muted-foreground">
                                        {t("recipe:counter.steps", {
                                            steps,
                                            characters: values.instructions.length,
                                        })}
                                    </span>
                                }
                            >
                                <Textarea
                                    id="recipe-instructions"
                                    name="instructions"
                                    rows={12}
                                    value={values.instructions}
                                    placeholder={t("recipe:placeholder.instructions")}
                                    aria-invalid={Boolean(formik.touched.instructions && formik.errors.instructions)}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                />
                            </FormField>
                        </SectionCard>

                        <SectionCard eyebrow={t("recipe:sectionLabel", { letter: "D" })} title={t("recipe:section.details")}>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                                        leadingIcon={Users}
                                        value={values.servings}
                                        aria-invalid={Boolean(formik.touched.servings && formik.errors.servings)}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                </FormField>

                                <FormField
                                    label={t("recipe:field.prepTime")}
                                    htmlFor="recipe-prep"
                                    error={formik.touched.prepTimeMinutes ? formik.errors.prepTimeMinutes : undefined}
                                >
                                    <Input
                                        id="recipe-prep"
                                        name="prepTimeMinutes"
                                        inputMode="numeric"
                                        leadingIcon={Clock}
                                        value={values.prepTimeMinutes}
                                        aria-invalid={Boolean(
                                            formik.touched.prepTimeMinutes && formik.errors.prepTimeMinutes,
                                        )}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
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
                                        leadingIcon={Clock}
                                        value={values.cookTimeMinutes}
                                        aria-invalid={Boolean(
                                            formik.touched.cookTimeMinutes && formik.errors.cookTimeMinutes,
                                        )}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                </FormField>

                                <FormField label={t("recipe:field.difficulty")} htmlFor="recipe-difficulty">
                                    <Select
                                        id="recipe-difficulty"
                                        name="difficulty"
                                        value={values.difficulty}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    >
                                        <option value="">—</option>
                                        {DIFFICULTIES.map((level) => (
                                            <option key={level} value={level}>
                                                {t(`recipe:difficulty.${level}`)}
                                            </option>
                                        ))}
                                    </Select>
                                </FormField>
                            </div>
                        </SectionCard>
                    </div>

                    <RecipeSidebar items={readiness} submitting={isSubmitting} payload={payloadPreview} />
                </div>
            </form>
        </div>
    );
}
