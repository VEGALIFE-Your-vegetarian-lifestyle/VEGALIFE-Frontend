import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseISODate } from "../week";

interface WeekNavigatorProps {
    /** YYYY-MM-DD — Thứ 2 của tuần đang xem. */
    from: string;
    to: string;
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
}

const short = (iso: string, language: string) =>
    parseISODate(iso).toLocaleDateString(language === "vi" ? "vi-VN" : "en-GB", { day: "2-digit", month: "2-digit" });

export function WeekNavigator({ from, to, onPrev, onNext, onToday }: WeekNavigatorProps) {
    const { t, i18n } = useTranslation("menu");

    return (
        <div className="flex items-center gap-1">
            <Button variant="outline" size="iconSm" onClick={onPrev} aria-label={t("week.prev")}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="min-w-[7.5rem] text-center text-sm font-semibold text-dark">
                {t("week.label", { from: short(from, i18n.language), to: short(to, i18n.language) })}
            </span>
            <Button variant="outline" size="iconSm" onClick={onNext} aria-label={t("week.next")}>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onToday} className="ml-1">
                {t("week.today")}
            </Button>
        </div>
    );
}
