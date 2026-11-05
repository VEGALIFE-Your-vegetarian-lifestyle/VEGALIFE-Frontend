import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Apple, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { useListParams } from "@/shared/hooks/useListParams";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import {
    createAdminIngredient,
    deleteAdminIngredient,
    getAdminIngredients,
    updateAdminIngredient,
} from "../../adminApi";
import { buildIngredientCreate, buildIngredientUpdate, type IngredientFormValues } from "../../ingredientForm";
import { INGREDIENT_UNITS, type AdminIngredient, type IngredientUnit } from "../../types";
import { IngredientFormDialog } from "./IngredientFormDialog";

const PAGE_SIZE = 10;

/** `""` = mọi đơn vị · `"NONE"` = BE trả `unit: null` (member gõ tên nhưng admin chưa điền). */
type UnitFilter = IngredientUnit | "" | "NONE";

const isUnitFilter = (value: string): value is UnitFilter =>
    value === "" || value === "NONE" || (INGREDIENT_UNITS as readonly string[]).includes(value);

const matchesUnit = (ingredient: AdminIngredient, filter: UnitFilter) => {
    if (filter === "") return true;
    if (filter === "NONE") return ingredient.unit === null;
    return ingredient.unit === filter;
};

/** Một ô dinh dưỡng; `null` = BE chưa có số liệu, **không** phải 0. */
function Cell({ value }: { value: number | null }) {
    return (
        <TableCell className="text-right tabular-nums">
            {value == null ? <span className="text-muted-foreground">—</span> : value.toFixed(2)}
        </TableCell>
    );
}

export default function AdminIngredientsPage() {
    const { t } = useTranslation(["admin", "common"]);
    const queryClient = useQueryClient();
    const { page, q, debouncedQ, setQ, setPage } = useListParams();
    const [unit, setUnit] = useState<UnitFilter>("");
    const [form, setForm] = useState<{ ingredient: AdminIngredient | null } | null>(null);
    const [deleting, setDeleting] = useState<AdminIngredient | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-ingredients", page, debouncedQ],
        queryFn: () =>
            getAdminIngredients({
                page,
                size: PAGE_SIZE,
                name: debouncedQ.trim() || undefined,
            }),
        placeholderData: (prev) => prev,
    });

    const invalidate = () => {
        void queryClient.invalidateQueries({ queryKey: ["admin-ingredients"] });
        // Badge sidebar + dialog duyệt recipe đọc chung nguồn này.
        void queryClient.invalidateQueries({ queryKey: ["admin-ingredients-pending-count"] });
    };

    const onError = (error: unknown) => {
        toast.error(getApiErrorMessage(error, t("ingredients.toast.failed")));
    };

    const createMutation = useMutation({
        mutationFn: createAdminIngredient,
        onSuccess: () => {
            toast.success(t("ingredients.toast.created"));
            setForm(null);
            invalidate();
        },
        onError,
    });

    const updateMutation = useMutation({
        mutationFn: ({ ingredient, values }: { ingredient: AdminIngredient; values: IngredientFormValues }) => {
            const result = buildIngredientUpdate(ingredient, values);
            // Không đổi gì → đóng dialog, không gọi API.
            if (!result.ok || !result.payload) return Promise.resolve(null);
            return updateAdminIngredient(ingredient.id, result.payload);
        },
        onSuccess: () => {
            toast.success(t("ingredients.toast.updated"));
            setForm(null);
            invalidate();
        },
        onError,
    });

    const deleteMutation = useMutation({
        mutationFn: (ingredient: AdminIngredient) => deleteAdminIngredient(ingredient.id),
        onSuccess: () => {
            toast.success(t("ingredients.toast.deleted"));
            setDeleting(null);
            invalidate();
        },
        onError,
    });

    const submit = (values: IngredientFormValues) => {
        if (!form) return;
        if (form.ingredient) {
            updateMutation.mutate({ ingredient: form.ingredient, values });
            return;
        }
        const result = buildIngredientCreate(values);
        if (!result.ok || !result.payload) return;
        createMutation.mutate(result.payload);
    };

    const total = data?.total ?? 0;
    // ponytail: backend chưa có param `unit` → lọc **trên trang hiện tại** (page vẫn do server
    // chia theo toàn bộ dữ liệu). Thay bằng param server-side khi `AdminComponentListRequest` mở.
    const rows = useMemo(() => (data?.data ?? []).filter((item) => matchesUnit(item, unit)), [data, unit]);
    const hasFilter = q !== "" || unit !== "";

    return (
        <div>
            <PageHeader
                breadcrumb={[t("common:admin"), t("ingredients.title")]}
                title={t("ingredients.title")}
                description={t("ingredients.description", { count: total })}
                action={
                    <Button onClick={() => setForm({ ingredient: null })}>
                        <Plus className="h-4 w-4" />
                        {t("ingredients.create")}
                    </Button>
                }
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:max-w-sm sm:flex-1">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        className="pl-9"
                        placeholder={t("ingredients.searchPlaceholder")}
                        aria-label={t("ingredients.searchPlaceholder")}
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                    />
                </div>
                <Select
                    className="sm:max-w-48"
                    aria-label={t("ingredients.filterUnit")}
                    value={unit}
                    onChange={(event) => isUnitFilter(event.target.value) && setUnit(event.target.value)}
                >
                    <option value="">{t("ingredients.filterUnitAll")}</option>
                    <option value="NONE">{t("ingredients.filterUnitNone")}</option>
                    {INGREDIENT_UNITS.map((code) => (
                        <option key={code} value={code}>
                            {t(`ingredients.unit.${code}`)}
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
                                <TableHead>{t("ingredients.column.name")}</TableHead>
                                <TableHead>{t("ingredients.column.unit")}</TableHead>
                                <TableHead className="text-right">{t("ingredients.nutrition.calories")}</TableHead>
                                <TableHead className="text-right">{t("ingredients.nutrition.proteinG")}</TableHead>
                                <TableHead className="text-right">{t("ingredients.nutrition.carbohydrateG")}</TableHead>
                                <TableHead className="text-right">{t("ingredients.nutrition.fatG")}</TableHead>
                                <TableHead className="text-right">{t("ingredients.nutrition.fiberG")}</TableHead>
                                <TableHead className="text-right">{t("ingredients.column.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableSkeleton columns={8} />
                            ) : (
                                rows.map((ingredient) => (
                                    <TableRow key={ingredient.id}>
                                        <TableCell className="font-medium">{ingredient.name}</TableCell>
                                        <TableCell>
                                            {ingredient.unit ? (
                                                t(`ingredients.unit.${ingredient.unit}`)
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <Cell value={ingredient.calories} />
                                        <Cell value={ingredient.proteinG} />
                                        <Cell value={ingredient.carbohydrateG} />
                                        <Cell value={ingredient.fatG} />
                                        <Cell value={ingredient.fiberG} />
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => setForm({ ingredient })}>
                                                    <Pencil className="h-4 w-4" />
                                                    {t("ingredients.action.edit")}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-destructive"
                                                    onClick={() => setDeleting(ingredient)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    {t("ingredients.action.delete")}
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
                            icon={Apple}
                            title={t("ingredients.empty.title")}
                            description={t(hasFilter ? "ingredients.empty.filtered" : "ingredients.empty.all")}
                            action={
                                <Button
                                    variant="outline"
                                    onClick={
                                        hasFilter
                                            ? () => {
                                                  setQ("");
                                                  setUnit("");
                                              }
                                            : () => refetch()
                                    }
                                >
                                    {t(hasFilter ? "common:clearFilter" : "ingredients.empty.reload")}
                                </Button>
                            }
                        />
                    )}

                    <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
                </>
            )}

            <IngredientFormDialog
                state={form}
                loading={createMutation.isPending || updateMutation.isPending}
                onSubmit={submit}
                onClose={() => setForm(null)}
            />

            <ConfirmDialog
                open={deleting !== null}
                title={t("ingredients.delete.title")}
                description={t("ingredients.delete.body", { name: deleting?.name ?? "" })}
                confirmLabel={t("ingredients.delete.confirm")}
                destructive
                loading={deleteMutation.isPending}
                onConfirm={() => deleting && deleteMutation.mutate(deleting)}
                onClose={() => setDeleting(null)}
            />
        </div>
    );
}
