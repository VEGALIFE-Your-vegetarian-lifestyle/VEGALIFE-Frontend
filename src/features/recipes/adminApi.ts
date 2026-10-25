import { api } from "@/shared/api/client";
import type { ApiResponse, PageResponse, Paginated } from "@/shared/types/common";
import type { AdminRecipe, RecipeSort } from "./types";

export interface AdminRecipeListParams {
    /** 1-based như mọi trang admin khác; hàm này tự trừ 1 khi gửi lên wire. */
    page: number;
    size: number;
    sort?: RecipeSort;
    /** Lọc theo chủ recipe — UUID. */
    userId?: string;
    /** Lọc theo danh mục — server resolve qua `post_recipe` → `post_category`. */
    categoryId?: string;
    /** ISO-8601. */
    createdFrom?: string;
    createdTo?: string;
}

/**
 * GET /api/admin/recipes — ADMIN-only, phân trang thật ở server.
 * Trả **cả** recipe đã xoá mềm với `status: "DELETED"`; không có tham số lọc status.
 *
 * ponytail: backend chưa có tham số tìm kiếm theo tên → `q` lọc client-side ở
 * `AdminRecipesPage` trên đúng trang đang hiển thị. Thay bằng param `name`/`q` khi
 * backend mở.
 */
export async function getAdminRecipes(params: AdminRecipeListParams): Promise<Paginated<AdminRecipe>> {
    const queryParams = new URLSearchParams();
    queryParams.set("page", String(Math.max(params.page - 1, 0)));
    queryParams.set("size", String(params.size));
    queryParams.set("sort", params.sort ?? "createdAt,desc");

    if (params.userId) queryParams.set("userId", params.userId);
    if (params.categoryId) queryParams.set("categoryId", params.categoryId);
    if (params.createdFrom) queryParams.set("createdFrom", params.createdFrom);
    if (params.createdTo) queryParams.set("createdTo", params.createdTo);

    const response = await api.get<ApiResponse<PageResponse<AdminRecipe>>>(
        `/api/admin/recipes?${queryParams.toString()}`,
    );
    const page = response.data.data;

    return {
        data: page.content,
        total: Number(page.totalElements),
        page: page.page + 1,
        size: page.size,
        totalPages: page.totalPages,
    };
}

// ponytail: chưa có endpoint sửa / xoá / khôi phục / duyệt recipe (nhóm 10 mới mở
// đúng 1 route GET). Thêm khi backend bổ sung.
