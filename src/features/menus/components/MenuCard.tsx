import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/cn";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/shared/utils/formatDate";
import { DayColumn } from "./DayColumn";
import { DishDetailDialog } from "./DishDetailDialog";
import { MenuActions } from "./MenuActions";
import {
    MAX_DISH_REPEATS,
    MEAL_TYPES,
    MENU_STATUS_VARIANT,
    MIN_DISTINCT_DISHES,
    type Meal,
    type MenuDetail,
    type MenuStatus,
} from "../types";
import { parseISODate, toISODate, weekDays } from "../week";

function shortDate(iso: string, language: string): string {
    return parseISODate(iso).toLocaleDateString(language === "vi" ? "vi-VN" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
    });
}

/** Dải màu cạnh trái — trạng thái đọc được từ xa, không cần zoom vào badge. */
const STATUS_RAIL: Record<MenuStatus, string> = {
    scheduled: "border-l-vegan-green",
    completed: "border-l-vegan-green-muted",
    drafted: "border-l-amber-strong",
    cancelled: "border-l-border",
};

/** 21 ô cố định (7 ngày × 3 bữa) — mẫu số của "meals planned". */
const TOTAL_SLOTS = 7 * MEAL_TYPES.length;

export function MenuCard({ menu }: { menu: MenuDetail }) {
    const { t, i18n } = useTranslation("menu");

    // Dialog chi tiết món — dữ liệu lấy từ chính response của tuần, không gọi thêm API.
    const [openMeal, setOpenMeal] = useState<Meal | null>(null);

    // `days` của backend thiếu ngày không có bữa → dựng đủ 7 ô từ startDate rồi tra theo ngày.
    const mealsByDate = useMemo(() => new Map(menu.days.map((day) => [day.date, day.meals])), [menu.days]);
    const days = useMemo(() => weekDays(parseISODate(menu.startDate)), [menu.startDate]);

    // Thống kê tuần — tất cả suy ra từ chính response, không thêm request nào.
    const stats = useMemo(() => {
        const allMeals = [...mealsByDate.values()].flat();
        return {
            meals: allMeals.length,
            distinct: new Set(allMeals.map((meal) => meal.dish.id)).size,
            coveredDays: [...mealsByDate.values()].filter((meals) => meals.length > 0).length,
            servings: allMeals.reduce((sum, meal) => sum + meal.servings, 0),
        };
    }, [mealsByDate]);

    const cancelled = menu.status === "cancelled";

    return (
        <section
            className={cn(
                "overflow-hidden rounded-2xl border border-l-[3px] border-border bg-surface shadow-sm",
                STATUS_RAIL[menu.status],
            )}
        >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3.5 sm:px-5">
                <h2 className="text-base font-bold text-dark">
                    {t("week.label", {
                        from: shortDate(menu.startDate, i18n.language),
                        to: shortDate(menu.endDate, i18n.language),
                    })}
                </h2>
                <Badge variant={MENU_STATUS_VARIANT[menu.status]} size="sm">
                    {t(`status.${menu.status}`)}
                </Badge>
                {menu.updatedAt && (
                    <span className="text-[11.5px] text-muted-foreground">
                        {t("updatedAt", { time: formatRelativeTime(menu.updatedAt, i18n.language) })}
                    </span>
                )}
                <div className="ml-auto">
                    <MenuActions menu={menu} />
                </div>
            </div>

            {menu.notes && (
                <div className="border-y border-border bg-vegan-green-subtle px-4 py-2 text-xs text-muted-foreground sm:px-5">
                    <span className="font-semibold text-dark">{t("notes")}: </span>
                    {menu.notes}
                </div>
            )}

            <div
                className={cn(
                    "grid grid-cols-2 border-b border-border md:grid-cols-4",
                    cancelled && "opacity-55",
                )}
            >
                <Stat
                    value={stats.meals}
                    label={t("stats.meals")}
                    sub={t("stats.ofSlots", { total: TOTAL_SLOTS })}
                    bar={(stats.meals / TOTAL_SLOTS) * 100}
                />
                <Stat
                    value={stats.distinct}
                    label={t("stats.distinct")}
                    sub={
                        stats.distinct >= MIN_DISTINCT_DISHES
                            ? t("stats.distinctOk", { min: MIN_DISTINCT_DISHES })
                            : t("stats.distinctShort", { min: MIN_DISTINCT_DISHES })
                    }
                    ok={stats.distinct >= MIN_DISTINCT_DISHES}
                />
                <Stat
                    value={stats.coveredDays}
                    suffix={`/7`}
                    label={t("stats.days")}
                    bar={(stats.coveredDays / 7) * 100}
                />
                <Stat value={stats.servings} label={t("stats.servings")} sub={t("stats.maxRepeat", { max: MAX_DISH_REPEATS })} />
            </div>

            <div className={cn("grid grid-cols-2 gap-2 p-3 sm:p-4 lg:grid-cols-7", cancelled && "opacity-55")}>
                {days.map((date) => {
                    const iso = toISODate(date);
                    return (
                        <DayColumn
                            key={iso}
                            date={iso}
                            meals={mealsByDate.get(iso) ?? []}
                            onOpenMeal={setOpenMeal}
                        />
                    );
                })}
            </div>

            <DishDetailDialog meal={openMeal} onClose={() => setOpenMeal(null)} />
        </section>
    );
}

interface StatProps {
    value: number;
    suffix?: string;
    label: string;
    sub?: string;
    /** 0–100; bỏ trống thì không vẽ thanh. */
    bar?: number;
    /** Tô xanh giá trị khi đã đạt luật (vd đủ số món khác nhau). */
    ok?: boolean;
}

function Stat({ value, suffix, label, sub, bar, ok }: StatProps) {
    return (
        <div className="min-w-0 border-l border-border px-4 py-3 first:border-l-0">
            <p className={cn("font-display text-xl font-semibold leading-tight tabular-nums", ok && "text-vegan-green")}>
                {value}
                {suffix && <span className="text-[13px] font-medium text-muted-foreground">{suffix}</span>}
            </p>
            <p className="text-[10.5px] font-semibold text-muted-foreground">{label}</p>
            {sub && <p className="text-[10.5px] text-muted-foreground">{sub}</p>}
            {bar !== undefined && (
                <div className="mt-1.5 h-[3px] overflow-hidden rounded-sm bg-border" aria-hidden="true">
                    <div className="h-full rounded-sm bg-vegan-green" style={{ width: `${Math.min(100, bar)}%` }} />
                </div>
            )}
        </div>
    );
}
