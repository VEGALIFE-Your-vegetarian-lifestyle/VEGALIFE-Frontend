import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, FileText, Search, Trash2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PostStatusBadge } from "@/components/blog/PostStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/hooks/useListParams";
import { useCategoryNames } from "@/hooks/usePublicCategories";
import { deletePost, getPosts, moderatePost } from "@/services/postService";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { PageHeader } from "@/shared/components/PageHeader";
import { Pagination } from "@/shared/components/Pagination";
import { TableSkeleton } from "@/shared/components/TableSkeleton";
import { canPublish, canUnpublish } from "@/shared/constants/postStatus";
import { POST_FLAG_VARIANT } from "@/shared/constants/postFlag";
import type { AdminPost, ModerationAction, PostStatus } from "@/types/post";
import { formatDateLocale } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/utils/apiError";
import { PostPreviewDialog } from "./PostPreviewDialog";
import { RejectPostDialog } from "./RejectPostDialog";

const PAGE_SIZE = 8;

/** Thứ tự hiện trong dropdown lọc — khớp state machine SRS 5.2 (bỏ `flagged`/`hidden`). */
const POST_STATUSES: PostStatus[] = ["created", "processed", "published", "unpublished"];

interface ModerateVars {
    id: string;
    action: ModerationAction;
    reason?: string;
    /** Chọn câu toast vì UNPUBLISH mang hai nghĩa: từ chối (có reason) và ngừng đăng. */
    toastKey: "approved" | "rejected" | "unpublished";
}

export default function PostsPage() {
    const { t } = useTranslation(["admin", "common"]);
    const queryClient = useQueryClient();
    const { page, q, status, debouncedQ, setQ, setStatus, setPage, clearFilters } = useListParams();
    const [preview, setPreview] = useState<AdminPost | null>(null);
    const [confirm, setConfirm] = useState<AdminPost | null>(null);
    /** Bài đang mở hộp thoại từ chối — tách khỏi `preview` để hủy không đóng luôn preview. */
    const [reject, setReject] = useState<AdminPost | null>(null);

    // BE chỉ trả `categoryIds` — tra tên qua danh mục public, chưa có thì hiện UUID.
    const categoryNames = useCategoryNames();

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-posts", page, debouncedQ, status],
        queryFn: () =>
            getPosts({ page, size: PAGE_SIZE, q: debouncedQ, status: (status || undefined) as PostStatus | undefined }),
        placeholderData: keepPreviousData,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-posts"] });

    // BE trả 400/409 kèm lý do cụ thể — hiện nguyên văn thay vì câu chung.
    const onError = (error: unknown) => {
        toast.error(getApiErrorMessage(error, t("posts.toast.actionFailed")));
    };

    /**
     * POST /api/admin/posts/{id}/moderate — PUBLISH = duyệt, UNPUBLISH = ngừng đăng / từ chối.
     * `toastKey` tách "từ chối" (kèm reason) khỏi "ngừng đăng" vì cùng action UNPUBLISH.
     */
    const moderateMutation = useMutation({
        mutationFn: ({ id, action, reason }: ModerateVars) => moderatePost(id, reason ? { action, reason } : { action }),
        onSuccess: (_result, variables) => {
            toast.success(t(`posts.toast.${variables.toastKey}`));
            setPreview(null);
            setReject(null);
            invalidate();
        },
        onError,
    });

    const deleteMutation = useMutation({
        mutationFn: deletePost,
        onSuccess: () => {
            toast.success(t("posts.toast.deleted"));
            setConfirm(null);
            invalidate();
        },
        onError,
    });

    const handleConfirm = () => {
        if (confirm) deleteMutation.mutate(confirm.id);
    };

    const posts = data?.data ?? [];
    const hasFilter = q !== "" || status !== "";

    return (
        <div>
            <PageHeader
                breadcrumb={[t("common:admin"), t("posts.title")]}
                title={t("posts.title")}
                description={t("posts.description")}
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:max-w-sm sm:flex-1">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        className="pl-9"
                        placeholder={t("posts.list.searchPlaceholder")}
                        aria-label={t("posts.list.searchLabel")}
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                    />
                </div>
                <Select
                    className="sm:w-52"
                    aria-label={t("posts.list.filterLabel")}
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                >
                    <option value="">{t("posts.list.allStatuses")}</option>
                    {POST_STATUSES.map((value) => (
                        <option key={value} value={value}>
                            {t(`common:postStatus.${value}`)}
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
                                <TableHead>{t("posts.list.column.title")}</TableHead>
                                <TableHead>{t("posts.list.column.author")}</TableHead>
                                <TableHead>{t("posts.list.column.status")}</TableHead>
                                <TableHead>{t("posts.list.column.moderation")}</TableHead>
                                <TableHead>{t("posts.list.column.views")}</TableHead>
                                <TableHead>{t("posts.list.column.createdAt")}</TableHead>
                                <TableHead className="text-right">{t("posts.list.column.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableSkeleton columns={7} />
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
                                                {post.categoryIds.map((id) => (
                                                    <Badge key={id} variant="outline" size="sm">
                                                        {categoryNames.get(id) ?? id}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>@{post.username}</TableCell>
                                        <TableCell>
                                            <PostStatusBadge status={post.status} />
                                        </TableCell>
                                        <TableCell>
                                            {post.flag ? (
                                                <Badge variant={POST_FLAG_VARIANT[post.flag]} size="sm">
                                                    {t(`common:postFlag.${post.flag}`)}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{post.viewCount.toLocaleString("vi-VN")}</TableCell>
                                        <TableCell className="whitespace-nowrap">{formatDateLocale(post.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                {canPublish(post.status) && (
                                                    <Button
                                                        size="sm"
                                                        disabled={moderateMutation.isPending}
                                                        onClick={() =>
                                                            moderateMutation.mutate({
                                                                id: post.id,
                                                                action: "PUBLISH",
                                                                toastKey: "approved",
                                                            })
                                                        }
                                                    >
                                                        <Check className="h-4 w-4" />
                                                        {t("posts.list.action.approve")}
                                                    </Button>
                                                )}
                                                {canUnpublish(post.status) && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={moderateMutation.isPending}
                                                        onClick={() =>
                                                            post.status === "processed"
                                                                ? setReject(post)
                                                                : moderateMutation.mutate({
                                                                      id: post.id,
                                                                      action: "UNPUBLISH",
                                                                      toastKey: "unpublished",
                                                                  })
                                                        }
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        {t(
                                                            post.status === "processed"
                                                                ? "posts.list.action.reject"
                                                                : "posts.list.action.unpublish",
                                                        )}
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="destructive" className="ml-2" onClick={() => setConfirm(post)}>
                                                    <Trash2 className="h-4 w-4" />
                                                    {t("posts.list.action.delete")}
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
                            title={t("posts.list.empty.title")}
                            description={t(hasFilter ? "posts.list.empty.filtered" : "posts.list.empty.all")}
                            action={
                                <Button variant="outline" onClick={hasFilter ? clearFilters : () => refetch()}>
                                    {t(hasFilter ? "posts.list.empty.clearFilters" : "posts.list.empty.reload")}
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
                categoryNames={categoryNames}
                loading={moderateMutation.isPending}
                onApprove={() => preview && moderateMutation.mutate({ id: preview.id, action: "PUBLISH", toastKey: "approved" })}
                onUnpublish={() =>
                    preview && moderateMutation.mutate({ id: preview.id, action: "UNPUBLISH", toastKey: "unpublished" })
                }
                onReject={() => setReject(preview)}
                onClose={() => setPreview(null)}
            />

            <RejectPostDialog
                open={reject !== null}
                post={reject}
                loading={moderateMutation.isPending}
                onSubmit={(reason) =>
                    reject && moderateMutation.mutate({ id: reject.id, action: "UNPUBLISH", reason, toastKey: "rejected" })
                }
                onClose={() => setReject(null)}
            />

            <ConfirmDialog
                open={confirm !== null}
                title={t("posts.list.confirm.deleteTitle")}
                description={confirm ? t("posts.list.confirm.deleteDescription", { title: confirm.title }) : ""}
                confirmLabel={t("posts.list.confirm.deleteConfirm")}
                destructive
                loading={deleteMutation.isPending}
                onConfirm={handleConfirm}
                onClose={() => setConfirm(null)}
            />
        </div>
    );
}