import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import AiNutritionPage from "../AiNutritionPage";
import * as authHook from "@/features/auth/useAuth";
import * as subApi from "../subscriptionApi";
import * as billingApi from "@/features/subscription/api";
import * as aiApi from "../api";
import type { User } from "@/shared/types/user";

vi.mock("@/features/auth/useAuth", () => ({
    useAuth: vi.fn(),
}));

vi.mock("../subscriptionApi", () => ({
    getMySubscription: vi.fn(),
}));

vi.mock("../api", () => ({
    getAiConversations: vi.fn(),
    getAiConversation: vi.fn(),
    sendAiMessage: vi.fn(),
}));

vi.mock("@/features/subscription/api", () => ({
    getSubscriptionHistory: vi.fn(),
}));

const mockUser: User = {
    id: "u1",
    username: "testuser",
    email: "test@example.com",
    role: "USER",
    status: "activated",
};

describe("AiNutritionPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(aiApi.getAiConversations).mockResolvedValue([]);
        vi.mocked(billingApi.getSubscriptionHistory).mockResolvedValue({
            content: [],
            page: 0,
            size: 10,
            totalElements: 0,
            totalPages: 0,
            first: true,
            last: true,
        });
    });

    it("chưa đăng nhập: render giao diện khoá và lời mời đăng nhập, không sập", async () => {
        vi.mocked(authHook.useAuth).mockReturnValue({
            isAuthenticated: false,
            isAdmin: false,
            user: null,
            profile: null,
            accessToken: null,
            rememberMe: false,
            setAuth: vi.fn(),
            clearAuth: vi.fn(),
            setAccessToken: vi.fn(),
            setProfile: vi.fn(),
        });

        renderWithProviders(<AiNutritionPage />);

        expect(await screen.findByText(/Trợ lý AI Dinh dưỡng|Nutrition AI Assistant/i)).toBeInTheDocument();
        expect(screen.getByText(/Đăng nhập để hỏi trợ lý|Sign in to chat with assistant/i)).toBeInTheDocument();
    });

    it("đã đăng nhập với dữ liệu subscription thật từ backend ({ remainingUsage: 15 }): không bị TypeError crash", async () => {
        vi.mocked(authHook.useAuth).mockReturnValue({
            isAuthenticated: true,
            isAdmin: false,
            user: mockUser,
            profile: null,
            accessToken: "mock-token",
            rememberMe: false,
            setAuth: vi.fn(),
            clearAuth: vi.fn(),
            setAccessToken: vi.fn(),
            setProfile: vi.fn(),
        });

        vi.mocked(subApi.getMySubscription).mockResolvedValue({
            remainingUsage: 15,
        });

        renderWithProviders(<AiNutritionPage />);

        expect(await screen.findByText(/Trợ lý AI Dinh dưỡng|Nutrition AI Assistant/i)).toBeInTheDocument();
        expect(await screen.findByText(/Còn 15 câu hỏi|15 AI requests remaining/i)).toBeInTheDocument();
        // Chưa từng mua → có nhãn "Miễn phí"/"Free" cạnh số dư.
        expect(screen.getByText(/Miễn phí|Free/i)).toBeInTheDocument();
    });

    it("đã mua gói (history có PURCHASE succeeded): bỏ chữ Free, chỉ hiện số request còn lại", async () => {
        vi.mocked(authHook.useAuth).mockReturnValue({
            isAuthenticated: true,
            isAdmin: false,
            user: mockUser,
            profile: null,
            accessToken: "mock-token",
            rememberMe: false,
            setAuth: vi.fn(),
            clearAuth: vi.fn(),
            setAccessToken: vi.fn(),
            setProfile: vi.fn(),
        });

        vi.mocked(subApi.getMySubscription).mockResolvedValue({ remainingUsage: 40 });
        vi.mocked(billingApi.getSubscriptionHistory).mockResolvedValue({
            content: [
                {
                    planCode: "PRO",
                    planName: "Pro",
                    source: "PURCHASE",
                    grantedAt: "2026-11-01T00:00:00Z",
                    paymentId: "p1",
                    amount: 99000,
                    currency: "VND",
                    status: "succeeded",
                    createdAt: "2026-11-01T00:00:00Z",
                },
            ],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
            first: true,
            last: true,
        });

        renderWithProviders(<AiNutritionPage />);

        expect(await screen.findByText(/Còn 40 câu hỏi|40 AI requests remaining/i)).toBeInTheDocument();
        expect(screen.queryByText(/Miễn phí|Free/i)).not.toBeInTheDocument();
    });

    it("đã đăng nhập nhưng subscription chưa có gói: fallback an toàn và render đầy đủ", async () => {
        vi.mocked(authHook.useAuth).mockReturnValue({
            isAuthenticated: true,
            isAdmin: false,
            user: mockUser,
            profile: null,
            accessToken: "mock-token",
            rememberMe: false,
            setAuth: vi.fn(),
            clearAuth: vi.fn(),
            setAccessToken: vi.fn(),
            setProfile: vi.fn(),
        });

        vi.mocked(subApi.getMySubscription).mockResolvedValue({
            tier: "FREE",
            status: "active",
        });

        renderWithProviders(<AiNutritionPage />);

        expect(await screen.findByText(/Trợ lý AI Dinh dưỡng|Nutrition AI Assistant/i)).toBeInTheDocument();
        // "FREE" xuất hiện ở cả badge gói lẫn banner nhận gói → không assert duy nhất.
        expect((await screen.findAllByText(/FREE/i)).length).toBeGreaterThan(0);
    });
});
