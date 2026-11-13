import type { PostStatus } from "@/features/posts/types";
import type { Recipe } from "@/features/recipes/types";

/**
 * Một dòng của `GET /api/saved/posts`.
 *
 * Khác `PostListResponse`: có `userId`/`displayName`/`avatarUrl` (tác giả thật),
 * **không** có `type`/`videoUrl`. `PostCard` không đọc 2 field đó nên map sang
 * được — xem `toCardPost` ở `SavedPage`.
 */
export interface SavedPost {
    id: string;
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    title: string;
    content: string;
    rawContent?: unknown;
    featuredImageUrl: string | null;
    categoryIds: string[];
    mediaIds: string[];
    recipeIds: string[];
    status: PostStatus;
    rejectionReason: string | null;
    viewCount: number;
    publishedAt: string | null;
    createdAt: string;
}

/** `GET /api/saved/recipes` trả đúng shape `Recipe` (đủ nguyên liệu + dinh dưỡng). */
export type SavedRecipe = Recipe;
