import { useId, useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { searchDishes } from "@/shared/api/dishes";
import type { PickedDish } from "./schema";

/** `size` tối đa backend nhận (DishListRequest `@Max(100)`) — lấy hết trong một request. */
const PAGE_SIZE = 100;

interface DishSlotPickerProps {
    id: string;
    value: PickedDish | null;
    onChange: (dish: PickedDish | null) => void;
    disabled?: boolean;
}

/**
 * Một ô bữa: tìm + chọn **đúng một** món từ `GET /api/dishes`.
 *
 * Khác `AutocompleteField` của form recipe (gõ tên tự do, backend find-or-create):
 * menu cần `dishId` có thật nên bắt buộc chọn từ danh sách.
 * ponytail: dropdown lấy tối đa 100 món (cap của backend) trong một request, không phân
 * trang — gõ để lọc. Thêm phân trang khi catalogue vượt 100 món.
 */
export function DishSlotPicker({ id, value, onChange, disabled }: DishSlotPickerProps) {
    const { t } = useTranslation("menu");
    const listId = useId();
    const [q, setQ] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const debounced = useDebounce(q.trim(), 300);
    // Ô trống vẫn gọi để hiện vài món đầu — user không phải gõ gì mới thấy danh sách.
    const { data, isFetching } = useQuery({
        queryKey: ["dishes", debounced, PAGE_SIZE],
        queryFn: () => searchDishes({ name: debounced || undefined, page: 0, size: PAGE_SIZE }),
        staleTime: 60_000,
        enabled: isFocused && !disabled,
    });

    const suggestions = isFocused ? (data?.content ?? []) : [];

    const select = (dish: PickedDish) => {
        onChange({ id: dish.id, name: dish.name });
        setQ("");
        setIsFocused(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (suggestions.length === 0) return;
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % suggestions.length);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
        } else if (event.key === "Enter" && activeIndex >= 0) {
            // Chặn Enter để không submit form khi đang chọn gợi ý.
            event.preventDefault();
            select(suggestions[activeIndex]);
        } else if (event.key === "Escape") {
            setActiveIndex(-1);
            setIsFocused(false);
        }
    };

    if (value) {
        return (
            <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 shadow-sm">
                <span className="min-w-0 flex-1 truncate text-sm text-dark">{value.name}</span>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(null)}
                    aria-label={t("create.clearDish", { name: value.name })}
                    className="rounded-full p-1 text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <Input
                id={id}
                value={q}
                disabled={disabled}
                autoComplete="off"
                leadingIcon={Search}
                placeholder={t("create.searchDish")}
                aria-label={t("create.searchDish")}
                role="combobox"
                aria-expanded={suggestions.length > 0}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
                onChange={(event) => {
                    setQ(event.target.value);
                    setIsFocused(true);
                    setActiveIndex(-1);
                }}
                onFocus={() => setIsFocused(true)}
                // blur trước mousedown của option → đóng dropdown sẽ huỷ click; option dùng
                // `onMouseDown` + preventDefault để chọn được.
                onBlur={() => {
                    setIsFocused(false);
                    setActiveIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                trailing={
                    isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" /> : undefined
                }
            />

            {isFocused && (
                <ul
                    id={listId}
                    role="listbox"
                    className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
                >
                    {suggestions.length === 0 ? (
                        <li className="px-4 py-2 text-sm text-muted-foreground">
                            {isFetching ? "…" : t("create.noDishFound")}
                        </li>
                    ) : (
                        suggestions.map((dish, index) => (
                            <li key={dish.id} id={`${listId}-${index}`} role="option" aria-selected={index === activeIndex}>
                                <button
                                    type="button"
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        select(dish);
                                    }}
                                    className="block w-full px-4 py-2 text-left text-sm text-dark hover:bg-muted"
                                >
                                    <span className="block truncate font-medium">{dish.name}</span>
                                    {dish.cuisineType && (
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {dish.cuisineType}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}
