import { api } from "@/services/api";
import type { ApiResponse } from "@/types/common";
import type { AiSubscription } from "@/types/ai";

/** GET /api/subscriptions/me — gói AI của chính mình; chưa có row thì backend trả FREE. */
export async function getMySubscription(): Promise<AiSubscription> {
    const { data } = await api.get<ApiResponse<AiSubscription>>("/api/subscriptions/me");
    return data.data;
}
