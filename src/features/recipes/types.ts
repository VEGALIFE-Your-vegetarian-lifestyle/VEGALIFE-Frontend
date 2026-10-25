/** Độ khó — `chk_difficulty` ở backend: EASY | MEDIUM | HARD. */
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

/** Một dòng nguyên liệu trong form (chưa gửi lên). */
export interface RecipeIngredientInput {
    name: string;
    amount: string;
    unit: string;
}

/** Một dòng nguyên liệu backend trả về — `name` đã trim + lowercase. */
export interface RecipeIngredient {
    ingredientId: string;
    name: string;
    amount: number;
    unit: string;
}

/**
 * POST /api/recipes — owner lấy từ JWT, `dishName` find-or-create phía server.
 * `description` / `prepTimeMinutes` / `cookTimeMinutes` / `difficulty` bỏ trống được.
 */
export interface CreateRecipeRequest {
    name: string;
    /** Trim + lowercase ở server; trùng tên thì dùng lại dish cũ. */
    dishName: string;
    instructions: string;
    servings: number;
    ingredients: { name: string; amount: number; unit: string }[];
    description?: string | null;
    prepTimeMinutes?: number | null;
    cookTimeMinutes?: number | null;
    difficulty?: Difficulty | null;
}

export interface Recipe {
    id: string;
    userId: string;
    dishId: string;
    dishName: string;
    name: string;
    description: string | null;
    instructions: string;
    prepTimeMinutes: number | null;
    cookTimeMinutes: number | null;
    servings: number;
    difficulty: Difficulty | null;
    ingredients: RecipeIngredient[];
    createdAt: string;
    updatedAt: string;
}

/**
 * GET /api/admin/recipes — row đầy đủ cho admin.
 * Khác `Recipe`: có `status` (soft-delete suy ra từ `deleted_at`, không lưu cột),
 * `username`/`email` của chủ recipe và `categoryIds` (resolve qua post_recipe).
 */
export interface AdminRecipe extends Omit<Recipe, "dishName"> {
    /** Admin list trả `null` được, khác response của `POST /api/recipes`. */
    dishName: string | null;
    status: RecipeStatus;
    username: string;
    email: string;
    categoryIds: string[];
}

/** `ACTIVE` | `DELETED` — derived ở server; bản ghi xoá mềm vẫn nằm trong danh sách. */
export type RecipeStatus = "ACTIVE" | "DELETED";

/**
 * `sort` hợp lệ của `GET /api/admin/recipes` (whitelist backend) — kèm hướng.
 * Sai giá trị → 400.
 */
export type RecipeSort = "createdAt,desc" | "updatedAt,desc" | "name,asc";

/** `GET /api/dishes` — gợi ý tên món, chỉ đọc. */
export interface Dish {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    cuisineType: string | null;
    createdAt: string;
}

/** `GET /api/ingredients` — gợi ý tên nguyên liệu, không có cột nutrition. */
export interface Ingredient {
    id: string;
    name: string;
    createdAt: string;
}
