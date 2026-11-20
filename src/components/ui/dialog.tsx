import { createContext, useContext, useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";

/**
 * `<dialog showModal()>` nằm ở **top layer** nên toast render ở body (Toaster trong `main.tsx`)
 * bị che phía sau. Dialog mount thêm một Toaster riêng *bên trong* thẻ dialog.
 *
 * Hai đường lấy id:
 * - component **con** (vd `ImageUploader`) đọc qua `useDialogToastId()`;
 * - component **cha sở hữu** dialog (vd composer) tự tạo id bằng `useId()` rồi truyền `toasterId`,
 *   vì handler của nó nằm phía trên `<Dialog>` nên không thấy context.
 */
const DialogToastContext = createContext<string | undefined>(undefined);

/** `undefined` khi không ở trong dialog — truyền thẳng vào `toast.*(msg, { toasterId })`. */
export function useDialogToastId(): string | undefined {
    return useContext(DialogToastContext);
}

interface DialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    /** Nhãn nhỏ phía trên tiêu đề (mockup dạng "tờ công thức"). Opt-in. */
    eyebrow?: ReactNode;
    children: ReactNode;
    className?: string;
    /** Ghi đè kiểu tiêu đề — opt-in, mặc định không đổi gì cho 11 dialog khác. */
    titleClassName?: string;
    descriptionClassName?: string;
    /** Ghi đè khối bao tiêu đề + nút X (dùng làm dải hero). */
    headerClassName?: string;
    /** Nội dung đặt cạnh nút X — pill trạng thái của composer. Opt-in. */
    headerActions?: ReactNode;
    /** Bỏ padding 24px của thân — cho dialog tự dựng layout tràn viền. */
    padded?: boolean;
    /** Ghi đè class phần thân. */
    bodyClassName?: string;
    /**
     * Chặn đóng (Esc / bấm nền). Trả `false` để giữ dialog mở —
     * composer dùng để hỏi "bỏ bài đang soạn?" trước khi đóng.
     */
    onBeforeClose?: () => boolean;
    /**
     * Id Toaster riêng của dialog. Cha sở hữu dialog truyền id nó tự tạo (`useId()`) khi handler
     * của cha cần báo lỗi *bên trong* dialog nhưng nằm ngoài cây con — xem `useDialogToastId`.
     */
    toasterId?: string;
}

export function Dialog({
    open,
    onClose,
    title,
    description,
    eyebrow,
    children,
    className,
    titleClassName,
    descriptionClassName,
    headerClassName,
    headerActions,
    padded = true,
    bodyClassName,
    onBeforeClose,
    toasterId: toasterIdProp,
}: DialogProps) {
    const { t } = useTranslation("common");
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const generatedId = useId();
    const toastId = toasterIdProp ?? generatedId;
    // Giữ ref để listener `cancel` không phải gắn lại mỗi lần render.
    const beforeCloseRef = useRef(onBeforeClose);
    useEffect(() => {
        beforeCloseRef.current = onBeforeClose;
    });

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    // Esc: chặn ở `cancel` — đóng rồi mới báo thì không kịp huỷ.
    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        const handleCancel = (event: Event) => {
            if (beforeCloseRef.current?.() === false) event.preventDefault();
        };
        dialog.addEventListener("cancel", handleCancel);
        return () => dialog.removeEventListener("cancel", handleCancel);
    }, []);

    const requestClose = () => {
        if (beforeCloseRef.current?.() === false) return;
        onClose();
    };

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            onClose={onClose}
            onClick={(event) => {
                if (event.target === ref.current) requestClose();
            }}
            className={cn(
                "m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/40",
                className,
            )}
        >
            <DialogToastContext.Provider value={toastId}>
                {open && (
                    <div className={cn(padded && "p-6", bodyClassName)}>
                        <div className={cn("mb-4 flex items-start justify-between gap-4", headerClassName)}>
                            <div className="min-w-0 flex-1">
                                {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
                                <h2
                                    id={titleId}
                                    className={cn("text-xl font-bold leading-snug text-dark", titleClassName)}
                                >
                                    {title}
                                </h2>
                                {description && (
                                    <p className={cn("mt-1 text-sm text-muted-foreground", descriptionClassName)}>
                                        {description}
                                    </p>
                                )}
                            </div>
                            {headerActions}
                            <Button variant="ghost" size="icon" aria-label={t("close")} onClick={requestClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        {children}
                    </div>
                )}
                {/* Toaster riêng trong top layer của dialog — toast toàn cục bị `showModal()` che. */}
                {open && <Toaster id={toastId} position="top-center" duration={3000} gap={8} />}
            </DialogToastContext.Provider>
        </dialog>
    );
}
