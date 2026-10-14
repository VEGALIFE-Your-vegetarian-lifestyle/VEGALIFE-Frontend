import type { VideoStatus } from "@/types/video";

/**
 * Nhãn hiển thị nằm ở i18n `common:videoStatus.*` — component đọc qua `t()`.
 * ponytail: chỉ giữ variant ở đây vì Tailwind cần class tĩnh.
 */
export const VIDEO_STATUS_VARIANT: Record<VideoStatus, "secondary" | "cream" | "lightgreen" | "destructive"> = {
    uploading: "cream",
    succeed: "lightgreen",
    failed: "destructive",
};

export const VIDEO_STATUSES: VideoStatus[] = ["uploading", "succeed", "failed"];
