import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { deleteRecipe } from "./api";
import { getApiErrorMessage, isNotFound } from "@/shared/utils/apiError";

/**
 * Xoá mềm công thức của chính mình (PR #203).
 * `404` = đã xoá rồi (retry sau timeout, hoặc tab khác xoá trước) → coi như thành công,
 * không báo lỗi, đúng khuyến nghị của backend.
 * Công thức biến mất khỏi: /recipes, /saved, và bộ chọn công thức khi soạn bài → invalidate cả ba.
 */
export function useDeleteRecipe(onDone?: () => void) {
    const { t } = useTranslation(["recipe", "common"]);
    const queryClient = useQueryClient();

    const invalidate = () => {
        void queryClient.invalidateQueries({ queryKey: ["my-recipes"] });
        void queryClient.invalidateQueries({ queryKey: ["saved-recipes"] });
        void queryClient.invalidateQueries({ queryKey: ["saved-recipe-ids"] });
    };

    return useMutation({
        mutationFn: deleteRecipe,
        onSuccess: () => {
            toast.success(t("recipe:myRecipes.delete.done"));
            invalidate();
            onDone?.();
        },
        onError: (error: unknown) => {
            if (isNotFound(error)) {
                invalidate();
                onDone?.();
                return;
            }
            toast.error(getApiErrorMessage(error, t("common:error")));
        },
    });
}
