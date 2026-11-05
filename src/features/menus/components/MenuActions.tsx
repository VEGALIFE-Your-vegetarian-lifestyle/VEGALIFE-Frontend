import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { changeMenuStatus } from "../api";
import type { MenuDetail, MenuStatus } from "../types";

interface NextAction {
    to: MenuStatus;
    labelKey: "schedule" | "complete" | "cancelMenu";
    variant: "primary" | "outline";
    confirmKey: "confirmSchedule" | "confirmComplete" | "confirmCancel";
}

/**
 * Bảng chuyển BR-MENU-007: `drafted → scheduled|cancelled`, `scheduled → cancelled|completed`,
 * hai trạng thái cuối là hết. Chỉ render hành động hợp lệ thay vì render rồi disable.
 */
const NEXT_ACTIONS: Record<MenuStatus, NextAction[]> = {
    drafted: [
        { to: "scheduled", labelKey: "schedule", variant: "primary", confirmKey: "confirmSchedule" },
        { to: "cancelled", labelKey: "cancelMenu", variant: "outline", confirmKey: "confirmCancel" },
    ],
    scheduled: [
        { to: "completed", labelKey: "complete", variant: "primary", confirmKey: "confirmComplete" },
        { to: "cancelled", labelKey: "cancelMenu", variant: "outline", confirmKey: "confirmCancel" },
    ],
    cancelled: [],
    completed: [],
};

/** Nút đổi trạng thái của một menu. Không có nút nào khi menu đã ở trạng thái kết thúc. */
export function MenuActions({ menu }: { menu: MenuDetail }) {
    const { t } = useTranslation("menu");
    const queryClient = useQueryClient();
    const [pending, setPending] = useState<NextAction | null>(null);

    const mutation = useMutation({
        mutationFn: (status: MenuStatus) => changeMenuStatus(menu.id, status),
        onSuccess: () => {
            toast.success(t("actions.updated"));
            setPending(null);
            // Response thiếu `dish` đầy đủ — đọc lại qua `GET /api/menus/details`.
            void queryClient.invalidateQueries({ queryKey: ["meal-plans"] });
        },
        // 409 overlap / 409 transition — backend nêu rõ lý do, hiện nguyên văn.
        onError: (error: unknown) => toast.error(getApiErrorMessage(error, t("actions.failed"))),
    });

    const actions = NEXT_ACTIONS[menu.status];
    if (actions.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {actions.map((action) => (
                <Button
                    key={action.to}
                    variant={action.variant}
                    size="sm"
                    disabled={mutation.isPending}
                    onClick={() => setPending(action)}
                >
                    {t(`actions.${action.labelKey}`)}
                </Button>
            ))}

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
        </div>
    );
}
