import { useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Flag, MessageSquare, Search, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/shared/hooks/useListParams";
import { useUiStore } from "@/shared/ui/uiStore";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { getAdminComments, moderateComment } from "../../commentApi";
import { ModerateCommentDialog } from "./ModerateCommentDialog";
import type { AdminComment, AdminCommentSort, CommentStatus } from "../../types";

const PAGE_SIZE = 10;

export default function AdminCommentsPage() {
    const { t } = useTranslation(["admin", "common"]);
    const language = useUiStore((state) => state.language);
    const queryClient = useQueryClient();

    const { page, q, status, debouncedQ, setQ, setStatus, setPage, clearFilters } = useListParams();
    const [sort, setSort] = useState<AdminCommentSort>("createdAt");
    const [moderatingComment, setModeratingComment] = useState<AdminComment | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-comments", page, debouncedQ, status, sort],
        queryFn: () =>
            getAdminComments({
                page,
                size: PAGE_SIZE,
                q: debouncedQ,
                status: (status || "all") as CommentStatus | "all",
                sort,
            }),
        placeholderData: keepPreviousData,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-comments"] });

    const moderateMutation = useMutation({
        mutationFn: ({ commentId, reason }: { commentId: string; reason: string }) =>
            moderateComment(commentId, { reason }),
        onSuccess: () => {
            toast.success(t("comments.toast.moderatedSuccess"));
            setModeratingComment(null);
            invalidate();
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("comments.toast.moderateFailed")));
        },
    });

    const handleModerateSubmit = (reason: string) => {
        if (!moderatingComment) return;
        moderateMutation.mutate({ commentId: moderatingComment.id, reason });
    };

    const comments = data?.data ?? [];
    const hasFilter = q !== "" || status !== "";

    return (
        <div className="space-y-6">
            <PageHeader
                breadcrumb={[t("dashboard.adminLabel"), t("comments.title")]}
                title={t("comments.title")}
                description={t("comments.description")}
            />

            {/* Filter controls */}
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <Input
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={t("comments.list.searchPlaceholder")}
                        aria-label={t("comments.list.searchLabel")}
                        className="pl-9"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <Select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        aria-label={t("comments.list.filterStatusLabel")}
                        className="w-40"
                    >
                        <option value="">{t("comments.list.allStatuses")}</option>
                        <option value="active">{t("comments.status.active")}</option>
                        <option value="removed">{t("comments.status.removed")}</option>
                    </Select>

                    <Select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as AdminCommentSort)}
                        aria-label={t("comments.list.sortLabel")}
                        className="w-36"
                    >
                        <option value="createdAt">{t("comments.sort.newest")}</option>
                        <option value="updatedAt">{t("comments.sort.updated")}</option>
                    </Select>
                </div>
            </div>

            {/* Main table content */}
            {isError ? (
                <ErrorState
                    title={t("common:error")}
                    description={t("comments.toast.loadFailed")}
                    onRetry={() => void refetch()}
                />
            ) : !isLoading && comments.length === 0 ? (
                <EmptyState
                    icon={MessageSquare}
                    title={t("comments.empty.title")}
                    description={hasFilter ? t("comments.empty.filtered") : t("comments.empty.all")}
                    action={
                        hasFilter ? (
                            <Button variant="outline" onClick={clearFilters}>
                                {t("comments.empty.clearFilters")}
                            </Button>
                        ) : undefined
                    }
                />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("comments.list.column.author")}</TableHead>
                                <TableHead className="min-w-[240px]">{t("comments.list.column.content")}</TableHead>
                                <TableHead>{t("comments.list.column.post")}</TableHead>
                                <TableHead>{t("comments.list.column.status")}</TableHead>
                                <TableHead>{t("comments.list.column.createdAt")}</TableHead>
                                <TableHead className="text-right">{t("comments.list.column.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableSkeleton columns={6} />
                            ) : (
                                comments.map((comment) => {
                                    const isRemoved = comment.status === "removed" || !!comment.deletedAt;
                                    return (
                                        <TableRow key={comment.id}>
                                            {/* Author column */}
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar
                                                        name={comment.username || "User"}
                                                        src={comment.avatarUrl ?? undefined}
                                                        size="sm"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-dark truncate">
                                                            {comment.username || t("comments.deletedAuthor")}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground truncate font-mono">
                                                            {comment.userId.slice(0, 8)}...
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Content column */}
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <p className={`line-clamp-2 text-sm leading-relaxed ${isRemoved ? "italic text-muted-foreground" : "text-dark"}`}>
                                                        {comment.content}
                                                    </p>
                                                    <div className="flex items-center gap-1.5">
                                                        {comment.parentId && (
                                                            <span className="rounded bg-muted-bg px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                                {t("comments.badge.reply")}
                                                            </span>
                                                        )}
                                                        {comment.reportCount > 0 && (
                                                            <Badge variant="destructive" size="sm" className="gap-1">
                                                                <Flag className="h-3 w-3" />
                                                                {t("comments.badge.reports", { count: comment.reportCount })}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Post column */}
                                            <TableCell>
                                                <Link
                                                    to={`/posts/${comment.postId}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-vegan-green hover:underline"
                                                >
                                                    <span className="font-mono">{comment.postId.slice(0, 8)}</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </TableCell>

                                            {/* Status column */}
                                            <TableCell>
                                                {isRemoved ? (
                                                    <Badge variant="muted" size="sm">
                                                        {t("comments.status.removed")}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="lightgreen" size="sm">
                                                        {t("comments.status.active")}
                                                    </Badge>
                                                )}
                                            </TableCell>

                                            {/* Created at column */}
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDateLocale(comment.createdAt, language)}
                                            </TableCell>

                                            {/* Actions column */}
                                            <TableCell className="text-right">
                                                {!isRemoved ? (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => setModeratingComment(comment)}
                                                        className="gap-1.5"
                                                    >
                                                        <ShieldAlert className="h-3.5 w-3.5" />
                                                        {t("comments.action.moderate")}
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        {t("comments.action.moderated")}
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>

                    {!isLoading && (
                        <div className="p-4 border-t border-border">
                            <Pagination
                                page={page}
                                totalPages={data?.totalPages ?? 1}
                                onChange={setPage}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Moderation dialog */}
            <ModerateCommentDialog
                open={!!moderatingComment}
                comment={moderatingComment}
                loading={moderateMutation.isPending}
                onSubmit={handleModerateSubmit}
                onClose={() => setModeratingComment(null)}
            />
        </div>
    );
}
