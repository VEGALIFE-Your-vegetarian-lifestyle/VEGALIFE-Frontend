import { useQuery } from "@tanstack/react-query";
import { getMealPlans } from "./api";
import type { MealPlanParams } from "./types";

/** Menu của một cửa sổ ngày. `staleTime` mặc định: AI chat có thể vừa tạo menu mới. */
export function useMealPlans({ from, to }: MealPlanParams) {
    return useQuery({
        queryKey: ["meal-plans", from, to],
        queryFn: () => getMealPlans({ from, to }),
    });
}
