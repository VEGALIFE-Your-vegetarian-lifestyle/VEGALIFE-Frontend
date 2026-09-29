import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                "h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-base text-dark placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-[invalid=true]:border-terracotta aria-[invalid=true]:focus-visible:ring-terracotta sm:text-sm",
                className,
            )}
            {...props}
        />
    );
}