import { useMemo } from "react";
import { useFormik } from "formik";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Check, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { cn } from "@/shared/utils/cn";
import { createMenu } from "../../api";
import { parseISODate, startOfWeek, toISODate } from "../../week";
import { DayEditor } from "./DayEditor";
import {
    MAX_DISH_REPEATS,
    MAX_NOTES_LENGTH,
    MIN_DISTINCT_DISHES,
    daysWithMeals,
    dishUsage,
    emptyWeek,
    mostRepeatedDish,
    moveWeek,
    type MenuFormValues,
} from "./schema";
import { validate } from "./validate";
import { buildCreateMenuPayload } from "./payload";

const FORM_ID = "create-meal-plan-form";

export default function CreateMealPlanPage() {
    const { t } = useTranslation(["menu", "common"]);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();

    // Tuần lấy từ `?from=`; giá trị hỏng rơi về tuần hiện tại. Luôn chuẩn hoá về Thứ 2 —
    // `GET /api/menus/details` cũng tính tuần từ Thứ 2, lệch sẽ làm menu hiện ở tuần sai.
    const startDate = useMemo(() => {
        const requested = parseISODate(searchParams.get("from") ?? "");
        return toISODate(startOfWeek(Number.isNaN(requested.getTime()) ? new Date() : requested));
    }, [searchParams]);

    const createMutation = useMutation({
        mutationFn: (values: MenuFormValues) => createMenu(buildCreateMenuPayload(values)),
        onSuccess: (menu) => {
            toast.success(t("menu:create.toast.created"));
            // Response chỉ có `dishId`/`dishName` — đọc lại để có `dish` đầy đủ.
            void queryClient.invalidateQueries({ queryKey: ["meal-plans"] });
            navigate(`/meal-plan?from=${menu.startDate}`);
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("menu:create.toast.failed")));
        },
    });

    const formik = useFormik<MenuFormValues>({
        // KHÔNG `enableReinitialize`: đổi tuần đi qua `goToWeek` (giữ món theo vị trí trong
        // tuần). Bật reinit thì `initialValues` mới sẽ xoá sạch món user vừa chọn.
        initialValues: emptyWeek(startDate),
        validate: (values) => validate(values, t),
        onSubmit: (values) => createMutation.mutate(values),
    });

    const goToWeek = (monday: Date) => {
        formik.setValues(moveWeek(formik.values, toISODate(monday)));
        setSearchParams({ from: toISODate(monday) }, { replace: true });
    };

    const isSubmitting = createMutation.isPending;
    const { values } = formik;
    // `validate` trả key phẳng (`days.0.slots.1.servings`), không lồng theo shape của form —
    // dùng chính nó để hiển thị, khỏi phải ép type `formik.errors`.
    const errors = validate(values, t);
    const usage = dishUsage(values);
    const repeated = mostRepeatedDish(values);
    const filledDays = daysWithMeals(values);

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

    const ready = Object.keys(errors).length === 0;

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                breadcrumb={[t("menu:breadcrumb"), t("menu:create.breadcrumb")]}
                title={t("menu:create.title")}
                description={t("menu:create.subtitle")}
                action={
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => navigate(`/meal-plan?from=${startDate}`)} disabled={isSubmitting}>
                            {t("menu:create.cancel")}
                        </Button>
                        <Button type="submit" form={FORM_ID} disabled={isSubmitting || !ready}>
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Plus className="h-4 w-4" aria-hidden="true" />
                            )}
                            {t("menu:create.save")}
                        </Button>
                    </div>
                }
            />

            <form id={FORM_ID} onSubmit={formik.handleSubmit} noValidate>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-5">
                        <SectionCard title={t("menu:create.weekLabel")}>
                            <div className="space-y-4">
                                <FormField
                                    label={t("menu:create.weekLabel")}
                                    htmlFor="meal-plan-start"
                                    helper={t("menu:create.weekHelper")}
                                >
                                    <Input
                                        id="meal-plan-start"
                                        type="date"
                                        value={values.startDate}
                                        onChange={(event) => {
                                            const picked = parseISODate(event.target.value);
                                            if (Number.isNaN(picked.getTime())) return;
                                            goToWeek(startOfWeek(picked));
                                        }}
                                    />
                                </FormField>

                                <FormField
                                    label={t("menu:create.notesLabel")}
                                    htmlFor="meal-plan-notes"
                                    error={errors.notes}
                                    aside={
                                        <span className="text-xs tabular-nums text-muted-foreground">
                                            {t("menu:create.notesCounter", {
                                                count: values.notes.length,
                                                max: MAX_NOTES_LENGTH,
                                            })}
                                        </span>
                                    }
                                >
                                    <Textarea
                                        id="meal-plan-notes"
                                        className="min-h-[80px]"
                                        value={values.notes}
                                        placeholder={t("menu:create.notesPlaceholder")}
                                        aria-invalid={Boolean(errors.notes)}
                                        onChange={(event) => formik.setFieldValue("notes", event.target.value)}
                                    />
                                </FormField>
                            </div>
                        </SectionCard>

                        <SectionCard title={t("menu:create.mealsTitle")}>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {values.days.map((day, index) => (
                                    <DayEditor
                                        key={day.date}
                                        day={day}
                                        index={index}
                                        errors={errors}
                                        disabled={isSubmitting}
                                        // Form vừa mở mà 7 dòng đỏ "thêm ít nhất một bữa" là doạ
                                        // user — chỉ nhắc sau khi họ đã chọn ít nhất một món.
                                        showEmptyError={usage.size > 0}
                                        onChange={(slots) => formik.setFieldValue(`days.${index}.slots`, slots)}
                                    />
                                ))}
                            </div>
                        </SectionCard>
                    </div>

                    <aside className="lg:sticky lg:top-6 lg:self-start">
                        <SectionCard title={t("menu:create.requirements.title")}>
                            <ul className="space-y-2.5">
                                {requirements.map((item) => (
                                    <li key={item.key} className="flex items-start justify-between gap-3 text-sm">
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
                                    "mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm font-semibold",
                                    ready ? "text-vegan-green" : "text-muted-foreground",
                                )}
                            >
                                {ready && <Check className="h-4 w-4" aria-hidden="true" />}
                                {/* Lỗi cấp tuần (luật 6/7); lỗi từng ô hiện ngay tại ô. */}
                                {ready ? t("menu:create.requirements.ok") : (errors.week ?? "")}
                            </p>
                        </SectionCard>
                    </aside>
                </div>
            </form>
        </div>
    );
}
