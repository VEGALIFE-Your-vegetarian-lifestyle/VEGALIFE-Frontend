import { api } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/types/common";
import type { CreateMenuRequest, MealPlanParams, MenuDetail, MenuStatus, MenuWriteResult } from "./types";

/**
 * GET /api/menus/details — menu của user hiện tại giao với cửa sổ `[from, to]`.
 * Trả **mảng phẳng**, không phân trang. Luôn truyền `from`/`to`: bỏ trống thì backend
 * lấy tuần hiện tại theo giờ UTC, lệch ngày với người dùng múi giờ dương.
 */
export const getMealPlans = async ({ from, to }: MealPlanParams): Promise<MenuDetail[]> => {
    const { data } = await api.get<ApiResponse<MenuDetail[]>>("/api/menus/details", {
        params: { from, to },
    });
    return data.data ?? [];
};

/** POST /api/menus — luôn tạo ở trạng thái `drafted`; `MenuValidator` chặn cả tuần nếu sai luật. */
export const createMenu = async (request: CreateMenuRequest): Promise<MenuWriteResult> => {
    const { data } = await api.post<ApiResponse<MenuWriteResult>>("/api/menus", request);
    return data.data;
};

/**
 * POST /api/menus/{menuId}/status — `drafted → scheduled|cancelled`,
 * `scheduled → cancelled|completed`; hai trạng thái cuối là hết. `drafted` không phải đích.
 * Schedule trùng tuần menu `scheduled` khác → 409.
 */
export const changeMenuStatus = async (menuId: string, status: MenuStatus): Promise<MenuWriteResult> => {
    const { data } = await api.post<ApiResponse<MenuWriteResult>>(`/api/menus/${menuId}/status`, { status });
    return data.data;
};
