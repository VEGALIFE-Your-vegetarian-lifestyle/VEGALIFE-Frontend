import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            className={cn(
                "min-h-[120px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-base text-dark placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-[invalid=true]:border-terracotta aria-[invalid=true]:focus-visible:ring-terracotta sm:text-sm",
                className,
            )}
            {...props}
        />
    );
}