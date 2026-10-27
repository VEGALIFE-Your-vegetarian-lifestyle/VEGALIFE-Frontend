import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { MenuCard } from "../components/MenuCard";
import { WeekNavigator } from "../components/WeekNavigator";
import { useMealPlans } from "../useMealPlans";
import { addDays, parseISODate, shiftWeek, startOfWeek, toISODate } from "../week";

export default function MealPlanPage() {
    const { t } = useTranslation("menu");
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Tuần đang xem nằm trên URL; giá trị hỏng (vd `?from=abc`) rơi về tuần hiện tại.
    const monday = useMemo(() => {
        const requested = parseISODate(searchParams.get("from") ?? "");
        return startOfWeek(Number.isNaN(requested.getTime()) ? new Date() : requested);
    }, [searchParams]);

    const from = toISODate(monday);
    const to = toISODate(addDays(monday, 6));
    const { data: menus, isLoading, isError, refetch } = useMealPlans({ from, to });

    const goToWeek = (next: Date) => setSearchParams({ from: toISODate(next) }, { replace: true });

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                breadcrumb={[t("breadcrumb")]}
                title={t("title")}
                description={t("subtitle")}
                action={
                    <div className="flex flex-wrap items-center gap-2">
                        <WeekNavigator
                            from={from}
                            to={to}
                            onPrev={() => goToWeek(shiftWeek(monday, -1))}
                            onNext={() => goToWeek(shiftWeek(monday, 1))}
                            onToday={() => goToWeek(startOfWeek(new Date()))}
                        />
                        <Button onClick={() => navigate(`/meal-plan/create?from=${from}`)}>
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            {t("create.action")}
                        </Button>
                    </div>
                }
            />

            {isLoading && (
                <div className="space-y-4">
                    {[0, 1].map((key) => (
                        <Skeleton key={key} className="h-56 w-full rounded-2xl" />
                    ))}
                </div>
            )}

            {isError && <ErrorState onRetry={() => void refetch()} />}

            {!isLoading && !isError && menus?.length === 0 && (
                <EmptyState
                    icon={CalendarDays}
                    title={t("empty.title")}
                    description={t("empty.description")}
                    action={
                        <div className="flex flex-wrap justify-center gap-2">
                            <Button onClick={() => navigate(`/meal-plan/create?from=${from}`)}>
                                {t("empty.create")}
                            </Button>
                            <Button variant="outline" onClick={() => navigate("/ai-nutrition")}>
                                {t("empty.action")}
                            </Button>
                        </div>
                    }
                />
            )}

            {!isLoading && !isError && !!menus?.length && (
                <div className="space-y-4">
                    {menus.map((menu) => (
                        <MenuCard key={menu.id} menu={menu} />
                    ))}
                </div>
            )}
        </div>
    );
}
