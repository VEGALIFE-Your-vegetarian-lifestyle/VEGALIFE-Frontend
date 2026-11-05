import { useTranslation } from "react-i18next";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Meal } from "../types";

/**
 * Chi tiết một ô bữa, dựng **hoàn toàn** từ dữ liệu `GET /api/menus/details` trả
 * (`dish.name`, `dish.description`, `dish.imageUrl`, `dish.cuisineType` + `mealType`/`servings`).
 * Không gọi thêm API: backend không có endpoint dish → recipe, và món user chưa có recipe
 * thì vẫn phải xem được.
 */
export function DishDetailDialog({ meal, onClose }: { meal: Meal | null; onClose: () => void }) {
    const { t } = useTranslation(["menu", "common"]);
    const { dish } = meal ?? { dish: null };

    const stats = [
        { label: t("menu:mealTypeLabel"), value: meal ? t(`menu:mealType.${meal.mealType}`) : "—" },
        { label: t("menu:servingsLabel"), value: meal ? t("menu:servings", { count: meal.servings }) : "—" },
        { label: t("menu:cuisineLabel"), value: dish?.cuisineType ?? "—" },
    ];

    return (
        <Dialog
            open={meal !== null}
            onClose={onClose}
            title={dish?.name ?? ""}
            description={dish?.description ?? undefined}
            className="max-w-xl [&>div]:p-0"
            headerClassName="mb-0 border-b border-border bg-vegan-green-subtle px-6 pb-6 pt-6"
            eyebrow={
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-vegan-green">
                    {t("menu:dish.eyebrow")}
                </p>
            }
            titleClassName="font-display text-2xl font-semibold leading-[1.15] tracking-[-0.018em]"
            descriptionClassName="mt-2.5 max-w-[58ch] text-sm"
        >
            {meal && dish && (
                <>
                    {dish.imageUrl && (
                        <img
                            src={dish.imageUrl}
                            alt=""
                            className="h-56 w-full object-cover"
                            loading="lazy"
                        />
                    )}

                    <dl className="grid grid-cols-3 gap-px border-y border-border bg-border">
                        {stats.map((item) => (
                            <div key={item.label} className="min-w-0 bg-card px-5 py-3.5">
                                <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                                    {item.label}
                                </dt>
                                <dd className="mt-0.5 truncate text-[15px] font-semibold text-dark">{item.value}</dd>
                            </div>
                        ))}
                    </dl>

                    <div className="flex items-center justify-end border-t border-border px-6 py-4">
                        <Button variant="outline" onClick={onClose}>
                            {t("common:close")}
                        </Button>
                    </div>
                </>
            )}
        </Dialog>
    );
}
