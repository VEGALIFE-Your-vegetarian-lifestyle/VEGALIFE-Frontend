import { useQuery } from "@tanstack/react-query";
import { getFeedPosts, type GetFeedParams } from "@/services/postService";

interface UseFeedPostsParams extends GetFeedParams {
    enabled?: boolean;
}

export function useFeedPosts({ page = 0, size = 20, enabled = true }: UseFeedPostsParams = {}) {
    return useQuery({
        queryKey: ["posts-feed", { page, size }],
        queryFn: () => getFeedPosts({ page, size }),
        enabled,
    });
}
