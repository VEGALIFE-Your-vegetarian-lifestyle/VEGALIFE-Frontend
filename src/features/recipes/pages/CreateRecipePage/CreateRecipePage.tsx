 import { useMemo, type ReactNode } from "react";
import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, Leaf, ListChecks, Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormField";
import { SectionCard } from "@/components/common/SectionCard";
import { cn } from "@/shared/utils/cn";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { searchDishes } from "@/shared/api/dishes";
import type { Dish } from "@/shared/types/dish";
import { createRecipe } from "../../api";
import { AutocompleteField } from "./AutocompleteField";
import { IngredientEditor } from "./IngredientEditor";
import { StepEditor } from "./StepEditor";
import { RecipeSidebar, type ReadinessItem } from "./RecipeSidebar";
import {
    DIFFICULTIES,
    MAX_INGREDIENTS,
    MAX_NAME_LENGTH,
    buildRecipeSchema,
    difficultyRankKey,
    duplicateIngredientIndexes,
    emptyIngredient,
    emptyStep,
    initialRecipeValues,
    visibleSteps,
    type RecipeFormValues,
    type RecipeStep,
} from "./schema";
import { buildRecipePayload } from "./payload";

const FORM_ID = "create-recipe-form";

/** Sá»‘ tá»« cá»§a mÃ´ táº£ â€” mockup hiá»‡n á»Ÿ gÃ³c pháº£i dÆ°á»›i Ã´ ghi chÃº. */
function countWords(text: string): number {
    return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

/** Badge sá»‘ thá»© tá»± khá»‘i â€” Ã´ vuÃ´ng xanh, sá»‘ 2 chá»¯ sá»‘ (mockup: "01"). */
function SectionBadge({ step }: { step: number }) {
    return (
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-vegan-green text-xs font-bold text-white">
            {String(step).padStart(2, "0")}
        </span>
    );
}

/** Panel con trong khá»‘i "Servings & Cook Time" â€” ná»n tráº¯ng trÃªn ná»n xÃ¡m cá»§a khá»‘i. */
function Panel({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
    return (
        <div className={cn("rounded-2xl border border-border bg-surface p-4", className)}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            {children}
        </div>
    );
}

export default function CreateRecipePage() {
    // `validation` cáº§n cho cÃ¡c message dÃ¹ng chung trong `buildRecipeSchema`.
    const { t } = useTranslation(["recipe", "validation", "common"]);
    const navigate = useNavigate();

    const validationSchema = useMemo(() => buildRecipeSchema(t), [t]);

    const createMutation = useMutation({
        mutationFn: (values: RecipeFormValues) => createRecipe(buildRecipePayload(values)),
        onSuccess: () => {
            toast.success(t("recipe:toast.created"));
            navigate("/recipes");
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("recipe:toast.failed")));
        },
    });

    const formik = useFormik<RecipeFormValues>({
        initialValues: initialRecipeValues(),
        validationSchema,
        // TrÃ¹ng tÃªn cáº§n so cáº£ máº£ng nÃªn khÃ´ng Ä‘áº·t á»Ÿ Yup field-level â€” cháº·n á»Ÿ Ä‘Ã¢y.
        // HÃ ng trÃ¹ng Ä‘Ã£ Ä‘Æ°á»£c tÃ´ Ä‘á» sáºµn bá»Ÿi `duplicateIngredientIndexes`.
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

    // Formik gom lá»—i máº£ng thÃ nh `errors.ingredients[index]` â€” page chá»‰ cáº§n Ä‘áº©y xuá»‘ng editor.
    const ingredientErrors = Array.isArray(formik.errors.ingredients)
        ? (formik.errors.ingredients as unknown as Array<{ name?: string; amount?: string; unit?: string } | undefined>)
        : undefined;
    const ingredientTouched = Array.isArray(formik.touched.ingredients)
        ? (formik.touched.ingredients as unknown as Array<{ name?: boolean; amount?: boolean; unit?: boolean } | undefined>)
        : undefined;

    const setSteps = (steps: RecipeStep[]) => formik.setFieldValue("steps", steps);

    const addStep = () => setSteps([...formik.values.steps, emptyStep()]);

    const removeStep = (index: number) => setSteps(formik.values.steps.filter((_, itemIndex) => itemIndex !== index));

    /** Äá»•i thá»© tá»± = Ä‘á»•i vá»‹ trÃ­ trong máº£ng; chuá»—i `instructions` gá»­i lÃªn theo Ä‘Ãºng thá»© tá»± nÃ y. */
    const moveStep = (index: number, delta: number) => {
        const target = index + delta;
        if (target < 0 || target >= formik.values.steps.length) return;
        const next = [...formik.values.steps];
        [next[index], next[target]] = [next[target], next[index]];
        setSteps(next);
    };

    const stepErrors = Array.isArray(formik.errors.steps)
        ? (formik.errors.steps as unknown as Array<string | undefined>)
        : undefined;

    const { values } = formik;
    const filledIngredients = values.ingredients.filter(
        (item) => item.name.trim() && item.amount.trim() && item.unit.trim(),
    ).length;
    const steps = visibleSteps(values.steps).length;
    const words = countWords(values.description);
    const servings = Number(values.servings) || 0;
    const prepMinutes = Number(values.prepTimeMinutes) || 0;
    const cookMinutes = Number(values.cookTimeMinutes) || 0;
    const totalMinutes = prepMinutes + cookMinutes;
    const hasTime = values.prepTimeMinutes.trim() !== "" || values.cookTimeMinutes.trim() !== "";

    const stepServings = (delta: number) => {
        const next = Math.max(1, servings + delta);
        formik.setFieldValue("servings", String(next));
        formik.setFieldTouched("servings", true);
    };

    // Chá»‰ pháº£n há»“i tá»©c thÃ¬ cho ngÆ°á»i nháº­p liá»‡u â€” khÃ´ng pháº£i Ä‘iá»u kiá»‡n gá»­i.
    const readiness: ReadinessItem[] = [
        {
            key: "name",
            label: t("recipe:readiness.name"),
            value: values.name.trim() && values.dishName.trim()
                ? t("recipe:readiness.value.valid")
                : t("recipe:readiness.value.missing"),
            done: values.name.trim().length > 0 && values.dishName.trim().length > 0,
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
            value: t("recipe:readiness.value.phases", { count: steps }),
            done: steps > 0,
        },
        {
            key: "servings",
            label: t("recipe:readiness.servings"),
            value: servings >= 1 && hasTime ? t("recipe:readiness.value.configured") : t("recipe:readiness.value.missing"),
            done: servings >= 1 && hasTime,
        },
    ];
    const doneCount = readiness.filter((item) => item.done).length;
    const percent = Math.round((doneCount / readiness.length) * 100);

    return (
        <div className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
            {/* Khá»‘i Ä‘áº§u trang: breadcrumb + dáº£i tráº¡ng thÃ¡i (mockup khÃ´ng cÃ³ H1).
                NÃºt Cancel/Create Recipe náº±m dÆ°á»›i checklist á»Ÿ cá»™t pháº£i. */}
            <header className="mb-6 space-y-3">
                <nav aria-label="breadcrumb">
                    <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                        <li>{t("common:home")}</li>
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                        <li>
                            <Link to="/my-posts" className="hover:text-vegan-green">
                                {t("recipe:breadcrumb")}
                            </Link>
                        </li>
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                        <li aria-current="page" className="font-medium text-dark">
                            {t("recipe:title")}
                        </li>
                    </ol>
                </nav>
                {/* Dáº£i tráº¡ng thÃ¡i â€” cáº£ 2 chip Ä‘á»u suy tá»« giÃ¡ trá»‹ form, khÃ´ng cÃ³ sá»‘ bá»‹a. */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full bg-vegan-green-light px-3 py-1 text-xs font-semibold text-vegan-green">
                        <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("recipe:readiness.value.phases", { count: steps })}
                    </span>
                    <span className="flex items-center gap-1.5 rounded-full bg-lavender px-3 py-1 text-xs font-semibold text-lavender-strong">
                        <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("recipe:readiness.percent", { percent })}
                    </span>
                </div>
            </header>

            <form id={FORM_ID} onSubmit={formik.handleSubmit} noValidate>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-5">
                        <SectionCard
                            inlineHeader
                            eyebrow={<SectionBadge step={1} />}
                            title={t("recipe:section.overview")}
                            subtitle={t("recipe:section.overviewHint")}
                            aside={
                                <span className="text-xs tabular-nums text-muted-foreground">
                                    {t("recipe:counter.characters", {
                                        count: values.name.length,
                                        max: MAX_NAME_LENGTH,
                                    })}
                                </span>
                            }
                        >
                            <div className="space-y-4">
                                <FormField
                                    label={t("recipe:field.name")}
                                    htmlFor="recipe-name"
                                    required
                                    error={formik.touched.name ? formik.errors.name : undefined}
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

                                {/* BE khÃ´ng cÃ³ `categoryId` â€” tÃªn mÃ³n dÃ¹ng chung lÃ  thá»© gáº§n nháº¥t. */}
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
                                        rows={5}
                                        value={values.description}
                                        placeholder={t("recipe:placeholder.description")}
                                        onChange={formik.handleChange}
                                    />
                                </FormField>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                    <p>{t("recipe:hint.description")}</p>
                                    <p className="tabular-nums">{t("recipe:counter.words", { count: words })}</p>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard
                            inlineHeader
                            eyebrow={<SectionBadge step={2} />}
                            title={t("recipe:section.ingredients")}
                            subtitle={t("recipe:section.ingredientsHint")}
                            aside={
                                <span className="flex items-center gap-1.5 rounded-full bg-muted-bg px-3 py-1 text-xs font-semibold text-dark">
                                    <span className="h-1.5 w-1.5 rounded-full bg-vegan-green" aria-hidden="true" />
                                    {t("recipe:ingredient.itemCount", {
                                        count: values.ingredients.length,
                                        max: MAX_INGREDIENTS,
                                    })}
                                </span>
                            }
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
                            inlineHeader
                            eyebrow={<SectionBadge step={3} />}
                            title={t("recipe:section.instructions")}
                            subtitle={t("recipe:section.instructionsHint")}
                        >
                            {/* Ná»n xÃ¡m Ä‘á»ƒ má»—i Ã´ bÆ°á»›c (ná»n tráº¯ng) ná»•i lÃªn nhÆ° mockup. */}
                            <div className="rounded-2xl bg-muted-bg p-4">
                                <StepEditor
                                    steps={values.steps}
                                    errors={stepErrors}
                                    onChange={(index, field, value) =>
                                        formik.setFieldValue(`steps.${index}.${field}`, value)
                                    }
                                    onAdd={addStep}
                                    onRemove={removeStep}
                                    onMove={moveStep}
                                />
                            </div>
                        </SectionCard>

                        {/* Mockup gá»™p "kháº©u pháº§n & thá»i gian" vÃ  "Ä‘á»™ khÃ³" vÃ o **má»™t** khá»‘i. */}
                        <SectionCard
                            inlineHeader
                            eyebrow={<SectionBadge step={4} />}
                            title={t("recipe:section.details")}
                            subtitle={t("recipe:section.detailsHint")}
                        >
                            <div className="rounded-2xl bg-muted-bg p-4">
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    <Panel label={t("recipe:field.servings")}>
                                        <div className="mt-2 flex items-center justify-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="iconSm"
                                                className="rounded-full"
                                                aria-label={t("recipe:servings.decrease")}
                                                disabled={servings <= 1}
                                                onClick={() => stepServings(-1)}
                                            >
                                                <Minus className="h-4 w-4" aria-hidden="true" />
                                            </Button>
                                            <Input
                                                id="recipe-servings"
                                                name="servings"
                                                inputMode="numeric"
                                                className="h-12 w-16 border-0 bg-transparent p-0 text-center text-3xl font-bold shadow-none focus-visible:ring-0 sm:text-3xl"
                                                value={values.servings}
                                                aria-invalid={Boolean(formik.touched.servings && formik.errors.servings)}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="iconSm"
                                                className="rounded-full"
                                                aria-label={t("recipe:servings.increase")}
                                                onClick={() => stepServings(1)}
                                            >
                                                <Plus className="h-4 w-4" aria-hidden="true" />
                                            </Button>
                                        </div>
                                        <p className="mt-2 text-center text-xs text-muted-foreground">
                                            {t("recipe:servings.helper")}
                                        </p>
                                    </Panel>

                                    <Panel label={t("recipe:field.prepTime")}>
                                        <div className="mt-2 flex items-baseline justify-center gap-1">
                                            <Input
                                                id="recipe-prep"
                                                name="prepTimeMinutes"
                                                inputMode="numeric"
                                                className="h-12 w-16 rounded-lg border-0 bg-muted p-0 text-center text-3xl font-bold shadow-none focus-visible:ring-2 focus-visible:ring-vegan-green sm:text-3xl"
                                                value={values.prepTimeMinutes}
                                                aria-invalid={Boolean(
                                                    formik.touched.prepTimeMinutes && formik.errors.prepTimeMinutes,
                                                )}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {t("recipe:time.minutesShort")}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-center text-xs text-muted-foreground">
                                            {t("recipe:time.prepHelper")}
                                        </p>
                                    </Panel>

                                    <Panel label={t("recipe:field.cookTime")}>
                                        <div className="mt-2 flex items-baseline justify-center gap-1">
                                            <Input
                                                id="recipe-cook"
                                                name="cookTimeMinutes"
                                                inputMode="numeric"
                                                className="h-12 w-16 rounded-lg border-0 bg-muted p-0 text-center text-3xl font-bold shadow-none focus-visible:ring-2 focus-visible:ring-vegan-green sm:text-3xl"
                                                value={values.cookTimeMinutes}
                                                aria-invalid={Boolean(
                                                    formik.touched.cookTimeMinutes && formik.errors.cookTimeMinutes,
                                                )}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {t("recipe:time.minutesShort")}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-center text-xs text-muted-foreground">
                                            {t("recipe:time.cookHelper")}
                                        </p>
                                    </Panel>

                                    <Panel label={t("recipe:field.totalTime")}>
                                        <div className="mt-2 flex items-center justify-between gap-2">
                                            <span className="text-sm font-semibold text-dark">
                                                {t("recipe:field.difficulty")}
                                            </span>
                                            <span className="rounded-full bg-vegan-green-light px-3 py-1 text-xs font-bold text-vegan-green">
                                                {hasTime
                                                    ? `${totalMinutes}m`
                                                    : t("recipe:readiness.value.missing")}
                                            </span>
                                        </div>
                                        <div
                                            id="recipe-difficulty"
                                            role="group"
                                            aria-label={t("recipe:field.difficulty")}
                                            className="mt-2 flex gap-1"
                                        >
                                            {DIFFICULTIES.map((level) => {
                                                const active = values.difficulty === level;
                                                return (
                                                    <button
                                                        key={level}
                                                        type="button"
                                                        aria-pressed={active}
                                                        onClick={() => {
                                                            formik.setFieldValue("difficulty", active ? "" : level);
                                                            formik.setFieldTouched("difficulty", true);
                                                        }}
                                                        className={cn(
                                                            "h-9 flex-1 rounded-lg border text-xs font-semibold transition",
                                                            active
                                                                ? "border-vegan-green bg-vegan-green text-white"
                                                                : "border-border bg-surface text-muted-foreground hover:border-vegan-green-muted hover:text-vegan-green",
                                                        )}
                                                    >
                                                        {t(`recipe:difficulty.${level}`)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className="mt-2 text-center text-xs text-muted-foreground">
                                            {t(`recipe:readiness.rank.${difficultyRankKey(values.difficulty)}`)}
                                        </p>
                                    </Panel>
                                </div>
                            </div>
                        </SectionCard>
                    </div>

                    <RecipeSidebar
                        items={readiness}
                        percent={percent}
                        values={values}
                        // Sidebar náº±m trong <form> nÃªn nÃºt submit á»Ÿ Ä‘Ã¢y váº«n gá»­i Ä‘Ãºng form.
                        actions={
                            <div className="space-y-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    shape="pill"
                                    block
                                    onClick={() => navigate(-1)}
                                    disabled={isSubmitting}
                                >
                                    {t("recipe:action.cancel")}
                                </Button>
                                <Button type="submit" shape="pill" block disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                                    {isSubmitting ? t("recipe:action.submitting") : t("recipe:action.submit")}
                                </Button>
                            </div>
                        }
                    />
                </div>
            </form>
        </div>
    );
}
