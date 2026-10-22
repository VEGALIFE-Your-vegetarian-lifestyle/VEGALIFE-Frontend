import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { useAiChat } from "@/hooks/useAiChat";
import { getAiConversation, getAiConversations, sendAiMessage } from "@/services/aiService";

vi.mock("@/services/aiService", () => ({
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
        usage: { used: 1, limit: 20 },
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

    it("chặn câu dài quá 4000 ký tự mà không gọi API", async () => {
        const { result } = renderHook(() => useAiChat(), { wrapper });

        let ok = true;
        await act(async () => {
            ok = await result.current.send("a".repeat(4001));
        });

        expect(ok).toBe(false);
        expect(sendAiMessage).not.toHaveBeenCalled();
    });
});
