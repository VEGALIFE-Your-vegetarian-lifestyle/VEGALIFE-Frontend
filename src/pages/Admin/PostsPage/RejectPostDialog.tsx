import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/shared/components/FormField";
import type { Post } from "@/types/post";

const rejectSchema = Yup.object({
    reason: Yup.string()
        .trim()
        .required("Vui lòng nhập lý do từ chối")
        .min(10, "Lý do cần tối thiểu 10 ký tự")
        .max(500, "Lý do tối đa 500 ký tự"),
});

interface RejectFormProps {
    loading: boolean;
    onSubmit: (reason: string) => void;
    onClose: () => void;
}

function RejectForm({ loading, onSubmit, onClose }: RejectFormProps) {
    const formik = useFormik({
        initialValues: { reason: "" },
        validationSchema: rejectSchema,
        onSubmit: (values) => onSubmit(values.reason.trim()),
    });

    return (
        <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
            <FormField
                label="Lý do từ chối"
                htmlFor="reason"
                required
                helper="Tác giả sẽ nhận được lý do này qua thông báo."
                error={formik.touched.reason ? formik.errors.reason : undefined}
            >
                <Textarea
                    id="reason"
                    name="reason"
                    placeholder="Nhập lý do từ chối bài viết"
                    value={formik.values.reason}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    aria-invalid={formik.touched.reason && !!formik.errors.reason}
                />
            </FormField>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                    Hủy
                </Button>
                <Button type="submit" variant="destructive" disabled={loading}>
                    Từ chối bài viết
                </Button>
            </div>
        </form>
    );
}

interface RejectPostDialogProps {
    open: boolean;
    post: Post | null;
    loading: boolean;
    onSubmit: (reason: string) => void;
    onClose: () => void;
}

export function RejectPostDialog({ open, post, loading, onSubmit, onClose }: RejectPostDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} title="Từ chối bài viết" description={post ? `Bài viết: ${post.title}` : undefined}>
            <RejectForm loading={loading} onSubmit={onSubmit} onClose={onClose} />
        </Dialog>
    );
}