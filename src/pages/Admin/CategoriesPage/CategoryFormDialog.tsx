import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/shared/components/FormField";
import type { Category, CategoryPayload } from "@/types/category";

const categorySchema = Yup.object({
    name: Yup.string().trim().required("Vui lòng nhập tên danh mục").max(100, "Tên tối đa 100 ký tự"),
    description: Yup.string().max(500, "Mô tả tối đa 500 ký tự"),
});

interface CategoryFormProps {
    category: Category | null;
    loading: boolean;
    onSubmit: (payload: CategoryPayload) => void;
    onClose: () => void;
}

function CategoryForm({ category, loading, onSubmit, onClose }: CategoryFormProps) {
    const formik = useFormik({
        initialValues: { name: category?.name ?? "", description: category?.description ?? "" },
        validationSchema: categorySchema,
        onSubmit: (values) => onSubmit({ name: values.name.trim(), description: values.description.trim() }),
    });

    return (
        <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
            <FormField label="Tên danh mục" htmlFor="name" required error={formik.touched.name ? formik.errors.name : undefined}>
                <Input
                    id="name"
                    name="name"
                    placeholder="Nhập tên danh mục"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-invalid={formik.touched.name && !!formik.errors.name}
                />
            </FormField>
            <FormField label="Mô tả" htmlFor="description" error={formik.touched.description ? formik.errors.description : undefined}>
                <Textarea
                    id="description"
                    name="description"
                    placeholder="Nhập mô tả ngắn cho danh mục"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-invalid={formik.touched.description && !!formik.errors.description}
                />
            </FormField>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                    Hủy
                </Button>
                <Button type="submit" disabled={loading}>
                    {category ? "Lưu thay đổi" : "Tạo danh mục"}
                </Button>
            </div>
        </form>
    );
}

interface CategoryFormDialogProps extends CategoryFormProps {
    open: boolean;
}

export function CategoryFormDialog({ open, category, loading, onSubmit, onClose }: CategoryFormDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} title={category ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}>
            <CategoryForm category={category} loading={loading} onSubmit={onSubmit} onClose={onClose} />
        </Dialog>
    );
}