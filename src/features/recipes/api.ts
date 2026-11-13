import { api } from "@/shared/api/client";
import type { ApiResponse, PageResponse } from "@/shared/types/common";
import type { SuggestParams } from "@/shared/api/dishes";
import type { CreateRecipeRequest, Difficulty, Ingredient, ModerationStatus, Recipe } from "./types";

/** POST /api/recipes — owner lấy từ JWT; `dishName`/ingredient name được find-or-create. */
export async function createRecipe(request: CreateRecipeRequest): Promise<Recipe> {
    const { data } = await api.post<ApiResponse<Recipe>>("/api/recipes", request);
    return data.data;
}

/**
 * GET /api/recipes/me — công thức của chính mình, **lọc ở server**.
 * `moderationStatus`/`difficulty` bỏ trống = không lọc. Backend **không có** `keyword`
 * → trang tự lọc từ khoá ở client.
 * Backend trả trang phân trang (`size` ≤ 100); ở đây gom một trang lớn rồi trả mảng phẳng
 * để `recipeStats`/sort/tìm của MyRecipesPage chạy tại chỗ.
 * ponytail: trần 100 công thức mỗi bộ lọc; khi có tác giả vượt trần thì phân trang server.
 */
export async function getMyRecipes({
    moderationStatus,
    difficulty,
}: {
    moderationStatus?: ModerationStatus;
    difficulty?: Difficulty;
} = {}): Promise<Recipe[]> {
    const { data } = await api.get<ApiResponse<PageResponse<Recipe>>>("/api/recipes/me", {
        params: {
            page: 0,
            size: 100,
            ...(moderationStatus ? { moderationStatus } : {}),
            ...(difficulty ? { difficulty } : {}),
        },
    });
    return data.data.content;
}

/**
 * GET /api/recipes/{recipeId} — một công thức công khai.
 * Dùng cho thẻ "công thức đính kèm" ở Post Detail (`post.recipeIds`).
 */
export async function getRecipe(id: string): Promise<Recipe> {
    const { data } = await api.get<ApiResponse<Recipe>>(`/api/recipes/${id}`);
    return data.data;
}

export interface PublicRecipeParams {
    page?: number;
    size?: number;
    /** Khớp tên công thức, mô tả, các bước, tên món hoặc tên nguyên liệu. */
    keyword?: string;
    difficulty?: Difficulty;
    /** Tổng `prep + cook` ≤ giá trị (phút). Công thức thiếu giờ nấu bị loại. */
    maxTotalTimeMinutes?: number;
}

/**
 * GET /api/recipes — danh mục công thức công khai (**chỉ `APPROVED`**, public, không cần JWT).
 * Dùng ở `/explore` để trộn vào feed bài viết.
 * Backend **không** nhận category, sort hay khoảng ngày cho route này.
 */
export async function getPublicRecipes({
    page = 0,
    size = 20,
    keyword,
    difficulty,
    maxTotalTimeMinutes,
}: PublicRecipeParams = {}): Promise<PageResponse<Recipe>> {
    const { data } = await api.get<ApiResponse<PageResponse<Recipe>>>("/api/recipes", {
        params: {
            page,
            size,
            ...(keyword ? { keyword } : {}),
            ...(difficulty ? { difficulty } : {}),
            ...(maxTotalTimeMinutes !== undefined ? { maxTotalTimeMinutes } : {}),
        },
    });
    return data.data;
}

/**
 * DELETE /api/recipes/{recipeId} — tác giả xoá mềm công thức của mình (PR #203).
 * Chỉ chủ sở hữu; xoá lại / không phải của mình đều `404 Recipe not found` (cố ý giống nhau).
 * Không có restore. Công thức biến mất khỏi mọi list và `GET /{id}` trả 404 với tất cả.
 */
export async function deleteRecipe(id: string): Promise<void> {
    await api.delete<ApiResponse<null>>(`/api/recipes/${id}`);
}

// `searchDishes` đã chuyển sang `@/shared/api/dishes` (3 feature cùng dùng).
export async function searchIngredients({ name, page = 0, size = 10 }: SuggestParams): Promise<PageResponse<Ingredient>> {
    const { data } = await api.get<ApiResponse<PageResponse<Ingredient>>>("/api/ingredients", {
        params: { page, size, sort: "name,asc", ...(name ? { name } : {}) },
    });
    return data.data;
}
