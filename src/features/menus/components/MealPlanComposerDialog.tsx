import { useCallback, useMemo, useState } from "react";
import { useFormik } from "formik";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CalendarDays, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormField";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { useUiStore } from "@/shared/ui/uiStore";
import { cn } from "@/shared/utils/cn";
import { parseISODate, toISODate, clampStartDate, minStartDateISO } from "../week";
import type { MealType } from "../types";
import { createMenu } from "../api";
import { MealPlanMatrix } from "./MealPlanMatrix";
import { DishAssignPopover, type AssignTarget } from "./DishAssignPopover";
import {
    MAX_DISH_REPEATS,
    MAX_NOTES_LENGTH,
    MIN_DISTINCT_DISHES,
    daysWithMeals,
    dishUsage,
    emptyWeek,
    mostRepeatedDish,
    moveWeek,
    setDishInDays,
    type MenuFormValues,
    type PickedDish,
} from "../create/schema";
import { validate } from "../create/validate";
import { buildCreateMenuPayload } from "../create/payload";

/**
 * Dialog tạo thực đơn tuần — mount một lần ở `Layout`, mở qua
 * `useUiStore().openMealPlanComposer(from)`.
 *
 * `key` trên `MealPlanComposer` đặt lại toàn bộ form mỗi lần mở nên không cần tự reset state.
 */
export function MealPlanComposerDialog() {
    const composer = useUiStore((state) => state.mealPlanComposer);
    const close = useUiStore((state) => state.closeMealPlanComposer);

    if (!composer) return null;

    return <MealPlanComposer key={composer.from ?? "current"} from={composer.from} onClose={close} />;
}

function MealPlanComposer({ from, onClose }: { from: string | null; onClose: () => void }) {
    const { t } = useTranslation(["menu", "common"]);
    const queryClient = useQueryClient();

    // Ngày bắt đầu do user chọn; backend chỉ đòi 7 ngày liền kề nên không snap về Thứ 2.
    // Backend từ chối ngày bắt đầu trong quá khứ → kẹp về hôm nay ngay khi mở dialog,
    // kể cả khi `from` (tuần đang xem) nằm ở quá khứ.
    const startDate = useMemo(() => {
        const requested = parseISODate(from ?? "");
        return clampStartDate(toISODate(Number.isNaN(requested.getTime()) ? new Date() : requested));
    }, [from]);

    const [target, setTarget] = useState<AssignTarget | null>(null);
    const [confirmDiscard, setConfirmDiscard] = useState(false);

    const createMutation = useMutation({
        mutationFn: (values: MenuFormValues) => createMenu(buildCreateMenuPayload(values)),
        onSuccess: () => {
            toast.success(t("menu:create.toast.created"));
            // Response chỉ có `dishId`/`dishName` — đọc lại để có `dish` đầy đủ.
            void queryClient.invalidateQueries({ queryKey: ["meal-plans"] });
            onClose();
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("menu:create.toast.failed")));
        },
    });

    const formik = useFormik<MenuFormValues>({
        initialValues: emptyWeek(startDate),
        validate: (values) => validate(values, t),
        onSubmit: (values) => createMutation.mutate(values),
    });

    const isSubmitting = createMutation.isPending;
    const { values } = formik;

    // `validate` trả key phẳng (`days.0`, `week`) — dùng chính nó để hiển thị.
    const errors = validate(values, t);
    const usage = dishUsage(values);
    const repeated = mostRepeatedDish(values);
    const filledDays = daysWithMeals(values);
    const ready = Object.keys(errors).length === 0;

    const requirements = [
        {
            key: "distinct",
            label: t("menu:create.requirements.distinct"),
            value: t("menu:create.requirements.distinctValue", { count: usage.size, min: MIN_DISTINCT_DISHES }),
            ok: usage.size >= MIN_DISTINCT_DISHES,
        },
        {
            key: "repeats",
            label: t("menu:create.requirements.repeats"),
            value: repeated
                ? t("menu:create.requirements.repeatsValue", { count: repeated.count, name: repeated.name })
                : t("menu:create.requirements.repeatsNone"),
            ok: !repeated || repeated.count <= MAX_DISH_REPEATS,
        },
        {
            key: "days",
            label: t("menu:create.requirements.days"),
            value: t("menu:create.requirements.daysValue", { count: filledDays }),
            ok: filledDays === 7,
        },
    ];

    /** Một lần setFieldValue cho cả mảng `days` — 7 lần lẻ sẽ re-render + validate 7 lần. */
    const setDays = (next: MenuFormValues) => {
        void formik.setFieldValue("days", next.days);
    };

    const applyCells = useCallback(
        (mealType: MealType, dayIndexes: number[], dish: PickedDish | null) => {
            setDays(setDishInDays(values, mealType, dayIndexes, dish));
            setTarget(null);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [values],
    );

    const handleClear = useCallback(
        (mealType: MealType, dayIndex: number) => {
            setDays(setDishInDays(values, mealType, [dayIndex], null));
            setTarget(null);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [values],
    );

    const requestClose = () => {
        if (isSubmitting) return false;
        if (formik.dirty) {
            setConfirmDiscard(true);
            return false;
        }
        return true;
    };

    const handleCancel = () => {
        if (requestClose()) onClose();
    };

    const handleWeekChange = (iso: string) => {
        const picked = parseISODate(iso);
        if (Number.isNaN(picked.getTime())) return;
        // Ngày trong quá khứ: kẹp về hôm nay và báo, đừng im lặng đổi (user sẽ tưởng lỗi).
        const clamped = clampStartDate(iso);
        if (clamped !== iso) toast.error(t("menu:create.errors.startInPast"));
        // Giữ món theo vị trí trong cửa sổ 7 ngày, chỉ đổi ngày.
        void formik.setValues(moveWeek(values, clamped));
    };

    return (
        <>
            <Dialog
                open
                onClose={handleCancel}
                onBeforeClose={requestClose}
                title={t("menu:create.title")}
                description={t("menu:create.subtitle")}
                eyebrow={
                    <span className="text-[11px] font-bold uppercase tracking-wider text-vegan-green">
                        {t("menu:create.eyebrow")}
                    </span>
                }
                className="max-h-[90vh] max-w-6xl overflow-hidden"
                padded={false}
                bodyClassName="flex max-h-[90vh] flex-col p-0"
                headerClassName="mb-0 shrink-0 border-b border-border px-6 pb-4 pt-6"
            >
                <form onSubmit={formik.handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                            <div className="min-w-0 space-y-4">
                                <div className="grid gap-4 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
                                    <FormField
                                        label={t("menu:create.weekLabel")}
                                        htmlFor="meal-plan-start"
                                        error={errors.startDate}
                                    >
                                        <Input
                                            id="meal-plan-start"
                                            type="date"
                                            min={minStartDateISO()}
                                            value={values.startDate}
                                            aria-invalid={Boolean(errors.startDate)}
                                            onChange={(event) => handleWeekChange(event.target.value)}
                                        />
                                    </FormField>
                                    <FormField
                                        label={t("menu:create.notesLabel")}
                                        htmlFor="meal-plan-notes"
                                        error={errors.notes}
                                    >
                                        <Textarea
                                            id="meal-plan-notes"
                                            className="min-h-[40px]"
                                            value={values.notes}
                                            maxLength={MAX_NOTES_LENGTH}
                                            placeholder={t("menu:create.notesPlaceholder")}
                                            aria-invalid={Boolean(errors.notes)}
                                            onChange={(event) => formik.setFieldValue("notes", event.target.value)}
                                        />
                                    </FormField>
                                </div>

                                <div className="rounded-xl border border-border p-3.5">
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        <h3 className="text-sm font-bold text-dark">{t("menu:create.mealsTitle")}</h3>
                                    </div>

                                    <MealPlanMatrix
                                        values={values}
                                        errors={errors}
                                        showDayErrors={usage.size > 0}
                                        disabled={isSubmitting}
                                        onPick={(mealType, dayIndex, anchor) => setTarget({ mealType, dayIndex, anchor })}
                                        onClear={handleClear}
                                    />

                                    {errors.week && (
                                        <p
                                            role="alert"
                                            className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-destructive"
                                        >
                                            {errors.week}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <aside className="space-y-3">
                                <div className="rounded-xl border border-border bg-vegan-green-subtle p-3.5">
                                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-vegan-green">
                                        {t("menu:create.requirements.title")}
                                    </h3>
                                    <ul className="mt-2.5 space-y-2">
                                        {requirements.map((item) => (
                                            <li
                                                key={item.key}
                                                className="flex items-start justify-between gap-2 text-[12.5px]"
                                            >
                                                <span className="text-muted-foreground">{item.label}</span>
                                                <span
                                                    className={cn(
                                                        "text-right font-semibold tabular-nums",
                                                        item.ok ? "text-vegan-green" : "text-destructive",
                                                    )}
                                                >
                                                    {item.value}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    <p
                                        className={cn(
                                            "mt-3 flex items-start gap-1.5 border-t border-vegan-green-light pt-2.5 text-[12.5px] font-semibold",
                                            ready ? "text-vegan-green" : "text-muted-foreground",
                                        )}
                                    >
                                        {ready && <Check className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />}
                                        {ready
                                            ? t("menu:create.requirements.ok")
                                            : (errors.week ?? t("menu:create.requirements.notReady"))}
                                    </p>
                                </div>

                                <p className="flex items-start gap-1.5 text-[11.5px] leading-snug text-muted-foreground">
                                    <CalendarDays className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
                                    {t("menu:create.weekHelper")}
                                </p>
                            </aside>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3.5">
                        <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                            {t("menu:create.cancel")}
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !ready}>
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                            {t("menu:create.save")}
                        </Button>
                    </div>

                    {/* Popover phải nằm trong `<dialog>` — ra ngoài là bị top-layer che.
                        `key` để state chọn món/ngày reset khi mở ô khác. */}
                    {target && (
                        <DishAssignPopover
                            key={`${target.mealType}-${target.dayIndex ?? "row"}`}
                            target={target}
                            values={values}
                            onApply={applyCells}
                            onClose={() => setTarget(null)}
                        />
                    )}
                </form>
            </Dialog>

            <ConfirmDialog
                open={confirmDiscard}
                title={t("menu:create.discard.title")}
                description={t("menu:create.discard.description")}
                confirmLabel={t("menu:create.discard.confirm")}
                destructive
                onConfirm={() => {
                    setConfirmDiscard(false);
                    onClose();
                }}
                onClose={() => setConfirmDiscard(false)}
            />
        </>
    );
}
