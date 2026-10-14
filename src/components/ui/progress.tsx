import { cn } from "@/lib/utils";

interface ProgressProps {
    /** 0–100. */
    value: number;
    className?: string;
    /** Màu thanh chạy. */
    tone?: "green" | "indigo" | "amber" | "info";
}

const TONES: Record<NonNullable<ProgressProps["tone"]>, string> = {
    green: "bg-vegan-green",
    indigo: "bg-lavender-strong",
    amber: "bg-amber-strong",
    info: "bg-info",
};

/** Thanh tiến độ — macro bar ở Post Detail, checklist ở Create Post. */
export function Progress({ value, className, tone = "green" }: ProgressProps) {
    const clamped = Math.max(0, Math.min(100, value));

    return (
        <div
            className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted-bg", className)}
            role="progressbar"
            aria-valuenow={Math.round(clamped)}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <div className={cn("h-full rounded-full transition-all", TONES[tone])} style={{ width: `${clamped}%` }} />
        </div>
    );
}
