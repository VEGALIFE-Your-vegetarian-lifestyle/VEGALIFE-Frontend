import { useTranslation } from "react-i18next";
import { Check, Circle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export interface ChecklistItem {
    key: string;
    done: boolean;
}

/** Cột phải trang soạn bài: checklist xuất bản + panel AI (số liệu tĩnh). */
export function PostSidebar({ checklist }: { checklist: ChecklistItem[] }) {
    const { t } = useTranslation("admin");
    const doneCount = checklist.filter((item) => item.done).length;
    const progress = Math.round((doneCount / checklist.length) * 100);

    return (
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-dark">{t("posts.checklist.heading")}</h3>
                    <Badge variant={doneCount === checklist.length ? "lightgreen" : "amber"} size="sm">
                        {doneCount}/{checklist.length}
                    </Badge>
                </div>
                <Progress className="mt-3" value={progress} tone={doneCount === checklist.length ? "green" : "amber"} />
                <ul className="mt-3 space-y-2">
                    {checklist.map((item) => (
                        <li key={item.key} className="flex items-start gap-2 text-sm">
                            {item.done ? (
                                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-vegan-green" aria-hidden="true" />
                            ) : (
                                <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                            )}
                            <span className={item.done ? "text-dark" : "text-muted-foreground"}>
                                {t(`posts.checklist.${item.key}`)}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* ponytail: backend chưa có API phân tích dinh dưỡng — số liệu dưới đây là tĩnh,
                thay bằng kết quả từ endpoint AI khi nhóm 24 sẵn sàng. */}
            <div className="rounded-2xl border border-vegan-green-muted bg-vegan-green-subtle p-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-vegan-green">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    {t("posts.ai.title")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{t("posts.ai.description")}</p>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    {["protein", "carbs", "fat", "fiber"].map((macro) => (
                        <div key={macro} className="rounded-xl bg-surface px-3 py-2">
                            <dt className="text-xs text-muted-foreground">{t(`posts.ai.${macro}`)}</dt>
                            <dd className="font-bold text-dark">—</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </aside>
    );
}
