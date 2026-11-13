import { api } from "@/shared/api/client";
import type { ApiResponse, PageResponse, Paginated } from "@/shared/types/common";
import type {
    AdminIngredient,
    AdminIngredientCreateRequest,
    AdminIngredientUpdateRequest,
    AdminRecipe,
    AdminRecipeUpdateRequest,
    ModerationStatus,
    RecipeSort,
} from "./types";

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

// ponytail: chưa có endpoint khôi phục recipe — DELETE là một chiều (spec live). Nút xoá
// trong UI phải cảnh báo rõ. Mở lại khi backend thêm `/restore`.

/**
 * GET /api/admin/recipes/{id} — cùng shape row trong list.
 * UI không gọi: row list đã đủ field dialog render, gọi thêm là 1 request thừa.
 * Giữ ở đây để khỏi viết lại khi cần làm trang chi tiết riêng.
 */
export async function getAdminRecipe(id: string): Promise<AdminRecipe> {
    const { data } = await api.get<ApiResponse<AdminRecipe>>(`/api/admin/recipes/${id}`);
    return data.data;
}

/**
 * PATCH /api/admin/recipes/{id} — sửa **7 field văn bản/số**.
 * Không sửa được ingredients, dish hay dinh dưỡng. Key bỏ trống = giữ nguyên.
 * Trả row đã cập nhật → dùng để ghi đè cache, không cần refetch list.
 */
export async function updateAdminRecipe(id: string, request: AdminRecipeUpdateRequest): Promise<AdminRecipe> {
    const { data } = await api.patch<ApiResponse<AdminRecipe>>(`/api/admin/recipes/${id}`, request);
    return data.data;
}

/**
 * DELETE /api/admin/recipes/{id} — **xoá mềm**, không có endpoint khôi phục.
 * Row vẫn nằm trong `GET /api/admin/recipes` với `status: "DELETED"`.
 */
export async function deleteAdminRecipe(id: string): Promise<void> {
    await api.delete(`/api/admin/recipes/${id}`);
}

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

export interface AdminIngredientListParams {
    /** 1-based; hàm này tự trừ 1 khi gửi lên wire. */
    page: number;
    size: number;
    /** Backend lọc substring theo tên — trang này dùng thật, không lọc client-side. */
    name?: string;
    /** Bỏ trống = cả 3 trạng thái. `PENDING` là hàng đợi cần điền dinh dưỡng. */
    moderationStatus?: ModerationStatus;
}

/**
 * GET /api/admin/ingredients — phân trang thật, có `name` + `moderationStatus`.
 *
 * ponytail: không gửi `sort` — spec live chỉ khai `sort: string`, không có whitelist để
 * đối chiếu nên gửi bừa dễ 400. Thứ tự hiện theo mặc định Spring. Thêm `sort` khi có
 * danh sách giá trị hợp lệ.
 */
export async function getAdminIngredients(
    params: AdminIngredientListParams,
): Promise<Paginated<AdminIngredient>> {
    const queryParams = new URLSearchParams();
    queryParams.set("page", String(Math.max(params.page - 1, 0)));
    queryParams.set("size", String(params.size));
    if (params.name) queryParams.set("name", params.name);
    if (params.moderationStatus) queryParams.set("moderationStatus", params.moderationStatus);

    const response = await api.get<ApiResponse<PageResponse<AdminIngredient>>>(
        `/api/admin/ingredients?${queryParams.toString()}`,
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

/** Số nguyên liệu một trạng thái — badge sidebar chỉ cần `total`, lấy 1 row là đủ. */
export async function countAdminIngredients(moderationStatus: ModerationStatus): Promise<number> {
    const response = await api.get<ApiResponse<PageResponse<AdminIngredient>>>(
        `/api/admin/ingredients?page=0&size=1&moderationStatus=${moderationStatus}`,
    );
    return Number(response.data.data.totalElements);
}

/**
 * POST /api/admin/ingredients — tạo nguyên liệu **mới**.
 * Trùng tên (kể cả tên đã xoá mềm) → 400: tên không được giải phóng.
 * Muốn điền dinh dưỡng cho nguyên liệu `PENDING` do member gõ thì PATCH, không phải POST.
 */
export async function createAdminIngredient(
    request: AdminIngredientCreateRequest,
): Promise<AdminIngredient> {
    const { data } = await api.post<ApiResponse<AdminIngredient>>("/api/admin/ingredients", request);
    return data.data;
}

/** PATCH /api/admin/ingredients/{id} — vắng khoá = giữ nguyên. */
export async function updateAdminIngredient(
    id: string,
    request: AdminIngredientUpdateRequest,
): Promise<AdminIngredient> {
    const { data } = await api.patch<ApiResponse<AdminIngredient>>(`/api/admin/ingredients/${id}`, request);
    return data.data;
}

/** DELETE /api/admin/ingredients/{id} — **xoá mềm**, tên không được giải phóng, không có restore. */
export async function deleteAdminIngredient(id: string): Promise<void> {
    await api.delete(`/api/admin/ingredients/${id}`);
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
