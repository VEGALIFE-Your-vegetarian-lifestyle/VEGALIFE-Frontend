import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import AiNutritionPage from "../AiNutritionPage";
import * as authHook from "@/features/auth/useAuth";
import * as subApi from "../subscriptionApi";
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

        expect(await screen.findByText(/Trợ lý AI Dinh dưỡng|AI Nutrition Assistant/i)).toBeInTheDocument();
        expect(screen.getByText(/Đăng nhập để hỏi trợ lý|Sign in to ask the assistant/i)).toBeInTheDocument();
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

        expect(await screen.findByText(/Trợ lý AI Dinh dưỡng|AI Nutrition Assistant/i)).toBeInTheDocument();
        expect(await screen.findByText(/Còn 15 câu hỏi/i)).toBeInTheDocument();
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

        expect(await screen.findByText(/Trợ lý AI Dinh dưỡng|AI Nutrition Assistant/i)).toBeInTheDocument();
        expect(await screen.findByText(/FREE/i)).toBeInTheDocument();
    });
});
