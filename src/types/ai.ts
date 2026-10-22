/**
 * Kiểu cho nhóm 24 (AI Chatbot) và 25 (AI Subscription) — `DOCS/API-REFERENCE.md`.
 * Không thêm field nào ngoài spec.
 */

export type AiMessageRole = "user" | "assistant" | "system";

/** #47/#48 — `usage` của endpoint chat (cửa sổ tháng UTC). */
export interface AiUsage {
    used: number;
    limit: number;
    windowStart: string;
    windowEnd: string;
}

export interface AiMessageRequest {
    /** Bỏ trống để tạo hội thoại mới. */
    conversationId?: string;
    /** 1..4000 ký tự. */
    message: string;
}

export interface AiMessageResponse {
    conversationId: string;
    reply: string;
    usage: AiUsage;
}

/** #49 — `GET /api/ai/conversations` trả mảng phẳng, không phân trang. */
export interface AiConversationSummary {
    id: string;
    title: string;
    updatedAt: string;
}

export interface AiConversationMessage {
    role: AiMessageRole;
    content: string;
    createdAt: string;
}

/** #50 — history đầy đủ, sắp cũ → mới. */
export interface AiConversationDetail {
    id: string;
    title: string;
    updatedAt: string;
    messages: AiConversationMessage[];
}

export interface AiPlanPrice {
    amount: number;
    currency: string;
}

/** #51/#52 — gói AI. */
export interface AiPlan {
    code: string;
    name: string;
    monthlyRequestLimit: number;
    price: AiPlanPrice;
}

export interface AiSubscriptionUsage {
    used: number;
    limit: number;
    periodStart: string;
    periodEnd: string;
}

export interface AiLatestPayment {
    planCode: string;
    amount: number;
    currency: string;
    status: string;
    provider: string | null;
    paidAt: string;
}

/** #52 — `GET /api/subscriptions/me`. */
export interface AiSubscription {
    tier: "FREE" | "PRO";
    status: string;
    renewalDate: string | null;
    usage: AiSubscriptionUsage;
    currentPlan: AiPlan;
    latestPayment: AiLatestPayment | null;
}
