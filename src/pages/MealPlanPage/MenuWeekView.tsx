import { useTranslation } from "react-i18next";
import { CalendarDays, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MenuDetail, MenuStatus } from "@/types/menu";
import { formatDayLabel, sortMeals } from "./payload";

const STATUS_VARIANT: Record<MenuStatus, "secondary" | "lightgreen" | "cream" | "destructive"> = {
    drafted: "secondary",
    scheduled: "lightgreen",
    completed: "cream",
    cancelled: "destructive",
};

/** Nhãn trạng thái dùng chung cho danh sách và chi tiết. */
export function MenuStatusBadge({ status }: { status: MenuStatus }) {
    const { t } = useTranslation("mealPlan");
    return (
        <Badge variant={STATUS_VARIANT[status] ?? "secondary"} size="sm">
            {t(`status.${status}`)}
        </Badge>
    );
}

interface MenuWeekViewProps {
    detail: MenuDetail;
}

/**
 * Lưới 7 ngày × 3 bữa (#61). Mỗi meal nhúng sẵn `dish` nên không cần gọi thêm API.
 * Ngày không có bữa nào vẫn hiện để thấy rõ tuần bị khuyết.
 */
export function MenuWeekView({ detail }: MenuWeekViewProps) {
    const { t, i18n } = useTranslation("mealPlan");

    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {detail.days.map((day) => (
                <section key={day.date} className="rounded-2xl border border-border bg-card p-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-dark">
                        <CalendarDays className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                        {formatDayLabel(day.date, i18n.language)}
                    </h3>

                    {sortMeals(day).length === 0 ? (
                        <p className="mt-3 text-xs text-muted-foreground">{t("detail.emptyDay")}</p>
                    ) : (
                        <ul className="mt-3 space-y-2">
                            {sortMeals(day).map((meal) => (
                                <li
                                    key={`${day.date}-${meal.mealType}`}
                                    className="rounded-xl bg-muted-bg px-3 py-2"
                                >
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                        {t(`mealType.${meal.mealType}`)}
                                    </p>
                                    {/* `dish` là field lồng — response thiếu thì hiện nhãn thay vì crash. */}
                                    <p className="text-sm font-semibold text-dark">
                                        {meal.dish?.name || t("detail.unknownDish")}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {t("detail.servings", { n: meal.servings })}
                                        {meal.dish?.cuisineType ? ` · ${meal.dish.cuisineType}` : ""}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            ))}

            {detail.days.length === 0 && (
                <p className="text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
                    <UtensilsCrossed className="mr-2 inline h-4 w-4" aria-hidden="true" />
                    {t("detail.emptyWeek")}
                </p>
            )}
        </div>
    );
}
