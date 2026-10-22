import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChefHat, Eye, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/hooks/useListParams";
import { getAdminRecipes, type AdminRecipeSort } from "@/services/recipeService";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { PageHeader } from "@/shared/components/PageHeader";
import { Pagination } from "@/shared/components/Pagination";
import { TableSkeleton } from "@/shared/components/TableSkeleton";
import type { AdminRecipe } from "@/types/recipe";
import { formatDateLocale } from "@/utils/formatDate";

const PAGE_SIZE = 8;

/**
 * #24 `GET /api/admin/recipes` — chỉ đọc. BE không có tham số tìm kiếm và không có
 * filter `status`, nên lọc cả hai ở client trên trang hiện tại (`ponytail`).
 */
export default function RecipesPage() {
    const { t } = useTranslation(["admin", "common"]);
    const { page, q, status, debouncedQ, setQ, setStatus, setPage, clearFilters } = useListParams();
    const [sort, setSort] = useState<AdminRecipeSort>("createdAt");
    const [preview, setPreview] = useState<AdminRecipe | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-recipes", page, sort],
        queryFn: () => getAdminRecipes({ page, size: PAGE_SIZE, sort }),
        placeholderData: keepPreviousData,
    });

    // ponytail: lọc q/status ở client — BE chưa có tham số, phân trang vẫn theo server.
    const keyword = debouncedQ.trim().toLowerCase();
    const recipes = (data?.data ?? []).filter(
        (item) =>
            (status === "" || item.status === status) &&
            (keyword === "" ||
                item.name.toLowerCase().includes(keyword) ||
                (item.dishName ?? "").toLowerCase().includes(keyword) ||
                item.username.toLowerCase().includes(keyword)),
    );
    const hasFilter = q !== "" || status !== "";

    return (
        <div>
            <PageHeader
                breadcrumb={[t("common:admin"), t("recipes.title")]}
                title={t("recipes.title")}
                description={t("recipes.description")}
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:max-w-sm sm:flex-1">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        className="pl-9"
                        placeholder={t("recipes.searchPlaceholder")}
                        aria-label={t("recipes.searchLabel")}
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                    />
                </div>
                <Select
                    className="sm:w-44"
                    aria-label={t("recipes.filterLabel")}
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                >
                    <option value="">{t("recipes.allStatuses")}</option>
                    <option value="ACTIVE">{t("recipes.status.ACTIVE")}</option>
                    <option value="DELETED">{t("recipes.status.DELETED")}</option>
                </Select>
                <Select
                    className="sm:w-48"
                    aria-label={t("recipes.sortLabel")}
                    value={sort}
                    onChange={(event) => {
                        setSort(event.target.value as AdminRecipeSort);
                        setPage(1);
                    }}
                >
                    <option value="createdAt">{t("recipes.sort.newest")}</option>
                    <option value="updatedAt">{t("recipes.sort.updated")}</option>
                    <option value="name">{t("recipes.sort.name")}</option>
                </Select>
            </div>

            {isError ? (
                <ErrorState onRetry={() => refetch()} />
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>{t("recipes.column.recipe")}</TableHead>
                                <TableHead>{t("recipes.column.dish")}</TableHead>
                                <TableHead>{t("recipes.column.owner")}</TableHead>
                                <TableHead>{t("recipes.column.status")}</TableHead>
                                <TableHead>{t("recipes.column.createdAt")}</TableHead>
                                <TableHead className="text-right">{t("recipes.column.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableSkeleton columns={6} />
                            ) : (
                                recipes.map((recipe) => (
                                    <TableRow key={recipe.id}>
                                        <TableCell className="max-w-xs">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-cream">
                                                    <ChefHat className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                                </div>
                                                <span className="truncate font-medium">{recipe.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{recipe.dishName ?? "—"}</TableCell>
                                        <TableCell>
                                            <p className="font-medium">{recipe.username}</p>
                                            <p className="text-xs text-muted-foreground">{recipe.email}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={recipe.status === "ACTIVE" ? "lightgreen" : "destructive"}>
                                                {t(`recipes.status.${recipe.status}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{formatDateLocale(recipe.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end">
                                                <Button size="sm" variant="outline" onClick={() => setPreview(recipe)}>
                                                    <Eye className="h-4 w-4" aria-hidden="true" />
                                                    {t("recipes.action.view")}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {!isLoading && recipes.length === 0 && (
                        <EmptyState
                            icon={ChefHat}
                            title={t("recipes.empty.title")}
                            description={t(hasFilter ? "recipes.empty.filtered" : "recipes.empty.all")}
                            action={
                                <Button variant="outline" onClick={hasFilter ? clearFilters : () => refetch()}>
                                    {t(hasFilter ? "common:clearFilter" : "recipes.empty.reload")}
                                </Button>
                            }
                        />
                    )}
                    <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
                </>
            )}

            <Dialog
                open={preview !== null}
                onClose={() => setPreview(null)}
                title={preview?.name ?? ""}
                description={preview ? t("recipes.preview.by", { username: preview.username }) : undefined}
                className="max-w-2xl"
            >
                {preview && (
                    <div className="space-y-4 text-sm">
                        {preview.description && <p className="text-dark">{preview.description}</p>}

                        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[
                                { key: "servings", value: String(preview.servings) },
                                { key: "prep", value: preview.prepTimeMinutes ?? "—" },
                                { key: "cook", value: preview.cookTimeMinutes ?? "—" },
                                { key: "difficulty", value: preview.difficulty ?? "—" },
                            ].map((item) => (
                                <div key={item.key} className="rounded-xl bg-muted-bg px-3 py-2">
                                    <dt className="text-xs text-muted-foreground">{t(`recipes.preview.${item.key}`)}</dt>
                                    <dd className="font-bold text-dark">{item.value}</dd>
                                </div>
                            ))}
                        </dl>

                        <div>
                            <h3 className="mb-2 font-bold text-dark">{t("recipes.preview.ingredients")}</h3>
                            <ul className="space-y-1 text-muted-foreground">
                                {preview.ingredients.map((item) => (
                                    <li key={item.ingredientId}>
                                        {item.name} — {item.amount} {item.unit}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="mb-2 font-bold text-dark">{t("recipes.preview.instructions")}</h3>
                            <p className="whitespace-pre-line text-muted-foreground">{preview.instructions}</p>
                        </div>

                        <div className="flex justify-end">
                            <Button variant="outline" onClick={() => setPreview(null)}>
                                {t("common:close")}
                            </Button>
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
}
