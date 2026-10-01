import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                "h-11 w-full rounded-xl border border-border bg-surface px-4 py-2 text-base text-dark placeholder:text-muted-foreground shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green focus-visible:border-vegan-green disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-[invalid=true]:border-terracotta aria-[invalid=true]:focus-visible:ring-terracotta sm:text-sm",
                className,
            )}
            {...props}
        />
    );
}
