import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/useAuth";
import { getMyRecipes } from "@/features/recipes/api";
import type { Recipe } from "@/features/recipes/types";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import {
    ID_SCAN_SIZE,
    getSavedPostIds,
    getSavedRecipeIds,
    getSavedRecipes,
    savePost,
    saveRecipe,
    unsavePost,
    unsaveRecipe,
} from "./api";

const POSTS_KEY = ["saved-posts"] as const;
const RECIPES_KEY = ["saved-recipes"] as const;
/** Danh sách id để biết nút Save có đang bật — tách khỏi list phân trang. */
const POST_IDS_KEY = ["saved-post-ids"] as const;
const RECIPE_IDS_KEY = ["saved-recipe-ids"] as const;

function useIdSet(key: readonly string[], fetcher: () => Promise<string[]>, enabled: boolean) {
    const { data } = useQuery({
        queryKey: key,
        queryFn: fetcher,
        enabled,
        staleTime: 5 * 60 * 1000,
        retry: false,
    });
    return data ?? [];
}

/** Nút Save của bài đăng. Khách bấm thì toast thay vì gửi request chắc chắn 401. */
export function useSavePost(postId: string) {
    const { t } = useTranslation(["saved", "common"]);
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    const ids = useIdSet(POST_IDS_KEY, getSavedPostIds, isAuthenticated);
    const saved = ids.includes(postId);

    const mutation = useMutation({
        mutationFn: () => (saved ? unsavePost(postId) : savePost(postId)),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: POST_IDS_KEY });
            const previous = queryClient.getQueryData<string[]>(POST_IDS_KEY) ?? [];
            queryClient.setQueryData<string[]>(
                POST_IDS_KEY,
                saved ? previous.filter((id) => id !== postId) : [...previous, postId],
            );
            return { previous };
        },
        onError: (error: unknown, _vars, context) => {
            if (context) queryClient.setQueryData(POST_IDS_KEY, context.previous);
            toast.error(getApiErrorMessage(error, t("common:error")));
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: POSTS_KEY });
            void queryClient.invalidateQueries({ queryKey: POST_IDS_KEY });
        },
    });

    const toggle = () => {
        if (!isAuthenticated) {
            toast.error(t("saved:loginRequired"));
            return;
        }
        mutation.mutate();
    };

    return { saved, toggle, isPending: mutation.isPending, isAuthenticated };
}

/** Nút Save trong dialog công thức. Công thức của chính mình thì không lưu. */
export function useSaveRecipe(recipe: { id: string; userId: string } | null) {
    const { t } = useTranslation(["saved", "common"]);
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    const own = !!recipe && !!user && recipe.userId === user.id;
    const ids = useIdSet(RECIPE_IDS_KEY, getSavedRecipeIds, isAuthenticated && !own);
    const recipeId = recipe?.id ?? "";
    const saved = ids.includes(recipeId);

    const mutation = useMutation({
        mutationFn: () => (saved ? unsaveRecipe(recipeId) : saveRecipe(recipeId)),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: RECIPE_IDS_KEY });
            const previous = queryClient.getQueryData<string[]>(RECIPE_IDS_KEY) ?? [];
            queryClient.setQueryData<string[]>(
                RECIPE_IDS_KEY,
                saved ? previous.filter((id) => id !== recipeId) : [...previous, recipeId],
            );
            return { previous };
        },
        onError: (error: unknown, _vars, context) => {
            if (context) queryClient.setQueryData(RECIPE_IDS_KEY, context.previous);
            toast.error(getApiErrorMessage(error, t("common:error")));
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: RECIPES_KEY });
            void queryClient.invalidateQueries({ queryKey: RECIPE_IDS_KEY });
        },
    });

    const toggle = () => {
        if (!isAuthenticated) {
            toast.error(t("saved:loginRequired"));
            return;
        }
        mutation.mutate();
    };

    return { saved, toggle, isPending: mutation.isPending, own, isAuthenticated };
}

/**
 * Tập công thức **gắn được** vào bài: của mình + đã lưu của người khác, dedupe theo id.
 *
 * ponytail: gộp ở client vì backend chưa có endpoint "mọi recipe tôi được dùng".
 * Lấy trang 100 đầu của `/api/saved/recipes` — đủ cho picker; vượt thì phải xin
 * backend trả chung một danh sách. Đây cũng là chỗ duy nhất phải sửa nếu
 * `POST /api/posts/{id}/recipes` từ chối recipe người khác.
 */
export function useAttachableRecipes(enabled = true): { items: Recipe[]; isLoading: boolean } {
    const { isAuthenticated } = useAuth();

    const { data: mine, isLoading: loadingMine } = useQuery({
        queryKey: ["my-recipes"],
        queryFn: () => getMyRecipes(),
        staleTime: 60_000,
        enabled,
    });
    const { data: saved, isLoading: loadingSaved } = useQuery({
        queryKey: [...RECIPES_KEY, "all"],
        queryFn: () => getSavedRecipes(0, ID_SCAN_SIZE),
        staleTime: 60_000,
        enabled: enabled && isAuthenticated,
    });

    const items = useMemo(() => {
        const all = [...(mine ?? []), ...(saved?.content ?? [])];
        const seen = new Set<string>();
        return all.filter((recipe) => {
            if (seen.has(recipe.id)) return false;
            seen.add(recipe.id);
            return true;
        });
    }, [mine, saved]);

    return { items, isLoading: loadingMine || loadingSaved };
}

/** Bỏ lưu ngay trên trang `/saved` — card biến mất khỏi danh sách. */
export function useRemoveSaved() {
    const { t } = useTranslation(["saved", "common"]);
    const queryClient = useQueryClient();

    const post = useMutation({
        mutationFn: unsavePost,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: POSTS_KEY });
            void queryClient.invalidateQueries({ queryKey: POST_IDS_KEY });
            toast.success(t("saved:toast.unsavedPost"));
        },
        onError: (error: unknown) => toast.error(getApiErrorMessage(error, t("common:error"))),
    });

    const recipe = useMutation({
        mutationFn: unsaveRecipe,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: RECIPES_KEY });
            void queryClient.invalidateQueries({ queryKey: RECIPE_IDS_KEY });
            toast.success(t("saved:toast.unsavedRecipe"));
        },
        onError: (error: unknown) => toast.error(getApiErrorMessage(error, t("common:error"))),
    });

    return { removePost: post, removeRecipe: recipe };
}
