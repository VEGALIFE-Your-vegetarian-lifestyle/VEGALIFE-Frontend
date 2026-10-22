import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import type { Recipe } from "@/types/recipe";
import { RecipeForm } from "./RecipeForm";

/**
 * #38 `POST /api/recipes` — tạo công thức; BE tự find-or-create dish theo `dishName`
 * (BR-RECP-002). Không có `GET /api/recipes` nên sau khi lưu chỉ hiện xác nhận,
 * không dựng trang danh sách giả.
 */
export default function RecipeFormPage() {
    const { t } = useTranslation("recipe");
    const navigate = useNavigate();
    const [created, setCreated] = useState<Recipe | null>(null);

    if (created) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                <SectionCard title={t("created.title")} className="text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-vegan-green" aria-hidden="true" />
                    <p className="mt-3 text-sm text-dark">
                        {t("created.description", { name: created.name, dish: created.dishName })}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{t("created.note")}</p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                        <Button onClick={() => setCreated(null)}>{t("created.another")}</Button>
                        <Button variant="outline" onClick={() => navigate("/meal-plan")}>
                            {t("created.plan")}
                        </Button>
                    </div>
                </SectionCard>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                breadcrumb={[t("breadcrumb"), t("title")]}
                title={t("title")}
                description={t("description")}
            />
            <RecipeForm onCreated={setCreated} />
        </div>
    );
}
