import { useMemo, useState } from "react";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as Yup from "yup";
import { BadgeCheck, Calendar, Plus, Save, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/common/ImageUploader";
import { FormField } from "@/components/common/FormField";
import { SectionCard } from "@/components/common/SectionCard";
import { useAuth } from "@/features/auth/useAuth";
import { useProfile, useUpdateProfile } from "./useProfile";
import { TagInput } from "./TagInput";
import { useUiStore } from "@/shared/ui/uiStore";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { cn } from "@/shared/utils/cn";
import type { UpdateProfileRequest } from "@/shared/types/user";
import {
    DIETARY_LIST_KEYS,
    DIETARY_SUGGESTIONS,
    DIETARY_TONE,
    GOAL_SUGGESTIONS,
    MAX_DIETARY_ITEMS,
    MAX_DIETARY_ITEM_LENGTH,
    MAX_HEALTH_GOAL_LENGTH,
    normalizeTags,
    toDietaryValues,
    type DietaryListKey,
    type DietaryValues,
} from "./dietary";

/** Form gộp: hồ sơ cơ thể + hồ sơ dinh dưỡng gửi chung một `PUT /api/profile`. */
type FormValues = UpdateProfileRequest & DietaryValues;

const MAX_DESCRIPTION_LENGTH = 2000;

/** Thang BMI 15–40 trải hết chiều dài thanh dải. */
const BMI_MIN = 15;
const BMI_MAX = 40;

const BMI_TONE = {
    underweight: { chip: "bg-amber-soft text-amber-strong", zone: "bg-amber-soft", text: "text-amber-strong" },
    normal: { chip: "bg-vegan-green-light text-vegan-green", zone: "bg-vegan-green", text: "text-vegan-green" },
    overweight: { chip: "bg-amber-soft text-amber-strong", zone: "bg-amber-strong", text: "text-amber-strong" },
    obese: { chip: "bg-danger-soft text-danger", zone: "bg-danger", text: "text-danger" },
} as const;

type BmiCategory = keyof typeof BMI_TONE;

/**
 * Thang 4 vùng, độ rộng theo đúng khoảng BMI thật trên trục 15–40.
 * `flex` ở đây là tỉ lệ phần trăm, không phải class Tailwind (14+26+20+40 = 100).
 */
const BMI_ZONES: { key: BmiCategory; labelKey: string; flex: number }[] = [
    { key: "underweight", labelKey: "bmiCategories.underweight", flex: 14 },
    { key: "normal", labelKey: "bmiCategories.normal", flex: 26 },
    { key: "overweight", labelKey: "bmiCategories.overweight", flex: 20 },
    { key: "obese", labelKey: "bmiCategories.obese", flex: 40 },
];

/** Ô số của Formik trả chuỗi khi gõ; `""` phải thành `undefined`, không gửi lên backend. */
function toNumber(value: unknown): number | undefined {
    if (value === "" || value === null || value === undefined) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export default function ProfilePage() {
    const { t } = useTranslation(["profile", "common"]);
    const { user } = useAuth();
    const language = useUiStore((state) => state.language);
    const [avatarOpen, setAvatarOpen] = useState(false);

    const { data: profile, isLoading } = useProfile();
    const updateMutation = useUpdateProfile();

    const profileSchema = useMemo(
        () =>
            Yup.object({
                heightCm: Yup.number()
                    .min(0.01, t("validation:heightRange"))
                    .max(300, t("validation:heightRange"))
                    .nullable(),
                weightKg: Yup.number()
                    .min(0.01, t("validation:weightRange"))
                    .max(500, t("validation:weightRange"))
                    .nullable(),
                age: Yup.number().min(1, t("validation:ageRange")).max(150, t("validation:ageRange")).nullable(),
                gender: Yup.string().oneOf(["male", "female", "other"]).nullable(),
                description: Yup.string().max(MAX_DESCRIPTION_LENGTH, t("validation:descriptionMaxLength")).nullable(),
                avatarUrl: Yup.string().url(t("validation:invalidUrl")).nullable(),
            }),
        [t],
    );

    const formik = useFormik<FormValues>({
        initialValues: {
            heightCm: profile?.heightCm ?? undefined,
            weightKg: profile?.weightKg ?? undefined,
            age: profile?.age ?? undefined,
            gender: profile?.gender ?? undefined,
            description: profile?.description ?? "",
            avatarUrl: profile?.avatarUrl ?? "",
            ...toDietaryValues(profile),
        },
        enableReinitialize: true,
        validationSchema: profileSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                await updateMutation.mutateAsync({
                    heightCm: toNumber(values.heightCm),
                    weightKg: toNumber(values.weightKg),
                    age: toNumber(values.age),
                    gender: values.gender ?? undefined,
                    description: (values.description ?? "").trim() || undefined,
                    avatarUrl: (values.avatarUrl ?? "").trim() || undefined,
                    // Gửi cả 4 mảng đã chuẩn hoá; `[]` xoá sạch bên backend.
                    preferences: normalizeTags(values.preferences),
                    dislikes: normalizeTags(values.dislikes),
                    allergies: normalizeTags(values.allergies),
                    restrictions: normalizeTags(values.restrictions),
                    healthGoal: values.healthGoal.trim(),
                });
                toast.success(t("success"));
            } catch (error) {
                toast.error(getApiErrorMessage(error, t("failed")));
            } finally {
                setSubmitting(false);
            }
        },
    });

    const saving = updateMutation.isPending || formik.isSubmitting;
    const busy = saving || isLoading;

    const changedCount = (Object.keys(formik.initialValues) as (keyof FormValues)[]).filter(
        (key) => JSON.stringify(formik.values[key]) !== JSON.stringify(formik.initialValues[key]),
    ).length;

    const height = toNumber(formik.values.heightCm) ?? 0;
    const weight = toNumber(formik.values.weightKg) ?? 0;
    // ponytail: tính BMI ở client từ state Formik để số đổi ngay khi gõ. Backend cũng trả
    // `bmi` nhưng chỉ đổi sau khi lưu — dùng nó sẽ tệ hơn. Gỡ khi cần BMI do server chốt.
    const bmi = height > 0 && weight > 0 ? weight / ((height / 100) * (height / 100)) : null;

    let bmiCategory: BmiCategory | null = null;
    if (bmi !== null) {
        if (bmi < 18.5) bmiCategory = "underweight";
        else if (bmi < 25) bmiCategory = "normal";
        else if (bmi < 30) bmiCategory = "overweight";
        else bmiCategory = "obese";
    }
    const tone = BMI_TONE[bmiCategory ?? "normal"];
    const bmiPercent = bmi === null ? 0 : Math.min(100, Math.max(0, ((bmi - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100));

    const setTags = (key: DietaryListKey) => (next: string[]) => void formik.setFieldValue(key, next);

    const metrics: { label: string; value: string; unit?: string }[] = [
        { label: t("metrics.height"), value: height > 0 ? String(height) : "—", unit: height > 0 ? "cm" : undefined },
        { label: t("metrics.weight"), value: weight > 0 ? String(weight) : "—", unit: weight > 0 ? "kg" : undefined },
        { label: t("metrics.age"), value: toNumber(formik.values.age)?.toString() ?? "—" },
        {
            label: t("metrics.gender"),
            value: formik.values.gender ? t(`genderOptions.${formik.values.gender}`) : "—",
        },
    ];

    return (
        <>
            <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
                    {/* ---------- rail: danh tính + số đo gộp 1 card ---------- */}
                    <aside className="flex flex-col gap-3.5 lg:sticky lg:top-20">
                        <div className="overflow-hidden rounded-2xl border border-border bg-card">
                            {/* Dải xanh nhạt neo mắt — thay cover photo mà API không trả. */}
                            <div className="h-16 border-b border-vegan-green-light bg-vegan-green-subtle" />

                            <div className="-mt-11 px-5 pb-4 text-center">
                                <div className="relative mx-auto h-[88px] w-[88px]">
                                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-vegan-green-light font-display text-3xl font-bold text-vegan-green ring-4 ring-card">
                                        {formik.values.avatarUrl ? (
                                            <img
                                                src={formik.values.avatarUrl}
                                                alt={user?.username ?? ""}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            (user?.username ?? "").charAt(0).toUpperCase() || (
                                                <User className="h-9 w-9" aria-hidden="true" />
                                            )
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setAvatarOpen(true)}
                                        disabled={isLoading}
                                        aria-label={t("changeAvatar")}
                                        className="absolute -bottom-px -right-px flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-card bg-vegan-green text-white transition-colors hover:bg-vegan-green-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green focus-visible:ring-offset-2 disabled:opacity-50"
                                    >
                                        <Plus className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                </div>

                                <h1 className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xl font-bold text-dark">
                                    {user?.username}
                                    <Badge variant="lightgreen" size="sm">
                                        <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                                        {t("verifiedAuthor")}
                                    </Badge>
                                </h1>
                                <p className="mt-0.5 break-all text-sm text-muted-foreground">{user?.email}</p>
                                {profile?.updatedAt && (
                                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                        {t("lastUpdated", {
                                            date: formatDateLocale(profile.updatedAt, language),
                                        })}
                                    </p>
                                )}
                            </div>

                            <div className="border-t border-border" />

                            <div className="px-5 py-4">
                                <div className="flex items-end justify-between gap-2">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            {t("bmi")}
                                        </p>
                                        <p
                                            className={cn(
                                                "font-display text-3xl font-bold leading-none tracking-tight",
                                                bmi === null ? "text-muted-foreground" : tone.text,
                                            )}
                                        >
                                            {bmi === null ? "—" : bmi.toFixed(1)}
                                        </p>
                                    </div>
                                    {bmiCategory && (
                                        <span
                                            className={cn(
                                                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                                                tone.chip,
                                            )}
                                        >
                                            {t(`bmiCategories.${bmiCategory}`)}
                                        </span>
                                    )}
                                </div>

                                {/* Thang 4 vùng: màu phẳng, rộng theo đúng khoảng BMI. */}
                                <div className="relative mt-3" aria-hidden="true">
                                    <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
                                        {BMI_ZONES.map((zone) => (
                                            <i
                                                key={zone.key}
                                                className={cn(
                                                    "block h-full transition-opacity",
                                                    BMI_TONE[zone.key].zone,
                                                    zone.key === bmiCategory ? "opacity-100" : "opacity-25",
                                                )}
                                                style={{ flex: zone.flex }}
                                            />
                                        ))}
                                    </div>
                                    {bmi !== null && (
                                        <span
                                            className="absolute top-1/2 h-[15px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-dark shadow-[0_0_0_2px_var(--color-card)]"
                                            style={{ left: `${bmiPercent}%` }}
                                        />
                                    )}
                                </div>

                                {bmiCategory ? (
                                    <div className="mt-1.5 flex gap-0.5 text-[9.5px] font-semibold text-muted-foreground">
                                        {BMI_ZONES.map((zone) => (
                                            <span
                                                key={zone.key}
                                                className={cn(
                                                    "text-center leading-tight",
                                                    zone.key === bmiCategory && "font-extrabold text-dark",
                                                )}
                                                style={{ flex: zone.flex }}
                                            >
                                                {t(zone.labelKey)}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-1.5 text-[9.5px] font-semibold text-muted-foreground">
                                        {t("bmiHint")}
                                    </p>
                                )}

                                <dl className="mt-4">
                                    {metrics.map(({ label, value, unit }) => (
                                        <div
                                            key={label}
                                            className="flex items-baseline justify-between gap-2 border-t border-border py-2 first:border-t-0"
                                        >
                                            <dt className="text-xs text-muted-foreground">{label}</dt>
                                            <dd
                                                className={cn(
                                                    "text-sm font-semibold tabular-nums",
                                                    value === "—" ? "text-muted-foreground" : "text-dark",
                                                )}
                                            >
                                                {value}
                                                {unit && (
                                                    <span className="ml-0.5 text-[11px] font-medium text-muted-foreground">
                                                        {unit}
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        </div>
                    </aside>

                    {/* ---------- form gộp ---------- */}
                    <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
                        <SectionCard
                            eyebrow={t("basics.eyebrow")}
                            title={t("basics.title")}
                            subtitle={t("basics.subtitle")}
                            divided
                        >
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <FormField
                                        label={t("fields.heightCm")}
                                        htmlFor="heightCm"
                                        error={formik.touched.heightCm ? formik.errors.heightCm : undefined}
                                    >
                                        <div className="relative">
                                            <Input
                                                id="heightCm"
                                                name="heightCm"
                                                type="number"
                                                step="0.01"
                                                disabled={busy}
                                                value={formik.values.heightCm ?? ""}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                className="pr-11 tabular-nums"
                                            />
                                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">
                                                cm
                                            </span>
                                        </div>
                                    </FormField>

                                    <FormField
                                        label={t("fields.weightKg")}
                                        htmlFor="weightKg"
                                        error={formik.touched.weightKg ? formik.errors.weightKg : undefined}
                                    >
                                        <div className="relative">
                                            <Input
                                                id="weightKg"
                                                name="weightKg"
                                                type="number"
                                                step="0.01"
                                                disabled={busy}
                                                value={formik.values.weightKg ?? ""}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                className="pr-11 tabular-nums"
                                            />
                                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">
                                                kg
                                            </span>
                                        </div>
                                    </FormField>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <FormField
                                        label={t("fields.age")}
                                        htmlFor="age"
                                        error={formik.touched.age ? formik.errors.age : undefined}
                                    >
                                        <Input
                                            id="age"
                                            name="age"
                                            type="number"
                                            disabled={busy}
                                            value={formik.values.age ?? ""}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                        />
                                    </FormField>

                                    <FormField label={t("fields.gender")} htmlFor="gender">
                                        <Select
                                            id="gender"
                                            name="gender"
                                            disabled={busy}
                                            value={formik.values.gender ?? ""}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                        >
                                            <option value="">{t("genderOptions.placeholder")}</option>
                                            <option value="male">{t("genderOptions.male")}</option>
                                            <option value="female">{t("genderOptions.female")}</option>
                                            <option value="other">{t("genderOptions.other")}</option>
                                        </Select>
                                    </FormField>
                                </div>

                                <FormField
                                    label={t("fields.description")}
                                    htmlFor="description"
                                    error={formik.touched.description ? formik.errors.description : undefined}
                                    aside={
                                        <span className="text-xs tabular-nums text-muted-foreground">
                                            {(formik.values.description ?? "").length} / {MAX_DESCRIPTION_LENGTH}
                                        </span>
                                    }
                                >
                                    <Textarea
                                        id="description"
                                        name="description"
                                        placeholder={t("placeholders.description")}
                                        disabled={busy}
                                        value={formik.values.description ?? ""}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className="min-h-[110px]"
                                    />
                                </FormField>
                            </div>
                        </SectionCard>

                        <SectionCard
                            eyebrow={t("dietary.eyebrow")}
                            title={t("dietary.title")}
                            subtitle={t("dietary.subtitle")}
                            footnote={t("dietary.footnote")}
                            divided
                        >
                            <div className="space-y-5">
                                {DIETARY_LIST_KEYS.map((key) => (
                                    <FormField
                                        key={key}
                                        label={t(`dietary.${key}.label`)}
                                        htmlFor={`dietary-${key}`}
                                        helper={t(`dietary.${key}.hint`)}
                                    >
                                        <TagInput
                                            id={`dietary-${key}`}
                                            label={t(`dietary.${key}.label`)}
                                            value={formik.values[key]}
                                            onChange={setTags(key)}
                                            placeholder={t(`dietary.${key}.placeholder`)}
                                            suggestions={DIETARY_SUGGESTIONS[key]}
                                            maxItems={MAX_DIETARY_ITEMS}
                                            maxLength={MAX_DIETARY_ITEM_LENGTH}
                                            tone={DIETARY_TONE[key]}
                                            disabled={busy}
                                        />
                                    </FormField>
                                ))}

                                <FormField
                                    label={t("dietary.healthGoal.label")}
                                    htmlFor="dietary-healthGoal"
                                    helper={t("dietary.healthGoal.hint")}
                                    aside={
                                        <span className="text-xs tabular-nums text-muted-foreground">
                                            {(formik.values.healthGoal ?? "").trim().length} /{" "}
                                            {MAX_HEALTH_GOAL_LENGTH}
                                        </span>
                                    }
                                >
                                    <Textarea
                                        id="dietary-healthGoal"
                                        name="healthGoal"
                                        className="min-h-[80px]"
                                        disabled={busy}
                                        value={formik.values.healthGoal ?? ""}
                                        placeholder={t("dietary.healthGoal.placeholder")}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                </FormField>

                                <div className="flex flex-wrap gap-1.5">
                                    {GOAL_SUGGESTIONS.map((goal) => (
                                        <button
                                            key={goal}
                                            type="button"
                                            disabled={busy}
                                            onClick={() => void formik.setFieldValue("healthGoal", goal)}
                                            className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-vegan-green hover:text-vegan-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green disabled:pointer-events-none disabled:opacity-50"
                                        >
                                            {goal}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </SectionCard>

                        {formik.dirty && (
                            <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-dark px-3 py-2.5 pl-4 text-white shadow-lg">
                                <span className="flex items-center gap-2 text-sm text-white/80">
                                    <span
                                        className="h-1.5 w-1.5 rounded-full bg-vegan-green-muted shadow-[0_0_0_3px_rgba(176,211,189,0.18)]"
                                        aria-hidden="true"
                                    />
                                    <span>
                                        {t("unsavedChanges", { count: changedCount })}
                                    </span>
                                </span>
                                <div className="flex flex-none items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-white hover:bg-white/10"
                                        disabled={saving}
                                        onClick={formik.handleReset}
                                    >
                                        {t("dietary.cancel")}
                                    </Button>
                                    <Button type="submit" size="sm" disabled={saving}>
                                        <Save className="h-4 w-4" aria-hidden="true" />
                                        {saving ? t("saving") : t("save")}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
            </div>

            <Dialog open={avatarOpen} onClose={() => setAvatarOpen(false)} title={t("avatarDialogTitle")}>
                <ImageUploader
                    value={formik.values.avatarUrl || null}
                    onChange={(url) => {
                        void formik.setFieldValue("avatarUrl", url ?? "");
                        setAvatarOpen(false);
                    }}
                    disabled={saving}
                />
            </Dialog>
        </>
    );
}
