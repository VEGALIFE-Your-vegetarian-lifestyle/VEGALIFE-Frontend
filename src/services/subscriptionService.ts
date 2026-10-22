import { api } from "@/services/api";
import type { ApiResponse } from "@/types/common";
import type { AiSubscription } from "@/types/ai";

/**
 * Nhóm 25 — AI Subscription. Chỉ nối #52 (đọc hạn mức hiển thị trên trang chat).
 *
 * ponytail: bỏ qua #51 (danh sách gói), #53 (lịch sử), #54 (huỷ), #55 (điều kiện
 * mua) — Phase 2 chỉ cần hiển thị quota, không có luồng thanh toán. Thêm khi làm
 * trang nâng cấp gói.
 */

/** #52 — gói hiện tại + usage tháng UTC. Không có row thì backend tự synth FREE. */
export async function getMySubscription(): Promise<AiSubscription> {
    const response = await api.get<ApiResponse<AiSubscription>>("/api/subscriptions/me");
    return response.data.data;
}
