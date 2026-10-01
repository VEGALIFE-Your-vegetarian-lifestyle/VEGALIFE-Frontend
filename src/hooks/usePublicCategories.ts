import { useQuery } from "@tanstack/react-query";
import { getPublicCategories } from "@/services/categoryService";

interface UsePublicCategoriesParams {
    page?: number;
    size?: number;
    sort?: string;
    name?: string;
    enabled?: boolean;
}

export function usePublicCategories({
    page = 0,
    size = 20,
    sort = "name,asc",
    name = "",
    enabled = true,
}: UsePublicCategoriesParams) {
    return useQuery({
        queryKey: ["public-categories", { page, size, sort, name }],
        queryFn: () => getPublicCategories({ page, size, sort, name }),
        enabled,
    });
}
