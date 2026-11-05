import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
    buildMissingIngredientsPatch,
    emptyMissingRow,
    NUTRITION_FIELDS,
    NUTRITION_LABEL_KEYS,
    type IngredientFormError,
    type MissingIngredientRow,
} from "../../ingredientForm";
import { INGREDIENT_UNITS, type AdminIngredientUpdateRequest, type AdminRecipe } from "../../types";

interface ApproveRecipeDialogProps {
    /** `null` = đóng. */
    recipe: AdminRecipe | null;
    loading: boolean;
    onSubmit: (patches: { ingredientId: string; payload: AdminIngredientUpdateRequest }[]) => void;
    onClose: () => void;
}

/**
 * Ghép tên thiếu → id. `missingRequiredIngredients` chỉ có tên, id nằm ở `ingredients`.
 * Tên không khớp dòng nào thì bỏ qua (không PATCH được).
 */
function toMissingRows(recipe: AdminRecipe): MissingIngredientRow[] {
    return recipe.missingRequiredIngredients
        .map((name) => {
            const line = recipe.ingredients.find((item) => item.name === name);
            return line ? emptyMissingRow(line.ingredientId, name) : null;
        })
        .filter((row): row is MissingIngredientRow => row !== null);
}

export function ApproveRecipeDialog({ recipe, loading, onSubmit, onClose }: ApproveRecipeDialogProps) {
    const { t } = useTranslation(["admin", "common"]);
    const [rows, setRows] = useState<MissingIngredientRow[]>([]);
    const [error, setError] = useState<IngredientFormError | null>(null);
    // `rows` khởi tạo lại mỗi khi mở recipe khác.
    const key = recipe?.id ?? "closed";
    const missing = useMemo(() => (recipe ? toMissingRows(recipe) : []), [recipe]);
    const [rowsKey, setRowsKey] = useState(key);
    if (rowsKey !== key) {
        setRowsKey(key);
        setRows(missing);
        setError(null);
    }

    const set = (index: number, field: keyof MissingIngredientRow) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setRows((prev) =>
            prev.map((row, i) => (i === index ? { ...row, [field]: event.target.value } : row)),
        );
        setError(null);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const result = buildMissingIngredientsPatch(rows);
        if (!result.ok) return setError(result.error);
        onSubmit(result.patches);
    };

    return (
        <Dialog
            open={recipe !== null}
            onClose={onClose}
            title={t("recipes.moderation.approveTitle")}
            description={recipe ? t("recipes.moderation.approveBody", { name: recipe.name }) : undefined}
            className="max-w-3xl"
        >
            {recipe && (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    {rows.length === 0 ? (
                        <p className="rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                            {t("recipes.approve.noMissing")}
                        </p>
                    ) : (
                        <>
                            <p className="rounded-xl border border-amber-strong/20 bg-amber-soft px-3 py-2 text-sm text-amber-strong">
                                {t("recipes.approve.missingIntro", { count: rows.length })}
                            </p>
                            {rows.map((row, index) => (
                                <fieldset key={row.ingredientId} className="rounded-xl border border-border p-3">
                                    <legend className="px-1 text-sm font-semibold text-dark">{row.name}</legend>
                                    <div className="mt-2 space-y-2">
                                        <Select
                                            aria-label={t("ingredients.column.unit")}
                                            value={row.unit}
                                            onChange={set(index, "unit")}
                                            className="sm:w-40"
                                        >
                                            <option value="">{t("recipes.approve.skip")}</option>
                                            {INGREDIENT_UNITS.map((unit) => (
                                                <option key={unit} value={unit}>
                                                    {t(`ingredients.unit.${unit}`)}
                                                </option>
                                            ))}
                                        </Select>
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                            {NUTRITION_FIELDS.map((field) => (
                                                <Input
                                                    key={field}
                                                    inputMode="decimal"
                                                    aria-label={t(NUTRITION_LABEL_KEYS[field])}
                                                    placeholder={t(NUTRITION_LABEL_KEYS[field])}
                                                    value={row[field]}
                                                    onChange={set(index, field)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </fieldset>
                            ))}
                            <p className="text-xs text-muted-foreground">{t("recipes.approve.helper")}</p>
                        </>
                    )}

                    {error && (
                        <p role="alert" className="rounded-xl bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            {t(`ingredients.form.error.${error}`)}
                        </p>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            {t("common:cancel")}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {t("recipes.moderation.approve")}
                        </Button>
                    </div>
                </form>
            )}
        </Dialog>
    );
}
