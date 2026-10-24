import { api } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/types/common";
import type { UpdateProfileRequest, UserProfile } from "@/shared/types/user";

/**
 * Wire format là **camelCase** — xác nhận ở `docs/apis/profile/put-profile.md`,
 * `UpdateProfileRequest.java` và `ProfileControllerIntegrationTest` (jsonPath
 * `$.data.heightCm`). Bản snake_case cũ gửi `height_cm` nên bị backend bỏ qua.
 */
const PROFILE_FIELDS = [
    "heightCm",
    "weightKg",
    "age",
    "gender",
    "description",
    "avatarUrl",
    "preferences",
    "dislikes",
    "allergies",
    "restrictions",
    "healthGoal",
] as const;

function toUserProfile(raw: Record<string, unknown>): UserProfile {
    const value = (key: (typeof PROFILE_FIELDS)[number]) => raw[key];

    return {
        id: String(raw.id ?? ""),
        userId: String(raw.userId ?? ""),
        heightCm: (value("heightCm") as number | null | undefined) ?? null,
        weightKg: (value("weightKg") as number | null | undefined) ?? null,
        age: (value("age") as number | null | undefined) ?? null,
        gender: (value("gender") as UserProfile["gender"] | undefined) ?? null,
        description: (value("description") as string | null | undefined) ?? null,
        avatarUrl: (value("avatarUrl") as string | null | undefined) ?? null,
        updatedAt: String(raw.updatedAt ?? ""),
        // Field dietary chưa set thì vắng khỏi JSON — giữ `undefined` để form tự
        // mặc định, không biến thành `null` làm sai kiểu.
        preferences: value("preferences") as string[] | undefined,
        dislikes: value("dislikes") as string[] | undefined,
        allergies: value("allergies") as string[] | undefined,
        restrictions: value("restrictions") as string[] | undefined,
        healthGoal: value("healthGoal") as string | undefined,
    };
}

/** Chỉ gửi field có mặt — backend merge theo từng field đã gửi. */
function toUpdateBody(request: UpdateProfileRequest): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    for (const key of PROFILE_FIELDS) {
        const value = request[key];
        if (value !== undefined) body[key] = value;
    }
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
