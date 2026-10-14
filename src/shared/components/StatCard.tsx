import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    /** Dòng phụ dưới nhãn. */
    hint?: string;
    className?: string;
}

/** Thẻ số liệu — My Posts, Profile, macro ở Post Detail. */
export function StatCard({ icon: Icon, label, value, hint, className }: StatCardProps) {
    return (
        <div className={cn("rounded-2xl border border-border bg-card p-4", className)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-vegan-green-light text-vegan-green">
                <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="mt-3 text-2xl font-bold text-dark">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}
