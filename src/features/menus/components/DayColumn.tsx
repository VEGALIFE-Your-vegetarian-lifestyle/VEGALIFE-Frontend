import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/cn";
import { MealRow } from "./MealRow";
import { parseISODate, toISODate } from "../week";
import type { Meal } from "../types";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

interface DayColumnProps {
    /** YYYY-MM-DD */
    date: string;
    meals: Meal[];
}

/** Một ngày trong tuần. Ngày không có bữa vẫn chiếm ô — `days` của backend có thể thiếu. */
export function DayColumn({ date, meals }: DayColumnProps) {
    const { t } = useTranslation("menu");
    const parsed = parseISODate(date);
    const weekdayKey = WEEKDAY_KEYS[parsed.getDay()];
    const isToday = date === toISODate(new Date());

    return (
        <div
            className={cn(
                "flex flex-col rounded-xl border border-border bg-card p-3",
                isToday && "border-vegan-green-muted bg-vegan-green-subtle",
            )}
        >
            <div className="mb-1 flex items-baseline gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-vegan-green">{t(`weekdays.short.${weekdayKey}`)}</span>
                <span className="text-xs text-muted-foreground">{parsed.getDate()}</span>
            </div>

            {meals.length === 0 ? (
                <p className="py-2 text-xs italic text-muted-foreground">{t("noMeals")}</p>
            ) : (
                <ul className="divide-y divide-border">
                    {meals.map((meal) => (
                        <MealRow key={`${meal.mealType}-${meal.dish.id}`} meal={meal} />
                    ))}
                </ul>
            )}
        </div>
    );
}
