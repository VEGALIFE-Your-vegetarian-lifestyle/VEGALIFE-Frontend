import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormField";
import type { AdminComment } from "../../types";

interface ModerateFormProps {
    loading: boolean;
    onSubmit: (reason: string) => void;
    onClose: () => void;
}

function ModerateForm({ loading, onSubmit, onClose }: ModerateFormProps) {
    const { t } = useTranslation("admin");

    const schema = Yup.object({
        reason: Yup.string()
            .trim()
            .required(t("comments.moderate.reasonRequired"))
            .max(1000, t("comments.moderate.reasonMax")),
    });

    const formik = useFormik({
        initialValues: { reason: "" },
        validationSchema: schema,
        onSubmit: (values) => onSubmit(values.reason.trim()),
    });

    return (
        <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
            <FormField
                label={t("comments.moderate.reasonLabel")}
                htmlFor="moderate-reason"
                required
                helper={t("comments.moderate.reasonHelper")}
                error={formik.touched.reason ? formik.errors.reason : undefined}
            >
                <Textarea
                    id="moderate-reason"
                    name="reason"
                    placeholder={t("comments.moderate.reasonPlaceholder")}
                    value={formik.values.reason}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-invalid={formik.touched.reason && !!formik.errors.reason}
                />
            </FormField>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    {t("comments.moderate.cancel")}
                </Button>
                <Button type="submit" variant="destructive" disabled={loading}>
                    {t("comments.moderate.submit")}
                </Button>
            </div>
        </form>
    );
}

interface ModerateCommentDialogProps {
    open: boolean;
    comment: AdminComment | null;
    loading: boolean;
    onSubmit: (reason: string) => void;
    onClose: () => void;
}

export function ModerateCommentDialog({ open, comment, loading, onSubmit, onClose }: ModerateCommentDialogProps) {
    const { t } = useTranslation("admin");

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={t("comments.moderate.title")}
            description={
                comment
                    ? t("comments.moderate.description", {
                          author: comment.username || comment.userId,
                          snippet: comment.content.slice(0, 80),
                      })
                    : undefined
            }
        >
            <ModerateForm loading={loading} onSubmit={onSubmit} onClose={onClose} />
        </Dialog>
    );
}

