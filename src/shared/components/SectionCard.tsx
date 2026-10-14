import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
    /** Nhãn nhỏ phía trên tiêu đề, ví dụ "STEP 1". */
    eyebrow?: string;
    title?: string;
    /** Nội dung bên phải tiêu đề (mockup: badge "4 Categories Selected"). */
    aside?: ReactNode;
    /** Ghi chú chân khối (mockup: dòng "Every post must be declared as..."). */
    footnote?: ReactNode;
    children: ReactNode;
    className?: string;
}

/**
 * Khối có viền dùng chung — mỗi bước ở Create Post, mỗi section ở Post Detail.
 * Trước đây mỗi chỗ tự viết lại `rounded-2xl border border-border bg-card p-5`.
 */
export function SectionCard({ eyebrow, title, aside, footnote, children, className }: SectionCardProps) {
    return (
        <section className={cn("rounded-2xl border border-border bg-card p-5 sm:p-6", className)}>
            {(eyebrow || title || aside) && (
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        {eyebrow && (
                            <p className="text-[11px] font-bold uppercase tracking-wider text-vegan-green">{eyebrow}</p>
                        )}
                        {title && <h2 className="mt-1 text-lg font-bold text-dark">{title}</h2>}
                    </div>
                    {aside}
                </div>
            )}
            {children}
            {footnote && (
                <p className="mt-4 flex items-start gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                    {footnote}
                </p>
            )}
        </section>
    );
}
