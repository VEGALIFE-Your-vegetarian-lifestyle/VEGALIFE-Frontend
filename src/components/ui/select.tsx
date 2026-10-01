import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <div className={cn("relative", className)}>
            <select
                className="h-11 w-full appearance-none rounded-xl border border-border bg-surface px-4 py-2 text-base text-dark shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green focus-visible:border-vegan-green disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                {...props}
            >
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
    );
}
