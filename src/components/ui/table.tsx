import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
    return (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className={cn("w-full", className)} {...props} />
        </div>
    );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
    return <thead className={cn("bg-muted/50", className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody className={cn("text-sm", className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
    return <tr className={cn("border-b border-border last:border-b-0 hover:bg-muted/25", className)} {...props} />;
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th
            scope="col"
            className={cn("h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground", className)}
            {...props}
        />
    );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn("p-4 align-middle text-dark", className)} {...props} />;
}