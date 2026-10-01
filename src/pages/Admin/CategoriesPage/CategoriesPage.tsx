import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive, Download, Pencil, Plus, RotateCcw, Search, Tags, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createCategory, exportCategoriesCsv, getCategories, permanentlyDeleteCategory, restoreCategory, retireCategory, updateCategory } from "@/services/categoryService";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { PageHeader } from "@/shared/components/PageHeader";
import { Pagination } from "@/shared/components/Pagination";
import { TableSkeleton } from "@/shared/components/TableSkeleton";
import type { Category, CategoryStatusFilter } from "@/types/category";
import { formatDate } from "@/utils/formatDate";
import { CategoryFormDialog } from "./CategoryFormDialog";

const PAGE_SIZE = 8;

export default function CategoriesPage() {
    const { t } = useTranslation("admin");
    const queryClient = useQueryClient();
    const [keyword, setKeyword] = useState("");
    const [tab, setTab] = useState<CategoryStatusFilter>("all");
    const [sort, setSort] = useState<"newest" | "name">("newest");
    const [page, setPage] = useState(1);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [retiring, setRetiring] = useState<Category | null>(null);
    const [restoring, setRestoring] = useState<Category | null>(null);
    const [permanentlyDeleting, setPermanentlyDeleting] = useState<Category | null>(null);

    const TABS: { value: CategoryStatusFilter; label: string }[] = [
        { value: "all", label: t("categories.tabs.all") },
        { value: "active", label: t("categories.tabs.active") },
        { value: "deleted", label: t("categories.tabs.deleted") },
    ];

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-categories", page, keyword, tab, sort],
        queryFn: () => getCategories({ page, size: PAGE_SIZE, q: keyword, status: tab, sort }),
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    const onError = (error: unknown) => {
        const axiosError = error as { response?: { data?: { message?: string } } };
        const message = axiosError.response?.data?.message;
        toast.error(message || t("categories.toast.failed"));
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
        mutationFn: ({ id, payload }: { id: string; payload: { name: string; description?: string } }) => updateCategory(id, payload),
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

    const restoreMutation = useMutation({
        mutationFn: restoreCategory,
        onSuccess: () => {
            toast.success(t("categories.toast.restored"));
            setRestoring(null);
            invalidate();
        },
        onError,
    });

    const permanentDeleteMutation = useMutation({
        mutationFn: permanentlyDeleteCategory,
        onSuccess: () => {
            toast.success(t("categories.toast.deleted"));
            setPermanentlyDeleting(null);
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

    const handleTabChange = (value: CategoryStatusFilter) => {
        setTab(value);
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

    const statusCounts = useMemo(() => {
        const total = data?.total ?? 0;
        const active = data?.data.filter((c: Category) => c.deletedAt === null).length ?? 0;
        const deleted = data?.data.filter((c: Category) => c.deletedAt !== null).length ?? 0;
        return { total, active, deleted };
    }, [data]);

    return (
        <div>
            <PageHeader
                breadcrumb={["Admin", t("categories.title")]}
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
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { label: t("categories.tabs.all"), value: statusCounts.total, color: "bg-vegan-green text-white" },
                    { label: t("categories.tabs.active"), value: statusCounts.active, color: "bg-vegan-green-light text-vegan-green" },
                    { label: t("categories.tabs.deleted"), value: statusCounts.deleted, color: "bg-cream text-terracotta" },
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

            <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                    {TABS.map(({ value, label }) => (
                        <Button
                            key={value}
                            variant={tab === value ? "primary" : "outline"}
                            size="sm"
                            onClick={() => handleTabChange(value)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>
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
                                            {category.deletedAt ? (
                                                <Badge variant="outline">{t("categories.status.deleted")}</Badge>
                                            ) : (
                                                <Badge variant="lightgreen">{t("categories.status.active")}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{formatDate(category.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => openEdit(category)}>
                                                    <Pencil className="h-4 w-4" />
                                                    {t("categories.actions.edit")}
                                                </Button>
                                                {category.deletedAt ? (
                                                    <>
                                                        <Button size="sm" variant="outline" onClick={() => setRestoring(category)}>
                                                            <RotateCcw className="h-4 w-4" />
                                                            {t("categories.actions.restore")}
                                                        </Button>
                                                        <Button size="sm" variant="destructive" onClick={() => setPermanentlyDeleting(category)}>
                                                            <Trash2 className="h-4 w-4" />
                                                            {t("categories.actions.permanentlyDelete")}
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={() => setRetiring(category)}>
                                                        <Archive className="h-4 w-4" />
                                                        {t("categories.actions.retire")}
                                                        </Button>
                                                )}
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
                                    {t("categories.tabs.all")}: <strong className="text-dark">{statusCounts.total}</strong>
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
                        const updatePayload: { name?: string; description?: string } = {};
                        if (payload.name !== editing.name) updatePayload.name = payload.name.trim();
                        if (payload.description !== (editing.description ?? "")) updatePayload.description = payload.description.trim();
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

            <ConfirmDialog
                open={restoring !== null}
                title={`${t("categories.actions.restore")}?`}
                description={`${t("categories.actions.restore")} "${restoring?.name}"`}
                confirmLabel={t("categories.actions.restore")}
                loading={restoreMutation.isPending}
                onConfirm={() => restoring && restoreMutation.mutate(restoring.id)}
                onClose={() => setRestoring(null)}
            />

            <ConfirmDialog
                open={permanentlyDeleting !== null}
                title={`${t("categories.actions.permanentlyDelete")}?`}
                description={`${t("categories.actions.permanentlyDelete")} "${permanentlyDeleting?.name}"`}
                confirmLabel={t("categories.actions.permanentlyDelete")}
                destructive
                loading={permanentDeleteMutation.isPending}
                onConfirm={() => permanentlyDeleting && permanentDeleteMutation.mutate(permanentlyDeleting.id)}
                onClose={() => setPermanentlyDeleting(null)}
            />
        </div>
    );
}
