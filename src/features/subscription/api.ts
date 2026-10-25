import { api } from "@/shared/api/client";
import type { ApiResponse, PageResponse } from "@/shared/types/common";
import type { AiPlan } from "@/features/nutrition-ai/types";
import type {
    CancelSubscriptionResponse,
    CheckoutResponse,
    PaymentDetail,
    PaymentItem,
    SubscriptionHistoryItem,
} from "./types";

/** GET /api/subscriptions — public, plain array đã sắp theo sort_order. */
export async function getPlans(): Promise<AiPlan[]> {
    const { data } = await api.get<ApiResponse<AiPlan[]>>("/api/subscriptions");
    return data.data;
}

/** GET /api/subscriptions/me/history — mỗi lần mua/gia hạn là 1 dòng, mới nhất trước. */
export async function getSubscriptionHistory(page = 0, size = 10): Promise<PageResponse<SubscriptionHistoryItem>> {
    const { data } = await api.get<ApiResponse<PageResponse<SubscriptionHistoryItem>>>("/api/subscriptions/me/history", {
        params: { page, size },
    });
    return data.data;
}

/** POST /api/subscriptions/me/cancel — hủy ngay, gọi lần 2 trả 409. */
export async function cancelSubscription(): Promise<CancelSubscriptionResponse> {
    const { data } = await api.post<ApiResponse<CancelSubscriptionResponse>>("/api/subscriptions/me/cancel");
    return data.data;
}

/** POST /api/subscriptions/me/purchase/eligibility — được mua thì 200, không được thì 400/409 kèm lý do. */
export async function checkPurchaseEligibility(planCode: string): Promise<void> {
    await api.post<ApiResponse<{ allowed: boolean }>>("/api/subscriptions/me/purchase/eligibility", { planCode });
}

/** POST /api/payments/checkout — trả `paymentUrl` đã ký, FE chuyển hướng sang VNPay. */
export async function createCheckout(planCode: string): Promise<CheckoutResponse> {
    const { data } = await api.post<ApiResponse<CheckoutResponse>>("/api/payments/checkout", { planCode });
    return data.data;
}

/** GET /api/payments — lịch sử thanh toán của chính mình, mới nhất trước. */
export async function getPayments(page = 0, size = 10): Promise<PageResponse<PaymentItem>> {
    const { data } = await api.get<ApiResponse<PageResponse<PaymentItem>>>("/api/payments", {
        params: { page, size },
    });
    return data.data;
}

/** GET /api/payments/{paymentId} — FE poll sau khi VNPay redirect về. */
export async function getPayment(paymentId: string): Promise<PaymentDetail> {
    const { data } = await api.get<ApiResponse<PaymentDetail>>(`/api/payments/${paymentId}`);
    return data.data;
}
