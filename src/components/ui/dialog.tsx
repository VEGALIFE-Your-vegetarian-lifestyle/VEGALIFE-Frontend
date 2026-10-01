import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            onClose={onClose}
            onClick={(event) => {
                if (event.target === ref.current) onClose();
            }}
            className={cn(
                "m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/40",
                className,
            )}
        >
            {open && (
                <div className="p-6">
                    <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                            <h2 id={titleId} className="text-xl font-bold leading-snug text-dark">
                                {title}
                            </h2>
                            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                        </div>
                        <Button variant="ghost" size="icon" aria-label="Đóng" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    {children}
                </div>
            )}
        </dialog>
    );
}
