import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
    const { t } = useTranslation("common");

    return (
        <div className="mx-auto max-w-7xl px-4 py-16">
            <EmptyState
                icon={SearchX}
                title={t("notFound.title")}
                description={t("notFound.description")}
                action={
                    <Link to="/">
                        <Button>{t("notFound.backHome")}</Button>
                    </Link>
                }
            />
        </div>
    );
}
