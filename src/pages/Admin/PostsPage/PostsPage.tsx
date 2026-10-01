import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Eye, EyeOff, FileText, Search, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PostStatusBadge } from "@/components/blog/PostStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/hooks/useListParams";
import { useNavigate } from "react-router-dom";
import { approvePost, createPost, deletePost, getPosts, hidePost, rejectPost, republishPost } from "@/services/postService";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { PageHeader } from "@/shared/components/PageHeader";
import { Pagination } from "@/shared/components/Pagination";
import { TableSkeleton } from "@/shared/components/TableSkeleton";
import { POST_STATUS_LABEL } from "@/shared/constants/postStatus";
import type { Post, PostStatus } from "@/types/post";
import { formatDate } from "@/utils/formatDate";
import { PostPreviewDialog } from "./PostPreviewDialog";
import { RejectPostDialog } from "./RejectPostDialog";

const PAGE_SIZE = 8;

export default function PostsPage() {
    const { t } = useTranslation("admin");
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { page, q, status, debouncedQ, setQ, setStatus, setPage, clearFilters } = useListParams();
    const [preview, setPreview] = useState<Post | null>(null);
    const [rejecting, setRejecting] = useState<Post | null>(null);
    const [confirm, setConfirm] = useState<{ type: "hide" | "delete"; post: Post } | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-posts", page, debouncedQ, status],
        queryFn: () =>
            getPosts({ page, size: PAGE_SIZE, q: debouncedQ, status: (status || undefined) as PostStatus | undefined }),
        placeholderData: keepPreviousData,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    const onError = () => toast.error("Thao tác thất bại. Vui lòng thử lại.");

    const approveMutation = useMutation({
        mutationFn: approvePost,
        onSuccess: () => {
            toast.success("Đã duyệt và đăng bài viết");
            setPreview(null);
            invalidate();
        },
        onError,
    });

    const rejectMutation = useMutation({
        mutationFn: rejectPost,
        onSuccess: () => {
            toast.success("Đã từ chối bài viết");
            setRejecting(null);
            setPreview(null);
            invalidate();
        },
        onError,
    });

    const hideMutation = useMutation({
        mutationFn: hidePost,
        onSuccess: () => {
            toast.success("Đã ẩn bài viết");
            setConfirm(null);
            invalidate();
        },
        onError,
    });

    const republishMutation = useMutation({
        mutationFn: republishPost,
        onSuccess: () => {
            toast.success("Bài viết đã hiển thị trở lại");
            invalidate();
        },
        onError,
    });

    const deleteMutation = useMutation({
        mutationFn: deletePost,
        onSuccess: () => {
            toast.success("Đã xóa bài viết");
            setConfirm(null);
            invalidate();
        },
        onError,
    });

    const handleConfirm = () => {
        if (!confirm) return;
        if (confirm.type === "hide") hideMutation.mutate(confirm.post.id);
        else deleteMutation.mutate(confirm.post.id);
    };

    const posts = data?.data ?? [];
    const hasFilter = q !== "" || status !== "";

    return (
        <div>
            <PageHeader
                breadcrumb={["Admin", t("posts.title")]}
                title={t("posts.title")}
                description={t("posts.description")}
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:max-w-sm sm:flex-1">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        className="pl-9"
                        placeholder="Tìm theo tiêu đề hoặc tác giả"
                        aria-label="Tìm bài viết"
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                    />
                </div>
                <Select className="sm:w-52" aria-label="Lọc theo trạng thái" value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(POST_STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </Select>
            </div>

            {isError ? (
                <ErrorState onRetry={() => refetch()} />
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Tiêu đề</TableHead>
                                <TableHead>Tác giả</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Lượt xem</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableSkeleton columns={6} />
                            ) : (
                                posts.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell className="max-w-xs">
                                            <button
                                                className="text-left font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green"
                                                onClick={() => setPreview(post)}
                                            >
                                                {post.title}
                                            </button>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {post.categories.map((category) => (
                                                    <Badge key={category.id} variant="outline" size="sm">
                                                        {category.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>@{post.author.username}</TableCell>
                                        <TableCell>
                                            <PostStatusBadge status={post.status} />
                                        </TableCell>
                                        <TableCell>{post.viewCount.toLocaleString("vi-VN")}</TableCell>
                                        <TableCell className="whitespace-nowrap">{formatDate(post.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                {post.status === "processed" && (
                                                    <>
                                                        <Button size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate(post.id)}>
                                                            <Check className="h-4 w-4" />
                                                            Duyệt
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={() => setRejecting(post)}>
                                                            <X className="h-4 w-4" />
                                                            Từ chối
                                                        </Button>
                                                    </>
                                                )}
                                                {post.status === "published" && (
                                                    <Button size="sm" variant="outline" onClick={() => setConfirm({ type: "hide", post })}>
                                                        <EyeOff className="h-4 w-4" />
                                                        Ẩn
                                                    </Button>
                                                )}
                                                {post.status === "hidden" && (
                                                    <Button size="sm" variant="outline" disabled={republishMutation.isPending} onClick={() => republishMutation.mutate(post.id)}>
                                                        <Eye className="h-4 w-4" />
                                                        Hiện lại
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="destructive" className="ml-2" onClick={() => setConfirm({ type: "delete", post })}>
                                                    <Trash2 className="h-4 w-4" />
                                                    Xóa
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {!isLoading && posts.length === 0 && (
                        <EmptyState
                            icon={FileText}
                            title="Không có bài viết nào"
                            description={hasFilter ? "Không có bài viết khớp với bộ lọc hiện tại." : "Chưa có bài viết nào trên hệ thống."}
                            action={
                                <Button variant="outline" onClick={hasFilter ? clearFilters : () => refetch()}>
                                    {hasFilter ? "Xóa bộ lọc" : "Tải lại"}
                                </Button>
                            }
                        />
                    )}
                    <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
                </>
            )}

            <PostPreviewDialog
                open={preview !== null}
                post={preview}
                approving={approveMutation.isPending}
                onApprove={(post) => approveMutation.mutate(post.id)}
                onReject={(post) => setRejecting(post)}
                onClose={() => setPreview(null)}
            />

            <RejectPostDialog
                open={rejecting !== null}
                post={rejecting}
                loading={rejectMutation.isPending}
                onSubmit={(reason) => rejecting && rejectMutation.mutate({ id: rejecting.id, reason })}
                onClose={() => setRejecting(null)}
            />

            <ConfirmDialog
                open={confirm !== null}
                title={confirm?.type === "delete" ? "Xóa bài viết?" : "Ẩn bài viết?"}
                description={
                    confirm?.type === "delete"
                        ? `Bài viết "${confirm.post.title}" sẽ bị xóa và không còn hiển thị công khai.`
                        : `Bài viết "${confirm?.post.title}" sẽ không còn hiển thị công khai cho đến khi được hiện lại.`
                }
                confirmLabel={confirm?.type === "delete" ? "Xóa bài viết" : "Ẩn bài viết"}
                destructive={confirm?.type === "delete"}
                loading={hideMutation.isPending || deleteMutation.isPending}
                onConfirm={handleConfirm}
                onClose={() => setConfirm(null)}
            />
        </div>
    );
}