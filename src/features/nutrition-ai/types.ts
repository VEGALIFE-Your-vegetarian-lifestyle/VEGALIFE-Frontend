/** AI Chatbot + AI Subscription — theo `docs/apis` nhóm 24–25 (V48 Request-Allowance Release). */

export type AiMessageRole = "user" | "assistant" | "system";

/**
 * Hạn mức câu hỏi AI.
 * V48: Chỉ còn `remainingUsage` (số câu hỏi còn lại, không bao giờ hết hạn).
 * Giữ các trường cũ dạng optional để tránh vỡ component phụ trợ.
 */
export interface AiUsage {
    remainingUsage: number;
    used?: number;
    limit?: number;
    windowStart?: string;
    windowEnd?: string;
    periodStart?: string;
    periodEnd?: string;
}

export interface AiConversationSummary {
    id: string;
    title: string;
    updatedAt: string;
}

export interface AiMessage {
    role: AiMessageRole;
    content: string;
    createdAt: string;
}

export interface AiConversationDetail {
    id: string;
    title: string;
    updatedAt: string;
    messages: AiMessage[];
}

/** `conversationId` bỏ trống = tạo hội thoại mới. */
export interface AiSendMessageRequest {
    conversationId?: string;
    message: string;
}

export interface AiSendMessageResponse {
    conversationId: string;
    reply: string;
    usage: AiUsage;
}

export interface AiPlan {
    code: string;
    name: string;
    description?: string | null;
    requestQuota: number;
    /** @deprecated V48 renamed to requestQuota */
    monthlyRequestLimit?: number;
    price: { amount: number; currency: string };
}

/**
 * GET /api/subscriptions/me (V48)
 * Backend chỉ trả về `{ remainingUsage: number }`.
 */
export interface AiSubscription {
    tier?: "FREE" | "PRO";
    status?: "active" | "cancelled" | "past_due";
    renewalDate?: string | null;
    /**
     * Backend cũng bỏ hẳn `usage` khi user chưa từng mua gói (giống `currentPlan`).
     * Đọc qua optional chaining, đừng giả định có.
     */
    usage?: AiUsage;
    remainingUsage?: number;
    /**
     * Backend BỎ HẲN field này (không phải `null`) khi user chưa từng mua gói —
     * đã gặp crash `Cannot read properties of undefined (reading 'name')` ở
     * `AiNutritionPage` và `SubscriptionPage`. Luôn đọc qua optional chaining.
     */
    currentPlan?: AiPlan;
    latestPayment?: {
        planCode: string;
        amount: number;
        currency: string;
        status: string;
        provider: string | null;
        paidAt: string;
    } | null;
}

/** Khớp validation backend (`message` 1..4000). */
export const MAX_MESSAGE_LENGTH = 4000;
