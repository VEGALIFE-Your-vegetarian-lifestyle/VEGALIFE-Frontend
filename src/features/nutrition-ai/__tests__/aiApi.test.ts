// @vitest-environment node
/** Test aiService / subscriptionService — mock axios `api`, kiểm tra path và unwrap `data`. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { getAiConversation, getAiConversations, sendAiMessage } from "@/features/nutrition-ai/api";
import { getMySubscription } from "@/features/nutrition-ai/subscriptionApi";

vi.mock("@/shared/api/client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

const ok = <T,>(data: T) => ({ data: { success: true, message: "ok", data } });

beforeEach(() => vi.resetAllMocks());

describe("sendAiMessage", () => {
    it("POST /api/ai/messages và trả thẳng `data`, bỏ conversationId khi tạo hội thoại mới", async () => {
        const payload = { conversationId: "c1", reply: "Chào bạn", usage: { used: 1, limit: 20 } };
        vi.mocked(api.post).mockResolvedValue(ok(payload));

        const result = await sendAiMessage({ message: "Xin chào" });

        expect(api.post).toHaveBeenCalledWith("/api/ai/messages", { message: "Xin chào" });
        expect(result).toEqual(payload);
    });

    it("gửi kèm conversationId khi nối tiếp hội thoại đang mở", async () => {
        vi.mocked(api.post).mockResolvedValue(ok({ conversationId: "c1", reply: "ok", usage: { used: 2, limit: 20 } }));

        await sendAiMessage({ conversationId: "c1", message: "Tiếp" });

        expect(api.post).toHaveBeenCalledWith("/api/ai/messages", { conversationId: "c1", message: "Tiếp" });
    });
});

describe("getAiConversations", () => {
    it("GET /api/ai/conversations, backend đã sắp sẵn nên không sort lại", async () => {
        const list = [
            { id: "b", title: "Mới", updatedAt: "2026-10-22T10:00:00Z" },
            { id: "a", title: "Cũ", updatedAt: "2026-10-21T10:00:00Z" },
        ];
        vi.mocked(api.get).mockResolvedValue(ok(list));

        expect(await getAiConversations()).toEqual(list);
        expect(api.get).toHaveBeenCalledWith("/api/ai/conversations");
    });
});

describe("getAiConversation", () => {
    it("GET /api/ai/conversations/{id}", async () => {
        const detail = { id: "c1", title: "T", updatedAt: "2026-10-22T10:00:00Z", messages: [] };
        vi.mocked(api.get).mockResolvedValue(ok(detail));

        expect(await getAiConversation("c1")).toEqual(detail);
        expect(api.get).toHaveBeenCalledWith("/api/ai/conversations/c1");
    });
});

describe("getMySubscription", () => {
    it("GET /api/subscriptions/me", async () => {
        const sub = { tier: "FREE", status: "active", renewalDate: null, usage: { used: 0, limit: 20 } };
        vi.mocked(api.get).mockResolvedValue(ok(sub));

        expect(await getMySubscription()).toEqual(sub);
        expect(api.get).toHaveBeenCalledWith("/api/subscriptions/me");
    });
});
