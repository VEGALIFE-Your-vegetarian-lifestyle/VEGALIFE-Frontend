import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/common/FormField";
import {
    buildIngredientCreate,
    buildIngredientUpdate,
    NUTRITION_FIELDS,
    NUTRITION_LABEL_KEYS,
    toIngredientForm,
    type IngredientFormError,
    type IngredientFormValues,
} from "../../ingredientForm";
import { INGREDIENT_UNITS, type AdminIngredient } from "../../types";

function Form({
    ingredient,
    loading,
    onSubmit,
    onClose,
}: {
    ingredient: AdminIngredient | null;
    loading: boolean;
    onSubmit: (values: IngredientFormValues) => void;
    onClose: () => void;
}) {
    const { t } = useTranslation(["admin", "common"]);
    const [values, setValues] = useState<IngredientFormValues>(() => toIngredientForm(ingredient));
    const [error, setError] = useState<IngredientFormError | null>(null);

    const set = (field: keyof IngredientFormValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setValues((prev) => ({ ...prev, [field]: event.target.value }));
        setError(null);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!values.name.trim()) return;
        if (ingredient) {
            const result = buildIngredientUpdate(ingredient, values);
            if (!result.ok) return setError(result.error);
            if (!result.payload) return onClose();
            return onSubmit(values);
        }
        const result = buildIngredientCreate(values);
        if (!result.ok) return setError(result.error);
        onSubmit(values);
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField label={t("ingredients.form.nameLabel")} htmlFor="ingredient-name" required>
                <Input
                    id="ingredient-name"
                    value={values.name}
                    maxLength={100}
                    placeholder={t("ingredients.form.namePlaceholder")}
                    onChange={set("name")}
                />
            </FormField>

            <FormField
                label={t("ingredients.form.unitLabel")}
                htmlFor="ingredient-unit"
                helper={t("ingredients.form.unitHelper")}
            >
                <Select id="ingredient-unit" value={values.unit} onChange={set("unit")}>
                    <option value="">{t("ingredients.form.unitNone")}</option>
                    {INGREDIENT_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                            {t(`ingredients.unit.${unit}`)}
                        </option>
                    ))}
                </Select>
            </FormField>

            <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-dark">{t("ingredients.form.nutritionLegend")}</legend>
                <p className="mb-3 text-xs text-muted-foreground">{t("ingredients.form.nutritionHelper")}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {NUTRITION_FIELDS.map((field) => (
                        <FormField
                            key={field}
                            label={t(NUTRITION_LABEL_KEYS[field])}
                            htmlFor={`ingredient-${field}`}
                        >
                            <Input
                                id={`ingredient-${field}`}
                                inputMode="decimal"
                                value={values[field]}
                                onChange={set(field)}
                            />
                        </FormField>
                    ))}
                </div>
            </fieldset>

            {error && (
                <p role="alert" className="rounded-xl bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {t(`ingredients.form.error.${error}`)}
                </p>
            )}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    {t("common:cancel")}
                </Button>
                <Button type="submit" disabled={loading || !values.name.trim()}>
                    {ingredient ? t("ingredients.form.submit") : t("ingredients.form.create")}
                </Button>
            </div>
        </form>
    );
}

interface IngredientFormDialogProps {
    /** `null` = đóng. `{ ingredient: null }` = tạo mới. */
    state: { ingredient: AdminIngredient | null } | null;
    loading: boolean;
    /**
     * Nhận giá trị thô của form — page tự chọn `buildIngredientCreate` / `buildIngredientUpdate`
     * để biết gửi POST hay PATCH.
     */
    onSubmit: (values: IngredientFormValues) => void;
    onClose: () => void;
}

export function IngredientFormDialog({ state, loading, onSubmit, onClose }: IngredientFormDialogProps) {
    const { t } = useTranslation("admin");
    const editing = state?.ingredient ?? null;

    return (
        <Dialog
            open={state !== null}
            onClose={onClose}
            title={t(editing ? "ingredients.form.editTitle" : "ingredients.form.createTitle")}
            description={editing ? t("ingredients.form.editSubtitle", { name: editing.name }) : undefined}
            className="max-w-xl"
        >
            {state && (
                <Form
                    key={editing?.id ?? "new"}
                    ingredient={editing}
                    loading={loading}
                    onSubmit={onSubmit}
                    onClose={onClose}
                />
            )}
        </Dialog>
    );
}
