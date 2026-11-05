/** AI Subscription & Payment VNPay — V48 Request-Allowance Release */
import type { AiPlan } from "@/features/nutrition-ai/types";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

/**
 * Phản hồi từ POST /api/subscriptions/acquire
 * Phân nhánh theo `action`:
 * - "CLAIMED": Nhận gói miễn phí thành công, `remainingUsage` được cộng ngay.
 * - "CHECKOUT_CREATED": Tạo đơn VNPay thành công, kèm `paymentUrl` để redirect.
 */
export interface AcquirePlanResponse {
    planCode: string;
    action: "CLAIMED" | "CHECKOUT_CREATED";
    remainingUsage: number;
    paymentId?: string;
    txnRef?: string;
    paymentUrl?: string;
    amount?: number;
    currency?: string;
    status?: string;
}

/**
 * GET /api/subscriptions/me/history (V48)
 * Lịch sử các lần sở hữu gói (Claim miễn phí hoặc Mua qua VNPay).
 */
export interface SubscriptionHistoryItem {
    planCode: string;
    planName: string;
    source: "PURCHASE" | "CLAIM";
    grantedAt: string | null;
    paymentId: string | null;
    amount: number | null;
    currency: string | null;
    status: PaymentStatus | null;
    createdAt: string;
    /** @deprecated V48 renamed to grantedAt */
    startedAt?: string | null;
    /** @deprecated V48 removed */
    renewalDate?: string | null;
    /** @deprecated V48 removed */
    cancelledAt?: string | null;
}

/**
 * GET /api/payments (V48)
 * Lịch sử giao dịch tiền, không còn kèm block plan/subscription.
 */
export interface PaymentItem {
    id: string;
    amount: number;
    currency: string;
    status: PaymentStatus | string;
    provider: string;
    txnRef: string;
    paidAt: string | null;
    createdAt: string;
    /** @deprecated V48 removed from API; mapped client-side */
    plan?: AiPlan | null;
    /** @deprecated V48 removed from API */
    subscription?: { id: string; status: string; startedAt: string; renewalDate: string } | null;
}

/**
 * GET /api/payments/{paymentId} (V48)
 */
export interface PaymentDetail {
    paymentId: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    createdAt: string;
    paidAt: string | null;
    /** @deprecated V48 removed from API; mapped client-side or fallback */
    plan?: AiPlan | null;
}

/** @deprecated V48 deleted POST /api/subscriptions/me/cancel */
export interface CancelSubscriptionResponse {
    status: "cancelled";
    cancelledAt: string;
}

/** @deprecated V48 replaced by AcquirePlanResponse */
export interface CheckoutResponse {
    paymentId: string;
    txnRef: string;
    planCode: string;
    amount: number;
    currency: string;
    status: "pending";
    paymentUrl: string;
}

/** @deprecated V48 replaced by PaymentStatus */
export type SubscriptionRowStatus = "active" | "past_due" | "scheduled" | "cancelled" | "expired";
