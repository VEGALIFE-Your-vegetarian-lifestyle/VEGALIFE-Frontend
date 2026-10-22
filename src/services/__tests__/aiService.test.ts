// @vitest-environment node
/**
 * Test aiService + subscriptionService — gọi BACKEND THẬT.
 * Mọi endpoint đều cần JWT nên tự bỏ qua khi thiếu `E2E_USER_*`.
 *
 * KHÔNG test gửi tin nhắn thật: mỗi lần gọi #47 tốn một lượt quota AI của tài
 * khoản test (BR-AI-002). Chỉ test các đường đọc và các ca lỗi không tốn quota.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getAiConversation, getAiConversations } from "@/services/aiService";
import { getMySubscription } from "@/services/subscriptionService";
import { E2E_USER, HAS_USER, REMOTE_TIMEOUT_MS, httpStatus, signInAs, signOut } from "@/test/e2eEnv";

const MISSING_UUID = "00000000-0000-0000-0000-000000000000";

describe.skipIf(!HAS_USER)("aiService — cần JWT user (E2E_USER_*)", () => {
    beforeAll(async () => {
        await signInAs(E2E_USER);
    });
    afterAll(signOut);

    it(
        "getAiConversations trả về mảng phẳng (không phải PageResponse)",
        async () => {
            const conversations = await getAiConversations();

            expect(Array.isArray(conversations)).toBe(true);
            for (const conversation of conversations) {
                expect(typeof conversation.id).toBe("string");
                expect(typeof conversation.title).toBe("string");
                expect(typeof conversation.updatedAt).toBe("string");
            }
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getAiConversations sắp updatedAt giảm dần",
        async () => {
            const conversations = await getAiConversations();
            if (conversations.length < 2) return; // chưa đủ dữ liệu để so

            const times = conversations.map((conversation) => new Date(conversation.updatedAt).getTime());
            for (let i = 1; i < times.length; i += 1) {
                expect(times[i - 1]).toBeGreaterThanOrEqual(times[i]);
            }
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getAiConversation trên hội thoại đầu tiên trả history sắp cũ → mới",
        async () => {
            const [first] = await getAiConversations();
            if (!first) return;

            const detail = await getAiConversation(first.id);

            expect(detail.id).toBe(first.id);
            expect(Array.isArray(detail.messages)).toBe(true);

            const times = detail.messages.map((message) => new Date(message.createdAt).getTime());
            for (let i = 1; i < times.length; i += 1) {
                expect(times[i - 1]).toBeLessThanOrEqual(times[i]);
            }

            for (const message of detail.messages) {
                expect(["user", "assistant", "system"]).toContain(message.role);
                expect(typeof message.content).toBe("string");
            }
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getAiConversation với UUID lạ trả 404 (không phân biệt với hội thoại của member khác)",
        async () => {
            const error = await getAiConversation(MISSING_UUID).catch((e) => e);

            expect(httpStatus(error)).toBe(404);
        },
        REMOTE_TIMEOUT_MS,
    );
});

describe.skipIf(!HAS_USER)("subscriptionService — cần JWT user (E2E_USER_*)", () => {
    beforeAll(async () => {
        await signInAs(E2E_USER);
    });
    afterAll(signOut);

    it(
        "getMySubscription trả tier + usage tháng UTC + currentPlan",
        async () => {
            const subscription = await getMySubscription();

            expect(["FREE", "PRO"]).toContain(subscription.tier);
            expect(typeof subscription.status).toBe("string");
            expect(subscription.currentPlan.code).toBeTruthy();
            expect(subscription.currentPlan.monthlyRequestLimit).toBeGreaterThan(0);

            expect(typeof subscription.usage.used).toBe("number");
            expect(typeof subscription.usage.limit).toBe("number");
            // Cửa sổ là tháng UTC — hai mốc phải parse được.
            expect(Number.isNaN(new Date(subscription.usage.periodStart).getTime())).toBe(false);
            expect(Number.isNaN(new Date(subscription.usage.periodEnd).getTime())).toBe(false);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "usage.used không vượt usage.limit của gói đang dùng",
        async () => {
            const { usage, currentPlan } = await getMySubscription();

            expect(usage.limit).toBe(currentPlan.monthlyRequestLimit);
            expect(usage.used).toBeGreaterThanOrEqual(0);
            expect(usage.used).toBeLessThanOrEqual(usage.limit);
        },
        REMOTE_TIMEOUT_MS,
    );
});
