import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { Pencil, Archive, RotateCcw, Plus } from "lucide-react";
import {
    getCategories,
    createCategory,
    updateCategory,
    retireCategory,
    restoreCategory,
} from "../../api/category";
import type { Category } from "../../types/category";

const categorySchema = Yup.object({
    name: Yup.string().required("Tên category là bắt buộc").max(100),
    description: Yup.string().max(500),
});

export default function CategoryManagement() {
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState<Category | null>(null);
    const [showForm, setShowForm] = useState(false);

    const { data: categories, isLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: getCategories,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

    const createMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            toast.success("Tạo category thành công");
            invalidate();
            closeForm();
        },
        onError: () => toast.error("Tạo category thất bại"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: { name: string; description?: string } }) =>
            updateCategory(id, payload),
        onSuccess: () => {
            toast.success("Cập nhật category thành công");
            invalidate();
            closeForm();
        },
        onError: () => toast.error("Cập nhật category thất bại"),
    });

    const retireMutation = useMutation({
        mutationFn: retireCategory,
        onSuccess: () => {
            toast.success("Đã retire category");
            invalidate();
        },
        onError: () => toast.error("Category đang được dùng, không thể retire"),
    });

    const restoreMutation = useMutation({
        mutationFn: restoreCategory,
        onSuccess: () => {
            toast.success("Đã khôi phục category");
            invalidate();
        },
    });

    const formik = useFormik({
        initialValues: { name: editing?.name ?? "", description: editing?.description ?? "" },
        enableReinitialize: true,
        validationSchema: categorySchema,
        onSubmit: (values) => {
            if (editing) {
                updateMutation.mutate({ id: editing.categoryId, payload: values });
            } else {
                createMutation.mutate(values);
            }
        },
    });

    const openCreateForm = () => {
        setEditing(null);
        setShowForm(true);
    };

    const openEditForm = (category: Category) => {
        setEditing(category);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
        formik.resetForm();
    };

    if (isLoading) return <div className="p-6">Đang tải...</div>;

    return (
        <div className="p-6 bg-warm-bg min-h-screen">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-primary-text">Quản lý Category</h1>
                <button
                    onClick={openCreateForm}
                    className="flex items-center gap-2 rounded-lg bg-primary-green px-4 py-2 text-white hover:bg-dark-green"
                >
                    <Plus size={16} /> Thêm category
                </button>
            </div>

            <table className="w-full overflow-hidden rounded-lg border border-border border-collapse bg-white">
                <thead className="bg-light-green text-left text-sm text-dark-green">
                    <tr>
                        <th className="px-4 py-2">Tên</th>
                        <th className="px-4 py-2">Mô tả</th>
                        <th className="px-4 py-2">Trạng thái</th>
                        <th className="px-4 py-2 text-right">Hành động</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {categories?.map((category) => (
                        <tr key={category.categoryId} className="border-t border-border">
                            <td className="px-4 py-2 font-medium text-primary-text">{category.name}</td>
                            <td className="px-4 py-2 text-secondary-text">{category.description || "—"}</td>
                            <td className="px-4 py-2">
                                {category.deletedAt ? (
                                    <span className="rounded-full bg-border px-2 py-0.5 text-xs text-secondary-text">
                                        Retired
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-light-green px-2 py-0.5 text-xs text-dark-green">
                                        Active
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-2">
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => openEditForm(category)}
                                        className="text-secondary-text hover:text-primary-text"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    {category.deletedAt ? (
                                        <button
                                            onClick={() => restoreMutation.mutate(category.categoryId)}
                                            className="text-secondary-text hover:text-primary-green"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => retireMutation.mutate(category.categoryId)}
                                            className="text-secondary-text hover:text-error"
                                        >
                                            <Archive size={16} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showForm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40">
                    <form onSubmit={formik.handleSubmit} className="w-96 rounded-lg bg-white p-6">
                        <h2 className="mb-4 text-lg font-semibold text-primary-text">
                            {editing ? "Sửa category" : "Thêm category"}
                        </h2>

                        <label className="mb-1 block text-sm text-secondary-text">Tên</label>
                        <input
                            name="name"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            className="mb-1 w-full rounded-md border border-border px-3 py-2 text-primary-text"
                        />
                        {formik.errors.name && <p className="mb-2 text-xs text-error">{formik.errors.name}</p>}

                        <label className="mb-1 block text-sm text-secondary-text">Mô tả</label>
                        <textarea
                            name="description"
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            className="mb-4 w-full rounded-md border border-border px-3 py-2 text-primary-text"
                            rows={3}
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeForm}
                                className="rounded-md px-4 py-2 text-secondary-text hover:text-primary-text"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="rounded-md bg-primary-green px-4 py-2 text-white hover:bg-dark-green"
                            >
                                Lưu
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}