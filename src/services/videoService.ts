import { videosSeed } from "@/shared/mocks/videos";
import type { ListParams, Paginated } from "@/types/common";
import type { Video, VideoStatus } from "@/types/video";
import { delay } from "@/utils/delay";

// Mock data — SRS 11.2 (Media Module) hiện chỉ có GET list/detail và DELETE cho Admin
let videos = [...videosSeed];

export const getVideos = async ({ page, size, q, status }: ListParams<VideoStatus>): Promise<Paginated<Video>> => {
    await delay();
    const keyword = q?.trim().toLowerCase() ?? "";
    const filtered = videos.filter(
        (video) =>
            (!status || video.status === status) &&
            (video.title.toLowerCase().includes(keyword) || video.uploader.username.toLowerCase().includes(keyword)),
    );
    const start = (page - 1) * size;
    return {
        data: filtered.slice(start, start + size),
        total: filtered.length,
        page,
        size,
        totalPages: Math.max(1, Math.ceil(filtered.length / size)),
    };
};

// Soft delete
export const deleteVideo = async (id: string): Promise<void> => {
    await delay();
    videos = videos.filter((video) => video.id !== id);
};