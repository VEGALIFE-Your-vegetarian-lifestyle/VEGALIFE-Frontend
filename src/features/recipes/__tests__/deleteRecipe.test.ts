// @vitest-environment node
/** `DELETE /api/recipes/{id}` — endpoint mới cho tác giả xoá mềm công thức của mình. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { deleteRecipe } from "../api";
import { isNotFound } from "@/shared/utils/apiError";

vi.mock("@/shared/api/client", () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

beforeEach(() => vi.resetAllMocks());

describe("deleteRecipe", () => {
    it("gọi DELETE /api/recipes/{id} và không trả dữ liệu", async () => {
        vi.mocked(api.delete).mockResolvedValue({ data: { success: true, message: "ok", data: null } });

        await expect(deleteRecipe("r1")).resolves.toBeUndefined();
        expect(api.delete).toHaveBeenCalledWith("/api/recipes/r1");
    });

    it("404 (đã xoá rồi / không phải của mình) được nhận diện là 'đã xong'", async () => {
        const notFound = Object.assign(new Error("404"), { response: { status: 404 } });

        expect(isNotFound(notFound)).toBe(true);
        expect(isNotFound(new Error("500"))).toBe(false);
        expect(isNotFound(null)).toBe(false);
    });
});
