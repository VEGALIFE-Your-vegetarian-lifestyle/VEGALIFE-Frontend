import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import SubscriptionPage from "../SubscriptionPage";
import * as billingApi from "../../../api";
import * as subApi from "@/features/nutrition-ai/subscriptionApi";

vi.mock("../../../api", () => ({
    getPlans: vi.fn(),
    getSubscriptionHistory: vi.fn(),
    getPayments: vi.fn(),
    acquirePlan: vi.fn(),
}));

vi.mock("@/features/nutrition-ai/subscriptionApi", () => ({
    getMySubscription: vi.fn(),
}));

vi.mock("@/features/auth/useAuth", () => ({
    useAuth: () => ({
        isAuthenticated: true,
        user: { id: "u1", username: "user1" },
    }),
}));

const mockPlans = [
    {
        code: "FREE",
        name: "Free",
        description: "5 câu hỏi khởi đầu miễn phí",
        requestQuota: 5,
        price: { amount: 0, currency: "VND" },
    },
    {
        code: "PRO",
        name: "Pro",
        description: "500 câu hỏi chất lượng cao",
        requestQuota: 500,
        price: { amount: 49000, currency: "VND" },
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(billingApi.getPlans).mockResolvedValue(mockPlans);
    vi.mocked(subApi.getMySubscription).mockResolvedValue({ remainingUsage: 5 });
    vi.mocked(billingApi.getSubscriptionHistory).mockResolvedValue({
        content: [
            {
                planCode: "FREE",
                planName: "Free",
                source: "CLAIM",
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
    });
    vi.mocked(billingApi.getPayments).mockResolvedValue({
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
    });
});

describe("SubscriptionPage (V48 Request Allowance)", () => {
    it("hiển thị số dư câu hỏi còn lại và không hiển thị nút hủy gói", async () => {
        renderWithProviders(<SubscriptionPage embedded />);

        await waitFor(() => {
            expect(screen.getByText(/Available: 5 requests|Khả dụng: 5 câu hỏi/i)).toBeInTheDocument();
        });

        // Không còn nút và copy hủy gói (V48 ADR-021)
        expect(screen.queryByText(/hủy gói|cancel subscription/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/gia hạn vào|renews on/i)).not.toBeInTheDocument();
    });

    it("hiển thị danh sách các gói với requestQuota và nút Nhận miễn phí / Mua gói", async () => {
        renderWithProviders(<SubscriptionPage embedded />);

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Free" })).toBeInTheDocument();
            expect(screen.getByRole("heading", { name: "Pro" })).toBeInTheDocument();
        });

        // Gói FREE có nút Nhận miễn phí (Claim)
        const claimBtn = screen.getByRole("button", { name: /nhận miễn phí|claim/i });
        expect(claimBtn).toBeInTheDocument();

        // Gói PRO có nút Mua gói
        const buyBtn = screen.getByRole("button", { name: /mua gói|purchase|buy/i });
        expect(buyBtn).toBeInTheDocument();
    });

    it("bấm nút Nhận miễn phí sẽ gọi acquirePlan với code FREE", async () => {
        vi.mocked(billingApi.acquirePlan).mockResolvedValue({
            planCode: "FREE",
            action: "CLAIMED",
            remainingUsage: 5,
        });

        renderWithProviders(<SubscriptionPage embedded />);

        const claimBtn = await screen.findByRole("button", { name: /nhận miễn phí|claim/i });
        await userEvent.click(claimBtn);

        expect(billingApi.acquirePlan).toHaveBeenCalledWith("FREE");
    });
});
