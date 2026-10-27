import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { DayColumn } from "./DayColumn";
import { MenuActions } from "./MenuActions";
import { MENU_STATUS_VARIANT, type MenuDetail } from "../types";
import { parseISODate, toISODate, weekDays } from "../week";

function shortDate(iso: string, language: string): string {
    return parseISODate(iso).toLocaleDateString(language === "vi" ? "vi-VN" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
    });
}

export function MenuCard({ menu }: { menu: MenuDetail }) {
    const { t, i18n } = useTranslation("menu");

    // `days` của backend thiếu ngày không có bữa → dựng đủ 7 ô từ startDate rồi tra theo ngày.
    const mealsByDate = useMemo(() => new Map(menu.days.map((day) => [day.date, day.meals])), [menu.days]);
    const days = useMemo(() => weekDays(parseISODate(menu.startDate)), [menu.startDate]);

    return (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="text-base font-bold text-dark">
                    {t("week.label", {
                        from: shortDate(menu.startDate, i18n.language),
                        to: shortDate(menu.endDate, i18n.language),
                    })}
                </h2>
                <Badge variant={MENU_STATUS_VARIANT[menu.status]} size="sm">
                    {t(`status.${menu.status}`)}
                </Badge>
                <div className="ml-auto">
                    <MenuActions menu={menu} />
                </div>
                {menu.notes && (
                    <p className="w-full text-sm text-muted-foreground">
                        <span className="font-semibold">{t("notes")}: </span>
                        {menu.notes}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
                {days.map((date) => {
                    const iso = toISODate(date);
                    return <DayColumn key={iso} date={iso} meals={mealsByDate.get(iso) ?? []} />;
                })}
            </div>
        </section>
    );
}
