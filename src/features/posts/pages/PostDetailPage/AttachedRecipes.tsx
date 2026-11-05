import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueries } from "@tanstack/react-query";
import { Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/common/SectionCard";
import { getRecipe } from "@/features/recipes/api";
import type { Recipe } from "@/features/recipes/types";

interface AttachedRecipesProps {
    recipeIds: string[];
}

/** Nhãn độ khó — backend chỉ trả EASY | MEDIUM | HARD (key ở namespace `recipe`). */
const DIFFICULTY_LABEL: Record<string, string> = {
    EASY: "difficulty.EASY",
    MEDIUM: "difficulty.MEDIUM",
    HARD: "difficulty.HARD",
};

/**
 * `post.recipeIds` — backend đã trả sẵn nhưng FE trước đây không render gì.
 * Mỗi id gọi `GET /api/recipes/{id}` (song song); id nào 404/lỗi thì bỏ im lặng
 * thay vì làm hỏng cả trang.
 */
export function AttachedRecipes({ recipeIds }: AttachedRecipesProps) {
    const { t } = useTranslation(["post", "recipe"]);

    const queries = useQueries({
        queries: recipeIds.map((id) => ({
            queryKey: ["recipe", id],
            queryFn: () => getRecipe(id),
            retry: false,
            staleTime: 5 * 60 * 1000,
        })),
    });

    const recipes = queries.map((query) => query.data).filter((recipe): recipe is Recipe => !!recipe);

    if (recipeIds.length === 0) return null;

    return (
        <SectionCard eyebrow={t("post:recipes.eyebrow")} title={t("post:recipes.title")}>
            {recipes.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("post:recipes.loading")}</p>
            ) : (
                <ul className="space-y-3">
                    {recipes.map((recipe) => (
                        <li key={recipe.id}>
                            <div className="rounded-xl border border-border bg-surface p-4">
                                <p className="font-semibold text-dark">{recipe.name}</p>
                                {recipe.description && (
                                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{recipe.description}</p>
                                )}
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {recipe.prepTimeMinutes != null && (
                                        <Badge variant="outline" size="sm">
                                            <Clock className="h-3 w-3" aria-hidden="true" />
                                            {t("post:recipes.prep", { count: recipe.prepTimeMinutes })}
                                        </Badge>
                                    )}
                                    <Badge variant="outline" size="sm">
                                        <Users className="h-3 w-3" aria-hidden="true" />
                                        {t("post:recipes.servings", { count: recipe.servings })}
                                    </Badge>
                                    {recipe.difficulty && (
                                        <Badge variant="lightgreen" size="sm">
                                            {t(`recipe:${DIFFICULTY_LABEL[recipe.difficulty]}`)}
                                        </Badge>
                                    )}
                                </div>
                                {recipe.ingredients.length > 0 && (
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        {t("post:recipes.ingredients", {
                                            list: recipe.ingredients
                                                .slice(0, 5)
                                                .map((ingredient) => ingredient.name)
                                                .join(", "),
                                            count: recipe.ingredients.length,
                                        })}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <Link
                to="/recipes"
                className="mt-4 inline-block text-sm font-semibold text-vegan-green hover:underline"
            >
                {t("post:recipes.browseMine")}
            </Link>
        </SectionCard>
    );
}
