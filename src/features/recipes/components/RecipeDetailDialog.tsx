import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PenLine, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { RejectionReason } from "@/components/common/RejectionReason";
import { SaveRecipeButton } from "@/features/saved/components/SaveButton";
import { useUiStore } from "@/shared/ui/uiStore";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { MODERATION_VARIANT } from "../constants";
import { nutritionTotals } from "../nutrition";
import type { Recipe } from "../types";

/** Nhãn nhỏ chữ hoa cho tiêu đề khối trong dialog chi tiết. */
function SectionHeading({ label, count }: { label: string; count?: number }) {
    return (
        <h3 className="mb-3.5 flex items-baseline gap-2 text-[11px] font-bold uppercase tracking-[0.11em] text-muted-foreground">
            {label}
            {count !== undefined && <span className="font-medium tabular-nums text-vegan-green-muted">{count}</span>}
        </h3>
    );
}

/** Kcal làm tròn nguyên; macro 1 số lẻ — chỉ để đọc, không dùng để tính tiếp. */
function formatGrams(value: number): string {
    return Number.isInteger(value) ? `${value} g` : `${value.toFixed(1)} g`;
}

/** 5 tổng dinh dưỡng cả công thức; `nutritionResolved === false` → một dòng "chưa có". */
function NutritionBlock({ recipe }: { recipe: Recipe }) {
    const { t } = useTranslation("recipe");
    const totals = nutritionTotals(recipe);

    if (!totals) {
        return (
            <p className="border-b border-border bg-muted-bg/60 px-6 py-3 text-[13.5px] text-muted-foreground">
                {t("myRecipes.meta.nutritionMissing")}
            </p>
        );
    }

    const cells = [
        { label: t("nutrition.kcal"), value: `${Math.round(totals.kcal)} kcal` },
        { label: t("nutrition.protein"), value: formatGrams(totals.proteinG) },
        { label: t("nutrition.carbohydrate"), value: formatGrams(totals.carbohydrateG) },
        { label: t("nutrition.fat"), value: formatGrams(totals.fatG) },
        { label: t("nutrition.fiber"), value: formatGrams(totals.fiberG) },
    ];

    return (
        <section className="border-b border-border bg-muted-bg/60 px-6 py-4">
            <SectionHeading label={t("nutrition.title")} />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
                {cells.map((cell) => (
                    <div key={cell.label} className="min-w-0">
                        <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                            {cell.label}
                        </dt>
                        <dd className="text-[15px] font-semibold tabular-nums text-dark">{cell.value}</dd>
                    </div>
                ))}
            </dl>
            <p className="mt-2 text-[11px] text-muted-foreground">{t("nutrition.wholeRecipe")}</p>
        </section>
    );
}

/**
 * Chi tiết công thức dựng từ chính object `Recipe` đang có — không gọi thêm API.
 * Bố cục "tờ công thức": hero → dải 4 thông số → 2 cột (nguyên liệu | bước nấu).
 * Dùng ở cả `/recipes` (MyRecipesPage) lẫn dialog món trong `/meal-plan`.
 */
export function RecipeDetailDialog({
    recipe,
    language,
    onClose,
    onDelete,
}: {
    recipe: Recipe | null;
    language: string;
    onClose: () => void;
    /** Chỉ trang của chủ công thức truyền vào — có thì footer hiện nút Xoá. */
    onDelete?: () => void;
}) {
    const { t } = useTranslation(["recipe", "common", "saved"]);
    const openComposer = useUiStore((state) => state.openComposer);

    // `instructions` là TEXT thuần do `joinSteps` gộp: mỗi bước một dòng, dạng
    // "tiêu đề — thân". Tách lại để hiện thành timeline; dòng không có dấu `—`
    // thì coi cả dòng là thân bước.
    const steps = useMemo(
        () =>
            (recipe?.instructions ?? "")
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                    const at = line.indexOf(" — ");
                    return at === -1
                        ? { title: "", body: line }
                        : { title: line.slice(0, at), body: line.slice(at + 3) };
                }),
        [recipe?.instructions],
    );

    // Mỗi ô đã format sẵn — không suy kiểu trong JSX vì "2 phút" và "2 phần" khác nhau.
    const stats = [
        {
            label: t("field.prepTime"),
            value:
                recipe?.prepTimeMinutes == null
                    ? "—"
                    : `${recipe.prepTimeMinutes} ${t("time.minutesShort")}`,
        },
        {
            label: t("field.cookTime"),
            value:
                recipe?.cookTimeMinutes == null
                    ? "—"
                    : `${recipe.cookTimeMinutes} ${t("time.minutesShort")}`,
        },
        {
            label: t("field.servings"),
            value: recipe ? t("myRecipes.meta.servings", { count: recipe.servings }) : "—",
        },
        {
            label: t("field.difficulty"),
            value: recipe?.difficulty ? t(`difficulty.${recipe.difficulty}`) : "—",
        },
    ];

    return (
        <Dialog
            open={recipe !== null}
            onClose={onClose}
            title={recipe?.name ?? ""}
            description={recipe?.description ?? undefined}
            className="max-w-3xl [&>div]:p-0"
            headerClassName="mb-0 border-b border-border bg-vegan-green-subtle px-6 pb-6 pt-6"
            eyebrow={
                recipe ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-vegan-green">
                            {recipe.dishName}
                        </p>
                        <Badge
                            variant={MODERATION_VARIANT[recipe.moderationStatus]}
                            className="ml-auto font-semibold"
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                            {t(`myRecipes.status.${recipe.moderationStatus}`)}
                        </Badge>
                    </div>
                ) : undefined
            }
            titleClassName="font-display text-2xl font-semibold leading-[1.15] tracking-[-0.018em]"
            descriptionClassName="mt-2.5 max-w-[58ch] text-sm"
        >
            {recipe && (
                <>
                    {/* Duyệt recipe không duyệt tên món dùng chung — nói rõ để không tưởng đã lên sóng. */}
                    {recipe.dishModerationStatus === "PENDING" && recipe.moderationStatus === "APPROVED" && (
                        <p className="mx-6 mt-5 rounded-xl border border-amber-strong/20 bg-amber-soft px-3.5 py-2.5 text-[13.5px] text-amber-strong">
                            {t("myRecipes.detail.dishPending")}
                        </p>
                    )}

                    {/* Lý do admin từ chối — tác giả mở dialog cũng phải thấy, không chỉ trên card. */}
                    <RejectionReason
                        reason={recipe.moderationStatus === "REJECTED" ? recipe.rejectionReason : null}
                        className="mx-6 mt-5"
                    />

                    {/* Dải 4 thông số. Kẻ ô bằng `gap-px` trên nền `bg-border` để đường
                        phân cách tự đúng ở cả 2 cột (mobile) lẫn 4 cột (sm), khỏi tính border theo index. */}
                    <dl className="mt-5 grid grid-cols-2 gap-px border-y border-border bg-border sm:grid-cols-4">
                        {stats.map((item) => (
                            <div key={item.label} className="min-w-0 bg-card px-5 py-3.5">
                                <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                                    {item.label}
                                </dt>
                                <dd className="mt-0.5 text-[17px] font-semibold tabular-nums text-dark">
                                    {item.value}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    {/* Tổng **cả công thức** (BE tính từ dinh dưỡng nguyên liệu). Chưa resolve
                        thì nói thẳng là chưa có, không hiện ô 0 / thanh macro rỗng. */}
                    <NutritionBlock recipe={recipe} />

                    <div className="grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                        <section className="min-w-0 px-6 py-6">
                            <SectionHeading label={t("section.ingredients")} count={recipe.ingredients.length} />
                            <ul>
                                {recipe.ingredients.map((ingredient, index) => (
                                    <li
                                        key={ingredient.ingredientId}
                                        className="grid grid-cols-[26px_minmax(0,1fr)_auto] items-baseline gap-2.5 border-b border-dashed border-border py-2 last:border-b-0"
                                    >
                                        <span className="text-[11px] font-bold tabular-nums text-vegan-green-muted">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        <span className="min-w-0 break-words text-dark">{ingredient.name}</span>
                                        <span className="whitespace-nowrap text-[13.5px] tabular-nums text-muted-foreground">
                                            {ingredient.unit
                                                ? `${ingredient.amount} ${ingredient.unit}`
                                                : ingredient.amount}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="min-w-0 border-t border-border px-6 py-6 sm:border-l sm:border-t-0">
                            <SectionHeading label={t("section.instructions")} count={steps.length} />
                            <ol className="flex flex-col gap-4">
                                {steps.map((step, index) => (
                                    <li key={index} className="grid grid-cols-[26px_minmax(0,1fr)] gap-3">
                                        <span className="grid h-[26px] w-[26px] place-items-center rounded-full border border-vegan-green/40 bg-surface text-[12px] font-bold tabular-nums text-vegan-green">
                                            {index + 1}
                                        </span>
                                        <div className="min-w-0">
                                            {step.title && (
                                                <h4 className="mb-0.5 text-[14.5px] font-semibold leading-snug text-dark">
                                                    {step.title}
                                                </h4>
                                            )}
                                            <p className="text-sm text-muted-foreground">{step.body}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
                        <span className="text-xs text-muted-foreground">
                            {t("myRecipes.updated", { date: formatDateLocale(recipe.updatedAt, language) })}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                            <SaveRecipeButton recipe={recipe} />
                            <Button
                                variant="outline"
                                onClick={() => {
                                    openComposer(null, [recipe.id]);
                                    onClose();
                                }}
                            >
                                <PenLine className="h-4 w-4" aria-hidden="true" />
                                {t("saved:composeFromRecipe")}
                            </Button>
                            {onDelete && (
                                <Button variant="outline" onClick={onDelete}>
                                    <Trash2 className="h-4 w-4 text-danger" aria-hidden="true" />
                                    {t("myRecipes.action.delete")}
                                </Button>
                            )}
                            <Button variant="outline" onClick={onClose}>
                                {t("common:close")}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </Dialog>
    );
}
