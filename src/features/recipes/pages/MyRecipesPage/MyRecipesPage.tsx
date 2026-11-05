import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ChefHat,
    Clock,
    CookingPot,
    ListChecks,
    Leaf,
    PenLine,
    Plus,
    Search,
    Sparkles,
    Timer,
    Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PillTabs } from "@/components/ui/pill-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { StatCard } from "@/components/common/StatCard";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { useUiStore } from "@/shared/ui/uiStore";
import { getMyRecipes } from "../../api";
import { MODERATION_VARIANT } from "../../constants";
import type { Difficulty, Recipe } from "../../types";
import { PAGE_SIZE, matchesRecipe, recipeStats, sortRecipes } from "./filter";
import type { SortKey, TabKey } from "./filter";

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

export default function MyRecipesPage() {
    const { t } = useTranslation(["recipe", "common"]);
    const navigate = useNavigate();
    const language = useUiStore((state) => state.language);

    const [tab, setTab] = useState<TabKey>("all");
    const [query, setQuery] = useState("");
    const [difficulty, setDifficulty] = useState<Difficulty | "">("");
    const [sortKey, setSortKey] = useState<SortKey>("updated");
    const [selected, setSelected] = useState<Recipe | null>(null);

    const debouncedQuery = useDebounce(query, 300);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["my-recipes"],
        queryFn: getMyRecipes,
    });

    const recipes = useMemo(() => data ?? [], [data]);

    const stats = useMemo(() => recipeStats(recipes), [recipes]);

    // Hướng sort cố định theo khoá: ngày → mới nhất trước, tên → A-Z. Không còn nút đảo hướng.
    const filtered = useMemo(() => {
        const matched = recipes.filter((item) =>
            matchesRecipe(item, { tab, difficulty, keyword: debouncedQuery }),
        );
        const direction = sortKey === "name" ? "asc" : "desc";
        return sortRecipes(matched, sortKey, direction, language === "vi" ? "vi" : "en");
    }, [recipes, tab, difficulty, debouncedQuery, sortKey, language]);

    // Đổi bộ lọc thì tự về trang 1 — so khoá thay vì `useEffect` (cùng cách ExplorePage).
    const filterKey = `${tab}|${difficulty}|${debouncedQuery}|${sortKey}`;
    const [pager, setPager] = useState({ key: filterKey, page: 1 });
    const page = pager.key === filterKey ? pager.page : 1;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const hasFilter = query !== "" || difficulty !== "" || tab !== "all";
    const from = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const to = (page - 1) * PAGE_SIZE + pageItems.length;

    const clearFilters = () => {
        setQuery("");
        setDifficulty("");
        setTab("all");
    };

    return (
        <>
            <header className="flex flex-wrap items-end justify-between gap-3 px-0.5">
                <div>
                    <h1 className="text-2xl font-semibold leading-tight text-dark sm:text-[25px]">
                        {t("recipe:myRecipes.title")}
                    </h1>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">
                        {t("recipe:myRecipes.subtitle")}
                    </p>
                </div>
                <Button className="max-sm:w-full" onClick={() => navigate("/recipes/create")}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t("recipe:myRecipes.create")}
                </Button>
            </header>

            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard icon={ListChecks} label={t("recipe:myRecipes.stats.total")} value={stats.total} />
                    <StatCard icon={Leaf} label={t("recipe:myRecipes.stats.approved")} value={stats.approved} />
                    <StatCard icon={Clock} label={t("recipe:myRecipes.stats.pending")} value={stats.pending} />
                    <StatCard
                        icon={Timer}
                        label={t("recipe:myRecipes.stats.quick")}
                        value={stats.quick}
                        hint={t("recipe:myRecipes.stats.quickHint")}
                    />
                </div>

                <PillTabs
                    items={[
                        { key: "all" as const, label: t("recipe:myRecipes.tab.all"), count: stats.total },
                        { key: "APPROVED" as const, label: t("recipe:myRecipes.tab.APPROVED"), count: stats.approved },
                        { key: "PENDING" as const, label: t("recipe:myRecipes.tab.PENDING"), count: stats.pending },
                        {
                            key: "REJECTED" as const,
                            label: t("recipe:myRecipes.tab.REJECTED"),
                            count: stats.total - stats.approved - stats.pending,
                        },
                    ]}
                    value={tab}
                    onChange={setTab}
                    className="border-b border-border pb-3"
                />

                <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        {/* Wrapper giữ `lg:max-w-xs`: `className` của `Input` gắn vào chính
                            `<input>`, còn khung `relative w-full` mới là thứ chiếm chỗ trong
                            flex — đặt width ở đây mới ép được cả hàng. */}
                        <div className="lg:max-w-xs lg:shrink-0">
                            <Input
                                leadingIcon={Search}
                                className="w-full"
                                placeholder={t("recipe:myRecipes.search")}
                                aria-label={t("recipe:myRecipes.search")}
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Select
                                className="w-36 shrink-0"
                                aria-label={t("recipe:myRecipes.filter.difficulty")}
                                value={difficulty}
                                onChange={(event) => setDifficulty(event.target.value as Difficulty | "")}
                            >
                                <option value="">{t("recipe:myRecipes.filter.difficultyAll")}</option>
                                {DIFFICULTIES.map((item) => (
                                    <option key={item} value={item}>
                                        {t(`recipe:difficulty.${item}`)}
                                    </option>
                                ))}
                            </Select>
                            <Select
                                className="w-44 shrink-0"
                                aria-label={t("recipe:myRecipes.sort.label")}
                                value={sortKey}
                                onChange={(event) => setSortKey(event.target.value as SortKey)}
                            >
                                <option value="updated">{t("recipe:myRecipes.sort.updated")}</option>
                                <option value="created">{t("recipe:myRecipes.sort.created")}</option>
                                <option value="name">{t("recipe:myRecipes.sort.name")}</option>
                            </Select>
                            {hasFilter && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    {t("common:clearFilter")}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                        <span>
                            {t("recipe:myRecipes.showing", { from, to, total: filtered.length })}
                            {" · "}
                            {t(`recipe:myRecipes.sort.hint.${sortKey}`)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                            {t("recipe:myRecipes.synced")}
                        </span>
                    </div>

                    {isError ? (
                        <ErrorState onRetry={() => refetch()} />
                    ) : isLoading ? (
                        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                                <Skeleton key={index} className="h-72 rounded-2xl" />
                            ))}
                        </div>
                    ) : pageItems.length === 0 ? (
                        <EmptyState
                            icon={ChefHat}
                            title={t(hasFilter ? "recipe:myRecipes.empty.filtered" : "recipe:myRecipes.empty.title")}
                            description={t(hasFilter ? "recipe:myRecipes.empty.filteredHint" : "recipe:myRecipes.empty.hint")}
                            action={
                                <Button
                                    variant={hasFilter ? "outline" : "primary"}
                                    onClick={hasFilter ? clearFilters : () => navigate("/recipes/create")}
                                >
                                    {hasFilter ? t("common:clearFilter") : t("recipe:myRecipes.create")}
                                </Button>
                            }
                        />
                    ) : (
                        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {pageItems.map((recipe) => (
                                <RecipeManageCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    onOpen={() => setSelected(recipe)}
                                />
                            ))}
                        </div>
                    )}

                    <Pagination page={page} totalPages={totalPages} onChange={(next) => setPager({ key: filterKey, page: next })} />
                </div>
            </div>

            <RecipeDetailDialog
                recipe={selected}
                language={language}
                onClose={() => setSelected(null)}
            />
        </>
    );
}

/** Thẻ một công thức — đủ field để mở dialog chi tiết mà không cần gọi thêm API. */
function RecipeManageCard({ recipe, onOpen }: { recipe: Recipe; onOpen: () => void }) {
    const { t } = useTranslation("recipe");

    return (
        <article className="flex flex-col rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={MODERATION_VARIANT[recipe.moderationStatus]} size="md">
                    {t(`myRecipes.status.${recipe.moderationStatus}`)}
                </Badge>
                {recipe.difficulty && (
                    <Badge variant="secondary" size="md">
                        {t(`difficulty.${recipe.difficulty}`)}
                    </Badge>
                )}
                <span className="ml-auto inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("myRecipes.meta.servings", { count: recipe.servings })}
                </span>
            </div>

            {/* `Recipe` không có category — tên món là nhãn trên cùng thay thế. */}
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-vegan-green">{recipe.dishName}</p>
            <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-dark">{recipe.name}</h3>
            <p className="mt-1 line-clamp-2 flex-1 text-base text-muted-foreground">
                {recipe.description ?? t("myRecipes.noDescription")}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                    <Timer className="h-4 w-4" aria-hidden="true" />
                    {recipe.prepTimeMinutes === null
                        ? "—"
                        : t("myRecipes.meta.prep", { count: recipe.prepTimeMinutes })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <CookingPot className="h-4 w-4" aria-hidden="true" />
                    {recipe.cookTimeMinutes === null
                        ? "—"
                        : t("myRecipes.meta.cook", { count: recipe.cookTimeMinutes })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <ListChecks className="h-4 w-4" aria-hidden="true" />
                    {t("myRecipes.meta.ingredients", { count: recipe.ingredients.length })}
                </span>
            </div>

            {/* ponytail: BE chưa có PATCH/DELETE recipe cho member → chỉ mở chi tiết,
                không có nút sửa/xoá. Thêm khi backend mở endpoint. */}
            <div className="mt-3">
                <Button size="sm" variant="outline" block onClick={onOpen}>
                    <PenLine className="h-4 w-4" aria-hidden="true" />
                    {t("myRecipes.action.view")}
                </Button>
            </div>
        </article>
    );
}

/** Nhãn nhỏ chữ hoa cho tiêu đề khối trong dialog chi tiết. */
function SectionHeading({ label, count }: { label: string; count?: number }) {
    return (
        <h3 className="mb-3.5 flex items-baseline gap-2 text-[11px] font-bold uppercase tracking-[0.11em] text-muted-foreground">
            {label}
            {count !== undefined && <span className="font-medium tabular-nums text-vegan-green-muted">{count}</span>}
        </h3>
    );
}

/**
 * Chi tiết công thức dựng từ chính row đã tải — `GET /api/recipes/{id}` không cần thiết.
 * Bố cục "tờ công thức": hero → dải 4 thông số → 2 cột (nguyên liệu | bước nấu).
 */
function RecipeDetailDialog({
    recipe,
    language,
    onClose,
}: {
    recipe: Recipe | null;
    language: string;
    onClose: () => void;
}) {
    const { t } = useTranslation(["recipe", "common"]);

    // `instructions` là TEXT thuần do `joinSteps` gộp: mỗi bước một dòng, dạng
    // "tiêu đề — thân". Tách lại để hiện thành timeline; dòng không có dấu `—`
    // thì coi cả dòng là thân bước.
    const steps = useMemo(
        () =>
            (recipe?.instructions ?? "")
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                    const at = line.indexOf(" — ");
                    return at === -1
                        ? { title: "", body: line }
                        : { title: line.slice(0, at), body: line.slice(at + 3) };
                }),
        [recipe?.instructions],
    );

    // Mỗi ô đã format sẵn — không suy kiểu trong JSX vì "2 phút" và "2 phần" khác nhau.
    const stats = [
        {
            label: t("field.prepTime"),
            value:
                recipe?.prepTimeMinutes == null
                    ? "—"
                    : `${recipe.prepTimeMinutes} ${t("time.minutesShort")}`,
        },
        {
            label: t("field.cookTime"),
            value:
                recipe?.cookTimeMinutes == null
                    ? "—"
                    : `${recipe.cookTimeMinutes} ${t("time.minutesShort")}`,
        },
        {
            label: t("field.servings"),
            value: recipe ? t("myRecipes.meta.servings", { count: recipe.servings }) : "—",
        },
        {
            label: t("field.difficulty"),
            value: recipe?.difficulty ? t(`difficulty.${recipe.difficulty}`) : "—",
        },
    ];

    return (
        <Dialog
            open={recipe !== null}
            onClose={onClose}
            title={recipe?.name ?? ""}
            description={recipe?.description ?? undefined}
            className="max-w-3xl [&>div]:p-0"
            headerClassName="mb-0 border-b border-border bg-vegan-green-subtle px-6 pb-6 pt-6"
            eyebrow={
                recipe ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-vegan-green">
                            {recipe.dishName}
                        </p>
                        <Badge
                            variant={MODERATION_VARIANT[recipe.moderationStatus]}
                            className="ml-auto font-semibold"
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                            {t(`myRecipes.status.${recipe.moderationStatus}`)}
                        </Badge>
                    </div>
                ) : undefined
            }
            titleClassName="font-display text-2xl font-semibold leading-[1.15] tracking-[-0.018em]"
            descriptionClassName="mt-2.5 max-w-[58ch] text-sm"
        >
            {recipe && (
                <>
                    {/* Duyệt recipe không duyệt tên món dùng chung — nói rõ để không tưởng đã lên sóng. */}
                    {recipe.dishModerationStatus === "PENDING" && recipe.moderationStatus === "APPROVED" && (
                        <p className="mx-6 mt-5 rounded-xl border border-amber-strong/20 bg-amber-soft px-3.5 py-2.5 text-[13.5px] text-amber-strong">
                            {t("myRecipes.detail.dishPending")}
                        </p>
                    )}

                    {/* Dải 4 thông số. Kẻ ô bằng `gap-px` trên nền `bg-border` để đường
                        phân cách tự đúng ở cả 2 cột (mobile) lẫn 4 cột (sm), khỏi tính border theo index. */}
                    <dl className="mt-5 grid grid-cols-2 gap-px border-y border-border bg-border sm:grid-cols-4">
                        {stats.map((item) => (
                            <div key={item.label} className="min-w-0 bg-card px-5 py-3.5">
                                <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                                    {item.label}
                                </dt>
                                <dd className="mt-0.5 text-[17px] font-semibold tabular-nums text-dark">
                                    {item.value}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    <div className="grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                        <section className="min-w-0 px-6 py-6">
                            <SectionHeading label={t("section.ingredients")} count={recipe.ingredients.length} />
                            <ul>
                                {recipe.ingredients.map((ingredient, index) => (
                                    <li
                                        key={ingredient.ingredientId}
                                        className="grid grid-cols-[26px_minmax(0,1fr)_auto] items-baseline gap-2.5 border-b border-dashed border-border py-2 last:border-b-0"
                                    >
                                        <span className="text-[11px] font-bold tabular-nums text-vegan-green-muted">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        <span className="min-w-0 break-words text-dark">{ingredient.name}</span>
                                        <span className="whitespace-nowrap text-[13.5px] tabular-nums text-muted-foreground">
                                            {ingredient.amount} {ingredient.unit}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="min-w-0 border-t border-border px-6 py-6 sm:border-l sm:border-t-0">
                            <SectionHeading label={t("section.instructions")} count={steps.length} />
                            <ol className="flex flex-col gap-4">
                                {steps.map((step, index) => (
                                    <li key={index} className="grid grid-cols-[26px_minmax(0,1fr)] gap-3">
                                        <span className="grid h-[26px] w-[26px] place-items-center rounded-full border border-vegan-green/40 bg-surface text-[12px] font-bold tabular-nums text-vegan-green">
                                            {index + 1}
                                        </span>
                                        <div className="min-w-0">
                                            {step.title && (
                                                <h4 className="mb-0.5 text-[14.5px] font-semibold leading-snug text-dark">
                                                    {step.title}
                                                </h4>
                                            )}
                                            <p className="text-sm text-muted-foreground">{step.body}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
                        <span className="text-xs text-muted-foreground">
                            {t("myRecipes.updated", { date: formatDateLocale(recipe.updatedAt, language) })}
                        </span>
                        <Button variant="outline" onClick={onClose}>
                            {t("common:close")}
                        </Button>
                    </div>
                </>
            )}
        </Dialog>
    );
}
