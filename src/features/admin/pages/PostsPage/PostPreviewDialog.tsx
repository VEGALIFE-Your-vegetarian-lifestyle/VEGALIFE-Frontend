import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PostStatusBadge } from "@/features/posts/components/PostStatusBadge";
import { PostFlagBadge } from "@/features/posts/components/PostFlagBadge";
import { PostContent } from "@/features/posts/components/editor/PostContent";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { canPublish, canReject } from "@/features/posts/constants";
import { getAdminPostDetail } from "@/features/posts/api";
import { getAdminRecipe } from "@/features/recipes/adminApi";
import { RecipeDetailDialog } from "@/features/recipes/pages/AdminRecipesPage/RecipeDetailDialog";
import { showFallbackImage } from "@/shared/utils/display";
import { formatDateLocale } from "@/shared/utils/formatDate";
import type { AdminPost } from "@/features/posts/types";
import { PostMediaReview } from "./PostMediaReview";

interface PostPreviewDialogProps {
    open: boolean;
    post: AdminPost | null;
    /** UUID → tên danh mục; thiếu thì hiện UUID. */
    categoryNames: Map<string, string>;
    /** Đang gọi POST /api/admin/posts/{id}/approve hoặc /reject. */
    loading: boolean;
    onApprove: () => void;
    /** Mở hộp thoại nhập lý do — chỉ hiện cho bài `processing` / `unpublished`. */
    onReject: () => void;
    onClose: () => void;
}

export function PostPreviewDialog({
    open,
    post,
    categoryNames,
    loading,
    onApprove,
    onReject,
    onClose,
}: PostPreviewDialogProps) {
    const { t } = useTranslation(["admin", "common"]);
    /** Recipe đang mở chồng lên bài — Back đóng nó, bài vẫn còn nguyên bên dưới. */
    const [recipeId, setRecipeId] = useState<string | null>(null);

    // Row list thiếu `recipes[]`/`names[]` → tải chi tiết lúc dialog mở. Detail là superset
    // của row nên dùng nó làm nguồn chính khi đã có, fallback về row trong lúc chờ.
    const { data: detail, isLoading: detailLoading } = useQuery({
        queryKey: ["admin-post-detail", post?.id],
        queryFn: () => getAdminPostDetail(post!.id),
        enabled: open && !!post,
    });

    // Dialog recipe cần cả object `AdminRecipe`; row detail chỉ có tên + trạng thái.
    const { data: recipe, isError: recipeError } = useQuery({
        queryKey: ["admin-recipe", recipeId],
        queryFn: () => getAdminRecipe(recipeId!),
        enabled: !!recipeId,
    });

    const view = detail ?? post;
    const recipes = detail?.recipes ?? [];

    return (
        <>
            <Dialog open={open} onClose={onClose} title={view?.title ?? ""} className="max-w-2xl">
                {view && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <PostStatusBadge status={view.status} raw />
                            {view.flag && (
                                <PostFlagBadge status={view.status} flag={view.flag} flagDetail={view.flagDetail} />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Avatar name={view.displayName} src={view.avatarUrl} size="sm" />
                            <div className="min-w-0 text-sm">
                                <p className="truncate font-medium text-dark">{view.displayName}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {view.email} · {formatDateLocale(view.createdAt)}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {view.categoryIds.map((id) => (
                                <Badge key={id} variant="outline">
                                    {categoryNames.get(id) ?? id}
                                </Badge>
                            ))}
                        </div>

                        {/* Ảnh bìa — chỉ hiện khi có thật; ảnh dự phòng sẽ khiến admin
                            tưởng bài có ảnh. */}
                        {view.featuredImageUrl && (
                            <img
                                src={view.featuredImageUrl}
                                alt=""
                                loading="lazy"
                                onError={showFallbackImage()}
                                className="max-h-72 w-full rounded-xl border border-border object-cover"
                            />
                        )}

                        {/* Nội dung thật: `rawContent` qua editor (heading/list/link/media).
                            Bài cũ không có JSON thì rơi về text thuần. */}
                        {detailLoading && !detail ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        ) : (
                            <PostContent
                                doc={view.rawContent}
                                fallbackText={view.content}
                                className="text-sm leading-relaxed"
                            />
                        )}

                        <PostMediaReview mediaIds={view.mediaIds} />

                        {/* Chỉ recipe — dish/ingredient trong `names[]` không hiện ở đây. */}
                        {recipes.length > 0 && (
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-dark">
                                    {t("posts.preview.recipes")}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {recipes.map((item) => (
                                        <Button
                                            key={item.id}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setRecipeId(item.id)}
                                        >
                                            {item.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={onClose}>
                                {t("common:close")}
                            </Button>
                            {canReject(view.status) && (
                                <Button variant="outline" disabled={loading} onClick={onReject}>
                                    <XCircle className="h-4 w-4" />
                                    {t("posts.list.action.reject")}
                                </Button>
                            )}
                            {canPublish(view.status) && (
                                <Button disabled={loading} onClick={onApprove}>
                                    <Check className="h-4 w-4" />
                                    {t("posts.list.action.approve")}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Dialog>

            {/* Tải recipe bằng request riêng — hiện dialog chờ để cú bấm có phản hồi ngay. */}
            <Dialog
                open={!!recipeId && !recipe}
                onClose={() => setRecipeId(null)}
                title={recipeError ? t("posts.preview.recipeFailed") : t("posts.preview.loadingRecipe")}
            >
                <p className="text-sm text-muted-foreground">
                    {recipeError ? t("common:error") : t("common:loading")}
                </p>
            </Dialog>

            <RecipeDetailDialog
                recipe={recipeId ? (recipe ?? null) : null}
                categoryNames={categoryNames}
                loading={false}
                readOnly
                closeLabel={
                    <>
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        {t("posts.preview.backToPost")}
                    </>
                }
                onClose={() => setRecipeId(null)}
            />
        </>
    );
}
