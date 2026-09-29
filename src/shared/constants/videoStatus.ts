import type { VideoStatus } from "@/types/video";

export const VIDEO_STATUS_LABEL: Record<VideoStatus, string> = {
    pending: "Chờ tải lên",
    uploading: "Đang tải lên",
    succeed: "Thành công",
    failed: "Thất bại",
};

export const VIDEO_STATUS_VARIANT: Record<VideoStatus, "secondary" | "cream" | "lightgreen" | "destructive"> = {
    pending: "secondary",
    uploading: "cream",
    succeed: "lightgreen",
    failed: "destructive",
};