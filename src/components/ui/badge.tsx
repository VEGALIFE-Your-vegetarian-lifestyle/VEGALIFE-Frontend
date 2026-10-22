import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const badgeVariants = cva("inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold", {
    variants: {
        variant: {
            default: "bg-vegan-green text-white",
            secondary: "bg-secondary text-secondary-foreground",
            destructive: "bg-terracotta text-white",
            outline: "border border-border text-dark",
            lightgreen: "bg-vegan-green-light text-vegan-green",
            cream: "bg-cream text-dark",
            /** Nhãn "Recipe / Blog / Video" trên ảnh card — nền trắng mờ. */
            glass: "bg-surface/90 text-dark backdrop-blur-sm",
            /** Badge Draft, trạng thái chờ. */
            amber: "bg-amber-soft text-amber-strong",
            /** Chip category đang chọn ở Create Post — viền xanh. */
            outlineGreen: "border border-vegan-green bg-surface text-vegan-green",
            info: "bg-info-soft text-info",
        },
        size: {
            default: "px-3 py-1 text-xs",
            sm: "px-2 py-0.5 text-[10px]",
            md: "px-3 py-1 text-[11px]",
        },
    },
    defaultVariants: { variant: "default", size: "default" },
});

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
    return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
