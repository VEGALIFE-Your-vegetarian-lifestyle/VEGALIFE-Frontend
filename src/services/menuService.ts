import { api } from "@/services/api";
import type { ApiResponse, PageResponse } from "@/types/common";
import type {
    CreateMenuRequest,
    MenuDetail,
    MenuMutationResult,
    MenuStatus,
    MenuStatusRequest,
    MenuSummary,
    UpdateMenuRequest,
} from "@/types/menu";

/**
 * Nhóm 27 — Weekly menu. Endpoint #60–#64 trong `DOCS/API-REFERENCE.md`.
 *
 * KHÔNG có endpoint sinh meal plan bằng AI: `create_menu` / `get_meal_plan` trong
 * spec là tool nội bộ của LLM backend, không phải HTTP route. Plan chỉ được dựng
 * bằng cách chọn dish thật từ #39 rồi gửi #62.
 */

/** #60 — summary của menu mình sở hữu. Lọc theo `from`/`to`/`status`, 0-based page. */
export async function getMenus(
    params: { from?: string; to?: string; status?: MenuStatus; page?: number; size?: number } = {},
): Promise<PageResponse<MenuSummary>> {
    const response = await api.get<ApiResponse<PageResponse<MenuSummary>>>("/api/menus", {
        params: { page: 0, size: 20, sort: "startDate,desc", ...params },
    });
    return response.data.data;
}

/**
 * #61 — chi tiết đầy đủ. Có `menuId` thì bỏ qua `from`/`to`; không truyền gì thì
 * server trả tuần ISO hiện tại theo giờ UTC. Trả **mảng phẳng**, không phân trang.
 */
export async function getMenuDetails(params: { from?: string; to?: string; menuId?: string } = {}): Promise<MenuDetail[]> {
    const response = await api.get<ApiResponse<MenuDetail[]>>("/api/menus/details", { params });
    return response.data.data;
}

/** #62 — tạo draft. `startDate` phải là thứ Hai; `endDate` do server tự tính. */
export async function createMenu(request: CreateMenuRequest): Promise<MenuMutationResult> {
    const response = await api.post<ApiResponse<MenuMutationResult>>("/api/menus", request);
    return response.data.data;
}

/** #63 — thay TOÀN BỘ meals của menu `drafted`/`scheduled`. */
export async function updateMenu(menuId: string, request: UpdateMenuRequest): Promise<MenuMutationResult> {
    const response = await api.patch<ApiResponse<MenuMutationResult>>(`/api/menus/${menuId}`, request);
    return response.data.data;
}

/** #64 — `scheduled | cancelled | completed`. Gửi trùng trạng thái hiện tại → 409. */
export async function updateMenuStatus(menuId: string, request: MenuStatusRequest): Promise<MenuMutationResult> {
    const response = await api.post<ApiResponse<MenuMutationResult>>(`/api/menus/${menuId}/status`, request);
    return response.data.data;
}
