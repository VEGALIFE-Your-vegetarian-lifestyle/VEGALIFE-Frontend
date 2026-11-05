import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublicCategories } from "./api";

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

const CATEGORY_NAMES_PARAMS = { page: 0, size: 100, sort: "name,asc" };

/**
 * Map UUID → tên danh mục. Bài chỉ trả `categoryIds`, nên chỗ nào cần hiện tên
 * thì tra qua đây; thiếu thì chỗ gọi tự fallback về UUID.
 */
export function useCategoryNames(params: UsePublicCategoriesParams = CATEGORY_NAMES_PARAMS) {
    const { data } = usePublicCategories(params);

    return useMemo(() => {
        const map = new Map<string, string>();
        for (const category of data?.content ?? []) map.set(category.id, category.name);
        return map;
    }, [data]);
}
