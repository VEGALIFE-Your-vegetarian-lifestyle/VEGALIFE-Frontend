/** AI Subscription (#51–#55) + Payment VNPay (#56–#59) — theo sheet "API Documentation" mục 25–26. */
import type { AiPlan } from "@/features/nutrition-ai/types";

export type SubscriptionRowStatus = "active" | "past_due" | "scheduled" | "cancelled" | "expired";

export interface SubscriptionHistoryItem {
    planCode: string;
    planName: string;
    status: SubscriptionRowStatus;
    startedAt: string | null;
    renewalDate: string | null;
    cancelledAt: string | null;
    createdAt: string;
}

export interface CancelSubscriptionResponse {
    status: "cancelled";
    cancelledAt: string;
}

export interface CheckoutResponse {
    paymentId: string;
    txnRef: string;
    planCode: string;
    amount: number;
    currency: string;
    status: "pending";
    paymentUrl: string;
}

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface PaymentItem {
    id: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    txnRef: string;
    paidAt: string | null;
    createdAt: string;
    subscription: { id: string; status: string; startedAt: string; renewalDate: string } | null;
    plan: AiPlan | null;
}

export interface PaymentDetail {
    paymentId: string;
    status: PaymentStatus;
    plan: AiPlan;
    amount: number;
    currency: string;
    createdAt: string;
    paidAt: string | null;
}
