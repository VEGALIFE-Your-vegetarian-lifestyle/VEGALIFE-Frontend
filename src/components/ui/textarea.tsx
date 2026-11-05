import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            className={cn(
                "min-h-[120px] w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-base text-dark placeholder:text-muted-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green focus-visible:border-vegan-green disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger sm:text-sm",
                className,
            )}
            {...props}
        />
    );
}
