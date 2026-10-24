import { useId, useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { cn } from "@/shared/utils/cn";

interface AutocompleteFieldProps<T> {
    id: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    invalid?: boolean;
    /** Tiền tố queryKey — mỗi danh sách gợi ý một khoá riêng. */
    queryKey: string;
    search: (name: string) => Promise<{ content: T[] }>;
    getLabel: (item: T) => string;
    emptyLabel: string;
}

const MIN_CHARS = 2;

/**
 * Ô nhập tự do + dropdown gợi ý. Người dùng **không bắt buộc** chọn từ danh sách —
 * backend find-or-create theo tên nên tên mới vẫn hợp lệ.
 */
export function AutocompleteField<T>({
    id,
    value,
    onChange,
    onBlur,
    placeholder,
    invalid,
    queryKey,
    search,
    getLabel,
    emptyLabel,
}: AutocompleteFieldProps<T>) {
    const listId = useId();
    const [isFocused, setIsFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const debounced = useDebounce(value.trim(), 300);
    const enabled = isFocused && debounced.length >= MIN_CHARS;

    const { data, isFetching } = useQuery({
        queryKey: [queryKey, debounced],
        queryFn: () => search(debounced),
        enabled,
        staleTime: 60_000,
    });

    const suggestions = enabled ? (data?.content ?? []) : [];
    const showList = isFocused && enabled;

    const select = (item: T) => {
        onChange(getLabel(item));
        // Đóng dropdown sau khi chọn; gõ tiếp sẽ mở lại (xem onChange bên dưới).
        setIsFocused(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (!showList || suggestions.length === 0) return;
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % suggestions.length);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
        } else if (event.key === "Enter" && activeIndex >= 0 && activeIndex < suggestions.length) {
            // Chặn Enter để không submit form khi đang chọn gợi ý.
            event.preventDefault();
            select(suggestions[activeIndex]);
        } else if (event.key === "Escape") {
            setActiveIndex(-1);
            setIsFocused(false);
        }
    };

    return (
        <div className="relative">
            <Input
                id={id}
                value={value}
                placeholder={placeholder}
                autoComplete="off"
                role="combobox"
                aria-expanded={showList && suggestions.length > 0}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-invalid={invalid}
                aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
                onChange={(event) => {
                    onChange(event.target.value);
                    setIsFocused(true);
                    setActiveIndex(-1);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    setIsFocused(false);
                    setActiveIndex(-1);
                    onBlur?.();
                }}
                onKeyDown={handleKeyDown}
                trailing={isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" /> : undefined}
            />

            {showList && (
                <ul
                    id={listId}
                    role="listbox"
                    className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
                >
                    {suggestions.length === 0 ? (
                        <li className="px-4 py-2 text-sm text-muted-foreground">{isFetching ? "…" : emptyLabel}</li>
                    ) : (
                        suggestions.map((item, index) => (
                            // index làm key: tên gợi ý có thể trùng nhau giữa các bản ghi.
                            <li key={index} id={`${listId}-${index}`} role="option" aria-selected={index === activeIndex}>
                                <button
                                    type="button"
                                    // mousedown chứ không phải click: blur của input chạy trước click và đóng dropdown.
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        select(item);
                                    }}
                                    className={cn(
                                        "block w-full px-4 py-2 text-left text-sm text-dark hover:bg-muted",
                                        index === activeIndex && "bg-muted",
                                    )}
                                >
                                    {getLabel(item)}
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}
