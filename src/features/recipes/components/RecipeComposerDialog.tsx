import { useMemo, useState } from "react";
import { useFormik } from "formik";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/common/FormField";
import { SectionCard } from "@/components/common/SectionCard";
import { cn } from "@/shared/utils/cn";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { searchDishes } from "@/shared/api/dishes";
import type { Dish } from "@/shared/types/dish";
import { useUiStore } from "@/shared/ui/uiStore";
import { createRecipe } from "../api";
import { AutocompleteField } from "../pages/CreateRecipePage/AutocompleteField";
import { IngredientEditor } from "../pages/CreateRecipePage/IngredientEditor";
import { StepEditor } from "../pages/CreateRecipePage/StepEditor";
import { RecipePreviewCard } from "../pages/CreateRecipePage/RecipePreviewCard";
import {
    DIFFICULTIES,
    MAX_INGREDIENTS,
    MAX_NAME_LENGTH,
    buildRecipeSchema,
    duplicateIngredientIndexes,
    emptyIngredient,
    emptyStep,
    initialRecipeValues,
    visibleSteps,
    type RecipeFormValues,
    type RecipeStep,
} from "../pages/CreateRecipePage/schema";
import { buildRecipePayload } from "../pages/CreateRecipePage/payload";

const FORM_ID = "recipe-composer-form";

/** Badge số thứ tự khối — ô vuông xanh, 2 chữ số ("01"). */
function StepBadge({ step }: { step: number }) {
    return (
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-vegan-green-light text-[11px] font-bold text-vegan-green">
            {String(step).padStart(2, "0")}
        </span>
    );
}

/** Panel con trong khối "Khẩu phần & thời gian". */
function Panel({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-border bg-surface p-3">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            {children}
        </div>
    );
}

/**
 * Dialog tạo công thức — thay route `/recipes/create` (giống `PostComposerDialog` /
 * `MealPlanComposerDialog`). Mount một lần ở `Layout`, mở bằng
 * `useUiStore().openRecipeComposer()`.
 *
 * Bố cục 2 cột theo mockup `stich_design/mockup-create-recipe-dialog.html`:
 * trái là 4 khối form (cuộn), phải là thẻ xem trước + checklist + 2 nút hành động.
 * Sidebar ẩn dưới `lg` — màn hẹp ưu tiên form, preview là phụ.
 */
export function RecipeComposerDialog() {
    const open = useUiStore((state) => state.recipeComposer);
    const close = useUiStore((state) => state.closeRecipeComposer);

    // `key` đặt lại toàn bộ form mỗi lần mở — không cần tự reset state.
    if (!open) return null;
    return <RecipeComposer onClose={close} />;
}

function RecipeComposer({ onClose }: { onClose: () => void }) {
    const { t } = useTranslation(["recipe", "validation", "common"]);
    const queryClient = useQueryClient();
    const [confirmDiscard, setConfirmDiscard] = useState(false);

    const validationSchema = useMemo(() => buildRecipeSchema(t), [t]);

    const createMutation = useMutation({
        mutationFn: (values: RecipeFormValues) => createRecipe(buildRecipePayload(values)),
        onSuccess: () => {
            toast.success(t("recipe:toast.created"));
            void queryClient.invalidateQueries({ queryKey: ["my-recipes"] });
            onClose();
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("recipe:toast.failed")));
        },
    });

    const formik = useFormik<RecipeFormValues>({
        initialValues: initialRecipeValues(),
        validationSchema,
        // Trùng tên cần so cả mảng nên không đặt ở Yup field-level — chặn ở đây.
        onSubmit: (values) => {
            if (duplicateIngredientIndexes(values.ingredients).length > 0) {
                toast.error(t("recipe:errors.ingredientDuplicate"));
                return;
            }
            createMutation.mutate(values);
        },
    });

    const isSubmitting = createMutation.isPending;
    const { values } = formik;

    const duplicates = duplicateIngredientIndexes(values.ingredients);

    const addIngredient = () => formik.setFieldValue("ingredients", [...values.ingredients, emptyIngredient()]);

    const removeIngredient = (index: number) =>
        formik.setFieldValue(
            "ingredients",
            values.ingredients.filter((_, itemIndex) => itemIndex !== index),
        );

    // Formik gom lỗi mảng thành `errors.ingredients[index]`.
    const ingredientErrors = Array.isArray(formik.errors.ingredients)
        ? (formik.errors.ingredients as unknown as Array<{ name?: string; amount?: string; unit?: string } | undefined>)
        : undefined;
    const ingredientTouched = Array.isArray(formik.touched.ingredients)
        ? (formik.touched.ingredients as unknown as Array<{ name?: boolean; amount?: boolean; unit?: boolean } | undefined>)
        : undefined;

    const setSteps = (steps: RecipeStep[]) => formik.setFieldValue("steps", steps);
    const addStep = () => setSteps([...values.steps, emptyStep()]);
    const removeStep = (index: number) => setSteps(values.steps.filter((_, itemIndex) => itemIndex !== index));

    /** Đổi thứ tự = đổi vị trí trong mảng; chuỗi `instructions` gửi lên theo đúng thứ tự này. */
    const moveStep = (index: number, delta: number) => {
        const target = index + delta;
        if (target < 0 || target >= values.steps.length) return;
        const next = [...values.steps];
        [next[index], next[target]] = [next[target], next[index]];
        setSteps(next);
    };

    const stepErrors = Array.isArray(formik.errors.steps)
        ? (formik.errors.steps as unknown as Array<string | undefined>)
        : undefined;

    // KHÔNG đòi `unit`: nguyên liệu có sẵn lấy đơn vị lưu sẵn ở BE.
    const filledIngredients = values.ingredients.filter((item) => item.name.trim() && item.amount.trim()).length;
    const steps = visibleSteps(values.steps).length;
    const servings = Number(values.servings) || 0;
    const totalMinutes = (Number(values.prepTimeMinutes) || 0) + (Number(values.cookTimeMinutes) || 0);
    const hasTime = values.prepTimeMinutes.trim() !== "" || values.cookTimeMinutes.trim() !== "";

    const stepServings = (delta: number) => {
        formik.setFieldValue("servings", String(Math.max(1, servings + delta)));
        formik.setFieldTouched("servings", true);
    };

    // Checklist chỉ để phản hồi tức thì — nút Lưu khoá theo `formik.isValid`, không theo đây.
    const readiness = [
        {
            key: "name",
            label: t("recipe:readiness.name"),
            value:
                values.name.trim() && values.dishName.trim()
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
            value:
                servings >= 1 && hasTime ? t("recipe:readiness.value.configured") : t("recipe:readiness.value.missing"),
            done: servings >= 1 && hasTime,
        },
    ];
    const percent = Math.round((readiness.filter((item) => item.done).length / readiness.length) * 100);

    /** Đóng khi đã nhập → hỏi lại; `Dialog` gọi hàm này cho Esc lẫn bấm nền. */
    const requestClose = () => {
        if (isSubmitting) return false;
        if (formik.dirty) {
            setConfirmDiscard(true);
            return false;
        }
        return true;
    };

    const handleCancel = () => {
        if (requestClose()) onClose();
    };

    return (
        <>
            <Dialog
                open
                onClose={handleCancel}
                onBeforeClose={requestClose}
                title={t("recipe:section.composerTitle")}
                description={t("recipe:section.composerSubtitle")}
                eyebrow={
                    <span className="text-[11px] font-bold uppercase tracking-wider text-vegan-green">
                        {t("recipe:section.composerEyebrow")}
                    </span>
                }
                className="h-[min(820px,calc(100dvh-2rem))] w-[min(1120px,calc(100%-2rem))] max-h-none max-w-none overflow-hidden max-sm:h-[100dvh] max-sm:w-full max-sm:rounded-none"
                padded={false}
                bodyClassName="flex h-full min-h-0 flex-col p-0"
                headerClassName="mb-0 shrink-0 border-b border-border px-6 pb-4 pt-6"
            >
                <form id={FORM_ID} onSubmit={formik.handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                            <div className="min-w-0 space-y-4">
                                {/* 01 Tổng quan */}
                                <SectionCard
                                    inlineHeader
                                    eyebrow={<StepBadge step={1} />}
                                    title={t("recipe:section.overview")}
                                    subtitle={t("recipe:section.overviewHint")}
                                    aside={
                                        <span className="text-[11px] tabular-nums text-muted-foreground">
                                            {values.name.length} / {MAX_NAME_LENGTH}
                                        </span>
                                    }
                                >
                                    <div className="space-y-3.5">
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

                                        {/* BE không có `categoryId` — tên món dùng chung là thứ gần nhất. */}
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
                                                rows={3}
                                                value={values.description}
                                                placeholder={t("recipe:placeholder.description")}
                                                onChange={formik.handleChange}
                                            />
                                        </FormField>
                                    </div>
                                </SectionCard>

                                {/* 02 Nguyên liệu */}
                                <SectionCard
                                    inlineHeader
                                    eyebrow={<StepBadge step={2} />}
                                    title={t("recipe:section.ingredients")}
                                    subtitle={t("recipe:section.ingredientsHint")}
                                    aside={
                                        <span className="flex items-center gap-1.5 rounded-full bg-muted-bg px-2.5 py-1 text-[11px] font-semibold text-dark">
                                            <span className="h-1.5 w-1.5 rounded-full bg-vegan-green" aria-hidden="true" />
                                            {values.ingredients.length} / {MAX_INGREDIENTS}
                                        </span>
                                    }
                                >
                                    <IngredientEditor
                                        items={values.ingredients}
                                        errors={ingredientErrors}
                                        touched={ingredientTouched}
                                        duplicates={duplicates}
                                        onChange={(index, field, value) => {
                                            formik.setFieldValue(`ingredients.${index}.${field}`, value);
                                            // Sửa tay tên → không còn là nguyên liệu có sẵn, mở lại ô unit.
                                            if (field === "name") {
                                                formik.setFieldValue(`ingredients.${index}.existing`, false);
                                                formik.setFieldValue(`ingredients.${index}.unit`, "");
                                            }
                                        }}
                                        onBlur={(index, field) =>
                                            formik.setFieldTouched(`ingredients.${index}.${field}`, true)
                                        }
                                        onSelectExisting={(index, unit) => {
                                            formik.setFieldValue(`ingredients.${index}.existing`, true);
                                            formik.setFieldValue(`ingredients.${index}.unit`, unit?.toLowerCase() ?? "");
                                        }}
                                        onAdd={addIngredient}
                                        onRemove={removeIngredient}
                                    />
                                </SectionCard>

                                {/* 03 Bước nấu */}
                                <SectionCard
                                    inlineHeader
                                    eyebrow={<StepBadge step={3} />}
                                    title={t("recipe:section.instructions")}
                                    subtitle={t("recipe:section.instructionsHint")}
                                >
                                    <div className="rounded-xl bg-muted-bg p-3.5">
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

                                {/* 04 Khẩu phần & thời gian */}
                                <SectionCard
                                    inlineHeader
                                    eyebrow={<StepBadge step={4} />}
                                    title={t("recipe:section.details")}
                                    subtitle={t("recipe:section.detailsHint")}
                                >
                                    <div className="grid gap-3 sm:grid-cols-2">
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
                                                    className="h-10 w-14 border-0 bg-transparent p-0 text-center text-2xl font-bold shadow-none focus-visible:ring-0"
                                                    value={values.servings}
                                                    aria-invalid={Boolean(
                                                        formik.touched.servings && formik.errors.servings,
                                                    )}
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
                                        </Panel>

                                        <Panel label={t("recipe:field.totalTime")}>
                                            <p className="mt-2 text-center text-2xl font-bold text-dark">
                                                {hasTime ? `${totalMinutes}m` : "—"}
                                            </p>
                                        </Panel>

                                        <Panel label={t("recipe:field.prepTime")}>
                                            <div className="mt-2 flex items-baseline justify-center gap-1">
                                                <Input
                                                    id="recipe-prep"
                                                    name="prepTimeMinutes"
                                                    inputMode="numeric"
                                                    className="h-10 w-14 rounded-lg border-0 bg-muted p-0 text-center text-2xl font-bold shadow-none focus-visible:ring-2 focus-visible:ring-vegan-green"
                                                    value={values.prepTimeMinutes}
                                                    aria-invalid={Boolean(
                                                        formik.touched.prepTimeMinutes && formik.errors.prepTimeMinutes,
                                                    )}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {t("recipe:time.minutesShort")}
                                                </span>
                                            </div>
                                        </Panel>

                                        <Panel label={t("recipe:field.cookTime")}>
                                            <div className="mt-2 flex items-baseline justify-center gap-1">
                                                <Input
                                                    id="recipe-cook"
                                                    name="cookTimeMinutes"
                                                    inputMode="numeric"
                                                    className="h-10 w-14 rounded-lg border-0 bg-muted p-0 text-center text-2xl font-bold shadow-none focus-visible:ring-2 focus-visible:ring-vegan-green"
                                                    value={values.cookTimeMinutes}
                                                    aria-invalid={Boolean(
                                                        formik.touched.cookTimeMinutes && formik.errors.cookTimeMinutes,
                                                    )}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {t("recipe:time.minutesShort")}
                                                </span>
                                            </div>
                                        </Panel>
                                    </div>

                                    <div className="mt-3">
                                        <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                                            {t("recipe:field.difficulty")}
                                        </p>
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
                                    </div>
                                </SectionCard>
                            </div>

                            {/* Cột phải — ẩn dưới lg, màn hẹp ưu tiên form. */}
                            <aside className="hidden flex-col gap-3.5 lg:sticky lg:top-0 lg:flex lg:self-start">
                                <div>
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <p className="text-[13px] font-bold text-dark">{t("recipe:preview.title")}</p>
                                        <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-muted-foreground">
                                            <span className="h-1.5 w-1.5 rounded-full bg-vegan-green" aria-hidden="true" />
                                            {t("recipe:preview.liveSync")}
                                        </span>
                                    </div>
                                    <RecipePreviewCard values={values} />
                                </div>

                                <div className="rounded-xl border border-border bg-card p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h2 className="text-sm font-bold text-dark">{t("recipe:readiness.title")}</h2>
                                        <span className="text-sm font-bold text-vegan-green">
                                            {t("recipe:readiness.percent", { percent })}
                                        </span>
                                    </div>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted-bg">
                                        <div
                                            className="h-full rounded-full bg-vegan-green transition-[width]"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <ul className="mt-3 space-y-2">
                                        {readiness.map((item) => (
                                            <li key={item.key} className="flex items-center gap-2 text-xs">
                                                <span
                                                    className={cn(
                                                        "flex h-4 w-4 flex-none items-center justify-center rounded-full text-[9px] font-bold",
                                                        item.done
                                                            ? "bg-vegan-green-light text-vegan-green"
                                                            : "bg-muted-bg text-muted-foreground",
                                                    )}
                                                    aria-hidden="true"
                                                >
                                                    ✓
                                                </span>
                                                <span className={item.done ? "text-dark" : "text-muted-foreground"}>
                                                    {item.label}
                                                </span>
                                                <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
                                                    {item.value}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        shape="pill"
                                        block
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                    >
                                        {t("recipe:action.cancel")}
                                    </Button>
                                    <Button type="submit" form={FORM_ID} shape="pill" block disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                                        {isSubmitting ? t("recipe:action.submitting") : t("recipe:action.submit")}
                                    </Button>
                                </div>
                            </aside>
                        </div>
                    </div>

                    {/* Footer chỉ có ở màn hẹp — nơi sidebar (và nút của nó) bị ẩn. */}
                    <div className="flex flex-none gap-2 border-t border-border p-4 lg:hidden">
                        <Button type="button" variant="outline" shape="pill" className="flex-1" onClick={handleCancel}>
                            {t("recipe:action.cancel")}
                        </Button>
                        <Button type="submit" shape="pill" className="flex-1" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                            {isSubmitting ? t("recipe:action.submitting") : t("recipe:action.submit")}
                        </Button>
                    </div>
                </form>
            </Dialog>

            {confirmDiscard && (
                <Dialog
                    open
                    onClose={() => setConfirmDiscard(false)}
                    title={t("recipe:discard.title")}
                    description={t("recipe:discard.description")}
                >
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setConfirmDiscard(false)}>
                            {t("recipe:discard.keep")}
                        </Button>
                        <Button variant="destructive" onClick={onClose}>
                            {t("recipe:discard.confirm")}
                        </Button>
                    </div>
                </Dialog>
            )}
        </>
    );
}
