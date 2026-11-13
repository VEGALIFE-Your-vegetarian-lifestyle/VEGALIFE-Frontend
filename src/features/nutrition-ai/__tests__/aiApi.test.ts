// @vitest-environment node
/** Test aiService / subscriptionService — mock axios `api`, kiểm tra path và unwrap `data` (V48). */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { getAiConversation, getAiConversations, sendAiMessage } from "@/features/nutrition-ai/api";
import { getMySubscription } from "@/features/nutrition-ai/subscriptionApi";

vi.mock("@/shared/api/client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

const ok = <T,>(data: T) => ({ data: { success: true, message: "ok", data } });

beforeEach(() => vi.resetAllMocks());

/** Lượt AI có thể chạy 40–90s; mặc định 30s của `api` cắt ngang giữa lúc backend tạo menu. */
const AI_TIMEOUT = { timeout: 90_000 };

describe("sendAiMessage", () => {
    it("POST /api/ai/messages và trả thẳng `data`, bỏ conversationId khi tạo hội thoại mới", async () => {
        const payload = { conversationId: "c1", reply: "Chào bạn", usage: { remainingUsage: 4 } };
        vi.mocked(api.post).mockResolvedValue(ok(payload));

        const result = await sendAiMessage({ message: "Xin chào" });

        expect(api.post).toHaveBeenCalledWith("/api/ai/messages", { message: "Xin chào" }, AI_TIMEOUT);
        expect(result).toEqual(payload);
    });

    it("gửi kèm conversationId khi nối tiếp hội thoại đang mở", async () => {
        const payload = { conversationId: "c1", reply: "ok", usage: { remainingUsage: 3 } };
        vi.mocked(api.post).mockResolvedValue(ok(payload));

        await sendAiMessage({ conversationId: "c1", message: "Tiếp" });

        expect(api.post).toHaveBeenCalledWith(
            "/api/ai/messages",
            { conversationId: "c1", message: "Tiếp" },
            AI_TIMEOUT,
        );
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

describe("getMySubscription (V48)", () => {
    it("GET /api/subscriptions/me trả về remainingUsage", async () => {
        const sub = { remainingUsage: 5 };
        vi.mocked(api.get).mockResolvedValue(ok(sub));

        expect(await getMySubscription()).toEqual(sub);
        expect(api.get).toHaveBeenCalledWith("/api/subscriptions/me");
    });
});
