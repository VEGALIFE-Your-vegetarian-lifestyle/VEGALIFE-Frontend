import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive, Pencil, Plus, Search, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createCategory, getCategories, retireCategory, updateCategory } from "@/services/categoryService";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { PageHeader } from "@/shared/components/PageHeader";
import { TableSkeleton } from "@/shared/components/TableSkeleton";
import type { Category } from "@/types/category";
import { formatDate } from "@/utils/formatDate";
import { CategoryFormDialog } from "./CategoryFormDialog";

export default function CategoriesPage() {
    const queryClient = useQueryClient();
    const [keyword, setKeyword] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [retiring, setRetiring] = useState<Category | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-categories"],
        queryFn: getCategories,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    const onError = () => toast.error("Thao tác thất bại. Vui lòng thử lại.");

    const createMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            toast.success("Đã tạo danh mục");
            setFormOpen(false);
            invalidate();
        },
        onError,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: { name: string; description?: string } }) => updateCategory(id, payload),
        onSuccess: () => {
            toast.success("Đã cập nhật danh mục");
            setFormOpen(false);
            invalidate();
        },
        onError,
    });

    const retireMutation = useMutation({
        mutationFn: retireCategory,
        onSuccess: () => {
            toast.success("Đã ngừng sử dụng danh mục");
            setRetiring(null);
            invalidate();
        },
        onError,
    });

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (category: Category) => {
        setEditing(category);
        setFormOpen(true);
    };

    const categories = (data ?? []).filter((category) => category.name.toLowerCase().includes(keyword.trim().toLowerCase()));

    return (
        <div>
            <PageHeader
                breadcrumb={["Admin", "Danh mục"]}
                title="Quản lý danh mục"
                description="Danh mục đang được dùng chỉ có thể ngừng sử dụng, không xóa hẳn."
                action={
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Tạo danh mục
                    </Button>
                }
            />

            <div className="mb-4 relative sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                    className="pl-9"
                    placeholder="Tìm theo tên danh mục"
                    aria-label="Tìm danh mục"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                />
            </div>

            {isError ? (
                <ErrorState onRetry={() => refetch()} />
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Tên danh mục</TableHead>
                                <TableHead>Mô tả</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableSkeleton columns={5} />
                            ) : (
                                categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell className="max-w-xs text-muted-foreground">{category.description}</TableCell>
                                        <TableCell>
                                            {category.deletedAt ? (
                                                <Badge variant="outline">Ngừng sử dụng</Badge>
                                            ) : (
                                                <Badge variant="lightgreen">Đang dùng</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{formatDate(category.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => openEdit(category)}>
                                                    <Pencil className="h-4 w-4" />
                                                    Sửa
                                                </Button>
                                                <Button size="sm" variant="outline" disabled={category.deletedAt !== null} onClick={() => setRetiring(category)}>
                                                    <Archive className="h-4 w-4" />
                                                    Ngừng sử dụng
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {!isLoading && categories.length === 0 && (
                        <EmptyState
                            icon={Tags}
                            title="Chưa có danh mục nào"
                            description={keyword ? "Không có danh mục khớp với từ khóa." : "Tạo danh mục đầu tiên để phân loại bài viết và video."}
                            action={
                                keyword ? (
                                    <Button variant="outline" onClick={() => setKeyword("")}>
                                        Xóa bộ lọc
                                    </Button>
                                ) : (
                                    <Button onClick={openCreate}>Tạo danh mục</Button>
                                )
                            }
                        />
                    )}
                </>
            )}

            <CategoryFormDialog
                open={formOpen}
                category={editing}
                loading={createMutation.isPending || updateMutation.isPending}
                onSubmit={(payload) => (editing ? updateMutation.mutate({ id: editing.id, payload }) : createMutation.mutate(payload))}
                onClose={() => setFormOpen(false)}
            />

            <ConfirmDialog
                open={retiring !== null}
                title="Ngừng sử dụng danh mục?"
                description={`Danh mục "${retiring?.name}" sẽ không thể gán cho nội dung mới. Nội dung cũ vẫn giữ nguyên.`}
                confirmLabel="Ngừng sử dụng"
                destructive
                loading={retireMutation.isPending}
                onConfirm={() => retiring && retireMutation.mutate(retiring.id)}
                onClose={() => setRetiring(null)}
            />
        </div>
    );
}