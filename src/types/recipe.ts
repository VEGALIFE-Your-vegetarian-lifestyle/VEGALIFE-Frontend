/**
 * Nhóm 20 — recipe. `DOCS/API-REFERENCE.md` #38/#40.
 *
 * Không có endpoint đọc danh sách recipe của mình (`GET /api/recipes` không tồn tại),
 * nên FE chỉ tạo được rồi nhận response — xem `recipeService.ts`.
 */

export type RecipeDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface RecipeIngredientInput {
    /** ≤100 ký tự; unique case-insensitive trong một recipe. */
    name: string;
    /** >0, tối đa 3 chữ số thập phân. */
    amount: number;
    /** ≤30 ký tự. */
    unit: string;
}

/** #38 — `dishName` + tên nguyên liệu được BE trim+lowercase rồi find-or-create. */
export interface CreateRecipeRequest {
    /** ≤255. */
    name: string;
    /** ≤255 — BE trim+lowercase, tạo dish mới nếu chưa có (BR-RECP-002). */
    dishName: string;
    instructions: string;
    servings: number;
    /** 1–50 phần tử. */
    ingredients: RecipeIngredientInput[];
    description?: string | null;
    prepTimeMinutes?: number | null;
    cookTimeMinutes?: number | null;
    difficulty?: RecipeDifficulty | null;
}

export interface RecipeIngredient {
    ingredientId: string;
    /** Đã lowercase. */
    name: string;
    amount: number;
    unit: string;
}

export interface Recipe {
    id: string;
    userId: string;
    dishId: string;
    /** Đã lowercase. */
    dishName: string;
    name: string;
    description: string | null;
    instructions: string;
    prepTimeMinutes: number | null;
    cookTimeMinutes: number | null;
    servings: number;
    difficulty: RecipeDifficulty | null;
    ingredients: RecipeIngredient[];
    createdAt: string;
    updatedAt: string;
}

/** #24 — soft delete là derived, không lưu cột; recipe đã xoá vẫn được liệt kê. */
export type RecipeStatus = "ACTIVE" | "DELETED";

/** #24 `GET /api/admin/recipes` — thêm chủ sở hữu + trạng thái so với #38. */
export interface AdminRecipe extends Omit<Recipe, "dishName"> {
    status: RecipeStatus;
    dishName: string | null;
    categoryIds: string[];
    username: string;
    email: string;
}

/** #40 — autocomplete nguyên liệu. */
export interface Ingredient {
    id: string;
    name: string;
    createdAt: string;
}
