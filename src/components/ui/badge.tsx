import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold", {
    variants: {
        variant: {
            default: "bg-vegan-green text-white",
            secondary: "bg-secondary text-secondary-foreground",
            destructive: "bg-terracotta text-white",
            outline: "border border-border text-dark",
            lightgreen: "bg-vegan-green-light text-vegan-green",
            cream: "bg-cream text-dark",
        },
        size: {
            default: "px-3 py-1 text-xs",
            sm: "px-2 py-0.5 text-[10px]",
        },
    },
    defaultVariants: { variant: "default", size: "default" },
});

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
    return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
