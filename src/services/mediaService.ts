import { api } from "@/services/api";
import type {
    ConfirmUploadResponse,
    Media,
    UploadGrantRequest,
    UploadGrantResponse,
} from "@/types/media";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function createUploadGrant(request: UploadGrantRequest): Promise<UploadGrantResponse> {
    const response = await api.post<ApiResponse<UploadGrantResponse>>("/api/media/upload", {
        contentType: request.contentType,
        fileName: request.fileName,
        sizeBytes: request.sizeBytes,
    });
    return response.data.data;
}

function normalizeFieldValue(value: string | string[] | number): string {
    if (Array.isArray(value)) return value.join(",");
    if (typeof value === "number") return String(value);
    return value;
}

export async function uploadFileToProvider(
    url: string,
    fields: Record<string, string | string[] | number>,
    file: File,
): Promise<void> {
    const signedKeys = Object.keys(fields).filter((key) => key !== "api_key" && key !== "signature" && key !== "max_file_size");
    const orderedKeys = [...signedKeys].sort((a, b) => a.localeCompare(b));

    const formData = new FormData();
    for (const key of orderedKeys) {
        formData.append(key, normalizeFieldValue(fields[key]));
    }
    if (fields.api_key) formData.append("api_key", normalizeFieldValue(fields.api_key));
    if (fields.signature) formData.append("signature", normalizeFieldValue(fields.signature));
    formData.append("file", file);

    const response = await fetch(url, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Upload to provider failed: ${response.status} ${response.statusText} - ${text}`);
    }
}

export async function confirmUpload(mediaId: string): Promise<ConfirmUploadResponse> {
    const response = await api.post<ApiResponse<ConfirmUploadResponse>>(`/api/media/${mediaId}/confirm`, {});
    return response.data.data;
}

export async function getMedia(mediaId: string): Promise<Media> {
    const response = await api.get<ApiResponse<Media>>(`/api/media/${mediaId}`);
    return response.data.data;
}
