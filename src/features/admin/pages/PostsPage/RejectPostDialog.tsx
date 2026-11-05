import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormField";
import type { AdminPost } from "@/features/posts/types";

interface RejectFormProps {
    loading: boolean;
    onSubmit: (reason: string) => void;
    onClose: () => void;
}

function RejectForm({ loading, onSubmit, onClose }: RejectFormProps) {
    const { t } = useTranslation("admin");

    const schema = Yup.object({
        reason: Yup.string()
            .trim()
            .required(t("posts.reject.reasonRequired"))
            .max(1000, t("posts.reject.reasonMax")),
    });

    const formik = useFormik({
        initialValues: { reason: "" },
        validationSchema: schema,
        onSubmit: (values) => onSubmit(values.reason.trim()),
    });

    return (
        <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
            <FormField
                label={t("posts.reject.reasonLabel")}
                htmlFor="reason"
                required
                helper={t("posts.reject.reasonHelper")}
                error={formik.touched.reason ? formik.errors.reason : undefined}
            >
                <Textarea
                    id="reason"
                    name="reason"
                    placeholder={t("posts.reject.reasonPlaceholder")}
                    value={formik.values.reason}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-invalid={formik.touched.reason && !!formik.errors.reason}
                />
            </FormField>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                    {t("posts.reject.cancel")}
                </Button>
                <Button type="submit" variant="destructive" disabled={loading}>
                    {t("posts.reject.submit")}
                </Button>
            </div>
        </form>
    );
}

interface RejectPostDialogProps {
    open: boolean;
    post: AdminPost | null;
    loading: boolean;
    onSubmit: (reason: string) => void;
    onClose: () => void;
}

export function RejectPostDialog({ open, post, loading, onSubmit, onClose }: RejectPostDialogProps) {
    const { t } = useTranslation("admin");

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={t("posts.reject.title")}
            description={post ? t("posts.reject.postLabel", { title: post.title }) : undefined}
        >
            <RejectForm loading={loading} onSubmit={onSubmit} onClose={onClose} />
        </Dialog>
    );
}
