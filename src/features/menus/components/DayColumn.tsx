import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/cn";
import { MealRow } from "./MealRow";
import { parseISODate, toISODate } from "../week";
import { MEAL_TYPES, type Meal, type MealType } from "../types";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** Chấm màu phân biệt 3 bữa — chỉ để mắt bắt nhịp, không mang nghĩa trạng thái. */
const MEAL_DOT: Record<MealType, string> = {
    BREAKFAST: "bg-amber-strong",
    LUNCH: "bg-vegan-green-bright",
    DINNER: "bg-lavender-strong",
};

interface DayColumnProps {
    /** YYYY-MM-DD */
    date: string;
    meals: Meal[];
    /** Bấm tên món → mở dialog chi tiết món. */
    onOpenMeal: (meal: Meal) => void;
}

/**
 * Một ngày trong tuần: luôn đủ 3 ô bữa theo thứ tự BREAKFAST → LUNCH → DINNER.
 * Ô trống vẫn chiếm chỗ để thấy ngay ngày nào thiếu bữa nào. Không có affordance thêm món —
 * backend không có `PATCH /api/menus/{id}`, muốn sửa phải tạo menu mới.
 */
export function DayColumn({ date, meals, onOpenMeal }: DayColumnProps) {
    const { t } = useTranslation("menu");
    const parsed = parseISODate(date);
    const weekdayKey = WEEKDAY_KEYS[parsed.getDay()];
    const isToday = date === toISODate(new Date());
    const byType = new Map(meals.map((meal) => [meal.mealType, meal]));

    return (
        <div
            className={cn(
                "flex min-w-0 flex-col gap-1.5 rounded-xl p-2.5",
                isToday ? "bg-vegan-green-subtle ring-1 ring-vegan-green-muted" : "bg-muted-bg/60",
            )}
        >
            <div className="flex items-baseline justify-between gap-1">
                <span
                    className={cn(
                        "text-[10px] font-extrabold uppercase tracking-[0.08em]",
                        isToday ? "text-vegan-green" : "text-muted-foreground",
                    )}
                >
                    {t(`weekdays.short.${weekdayKey}`)}
                </span>
                <span
                    className={cn(
                        "text-[10.5px] font-semibold tabular-nums",
                        isToday ? "text-vegan-green" : "text-muted-foreground",
                    )}
                >
                    {parsed.getDate()}
                </span>
            </div>

            <div className="flex flex-col gap-1.5">
                {MEAL_TYPES.map((mealType) => {
                    const meal = byType.get(mealType);
                    return (
                        <div key={mealType} className="min-w-0">
                            <div className="mb-0.5 flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.07em] text-muted-foreground">
                                <span
                                    aria-hidden="true"
                                    className={cn("h-[5px] w-[5px] rounded-full", meal ? MEAL_DOT[mealType] : "bg-border")}
                                />
                                {t(`mealType.${mealType}`)}
                            </div>
                            {meal ? (
                                <div className="rounded-lg bg-surface px-1.5 py-1 ring-1 ring-border">
                                    <MealRow meal={meal} onOpen={() => onOpenMeal(meal)} />
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-border px-1.5 py-1 text-[10px] italic text-muted-foreground">
                                    —
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
