import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

/** Hộp "bí quyết của đầu bếp" — dữ liệu mock, xem shared/mocks/postEnrichment.ts. */
export function ChefSecretCard({ tip }: { tip: string }) {
    const { t } = useTranslation("post");

    return (
        <div className="mt-6 flex gap-4 rounded-2xl border border-lavender-hover bg-lavender p-5">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface text-lavender-strong">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
                <h3 className="font-bold text-lavender-strong">{t("chefSecret.title")}</h3>
                <p className="mt-1 text-sm leading-relaxed text-dark">{tip}</p>
            </div>
        </div>
    );
}
