// @vitest-environment node
/** Test billing & subscription service — V48 Request-Allowance Release */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import {
    acquirePlan,
    getPayment,
    getPayments,
    getPlans,
    getSubscriptionHistory,
} from "../api";

vi.mock("@/shared/api/client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

const ok = <T,>(data: T) => ({ data: { success: true, message: "ok", data } });

beforeEach(() => vi.resetAllMocks());

describe("getPlans (V48)", () => {
    it("GET /api/subscriptions trả về danh sách gói với requestQuota", async () => {
        const plans = [
            {
                code: "FREE",
                name: "Free",
                description: "5 câu hỏi miễn phí",
                requestQuota: 5,
                price: { amount: 0, currency: "VND" },
            },
            {
                code: "PRO",
                name: "Pro",
                description: null,
                requestQuota: 500,
                price: { amount: 49000, currency: "VND" },
            },
        ];
        vi.mocked(api.get).mockResolvedValue(ok(plans));

        const result = await getPlans();
        expect(api.get).toHaveBeenCalledWith("/api/subscriptions");
        expect(result).toEqual(plans);
    });
});

describe("acquirePlan (V48 Single Entry Point)", () => {
    it("POST /api/subscriptions/acquire với gói FREE trả action CLAIMED", async () => {
        const claimRes = {
            planCode: "FREE",
            action: "CLAIMED" as const,
            remainingUsage: 5,
        };
        vi.mocked(api.post).mockResolvedValue(ok(claimRes));

        const result = await acquirePlan("FREE");
        expect(api.post).toHaveBeenCalledWith("/api/subscriptions/acquire", { planCode: "FREE" });
        expect(result.action).toBe("CLAIMED");
        expect(result.remainingUsage).toBe(5);
    });

    it("POST /api/subscriptions/acquire với gói trả phí trả action CHECKOUT_CREATED và paymentUrl", async () => {
        const checkoutRes = {
            planCode: "PRO",
            action: "CHECKOUT_CREATED" as const,
            remainingUsage: 0,
            paymentId: "pay-123",
            txnRef: "txn-123",
            paymentUrl: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?foo=bar",
            amount: 49000,
            currency: "VND",
            status: "pending",
        };
        vi.mocked(api.post).mockResolvedValue(ok(checkoutRes));

        const result = await acquirePlan("PRO");
        expect(api.post).toHaveBeenCalledWith("/api/subscriptions/acquire", { planCode: "PRO" });
        expect(result.action).toBe("CHECKOUT_CREATED");
        expect(result.paymentUrl).toContain("sandbox.vnpayment.vn");
    });
});

describe("getSubscriptionHistory (V48)", () => {
    it("GET /api/subscriptions/me/history với grantedAt và source", async () => {
        const historyData = {
            content: [
                {
                    planCode: "FREE",
                    planName: "Free",
                    source: "CLAIM" as const,
                    grantedAt: "2026-11-05T08:00:00Z",
                    paymentId: null,
                    amount: null,
                    currency: null,
                    status: null,
                    createdAt: "2026-11-05T08:00:00Z",
                },
            ],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
            first: true,
            last: true,
        };
        vi.mocked(api.get).mockResolvedValue(ok(historyData));

        const result = await getSubscriptionHistory(0, 10);
        expect(api.get).toHaveBeenCalledWith("/api/subscriptions/me/history", {
            params: { page: 0, size: 10 },
        });
        expect(result).toEqual(historyData);
    });
});

describe("getPayments & getPayment (V48)", () => {
    it("GET /api/payments trả về lịch sử giao dịch tiền thuần túy", async () => {
        const paymentsData = {
            content: [
                {
                    id: "p1",
                    amount: 49000,
                    currency: "VND",
                    status: "succeeded",
                    provider: "vnpay",
                    txnRef: "TXN123",
                    paidAt: "2026-11-05T09:00:00Z",
                    createdAt: "2026-11-05T08:55:00Z",
                },
            ],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
            first: true,
            last: true,
        };
        vi.mocked(api.get).mockResolvedValue(ok(paymentsData));

        const result = await getPayments(0, 10);
        expect(api.get).toHaveBeenCalledWith("/api/payments", {
            params: { page: 0, size: 10 },
        });
        expect(result).toEqual(paymentsData);
    });

    it("GET /api/payments/{paymentId} trả về chi tiết thanh toán không kèm plan", async () => {
        const detail = {
            paymentId: "p1",
            status: "succeeded" as const,
            amount: 49000,
            currency: "VND",
            createdAt: "2026-11-05T08:55:00Z",
            paidAt: "2026-11-05T09:00:00Z",
        };
        vi.mocked(api.get).mockResolvedValue(ok(detail));

        const result = await getPayment("p1");
        expect(api.get).toHaveBeenCalledWith("/api/payments/p1");
        expect(result).toEqual(detail);
    });
});
