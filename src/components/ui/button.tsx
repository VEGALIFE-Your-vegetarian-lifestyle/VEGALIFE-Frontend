import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                primary: "bg-vegan-green text-white hover:bg-vegan-green-hover active:bg-vegan-green-active",
                secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
                outline: "border border-border bg-transparent text-dark hover:bg-accent hover:border-vegan-green-muted",
                ghost: "text-dark hover:bg-accent",
                destructive: "bg-danger text-white hover:bg-danger/90",
                /** Nút "View Recipe / View Video / View Blog" trong card feed. */
                soft: "bg-lavender text-lavender-strong hover:bg-lavender-hover",
                /** Nút trắng có viền — "Continue with Google", tab chưa chọn. */
                white: "border border-border bg-surface text-dark hover:bg-muted-bg",
                /** Nút đặt trên nền xanh đặc (header/footer) — CTA chính. */
                onBrand: "bg-white text-vegan-green hover:bg-vegan-green-light active:bg-vegan-green-light/80",
                /** Nút phụ đặt trên nền xanh đặc — Login/Register, icon header admin. */
                onBrandGhost: "text-white/90 hover:bg-white/15 hover:text-white",
            },
            size: {
                xs: "h-8 px-3 text-xs",
                sm: "h-9 px-3.5 text-sm",
                default: "h-11 px-5 text-sm",
                lg: "h-12 px-6 text-base",
                icon: "h-10 w-10",
                iconSm: "h-8 w-8",
            },
            shape: {
                default: "rounded-xl",
                pill: "rounded-full",
            },
            block: {
                true: "w-full",
            },
        },
        defaultVariants: { variant: "primary", size: "default", shape: "default" },
    },
);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, shape, block, type = "button", ...props }: ButtonProps) {
    return <button type={type} className={cn(buttonVariants({ variant, size, shape, block }), className)} {...props} />;
}
