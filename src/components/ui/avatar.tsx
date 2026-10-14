import { cn } from "@/lib/utils";

interface AvatarProps {
    /** Tên dùng để lấy chữ cái đầu. */
    name?: string | null;
    src?: string | null;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    /** Chấm xanh xác minh ở góc dưới-phải. */
    verified?: boolean;
    className?: string;
}

const SIZES: Record<NonNullable<AvatarProps["size"]>, string> = {
    xs: "h-6 w-6 text-[9px]",
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-xs",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
};

/** Ảnh đại diện: có `src` thì hiện ảnh, không thì lấy chữ cái đầu của tên. */
export function Avatar({ name, src, size = "md", verified = false, className }: AvatarProps) {
    const initials = (name ?? "VL").trim().slice(0, 2).toUpperCase();

    return (
        <span className={cn("relative inline-flex flex-shrink-0", className)}>
            <span
                className={cn(
                    "flex items-center justify-center overflow-hidden rounded-full bg-vegan-green-light font-bold text-vegan-green",
                    SIZES[size],
                )}
            >
                {src ? <img src={src} alt={name ?? ""} className="h-full w-full object-cover" /> : initials}
            </span>
            {verified && (
                <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-vegan-green"
                />
            )}
        </span>
    );
}
