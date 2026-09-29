import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
            <AlertCircle className="mb-4 h-16 w-16 text-terracotta" aria-hidden="true" />
            <h3 className="mb-2 text-lg font-semibold text-dark">Đã có lỗi xảy ra</h3>
            <p className="mb-6 max-w-sm text-muted-foreground">
                Không thể tải nội dung. Vui lòng kiểm tra kết nối và thử lại.
            </p>
            <Button variant="outline" onClick={onRetry}>
                Thử lại
            </Button>
        </div>
    );
}