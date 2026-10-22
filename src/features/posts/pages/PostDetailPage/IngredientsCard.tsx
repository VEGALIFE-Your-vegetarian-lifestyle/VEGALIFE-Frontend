import { useTranslation } from "react-i18next";
import { SectionCard } from "@/components/common/SectionCard";
import { cn } from "@/shared/utils/cn";
import type { PostIngredientGroup } from "../../types";

const SCALES = [1, 2, 3] as const;

export type Scale = (typeof SCALES)[number];

interface Props {
    groups: PostIngredientGroup[];
    scale: Scale;
    onScaleChange: (scale: Scale) => void;
}

/** Nguyên liệu + nút nhân khẩu phần 1x/2x/3x (chỉ đổi nhãn, chưa nhân số lượng). */
export function IngredientsCard({ groups, scale, onScaleChange }: Props) {
    const { t } = useTranslation("post");

    return (
        <SectionCard
            className="mt-8"
            eyebrow={t("ingredients.eyebrow")}
            title={t("ingredients.title")}
            aside={
                <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
                    {SCALES.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onScaleChange(option)}
                            aria-pressed={scale === option}
                            className={cn(
                                "rounded-full px-3 py-1 text-xs font-bold transition",
                                scale === option
                                    ? "bg-vegan-green text-white"
                                    : "text-muted-foreground hover:text-vegan-green",
                            )}
                        >
                            {option}x
                        </button>
                    ))}
                </div>
            }
        >
            <div className="grid gap-6 sm:grid-cols-2">
                {groups.map((group) => (
                    <div key={group.title}>
                        <h3 className="mb-2 text-sm font-bold text-dark">{group.title}</h3>
                        <ul className="space-y-2">
                            {group.items.map((item) => (
                                <li key={item.name} className="flex gap-2 text-sm">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-vegan-green" aria-hidden="true" />
                                    <span className="font-semibold text-dark">{item.quantity}</span>
                                    <span className="text-muted-foreground">{item.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{t("ingredients.scaleNote", { count: scale })}</p>
        </SectionCard>
    );
}
