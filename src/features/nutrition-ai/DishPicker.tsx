import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChefHat, Loader2, Search, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/common/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { searchDishes } from "@/shared/api/dishes";
import type { Dish } from "@/shared/types/dish";

const PAGE_SIZE = 8;

interface DishPickerProps {
    /** Gửi danh sách món đã chọn cho trợ lý AI. */
    onAsk: (dishes: Dish[]) => void;
    disabled?: boolean;
}

/**
 * Danh sách món để user chỉ đích danh món muốn đưa vào thực đơn. Hiện cả `name`
 * lẫn `id` — AI cần tên để lập plan, user cần id để đối chiếu lại với menu đã lưu.
 */
export function DishPicker({ onAsk, disabled }: DishPickerProps) {
    const { t } = useTranslation("aiNutrition");
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Dish[]>([]);

    const debouncedQ = useDebounce(q.trim(), 300);
    const { data, isFetching, isError, refetch } = useQuery({
        queryKey: ["dishes", debouncedQ, page],
        queryFn: () => searchDishes({ name: debouncedQ || undefined, page: page - 1, size: PAGE_SIZE }),
        staleTime: 60_000,
    });

    const dishes = data?.content ?? [];
    const isSelected = (id: string) => selected.some((dish) => dish.id === id);

    const toggle = (dish: Dish) =>
        setSelected((prev) =>
            prev.some((item) => item.id === dish.id)
                ? prev.filter((item) => item.id !== dish.id)
                : [...prev, dish],
        );

    return (
        <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-bold text-dark">
                    <ChefHat className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                    {t("dishPicker.title")}
                </h2>
                <Badge variant="outline" size="sm">
                    {t("dishPicker.selected", { n: selected.length })}
                </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("dishPicker.subtitle")}</p>

            <Input
                className="mt-3"
                value={q}
                leadingIcon={Search}
                placeholder={t("dishPicker.placeholder")}
                aria-label={t("dishPicker.placeholder")}
                onChange={(event) => {
                    setQ(event.target.value);
                    setPage(1);
                }}
                trailing={
                    isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" /> : undefined
                }
            />

            {isError ? (
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-danger" role="alert">
                    <span>{t("dishPicker.loadFailed")}</span>
                    <Button variant="outline" size="xs" onClick={() => void refetch()}>
                        {t("dishPicker.retry")}
                    </Button>
                </div>
            ) : dishes.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                    {isFetching ? t("dishPicker.loading") : t("dishPicker.empty")}
                </p>
            ) : (
                <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
                    {dishes.map((dish) => (
                        <li key={dish.id}>
                            <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-muted-bg">
                                <input
                                    type="checkbox"
                                    checked={isSelected(dish.id)}
                                    onChange={() => toggle(dish)}
                                    className="mt-0.5 h-4 w-4 rounded border-border text-vegan-green focus:ring-vegan-green"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-semibold text-dark">{dish.name}</span>
                                    <span className="block truncate font-mono text-[10px] text-muted-foreground">
                                        {dish.id}
                                    </span>
                                    {dish.cuisineType && (
                                        <span className="text-[10px] text-muted-foreground">{dish.cuisineType}</span>
                                    )}
                                </span>
                            </label>
                        </li>
                    ))}
                </ul>
            )}

            <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />

            {selected.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {selected.map((dish) => (
                        <span
                            key={dish.id}
                            className="flex items-center gap-1 rounded-full bg-vegan-green-light px-2 py-0.5 text-[10px] font-semibold text-vegan-green"
                        >
                            {dish.name}
                            <button
                                type="button"
                                onClick={() => toggle(dish)}
                                aria-label={t("dishPicker.remove", { name: dish.name })}
                                className="rounded-full p-0.5 hover:bg-white/50"
                            >
                                <X className="h-3 w-3" aria-hidden="true" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <Button
                className="mt-3 w-full"
                size="sm"
                disabled={disabled || selected.length === 0}
                onClick={() => onAsk(selected)}
            >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {t("dishPicker.action")}
            </Button>
        </section>
    );
}
