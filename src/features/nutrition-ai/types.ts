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
    remainingUsage: number;
    /** @deprecated V48 removed */
    tier?: "FREE" | "PRO";
    /** @deprecated V48 removed */
    status?: "active" | "cancelled" | "past_due";
    /** @deprecated V48 removed */
    renewalDate?: string | null;
    /** @deprecated V48 removed */
    usage?: AiUsage;
    /** @deprecated V48 removed */
    currentPlan?: AiPlan;
    /** @deprecated V48 removed */
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
