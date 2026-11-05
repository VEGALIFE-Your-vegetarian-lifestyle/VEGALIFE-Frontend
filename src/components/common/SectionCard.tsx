import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

interface SectionCardProps {
    /** Nhãn nhỏ phía trên tiêu đề, ví dụ "STEP 1". Nhận node để chèn badge. */
    eyebrow?: ReactNode;
    title?: ReactNode;
    /** Dòng mô tả ngay dưới tiêu đề. */
    subtitle?: ReactNode;
    /** Nội dung bên phải tiêu đề (mockup: badge "4 Categories Selected"). */
    aside?: ReactNode;
    /** Ghi chú chân khối (mockup: dòng "Every post must be declared as..."). */
    footnote?: ReactNode;
    /**
     * Mockup Create Recipe: badge số nằm **cạnh** tiêu đề (không phải trên),
     * subtitle xuống dưới, và có đường kẻ xám phân cách header với nội dung.
     */
    inlineHeader?: boolean;
    /** Đường kẻ xám dưới header — dùng khi header là "tên khối" tách hẳn khỏi nội dung. */
    divided?: boolean;
    children: ReactNode;
    className?: string;
}

/**
 * Khối có viền dùng chung — mỗi bước ở Create Post, mỗi section ở Post Detail.
 * Trước đây mỗi chỗ tự viết lại `rounded-2xl border border-border bg-card p-5`.
 */
export function SectionCard({
    eyebrow,
    title,
    subtitle,
    aside,
    footnote,
    inlineHeader,
    divided,
    children,
    className,
}: SectionCardProps) {
    return (
        <section className={cn("rounded-2xl border border-border bg-card p-5 sm:p-6", className)}>
            {(eyebrow || title || aside) && (
                <div
                    className={cn(
                        "flex flex-wrap items-start justify-between gap-3",
                        inlineHeader && "mb-4 border-b border-border pb-4",
                        !inlineHeader && divided && "mb-5 border-b border-border pb-4",
                        !inlineHeader && !divided && "mb-5",
                    )}
                >
                    {inlineHeader ? (
                        <div className="min-w-0">
                            <div className="flex items-center gap-3">
                                {eyebrow}
                                {title && <h2 className="text-lg font-bold text-dark">{title}</h2>}
                            </div>
                            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
                        </div>
                    ) : (
                        <div>
                            {eyebrow && (
                                <p className="text-[11px] font-bold uppercase tracking-wider text-vegan-green">
                                    {eyebrow}
                                </p>
                            )}
                            {title && <h2 className="mt-1 text-lg font-bold text-dark">{title}</h2>}
                            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
                        </div>
                    )}
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
