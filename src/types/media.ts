export type MediaStatus = "uploading" | "succeed" | "failed";

export interface MediaUploadInfo {
    method: string;
    url: string;
    headers: Record<string, string>;
    fields: Record<string, string | string[] | number>;
}

export interface UploadGrantRequest {
    contentType: string;
    fileName?: string;
    sizeBytes?: number;
}

export interface UploadGrantResponse {
    mediaId: string;
    status: MediaStatus;
    expiresAt: string;
    upload: MediaUploadInfo;
}

export interface Media {
    mediaId: string;
    status: MediaStatus;
    mediaUrl: string | null;
    thumbnailUrl: string | null;
    description: string | null;
    mimeType: string | null;
    fileSizeBytes: number | null;
    width: number | null;
    height: number | null;
    durationSeconds: number | null;
    createdAt: string;
}

export interface ConfirmUploadResponse extends Media {}
