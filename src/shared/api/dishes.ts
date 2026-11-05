import { api } from "@/shared/api/client";
import type { ApiResponse, PageResponse } from "@/shared/types/common";
import type { Dish } from "@/shared/types/dish";

/** Tham số dùng chung cho các endpoint gợi ý (`/api/dishes`, `/api/ingredients`). */
export interface SuggestParams {
    name?: string;
    page?: number;
    size?: number;
}

/**
 * `name` là substring không phân biệt hoa thường; bỏ trống thì liệt kê từ đầu.
 * Cần JWT (khác `/api/categories`). Backend chỉ trả món đã duyệt (`APPROVED`).
 */
export async function searchDishes({ name, page = 0, size = 10 }: SuggestParams): Promise<PageResponse<Dish>> {
    const { data } = await api.get<ApiResponse<PageResponse<Dish>>>("/api/dishes", {
        params: { page, size, sort: "name,asc", ...(name ? { name } : {}) },
    });
    return data.data;
}
