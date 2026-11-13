import { useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";

/**
 * Lý do admin từ chối, hiện trên card của chính tác giả (`/my-posts`, `/recipes`).
 *
 * Chỉ render khi `reason` có nội dung — nơi gọi đã tự kiểm tra trạng thái bị từ chối
 * (`status === "unpublished"` / `moderationStatus === "REJECTED"`), nên ở đây không cần
 * biết thêm gì về state machine. Reason do admin nhập tự do → luôn render dạng text,
 * không `dangerouslySetInnerHTML`.
 */
export function RejectionReason({ reason, className }: { reason: string | null | undefined; className?: string }) {
    const { t } = useTranslation("common");
    const text = reason?.trim();

    if (!text) return null;

    return (
        <div className={`rounded-xl border border-amber-strong/20 bg-amber-soft px-3 py-2 text-amber-strong ${className ?? ""}`}>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]">
                <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t("rejectionReason")}
            </p>
            <p className="mt-1 text-[13px] leading-snug">{text}</p>
        </div>
    );
}
