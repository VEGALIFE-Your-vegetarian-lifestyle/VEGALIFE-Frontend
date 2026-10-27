import { api } from "@/shared/api/client";
import type { ApiResponse, PageResponse } from "@/shared/types/common";
import type { SuggestParams } from "@/shared/api/dishes";
import type { CreateRecipeRequest, Ingredient, Recipe } from "./types";

/** POST /api/recipes — owner lấy từ JWT; `dishName`/ingredient name được find-or-create. */
export async function createRecipe(request: CreateRecipeRequest): Promise<Recipe> {
    const { data } = await api.post<ApiResponse<Recipe>>("/api/recipes", request);
    return data.data;
}

// `searchDishes` đã chuyển sang `@/shared/api/dishes` (3 feature cùng dùng).
export async function searchIngredients({ name, page = 0, size = 10 }: SuggestParams): Promise<PageResponse<Ingredient>> {
    const { data } = await api.get<ApiResponse<PageResponse<Ingredient>>>("/api/ingredients", {
        params: { page, size, sort: "name,asc", ...(name ? { name } : {}) },
    });
    return data.data;
}
