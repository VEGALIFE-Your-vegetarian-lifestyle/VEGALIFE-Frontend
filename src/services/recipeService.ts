import { api } from "@/services/api";
import type { ApiResponse, PageResponse, Paginated } from "@/types/common";
import type { AdminRecipe, CreateRecipeRequest, Ingredient, Recipe } from "@/types/recipe";

/**
 * #38 `POST /api/recipes` — đường DUY NHẤT sinh dish mới: BE trim+lowercase
 * `dishName` rồi find-or-create (BR-RECP-002). Owner lấy từ JWT (BR-RECP-001).
 *
 * ponytail: không có `GET /api/recipes` cho user thường — chỉ ADMIN đọc được qua
 * #24 `getAdminRecipes`. Trang "recipe của tôi" phải chờ BE bổ sung endpoint.
 */
export async function createRecipe(request: CreateRecipeRequest): Promise<Recipe> {
    const response = await api.post<ApiResponse<Recipe>>("/api/recipes", request);
    return response.data.data;
}

/** #40 `GET /api/ingredients` — autocomplete nguyên liệu cho form recipe. */
export async function getIngredients(
    params: { name?: string; page?: number; size?: number } = {},
): Promise<Ingredient[]> {
    const response = await api.get<ApiResponse<PageResponse<Ingredient>>>("/api/ingredients", {
        params: { page: 0, size: 20, sort: "name,asc", ...params },
    });
    return response.data.data.content;
}

export type AdminRecipeSort = "createdAt" | "updatedAt" | "name";

export interface AdminRecipeListParams {
    page: number;
    size: number;
    sort?: AdminRecipeSort;
    userId?: string;
    categoryId?: string;
    createdFrom?: string;
    createdTo?: string;
}

/**
 * #24 `GET /api/admin/recipes` — ADMIN-only. Soft-deleted recipe VẪN được liệt kê
 * (`status=DELETED`); không có filter `status`, nên lọc ở client.
 * BE chưa có tham số tìm kiếm theo tên — cũng lọc ở client như trang videos.
 */
export const getAdminRecipes = async ({
    page,
    size,
    sort = "createdAt",
    userId,
    categoryId,
    createdFrom,
    createdTo,
}: AdminRecipeListParams): Promise<Paginated<AdminRecipe>> => {
    // `name` sắp A-Z; hai mốc thời gian thì mới nhất trước.
    const direction = sort === "name" ? "asc" : "desc";
    const params: Record<string, string | number> = { page: page - 1, size, sort: `${sort},${direction}` };
    if (userId) params.userId = userId;
    if (categoryId) params.categoryId = categoryId;
    if (createdFrom) params.createdFrom = createdFrom;
    if (createdTo) params.createdTo = createdTo;

    const { data } = await api.get<ApiResponse<PageResponse<AdminRecipe>>>("/api/admin/recipes", { params });

    return {
        data: data.data.content,
        total: Number(data.data.totalElements),
        page,
        size: data.data.size,
        totalPages: data.data.totalPages,
    };
};
