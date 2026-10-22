/** AI Chatbot + AI Subscription — theo `docs/apis` nhóm 24–25 (BE đã xong #47–#55). */

export type AiMessageRole = "user" | "assistant" | "system";

/**
 * Hạn mức tháng. #47 trả `windowStart`/`windowEnd`, #52 trả `periodStart`/`periodEnd`
 * cho cùng một khái niệm — khai báo cả hai, chỗ đọc tự chọn field có mặt.
 */
export interface AiUsage {
    used: number;
    limit: number;
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
    monthlyRequestLimit: number;
    price: { amount: number; currency: string };
}

export interface AiSubscription {
    tier: "FREE" | "PRO";
    status: "active" | "cancelled" | "past_due";
    renewalDate: string | null;
    usage: AiUsage;
    currentPlan: AiPlan;
    latestPayment: {
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
