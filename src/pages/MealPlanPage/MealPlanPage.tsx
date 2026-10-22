import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CalendarDays, Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { PageHeader } from "@/shared/components/PageHeader";
import { Pagination } from "@/shared/components/Pagination";
import { SectionCard } from "@/shared/components/SectionCard";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { useMenuDetails, useMenus, useUpdateMenuStatus } from "@/hooks/useMenus";
import { getApiErrorMessage } from "@/utils/apiError";
import { cn } from "@/lib/utils";
import type { MenuStatus, MenuStatusAction, MenuSummary } from "@/types/menu";
import { MenuStatusBadge, MenuWeekView } from "./MenuWeekView";
import { formatDayLabel } from "./payload";

const PAGE_SIZE = 10;

/** BR-MENU-007 — chuyển trạng thái hợp pháp. `drafted` không bao giờ gửi được. */
const STATUS_ACTIONS: Record<MenuStatus, MenuStatusAction[]> = {
    drafted: ["scheduled", "cancelled"],
    scheduled: ["completed", "cancelled"],
    cancelled: [],
    completed: [],
};

/**
 * Thực đơn tuần — nhóm 27. Tạo/xem/sửa/đổi trạng thái bằng API thật (#60–#64).
 *
 * Không có nút "AI generate": `DOCS/API-REFERENCE.md` không có endpoint sinh thực
 * đơn. `create_menu`/`get_meal_plan` là tool nội bộ của LLM backend, không phải
 * HTTP route — xem `menuService.ts`.
 */
export default function MealPlanPage() {
    const { t, i18n } = useTranslation("mealPlan");
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<{ menu: MenuSummary; status: MenuStatusAction } | null>(null);

    const menus = useMenus({ page, size: PAGE_SIZE });
    const detail = useMenuDetails(selectedId);
    const statusMutation = useUpdateMenuStatus();

    const handleStatus = () => {
        if (!confirm) return;
        statusMutation.mutate(
            { menuId: confirm.menu.id, request: { status: confirm.status } },
            {
                onSuccess: () => {
                    toast.success(t("statusChanged"));
                    setConfirm(null);
                },
                // 409 kèm lý do cụ thể (chồng lấn tuần / không hợp lệ) — hiện nguyên văn.
                onError: (error) => toast.error(getApiErrorMessage(error, t("statusFailed"))),
            },
        );
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                breadcrumb={[t("common:home"), t("title")]}
                title={t("title")}
                description={t("description")}
                action={
                    <Button onClick={() => navigate("/meal-plan/new")}>
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        {t("create")}
                    </Button>
                }
            />

            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <SectionCard eyebrow={t("list.eyebrow")} title={t("list.title")} className="h-fit">
                    {menus.isError ? (
                        <ErrorState onRetry={() => void menus.refetch()} />
                    ) : menus.isLoading ? (
                        <div className="space-y-2" aria-busy="true">
                            {[0, 1, 2].map((row) => (
                                <Skeleton key={row} className="h-16 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : menus.data?.content.length === 0 ? (
                        <EmptyState
                            icon={CalendarDays}
                            title={t("list.emptyTitle")}
                            description={t("list.emptyDescription")}
                            action={
                                <Button onClick={() => navigate("/meal-plan/new")}>
                                    <Plus className="h-4 w-4" aria-hidden="true" />
                                    {t("create")}
                                </Button>
                            }
                        />
                    ) : (
                        <>
                            <ul className="space-y-2">
                                {menus.data?.content.map((menu) => {
                                    const isActive = menu.id === selectedId;
                                    return (
                                        <li key={menu.id}>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedId(menu.id)}
                                                aria-current={isActive ? "true" : undefined}
                                                className={cn(
                                                    "w-full rounded-xl border border-border px-3 py-2 text-left transition",
                                                    isActive ? "border-vegan-green bg-vegan-green-light" : "hover:bg-muted-bg",
                                                )}
                                            >
                                                <span className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-semibold text-dark">
                                                        {formatDayLabel(menu.startDate, i18n.language)} – {formatDayLabel(menu.endDate, i18n.language)}
                                                    </span>
                                                    <MenuStatusBadge status={menu.status} />
                                                </span>
                                                {menu.notes && (
                                                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                                                        {menu.notes}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>

                            <Pagination
                                page={page + 1}
                                totalPages={menus.data?.totalPages ?? 1}
                                onChange={(next) => setPage(next - 1)}
                            />
                        </>
                    )}
                </SectionCard>

                <div>
                    {!selectedId ? (
                        <SectionCard>
                            <EmptyState
                                icon={UtensilsCrossed}
                                title={t("detail.selectTitle")}
                                description={t("detail.selectDescription")}
                            />
                        </SectionCard>
                    ) : detail.isError ? (
                        <SectionCard>
                            <ErrorState onRetry={() => void detail.refetch()} />
                        </SectionCard>
                    ) : detail.isLoading || !detail.data ? (
                        <SectionCard>
                            <div className="space-y-3" aria-busy="true">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-40 w-full rounded-2xl" />
                            </div>
                        </SectionCard>
                    ) : (
                        <SectionCard
                            eyebrow={t("detail.eyebrow")}
                            title={`${formatDayLabel(detail.data.startDate, i18n.language)} – ${formatDayLabel(detail.data.endDate, i18n.language)}`}
                            aside={<MenuStatusBadge status={detail.data.status} />}
                            footnote={detail.data.notes || undefined}
                        >
                            <MenuWeekView detail={detail.data} />

                            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                                {/* #63: chỉ sửa được drafted/scheduled (BR-MENU-006). */}
                                {(detail.data.status === "drafted" || detail.data.status === "scheduled") && (
                                    <Link to={`/meal-plan/${detail.data.id}/edit`}>
                                        <Button variant="outline" size="sm">
                                            <Pencil className="h-4 w-4" aria-hidden="true" />
                                            {t("detail.edit")}
                                        </Button>
                                    </Link>
                                )}

                                {STATUS_ACTIONS[detail.data.status].map((status) => (
                                    <Button
                                        key={status}
                                        variant={status === "cancelled" ? "destructive" : "primary"}
                                        size="sm"
                                        disabled={statusMutation.isPending}
                                        onClick={() => setConfirm({ menu: detail.data!, status })}
                                    >
                                        {status === "cancelled" && <Trash2 className="h-4 w-4" aria-hidden="true" />}
                                        {t(`action.${status}`)}
                                    </Button>
                                ))}
                            </div>
                        </SectionCard>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={!!confirm}
                title={confirm ? t(`confirm.${confirm.status}Title`) : ""}
                description={confirm ? t(`confirm.${confirm.status}Body`) : ""}
                confirmLabel={confirm ? t(`action.${confirm.status}`) : ""}
                destructive={confirm?.status === "cancelled"}
                loading={statusMutation.isPending}
                onConfirm={handleStatus}
                onClose={() => setConfirm(null)}
            />
        </div>
    );
}
