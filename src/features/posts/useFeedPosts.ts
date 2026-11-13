import { useQuery } from "@tanstack/react-query";
import { getFeedPosts, type GetFeedParams } from "./api";

interface UseFeedPostsParams extends GetFeedParams {
    enabled?: boolean;
}

export function useFeedPosts({ page = 0, size = 20, enabled = true, ...filters }: UseFeedPostsParams = {}) {
    const { keyword, categoryId, createdFrom, createdTo } = filters;

    return useQuery({
        // Cả bộ lọc nằm trong key — đổi từ khoá/category là request mới, không dùng cache cũ.
        queryKey: ["posts-feed", { page, size, keyword, categoryId, createdFrom, createdTo }],
        queryFn: () => getFeedPosts({ page, size, keyword, categoryId, createdFrom, createdTo }),
        enabled,
    });
}
