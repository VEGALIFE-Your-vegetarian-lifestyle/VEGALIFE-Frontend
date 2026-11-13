import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecipe } from "@/features/recipes/api";
import { RecipeDetailDialog } from "@/features/recipes/components/RecipeDetailDialog";
import { RecipeNutritionLine } from "@/features/recipes/components/RecipeNutritionLine";
import type { Meal } from "../types";

/**
 * Ô bữa có `recommendedRecipes` → gọi `GET /api/recipes/{id}` lấy card **đầy đủ**
 * (nguyên liệu + bước nấu + tổng dinh dưỡng) rồi render bằng chính `RecipeDetailDialog`
 * của `/recipes`, khỏi dựng lại bố cục.
 *
 * ponytail: chỉ lấy recipe **đầu tiên** — response thường 1 recipe/món. Món có nhiều
 * recipe gợi ý thì thêm bộ chọn: `meal.recommendedRecipes.map(...)` → `setRecipeId`.
 *
 * Endpoint này owner-only: recipe của member khác trả 404. Lúc đó hiện card tóm tắt
 * dựng từ `recommendedRecipes` ngay trong response của tuần, không vỡ gì.
 */
export function MealRecipeDialog({ meal, onClose }: { meal: Meal | null; onClose: () => void }) {
    const { t, i18n } = useTranslation(["menu", "recipe", "common"]);
    const summary = meal?.recommendedRecipes?.[0];
    const recipeId = summary?.id;

    const { data, isPending } = useQuery({
        queryKey: ["recipe", recipeId],
        queryFn: () => getRecipe(recipeId as string),
        enabled: !!recipeId,
        // 404 = recipe không phải của mình → retry vô nghĩa.
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    if (data) return <RecipeDetailDialog recipe={data} language={i18n.language} onClose={onClose} />;

    const stats = summary
        ? [
              {
                  label: t("recipe:field.prepTime"),
                  value:
                      summary.prepTimeMinutes == null
                          ? "—"
                          : `${summary.prepTimeMinutes} ${t("recipe:time.minutesShort")}`,
              },
              {
                  label: t("recipe:field.cookTime"),
                  value:
                      summary.cookTimeMinutes == null
                          ? "—"
                          : `${summary.cookTimeMinutes} ${t("recipe:time.minutesShort")}`,
              },
              { label: t("recipe:field.servings"), value: t("menu:servings", { count: summary.servings }) },
              {
                  label: t("recipe:field.difficulty"),
                  value: summary.difficulty ? t(`recipe:difficulty.${summary.difficulty}`) : "—",
              },
          ]
        : [];

    return (
        <Dialog
            open={meal !== null}
            onClose={onClose}
            title={summary?.name ?? meal?.dish.name ?? ""}
            description={summary?.description ?? undefined}
            className="max-w-xl"
            eyebrow={
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-vegan-green">
                    {t("menu:dish.eyebrow")}
                </p>
            }
        >
            {isPending ? (
                <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            ) : (
                <>
                    <p className="mb-4 rounded-xl border border-amber-strong/20 bg-amber-soft px-3.5 py-2.5 text-[13.5px] text-amber-strong">
                        {t("menu:recipe.unavailable")}
                    </p>
                    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
                        {stats.map((item) => (
                            <div key={item.label} className="min-w-0 bg-card px-4 py-3">
                                <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                                    {item.label}
                                </dt>
                                <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-dark">{item.value}</dd>
                            </div>
                        ))}
                    </dl>
                    {summary && <RecipeNutritionLine recipe={summary} className="mt-4 flex text-sm" />}
                    <div className="mt-5 flex justify-end">
                        <Button variant="outline" onClick={onClose}>
                            {t("common:close")}
                        </Button>
                    </div>
                </>
            )}
        </Dialog>
    );
}
