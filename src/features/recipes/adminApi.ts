import { api } from "@/shared/api/client";
import type { ApiResponse, PageResponse, Paginated } from "@/shared/types/common";
import type { AdminRecipe, ModerationStatus, RecipeSort } from "./types";

export interface AdminRecipeListParams {
    /** 1-based như mọi trang admin khác; hàm này tự trừ 1 khi gửi lên wire. */
    page: number;
    size: number;
    sort?: RecipeSort;
    /** Bỏ trống = cả 3 trạng thái. `PENDING` là hàng đợi duyệt. */
    moderationStatus?: ModerationStatus;
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

    if (params.moderationStatus) queryParams.set("moderationStatus", params.moderationStatus);
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

// ponytail: chưa có endpoint sửa / xoá / khôi phục recipe trong UI. Thêm khi cần.
// (Backend đã có PATCH/DELETE — xem `DOCS/API-COVERAGE.md` §10.)

/**
 * POST /api/admin/recipes/{id}/approve — duyệt **chỉ recipe**.
 * Dish và ingredient của nó là tên dùng chung có endpoint riêng; duyệt ở đây không đổi chúng.
 * Idempotent: recipe đã APPROVED thì no-op, không ghi log.
 */
export async function approveRecipe(id: string, reason?: string): Promise<AdminRecipe> {
    const { data } = await api.post<ApiResponse<AdminRecipe>>(
        `/api/admin/recipes/${id}/approve`,
        reason ? { reason } : {},
    );
    return data.data;
}

/** POST /api/admin/recipes/{id}/reject — không xoá gì; tên bị chặn tạo lại vĩnh viễn. */
export async function rejectRecipe(id: string, reason?: string): Promise<AdminRecipe> {
    const { data } = await api.post<ApiResponse<AdminRecipe>>(
        `/api/admin/recipes/${id}/reject`,
        reason ? { reason } : {},
    );
    return data.data;
}

/**
 * POST /api/admin/dishes/{id}/approve — duyệt **tên món** dùng chung.
 *
 * Duyệt recipe không duyệt dish của nó, và `GET /api/dishes` chỉ trả dish `APPROVED`, nên
 * món do member gõ khi tạo recipe sẽ không bao giờ hiện ở ô chọn món của thực đơn cho tới
 * khi gọi endpoint này.
 */
export async function approveDish(dishId: string): Promise<void> {
    await api.post(`/api/admin/dishes/${dishId}/approve`, {});
}
