import { useTranslation } from "react-i18next";
import { FileText, Film } from "lucide-react";
import { SectionCard } from "@/shared/components/SectionCard";
import { cn } from "@/lib/utils";
import type { PostType } from "@/types/post";

interface Props {
    value: PostType;
    onChange: (type: PostType) => void;
}

/** Khối "1. Content format" — chọn blog hay video. */
export function ContentFormatSelector({ value, onChange }: Props) {
    const { t } = useTranslation("admin");
    const isBlog = value === "blog";

    const options = [
        {
            type: "blog" as const,
            icon: FileText,
            label: t("posts.form.typeBlog"),
            hint: t("posts.composer.typeBlogHint"),
        },
        {
            type: "video" as const,
            icon: Film,
            label: t("posts.form.typeVideo"),
            hint: t("posts.composer.typeVideoHint"),
        },
    ];

    return (
        <SectionCard eyebrow={t("posts.composer.section1")} title={t("posts.form.contentFormat")}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {options.map((option) => {
                    const selected = option.type === "blog" ? isBlog : !isBlog;
                    const Icon = option.icon;
                    return (
                        <button
                            key={option.type}
                            type="button"
                            onClick={() => onChange(option.type)}
                            className={cn(
                                "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition",
                                selected
                                    ? "border-vegan-green bg-vegan-green-light"
                                    : "border-border bg-surface hover:border-vegan-green-muted",
                            )}
                        >
                            <Icon
                                className={cn("h-5 w-5", selected ? "text-vegan-green" : "text-muted-foreground")}
                                aria-hidden="true"
                            />
                            <span className="text-sm font-semibold text-dark">{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.hint}</span>
                        </button>
                    );
                })}
            </div>
        </SectionCard>
    );
}
