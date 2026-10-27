import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { MODERATION_VARIANT } from "../../constants";
import type { AdminRecipe, ModerationStatus } from "../../types";

interface RecipeDetailDialogProps {
    /** `null` = đóng. Row lấy từ danh sách đã tải — không gọi thêm API. */
    recipe: AdminRecipe | null;
    categoryNames: Map<string, string>;
    /** Đang gọi approve/reject — khoá nút. */
    loading: boolean;
    /** Báo lên page mở ConfirmDialog; dialog chi tiết vẫn mở. */
    onApprove: (recipe: AdminRecipe) => void;
    onReject: (recipe: AdminRecipe) => void;
    /** Duyệt tên món dùng chung — tách khỏi duyệt recipe (backend cũng tách). */
    onApproveDish: (recipe: AdminRecipe) => void;
    onClose: () => void;
}

/** Nhãn + giá trị một dòng meta. */
function Meta({ label, value, extra }: { label: string; value: string; extra?: ReactNode }) {
    return (
        <div className="rounded-xl bg-muted/40 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="flex items-center gap-2 text-sm font-medium text-dark">
                <span className="truncate">{value}</span>
                {extra}
            </dd>
        </div>
    );
}

/** Badge trạng thái duyệt — dùng chung cho recipe / dish / ingredient. */
function ModerationBadge({ status, size }: { status: ModerationStatus; size?: "sm" }) {
    const { t } = useTranslation("admin");
    return (
        <Badge variant={MODERATION_VARIANT[status]} size={size}>
            {t(`recipes.moderation.status.${status}`)}
        </Badge>
    );
}

export function RecipeDetailDialog({
    recipe,
    categoryNames,
    loading,
    onApprove,
    onReject,
    onApproveDish,
    onClose,
}: RecipeDetailDialogProps) {
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
                        <Meta
                            label={t("recipes.column.dish")}
                            value={recipe.dishName ?? "—"}
                            extra={
                                <>
                                    <ModerationBadge status={recipe.dishModerationStatus} size="sm" />
                                    {/* Duyệt recipe không duyệt dish → phải có nút riêng, không thì
                                        món không bao giờ xuất hiện ở ô chọn món của thực đơn. */}
                                    {recipe.dishModerationStatus === "PENDING" && recipe.dishId && (
                                        <Button
                                            variant="ghost"
                                            size="xs"
                                            disabled={loading}
                                            onClick={() => onApproveDish(recipe)}
                                        >
                                            {t("recipes.moderation.approveDish")}
                                        </Button>
                                    )}
                                </>
                            }
                        />
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
                        <ModerationBadge status={recipe.moderationStatus} />
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
                                    <span className="flex items-center gap-2 text-dark">
                                        <span className="truncate">{ingredient.name}</span>
                                        {ingredient.moderationStatus && (
                                            <ModerationBadge status={ingredient.moderationStatus} size="sm" />
                                        )}
                                    </span>
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

                    <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            {t("common:close")}
                        </Button>
                        {recipe.moderationStatus !== "REJECTED" && (
                            <Button
                                variant="outline"
                                className="text-terracotta"
                                disabled={loading}
                                onClick={() => onReject(recipe)}
                            >
                                {t("recipes.moderation.reject")}
                            </Button>
                        )}
                        {recipe.moderationStatus !== "APPROVED" && (
                            <Button disabled={loading} onClick={() => onApprove(recipe)}>
                                {t("recipes.moderation.approve")}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Dialog>
    );
}
