import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    // Hiện trang đầu, trang cuối và các trang quanh trang hiện tại
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
        (item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1,
    );

    return (
        <nav aria-label="Phân trang" className="mt-4 flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" aria-label="Trang trước" disabled={page === 1} onClick={() => onChange(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            {pages.map((item, index) => (
                <span key={item} className="flex items-center gap-1">
                    {index > 0 && item - pages[index - 1] > 1 && <span className="px-1 text-muted-foreground">…</span>}
                    <Button
                        variant={item === page ? "primary" : "ghost"}
                        size="icon"
                        aria-label={`Trang ${item}`}
                        aria-current={item === page ? "page" : undefined}
                        onClick={() => onChange(item)}
                    >
                        {item}
                    </Button>
                </span>
            ))}
            <Button variant="ghost" size="icon" aria-label="Trang sau" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </nav>
    );
}