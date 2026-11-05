import { useQuery } from "@tanstack/react-query";
import { getMySubscription } from "./subscriptionApi";

/** GET /api/subscriptions/me — hạn mức tháng của gói hiện tại. */
export function useSubscription(enabled = true) {
    return useQuery({
        queryKey: ["subscription", "me"],
        queryFn: getMySubscription,
        enabled,
        staleTime: 60_000,
    });
}
