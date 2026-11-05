import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/cn";
import type { Meal } from "../types";

/**
 * Một ô bữa: chỉ tên món. Bấm vào mở `DishDetailDialog` — dữ liệu lấy từ chính response
 * `GET /api/menus/details`, không cần recipe. Không hiện `dish.id`.
 */
export function MealRow({ meal, onOpen }: { meal: Meal; onOpen: () => void }) {
    const { t } = useTranslation("menu");

    return (
        <button
            type="button"
            onClick={onOpen}
            aria-label={t("dish.open", { name: meal.dish.name })}
            className={cn(
                "block w-full min-w-0 rounded-lg px-0.5 py-0.5 text-left",
                "transition-colors hover:bg-vegan-green-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-vegan-green",
            )}
        >
            <span className="line-clamp-2 text-[11.5px] font-bold leading-[1.25] text-dark">{meal.dish.name}</span>
        </button>
    );
}
