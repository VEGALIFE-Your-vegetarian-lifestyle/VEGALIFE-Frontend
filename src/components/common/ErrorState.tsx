import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({ onRetry }: { onRetry: () => void }) {
    const { t } = useTranslation("common");

    return (
        <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
            <AlertCircle className="mb-4 h-16 w-16 text-terracotta" aria-hidden="true" />
            <h3 className="mb-2 text-lg font-semibold text-dark">{t("errorState.title")}</h3>
            <p className="mb-6 max-w-sm text-muted-foreground">{t("errorState.description")}</p>
            <Button variant="outline" onClick={onRetry}>
                {t("errorState.retry")}
            </Button>
        </div>
    );
}
