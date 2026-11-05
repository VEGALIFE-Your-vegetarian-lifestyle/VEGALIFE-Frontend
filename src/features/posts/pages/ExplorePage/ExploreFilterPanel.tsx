import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, Sparkles } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { useUiStore } from "@/shared/ui/uiStore";

export type FormatFilter = "all" | "recipe" | "article";
export type ReadingFilter = "any" | "quick" | "deep";

/** Chỉ cần id + tên — `GET /api/categories` trả `BackendCategory`, không có `deletedAt`. */
export interface FilterCategory {
    id: string;
    name: string;
}

/** Số đếm cho từng nhóm lọc — tính sẵn ở `ExplorePage` (đã áp từ khoá). */
export interface FilterStats {
    byCategory: Map<string, number>;
    recipe: number;
    article: number;
    quick: number;
    deep: number;
}

interface ExploreFilterPanelProps {
    categories: FilterCategory[];
    stats: FilterStats;
    selectedCats: string[];
    onToggleCategory: (id: string) => void;
    format: FormatFilter;
    onFormatChange: (value: FormatFilter) => void;
    reading: ReadingFilter;
    onReadingChange: (value: ReadingFilter) => void;
    onReset: () => void;
    canReset: boolean;
}

/**
 * Panel lọc cột trái — bám `stich_design/screen_explore`, nhưng chỉ giữ nhóm suy được
 * từ field BE thật trả: `categoryIds`, `recipeIds`, `content`.
 * Nhóm "Topic & Dietary Focus" + "Author Role" của mockup đã bỏ vì không có field nào.
 */
export function ExploreFilterPanel({
    categories,
    stats,
    selectedCats,
    onToggleCategory,
    format,
    onFormatChange,
    reading,
    onReadingChange,
    onReset,
    canReset,
}: ExploreFilterPanelProps) {
    const { t } = useTranslation("explore");
    const openComposer = useUiStore((state) => state.openComposer);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const formats: { key: FormatFilter; label: string; count: number }[] = [
        { key: "all", label: t("format.all"), count: stats.recipe + stats.article },
        { key: "recipe", label: t("format.recipe"), count: stats.recipe },
        { key: "article", label: t("format.article"), count: stats.article },
    ];

    const readings: { key: ReadingFilter; label: string; count: number }[] = [
        { key: "any", label: t("reading.any"), count: stats.quick + stats.deep },
        { key: "quick", label: t("reading.quick"), count: stats.quick },
        { key: "deep", label: t("reading.deep"), count: stats.deep },
    ];

    return (
        <div className="space-y-5">
            <div className="space-y-6 rounded-2xl bg-card p-5 shadow-sm">
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

                <fieldset className="space-y-2.5">
                    <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("categoryTitle")}
                    </legend>
                    {categories.map((category) => {
                        const checked = selectedCats.includes(category.id);
                        return (
                            <label key={category.id} className="group flex cursor-pointer items-center gap-2.5 text-sm">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => onToggleCategory(category.id)}
                                    className="h-4 w-4 shrink-0 accent-vegan-green"
                                />
                                <span className="flex-1 truncate text-dark transition-colors group-hover:text-vegan-green">
                                    {category.name}
                                </span>
                                <span className="text-xs tabular-nums text-muted-foreground">
                                    {stats.byCategory.get(category.id) ?? 0}
                                </span>
                            </label>
                        );
                    })}
                </fieldset>

                <fieldset className="space-y-2.5 border-t border-border pt-4">
                    <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("format.title")}
                    </legend>
                    {formats.map((item) => (
                        <label key={item.key} className="group flex cursor-pointer items-center gap-2.5 text-sm">
                            <input
                                type="radio"
                                name="content-format"
                                checked={format === item.key}
                                onChange={() => onFormatChange(item.key)}
                                className="h-4 w-4 shrink-0 accent-vegan-green"
                            />
                            <span className="flex-1 text-dark transition-colors group-hover:text-vegan-green">
                                {item.label}
                            </span>
                            <span className="text-xs tabular-nums text-muted-foreground">{item.count}</span>
                        </label>
                    ))}
                </fieldset>

                <fieldset className="space-y-2.5 border-t border-border pt-4">
                    <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("reading.title")}
                    </legend>
                    {readings.map((item) => (
                        <label key={item.key} className="group flex cursor-pointer items-center gap-2.5 text-sm">
                            <input
                                type="radio"
                                name="reading-time"
                                checked={reading === item.key}
                                onChange={() => onReadingChange(item.key)}
                                className="h-4 w-4 shrink-0 accent-vegan-green"
                            />
                            <span className="flex-1 text-dark transition-colors group-hover:text-vegan-green">
                                {item.label}
                            </span>
                            <span className="text-xs tabular-nums text-muted-foreground">{item.count}</span>
                        </label>
                    ))}
                </fieldset>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-card p-5 shadow-sm">
                <div className="relative z-10 space-y-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-vegan-green text-white shadow-sm">
                        <Sparkles className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                        <h2 className="text-base font-bold text-dark">{t("cta.title")}</h2>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("cta.body")}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => (isAuthenticated ? openComposer() : navigate("/login"))}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-vegan-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-vegan-green-hover"
                    >
                        {t("cta.action")}
                    </button>
                </div>
            </div>
        </div>
    );
}
