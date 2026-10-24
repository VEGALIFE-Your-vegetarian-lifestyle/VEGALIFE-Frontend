import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface TagInputProps {
    /** Nhãn truy cập cho input (FormField đã render label hiển thị riêng). */
    label: string;
    /** id của input — để `<label htmlFor>` của FormField trỏ đúng. Bỏ trống thì tự sinh. */
    id?: string;
    value: string[];
    onChange: (next: string[]) => void;
    placeholder?: string;
    /** Gợi ý bấm-để-thêm; người dùng vẫn gõ được giá trị ngoài danh sách. */
    suggestions?: readonly string[];
    maxItems: number;
    maxLength: number;
    /** Màu chip — phân biệt dị ứng (terracotta) với sở thích/hạn chế (xanh). */
    tone?: "green" | "alert";
    disabled?: boolean;
}

const TONE_CLASS = {
    green: "bg-vegan-green-light text-vegan-green",
    alert: "bg-danger-soft text-danger",
} as const;

/**
 * Multi-select dạng chip: Enter/dấu phẩy để thêm, Backspace khi ô trống để xoá
 * chip cuối. Không dùng `<select multiple>` vì backend nhận chuỗi tự do.
 */
export function TagInput({
    label,
    id,
    value,
    onChange,
    placeholder,
    suggestions = [],
    maxItems,
    maxLength,
    tone = "green",
    disabled,
}: TagInputProps) {
    const { t } = useTranslation("profile");
    const [draft, setDraft] = useState("");
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const inputRef = useRef<HTMLInputElement>(null);

    const error = draftError(draft, value, maxItems, maxLength, t);

    const add = (raw: string) => {
        const text = raw.trim().replace(/\s+/g, " ");
        if (!text || value.length >= maxItems) return;
        if (value.some((item) => item.toLowerCase() === text.toLowerCase())) {
            setDraft("");
            return;
        }
        onChange([...value, text]);
        setDraft("");
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add(draft);
            return;
        }
        if (event.key === "Backspace" && draft === "" && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    const remaining = maxItems - value.length;
    const availableSuggestions = suggestions.filter(
        (item) => !value.some((tag) => tag.toLowerCase() === item.toLowerCase()),
    );

    return (
        <div>
            <div
                className={cn(
                    "flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface px-2 py-1.5 shadow-sm transition-all focus-within:border-vegan-green focus-within:ring-2 focus-within:ring-vegan-green",
                    disabled && "cursor-not-allowed bg-muted opacity-50",
                )}
                onClick={() => inputRef.current?.focus()}
            >
                {value.map((tag) => (
                    <span
                        key={tag}
                        className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", TONE_CLASS[tone])}
                    >
                        {tag}
                        <button
                            type="button"
                            disabled={disabled}
                            aria-label={t("dietary.removeTag", { tag })}
                            onClick={() => onChange(value.filter((item) => item !== tag))}
                            className="rounded-full p-0.5 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current disabled:pointer-events-none"
                        >
                            <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                    </span>
                ))}

                <input
                    id={inputId}
                    ref={inputRef}
                    aria-label={label}
                    value={draft}
                    disabled={disabled || remaining <= 0}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => add(draft)}
                    placeholder={value.length === 0 ? placeholder : undefined}
                    className="h-8 min-w-[8rem] flex-1 bg-transparent px-1 text-sm text-dark placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed"
                />
            </div>

            {error ? (
                <p role="alert" className="mt-1 text-sm text-destructive">
                    {error}
                </p>
            ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                    {t("dietary.counter", { used: value.length, max: maxItems })}
                </p>
            )}

            {availableSuggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {availableSuggestions.map((item) => (
                        <button
                            key={item}
                            type="button"
                            disabled={disabled || remaining <= 0}
                            onClick={() => add(item)}
                            className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-vegan-green hover:text-vegan-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green disabled:pointer-events-none disabled:opacity-50"
                        >
                            + {item}
                        </button>
                    ))}
                </div>
            )}

            {/* Gợi ý chỉ là UI: backend nhận chuỗi tự do, người dùng gõ giá trị khác được. */}
            {suggestions.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">{t("dietary.customHint")}</p>
            )}
        </div>
    );
}

/** Lỗi của giá trị đang gõ — chưa thêm vào mảng nên phải báo tại chỗ. */
function draftError(
    draft: string,
    value: readonly string[],
    maxItems: number,
    maxLength: number,
    t: (key: string, options?: Record<string, unknown>) => string,
): string | undefined {
    const text = draft.trim();
    if (!text) return undefined;
    if (text.length > maxLength) return t("dietary.itemTooLong", { max: maxLength });
    if (value.length >= maxItems) return t("dietary.limitReached", { max: maxItems });
    if (value.some((item) => item.toLowerCase() === text.toLowerCase())) return t("dietary.duplicate");
    return undefined;
}
