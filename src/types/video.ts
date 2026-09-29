// Media upload status machine — SRS 5.2
export type VideoStatus = "pending" | "uploading" | "succeed" | "failed";

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