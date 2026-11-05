import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    /** Dòng phụ dưới nhãn. */
    hint?: string;
    className?: string;
}

/** Thẻ số liệu — My Posts, Profile, My Recipes. Nội dung nằm ngang với icon cho gọn. */
export function StatCard({ icon: Icon, label, value, hint, className }: StatCardProps) {
    return (
        <div className={cn("flex items-center gap-3 rounded-2xl border border-border bg-card p-4", className)}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-vegan-green-light text-vegan-green">
                <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
                <p className="text-xl font-bold leading-none text-dark">{value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
                {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
            </div>
        </div>
    );
}
