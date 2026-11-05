import { useTranslation } from "react-i18next";
import { ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FormValues } from "./payload";

interface PostPreviewCardProps {
    values: FormValues;
}

/**
 * Thẻ xem trước dựng từ **chính giá trị form** — không có dữ liệu bịa.
 * Mockup screen05 có badge "Vegan • 28g Protein"; post không có field dinh dưỡng
 * nên chỗ đó hiện số category đang chọn.
 */
export function PostPreviewCard({ values }: PostPreviewCardProps) {
    const { t } = useTranslation(["admin", "common"]);

    const title = values.title.trim();
    const summary = values.summary.trim();

    return (
        <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("posts.composer.previewHeading", { ns: "admin" })}
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border">
                <div className="relative flex h-24 items-center justify-center bg-muted-bg">
                    {values.featuredImageUrl ? (
                        <img
                            src={values.featuredImageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    )}
                    {values.categoryIds.length > 0 && (
                        <Badge variant="lightgreen" size="sm" className="absolute left-1.5 top-1.5">
                            {t("posts.composer.categoryCount", {
                                ns: "admin",
                                count: values.categoryIds.length,
                            })}
                        </Badge>
                    )}
                </div>
                <div className="space-y-1 p-2.5">
                    <p
                        className={
                            title
                                ? "line-clamp-1 text-sm font-bold text-dark"
                                : "line-clamp-1 text-sm text-muted-foreground"
                        }
                    >
                        {title || t("posts.form.titlePlaceholder", { ns: "admin" })}
                    </p>
                    <p
                        className={
                            summary
                                ? "line-clamp-2 text-xs leading-tight text-muted-foreground"
                                : "line-clamp-2 text-xs leading-tight text-muted-foreground/70"
                        }
                    >
                        {summary || t("posts.composer.previewEmpty", { ns: "admin" })}
                    </p>
                </div>
            </div>
        </div>
    );
}
