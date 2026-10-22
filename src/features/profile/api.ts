import { api } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/types/common";
import type { UpdateProfileRequest, UserProfile } from "@/shared/types/user";

// PUT /api/profile trả snake_case, GET /api/profile trả camelCase — chuẩn hoá về camelCase.
function toUserProfile(raw: Record<string, unknown>): UserProfile {
    const pick = (...keys: string[]) => keys.map((key) => raw[key]).find((value) => value !== undefined) ?? null;

    return {
        id: String(pick("id") ?? ""),
        userId: String(pick("userId", "user_id") ?? ""),
        heightCm: pick("heightCm", "height_cm") as number | null,
        weightKg: pick("weightKg", "weight_kg") as number | null,
        age: pick("age") as number | null,
        gender: pick("gender") as UserProfile["gender"],
        description: pick("description") as string | null,
        avatarUrl: pick("avatarUrl", "avatar_url") as string | null,
        updatedAt: String(pick("updatedAt", "updated_at") ?? ""),
    };
}

// Body PUT dùng snake_case theo docs/apis.
function toUpdateBody(request: UpdateProfileRequest): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    if (request.heightCm !== undefined) body.height_cm = request.heightCm;
    if (request.weightKg !== undefined) body.weight_kg = request.weightKg;
    if (request.age !== undefined) body.age = request.age;
    if (request.gender !== undefined) body.gender = request.gender;
    if (request.description !== undefined) body.description = request.description;
    if (request.avatarUrl !== undefined) body.avatar_url = request.avatarUrl;
    return body;
}

export async function getProfile(): Promise<UserProfile> {
    const response = await api.get<ApiResponse<Record<string, unknown>>>("/api/profile");
    return toUserProfile(response.data.data);
}

export async function updateProfile(request: UpdateProfileRequest): Promise<UserProfile> {
    const response = await api.put<ApiResponse<Record<string, unknown>>>("/api/profile", toUpdateBody(request));
    return toUserProfile(response.data.data);
}
