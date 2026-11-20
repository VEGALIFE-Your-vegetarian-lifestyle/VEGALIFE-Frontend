import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { RefreshButton } from "@/components/common/RefreshButton";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { useListParams } from "@/shared/hooks/useListParams";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { FALLBACK_IMAGE, showFallbackImage } from "@/shared/utils/display";
import { createAdminDish, deleteAdminDish, getAdminDishes, updateAdminDish } from "../../adminApi";
import { MODERATION_VARIANT } from "../../constants";
import type { AdminDish, ModerationStatus } from "../../types";
import { buildDishCreate, buildDishUpdate, toDishForm, type DishFormValues } from "./dishForm";
import { DishFormDialog } from "./DishFormDialog";

const PAGE_SIZE = 10;

const MODERATION_STATES: ModerationStatus[] = ["PENDING", "APPROVED", "REJECTED"];

const isModerationState = (value: string): value is ModerationStatus =>
    (MODERATION_STATES as string[]).includes(value);

export default function AdminDishesPage() {
    const { t } = useTranslation(["admin", "common"]);
    const queryClient = useQueryClient();
    const { page, q, status, debouncedQ, setQ, setStatus, setPage } = useListParams();
    const [form, setForm] = useState<{ dish: AdminDish | null } | null>(null);
    const [deleting, setDeleting] = useState<AdminDish | null>(null);

    // URL `?status=` dùng chung key với các trang admin khác; `""` = mọi trạng thái.
    const moderationStatus = isModerationState(status) ? status : "";

    const { data, isLoading, isFetching, isError, refetch } = useQuery({
        queryKey: ["admin-dishes", page, debouncedQ, moderationStatus],
        queryFn: () =>
            getAdminDishes({
                page,
                size: PAGE_SIZE,
                name: debouncedQ.trim() || undefined,
                moderationStatus: moderationStatus || undefined,
            }),
        placeholderData: (prev) => prev,
    });

    const invalidate = () => {
        void queryClient.invalidateQueries({ queryKey: ["admin-dishes"] });
    };

    const onError = (error: unknown) => {
        toast.error(getApiErrorMessage(error, t("dishes.toast.failed")));
    };

    const createMutation = useMutation({
        mutationFn: createAdminDish,
        onSuccess: () => {
            toast.success(t("dishes.toast.created"));
            setForm(null);
            invalidate();
        },
        onError,
    });

    const updateMutation = useMutation({
        mutationFn: ({ dish, values }: { dish: AdminDish; values: DishFormValues }) => {
            const payload = buildDishUpdate(toDishForm(dish), values);
            // Không đổi gì → đóng dialog, không gọi API.
            if (!payload) return Promise.resolve(null);
            return updateAdminDish(dish.id, payload);
        },
        onSuccess: () => {
            toast.success(t("dishes.toast.updated"));
            setForm(null);
            invalidate();
        },
        onError,
    });

    const deleteMutation = useMutation({
        mutationFn: (dish: AdminDish) => deleteAdminDish(dish.id),
        onSuccess: () => {
            toast.success(t("dishes.toast.deleted"));
            setDeleting(null);
            invalidate();
        },
        onError,
    });

    const submit = (values: DishFormValues) => {
        if (!form) return;
        if (form.dish) {
            updateMutation.mutate({ dish: form.dish, values });
            return;
        }
        createMutation.mutate(buildDishCreate(values));
    };

    const total = data?.total ?? 0;
    const rows = data?.data ?? [];
    const hasFilter = q !== "" || moderationStatus !== "";

    return (
        <div>
            <PageHeader
                breadcrumb={[t("common:admin"), t("dishes.title")]}
                title={t("dishes.title")}
                description={t("dishes.description", { count: total })}
                action={
                    <div className="flex gap-2">
                        <RefreshButton onRefresh={() => void refetch()} isRefreshing={isFetching} />
                        <Button onClick={() => setForm({ dish: null })}>
                            <Plus className="h-4 w-4" />
                            {t("dishes.create")}
                        </Button>
                    </div>
                }
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:max-w-sm sm:flex-1">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        className="pl-9"
                        placeholder={t("dishes.searchPlaceholder")}
                        aria-label={t("dishes.searchPlaceholder")}
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                    />
                </div>
                <Select
                    className="sm:max-w-48"
                    aria-label={t("dishes.filterStatus")}
                    value={moderationStatus}
                    onChange={(event) => setStatus(event.target.value)}
                >
                    <option value="">{t("dishes.filterStatusAll")}</option>
                    {MODERATION_STATES.map((state) => (
                        <option key={state} value={state}>
                            {t(`recipes.moderation.status.${state}`)}
                        </option>
                    ))}
                </Select>
            </div>

            {isError ? (
                <ErrorState onRetry={() => refetch()} />
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>{t("dishes.column.image")}</TableHead>
                                <TableHead>{t("dishes.column.name")}</TableHead>
                                <TableHead>{t("dishes.column.cuisine")}</TableHead>
                                <TableHead>{t("dishes.column.moderation")}</TableHead>
                                <TableHead className="text-right">{t("dishes.column.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableSkeleton columns={5} />
                            ) : (
                                rows.map((dish) => (
                                    <TableRow key={dish.id}>
                                        <TableCell>
                                            <img
                                                src={dish.imageUrl ?? FALLBACK_IMAGE}
                                                alt=""
                                                onError={showFallbackImage()}
                                                className="h-10 w-10 rounded-lg border border-border object-cover"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{dish.name}</TableCell>
                                        <TableCell>
                                            {dish.cuisineType || <span className="text-muted-foreground">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={MODERATION_VARIANT[dish.moderationStatus]}>
                                                {t(`recipes.moderation.status.${dish.moderationStatus}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => setForm({ dish })}>
                                                    <Pencil className="h-4 w-4" />
                                                    {t("dishes.action.edit")}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-destructive"
                                                    onClick={() => setDeleting(dish)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    {t("dishes.action.delete")}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {!isLoading && rows.length === 0 && (
                        <EmptyState
                            icon={UtensilsCrossed}
                            title={t("dishes.empty.title")}
                            description={t(hasFilter ? "dishes.empty.filtered" : "dishes.empty.all")}
                            action={
                                <Button
                                    variant="outline"
                                    onClick={
                                        hasFilter
                                            ? () => {
                                                  setQ("");
                                                  setStatus("");
                                              }
                                            : () => refetch()
                                    }
                                >
                                    {t(hasFilter ? "common:clearFilter" : "dishes.empty.reload")}
                                </Button>
                            }
                        />
                    )}

                    <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
                </>
            )}

            <DishFormDialog
                state={form}
                loading={createMutation.isPending || updateMutation.isPending}
                onSubmit={submit}
                onClose={() => setForm(null)}
            />

            <ConfirmDialog
                open={deleting !== null}
                title={t("dishes.delete.title")}
                description={t("dishes.delete.body", { name: deleting?.name ?? "" })}
                confirmLabel={t("dishes.delete.confirm")}
                destructive
                loading={deleteMutation.isPending}
                onConfirm={() => deleting && deleteMutation.mutate(deleting)}
                onClose={() => setDeleting(null)}
            />
        </div>
    );
}
