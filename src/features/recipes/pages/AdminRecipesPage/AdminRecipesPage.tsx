import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Salad, Search } from "lucide-react";
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
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { useListParams } from "@/shared/hooks/useListParams";
import { useCategoryNames } from "@/features/categories/usePublicCategories";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { approveDish, approveRecipe, getAdminRecipes, rejectRecipe } from "../../adminApi";
import { MODERATION_VARIANT } from "../../constants";
import type { AdminRecipe, Difficulty, ModerationStatus, RecipeSort, RecipeStatus } from "../../types";
import { RecipeDetailDialog } from "./RecipeDetailDialog";

const PAGE_SIZE = 10;

/** Whitelist `sort` của backend — giá trị khác sẽ bị 400. */
const SORT_OPTIONS: { value: RecipeSort; labelKey: "newest" | "updated" | "name" }[] = [
    { value: "createdAt,desc", labelKey: "newest" },
    { value: "updatedAt,desc", labelKey: "updated" },
    { value: "name,asc", labelKey: "name" },
];

/** Hàng đợi duyệt là màn hình mặc định — bỏ trống param thì backend trả cả 3 trạng thái. */
const DEFAULT_MODERATION: ModerationStatus = "PENDING";

const MODERATION_STATES: ModerationStatus[] = ["PENDING", "APPROVED", "REJECTED"];

const isModerationState = (value: string): value is ModerationStatus =>
    MODERATION_STATES.includes(value as ModerationStatus);

const STATUS_VARIANT: Record<RecipeStatus, "default" | "destructive"> = {
    ACTIVE: "default",
    DELETED: "destructive",
};

const DIFFICULTY_VARIANT: Record<Difficulty, "lightgreen" | "amber" | "destructive"> = {
    EASY: "lightgreen",
    MEDIUM: "amber",
    HARD: "destructive",
};

/** `<input type="date">` → ISO-8601 instant mà backend nhận. */
const startOfDay = (date: string) => new Date(`${date}T00:00:00`).toISOString();
const endOfDay = (date: string) => new Date(`${date}T23:59:59.999`).toISOString();

export default function AdminRecipesPage() {
    const { t } = useTranslation(["admin", "common", "recipe"]);
    const queryClient = useQueryClient();
    const { page, q, status, debouncedQ, setQ, setStatus, setPage } = useListParams();
    const [sort, setSort] = useState<RecipeSort>("createdAt,desc");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [detail, setDetail] = useState<AdminRecipe | null>(null);
    /** Đang mở hộp thoại xác nhận cho recipe này — `null` = đóng. */
    const [confirm, setConfirm] = useState<{ recipe: AdminRecipe; action: "approve" | "reject" } | null>(null);

    // Recipe chỉ trả `categoryIds` — tra tên qua danh mục public, thiếu thì hiện UUID.
    const categoryNames = useCategoryNames();

    const createdFrom = from ? startOfDay(from) : undefined;
    const createdTo = to ? endOfDay(to) : undefined;
    // URL `?status=` dùng chung key với các trang admin khác; `""` = mọi trạng thái.
    // Giá trị lạ (link cũ, gõ tay) rơi về hàng đợi thay vì làm backend trả 400.
    const moderationStatus = isModerationState(status) ? status : DEFAULT_MODERATION;
    const allStates = status === "ALL";

    // `moderationStatus` rơi về PENDING khi chọn "mọi trạng thái" → queryKey phải tách riêng,
    // không thì PENDING và ALL dùng chung cache.
    const moderationFilter = allStates ? "ALL" : moderationStatus;

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-recipes", page, sort, createdFrom, createdTo, moderationFilter],
        queryFn: () =>
            getAdminRecipes({
                page,
                size: PAGE_SIZE,
                sort,
                createdFrom,
                createdTo,
                moderationStatus: allStates ? undefined : moderationStatus,
            }),
        placeholderData: keepPreviousData,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-recipes"] });

    // BE trả 400/404 kèm lý do cụ thể — hiện nguyên văn thay vì câu chung.
    const onError = (error: unknown) => {
        toast.error(getApiErrorMessage(error, t("recipes.moderation.actionFailed")));
    };

    const approveMutation = useMutation({
        mutationFn: (recipe: AdminRecipe) => approveRecipe(recipe.id),
        onSuccess: () => {
            toast.success(t("recipes.moderation.approved"));
            setConfirm(null);
            setDetail(null);
            invalidate();
        },
        onError,
    });

    const rejectMutation = useMutation({
        mutationFn: (recipe: AdminRecipe) => rejectRecipe(recipe.id),
        onSuccess: () => {
            toast.success(t("recipes.moderation.rejected"));
            setConfirm(null);
            setDetail(null);
            invalidate();
        },
        onError,
    });

    // Duyệt tên món: đổi state của `dish`, không phải của recipe — nên chỉ invalidate danh
    // sách recipe để badge cập nhật, và danh sách món để ô chọn món thấy món mới.
    const approveDishMutation = useMutation({
        mutationFn: (recipe: AdminRecipe) => approveDish(recipe.dishId),
        onSuccess: () => {
            toast.success(t("recipes.moderation.dishApproved"));
            void queryClient.invalidateQueries({ queryKey: ["admin-recipes"] });
            void queryClient.invalidateQueries({ queryKey: ["dishes"] });
        },
        onError,
    });

    const mutating = approveMutation.isPending || rejectMutation.isPending || approveDishMutation.isPending;

    // Không gọi lại API khi gõ tìm kiếm — backend chưa có tham số tên (xem `adminApi.ts`).
    const recipes = useMemo(() => {
        const keyword = debouncedQ.trim().toLowerCase();
        const rows = data?.data ?? [];
        if (!keyword) return rows;
        return rows.filter(
            (recipe) =>
                recipe.name.toLowerCase().includes(keyword) ||
                (recipe.dishName ?? "").toLowerCase().includes(keyword) ||
                recipe.username.toLowerCase().includes(keyword) ||
                recipe.email.toLowerCase().includes(keyword),
        );
    }, [data, debouncedQ]);

    const total = data?.total ?? 0;
    // Hàng đợi PENDING mặc định cũng là bộ lọc — rỗng nghĩa là "không có gì chờ duyệt",
    // không phải "chưa ai tạo recipe".
    const hasFilter = q !== "" || from !== "" || to !== "" || !allStates;

    const resetPage = () => setPage(1);

    const clearAll = () => {
        setQ("");
        setFrom("");
        setTo("");
        // `clearFilters` xoá `?status=` → rơi về PENDING và vẫn rỗng; mở rộng ra mọi trạng thái.
        setStatus("ALL");
    };

    return (
        <div>
            <PageHeader
                breadcrumb={[t("common:admin"), t("recipes.title")]}
                title={t("recipes.title")}
                description={t("recipes.description", { count: total })}
            />

            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:flex-wrap">
                <div className="relative xl:max-w-sm xl:flex-1">
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
                    className="xl:w-52"
                    aria-label={t("recipes.moderation.filterLabel")}
                    value={allStates ? "ALL" : moderationStatus}
                    onChange={(event) => setStatus(event.target.value)}
                >
                    <option value="PENDING">{t("recipes.moderation.status.PENDING")}</option>
                    <option value="APPROVED">{t("recipes.moderation.status.APPROVED")}</option>
                    <option value="REJECTED">{t("recipes.moderation.status.REJECTED")}</option>
                    <option value="ALL">{t("recipes.moderation.filterAll")}</option>
                </Select>

                <Select
                    className="xl:w-52"
                    aria-label={t("recipes.sortLabel")}
                    value={sort}
                    onChange={(event) => {
                        setSort(event.target.value as RecipeSort);
                        resetPage();
                    }}
                >
                    {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {t(`recipes.sort.${option.labelKey}`)}
                        </option>
                    ))}
                </Select>

                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        type="date"
                        className="min-w-0 flex-1 xl:w-44 xl:flex-none"
                        aria-label={t("recipes.filters.fromDate")}
                        value={from}
                        max={to || undefined}
                        onChange={(event) => {
                            setFrom(event.target.value);
                            resetPage();
                        }}
                    />
                    <span className="text-sm text-muted-foreground" aria-hidden="true">
                        –
                    </span>
                    <Input
                        type="date"
                        className="min-w-0 flex-1 xl:w-44 xl:flex-none"
                        aria-label={t("recipes.filters.toDate")}
                        value={to}
                        min={from || undefined}
                        onChange={(event) => {
                            setTo(event.target.value);
                            resetPage();
                        }}
                    />
                    {(from || to) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setFrom("");
                                setTo("");
                                resetPage();
                            }}
                        >
                            {t("recipes.filters.clearDates")}
                        </Button>
                    )}
                </div>
            </div>

            {isError ? (
                <ErrorState onRetry={() => refetch()} />
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>{t("recipes.column.recipe")}</TableHead>
                                <TableHead>{t("recipes.column.creator")}</TableHead>
                                <TableHead className="text-right">{t("recipes.column.ingredients")}</TableHead>
                                <TableHead className="text-right">{t("recipes.column.cookTime")}</TableHead>
                                <TableHead className="text-right">{t("recipes.column.servings")}</TableHead>
                                <TableHead>{t("recipes.column.difficulty")}</TableHead>
                                <TableHead>{t("recipes.column.moderation")}</TableHead>
                                <TableHead>{t("recipes.column.status")}</TableHead>
                                <TableHead>{t("recipes.column.createdAt")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableSkeleton columns={9} />
                            ) : (
                                recipes.map((recipe) => (
                                    <TableRow key={recipe.id}>
                                        <TableCell className="max-w-xs">
                                            <button
                                                className="text-left font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green"
                                                onClick={() => setDetail(recipe)}
                                            >
                                                {recipe.name}
                                            </button>
                                            {recipe.dishName && (
                                                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {recipe.dishName}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">@{recipe.username}</TableCell>
                                        <TableCell className="text-right tabular-nums">{recipe.ingredients.length}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right tabular-nums">
                                            {recipe.cookTimeMinutes === null
                                                ? "—"
                                                : t("recipes.minutes", { count: recipe.cookTimeMinutes })}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{recipe.servings}</TableCell>
                                        <TableCell>
                                            {recipe.difficulty ? (
                                                <Badge variant={DIFFICULTY_VARIANT[recipe.difficulty]}>
                                                    {t(`recipe:difficulty.${recipe.difficulty}`)}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={MODERATION_VARIANT[recipe.moderationStatus]}>
                                                {t(`recipes.moderation.status.${recipe.moderationStatus}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={STATUS_VARIANT[recipe.status]}>
                                                {t(`recipes.status.${recipe.status}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{formatDateLocale(recipe.createdAt)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {!isLoading && recipes.length === 0 && (
                        <EmptyState
                            icon={Salad}
                            title={t("recipes.empty.title")}
                            description={t(hasFilter ? "recipes.empty.filtered" : "recipes.empty.all")}
                            action={
                                <Button variant="outline" onClick={hasFilter ? clearAll : () => refetch()}>
                                    {t(hasFilter ? "common:clearFilter" : "recipes.empty.reload")}
                                </Button>
                            }
                        />
                    )}

                    <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
                </>
            )}

            <RecipeDetailDialog
                recipe={detail}
                categoryNames={categoryNames}
                loading={mutating}
                onApprove={(recipe) => setConfirm({ recipe, action: "approve" })}
                onReject={(recipe) => setConfirm({ recipe, action: "reject" })}
                onApproveDish={(recipe) => approveDishMutation.mutate(recipe)}
                onClose={() => setDetail(null)}
            />

            <ConfirmDialog
                open={confirm?.action === "approve"}
                title={t("recipes.moderation.approveTitle")}
                description={t("recipes.moderation.approveBody", { name: confirm?.recipe.name ?? "" })}
                confirmLabel={t("recipes.moderation.approve")}
                loading={mutating}
                onConfirm={() => confirm && approveMutation.mutate(confirm.recipe)}
                onClose={() => setConfirm(null)}
            />

            <ConfirmDialog
                open={confirm?.action === "reject"}
                title={t("recipes.moderation.rejectTitle")}
                description={t("recipes.moderation.rejectBody", { name: confirm?.recipe.name ?? "" })}
                confirmLabel={t("recipes.moderation.reject")}
                destructive
                loading={mutating}
                onConfirm={() => confirm && rejectMutation.mutate(confirm.recipe)}
                onClose={() => setConfirm(null)}
            />
        </div>
    );
}
