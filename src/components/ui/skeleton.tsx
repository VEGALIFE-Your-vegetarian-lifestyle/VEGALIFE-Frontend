import type { HTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

/**
 * Khối chờ. `bg-border` chứ không `bg-muted`: nền `muted` (#eef1f4) gần trùng nền trang
 * (#f4f5f7) nên khối chờ gần như tàng hình.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("animate-pulse rounded-md bg-border", className)} {...props} />;
}