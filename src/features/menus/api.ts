import { api } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/types/common";
import type { MealPlanParams, MenuDetail } from "./types";

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
