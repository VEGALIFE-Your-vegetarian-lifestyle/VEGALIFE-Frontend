import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/common/Pagination";
import { SectionCard } from "@/components/common/SectionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentComposer } from "@/features/posts/components/CommentComposer";
import { CommentThread } from "@/features/posts/components/CommentThread";
import { getPostComments } from "../../api";
import { useUiStore } from "@/shared/ui/uiStore";

/** Comment gốc mỗi trang; reply luôn về kèm cả cây nên không phân trang riêng. */
const PER_PAGE = 20;

interface Props {
    postId: string;
}

/** Khối bình luận — tự lo query và phân trang, không phụ thuộc page cha. */
export function CommentsSection({ postId }: Props) {
    const { t } = useTranslation("post");
    const language = useUiStore((state) => state.language);
    const [page, setPage] = useState(1);

    // GET /api/posts/{postId}/comments — public, phân trang comment gốc.
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["post-comments", postId, page],
        queryFn: () => getPostComments(postId, { page: page - 1, size: PER_PAGE }),
        enabled: postId !== "",
    });

    const comments = data?.content ?? [];
    const total = data?.totalElements ?? 0;

    return (
        <SectionCard eyebrow={t("comments.eyebrow", { count: total })} title={t("comments.title")}>
            {isLoading ? (
                <div className="space-y-3">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                </div>
            ) : isError && comments.length === 0 ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
                    <p className="text-sm text-destructive">{t("error")}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                        {t("common:actions.retry")}
                    </Button>
                </div>
            ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("comments.empty")}</p>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <CommentThread key={comment.id} postId={postId} comment={comment} language={language} />
                    ))}
                </div>
            )}

            <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />

            <div className="mt-5">
                <CommentComposer postId={postId} />
            </div>
        </SectionCard>
    );
}
