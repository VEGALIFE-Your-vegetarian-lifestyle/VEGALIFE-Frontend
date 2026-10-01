import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";
import { ArrowLeft, LogOut, PenLine, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/shared/components/FormField";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/authService";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import type { UpdateProfileRequest } from "@/types/user";

export default function ProfilePage() {
    const { t } = useTranslation("profile");
    const navigate = useNavigate();
    const { user, clearAuth } = useAuth();

    const { data: profile, isLoading } = useProfile();
    const updateMutation = useUpdateProfile();

    const profileSchema = Yup.object({
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
    });

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
                await updateMutation.mutateAsync(values);
                toast.success(t("success"));
            } catch (error) {
                const axiosError = error as { response?: { data?: { message?: string } } };
                const message = axiosError.response?.data?.message || t("failed");
                toast.error(message);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleLogout = async () => {
        clearAuth();
        try {
            await logout();
            toast.success(t("common:logout"));
        } catch {
            // 401 means token already expired/revoked; logout still effective
        }
        navigate("/", { replace: true });
    };

    const height = Number(formik.values.heightCm) || 0;
    const weight = Number(formik.values.weightKg) || 0;
    const bmi = height > 0 && weight > 0 ? weight / ((height / 100) * (height / 100)) : null;

    let bmiCategory = "";
    if (bmi !== null) {
        if (bmi < 18.5) bmiCategory = t("bmiCategories.underweight");
        else if (bmi < 25) bmiCategory = t("bmiCategories.normal");
        else if (bmi < 30) bmiCategory = t("bmiCategories.overweight");
        else bmiCategory = t("bmiCategories.obese");
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-3xl">
                <div className="mb-6 flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t("back")}
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => navigate("/posts/create")}>
                            <PenLine className="mr-2 h-4 w-4" />
                            {t("createPost")}
                        </Button>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            {t("logout")}
                        </Button>
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-vegan-green-light text-vegan-green">
                            {profile?.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={user?.username} className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <User className="h-8 w-8" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-dark">{user?.username}</h1>
                            <p className="text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>
                </div>

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
                                <Input
                                    id="avatarUrl"
                                    name="avatarUrl"
                                    type="url"
                                    placeholder={t("placeholders.avatarUrl")}
                                    value={formik.values.avatarUrl ?? ""}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
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
            </div>
        </div>
    );
}
