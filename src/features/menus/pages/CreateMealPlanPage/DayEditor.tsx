import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { parseISODate } from "../../week";
import { DishSlotPicker } from "./DishSlotPicker";
import type { DayForm, MealSlot } from "./schema";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

interface DayEditorProps {
    day: DayForm;
    index: number;
    /** Lỗi của ngày (`days.<index>`) và của từng ô (`days.<index>.slots.<j>.servings`). */
    errors: Record<string, string>;
    disabled?: boolean;
    /** Chưa chọn món nào trong cả tuần thì không doạ user bằng chữ đỏ. */
    showEmptyError?: boolean;
    onChange: (slots: MealSlot[]) => void;
}

/** Một ngày: luôn đủ 3 ô bữa. Ô không chọn món thì bỏ trống, không gửi lên. */
export function DayEditor({ day, index, errors, disabled, showEmptyError, onChange }: DayEditorProps) {
    const { t, i18n } = useTranslation("menu");
    const parsed = parseISODate(day.date);
    const weekday = t(`weekdays.short.${WEEKDAY_KEYS[parsed.getDay()]}`);

    const updateSlot = (slotIndex: number, patch: Partial<MealSlot>) =>
        onChange(day.slots.map((slot, current) => (current === slotIndex ? { ...slot, ...patch } : slot)));

    return (
        <div className="rounded-xl border border-border bg-surface p-3">
            <div className="mb-2 flex items-baseline gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-vegan-green">{weekday}</span>
                <span className="text-xs text-muted-foreground">
                    {parsed.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                    })}
                </span>
            </div>

            <div className="space-y-2">
                {day.slots.map((slot, slotIndex) => {
                    const servingsError = errors[`days.${index}.slots.${slotIndex}.servings`];
                    const inputId = `day-${index}-slot-${slotIndex}`;
                    return (
                        <div key={slot.mealType}>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" size="sm" className="w-16 shrink-0 justify-center">
                                    {t(`mealType.${slot.mealType}`)}
                                </Badge>
                                <div className="min-w-0 flex-1">
                                    <DishSlotPicker
                                        id={inputId}
                                        value={slot.dish}
                                        disabled={disabled}
                                        onChange={(dish) => updateSlot(slotIndex, { dish })}
                                    />
                                </div>
                                <Input
                                    className="w-14 shrink-0 px-1.5 text-center"
                                    inputMode="numeric"
                                    disabled={disabled || slot.dish === null}
                                    aria-label={`${t("create.servingsColumn")} — ${t(`mealType.${slot.mealType}`)}`}
                                    aria-invalid={Boolean(servingsError)}
                                    value={slot.servings}
                                    onChange={(event) => updateSlot(slotIndex, { servings: event.target.value })}
                                />
                            </div>
                            {servingsError && (
                                <p role="alert" className="mt-1 pl-18 text-xs text-destructive">
                                    {servingsError}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {showEmptyError && errors[`days.${index}`] && (
                <p role="alert" className="mt-2 text-xs text-destructive">
                    {errors[`days.${index}`]}
                </p>
            )}
        </div>
    );
}
