import { useMemo } from "react";
import { useFormik } from "formik";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";
import {
    ArrowLeft,
    BadgeCheck,
    Calendar,
    FileText,
    Film,
    LogOut,
    MessageSquare,
    PenLine,
    Save,
    ThumbsUp,
    User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/common/ImageUploader";
import { FormField } from "@/components/common/FormField";
import { StatCard } from "@/components/common/StatCard";
import { useAuth, useLogout } from "@/features/auth/useAuth";
// ponytail: ngoại lệ một chiều `profile → posts` (plan C.1 chỉ cho `profile → auth`).
// Chỉ dùng cho thẻ thống kê; gỡ khi backend có endpoint thống kê hồ sơ.
import { getMyPosts } from "@/features/posts/api";
import { useProfile, useUpdateProfile } from "./useProfile";
import { DietaryPreferencesSection } from "./DietaryPreferencesSection";
import { useUiStore } from "@/shared/ui/uiStore";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import type { UpdateProfileRequest } from "@/shared/types/user";

export default function ProfilePage({ embedded = false }: { embedded?: boolean }) {
    const { t } = useTranslation(["profile", "common"]);
    const navigate = useNavigate();
    const { user } = useAuth();
    const handleLogout = useLogout();
    const language = useUiStore((state) => state.language);

    const { data: profile, isLoading } = useProfile();
    const updateMutation = useUpdateProfile();

    // ponytail: stats suy từ GET /api/posts (100 bài gần nhất) — backend chưa có endpoint thống kê.
    const { data: myPosts } = useQuery({
        queryKey: ["my-posts", "stats"],
        queryFn: () => getMyPosts({ page: 1, size: 100 }),
    });

    const posts = myPosts?.data ?? [];
    const stats = [
        { icon: FileText, labelKey: "stats.published", value: posts.filter((post) => post.status === "published").length },
        { icon: Film, labelKey: "stats.videos", value: posts.filter((post) => post.type === "video").length },
        { icon: ThumbsUp, labelKey: "stats.saved", value: 0 },
        { icon: MessageSquare, labelKey: "stats.contributions", value: posts.reduce((sum, post) => sum + post.viewCount, 0) },
    ];

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
                description: Yup.string().max(2000, t("validation:descriptionMaxLength")).nullable(),
                avatarUrl: Yup.string().url(t("validation:invalidUrl")).nullable(),
            }),
        [t],
    );

    const formik = useFormik<UpdateProfileRequest>({
        initialValues: {
            heightCm: profile?.heightCm ?? undefined,
            weightKg: profile?.weightKg ?? undefined,
            age: profile?.age ?? undefined,
            gender: profile?.gender ?? undefined,
            description: profile?.description ?? "",
            avatarUrl: profile?.avatarUrl ?? "",
        },
        enableReinitialize: true,
        validationSchema: profileSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                const payload: UpdateProfileRequest = {
                    ...values,
                    description: values.description?.trim() || undefined,
                    avatarUrl: values.avatarUrl ? values.avatarUrl.trim() || undefined : undefined,
                };
                await updateMutation.mutateAsync(payload);
                toast.success(t("success"));
            } catch (error) {
                toast.error(getApiErrorMessage(error, t("failed")));
            } finally {
                setSubmitting(false);
            }
        },
    });

    const height = Number(formik.values.heightCm) || 0;
    const weight = Number(formik.values.weightKg) || 0;
    // ponytail: tính BMI ở client từ state Formik để số đổi ngay khi gõ. Backend cũng trả
    // `bmi` nhưng chỉ đổi sau khi lưu — dùng nó sẽ tệ hơn. Gỡ khi cần BMI do server chốt.
    const bmi = height > 0 && weight > 0 ? weight / ((height / 100) * (height / 100)) : null;

    let bmiCategory = "";
    if (bmi !== null) {
        if (bmi < 18.5) bmiCategory = t("bmiCategories.underweight");
        else if (bmi < 25) bmiCategory = t("bmiCategories.normal");
        else if (bmi < 30) bmiCategory = t("bmiCategories.overweight");
        else bmiCategory = t("bmiCategories.obese");
    }

    return (
        <div className={embedded ? undefined : "min-h-screen bg-background p-4 sm:p-6 lg:p-8"}>
            <div className="mx-auto max-w-4xl space-y-6">
                {/* Trong AdminShell đã có header + logout riêng, nên bỏ thanh này. */}
                {!embedded && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Button variant="ghost" onClick={() => navigate(-1)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t("back")}
                        </Button>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" onClick={() => navigate("/my-posts")}>
                                <FileText className="mr-2 h-4 w-4" />
                                {t("myPosts")}
                            </Button>
                            <Button variant="outline" onClick={() => navigate("/posts/create")}>
                                <PenLine className="mr-2 h-4 w-4" />
                                {t("createPost")}
                            </Button>
                            <Button variant="outline" onClick={() => void handleLogout(t("common:logoutSuccess"))}>
                                <LogOut className="mr-2 h-4 w-4" />
                                {t("logout")}
                            </Button>
                        </div>
                    </div>
                )}

                <header className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-vegan-green-light text-vegan-green">
                            {profile?.avatarUrl ? (
                                <img
                                    src={profile.avatarUrl}
                                    alt={user?.username}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <User className="h-9 w-9" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-dark">
                                {user?.username}
                                <Badge variant="lightgreen" size="sm">
                                    <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                                    {t("verifiedAuthor")}
                                </Badge>
                            </h1>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {t("contributorAccount")} · {user?.email}
                            </p>
                            {profile?.description && (
                                <p className="mt-2 max-w-xl text-sm text-muted-foreground">{profile.description}</p>
                            )}
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                {t("joined", {
                                    date: formatDateLocale(profile?.updatedAt ?? new Date().toISOString(), language),
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {stats.map(({ icon, labelKey, value }) => (
                            <StatCard key={labelKey} icon={icon} label={t(labelKey)} value={value} />
                        ))}
                    </div>
                </header>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold text-dark">{t("editTitle")}</h2>

                    {isLoading ? (
                        <p className="text-sm text-muted-foreground">{t("common:loading")}</p>
                    ) : (
                        <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    label={t("fields.heightCm")}
                                    htmlFor="heightCm"
                                    error={formik.touched.heightCm ? formik.errors.heightCm : undefined}
                                >
                                    <Input
                                        id="heightCm"
                                        name="heightCm"
                                        type="number"
                                        step="0.01"
                                        value={formik.values.heightCm ?? ""}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                </FormField>

                                <FormField
                                    label={t("fields.weightKg")}
                                    htmlFor="weightKg"
                                    error={formik.touched.weightKg ? formik.errors.weightKg : undefined}
                                >
                                    <Input
                                        id="weightKg"
                                        name="weightKg"
                                        type="number"
                                        step="0.01"
                                        value={formik.values.weightKg ?? ""}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
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
                                        value={formik.values.age ?? ""}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                </FormField>

                                <FormField label={t("fields.gender")} htmlFor="gender">
                                    <Select
                                        id="gender"
                                        name="gender"
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
                                label={t("fields.avatarUrl")}
                                htmlFor="avatarUrl"
                                error={formik.touched.avatarUrl ? formik.errors.avatarUrl : undefined}
                            >
                                <ImageUploader
                                    value={formik.values.avatarUrl || null}
                                    onChange={(url) => formik.setFieldValue("avatarUrl", url)}
                                    disabled={updateMutation.isPending || formik.isSubmitting}
                                />
                            </FormField>

                            <FormField
                                label={t("fields.description")}
                                htmlFor="description"
                                error={formik.touched.description ? formik.errors.description : undefined}
                            >
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder={t("placeholders.description")}
                                    value={formik.values.description ?? ""}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    className="min-h-[120px]"
                                />
                            </FormField>

                            {bmi !== null && (
                                <div className="rounded-lg bg-vegan-green-light p-4">
                                    <p className="text-sm text-muted-foreground">
                                        {t("bmi")}: <span className="font-semibold text-dark">{bmi.toFixed(1)}</span> — {bmiCategory}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button type="submit" disabled={updateMutation.isPending || formik.isSubmitting}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {updateMutation.isPending ? t("saving") : t("save")}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Ngoài <form> hồ sơ: section này có form + nút lưu riêng. */}
                {!isLoading && <DietaryPreferencesSection profile={profile} />}
            </div>
        </div>
    );
}
