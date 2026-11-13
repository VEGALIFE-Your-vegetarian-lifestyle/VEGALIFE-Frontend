import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { Difficulty } from "@/features/recipes/types";

/** Chỉ cần id + tên — `GET /api/categories` trả `BackendCategory`, không có `deletedAt`. */
export interface FilterCategory {
    id: string;
    name: string;
}

/** Ngưỡng "thời gian tối đa" của công thức (phút). `""` = không lọc. */
export type MaxTimeFilter = "" | "15" | "30" | "60";

interface ExploreFilterPanelProps {
    /** Tab đang xem — quyết định nhóm lọc nào hiện, vì mỗi endpoint nhận tham số khác nhau. */
    tab: "posts" | "recipes";
    onTabChange: (tab: "posts" | "recipes") => void;
    categories: FilterCategory[];
    /** Backend nhận đúng một `categoryId` — `""` = không lọc. */
    selectedCat: string;
    onToggleCategory: (id: string) => void;
    difficulties: Difficulty[];
    difficulty: Difficulty | "";
    onDifficultyChange: (value: Difficulty | "") => void;
    maxTimes: MaxTimeFilter[];
    maxTime: MaxTimeFilter;
    onMaxTimeChange: (value: MaxTimeFilter) => void;
    onReset: () => void;
    canReset: boolean;
}

/**
 * Panel lọc cột trái — đổi nội dung theo tab, vì mỗi endpoint chỉ nhận đúng bộ tham số của nó:
 *
 * - Tab Bài viết: `GET /api/posts?categoryId=` — không có độ khó/thời gian.
 * - Tab Công thức: `GET /api/recipes?difficulty=&maxTotalTimeMinutes=` — không có category.
 *
 * Đã bỏ so với mockup: "Content Format" (backend không có tham số), số đếm từng category
 * (server không trả count theo nhóm), "Topic & Dietary Focus" + "Author Role" (không có field).
 */
export function ExploreFilterPanel({
    tab,
    onTabChange,
    categories,
    selectedCat,
    onToggleCategory,
    difficulties,
    difficulty,
    onDifficultyChange,
    maxTimes,
    maxTime,
    onMaxTimeChange,
    onReset,
    canReset,
}: ExploreFilterPanelProps) {
    const { t } = useTranslation(["explore", "recipe"]);

    const tabs = [
        { key: "posts" as const, label: t("tabPosts") },
        { key: "recipes" as const, label: t("tabRecipes") },
    ];

    return (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
            {/* Tab gạch chân: chỉ chữ, không đếm — mỗi lần đổi tab là một request, đếm tab kia
                sẽ tốn thêm một request nữa mà không đáng. Số kết quả nằm ở dòng trên feed. */}
            <div role="tablist" className="flex border-b border-border">
                {tabs.map((item) => {
                    const active = tab === item.key;
                    return (
                        <button
                            key={item.key}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onTabChange(item.key)}
                            className={cn(
                                "relative flex-1 px-4 pb-3 pt-4 text-sm font-bold transition-colors",
                                "after:absolute after:inset-x-4 after:bottom-0 after:h-[2.5px] after:rounded-full after:transition-colors",
                                active
                                    ? "text-vegan-green after:bg-vegan-green"
                                    : "text-muted-foreground after:bg-transparent hover:text-dark",
                            )}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>

            <div className="p-5">
                <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
                    <span className="flex items-center gap-2 text-sm font-bold text-dark">
                        <SlidersHorizontal className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                        {t("filterTitle")}
                    </span>
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={!canReset}
                        className="text-xs font-semibold text-vegan-green transition-colors hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                    >
                        {t("resetFilters")}
                    </button>
                </div>

                <div className="pt-4">
                {tab === "posts" ? (
                    <fieldset className="space-y-2.5">
                        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("categoryTitle")}
                        </legend>
                        {categories.map((category) => {
                            const checked = selectedCat === category.id;
                            return (
                                <label key={category.id} className="group flex cursor-pointer items-center gap-2.5 text-sm">
                                    <input
                                        type="radio"
                                        name="explore-category"
                                        checked={checked}
                                        onChange={() => onToggleCategory(category.id)}
                                        className="h-4 w-4 shrink-0 accent-vegan-green"
                                    />
                                    <span className="flex-1 truncate text-dark transition-colors group-hover:text-vegan-green">
                                        {category.name}
                                    </span>
                                </label>
                            );
                        })}
                    </fieldset>
                ) : (
                    <>
                        <fieldset className="space-y-2.5">
                            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("difficultyTitle")}
                            </legend>
                            {difficulties.map((value) => (
                                <label key={value} className="group flex cursor-pointer items-center gap-2.5 text-sm">
                                    <input
                                        type="radio"
                                        name="explore-difficulty"
                                        checked={difficulty === value}
                                        onChange={() => onDifficultyChange(difficulty === value ? "" : value)}
                                        className="h-4 w-4 shrink-0 accent-vegan-green"
                                    />
                                    <span className="flex-1 text-dark transition-colors group-hover:text-vegan-green">
                                        {t(`recipe:difficulty.${value}`)}
                                    </span>
                                </label>
                            ))}
                        </fieldset>

                        <fieldset className="mt-4 space-y-2.5 border-t border-border pt-4">
                            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("timeTitle")}
                            </legend>
                            {maxTimes.map((value) => (
                                <label key={value || "all"} className="group flex cursor-pointer items-center gap-2.5 text-sm">
                                    <input
                                        type="radio"
                                        name="explore-time"
                                        checked={maxTime === value}
                                        onChange={() => onMaxTimeChange(maxTime === value ? "" : value)}
                                        className="h-4 w-4 shrink-0 accent-vegan-green"
                                    />
                                    <span className="flex-1 text-dark transition-colors group-hover:text-vegan-green">
                                        {value ? t("timeOption", { count: Number(value) }) : t("timeAny")}
                                    </span>
                                </label>
                            ))}
                        </fieldset>
                    </>
                )}
                </div>
            </div>
        </div>
    );
}
