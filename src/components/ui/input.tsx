import type { InputHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    /** Icon hiện ở đầu ô (mockup: mail, lock, search). */
    leadingIcon?: LucideIcon;
    /** Nút/nội dung ở cuối ô (mockup: con mắt hiện mật khẩu). */
    trailing?: ReactNode;
}

/**
 * Không truyền `leadingIcon`/`trailing` thì render <input> trần như cũ,
 * nên mọi chỗ gọi hiện tại không phải sửa.
 */
export function Input({ className, leadingIcon: LeadingIcon, trailing, ...props }: InputProps) {
    const field = (
        <input
            className={cn(
                "h-11 w-full rounded-xl border border-border bg-surface px-4 py-2 text-base text-dark placeholder:text-muted-foreground shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green focus-visible:border-vegan-green disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger sm:text-sm",
                LeadingIcon && "pl-11",
                trailing && "pr-11",
                className,
            )}
            {...props}
        />
    );

    if (!LeadingIcon && !trailing) return field;

    return (
        <div className="relative w-full">
            {LeadingIcon && (
                <LeadingIcon
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                />
            )}
            {field}
            {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
        </div>
    );
}
