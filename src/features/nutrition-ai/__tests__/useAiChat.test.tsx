import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { useAiChat } from "@/features/nutrition-ai/useAiChat";
import { getAiConversation, getAiConversations, sendAiMessage } from "@/features/nutrition-ai/api";

vi.mock("@/features/nutrition-ai/api", () => ({
    sendAiMessage: vi.fn(),
    getAiConversations: vi.fn(),
    getAiConversation: vi.fn(),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
);

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAiConversations).mockResolvedValue([]);
    vi.mocked(sendAiMessage).mockResolvedValue({
        conversationId: "c1",
        reply: "Chào",
        usage: { remainingUsage: 19, used: 1, limit: 20 },
    });
});

describe("useAiChat", () => {
    it("bấm Enter + click trong cùng một tick chỉ gửi 1 request", async () => {
        const { result } = renderHook(() => useAiChat(), { wrapper });

        let results: boolean[] = [];
        await act(async () => {
            results = await Promise.all([result.current.send("Xin chào"), result.current.send("Xin chào")]);
        });

        expect(results).toEqual([true, false]);
        expect(sendAiMessage).toHaveBeenCalledTimes(1);
    });

    it("gửi xong chỉ giữ cặp hỏi/đáp cục bộ, không refetch chi tiết hội thoại", async () => {
        const { result } = renderHook(() => useAiChat(), { wrapper });

        await act(async () => {
            await result.current.send("Xin chào");
        });

        expect(result.current.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
        expect(getAiConversation).not.toHaveBeenCalled();
    });

    it("chọn hội thoại thì đặt lại local và nạp tin nhắn từ server", async () => {
        vi.mocked(getAiConversation).mockResolvedValue({
            id: "c1",
            title: "Cũ",
            updatedAt: "2026-10-22T10:00:00Z",
            messages: [{ role: "user", content: "Hỏi cũ", createdAt: "2026-10-22T10:00:00Z" }],
        });

        const { result } = renderHook(() => useAiChat(), { wrapper });

        act(() => {
            result.current.selectConversation("c1");
        });

        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.messages).toEqual([
            { id: "h-0", role: "user", text: "Hỏi cũ", createdAt: "2026-10-22T10:00:00Z" },
        ]);
    });
});
