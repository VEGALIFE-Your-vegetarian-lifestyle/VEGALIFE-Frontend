import { api } from "@/shared/api/client";
import type { ApiResponse, PageResponse } from "@/shared/types/common";
import type { AiPlan } from "@/features/nutrition-ai/types";
import type {
    AcquirePlanResponse,
    CancelSubscriptionResponse,
    CheckoutResponse,
    PaymentDetail,
    PaymentItem,
    SubscriptionHistoryItem,
} from "./types";

/** GET /api/subscriptions — public, danh sách các gói AI đang hoạt động. */
export async function getPlans(): Promise<AiPlan[]> {
    const { data } = await api.get<ApiResponse<AiPlan[]>>("/api/subscriptions");
    return data.data;
}

/** GET /api/subscriptions/me/history — lịch sử sở hữu gói (Claim hoặc VNPay). */
export async function getSubscriptionHistory(page = 0, size = 10): Promise<PageResponse<SubscriptionHistoryItem>> {
    const { data } = await api.get<ApiResponse<PageResponse<SubscriptionHistoryItem>>>("/api/subscriptions/me/history", {
        params: { page, size },
    });
    return data.data;
}

/**
 * POST /api/subscriptions/acquire (V48 Single Entry Point)
 * Nhận gói miễn phí (FREE) hoặc tạo phiên thanh toán VNPay (PRO).
 */
export async function acquirePlan(planCode: string): Promise<AcquirePlanResponse> {
    const { data } = await api.post<ApiResponse<AcquirePlanResponse>>("/api/subscriptions/acquire", { planCode });
    return data.data;
}

/** GET /api/payments — lịch sử thanh toán VNPay của bản thân. */
export async function getPayments(page = 0, size = 10): Promise<PageResponse<PaymentItem>> {
    const { data } = await api.get<ApiResponse<PageResponse<PaymentItem>>>("/api/payments", {
        params: { page, size },
    });
    return data.data;
}

/** GET /api/payments/{paymentId} — poll trạng thái thanh toán sau redirect. */
export async function getPayment(paymentId: string): Promise<PaymentDetail> {
    const { data } = await api.get<ApiResponse<PaymentDetail>>(`/api/payments/${paymentId}`);
    return data.data;
}

/** @deprecated V48 deleted; use acquirePlan instead */
export async function createCheckout(planCode: string): Promise<CheckoutResponse> {
    const res = await acquirePlan(planCode);
    return res as unknown as CheckoutResponse;
}

/** @deprecated V48 deleted; no pre-check needed */
export async function checkPurchaseEligibility(): Promise<void> {
    // no-op for backward compatibility
}

/** @deprecated V48 deleted; subscriptions no longer cancelable */
export async function cancelSubscription(): Promise<CancelSubscriptionResponse> {
    const { data } = await api.post<ApiResponse<CancelSubscriptionResponse>>("/api/subscriptions/me/cancel");
    return data.data;
}
