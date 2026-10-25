import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    cancelSubscription,
    checkPurchaseEligibility,
    createCheckout,
    getPayment,
    getPayments,
    getPlans,
    getSubscriptionHistory,
} from "./api";

export function usePlans() {
    return useQuery({ queryKey: ["subscription", "plans"], queryFn: getPlans, staleTime: 5 * 60_000 });
}

export function useSubscriptionHistory(page: number, enabled = true) {
    return useQuery({
        queryKey: ["subscription", "history", page],
        queryFn: () => getSubscriptionHistory(page),
        enabled,
    });
}

export function usePayments(page: number, enabled = true) {
    return useQuery({ queryKey: ["payments", page], queryFn: () => getPayments(page), enabled });
}

/** Poll mỗi 3s trong lúc còn `pending` (IPN có thể đến trễ hơn redirect). */
export function usePayment(paymentId: string) {
    return useQuery({
        queryKey: ["payments", "detail", paymentId],
        queryFn: () => getPayment(paymentId),
        refetchInterval: (query) => (query.state.data?.status === "pending" ? 3000 : false),
    });
}

export function useCancelSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: cancelSubscription,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscription"] });
        },
    });
}

/** Kiểm tra điều kiện rồi mới tạo phiên thanh toán; trả `paymentUrl` để chuyển hướng. */
export function useBuyPlan() {
    return useMutation({
        mutationFn: async (planCode: string) => {
            await checkPurchaseEligibility(planCode);
            return createCheckout(planCode);
        },
    });
}
