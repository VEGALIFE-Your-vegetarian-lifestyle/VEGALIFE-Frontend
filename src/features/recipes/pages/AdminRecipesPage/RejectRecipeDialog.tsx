import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormField";
import type { AdminRecipe } from "../../types";

function RejectForm({
    loading,
    onSubmit,
    onClose,
}: {
    loading: boolean;
    onSubmit: (reason: string) => void;
    onClose: () => void;
}) {
    const { t } = useTranslation("admin");

    const schema = Yup.object({
        reason: Yup.string()
            .trim()
            .required(t("recipes.reject.reasonRequired"))
            .max(1000, t("recipes.reject.reasonMax")),
    });

    const formik = useFormik({
        initialValues: { reason: "" },
        validationSchema: schema,
        onSubmit: (values) => onSubmit(values.reason.trim()),
    });

    return (
        <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
            <FormField
                label={t("recipes.reject.reasonLabel")}
                htmlFor="recipe-reject-reason"
                required
                helper={t("recipes.reject.reasonHelper")}
                error={formik.touched.reason ? formik.errors.reason : undefined}
            >
                <Textarea
                    id="recipe-reject-reason"
                    name="reason"
                    placeholder={t("recipes.reject.reasonPlaceholder")}
                    value={formik.values.reason}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-invalid={formik.touched.reason && !!formik.errors.reason}
                />
            </FormField>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    {t("recipes.reject.cancel")}
                </Button>
                <Button type="submit" variant="destructive" disabled={loading}>
                    {t("recipes.reject.submit")}
                </Button>
            </div>
        </form>
    );
}

interface RejectRecipeDialogProps {
    /** `null` = đóng. */
    recipe: AdminRecipe | null;
    loading: boolean;
    onSubmit: (reason: string) => void;
    onClose: () => void;
}

/** `reason` bắt buộc ở đây dù backend optional — lý do nằm trong `moderation_log`. */
export function RejectRecipeDialog({ recipe, loading, onSubmit, onClose }: RejectRecipeDialogProps) {
    const { t } = useTranslation("admin");

    return (
        <Dialog
            open={recipe !== null}
            onClose={onClose}
            title={t("recipes.reject.title")}
            description={recipe ? t("recipes.reject.recipeLabel", { name: recipe.name }) : undefined}
        >
            {recipe && (
                <>
                    <p className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                        {t("recipes.reject.warning")}
                    </p>
                    <RejectForm key={recipe.id} loading={loading} onSubmit={onSubmit} onClose={onClose} />
                </>
            )}
        </Dialog>
    );
}
