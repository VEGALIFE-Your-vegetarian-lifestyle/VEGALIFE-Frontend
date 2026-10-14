import { cn } from "@/lib/utils";

export interface PillTabItem<T extends string> {
    key: T;
    label: string;
    count?: number;
}

interface PillTabsProps<T extends string> {
    items: PillTabItem<T>[];
    value: T;
    onChange: (key: T) => void;
    className?: string;
}

/**
 * Tabs dạng pill có count — dùng chung cho Explore / My Posts / Nearby / Create Post.
 * ponytail: gộp 4 bản chép tay trước đây về một chỗ.
 */
export function PillTabs<T extends string>({ items, value, onChange, className }: PillTabsProps<T>) {
    return (
        <div className={cn("flex flex-wrap gap-2", className)} role="tablist">
            {items.map((item) => {
                const active = item.key === value;
                return (
                    <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(item.key)}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition",
                            active
                                ? "bg-vegan-green text-white"
                                : "border border-border bg-surface text-muted-foreground hover:border-vegan-green-muted hover:text-vegan-green",
                        )}
                    >
                        {item.label}
                        {item.count !== undefined && (
                            <span
                                className={cn(
                                    "rounded-full px-1.5 text-[10px]",
                                    active ? "bg-white/25" : "bg-muted-bg",
                                )}
                            >
                                {item.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
