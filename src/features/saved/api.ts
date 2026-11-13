import { api } from "@/shared/api/client";
import type { ApiResponse, PageResponse } from "@/shared/types/common";
import type { SavedPost, SavedRecipe } from "./types";

/**
 * `/api/saved/*` — 6 endpoint, không có endpoint "đã lưu hay chưa".
 * ponytail: trạng thái nút Save lấy bằng cách tải **một trang 100 mục** mỗi danh sách
 * rồi cache thành Set id. Vượt 100 mục thì phải xin backend trả cờ `saved` trên
 * từng bài/recipe, hoặc thêm `GET /api/saved/posts/{id}/exists`.
 */
export const ID_SCAN_SIZE = 100;

export async function getSavedPosts(page = 0, size = 12): Promise<PageResponse<SavedPost>> {
    const { data } = await api.get<ApiResponse<PageResponse<SavedPost>>>("/api/saved/posts", {
        params: { page, size },
    });
    return data.data;
}

export async function getSavedRecipes(page = 0, size = 12): Promise<PageResponse<SavedRecipe>> {
    const { data } = await api.get<ApiResponse<PageResponse<SavedRecipe>>>("/api/saved/recipes", {
        params: { page, size },
    });
    return data.data;
}

/** Toggle: gọi lại khi đã lưu là lưu lại (idempotent ở BE). */
export async function savePost(postId: string): Promise<void> {
    await api.post(`/api/saved/posts/${postId}`);
}

export async function unsavePost(postId: string): Promise<void> {
    await api.delete(`/api/saved/posts/${postId}`);
}

export async function saveRecipe(recipeId: string): Promise<void> {
    await api.post(`/api/saved/recipes/${recipeId}`);
}

export async function unsaveRecipe(recipeId: string): Promise<void> {
    await api.delete(`/api/saved/recipes/${recipeId}`);
}

/** Chỉ id — dùng cho trạng thái nút Save. Xem `ID_SCAN_SIZE`. */
export async function getSavedPostIds(): Promise<string[]> {
    const page = await getSavedPosts(0, ID_SCAN_SIZE);
    return page.content.map((item) => item.id);
}

export async function getSavedRecipeIds(): Promise<string[]> {
    const page = await getSavedRecipes(0, ID_SCAN_SIZE);
    return page.content.map((item) => item.id);
}
