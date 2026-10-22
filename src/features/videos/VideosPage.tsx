import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Film, Play, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/shared/hooks/useListParams";
import { deleteVideo, getVideos } from "./api";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { VIDEO_STATUS_VARIANT, VIDEO_STATUSES } from "./constants";
import type { Video, VideoStatus } from "./types";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { getApiErrorMessage } from "@/shared/utils/apiError";

const PAGE_SIZE = 8;

export default function VideosPage() {
    const { t } = useTranslation("admin");
    const queryClient = useQueryClient();
    const { page, q, status, debouncedQ, setQ, setStatus, setPage, clearFilters } = useListParams();
    const [preview, setPreview] = useState<Video | null>(null);
    const [deleting, setDeleting] = useState<Video | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-videos", page, debouncedQ, status],
        queryFn: () =>
            getVideos({ page, size: PAGE_SIZE, q: debouncedQ, status: (status || undefined) as VideoStatus | undefined }),
        placeholderData: keepPreviousData,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteVideo,
        onSuccess: () => {
            toast.success(t("videos.toast.deleted"));
            setDeleting(null);
            queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
        },
        onError: (error: unknown) => toast.error(getApiErrorMessage(error, t("videos.toast.failed"))),
    });

    const videos = data?.data ?? [];
    const hasFilter = q !== "" || status !== "";

    return (
        <div>
            <PageHeader
                breadcrumb={[t("common:admin"), t("videos.title")]}
                title={t("videos.title")}
                description={t("videos.description")}
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:max-w-sm sm:flex-1">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        className="pl-9"
                        placeholder={t("videos.searchPlaceholder")}
                        aria-label={t("videos.searchLabel")}
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                    />
                </div>
                <Select className="sm:w-52" aria-label={t("videos.filterLabel")} value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">{t("videos.allStatuses")}</option>
                    {VIDEO_STATUSES.map((value) => (
                        <option key={value} value={value}>
                            {t(`common:videoStatus.${value}`)}
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
                                <TableHead>{t("videos.column.video")}</TableHead>
                                <TableHead>{t("videos.column.uploader")}</TableHead>
                                <TableHead>{t("videos.column.status")}</TableHead>
                                <TableHead>{t("videos.column.createdAt")}</TableHead>
                                <TableHead className="text-right">{t("videos.column.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableSkeleton columns={5} />
                            ) : (
                                videos.map((video) => (
                                    <TableRow key={video.id}>
                                        <TableCell className="max-w-xs">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-cream">
                                                    {video.thumbnailUrl ? (
                                                        <img src={video.thumbnailUrl} alt={video.title || t("videos.untitled")} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Film className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                                    )}
                                                </div>
                                                <span className="font-medium">{video.title || t("videos.untitled")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>@{video.uploader.username}</TableCell>
                                        <TableCell>
                                            <Badge variant={VIDEO_STATUS_VARIANT[video.status]}>{t(`common:videoStatus.${video.status}`)}</Badge>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{formatDateLocale(video.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="outline" disabled={video.status !== "succeed"} onClick={() => setPreview(video)}>
                                                    <Play className="h-4 w-4" />
                                                    {t("videos.action.view")}
                                                </Button>
                                                <Button size="sm" variant="destructive" className="ml-2" onClick={() => setDeleting(video)}>
                                                    <Trash2 className="h-4 w-4" />
                                                    {t("common:delete")}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {!isLoading && videos.length === 0 && (
                        <EmptyState
                            icon={Film}
                            title={t("videos.empty.title")}
                            description={t(hasFilter ? "videos.empty.filtered" : "videos.empty.all")}
                            action={
                                <Button variant="outline" onClick={hasFilter ? clearFilters : () => refetch()}>
                                    {t(hasFilter ? "common:clearFilter" : "videos.empty.reload")}
                                </Button>
                            }
                        />
                    )}
                    <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
                </>
            )}

            <Dialog open={preview !== null} onClose={() => setPreview(null)} title={preview?.title || t("videos.untitled")} description={preview ? t("videos.preview.uploadedBy", { username: preview.uploader.username }) : undefined} className="max-w-2xl">
                {preview && (
                    <div className="space-y-4">
                        {preview.mediaUrl ? (
                            <video src={preview.mediaUrl} controls className="aspect-video w-full rounded-lg bg-black" />
                        ) : (
                            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-cream text-muted-foreground">
                                <Film className="h-12 w-12" aria-hidden="true" />
                                <span className="text-sm">{t("videos.preview.sample")}</span>
                            </div>
                        )}
                        {preview.description && <p className="text-sm text-dark">{preview.description}</p>}
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={() => setPreview(null)}>
                                {t("common:close")}
                            </Button>
                        </div>
                    </div>
                )}
            </Dialog>

            <ConfirmDialog
                open={deleting !== null}
                title={t("videos.confirm.deleteTitle")}
                description={t("videos.confirm.deleteDescription", { title: deleting?.title || t("videos.untitled") })}
                confirmLabel={t("videos.confirm.deleteConfirm")}
                destructive
                loading={deleteMutation.isPending}
                onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
                onClose={() => setDeleting(null)}
            />
        </div>
    );
}