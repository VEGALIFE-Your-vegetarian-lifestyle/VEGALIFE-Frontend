import { useTranslation } from "react-i18next";
import { ChefHat, Clock, Leaf, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RecipeNutritionLine } from "@/features/recipes/components/RecipeNutritionLine";
import { SaveRecipeButton } from "@/features/saved/components/SaveButton";
import { cn } from "@/shared/utils/cn";
import type { Recipe } from "@/features/recipes/types";

const DIFFICULTY_VARIANT = {
    EASY: "lightgreen",
    MEDIUM: "amber",
    HARD: "destructive",
} as const;

/**
 * Card công thức trong feed Explore — bấm vào mở `RecipeDetailDialog`.
 *
 * `Recipe` không có ảnh bìa lẫn tên tác giả (chỉ `userId`), nên hero là nền gradient +
 * icon thay ảnh (cùng mẹo HomePage dùng cho địa điểm).
 *
 * Card KHÔNG bọc cả thẻ trong `<button>`: nút Save nằm đè lên vùng bấm mở dialog, lồng
 * button trong button là HTML không hợp lệ. Vùng "mở chi tiết" là một `<button>` phủ toàn
 * thẻ, nút Save là sibling đặt `z-10` phía trên.
 */
export function RecipeFeedCard({ recipe, onOpen }: { recipe: Recipe; onOpen: () => void }) {
    const { t } = useTranslation(["recipe", "explore"]);

    const totalMinutes =
        recipe.prepTimeMinutes === null && recipe.cookTimeMinutes === null
            ? null
            : (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

    return (
        <article className="group relative overflow-hidden rounded-2xl bg-card shadow-sm transition-shadow hover:shadow-md">
            <button
                type="button"
                onClick={onOpen}
                aria-label={recipe.name}
                className="flex w-full flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green focus-visible:ring-offset-2"
            >
                <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-vegan-green-light via-vegan-green-subtle to-cream">
                    <ChefHat className="h-10 w-10 text-vegan-green-muted" aria-hidden="true" />
                    <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-bold text-vegan-green shadow-sm backdrop-blur-md">
                        <Leaf className="h-3 w-3" aria-hidden="true" />
                        {t("explore:card.recipe")}
                    </span>
                    {recipe.difficulty && (
                        <Badge
                            variant={DIFFICULTY_VARIANT[recipe.difficulty]}
                            size="sm"
                            className="absolute bottom-3 left-3"
                        >
                            {t(`difficulty.${recipe.difficulty}`)}
                        </Badge>
                    )}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-vegan-green">
                        {recipe.dishName}
                    </p>
                    <h3 className="line-clamp-2 text-base font-bold leading-snug text-dark">{recipe.name}</h3>
                    {recipe.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{recipe.description}</p>
                    )}

                    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted-foreground">
                        {totalMinutes !== null && (
                            <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                {t("myRecipes.meta.total", { count: totalMinutes })}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                            {t("myRecipes.meta.servings", { count: recipe.servings })}
                        </span>
                    </div>

                    <RecipeNutritionLine recipe={recipe} className={cn("flex text-xs")} />
                </div>
            </button>

            {/* Ngoài `<button>` mở dialog (lồng button là HTML sai) — `z-10` để bấm được. */}
            <div className="absolute right-3 top-3 z-10">
                <SaveRecipeButton
                    recipe={recipe}
                    iconOnly
                    className="bg-surface/90 shadow-sm backdrop-blur-md hover:bg-surface"
                />
            </div>
        </article>
    );
}
