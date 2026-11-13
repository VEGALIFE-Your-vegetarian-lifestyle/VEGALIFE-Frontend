import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { changeMenuStatus, deleteMenu } from "../api";
import type { MenuDetail, MenuStatus } from "../types";

interface NextAction {
    to: MenuStatus;
    labelKey: "schedule" | "cancelMenu";
    variant: "primary" | "outline";
    confirmKey: "confirmSchedule" | "confirmCancel";
}

/**
 * Bảng chuyển BR-MENU-007: `drafted → scheduled|cancelled`. UI không có nút "hoàn thành"
 * (bỏ 2026-11-13 theo yêu cầu), nên `scheduled` chỉ huỷ được. Chỉ render hành động hợp lệ
 * thay vì render rồi disable.
 */
const NEXT_ACTIONS: Record<MenuStatus, NextAction[]> = {
    drafted: [
        { to: "scheduled", labelKey: "schedule", variant: "primary", confirmKey: "confirmSchedule" },
        { to: "cancelled", labelKey: "cancelMenu", variant: "outline", confirmKey: "confirmCancel" },
    ],
    scheduled: [
        { to: "cancelled", labelKey: "cancelMenu", variant: "outline", confirmKey: "confirmCancel" },
    ],
    cancelled: [],
    completed: [],
};

/**
 * Nút đổi trạng thái của một menu. Xoá được ở mọi trạng thái (`DELETE /api/menus/{id}`);
 * menu đã ở trạng thái kết thúc chỉ còn nút xoá.
 */
export function MenuActions({ menu }: { menu: MenuDetail }) {
    const { t } = useTranslation("menu");
    const queryClient = useQueryClient();
    const [pending, setPending] = useState<NextAction | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["meal-plans"] });

    const mutation = useMutation({
        mutationFn: (status: MenuStatus) => changeMenuStatus(menu.id, status),
        onSuccess: () => {
            toast.success(t("actions.updated"));
            setPending(null);
            // Response thiếu `dish` đầy đủ — đọc lại qua `GET /api/menus/details`.
            invalidate();
        },
        // 409 overlap / 409 transition — backend nêu rõ lý do, hiện nguyên văn.
        onError: (error: unknown) => toast.error(getApiErrorMessage(error, t("actions.failed"))),
    });

    const remove = useMutation({
        mutationFn: () => deleteMenu(menu.id),
        onSuccess: () => {
            toast.success(t("actions.deleted"));
            setConfirmDelete(false);
            invalidate();
        },
        onError: (error: unknown) => toast.error(getApiErrorMessage(error, t("actions.deleteFailed"))),
    });

    const actions = NEXT_ACTIONS[menu.status];

    return (
        <div className="flex flex-wrap items-center gap-2">
            {actions.map((action) => (
                <Button
                    key={action.to}
                    variant={action.variant}
                    size="sm"
                    disabled={mutation.isPending || remove.isPending}
                    onClick={() => setPending(action)}
                >
                    {t(`actions.${action.labelKey}`)}
                </Button>
            ))}

            <Button
                variant="outline"
                size="sm"
                className="text-danger hover:border-danger/60 hover:text-danger"
                disabled={mutation.isPending || remove.isPending}
                onClick={() => setConfirmDelete(true)}
            >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                {t("actions.delete")}
            </Button>

            <ConfirmDialog
                open={pending !== null}
                title={t("actions.confirmTitle")}
                description={pending ? t(`actions.${pending.confirmKey}`) : ""}
                confirmLabel={pending ? t(`actions.${pending.labelKey}`) : ""}
                destructive={pending?.to === "cancelled"}
                loading={mutation.isPending}
                onConfirm={() => pending && mutation.mutate(pending.to)}
                onClose={() => setPending(null)}
            />

            <ConfirmDialog
                open={confirmDelete}
                title={t("actions.confirmDeleteTitle")}
                description={t("actions.confirmDelete")}
                confirmLabel={t("actions.delete")}
                destructive
                loading={remove.isPending}
                onConfirm={() => remove.mutate()}
                onClose={() => setConfirmDelete(false)}
            />
        </div>
    );
}
