// @vitest-environment node
/**
 * `POST /api/posts/{id}/media` — gắn/thay toàn bộ media đính kèm của bài (video).
 * Mock axios: endpoint cần JWT nên không gọi backend thật trong unit test.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { attachPostMedia } from "../api";

vi.mock("@/shared/api/client", () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

beforeEach(() => vi.resetAllMocks());

describe("attachPostMedia", () => {
    it("gửi đúng endpoint với mảng mediaIds", async () => {
        vi.mocked(api.post).mockResolvedValue({
            data: { success: true, message: "ok", data: { id: "p1", mediaIds: ["m1"] } },
        });

        const post = await attachPostMedia("p1", ["m1"]);

        expect(api.post).toHaveBeenCalledWith("/api/posts/p1/media", { mediaIds: ["m1"] });
        expect(post.mediaIds).toEqual(["m1"]);
    });

    it("mảng rỗng = gỡ hết media, vẫn gọi API", async () => {
        vi.mocked(api.post).mockResolvedValue({
            data: { success: true, message: "ok", data: { id: "p1", mediaIds: [] } },
        });

        await attachPostMedia("p1", []);

        expect(api.post).toHaveBeenCalledWith("/api/posts/p1/media", { mediaIds: [] });
    });
});
