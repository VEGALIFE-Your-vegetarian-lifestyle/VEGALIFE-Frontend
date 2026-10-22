import { useTranslation } from "react-i18next";
import { ArrowRight, Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Bảng thay thế nguyên liệu — nội dung tĩnh, không có endpoint nào trả về
 * (nhóm 24 chỉ có chat + conversations). Giữ nguyên như mockup, chuyển chuỗi
 * sang i18n. ponytail: thay bằng dữ liệu thật nếu sau này có API recipes/swaps.
 */
const SWAP_KEYS = ["flaxEgg", "cashewCream", "parmesan", "buttermilk"] as const;

export function SwapCheatSheet() {
    const { t } = useTranslation("aiNutrition");

    return (
        <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold text-dark">
                    <Leaf className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                    {t("swaps.title")}
                </h2>
                <Badge variant="lightgreen" size="sm">
                    {t("swaps.verified")}
                </Badge>
            </div>
            <ul className="mt-4 space-y-3">
                {SWAP_KEYS.map((key) => (
                    <li key={key} className="rounded-xl border border-border p-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                            <span className="rounded-full bg-muted-bg px-2 py-0.5 text-dark">
                                {t(`swaps.items.${key}.from`)}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-vegan-green" aria-hidden="true" />
                            <span className="rounded-full bg-vegan-green-light px-2 py-0.5 text-vegan-green">
                                {t(`swaps.items.${key}.to`)}
                            </span>
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">{t(`swaps.items.${key}.detail`)}</p>
                    </li>
                ))}
            </ul>
        </section>
    );
}
