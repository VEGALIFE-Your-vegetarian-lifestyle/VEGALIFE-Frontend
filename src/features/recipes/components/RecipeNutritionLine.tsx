import { Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/cn";
import { nutritionTotals } from "../nutrition";
import type { Recipe } from "../types";

/** `Recipe` và `RecommendedRecipe` (menus) đều đủ 6 field này — nhận chung một kiểu. */
export type NutritionFields = Pick<
    Recipe,
    "nutritionResolved" | "calories" | "proteinG" | "carbohydrateG" | "fatG" | "fiberG"
>;

/**
 * Một dòng tổng dinh dưỡng **cả công thức** cho card recipe.
 * `nutritionResolved === false` **vẫn render** — hiện "chưa có dữ liệu" thay vì ẩn,
 * để người xem biết công thức này thiếu số chứ không tưởng card lỗi.
 * Không đặt cỡ chữ: kế thừa từ hàng chứa nó (card lớn dùng `text-sm`, feed dùng `text-xs`).
 */
export function RecipeNutritionLine({ recipe, className }: { recipe: NutritionFields; className?: string }) {
    const { t } = useTranslation("recipe");
    const totals = nutritionTotals(recipe);

    return (
        <p className={cn("inline-flex items-center gap-1.5 text-muted-foreground", className)}>
            {totals ? (
                <>
                    <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("myRecipes.meta.nutrition", {
                        kcal: Math.round(totals.kcal),
                        protein: Math.round(totals.proteinG),
                    })}
                </>
            ) : (
                t("myRecipes.meta.nutritionMissing")
            )}
        </p>
    );
}
