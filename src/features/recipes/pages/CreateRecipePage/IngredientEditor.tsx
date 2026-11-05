import { ChevronsUpDown, Leaf, Plus, Trash2 } from "lucide-react";
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

            {/* Tiêu đề cột — dải xám như mockup. Nhãn từng ô trên mobile đọc qua sr-only.
                `pl` của ô đầu bù chỗ chấm lá (h-6 + gap-2.5) để nhãn thẳng với input bên dưới. */}
            <div
                className={`${ROW_GRID} hidden rounded-lg bg-muted-bg px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:grid`}
            >
                <span className="pl-[34px]">{t("field.ingredientName")}</span>
                <span>{t("field.amount")}</span>
                <span>{t("field.unit")}</span>
                <span className="text-right">{t("ingredient.action")}</span>
            </div>

            {/* Không viền từng hàng — mockup dùng đường kẻ mảnh giữa các hàng. */}
            <div className="divide-y divide-border">
                {items.map((item, index) => {
                    const rowError = errors?.[index];
                    const rowTouched = touched?.[index];
                    const isDuplicate = duplicates.includes(index);
                    // Trùng tên là lỗi cấp mảng (Yup không gắn vào field) → tự dựng message cho hàng.
                    const nameError = isDuplicate ? t("errors.ingredientDuplicate") : rowError?.name;
                    const showNameError = Boolean(isDuplicate || (rowTouched?.name && rowError?.name));
                    const amountError = rowTouched?.amount ? rowError?.amount : undefined;
                    const unitError = rowTouched?.unit ? rowError?.unit : undefined;

                    return (
                        <div key={index} className={`${ROW_GRID} bg-surface px-3 py-3 sm:items-start`}>
                            <div className="flex items-start gap-2.5">
                                {/* Chấm tròn viền xanh — trang trí, không mang dữ liệu. */}
                                <span
                                    className="mt-2.5 hidden h-6 w-6 flex-none items-center justify-center rounded-full border border-vegan-green-muted bg-surface sm:flex"
                                    aria-hidden="true"
                                >
                                    <Leaf className="h-3 w-3 text-vegan-green" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <label htmlFor={`ingredient-name-${index}`} className="sr-only">
                                        {t("field.ingredientName")}
                                    </label>
                                    <AutocompleteField<Ingredient>
                                        id={`ingredient-name-${index}`}
                                        value={item.name}
                                        onChange={(value) => onChange(index, "name", value)}
                                        onBlur={() => onBlur(index, "name")}
                                        placeholder={t("placeholder.ingredientName")}
                                        invalid={showNameError}
                                        queryKey="recipe-ingredient-suggestions"
                                        search={(name) => searchIngredients({ name, size: 8 })}
                                        getLabel={(suggestion) => suggestion.name}
                                        emptyLabel={t("hint.noSuggestions")}
                                    />
                                    {showNameError && (
                                        <p role="alert" className="mt-1 text-sm text-destructive">
                                            {nameError}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor={`ingredient-amount-${index}`} className="sr-only">
                                    {t("field.amount")}
                                </label>
                                <Input
                                    id={`ingredient-amount-${index}`}
                                    inputMode="decimal"
                                    className="text-right tabular-nums"
                                    value={item.amount}
                                    placeholder={t("placeholder.amount")}
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
                                    {t("field.unit")}
                                </label>
                                {/* Input + datalist chứ không phải Select: `unit` là chuỗi tự do ≤30 ký tự.
                                    ChevronsUpDown chỉ để trông giống ô chọn của mockup, không giới hạn giá trị. */}
                                <Input
                                    id={`ingredient-unit-${index}`}
                                    list={UNIT_LIST_ID}
                                    value={item.unit}
                                    trailing={
                                        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                    }
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
                                aria-label={t("ingredient.remove")}
                                disabled={items.length <= 1}
                                onClick={() => onRemove(index)}
                            >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <Button type="button" shape="pill" size="sm" onClick={onAdd} disabled={items.length >= MAX_INGREDIENTS}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t("ingredient.add")}
                </Button>
                <p className="text-xs text-muted-foreground">{t("ingredient.hint")}</p>
            </div>
        </div>
    );
}
