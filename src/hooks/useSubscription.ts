import { useQuery } from "@tanstack/react-query";
import { getMySubscription } from "@/services/subscriptionService";

/** #52 — gói AI + hạn mức tháng. Read-only, không có mutation. */
export function useMySubscription(enabled = true) {
    return useQuery({
        queryKey: ["ai-subscription"],
        queryFn: getMySubscription,
        enabled,
    });
}
