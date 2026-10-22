import { useTranslation } from "react-i18next";
import { SectionCard } from "@/components/common/SectionCard";
import type { PostStep } from "../../types";

/** Các bước nấu, đánh số thứ tự. `timestamp` chỉ có ở bài video. */
export function InstructionsCard({ steps }: { steps: PostStep[] }) {
    const { t } = useTranslation("post");

    return (
        <SectionCard className="mt-6" eyebrow={t("steps.eyebrow")} title={t("steps.title")}>
            <ol className="space-y-5">
                {steps.map((step, index) => (
                    <li key={step.title} className="flex gap-4">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-vegan-green-light text-sm font-bold text-vegan-green">
                            {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h3 className="font-bold text-dark">{step.title}</h3>
                                {step.timestamp && (
                                    <span className="whitespace-nowrap text-xs font-semibold text-muted-foreground">
                                        {step.timestamp}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </SectionCard>
    );
}
