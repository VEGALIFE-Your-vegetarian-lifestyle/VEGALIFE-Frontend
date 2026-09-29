import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    destructive?: boolean;
    loading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel, destructive, loading, onConfirm, onClose }: ConfirmDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} title={title} description={description}>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                    Hủy
                </Button>
                <Button variant={destructive ? "destructive" : "primary"} disabled={loading} onClick={onConfirm}>
                    {confirmLabel}
                </Button>
            </div>
        </Dialog>
    );
}