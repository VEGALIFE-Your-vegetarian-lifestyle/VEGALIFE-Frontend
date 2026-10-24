import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_INGREDIENTS } from "./schema";
import { AutocompleteField } from "./AutocompleteField";
import { searchIngredients } from "../../api";
import type { Ingredient, RecipeIngredientInput } from "../../types";

type IngredientError = { name?: string; amount?: string; unit?: string };
type IngredientTouched = { name?: boolean; amount?: boolean; unit?: boolean };

interface IngredientEditorProps {
    items: RecipeIngredientInput[];
    errors?: Array<IngredientError | undefined>;
    touched?: Array<IngredientTouched | undefined>;
    /** Index các hàng trùng tên — tô đỏ ngay cả khi chưa blur. */
    duplicates: number[];
    onChange: (index: number, field: keyof RecipeIngredientInput, value: string) => void;
    onBlur: (index: number, field: keyof RecipeIngredientInput) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
}

// Gợi ý đơn vị hay dùng — API không có enum nên vẫn gõ tự do được.
const UNIT_SUGGESTIONS = ["g", "kg", "ml", "l", "tbsp", "tsp", "cup", "piece", "clove", "pinch"];

const UNIT_LIST_ID = "recipe-unit-suggestions";

/** Bố cục hàng dùng chung cho header và từng dòng nguyên liệu. */
const ROW_GRID = "grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_130px_40px]";

export function IngredientEditor({
    items,
    errors,
    touched,
    duplicates,
    onChange,
    onBlur,
    onAdd,
    onRemove,
}: IngredientEditorProps) {
    const { t } = useTranslation("recipe");

    return (
        <div className="space-y-3">
            <datalist id={UNIT_LIST_ID}>
                {UNIT_SUGGESTIONS.map((unit) => (
                    <option key={unit} value={unit} />
                ))}
            </datalist>

            {/* Tiêu đề cột — nhãn từng ô trên mobile vẫn đọc được qua sr-only. */}
            <div className={`${ROW_GRID} hidden px-1 text-xs font-semibold text-muted-foreground sm:grid`}>
                <span>{t("recipe:field.ingredientName")} *</span>
                <span>{t("recipe:field.amount")} *</span>
                <span>{t("recipe:field.unit")} *</span>
                <span className="sr-only">{t("recipe:ingredient.remove")}</span>
            </div>

            {items.map((item, index) => {
                const rowError = errors?.[index];
                const rowTouched = touched?.[index];
                const isDuplicate = duplicates.includes(index);
                // Trùng tên là lỗi cấp mảng (Yup không gắn vào field) → tự dựng message cho hàng.
                const nameError = isDuplicate ? t("recipe:errors.ingredientDuplicate") : rowError?.name;
                const showNameError = Boolean(isDuplicate || (rowTouched?.name && rowError?.name));
                const amountError = rowTouched?.amount ? rowError?.amount : undefined;
                const unitError = rowTouched?.unit ? rowError?.unit : undefined;

                return (
                    <div key={index} className={`${ROW_GRID} rounded-xl border border-border bg-surface p-3 sm:items-start`}>
                        <div>
                            <label htmlFor={`ingredient-name-${index}`} className="sr-only">
                                {t("recipe:field.ingredientName")}
                            </label>
                            <AutocompleteField<Ingredient>
                                id={`ingredient-name-${index}`}
                                value={item.name}
                                onChange={(value) => onChange(index, "name", value)}
                                onBlur={() => onBlur(index, "name")}
                                placeholder={t("recipe:placeholder.ingredientName")}
                                invalid={showNameError}
                                queryKey="recipe-ingredient-suggestions"
                                search={(name) => searchIngredients({ name, size: 8 })}
                                getLabel={(suggestion) => suggestion.name}
                                emptyLabel={t("recipe:hint.noSuggestions")}
                            />
                            {showNameError && (
                                <p role="alert" className="mt-1 text-sm text-destructive">
                                    {nameError}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor={`ingredient-amount-${index}`} className="sr-only">
                                {t("recipe:field.amount")}
                            </label>
                            <Input
                                id={`ingredient-amount-${index}`}
                                inputMode="decimal"
                                value={item.amount}
                                placeholder={t("recipe:placeholder.amount")}
                                aria-invalid={Boolean(amountError)}
                                onChange={(event) => onChange(index, "amount", event.target.value)}
                                onBlur={() => onBlur(index, "amount")}
                            />
                            {amountError && (
                                <p role="alert" className="mt-1 text-sm text-destructive">
                                    {amountError}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor={`ingredient-unit-${index}`} className="sr-only">
                                {t("recipe:field.unit")}
                            </label>
                            <Input
                                id={`ingredient-unit-${index}`}
                                list={UNIT_LIST_ID}
                                value={item.unit}
                                placeholder={t("recipe:placeholder.unit")}
                                aria-invalid={Boolean(unitError)}
                                onChange={(event) => onChange(index, "unit", event.target.value)}
                                onBlur={() => onBlur(index, "unit")}
                            />
                            {unitError && (
                                <p role="alert" className="mt-1 text-sm text-destructive">
                                    {unitError}
                                </p>
                            )}
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="iconSm"
                            className="justify-self-end text-muted-foreground hover:text-destructive sm:mt-1.5"
                            aria-label={t("recipe:ingredient.remove")}
                            disabled={items.length <= 1}
                            onClick={() => onRemove(index)}
                        >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </div>
                );
            })}

            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    shape="pill"
                    onClick={onAdd}
                    disabled={items.length >= MAX_INGREDIENTS}
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t("recipe:ingredient.add")}
                </Button>
                <p className="text-xs text-muted-foreground">{t("recipe:ingredient.hint")}</p>
            </div>
        </div>
    );
}
