import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { searchDishes } from "@/shared/api/dishes";
import { cn } from "@/shared/utils/cn";
import { MAX_DISH_REPEATS, type MealType } from "../types";
import { dishUsage, type MenuFormValues, type PickedDish } from "../create/schema";

/** Cap `size` của backend — lấy cả catalogue trong một request, gõ để lọc. */
const PAGE_SIZE = 100;

export interface AssignTarget {
    mealType: MealType;
    /** Ngày bấm vào; `null` = bấm nhãn bữa (gán cả hàng). */
    dayIndex: number | null;
    /** Ô neo để đặt popover. */
    anchor: HTMLElement;
}

interface DishAssignPopoverProps {
    target: AssignTarget;
    values: MenuFormValues;
    onApply: (mealType: MealType, dayIndexes: number[], dish: PickedDish | null) => void;
    onClose: () => void;
}

/**
 * Popover gán món cho nhiều ngày của **một bữa**.
 * Bữa lấy từ hàng đã bấm nên không có dropdown chọn bữa — chỉ chọn món + tick ngày.
 * Giới hạn `MAX_DISH_REPEATS` tính cả phần đang tick, nút ngày vượt trần bị khoá.
 */
export function DishAssignPopover({ target, values, onApply, onClose }: DishAssignPopoverProps) {
    const { t } = useTranslation("menu");
    const { mealType, dayIndex } = target;
    const initialDish = dayIndex !== null ? values.days[dayIndex].slots.find((slot) => slot.mealType === mealType)?.dish ?? null : null;

    const [dish, setDish] = useState<PickedDish | null>(initialDish);
    const [selected, setSelected] = useState<Set<number>>(
        () => new Set(dayIndex !== null ? [dayIndex] : []),
    );
    const [query, setQuery] = useState("");
    const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const debounced = useDebounce(query.trim(), 250);
    const { data, isFetching } = useQuery({
        queryKey: ["dishes", debounced, PAGE_SIZE],
        queryFn: () => searchDishes({ name: debounced || undefined, page: 0, size: PAGE_SIZE }),
        staleTime: 60_000,
    });
    const dishes = data?.content ?? [];

    const usage = useMemo(() => dishUsage(values), [values]);
    const usedCount = dish ? usage.get(dish.id)?.count ?? 0 : 0;

    /** Số ô sẽ tốn thêm lượt: ô đang chứa đúng món đó thì không tính. */
    const newCost = useMemo(() => {
        if (!dish) return 0;
        let cost = 0;
        for (const index of selected) {
            const current = values.days[index]?.slots.find((slot) => slot.mealType === mealType)?.dish;
            if (!current || current.id !== dish.id) cost += 1;
        }
        return cost;
    }, [dish, selected, values, mealType]);

    const remaining = dish ? Math.max(0, MAX_DISH_REPEATS - usedCount - newCost) : MAX_DISH_REPEATS;

    /** Món đã dùng trong tuần này — gợi ý nhanh, không gọi thêm API. */
    const recents = useMemo(() => {
        const seen = new Map<string, PickedDish>();
        for (const day of values.days) {
            for (const slot of day.slots) {
                if (slot.dish && !seen.has(slot.dish.id)) seen.set(slot.dish.id, slot.dish);
            }
        }
        return [...seen.values()].slice(0, 5);
    }, [values]);

    // Đặt popover cạnh ô neo, lật lên trên nếu không đủ chỗ.
    useEffect(() => {
        const place = () => {
            const rect = target.anchor.getBoundingClientRect();
            const panel = panelRef.current;
            const width = Math.min(340, window.innerWidth - 24);
            const height = panel?.offsetHeight ?? 460;
            const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
            const below = rect.bottom + 8;
            const top = below + height > window.innerHeight - 12 ? Math.max(12, rect.top - height - 8) : below;
            setCoords({ left, top });
        };
        place();
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        return () => {
            window.removeEventListener("resize", place);
            window.removeEventListener("scroll", place, true);
        };
    }, [target.anchor]);

    // Esc + click ngoài để đóng.
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        const onPointer = (event: MouseEvent) => {
            const node = event.target as Node;
            if (panelRef.current?.contains(node)) return;
            if (target.anchor.contains(node)) return;
            onClose();
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onPointer);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onPointer);
        };
    }, [onClose, target.anchor]);

    const toggleDay = (index: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const conflicts = [...selected].filter((index) => {
        const current = values.days[index]?.slots.find((slot) => slot.mealType === mealType)?.dish;
        return Boolean(dish && current && current.id !== dish.id);
    });

    const dayLabel = (index: number) =>
        values.days[index].date.slice(5).replace("-", "/");

    return (
        <div
            ref={panelRef}
            role="dialog"
            aria-label={t("create.pop.title", { meal: t(`mealType.${mealType}`) })}
            style={{
                left: coords?.left ?? -9999,
                top: coords?.top ?? -9999,
                width: `min(340px, calc(100vw - 24px))`,
            }}
            className="fixed z-50 flex max-h-[78vh] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
            <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
                <span className="text-sm font-bold text-dark">
                    {t("create.pop.title", { meal: t(`mealType.${mealType}`) })}
                    {dayIndex !== null && (
                        <span className="ml-1 font-medium text-muted-foreground">· {dayLabel(dayIndex)}</span>
                    )}
                </span>
                <Button variant="ghost" size="iconSm" className="ml-auto" aria-label={t("common:close")} onClick={onClose}>
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>

            <div className="px-3.5 pt-2.5">
                <Input
                    value={query}
                    autoFocus
                    autoComplete="off"
                    leadingIcon={Search}
                    placeholder={t("create.searchDish")}
                    aria-label={t("create.searchDish")}
                    onChange={(event) => setQuery(event.target.value)}
                    trailing={isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" /> : undefined}
                />
            </div>

            {recents.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-3.5 pb-2 pt-2">
                    {recents.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setDish(item)}
                            className={cn(
                                "rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold transition-colors",
                                dish?.id === item.id
                                    ? "border-vegan-green bg-vegan-green text-white"
                                    : "border-border bg-surface text-muted-foreground hover:border-vegan-green-muted hover:bg-vegan-green-subtle hover:text-vegan-green",
                            )}
                        >
                            {item.name}
                        </button>
                    ))}
                </div>
            )}

            <ul className="min-h-0 flex-1 overflow-auto px-2 pb-2">
                {dishes.length === 0 ? (
                    <li className="px-2 py-2.5 text-sm text-muted-foreground">
                        {isFetching ? "…" : t("create.noDishFound")}
                    </li>
                ) : (
                    dishes.map((item) => {
                        const used = usage.get(item.id)?.count ?? 0;
                        return (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    onClick={() => setDish({ id: item.id, name: item.name })}
                                    className={cn(
                                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-dark hover:bg-vegan-green-subtle",
                                        dish?.id === item.id && "bg-vegan-green-subtle ring-1 ring-vegan-green-muted",
                                    )}
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-semibold">{item.name}</span>
                                        {item.cuisineType && (
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {item.cuisineType}
                                            </span>
                                        )}
                                    </span>
                                    <span
                                        className={cn(
                                            "flex-none text-[10.5px] font-extrabold tabular-nums",
                                            used >= MAX_DISH_REPEATS ? "text-danger" : "text-muted-foreground",
                                        )}
                                    >
                                        {used}/{MAX_DISH_REPEATS}
                                    </span>
                                </button>
                            </li>
                        );
                    })
                )}
            </ul>

            <div className="border-t border-border bg-background px-3.5 pb-2.5 pt-2.5">
                <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-[11.5px] font-bold uppercase tracking-wide text-vegan-green">
                        {t("create.pop.assignTo")}
                    </span>
                    <span
                        className={cn(
                            "ml-auto text-[11.5px] font-semibold",
                            !dish || remaining === 0 ? "text-amber-strong" : "text-muted-foreground",
                        )}
                    >
                        {dish ? t("create.pop.remaining", { count: remaining, max: MAX_DISH_REPEATS }) : t("create.pop.pickFirst")}
                    </span>
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {values.days.map((day, index) => {
                        const current = day.slots.find((slot) => slot.mealType === mealType)?.dish ?? null;
                        const sameAsChosen = Boolean(dish && current && current.id === dish.id);
                        const cost = sameAsChosen ? 0 : 1;
                        const blocked = !dish || (!selected.has(index) && usedCount + newCost + cost > MAX_DISH_REPEATS);
                        return (
                            <button
                                key={day.date}
                                type="button"
                                disabled={blocked}
                                onClick={() => toggleDay(index)}
                                aria-pressed={selected.has(index)}
                                aria-label={t("create.pop.assignDay", { day: dayLabel(index) })}
                                className={cn(
                                    "h-8 rounded-lg border text-[10.5px] font-extrabold transition-colors",
                                    selected.has(index)
                                        ? dish && current && !sameAsChosen
                                            ? "border-amber-strong bg-amber-strong text-white"
                                            : "border-vegan-green bg-vegan-green text-white"
                                        : "border-border bg-surface text-muted-foreground hover:border-vegan-green-muted hover:text-vegan-green",
                                    blocked && "cursor-not-allowed opacity-35",
                                )}
                            >
                                {dayLabel(index)}
                            </button>
                        );
                    })}
                </div>

                {conflicts.length > 0 && (
                    <p className="mt-2 text-[11.5px] leading-snug text-amber-strong">
                        {t("create.pop.willReplace", {
                            days: conflicts.map((index) => dayLabel(index)).join(", "),
                        })}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2 border-t border-border px-3.5 py-2.5">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    disabled={selected.size === 0}
                    onClick={() => onApply(mealType, [...selected], null)}
                >
                    {t("create.pop.clearDish")}
                </Button>
                <Button
                    size="sm"
                    className="ml-auto"
                    disabled={!dish || selected.size === 0}
                    onClick={() => dish && onApply(mealType, [...selected], dish)}
                >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("create.pop.apply", { count: selected.size })}
                </Button>
            </div>
        </div>
    );
}
