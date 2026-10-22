import { useTranslation } from "react-i18next";
import { ChefHat, Clock, Flame, Users } from "lucide-react";
import type { PostDetailResponse } from "../../types";

/** Dải 4 ô thông tin nhanh. Số liệu đến từ mock enrichment — xem `features/posts/mockEnrichment.ts`. */
export function FactStrip({ post }: { post: PostDetailResponse }) {
    const { t } = useTranslation("post");

    const facts = [
        { key: "prep", icon: Clock, label: t("fact.prep"), value: `${post.prepTimeMinutes ?? 20} min` },
        { key: "servings", icon: Users, label: t("fact.servings"), value: String(post.servings ?? 2) },
        { key: "difficulty", icon: ChefHat, label: t("fact.difficulty"), value: post.difficulty ?? "Easy" },
        { key: "calories", icon: Flame, label: t("fact.calories"), value: `${post.nutrition?.calories ?? 0} kcal` },
    ];

    return (
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((fact) => (
                <div key={fact.key} className="rounded-xl border border-border bg-card p-3 text-center">
                    <fact.icon className="mx-auto h-4 w-4 text-vegan-green" aria-hidden="true" />
                    <dt className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {fact.label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-bold text-dark">{fact.value}</dd>
                </div>
            ))}
        </dl>
    );
}
