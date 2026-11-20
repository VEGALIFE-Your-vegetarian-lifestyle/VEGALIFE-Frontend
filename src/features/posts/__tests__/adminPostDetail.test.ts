// @vitest-environment node
/** `GET /api/admin/posts/{id}` — chi tiết duyệt: chỉ `recipes[]` được render, `names[]` bỏ qua. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { getAdminPostDetail } from "../api";

vi.mock("@/shared/api/client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

beforeEach(() => vi.resetAllMocks());

describe("getAdminPostDetail", () => {
    it("gọi đúng endpoint và mở gói `data`", async () => {
        const detail = { id: "p1", title: "T", recipes: [], names: [] };
        vi.mocked(api.get).mockResolvedValue({ data: { success: true, message: "ok", data: detail } });

        await expect(getAdminPostDetail("p1")).resolves.toBe(detail);
        expect(api.get).toHaveBeenCalledWith("/api/admin/posts/p1");
    });
});
