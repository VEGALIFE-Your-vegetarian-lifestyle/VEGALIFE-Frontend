import { api } from "@/shared/api/client";
import type { ApiResponse, PageResponse } from "@/shared/types/common";
import type { CreateRecipeRequest, Dish, Ingredient, Recipe } from "./types";

/** POST /api/recipes — owner lấy từ JWT; `dishName`/ingredient name được find-or-create. */
export async function createRecipe(request: CreateRecipeRequest): Promise<Recipe> {
    const { data } = await api.post<ApiResponse<Recipe>>("/api/recipes", request);
    return data.data;
}

/** `name` là substring không phân biệt hoa thường. Endpoint cần JWT (khác `/api/categories`). */
export interface SuggestParams {
    name: string;
    page?: number;
    size?: number;
}

export async function searchDishes({ name, page = 0, size = 10 }: SuggestParams): Promise<PageResponse<Dish>> {
    const { data } = await api.get<ApiResponse<PageResponse<Dish>>>("/api/dishes", {
        params: { page, size, sort: "name,asc", name },
    });
    return data.data;
}

export async function searchIngredients({ name, page = 0, size = 10 }: SuggestParams): Promise<PageResponse<Ingredient>> {
    const { data } = await api.get<ApiResponse<PageResponse<Ingredient>>>("/api/ingredients", {
        params: { page, size, sort: "name,asc", name },
    });
    return data.data;
}
