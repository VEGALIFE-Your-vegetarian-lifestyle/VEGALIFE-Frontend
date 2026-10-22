import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CalendarDays, Plus, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { ErrorState } from "@/shared/components/ErrorState";
import { useCreateMenu, useMenuDetails, useUpdateMenu } from "@/hooks/useMenus";
import { getApiErrorMessage } from "@/utils/apiError";
import type { Dish } from "@/types/dish";
import type { MealType, MenuDetail } from "@/types/menu";
import { DishPickerDialog } from "./DishPickerDialog";
import {
    MAX_DISH_USES,
    MEAL_TYPES,
    MIN_DISTINCT_DISHES,
    buildDays,
    detailToSlots,
    dishUsage,
    formatDayLabel,
    isMonday,
    readSlot,
    slotKey,
    validateWeek,
    weekDates,
    weekStartOf,
    type DraftSlots,
} from "./payload";

interface MenuFormPageProps {
    /** Có `menuId` = chế độ sửa (#63); không có = tạo mới (#62). */
    menuId?: string;
}

/**
 * Tạo/sửa thực đơn tuần. Chỉ gửi đúng field của #62/#63 — không có
 * `dietaryPreferences` (đã gỡ ở PR #145, dietary nằm ở `PUT /api/profile`).
 */
export default function MenuFormPage({ menuId: menuIdProp }: MenuFormPageProps) {
    const params = useParams<{ menuId?: string }>();
    const menuId = menuIdProp ?? params.menuId;
    const detail = useMenuDetails(menuId ?? null);

    if (menuId && detail.isLoading) {
        return (
            <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        );
    }

    // `menuId` không tồn tại (hoặc của user khác) → #61 trả mảng rỗng, không phải lỗi.
    if (menuId && (detail.isError || !detail.data)) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-8">
                <ErrorState onRetry={() => void detail.refetch()} />
            </div>
        );
    }

    // `key` buộc remount khi detail đổi, nên form tự nhận giá trị khởi tạo mà
    // không cần đồng bộ state bằng useEffect (react-hooks/set-state-in-effect).
    return <MenuForm key={detail.data?.updatedAt ?? "new"} menuId={menuId} initial={detail.data ?? undefined} />;
}

interface MenuFormProps {
    menuId?: string;
    initial?: MenuDetail;
}

function MenuForm({ menuId, initial }: MenuFormProps) {
    const { t, i18n } = useTranslation("mealPlan");
    const navigate = useNavigate();
    const isEditing = !!menuId;

    const createMutation = useCreateMenu();
    const updateMutation = useUpdateMenu(menuId ?? "");
    const mutation = isEditing ? updateMutation : createMutation;

    const [startDate, setStartDate] = useState(() => initial?.startDate ?? weekStartOf());
    const [notes, setNotes] = useState(initial?.notes ?? "");
    const [slots, setSlots] = useState<DraftSlots>(() => (initial ? detailToSlots(initial) : {}));
    const [errors, setErrors] = useState<string[]>([]);
    const [picker, setPicker] = useState<{ date: string; mealType: MealType } | null>(null);

    const dates = useMemo(() => weekDates(startDate), [startDate]);
    const usage = useMemo(() => dishUsage(slots), [slots]);
    const distinctCount = usage.size;

    const setSlot = (date: string, mealType: MealType, dish: Dish | null) => {
        setSlots((prev) => {
            const next = { ...prev };
            const key = slotKey(date, mealType);
            if (dish) next[key] = { dishId: dish.id, dishName: dish.name, servings: 1 };
            else delete next[key];
            return next;
        });
        setErrors([]);
    };

    const handleSubmit = () => {
        const problems = validateWeek(dates, slots);
        if (!isEditing && !isMonday(startDate)) problems.unshift("startDate");
        setErrors(problems);
        if (problems.length > 0) return;

        const days = buildDays(dates, slots);
        const trimmedNotes = notes.trim();
        const onError = (error: unknown) => toast.error(getApiErrorMessage(error, t("form.saveFailed")));

        if (isEditing) {
            updateMutation.mutate(
                { days, ...(trimmedNotes ? { notes: trimmedNotes } : {}) },
                {
                    onSuccess: () => {
                        toast.success(t("form.updateSuccess"));
                        navigate("/meal-plan");
                    },
                    onError,
                },
            );
            return;
        }

        createMutation.mutate(
            { startDate, days, ...(trimmedNotes ? { notes: trimmedNotes } : {}) },
            {
                onSuccess: () => {
                    toast.success(t("form.createSuccess"));
                    navigate("/meal-plan");
                },
                onError,
            },
        );
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                breadcrumb={[t("title"), isEditing ? t("form.editTitle") : t("form.createTitle")]}
                title={isEditing ? t("form.editTitle") : t("form.createTitle")}
                description={t("form.description")}
                action={
                    <Button variant="ghost" onClick={() => navigate("/meal-plan")}>
                        <X className="h-4 w-4" aria-hidden="true" />
                        {t("common:cancel")}
                    </Button>
                }
            />

            <div className="space-y-5">
                <SectionCard eyebrow={t("form.weekEyebrow")} title={t("form.weekTitle")}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-dark">
                                {t("form.startDate")}
                                <span className="text-destructive"> *</span>
                            </span>
                            <Input
                                type="date"
                                value={startDate}
                                // Tuần là đơn vị cố định của thực đơn — #63 không nhận startDate.
                                disabled={isEditing}
                                onChange={(event) => {
                                    setStartDate(event.target.value);
                                    setErrors([]);
                                }}
                            />
                            <span className="mt-1 block text-xs text-muted-foreground">{t("form.startDateHint")}</span>
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-dark">{t("form.notes")}</span>
                            <Textarea
                                rows={2}
                                className="min-h-0"
                                value={notes}
                                maxLength={500}
                                onChange={(event) => setNotes(event.target.value)}
                                placeholder={t("form.notesPlaceholder")}
                            />
                        </label>
                    </div>

                    {errors.includes("startDate") && (
                        <p role="alert" className="mt-2 text-sm text-destructive">
                            {t("form.errors.startDate")}
                        </p>
                    )}
                </SectionCard>

                <SectionCard
                    eyebrow={t("form.mealsEyebrow")}
                    title={t("form.mealsTitle")}
                    aside={
                        <Badge variant={distinctCount >= MIN_DISTINCT_DISHES ? "lightgreen" : "outline"} size="sm">
                            {t("form.distinctDishes", { n: distinctCount, min: MIN_DISTINCT_DISHES })}
                        </Badge>
                    }
                    footnote={t("form.rulesHint", { max: MAX_DISH_USES, min: MIN_DISTINCT_DISHES })}
                >
                    <div className="space-y-3">
                        {dates.map((date) => (
                            <div key={date} className="rounded-xl border border-border p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                                    <span className="text-sm font-bold text-dark">{formatDayLabel(date, i18n.language)}</span>
                                    {errors.includes(`emptyDay:${date}`) && (
                                        <span className="text-xs text-destructive">{t("form.errors.emptyDay")}</span>
                                    )}
                                </div>

                                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                    {MEAL_TYPES.map((mealType) => {
                                        const slot = readSlot(slots, date, mealType);
                                        const used = slot ? (usage.get(slot.dishId) ?? 0) : 0;

                                        return (
                                            <div key={mealType} className="rounded-lg bg-muted-bg p-2">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                                    {t(`mealType.${mealType}`)}
                                                </p>

                                                {slot ? (
                                                    <>
                                                        <p className="mt-1 truncate text-sm font-semibold text-dark" title={slot.dishName}>
                                                            {slot.dishName}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-1.5">
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                max={99}
                                                                value={slot.servings}
                                                                aria-label={t("form.servingsLabel")}
                                                                className="h-8 w-16 px-2 py-1 text-xs"
                                                                onChange={(event) => {
                                                                    const servings = Number(event.target.value);
                                                                    setSlots((prev) => ({
                                                                        ...prev,
                                                                        [slotKey(date, mealType)]: {
                                                                            ...prev[slotKey(date, mealType)],
                                                                            servings,
                                                                        },
                                                                    }));
                                                                    setErrors([]);
                                                                }}
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="iconSm"
                                                                aria-label={t("form.removeMeal")}
                                                                onClick={() => setSlot(date, mealType, null)}
                                                            >
                                                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                                                            </Button>
                                                        </div>
                                                        {used > MAX_DISH_USES && (
                                                            <p className="mt-1 text-[10px] text-amber-strong">
                                                                {t("form.dishOverused", { n: used, max: MAX_DISH_USES })}
                                                            </p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-1 w-full"
                                                        onClick={() => setPicker({ date, mealType })}
                                                    >
                                                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                                                        {t("form.addMeal")}
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {errors.some((error) => error.startsWith("servings:")) && (
                        <p role="alert" className="mt-3 text-sm text-destructive">
                            {t("form.errors.servings")}
                        </p>
                    )}
                    {errors.includes("days") && (
                        <p role="alert" className="mt-3 text-sm text-destructive">
                            {t("form.errors.days")}
                        </p>
                    )}
                </SectionCard>

                <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="outline" onClick={() => navigate("/meal-plan")}>
                        {t("common:cancel")}
                    </Button>
                    <Button onClick={handleSubmit} disabled={mutation.isPending}>
                        <Save className="h-4 w-4" aria-hidden="true" />
                        {mutation.isPending ? t("form.saving") : t("form.save")}
                    </Button>
                </div>
            </div>

            <DishPickerDialog
                open={!!picker}
                title={picker ? t(`mealType.${picker.mealType}`) : ""}
                onClose={() => setPicker(null)}
                onPick={(dish) => {
                    if (picker) setSlot(picker.date, picker.mealType, dish);
                    setPicker(null);
                }}
            />
        </div>
    );
}
