import { api } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/types/common";

export interface SettingItem {
    key: string;
    value: string;
    updatedAt: string;
}

export interface SettingGroup {
    category: string;
    items: SettingItem[];
}

/**
 * `GET /api/admin/settings` — mọi setting admin sửa được, nhóm theo `category`
 * (`media` / `content` / `ai`), sắp xếp category rồi key. Không có type trong response.
 */
export async function getAdminSettings(): Promise<SettingGroup[]> {
    const { data } = await api.get<ApiResponse<SettingGroup[]>>("/api/admin/settings");
    return data.data;
}

/**
 * `PATCH /api/admin/settings` — partial: chỉ gửi key đã đổi, thiếu key = giữ nguyên.
 * Trả **toàn bộ** danh sách sau khi ghi → thay cache, không cần refetch.
 * 400 khi key lạ, giá trị sai kiểu/biên, hoặc `reject >= accept`.
 */
export async function updateAdminSettings(settings: Record<string, string>): Promise<SettingGroup[]> {
    const { data } = await api.patch<ApiResponse<SettingGroup[]>>("/api/admin/settings", { settings });
    return data.data;
}
