import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Film, Play, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListParams } from "@/hooks/useListParams";
import { deleteVideo, getVideos } from "@/services/videoService";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { PageHeader } from "@/shared/components/PageHeader";
import { Pagination } from "@/shared/components/Pagination";
import { TableSkeleton } from "@/shared/components/TableSkeleton";
import { VIDEO_STATUS_LABEL, VIDEO_STATUS_VARIANT } from "@/shared/constants/videoStatus";
import type { Video, VideoStatus } from "@/types/video";
import { formatDate } from "@/utils/formatDate";

const PAGE_SIZE = 8;

export default function VideosPage() {
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
            toast.success("Đã xóa video");
            setDeleting(null);
            queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
        },
        onError: () => toast.error("Thao tác thất bại. Vui lòng thử lại."),
    });

    const videos = data?.data ?? [];
    const hasFilter = q !== "" || status !== "";

    return (
        <div>
            <PageHeader
                breadcrumb={["Admin", "Video"]}
                title="Quản lý video"
                description="Xem và xóa video hướng dẫn nấu ăn do người dùng tải lên."
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:max-w-sm sm:flex-1">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        className="pl-9"
                        placeholder="Tìm theo tiêu đề hoặc người đăng"
                        aria-label="Tìm video"
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                    />
                </div>
                <Select className="sm:w-52" aria-label="Lọc theo trạng thái tải lên" value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(VIDEO_STATUS_LABEL).map(([value, label]) => (
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
                                <TableHead>Video</TableHead>
                                <TableHead>Người đăng</TableHead>
                                <TableHead>Trạng thái tải lên</TableHead>
                                <TableHead>Ngày đăng</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
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
                                                        <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Film className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                                    )}
                                                </div>
                                                <span className="font-medium">{video.title}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>@{video.uploader.username}</TableCell>
                                        <TableCell>
                                            <Badge variant={VIDEO_STATUS_VARIANT[video.status]}>{VIDEO_STATUS_LABEL[video.status]}</Badge>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{formatDate(video.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="outline" disabled={video.status !== "succeed"} onClick={() => setPreview(video)}>
                                                    <Play className="h-4 w-4" />
                                                    Xem
                                                </Button>
                                                <Button size="sm" variant="destructive" className="ml-2" onClick={() => setDeleting(video)}>
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

                    {!isLoading && videos.length === 0 && (
                        <EmptyState
                            icon={Film}
                            title="Không có video nào"
                            description={hasFilter ? "Không có video khớp với bộ lọc hiện tại." : "Chưa có video nào được tải lên."}
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

            <Dialog open={preview !== null} onClose={() => setPreview(null)} title={preview?.title ?? ""} description={preview ? `Đăng bởi @${preview.uploader.username}` : undefined} className="max-w-2xl">
                {preview && (
                    <div className="space-y-4">
                        {preview.mediaUrl ? (
                            <video src={preview.mediaUrl} controls className="aspect-video w-full rounded-lg bg-black" />
                        ) : (
                            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-cream text-muted-foreground">
                                <Film className="h-12 w-12" aria-hidden="true" />
                                <span className="text-sm">Video mẫu (dữ liệu giả lập)</span>
                            </div>
                        )}
                        {preview.description && <p className="text-sm text-dark">{preview.description}</p>}
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={() => setPreview(null)}>
                                Đóng
                            </Button>
                        </div>
                    </div>
                )}
            </Dialog>

            <ConfirmDialog
                open={deleting !== null}
                title="Xóa video?"
                description={`Video "${deleting?.title}" sẽ bị xóa và không còn hiển thị công khai.`}
                confirmLabel="Xóa video"
                destructive
                loading={deleteMutation.isPending}
                onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
                onClose={() => setDeleting(null)}
            />
        </div>
    );
}