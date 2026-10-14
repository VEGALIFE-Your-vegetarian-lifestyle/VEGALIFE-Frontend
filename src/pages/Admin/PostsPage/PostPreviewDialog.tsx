import { Check, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PostStatusBadge } from "@/components/blog/PostStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { POST_FLAG_VARIANT } from "@/shared/constants/postFlag";
import { canPublish, canUnpublish } from "@/shared/constants/postStatus";
import { formatDateLocale } from "@/utils/formatDate";
import type { AdminPost } from "@/types/post";

interface PostPreviewDialogProps {
    open: boolean;
    post: AdminPost | null;
    /** UUID → tên danh mục; thiếu thì hiện UUID. */
    categoryNames: Map<string, string>;
    /** Đang gọi POST /api/admin/posts/{id}/moderate. */
    loading: boolean;
    onApprove: () => void;
    /** UNPUBLISH không kèm lý do — chỉ hiện cho bài đã `published`. */
    onUnpublish: () => void;
    /** Mở hộp thoại nhập lý do — chỉ dùng cho bài `processed`. */
    onReject: () => void;
    onClose: () => void;
}

export function PostPreviewDialog({
    open,
    post,
    categoryNames,
    loading,
    onApprove,
    onUnpublish,
    onReject,
    onClose,
}: PostPreviewDialogProps) {
    const { t } = useTranslation(["admin", "common"]);

    return (
        <Dialog open={open} onClose={onClose} title={post?.title ?? ""} className="max-w-2xl">
            {post && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <PostStatusBadge status={post.status} />
                        {post.flag && (
                            <Badge variant={POST_FLAG_VARIANT[post.flag]} size="sm">
                                {t(`common:postFlag.${post.flag}`)}
                            </Badge>
                        )}
                        <span>@{post.username}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.email}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDateLocale(post.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {post.categoryIds.map((id) => (
                            <Badge key={id} variant="outline">
                                {categoryNames.get(id) ?? id}
                            </Badge>
                        ))}
                    </div>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-dark">{post.content}</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            {t("common:close")}
                        </Button>
                        {canUnpublish(post.status) && (
                            <Button
                                variant="outline"
                                disabled={loading}
                                onClick={post.status === "processed" ? onReject : onUnpublish}
                            >
                                <XCircle className="h-4 w-4" />
                                {t(
                                    post.status === "processed"
                                        ? "posts.list.action.reject"
                                        : "posts.list.action.unpublish",
                                )}
                            </Button>
                        )}
                        {canPublish(post.status) && (
                            <Button disabled={loading} onClick={onApprove}>
                                <Check className="h-4 w-4" />
                                {t("posts.list.action.approve")}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Dialog>
    );
}