import { api } from "@/services/api";
import type { UpdateProfileRequest, UserProfile } from "@/types/user";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function updateProfile(request: UpdateProfileRequest): Promise<UserProfile> {
    const response = await api.put<ApiResponse<UserProfile>>("/profile", request);
    return response.data.data;
}
