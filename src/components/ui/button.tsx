import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                primary: "bg-vegan-green text-white hover:bg-vegan-green-hover active:bg-vegan-green-active",
                secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
                outline: "border border-border bg-transparent text-dark hover:bg-accent",
                ghost: "text-dark hover:bg-accent",
                destructive: "bg-terracotta text-white hover:bg-terracotta-hover",
                cream: "bg-cream text-dark hover:bg-lightgreen",
            },
            size: {
                sm: "h-8 px-3",
                default: "h-10 min-w-[100px] px-4",
                lg: "h-12 min-w-[120px] px-6 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: { variant: "primary", size: "default" },
    },
);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { }

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
    return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}