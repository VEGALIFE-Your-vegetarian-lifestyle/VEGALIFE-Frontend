// Media upload status machine — SRS 5.2. Backend chỉ có 3 state này (không có "pending").
export type VideoStatus = "uploading" | "succeed" | "failed";

export interface Video {
    id: string;
    title: string;
    description?: string;
    mediaUrl: string;
    thumbnailUrl?: string;
    mimeType: string;
    status: VideoStatus;
    uploader: { id: string; username: string };
    createdAt: string;
}