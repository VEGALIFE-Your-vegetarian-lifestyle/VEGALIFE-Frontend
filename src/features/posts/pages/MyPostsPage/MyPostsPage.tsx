import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    BadgeCheck,
    Calendar,
    Eye,
    FileText,
    Film,
    Loader2,
    MessageCircle,
    MessageSquare,
    PenLine,
    Play,
    Plus,
    Search,
    ThumbsUp,
    Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { PillTabs } from "@/components/ui/pill-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PostStatusBadge } from "../../components/PostStatusBadge";
import { StatCard } from "@/components/common/StatCard";
import { useAuth } from "@/features/auth/useAuth";
import { useListParams } from "@/shared/hooks/useListParams";
import { deletePost, getMyActivity, getMyPosts, unpublishPost } from "../../api";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { useUiStore } from "@/shared/ui/uiStore";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { cn } from "@/shared/utils/cn";
import type { PostActivity, PostListResponse, PostStatus } from "../../types";

const PAGE_SIZE = 8;

type PostAction = "unpublish" | "delete";
type TabKey = "posts" | "videos" | "saved" | "activity";

const STATUS_FILTERS: { value: PostStatus | ""; labelKey: string }[] = [
    { value: "", labelKey: "statusAll" },
    { value: "published", labelKey: "statusPublished" },
    { value: "created", labelKey: "statusDraft" },
];

const ACTIVITY_ICON = { upvote: ThumbsUp, comment: MessageCircle, save: FileText } as const;

export default function MyPostsPage() {
    const { t } = useTranslation(["profile", "common"]);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, profile } = useAuth();
    const language = useUiStore((state) => state.language);

    const { page, q, status, debouncedQ, setQ, setStatus, setPage, clearFilters } = useListParams();
    const [tab, setTab] = useState<TabKey>("posts");
    const [confirm, setConfirm] = useState<{ action: PostAction; post: PostListResponse } | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["my-posts", page, debouncedQ, status],
        queryFn: () =>
            getMyPosts({ page, size: PAGE_SIZE, q: debouncedQ, status: (status || undefined) as PostStatus | undefined }),
        placeholderData: keepPreviousData,
    });

    // useMemo để danh tính mảng ổn định — nếu không, useMemo `stats` dưới tính lại mỗi render.
    const posts = useMemo(() => data?.data ?? [], [data]);

    // ponytail: hoạt động cộng đồng chưa có endpoint — mock ở tầng service.
    const { data: activity = [] } = useQuery({
        queryKey: ["my-activity", user?.id],
        queryFn: () => getMyActivity(user?.id ?? "me"),
        enabled: !!user,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["my-posts"] });

    // Backend trả 400 kèm lý do cụ thể (vd: publish khi thiếu category) — hiện nguyên văn.
    const onError = (error: unknown) => {
        toast.error(getApiErrorMessage(error, t("common:error")));
    };

    const unpublishMutation = useMutation({ mutationFn: unpublishPost, onSuccess: invalidate, onError });
    const deleteMutation = useMutation({ mutationFn: deletePost, onSuccess: invalidate, onError });

    const isMutating = unpublishMutation.isPending || deleteMutation.isPending;

    const stats = useMemo(
        () => ({
            published: posts.filter((post) => post.status === "published").length,
            videos: posts.filter((post) => post.type === "video").length,
            drafts: posts.filter((post) => post.status === "created").length,
            saved: posts.reduce((sum, post) => sum + (post.saveCount ?? 0), 0),
        }),
        [posts],
    );

    const handleConfirm = () => {
        if (!confirm) return;
        const { action, post } = confirm;
        const mutation = action === "unpublish" ? unpublishMutation : deleteMutation;
        mutation.mutate(post.id);
        setConfirm(null);
    };

    const hasFilter = q !== "" || status !== "";

    const tabs = [
        { key: "posts" as const, label: t("tab.posts"), count: data?.total },
        { key: "videos" as const, label: t("tab.videos"), count: stats.videos },
        { key: "saved" as const, label: t("tab.saved"), count: stats.saved },
        { key: "activity" as const, label: t("tab.activity"), count: activity.length },
    ];

    const statCards = [
        { icon: FileText, labelKey: "stats.published", value: stats.published },
        { icon: Film, labelKey: "stats.videos", value: stats.videos },
        { icon: ThumbsUp, labelKey: "stats.saved", value: stats.saved },
        { icon: MessageSquare, labelKey: "stats.contributions", value: stats.drafts },
    ];

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            <Avatar name={user?.username} src={profile?.avatarUrl} size="xl" />
                            <div>
                                <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-dark">
                                    {user?.username}
                                    <Badge variant="lightgreen" size="sm">
                                        <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                                        {t("verifiedAuthor")}
                                    </Badge>
                                </h1>
                                <p className="mt-0.5 text-sm text-muted-foreground">{t("contributorAccount")}</p>
                                <p className="mt-1 max-w-xl text-sm text-muted-foreground">{profile?.description}</p>
                                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                    {t("joined", {
                                        date: formatDateLocale(profile?.updatedAt ?? new Date().toISOString(), language),
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => navigate("/profile")}>
                                <PenLine className="h-4 w-4" aria-hidden="true" />
                                {t("editProfile")}
                            </Button>
                            <Button onClick={() => navigate("/posts/create")}>
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                {t("newContent")}
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {statCards.map(({ icon, labelKey, value }) => (
                        <StatCard key={labelKey} icon={icon} label={t(labelKey)} value={value} />
                    ))}
                </div>

                <PillTabs items={tabs} value={tab} onChange={setTab} className="border-b border-border pb-3" />

                {/* ponytail: 3 tab này chờ API (my videos / saved recipes / activity) — docs chưa có endpoint. */}
                {tab !== "posts" ? (
                    tab === "activity" ? (
                        <ActivityPanel items={activity} />
                    ) : (
                        <div className="rounded-2xl border border-border bg-card">
                            <EmptyState
                                icon={tab === "videos" ? Film : ThumbsUp}
                                title={t("unsupported.title")}
                                description={t("unsupported.description")}
                            />
                        </div>
                    )
                ) : (
                    <div className="rounded-2xl border border-border bg-card p-5">
                        {/* Một hàng: tìm kiếm bên trái, "STATUS: All (18) …" bên phải. */}
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <Input
                                leadingIcon={Search}
                                className="lg:max-w-xs"
                                placeholder={t("filterPosts")}
                                aria-label={t("filterPosts")}
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {t("statusLabel")}
                                </span>
                                {STATUS_FILTERS.map((item) => {
                                    const count =
                                        item.value === "" ? data?.total : item.value === "published" ? stats.published : stats.drafts;
                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() => setStatus(item.value)}
                                            aria-pressed={status === item.value}
                                            className={cn(
                                                "rounded-full px-3 py-1 text-xs font-semibold transition",
                                                status === item.value
                                                    ? "bg-vegan-green text-white"
                                                    : "bg-muted-bg text-muted-foreground hover:text-vegan-green",
                                            )}
                                        >
                                            {t(item.labelKey)} ({count ?? 0})
                                        </button>
                                    );
                                })}
                                {hasFilter && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        {t("common:clearFilter")}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {isError ? (
                            <ErrorState onRetry={() => refetch()} />
                        ) : isLoading ? (
                            <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <Skeleton key={index} className="h-80 rounded-2xl" />
                                ))}
                            </div>
                        ) : posts.length === 0 ? (
                            <EmptyState
                                icon={FileText}
                                title={t("empty.posts")}
                                description={t("empty.postsHint")}
                                action={
                                    <Button
                                        variant="outline"
                                        onClick={hasFilter ? clearFilters : () => navigate("/posts/create")}
                                    >
                                        {hasFilter ? t("common:clearFilter") : t("empty.action")}
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                {posts.map((post) => (
                                    <PostManageCard
                                        key={post.id}
                                        post={post}
                                        language={language}
                                        disabled={isMutating}
                                        onEdit={() => navigate(`/posts/${post.id}/edit`)}
                                        onAction={(action) => setConfirm({ action, post })}
                                    />
                                ))}
                            </div>
                        )}

                        <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={confirm !== null}
                title={confirm ? t(`confirm.${confirm.action}Title`) : ""}
                description={confirm ? t(`confirm.${confirm.action}Body`, { title: confirm.post.title }) : ""}
                confirmLabel={confirm ? t(`confirm.${confirm.action}Confirm`) : ""}
                destructive={confirm?.action === "delete"}
                loading={isMutating}
                onConfirm={handleConfirm}
                onClose={() => setConfirm(null)}
            />
        </div>
    );
}

/** Hoạt động cộng đồng — dữ liệu mock, xem `getMyActivity` trong postService. */
function ActivityPanel({ items }: { items: PostActivity[] }) {
    const { t } = useTranslation("profile");

    return (
        <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-bold text-dark">{t("activityTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("activitySubtitle")}</p>

            {items.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">{t("empty.activity")}</p>
            ) : (
                <ul className="mt-4 space-y-4">
                    {items.map((item) => {
                        const Icon = ACTIVITY_ICON[item.kind];
                        return (
                            <li key={item.id} className="flex gap-3">
                                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-vegan-green-light text-vegan-green">
                                    <Icon className="h-4 w-4" aria-hidden="true" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-dark">{item.title}</p>
                                    {item.detail && <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>}
                                    <p className="mt-0.5 text-xs text-muted-foreground">{item.date}</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

interface PostManageCardProps {
    post: PostListResponse;
    language: string;
    disabled: boolean;
    onEdit: () => void;
    onAction: (action: PostAction) => void;
}

function PostManageCard({ post, language, disabled, onEdit, onAction }: PostManageCardProps) {
    const { t } = useTranslation(["profile", "home"]);
    const isPublished = post.status === "published";
    const isVideo = post.type === "video";

    return (
        <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative h-44 bg-muted-bg">
                {post.featuredImageUrl ? (
                    <img
                        src={post.featuredImageUrl}
                        alt={post.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        {isVideo ? <Play className="h-10 w-10" aria-hidden="true" /> : <FileText className="h-10 w-10" aria-hidden="true" />}
                    </div>
                )}
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    <Badge variant={isVideo ? "cream" : "lightgreen"} size="sm">
                        {isVideo ? t("home:card.video") : t("home:card.recipe")}
                    </Badge>
                    {post.status === "created" ? (
                        <Badge variant="amber" size="sm">{t("draftVisible")}</Badge>
                    ) : (
                        <PostStatusBadge status={post.status} />
                    )}
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatDateLocale(post.createdAt, language)}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        {post.viewCount.toLocaleString(language === "vi" ? "vi-VN" : "en-US")}
                    </span>
                </div>

                <h3 className="mt-2 line-clamp-2 font-bold text-dark">
                    <Link to={`/posts/${post.id}`} className="hover:text-vegan-green">
                        {post.title}
                    </Link>
                </h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{post.content}</p>

                {/* Hệ thống tự kiểm tra và publish — draft chỉ chờ, không sửa/xoá được. */}
                <div className="mt-4 flex gap-2 border-t border-border pt-3">
                    {isPublished && (
                        <Button size="sm" variant="outline" block disabled={disabled} onClick={() => onAction("unpublish")}>
                            {t("unpublishAction")}
                        </Button>
                    )}
                    <Button size="sm" variant="outline" disabled={disabled || !isPublished} onClick={onEdit}>
                        <PenLine className="h-4 w-4" aria-hidden="true" />
                        {t("editPost")}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={disabled || !isPublished}
                        aria-label={t("deletePost")}
                        onClick={() => onAction("delete")}
                    >
                        {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                    </Button>
                </div>
            </div>
        </article>
    );
}
