import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";

interface RefreshButtonProps {
    onRefresh: () => void;
    isRefreshing?: boolean;
}

export function RefreshButton({ onRefresh, isRefreshing }: RefreshButtonProps) {
    const { t } = useTranslation("common");
    return (
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing} title={t("refresh")}>
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin text-vegan-green")} />
            <span className="hidden sm:inline">{t("refresh")}</span>
        </Button>
    );
}
