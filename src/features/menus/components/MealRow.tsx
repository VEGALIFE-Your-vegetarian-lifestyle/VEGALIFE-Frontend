import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { Meal } from "../types";

/** Một bữa: loại bữa, tên món, số phần, ảnh + cuisine nếu backend có trả. */
export function MealRow({ meal }: { meal: Meal }) {
    const { t } = useTranslation("menu");
    const { dish } = meal;

    return (
        <li className="flex gap-2.5 py-2">
            {dish.imageUrl && (
                <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    loading="lazy"
                    className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                />
            )}
            <div className="min-w-0 flex-1">
                <Badge variant="outline" size="sm" className="mb-1">
                    {t(`mealType.${meal.mealType}`)}
                </Badge>
                <p className="text-sm font-medium leading-snug text-dark">{dish.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("servings", { count: meal.servings })}
                    {dish.cuisineType && ` · ${dish.cuisineType}`}
                </p>
                {/* dish id để đối chiếu với món đã chọn ở DishPicker khi lập plan. */}
                <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground" title={dish.id}>
                    {dish.id}
                </p>
            </div>
        </li>
    );
}
