import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    acquirePlan,
    cancelSubscription,
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

/**
 * V48: Nhận gói miễn phí hoặc tạo phiên thanh toán VNPay qua POST /api/subscriptions/acquire
 */
export function useAcquirePlan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (planCode: string) => acquirePlan(planCode),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["subscription"] });
        },
    });
}

/** Alias cho useAcquirePlan */
export const useBuyPlan = useAcquirePlan;

/** @deprecated V48 deleted on backend */
export function useCancelSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: cancelSubscription,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscription"] });
        },
    });
}
