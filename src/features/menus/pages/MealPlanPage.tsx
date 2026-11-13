import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PillTabs } from "@/components/ui/pill-tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { MenuCard } from "../components/MenuCard";
import { WeekNavigator } from "../components/WeekNavigator";
import { useMealPlans } from "../useMealPlans";
import { addDays, parseISODate, toISODate } from "../week";
import { useUiStore } from "@/shared/ui/uiStore";
import type { MenuStatus } from "../types";

/** Bộ lọc mặc định: chỉ menu đang chạy. Draft/cancelled phải chọn tay mới hiện. */
const STATUS_FILTERS = ["scheduled", "drafted", "cancelled", "completed"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const isStatusFilter = (value: string | null): value is StatusFilter =>
    STATUS_FILTERS.includes(value as StatusFilter);

export default function MealPlanPage() {
    const { t } = useTranslation("menu");
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const openMealPlanComposer = useUiStore((state) => state.openMealPlanComposer);

    // Cửa sổ 7 ngày bắt đầu từ `?from=` (thứ mấy cũng được); giá trị hỏng rơi về hôm nay.
    const first = useMemo(() => {
        const requested = parseISODate(searchParams.get("from") ?? "");
        return Number.isNaN(requested.getTime()) ? new Date() : requested;
    }, [searchParams]);

    const statusParam = searchParams.get("status");
    const status: StatusFilter = isStatusFilter(statusParam) ? statusParam : "scheduled";

    const from = toISODate(first);
    const to = toISODate(addDays(first, 6));
    const { data: menus, isLoading, isError, refetch } = useMealPlans({ from, to });

    /** Số lượng theo từng trạng thái — để pill hiện count mà không phải gọi thêm. */
    const counts = useMemo(() => {
        const result: Record<MenuStatus, number> = { drafted: 0, scheduled: 0, cancelled: 0, completed: 0 };
        for (const menu of menus ?? []) result[menu.status] += 1;
        return result;
    }, [menus]);

    const visible = useMemo(() => (menus ?? []).filter((menu) => menu.status === status), [menus, status]);

    /** Đổi tuần/bộ lọc bằng cách sửa đúng một key, giữ nguyên phần còn lại của URL. */
    const setParam = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams);
        next.set(key, value);
        setSearchParams(next, { replace: true });
    };

    const goToWeek = (next: Date) => setParam("from", toISODate(next));

    return (
        <>
            <header className="flex flex-wrap items-end justify-between gap-3 px-0.5">
                <div>
                    <h1 className="text-2xl font-semibold leading-tight text-dark sm:text-[25px]">{t("title")}</h1>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">{t("subtitle")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
                    <WeekNavigator
                        from={from}
                        to={to}
                        onPrev={() => goToWeek(addDays(first, -7))}
                        onNext={() => goToWeek(addDays(first, 7))}
                        onToday={() => goToWeek(new Date())}
                    />
                    <Button className="max-sm:flex-1" onClick={() => openMealPlanComposer(from)}>
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        {t("create.action")}
                    </Button>
                </div>
            </header>

            <div className="space-y-4">
                <PillTabs
                    value={status}
                    onChange={(next) => setParam("status", next)}
                    items={STATUS_FILTERS.map((key) => ({
                        key,
                        label: t(`status.${key}`),
                        count: counts[key],
                    }))}
                />

                {isLoading && (
                    <div className="space-y-4">
                        {[0, 1].map((key) => (
                            <Skeleton key={key} className="h-56 w-full rounded-2xl" />
                        ))}
                    </div>
                )}

                {isError && <ErrorState onRetry={() => void refetch()} />}

                {!isLoading && !isError && (menus?.length ?? 0) === 0 && (
                    <EmptyState
                        icon={CalendarDays}
                        title={t("empty.title")}
                        description={t("empty.description")}
                        action={
                            <div className="flex flex-wrap justify-center gap-2">
                                <Button onClick={() => openMealPlanComposer(from)}>
                                    {t("empty.create")}
                                </Button>
                                <Button variant="outline" onClick={() => navigate("/ai-nutrition")}>
                                    {t("empty.action")}
                                </Button>
                            </div>
                        }
                    />
                )}

                {/* Có menu trong tuần nhưng không có menu ở trạng thái đang lọc. */}
                {!isLoading && !isError && (menus?.length ?? 0) > 0 && visible.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                        {t("filter.empty", { status: t(`status.${status}`) })}
                    </p>
                )}

                {visible.length > 0 && (
                    <div className="space-y-4">
                        {visible.map((menu) => (
                            <MenuCard key={menu.id} menu={menu} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
