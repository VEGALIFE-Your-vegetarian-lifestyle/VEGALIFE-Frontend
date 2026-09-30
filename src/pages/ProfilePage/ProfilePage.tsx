import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";
import { ArrowLeft, LogOut, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/shared/components/FormField";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/authService";
import { updateProfile } from "@/services/profileService";
import type { UpdateProfileRequest } from "@/types/user";

const profileSchema = Yup.object({
    heightCm: Yup.number()
        .min(0.01, "Chiều cao phải lớn hơn 0")
        .max(300, "Chiều cao tối đa 300 cm")
        .nullable(),
    weightKg: Yup.number()
        .min(0.01, "Cân nặng phải lớn hơn 0")
        .max(500, "Cân nặng tối đa 500 kg")
        .nullable(),
    age: Yup.number().min(1, "Tuổi tối thiểu 1").max(150, "Tuổi tối đa 150").nullable(),
    gender: Yup.string().oneOf(["male", "female", "other"]).nullable(),
    description: Yup.string().max(2000, "Giới thiệu tối đa 2000 ký tự").nullable(),
    avatarUrl: Yup.string().url("URL avatar không hợp lệ").nullable(),
});

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, profile, setProfile, clearAuth } = useAuth();

    const updateMutation = useMutation({
        mutationFn: (values: UpdateProfileRequest) => updateProfile(values),
        onSuccess: (data) => {
            setProfile(data);
            toast.success("Cập nhật hồ sơ thành công");
        },
        onError: () => {
            toast.error("Cập nhật hồ sơ thất bại");
        },
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
        onSubmit: (values) => updateMutation.mutate(values),
    });

    const handleLogout = async () => {
        try {
            await logout();
        } catch {
            // ignore
        }
        clearAuth();
        navigate("/login", { replace: true });
    };

    const height = Number(formik.values.heightCm) || 0;
    const weight = Number(formik.values.weightKg) || 0;
    const bmi = height > 0 && weight > 0 ? weight / ((height / 100) * (height / 100)) : null;

    let bmiCategory = "";
    if (bmi !== null) {
        if (bmi < 18.5) bmiCategory = "Thiếu cân";
        else if (bmi < 25) bmiCategory = "Bình thường";
        else if (bmi < 30) bmiCategory = "Thừa cân";
        else bmiCategory = "Béo phì";
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-3xl">
                <div className="mb-6 flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Đăng xuất
                    </Button>
                </div>

                <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-vegan-green-light text-vegan-green">
                            <User className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-dark">{user?.username}</h1>
                            <p className="text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold text-dark">Chỉnh sửa hồ sơ</h2>

                    <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                label="Chiều cao (cm)"
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
                                label="Cân nặng (kg)"
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
                            <FormField label="Tuổi" htmlFor="age" error={formik.touched.age ? formik.errors.age : undefined}>
                                <Input
                                    id="age"
                                    name="age"
                                    type="number"
                                    value={formik.values.age ?? ""}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                />
                            </FormField>

                            <FormField label="Giới tính" htmlFor="gender">
                                <Select
                                    id="gender"
                                    name="gender"
                                    value={formik.values.gender ?? ""}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                >
                                    <option value="">Chọn giới tính</option>
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </Select>
                            </FormField>
                        </div>

                        <FormField
                            label="URL avatar"
                            htmlFor="avatarUrl"
                            error={formik.touched.avatarUrl ? formik.errors.avatarUrl : undefined}
                        >
                            <Input
                                id="avatarUrl"
                                name="avatarUrl"
                                type="url"
                                placeholder="https://example.com/avatar.jpg"
                                value={formik.values.avatarUrl ?? ""}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </FormField>

                        <FormField
                            label="Giới thiệu"
                            htmlFor="description"
                            error={formik.touched.description ? formik.errors.description : undefined}
                        >
                            <Input
                                id="description"
                                name="description"
                                type="text"
                                placeholder="Giới thiệu về bản thân..."
                                value={formik.values.description ?? ""}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </FormField>

                        {bmi !== null && (
                            <div className="rounded-lg bg-vegan-green-light p-4">
                                <p className="text-sm text-muted-foreground">
                                    Chỉ số BMI: <span className="font-semibold text-dark">{bmi.toFixed(1)}</span> — {bmiCategory}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={updateMutation.isPending || formik.isSubmitting}>
                                <Save className="mr-2 h-4 w-4" />
                                {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
