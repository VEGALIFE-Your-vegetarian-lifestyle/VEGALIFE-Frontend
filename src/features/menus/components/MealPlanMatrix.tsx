import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { parseISODate } from "../week";
import { MEAL_TYPES, type MealType } from "../types";
import type { MenuFormValues } from "../create/schema";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** Chấm màu phân biệt 3 bữa — đồng bộ với `DayColumn` ở trang xem. */
const MEAL_DOT: Record<MealType, string> = {
    BREAKFAST: "bg-amber-strong",
    LUNCH: "bg-vegan-green-bright",
    DINNER: "bg-lavender-strong",
};

/** "YYYY-MM-DD" → "DD/MM" */
const shortDate = (iso: string) => iso.slice(8) + "/" + iso.slice(5, 7);

interface MealPlanMatrixProps {
    values: MenuFormValues;
    /** Lỗi cấp ngày `days.<i>` — chỉ hiện khi đã chọn ít nhất một món. */
    errors: Record<string, string>;
    showDayErrors: boolean;
    disabled?: boolean;
    /** Bấm ô hoặc nhãn bữa → mở popover gán món. */
    onPick: (mealType: MealType, dayIndex: number | null, anchor: HTMLElement) => void;
    /** Nút × trong ô: xoá món của đúng ô đó. */
    onClear: (mealType: MealType, dayIndex: number) => void;
}

/**
 * Ma trận 7 ngày × 3 bữa — surface duy nhất để xem và sửa thực đơn.
 * Nhãn bữa in một lần ở cột trái (thay vì lặp ở mỗi ngày như `DayEditor` cũ).
 */
export function MealPlanMatrix({ values, errors, showDayErrors, disabled, onPick, onClear }: MealPlanMatrixProps) {
    const { t } = useTranslation("menu");
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const weekday = (iso: string) => t(`weekdays.short.${WEEKDAY_KEYS[parseISODate(iso).getDay()]}`);
    const filled = values.days.reduce(
        (sum, day) => sum + day.slots.filter((slot) => slot.dish !== null).length,
        0,
    );

    return (
        <div>
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="tabular-nums">
                    <b className="text-dark">{filled}</b> / 21 {t("create.matrix.slots")}
                </span>
                <span aria-hidden="true">·</span>
                <span>{t("create.matrix.hint")}</span>
            </div>

            <div className="-mx-1 overflow-x-auto px-1 pb-1">
                <div className="grid min-w-[740px] grid-cols-[auto_repeat(7,minmax(84px,1fr))] gap-1.5">
                    <div aria-hidden="true" />
                    {values.days.map((day) => (
                        <div key={day.date} className="flex flex-col items-center gap-0.5 pb-2 pt-1">
                            <span
                                className={cn(
                                    "text-[10px] font-extrabold uppercase tracking-wider",
                                    day.date === todayKey ? "text-vegan-green" : "text-muted-foreground",
                                )}
                            >
                                {weekday(day.date)}
                            </span>
                            <span
                                className={cn(
                                    "text-xs font-semibold tabular-nums",
                                    day.date === todayKey ? "text-vegan-green" : "text-muted-foreground",
                                )}
                            >
                                {shortDate(day.date)}
                            </span>
                        </div>
                    ))}

                    {MEAL_TYPES.map((mealType) => (
                        <MealRow
                            key={mealType}
                            mealType={mealType}
                            values={values}
                            errors={errors}
                            showDayErrors={showDayErrors}
                            disabled={disabled}
                            todayKey={todayKey}
                            onPick={onPick}
                            onClear={onClear}
                            mealLabel={t(`mealType.${mealType}`)}
                            dotClass={MEAL_DOT[mealType]}
                            openLabel={t("create.matrix.assignRow", { meal: t(`mealType.${mealType}`) })}
                            clearLabel={(name) => t("create.clearDish", { name })}
                            pickLabel={t("create.pickDish")}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

interface MealRowProps {
    mealType: MealType;
    values: MenuFormValues;
    errors: Record<string, string>;
    showDayErrors: boolean;
    disabled?: boolean;
    todayKey: string;
    onPick: (mealType: MealType, dayIndex: number | null, anchor: HTMLElement) => void;
    onClear: (mealType: MealType, dayIndex: number) => void;
    mealLabel: string;
    dotClass: string;
    openLabel: string;
    clearLabel: (name: string) => string;
    pickLabel: string;
}

function MealRow({
    mealType,
    values,
    errors,
    showDayErrors,
    disabled,
    todayKey,
    onPick,
    onClear,
    mealLabel,
    dotClass,
    openLabel,
    clearLabel,
    pickLabel,
}: MealRowProps) {
    return (
        <>
            <button
                type="button"
                disabled={disabled}
                onClick={(event) => onPick(mealType, null, event.currentTarget)}
                aria-label={openLabel}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-1 text-left text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-vegan-green-subtle hover:text-vegan-green disabled:opacity-50"
            >
                <span aria-hidden="true" className={cn("h-1.5 w-1.5 flex-none rounded-full", dotClass)} />
                {mealLabel}
            </button>

            {values.days.map((day, dayIndex) => {
                const slot = day.slots.find((item) => item.mealType === mealType);
                const dish = slot?.dish ?? null;
                const dayError = showDayErrors && day.slots.every((item) => item.dish === null) ? errors[`days.${dayIndex}`] : undefined;
                return (
                    <div key={day.date} className="contents">
                        {dish ? (
                            <div
                                className={cn(
                                    "group flex min-h-[52px] items-start justify-between gap-1 rounded-md border border-border bg-surface px-2 py-1.5 transition-colors hover:border-vegan-green-muted",
                                    day.date === todayKey && "bg-vegan-green-subtle/60",
                                )}
                            >
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={(event) => onPick(mealType, dayIndex, event.currentTarget)}
                                    title={dish.name}
                                    className="min-w-0 flex-1 break-words text-left text-xs font-semibold leading-tight text-dark line-clamp-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-vegan-green"
                                >
                                    {dish.name}
                                </button>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => onClear(mealType, dayIndex)}
                                    aria-label={clearLabel(dish.name)}
                                    title={clearLabel(dish.name)}
                                    className="mt-0.5 hidden rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-danger group-hover:block group-focus-within:block"
                                >
                                    <X className="h-3 w-3" aria-hidden="true" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={(event) => onPick(mealType, dayIndex, event.currentTarget)}
                                aria-label={`${pickLabel} · ${day.date}`}
                                className={cn(
                                    "flex min-h-[52px] items-center justify-center rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-vegan-green-muted hover:bg-vegan-green-subtle hover:text-vegan-green disabled:opacity-50",
                                    dayError && "border-destructive bg-danger-soft/40",
                                    day.date === todayKey && "bg-vegan-green-subtle/40",
                                )}
                            >
                                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                        )}
                    </div>
                );
            })}
        </>
    );
}
