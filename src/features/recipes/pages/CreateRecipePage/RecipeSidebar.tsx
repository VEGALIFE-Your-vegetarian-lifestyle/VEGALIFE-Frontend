import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/shared/utils/cn";
import { Check, Circle, Leaf, Scale, Search, Sparkles } from "lucide-react";
import { RecipePreviewCard } from "./RecipePreviewCard";
import type { RecipeFormValues } from "./schema";

export interface ReadinessItem {
    key: string;
    label: string;
    value: string;
    done: boolean;
}

interface RecipeSidebarProps {
    items: ReadinessItem[];
    /** % hoàn thiện — page đã tính để dùng chung với dải trạng thái ở đầu trang. */
    percent: number;
    /** Giá trị form hiện tại — nguồn duy nhất của thẻ xem trước. */
    values: RecipeFormValues;
    /** Khối ngay dưới checklist — chỗ đặt nút gửi (mockup không để nút trên header). */
    actions?: ReactNode;
}

/**
 * Cột phải trang tạo công thức: thẻ xem trước → checklist → xác nhận thuần thực vật.
 * Không có checklist duyệt bài (recipe không có draft/publish) — chỉ là phản hồi
 * tức thì cho người nhập liệu.
 */
export function RecipeSidebar({ items, percent, values, actions }: RecipeSidebarProps) {
    const { t } = useTranslation("recipe");
    const allDone = items.every((item) => item.done);

    return (
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-bold text-dark">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-vegan-green">
                            <Leaf className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                        </span>
                        {t("preview.title")}
                    </p>
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-vegan-green" aria-hidden="true" />
                        {t("preview.liveSync")}
                    </span>
                </div>
                <RecipePreviewCard values={values} />
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-base font-bold text-dark">
                        <Check className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                        {t("readiness.title")}
                    </h2>
                    <span className="text-sm font-bold text-vegan-green">
                        {t("readiness.percent", { percent })}
                    </span>
                </div>
                <Progress className="mt-3" value={percent} tone={allDone ? "green" : "amber"} />

                <ul className="mt-4 space-y-3">
                    {items.map((item) => (
                        <li key={item.key} className="flex items-start gap-2.5 text-sm">
                            {item.done ? (
                                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-vegan-green" aria-hidden="true" />
                            ) : (
                                <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                            )}
                            <span className="flex-1 text-dark">{item.label}</span>
                            <span
                                className={cn(
                                    "text-xs font-semibold",
                                    item.done ? "text-vegan-green" : "text-muted-foreground",
                                )}
                            >
                                {item.value}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* BE không có endpoint update recipe cho member → sai định lượng chỉ sửa được
                bằng xoá + tạo lại. Nói trước, đừng để member phát hiện sau khi gửi. */}
            <p className="flex items-start gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                <Circle className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-600" aria-hidden="true" />
                {t("ingredient.pendingWarning")}
            </p>

            {actions}

            <div className="rounded-2xl border border-vegan-green-muted bg-vegan-green-subtle p-5">
                <p className="flex items-center gap-2 text-sm font-bold text-vegan-green">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {t("standards.plantFirst.title")}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">{t("standards.plantFirst.description")}</p>

                <div className="mt-3 space-y-2">
                    <p className="flex items-start gap-2 rounded-xl bg-surface/70 p-3 text-xs text-muted-foreground">
                        <Scale className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-vegan-green" aria-hidden="true" />
                        <span>
                            <span className="font-semibold text-dark">{t("standards.tracker.title")}: </span>
                            {t("standards.tracker.description")}
                        </span>
                    </p>
                    <p className="flex items-start gap-2 rounded-xl bg-surface/70 p-3 text-xs text-muted-foreground">
                        <Search className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-vegan-green" aria-hidden="true" />
                        <span>
                            <span className="font-semibold text-dark">{t("standards.seo.title")}: </span>
                            {t("standards.seo.description")}
                        </span>
                    </p>
                </div>
                <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <Sparkles className="mt-0.5 h-3 w-3 flex-shrink-0 text-vegan-green" aria-hidden="true" />
                    {t("standards.moderate.description")}
                </p>
            </div>
        </aside>
    );
}
