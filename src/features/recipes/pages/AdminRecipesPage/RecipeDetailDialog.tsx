import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatDateLocale } from "@/shared/utils/formatDate";
import type { AdminRecipe } from "../../types";

interface RecipeDetailDialogProps {
    /** `null` = đóng. Row lấy từ danh sách đã tải — không gọi thêm API. */
    recipe: AdminRecipe | null;
    categoryNames: Map<string, string>;
    onClose: () => void;
}

/** Nhãn + giá trị một dòng meta. */
function Meta({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-muted/40 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium text-dark">{value}</dd>
        </div>
    );
}

export function RecipeDetailDialog({ recipe, categoryNames, onClose }: RecipeDetailDialogProps) {
    const { t } = useTranslation(["admin", "common", "recipe"]);

    return (
        <Dialog
            open={recipe !== null}
            onClose={onClose}
            title={recipe?.name ?? ""}
            description={recipe ? t("recipes.detail.by", { username: recipe.username }) : undefined}
            className="max-w-3xl"
        >
            {recipe && (
                <div className="space-y-5">
                    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <Meta label={t("recipes.column.dish")} value={recipe.dishName ?? "—"} />
                        <Meta
                            label={t("recipes.column.cookTime")}
                            value={
                                recipe.cookTimeMinutes === null
                                    ? "—"
                                    : t("recipes.minutes", { count: recipe.cookTimeMinutes })
                            }
                        />
                        <Meta
                            label={t("recipes.detail.prepTime")}
                            value={
                                recipe.prepTimeMinutes === null
                                    ? "—"
                                    : t("recipes.minutes", { count: recipe.prepTimeMinutes })
                            }
                        />
                        <Meta label={t("recipes.column.servings")} value={String(recipe.servings)} />
                        <Meta
                            label={t("recipes.column.difficulty")}
                            value={recipe.difficulty ? t(`recipe:difficulty.${recipe.difficulty}`) : "—"}
                        />
                        <Meta label={t("recipes.column.createdAt")} value={formatDateLocale(recipe.createdAt)} />
                        <Meta label={t("recipes.detail.updatedAt")} value={formatDateLocale(recipe.updatedAt)} />
                        <Meta label={t("recipes.column.creator")} value={`@${recipe.username}`} />
                        <Meta label={t("recipes.detail.email")} value={recipe.email} />
                    </dl>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={recipe.status === "ACTIVE" ? "default" : "destructive"}>
                            {t(`recipes.status.${recipe.status}`)}
                        </Badge>
                        {recipe.categoryIds.map((id) => (
                            <Badge key={id} variant="outline" size="sm">
                                {categoryNames.get(id) ?? id}
                            </Badge>
                        ))}
                    </div>

                    {recipe.description && (
                        <section>
                            <h3 className="mb-1 text-sm font-semibold text-dark">{t("recipes.detail.description")}</h3>
                            <p className="text-sm text-muted-foreground">{recipe.description}</p>
                        </section>
                    )}

                    <section>
                        <h3 className="mb-2 text-sm font-semibold text-dark">
                            {t("recipes.detail.ingredients", { count: recipe.ingredients.length })}
                        </h3>
                        <ul className="divide-y divide-border rounded-xl border border-border">
                            {recipe.ingredients.map((ingredient) => (
                                <li
                                    key={ingredient.ingredientId}
                                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                                >
                                    <span className="text-dark">{ingredient.name}</span>
                                    <span className="whitespace-nowrap tabular-nums text-muted-foreground">
                                        {ingredient.amount} {ingredient.unit}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className="mb-2 text-sm font-semibold text-dark">{t("recipes.detail.instructions")}</h3>
                        {/* `instructions` là TEXT thuần, mỗi bước một dòng. */}
                        <p className="whitespace-pre-line rounded-xl bg-muted/40 px-3 py-2 text-sm text-dark">
                            {recipe.instructions}
                        </p>
                    </section>

                    <div className="flex justify-end">
                        <Button variant="outline" onClick={onClose}>
                            {t("common:close")}
                        </Button>
                    </div>
                </div>
            )}
        </Dialog>
    );
}
