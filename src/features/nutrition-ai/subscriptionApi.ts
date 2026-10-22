import { api } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/types/common";
import type { AiSubscription } from "./types";

/** GET /api/subscriptions/me — gói AI của chính mình; chưa có row thì backend trả FREE. */
export async function getMySubscription(): Promise<AiSubscription> {
    const { data } = await api.get<ApiResponse<AiSubscription>>("/api/subscriptions/me");
    return data.data;
}
