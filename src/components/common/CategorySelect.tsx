import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export interface CategoryOption {
    id: string;
    name: string;
}

interface CategorySelectProps {
    options: CategoryOption[];
    value: string[];
    onChange: (ids: string[]) => void;
    loading?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    placeholder?: string;
    /** Nhãn cho trợ năng — không hiển thị. */
    ariaLabel?: string;
}

/**
 * Multi-select danh mục dạng combobox gọn: trigger hiện chip, panel checkbox.
 *
 * Dùng cho dialog soạn bài — không đủ chỗ cho khối chip mở rộng như trang cũ.
 */
export function CategorySelect({
    options,
    value,
    onChange,
    loading,
    disabled,
    invalid,
    placeholder,
    ariaLabel,
}: CategorySelectProps) {
    const { t } = useTranslation(["admin", "common"]);
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const listId = useId();

    useEffect(() => {
        if (!open) return;
        const handleClick = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const selected = options.filter((option) => value.includes(option.id));
    const toggle = (id: string) =>
        onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                disabled={disabled || loading}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                aria-invalid={invalid || undefined}
                aria-label={ariaLabel}
                className={cn(
                    "flex min-h-9 w-full items-center gap-1.5 rounded-lg border bg-surface px-2.5 py-1.5 text-left text-xs text-dark transition-colors",
                    invalid ? "border-danger" : "border-border",
                    !disabled && "hover:border-vegan-green-muted",
                    disabled && "cursor-not-allowed opacity-50",
                )}
            >
                <span className="flex min-w-0 flex-1 flex-wrap gap-1">
                    {loading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden="true" />
                    ) : selected.length === 0 ? (
                        <span className="truncate text-muted-foreground">
                            {placeholder ?? t("posts.form.categoryPlaceholder")}
                        </span>
                    ) : (
                        selected.map((option) => (
                            <span
                                key={option.id}
                                className="inline-flex items-center gap-1 rounded-full bg-vegan-green-light px-2 py-0.5 font-semibold text-vegan-green"
                            >
                                {option.name}
                                <X
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onChange(value.filter((item) => item !== option.id));
                                    }}
                                />
                            </span>
                        ))
                    )}
                </span>
                <ChevronDown
                    className={cn(
                        "h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-transform",
                        open && "rotate-180",
                    )}
                    aria-hidden="true"
                />
            </button>

            {open && !loading && (
                <div
                    id={listId}
                    role="listbox"
                    aria-multiselectable="true"
                    className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg"
                >
                    {options.length === 0 ? (
                        <p className="px-2 py-1.5 text-xs text-muted-foreground">
                            {t("posts.form.noCategories")}
                        </p>
                    ) : (
                        options.map((option) => {
                            const checked = value.includes(option.id);
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    role="option"
                                    aria-selected={checked}
                                    onClick={() => toggle(option.id)}
                                    className={cn(
                                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                                        checked
                                            ? "bg-vegan-green-light font-semibold text-vegan-green"
                                            : "text-dark hover:bg-muted-bg",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded border",
                                            checked ? "border-vegan-green bg-vegan-green text-white" : "border-border",
                                        )}
                                        aria-hidden="true"
                                    >
                                        {checked && <Check className="h-2.5 w-2.5" />}
                                    </span>
                                    <span className="truncate">{option.name}</span>
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
