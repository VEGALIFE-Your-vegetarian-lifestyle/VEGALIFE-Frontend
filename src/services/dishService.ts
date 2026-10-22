import { api } from "@/services/api";
import type { ApiResponse, PageResponse } from "@/types/common";
import type { Dish } from "@/types/dish";

/**
 * #39 `GET /api/dishes` — autocomplete cho màn thực đơn tuần.
 * ponytail: chỉ đọc trang đầu theo `name`. Dish mới sinh ra qua #38
 * `POST /api/recipes` — xem `recipeService.ts`.
 */
export async function getDishes(params: { name?: string; page?: number; size?: number } = {}): Promise<Dish[]> {
    const response = await api.get<ApiResponse<PageResponse<Dish>>>("/api/dishes", {
        params: { page: 0, size: 20, sort: "name,asc", ...params },
    });
    return response.data.data.content;
}
