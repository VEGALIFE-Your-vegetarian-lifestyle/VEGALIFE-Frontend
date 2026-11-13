import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    Calendar,
    Clock,
    Eye,
    FileText,
    Film,
    Loader2,
    PenLine,
    Plus,
    Search,
    Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PostStatusBadge } from "../../components/PostStatusBadge";
import { useListParams } from "@/shared/hooks/useListParams";
import { deletePost, getMyPosts, getMyPostsCounts } from "../../api";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { RejectionReason } from "@/components/common/RejectionReason";
import { useUiStore } from "@/shared/ui/uiStore";
import { estimateReadMinutes, formatDateLocale } from "@/shared/utils/formatDate";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { cn } from "@/shared/utils/cn";
import type { PostListResponse, PostStatus } from "../../types";
import type { MyPostsCounts } from "../../api";

const PAGE_SIZE = 8;

const STATUS_FILTERS: { value: PostStatus | ""; labelKey: string; countKey: keyof MyPostsCounts }[] = [
    { value: "", labelKey: "statusAll", countKey: "all" },
    { value: "published", labelKey: "statusPublished", countKey: "published" },
    { value: "processing", labelKey: "statusPending", countKey: "processing" },
    { value: "drafted", labelKey: "statusDraft", countKey: "draft" },
    { value: "unpublished", labelKey: "statusUnpublished", countKey: "unpublished" },
];

export default function MyPostsPage() {
    const { t } = useTranslation(["profile", "common", "home"]);
    const queryClient = useQueryClient();
    const language = useUiStore((state) => state.language);
    const openComposer = useUiStore((state) => state.openComposer);

    const { page, q, status, debouncedQ, setQ, setStatus, setPage, clearFilters } = useListParams();
    const [confirm, setConfirm] = useState<PostListResponse | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["my-posts", page, debouncedQ, status],
        queryFn: () =>
            getMyPosts({ page, size: PAGE_SIZE, q: debouncedQ, status: (status || undefined) as PostStatus | undefined }),
        placeholderData: keepPreviousData,
    });

    // Số trên chip + rail tài khoản = toàn tài khoản, không đổi theo trang/lọc.
    const { data: counts } = useQuery({
        queryKey: ["my-posts", "counts"],
        queryFn: getMyPostsCounts,
        // Bài vừa gửi tự flip status sau vài giây nên phải poll bảng đếm, không phải danh sách.
        // ponytail: bài kẹt `processing` (FILTER_SKIPPED chờ admin) khiến poll chạy mãi tới khi
        // rời trang; React Query tự tạm dừng khi tab ẩn. Thêm backoff nếu thành vấn đề tải.
        refetchInterval: (query) => ((query.state.data?.processing ?? 0) > 0 ? 3000 : false),
    });

    const posts = useMemo(() => data?.data ?? [], [data]);

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["my-posts"] });

    // Backend trả 400 kèm lý do cụ thể (vd: publish khi thiếu category) — hiện nguyên văn.
    const onError = (error: unknown) => {
        toast.error(getApiErrorMessage(error, t("common:error")));
    };

    const deleteMutation = useMutation({ mutationFn: deletePost, onSuccess: invalidate, onError });

    const isMutating = deleteMutation.isPending;

    const handleConfirm = () => {
        if (!confirm) return;
        deleteMutation.mutate(confirm.id);
        setConfirm(null);
    };

    const hasFilter = q !== "" || status !== "";

    return (
        <>
            <header className="flex flex-wrap items-end justify-between gap-3 px-0.5">
                <div>
                    <h1 className="text-2xl font-semibold leading-tight text-dark sm:text-[25px]">
                        {t("account.posts.title")}
                    </h1>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">
                        {t("account.posts.summary", {
                            total: counts?.all ?? 0,
                            published: counts?.published ?? 0,
                            draft: counts?.draft ?? 0,
                        })}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => openComposer()}
                    className="inline-flex h-10 flex-none items-center justify-center gap-1.5 rounded-full bg-vegan-green px-4 text-sm font-semibold text-white transition-colors hover:bg-vegan-green-hover max-sm:w-full"
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t("newContent")}
                </button>
            </header>

            <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                {/* Một hàng: tìm kiếm pill + segmented trạng thái, không card bọc riêng. */}
                <div className="mb-4 flex flex-wrap items-center gap-2.5">
                    <Input
                        leadingIcon={Search}
                        className="h-9 max-sm:w-full sm:max-w-xs rounded-full text-sm"
                        placeholder={t("filterPosts")}
                        aria-label={t("filterPosts")}
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                    />
                    <div className="inline-flex items-center rounded-full bg-muted-bg p-1 max-sm:w-full sm:ml-auto" role="group">
                        {STATUS_FILTERS.map((item) => {
                            const active = status === item.value;
                            const count = counts?.[item.countKey];
                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => setStatus(item.value)}
                                    aria-pressed={active}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors max-sm:flex-1 max-sm:justify-center",
                                        active
                                            ? "bg-card text-vegan-green shadow-[0_1px_2px_rgba(13,17,23,.08)]"
                                            : "text-muted-foreground hover:text-dark",
                                    )}
                                >
                                    {t(item.labelKey)}
                                    <b className="tabular-nums">{count ?? 0}</b>
                                </button>
                            );
                        })}
                    </div>
                    {hasFilter && (
                        <Button variant="ghost" size="sm" className="rounded-full" onClick={clearFilters}>
                            {t("common:clearFilter")}
                        </Button>
                    )}
                </div>

                {isError ? (
                    <ErrorState onRetry={() => refetch()} />
                ) : isLoading ? (
                    <div className="flex flex-col gap-2.5">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} className="h-28 rounded-xl" />
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title={t("empty.posts")}
                        description={t("empty.postsHint")}
                        action={
                            <Button variant="outline" onClick={hasFilter ? clearFilters : () => openComposer()}>
                                {hasFilter ? t("common:clearFilter") : t("empty.action")}
                            </Button>
                        }
                    />
                ) : (
                    <div className="flex flex-col gap-2.5">
                        {posts.map((post) => (
                            <PostManageRow
                                key={post.id}
                                post={post}
                                language={language}
                                disabled={isMutating}
                                onEdit={() => openComposer(post.id)}
                                onDelete={() => setConfirm(post)}
                            />
                        ))}
                    </div>
                )}

                <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
            </section>

            <ConfirmDialog
                open={confirm !== null}
                title={t("confirm.deleteTitle")}
                description={confirm ? t("confirm.deleteBody", { title: confirm.title }) : ""}
                confirmLabel={t("confirm.deleteConfirm")}
                destructive
                loading={isMutating}
                onConfirm={handleConfirm}
                onClose={() => setConfirm(null)}
            />
        </>
    );
}

interface PostManageRowProps {
    post: PostListResponse;
    language: string;
    disabled: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

/** Hàng ngang: thumbnail 104px · tiêu đề 1 dòng · trích đoạn 1 dòng · meta + hành động. */
function PostManageRow({ post, language, disabled, onEdit, onDelete }: PostManageRowProps) {
    const { t } = useTranslation(["profile", "home"]);
    const isVideo = post.mediaIds.length > 0;
    const locale = language === "vi" ? "vi-VN" : "en-US";

    // `GET`/`PATCH /api/posts/{id}` nhận mọi status (BR-POST-011) nên draft sửa được.
    const locked = disabled;
    const deleteLocked = disabled;
    const actionClass =
        "inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-dark transition-colors hover:bg-muted-bg disabled:cursor-not-allowed disabled:opacity-40";

    return (
        <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-vegan-green-muted/70 sm:flex-row">
            <div className="relative flex h-32 flex-none items-center justify-center bg-muted-bg text-vegan-green-muted sm:h-auto sm:w-[104px]">
                {post.featuredImageUrl ? (
                    <img src={post.featuredImageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : isVideo ? (
                    <Film className="h-6 w-6" aria-hidden="true" />
                ) : (
                    <FileText className="h-6 w-6" aria-hidden="true" />
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col p-3.5">
                <div className="flex items-start justify-between gap-2.5">
                    <h3 className="min-w-0 flex-1 text-[14.5px] font-bold leading-snug text-dark">
                        <Link to={`/posts/${post.id}`} className="line-clamp-1 hover:text-vegan-green">
                            {post.title}
                        </Link>
                    </h3>
                    <div className="flex flex-none flex-wrap gap-1.5 max-sm:hidden">
                        <Badge variant={isVideo ? "cream" : "lightgreen"} size="sm">
                            {isVideo ? t("home:card.video") : t("home:card.recipe")}
                        </Badge>
                        {post.status === "drafted" ? (
                            <Badge variant="amber" size="sm">{t("draftVisible")}</Badge>
                        ) : (
                            <PostStatusBadge status={post.status} />
                        )}
                    </div>
                </div>

                {post.status === "unpublished" && (
                    <RejectionReason reason={post.rejectionReason} className="mt-1.5" />
                )}

                <p className="mt-1 line-clamp-1 text-[12.5px] text-muted-foreground">{post.content}</p>

                <div className="mt-auto flex flex-wrap items-center gap-x-3.5 gap-y-2 pt-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] tabular-nums text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatDateLocale(post.createdAt, language)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] tabular-nums text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        {post.viewCount.toLocaleString(locale)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] tabular-nums text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("home:card.minRead", { count: estimateReadMinutes(post.content) })}
                    </span>

                    <div className="ml-auto flex gap-1.5">
                        <button type="button" disabled={locked} onClick={onEdit} className={actionClass}>
                            <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
                            {t("editPost")}
                        </button>
                        <button
                            type="button"
                            disabled={deleteLocked}
                            aria-label={t("deletePost")}
                            onClick={onDelete}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {disabled ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}
