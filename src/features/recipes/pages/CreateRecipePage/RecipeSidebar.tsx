import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Braces, Check, Circle, Loader2, Play, Ruler, Scale, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/shared/utils/cn";
import type { CreateRecipeRequest } from "../../types";

export interface ReadinessItem {
    key: string;
    label: string;
    value: string;
    done: boolean;
}

interface RecipeSidebarProps {
    items: ReadinessItem[];
    submitting: boolean;
    /** Payload thật sẽ gửi — dùng cho khối "Preview JSON". */
    payload: CreateRecipeRequest;
}

/**
 * Cột phải trang tạo công thức: mức sẵn sàng + nút tạo + tiêu chuẩn dữ liệu.
 * Không có checklist duyệt bài (recipe không có draft/publish) — chỉ là phản hồi
 * tức thì cho người nhập liệu.
 */
export function RecipeSidebar({ items, submitting, payload }: RecipeSidebarProps) {
    const { t } = useTranslation("recipe");
    const [showJson, setShowJson] = useState(false);

    const doneCount = items.filter((item) => item.done).length;
    const percent = Math.round((doneCount / items.length) * 100);

    return (
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-bold text-dark">{t("readiness.title")}</h2>
                    <Badge variant={percent === 100 ? "lightgreen" : "amber"} size="sm">
                        {t("readiness.percent", { percent })}
                    </Badge>
                </div>
                <Progress className="mt-3" value={percent} tone={percent === 100 ? "green" : "amber"} />

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

                <Button type="submit" block className="mt-5" disabled={submitting}>
                    {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                        <Play className="h-4 w-4" aria-hidden="true" />
                    )}
                    {submitting ? t("action.submitting") : t("action.submit")}
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">{t("readiness.footnote")}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-base font-bold text-dark">{t("standards.title")}</h2>
                <dl className="mt-4 space-y-4">
                    {[
                        { key: "units", Icon: Ruler },
                        { key: "precision", Icon: Scale },
                        { key: "unique", Icon: ShieldCheck },
                    ].map(({ key, Icon }) => (
                        <div key={key} className="flex gap-2.5">
                            <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                            <div>
                                <dt className="text-sm font-semibold text-dark">{t(`standards.${key}.title`)}</dt>
                                <dd className="mt-0.5 text-xs text-muted-foreground">
                                    {t(`standards.${key}.description`)}
                                </dd>
                            </div>
                        </div>
                    ))}
                </dl>

                <button
                    type="button"
                    aria-expanded={showJson}
                    onClick={() => setShowJson((open) => !open)}
                    className="mt-4 flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-dark hover:bg-muted"
                >
                    <span className="flex items-center gap-2">
                        <Braces className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        {t("standards.previewJson")}
                    </span>
                    <span aria-hidden="true">{showJson ? "−" : "+"}</span>
                </button>
                {showJson && (
                    <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-muted-bg p-3 text-[11px] leading-relaxed text-dark">
                        {JSON.stringify(payload, null, 2)}
                    </pre>
                )}
            </div>
        </aside>
    );
}
