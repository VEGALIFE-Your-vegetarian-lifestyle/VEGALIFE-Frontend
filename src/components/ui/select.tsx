import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// className áp dụng cho khung bọc ngoài (dùng để chỉnh độ rộng)
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <div className={cn("relative", className)}>
            <select
                className="h-10 w-full appearance-none rounded-md border border-border bg-background py-2 pl-3 pr-8 text-base text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                {...props}
            >
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
    );
}