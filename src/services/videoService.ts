import { api } from "@/services/api";
import type { ApiResponse, ListParams, PageResponse, Paginated } from "@/types/common";
import type { Video, VideoStatus } from "@/types/video";

// GET /api/admin/videos — backend không có `title`, chỉ có description.
interface AdminVideo {
    id: string;
    mediaUrl: string | null;
    thumbnailUrl: string | null;
    description: string | null;
    status: VideoStatus;
    durationSeconds: number | null;
    fileSizeBytes: number | null;
    mimeType: string;
    width: number | null;
    height: number | null;
    externalId: string | null;
    createdAt: string;
    updatedAt: string;
    userId: string | null;
    username: string | null;
    email: string | null;
    posts: { id: string; title: string; status: string }[];
}

function toVideo(item: AdminVideo): Video {
    return {
        id: item.id,
        title: item.description?.trim() || "",
        description: item.description ?? undefined,
        mediaUrl: item.mediaUrl ?? "",
        thumbnailUrl: item.thumbnailUrl ?? undefined,
        mimeType: item.mimeType,
        status: item.status,
        uploader: { id: item.userId ?? "", username: item.username ?? "—" },
        createdAt: item.createdAt,
    };
}

/**
 * GET /api/admin/videos — ADMIN-only, mọi upload state (kể cả uploading/failed).
 * ponytail: backend chưa hỗ trợ `q`; lọc ở client trên tối đa 100 row.
 */
export const getVideos = async ({ page, size, q, status }: ListParams<VideoStatus>): Promise<Paginated<Video>> => {
    const { data } = await api.get<ApiResponse<PageResponse<AdminVideo>>>("/api/admin/videos", {
        params: { page: 0, size: 100, ...(status ? { status } : {}) },
    });

    const keyword = q?.trim().toLowerCase() ?? "";
    const filtered = data.data.content.filter(
        (item) => keyword === "" || (item.description ?? "").toLowerCase().includes(keyword),
    );

    const start = (page - 1) * size;

    return {
        data: filtered.slice(start, start + size).map(toVideo),
        total: filtered.length,
        page,
        size,
        totalPages: Math.max(1, Math.ceil(filtered.length / size)),
    };
};

/**
 * DELETE /api/media/{mediaId} — soft delete, chủ media hoặc ADMIN.
 * Idempotent: gọi lại trên row đã xóa vẫn 200.
 */
export const deleteVideo = async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/api/media/${id}`);
};
