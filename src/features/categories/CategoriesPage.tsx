import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive, Download, Pencil, Plus, Search, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createCategory, exportCategoriesCsv, getCategories, retireCategory, updateCategory } from "./api";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import type { Category, CategoryPayload } from "./types";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { CategoryFormDialog } from "./CategoryFormDialog";

const PAGE_SIZE = 8;

export default function CategoriesPage() {
    const { t } = useTranslation("admin");
    const queryClient = useQueryClient();
    const [keyword, setKeyword] = useState("");
    const [sort, setSort] = useState<"newest" | "name">("newest");
    const [page, setPage] = useState(1);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [retiring, setRetiring] = useState<Category | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-categories", page, keyword, sort],
        queryFn: () => getCategories({ page, size: PAGE_SIZE, q: keyword, sort }),
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    const onError = (error: unknown) => {
        toast.error(getApiErrorMessage(error, t("categories.toast.failed")));
    };

    const createMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            toast.success(t("categories.toast.created"));
            setFormOpen(false);
            invalidate();
        },
        onError,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<CategoryPayload> }) => updateCategory(id, payload),
        onSuccess: () => {
            toast.success(t("categories.toast.updated"));
            setFormOpen(false);
            invalidate();
        },
        onError,
    });

    const retireMutation = useMutation({
        mutationFn: retireCategory,
        onSuccess: () => {
            toast.success(t("categories.toast.retired"));
            setRetiring(null);
            invalidate();
        },
        onError,
    });

    const exportMutation = useMutation({
        mutationFn: exportCategoriesCsv,
        onSuccess: (csv) => {
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `categories-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success(t("categories.toast.exported"));
        },
        onError,
    });

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (category: Category) => {
        setEditing(category);
        setFormOpen(true);
    };

    const handleKeywordChange = (value: string) => {
        setKeyword(value);
        setPage(1);
    };

    const handleSortChange = (value: "newest" | "name") => {
        setSort(value);
        setPage(1);
    };

    const copyId = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success(t("categories.toast.copied"));
    };

    const categories = data?.data ?? [];
    const totalPages = data?.totalPages ?? 1;
    const total = data?.total ?? 0;

    return (
        <div>
            <PageHeader
                breadcrumb={[t("common:admin"), t("categories.title")]}
                title={t("categories.title")}
                description={t("categories.description")}
                action={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
                            <Download className="h-4 w-4" />
                            {t("categories.exportCsv")}
                        </Button>
                        <Button onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            {t("categories.createCategory")}
                        </Button>
                    </div>
                }
            />

            {/* Metric cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                    { label: t("categories.tabs.all"), value: total, color: "bg-vegan-green text-white" },
                    { label: t("categories.tabs.active"), value: categories.length, color: "bg-vegan-green-light text-vegan-green" },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        <p className="mt-1 text-2xl font-bold text-dark">{item.value.toLocaleString()}</p>
                    </div>
                ))}
            </div>

            <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative sm:max-w-sm">
                        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <Input
                            className="pl-9"
                            placeholder={t("categories.searchPlaceholder")}
                            aria-label={t("categories.searchPlaceholder")}
                            value={keyword}
                            onChange={(event) => handleKeywordChange(event.target.value)}
                        />
                    </div>
                    <Select
                        aria-label={t("categories.sort.newest")}
                        value={sort}
                        onChange={(event) => handleSortChange(event.target.value as "newest" | "name")}
                        className="w-full sm:w-48"
                    >
                        <option value="newest">{t("categories.sort.newest")}</option>
                        <option value="name">{t("categories.sort.name")}</option>
                    </Select>
                </div>
            </div>

            {isError ? (
                <ErrorState onRetry={() => refetch()} />
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-32">{t("categories.columns.uuid")}</TableHead>
                                <TableHead>{t("categories.columns.name")}</TableHead>
                                <TableHead>{t("categories.columns.description")}</TableHead>
                                <TableHead>{t("categories.columns.status")}</TableHead>
                                <TableHead>{t("categories.columns.createdAt")}</TableHead>
                                <TableHead className="text-right">{t("categories.columns.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableSkeleton columns={6} />
                            ) : (
                                categories.map((category: Category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>
                                            <button
                                                type="button"
                                                onClick={() => copyId(category.id)}
                                                className="font-mono text-xs text-muted-foreground hover:text-vegan-green"
                                                title={t("categories.toast.copied")}
                                            >
                                                {category.id.slice(0, 8)}...
                                            </button>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-vegan-green-light text-vegan-green">
                                                    <span className="text-sm font-bold">{category.name.charAt(0).toUpperCase()}</span>
                                                </div>
                                                <span className="font-semibold">{category.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs text-muted-foreground">{category.description}</TableCell>
                                        <TableCell>
                                            <Badge variant="lightgreen">{t("categories.status.active")}</Badge>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{formatDateLocale(category.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => openEdit(category)}>
                                                    <Pencil className="h-4 w-4" />
                                                    {t("categories.actions.edit")}
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => setRetiring(category)}>
                                                    <Archive className="h-4 w-4" />
                                                    {t("categories.actions.retire")}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {!isLoading && categories.length === 0 && (
                        <EmptyState
                            icon={Tags}
                            title={t("categories.empty.title")}
                            description={keyword ? t("common:emptySearch") : t("categories.empty.description")}
                            action={
                                keyword ? (
                                    <Button variant="outline" onClick={() => handleKeywordChange("")}>
                                        {t("common:clearFilter")}
                                    </Button>
                                ) : (
                                    <Button onClick={openCreate}>{t("categories.createCategory")}</Button>
                                )
                            }
                        />
                    )}

                    {!isLoading && categories.length > 0 && (
                        <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>
                                    {t("categories.tabs.all")}: <strong className="text-dark">{total}</strong>
                                </span>
                                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                            </div>
                        </div>
                    )}
                </>
            )}

            <CategoryFormDialog
                open={formOpen}
                category={editing}
                loading={createMutation.isPending || updateMutation.isPending}
                onSubmit={(payload) => {
                    if (editing) {
                        const updatePayload: Partial<CategoryPayload> = {};
                        if (payload.name !== editing.name) updatePayload.name = payload.name.trim();
                        if (payload.description !== (editing.description ?? "")) {
                            updatePayload.description = (payload.description ?? "").trim();
                        }
                        updateMutation.mutate({ id: editing.id, payload: updatePayload });
                    } else {
                        createMutation.mutate(payload);
                    }
                }}
                onClose={() => setFormOpen(false)}
            />

            <ConfirmDialog
                open={retiring !== null}
                title={`${t("categories.actions.retire")}?`}
                description={`${t("categories.actions.retire")} "${retiring?.name}"`}
                confirmLabel={t("categories.actions.retire")}
                destructive
                loading={retireMutation.isPending}
                onConfirm={() => retiring && retireMutation.mutate(retiring.id)}
                onClose={() => setRetiring(null)}
            />
        </div>
    );
}
