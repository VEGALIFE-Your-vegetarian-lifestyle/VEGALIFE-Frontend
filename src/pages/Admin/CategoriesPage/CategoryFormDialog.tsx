import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/shared/components/FormField";
import type { Category, CategoryPayload } from "@/types/category";

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

interface CategoryFormProps {
    category: Category | null;
    loading: boolean;
    onSubmit: (payload: CategoryPayload) => void;
    onClose: () => void;
}

function CategoryForm({ category, loading, onSubmit, onClose }: CategoryFormProps) {
    const { t } = useTranslation(["admin", "validation", "common"]);

    const categorySchema = useMemo(
        () =>
            Yup.object({
                name: Yup.string()
                    .trim()
                    .required(t("validation:required"))
                    .max(MAX_NAME_LENGTH, t("validation:maxLength", { count: MAX_NAME_LENGTH })),
                description: Yup.string().max(
                    MAX_DESCRIPTION_LENGTH,
                    t("validation:maxLength", { count: MAX_DESCRIPTION_LENGTH }),
                ),
            }),
        [t],
    );

    const formik = useFormik({
        initialValues: { name: category?.name ?? "", description: category?.description ?? "" },
        validationSchema: categorySchema,
        onSubmit: (values) => onSubmit({ name: values.name.trim(), description: values.description.trim() }),
    });

    return (
        <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
            <FormField
                label={t("categories.form.nameLabel")}
                htmlFor="name"
                required
                error={formik.touched.name ? formik.errors.name : undefined}
            >
                <Input
                    id="name"
                    name="name"
                    placeholder={t("categories.form.namePlaceholder")}
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-invalid={formik.touched.name && !!formik.errors.name}
                />
            </FormField>
            <FormField
                label={t("categories.form.descriptionLabel")}
                htmlFor="description"
                error={formik.touched.description ? formik.errors.description : undefined}
            >
                <Textarea
                    id="description"
                    name="description"
                    placeholder={t("categories.form.descriptionPlaceholder")}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-invalid={formik.touched.description && !!formik.errors.description}
                />
            </FormField>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                    {t("common:cancel")}
                </Button>
                <Button type="submit" disabled={loading}>
                    {category ? t("categories.form.save") : t("categories.createCategory")}
                </Button>
            </div>
        </form>
    );
}

interface CategoryFormDialogProps extends CategoryFormProps {
    open: boolean;
}

export function CategoryFormDialog({ open, category, loading, onSubmit, onClose }: CategoryFormDialogProps) {
    const { t } = useTranslation("admin");

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={t(category ? "categories.form.editTitle" : "categories.form.createTitle")}
        >
            <CategoryForm category={category} loading={loading} onSubmit={onSubmit} onClose={onClose} />
        </Dialog>
    );
}
