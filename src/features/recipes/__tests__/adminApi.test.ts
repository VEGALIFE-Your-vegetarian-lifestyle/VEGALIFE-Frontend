// @vitest-environment node
/** Test `getAdminRecipes` / `approveRecipe` — gọi BACKEND THẬT, admin-gated qua `E2E_ADMIN_*`. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { approveRecipe, getAdminRecipes } from "../adminApi";
import type { ModerationStatus } from "../types";
import { E2E_ADMIN, HAS_ADMIN, REMOTE_TIMEOUT_MS, httpStatus, signInAs, signOut } from "@/test/e2eEnv";

describe("adminRecipeService — chặn khi chưa đăng nhập", () => {
    it(
        "getAdminRecipes không có token bị từ chối 401/403",
        async () => {
            const error = await getAdminRecipes({ page: 1, size: 10 }).catch((e) => e);

            expect([401, 403]).toContain(httpStatus(error));
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "approveRecipe không có token bị từ chối 401/403",
        async () => {
            const error = await approveRecipe(crypto.randomUUID()).catch((e) => e);

            expect([401, 403]).toContain(httpStatus(error));
        },
        REMOTE_TIMEOUT_MS,
    );
});

describe.skipIf(!HAS_ADMIN)("adminRecipeService — cần JWT admin (E2E_ADMIN_*)", () => {
    beforeAll(async () => {
        await signInAs(E2E_ADMIN);
    });
    afterAll(signOut);

    it(
        "trả Paginated 1-based, size đúng yêu cầu",
        async () => {
            const page = await getAdminRecipes({ page: 1, size: 10 });

            expect(page.page).toBe(1);
            expect(page.size).toBe(10);
            expect(page.data.length).toBeLessThanOrEqual(10);
            expect(page.totalPages).toBeGreaterThanOrEqual(1);
            expect(typeof page.total).toBe("number");
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "mọi row có field admin cần để render bảng + dialog chi tiết",
        async () => {
            const page = await getAdminRecipes({ page: 1, size: 20 });

            for (const recipe of page.data) {
                expect(recipe.id).toBeTruthy();
                expect(recipe.name).toBeTruthy();
                expect(typeof recipe.instructions).toBe("string");
                expect(recipe.servings).toBeGreaterThanOrEqual(1);
                expect(["ACTIVE", "DELETED"]).toContain(recipe.status);
                expect(["PENDING", "APPROVED", "REJECTED"]).toContain(recipe.moderationStatus);
                expect(["PENDING", "APPROVED", "REJECTED"]).toContain(recipe.dishModerationStatus);
                expect(Array.isArray(recipe.ingredients)).toBe(true);
                expect(typeof recipe.username).toBe("string");
                expect(Array.isArray(recipe.categoryIds)).toBe(true);
                expect(Number.isNaN(Date.parse(recipe.createdAt))).toBe(false);
            }
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "sort createdAt,desc — thời gian giảm dần",
        async () => {
            const page = await getAdminRecipes({ page: 1, size: 20, sort: "createdAt,desc" });
            const times = page.data.map((recipe) => new Date(recipe.createdAt).getTime());

            expect(times).toEqual([...times].sort((a, b) => b - a));
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "lọc categoryId ở server — row trả về đều thuộc category đó",
        async () => {
            // Lấy categoryId từ dữ liệu thật thay vì UUID giả — không đoán backend
            // xử lý UUID không tồn tại thế nào (rỗng hay 400).
            const all = await getAdminRecipes({ page: 1, size: 20 });
            const categoryId = all.data.flatMap((recipe) => recipe.categoryIds)[0];
            if (!categoryId) return; // chưa có recipe nào gắn category — không kiểm chứng được

            const filtered = await getAdminRecipes({ page: 1, size: 20, categoryId });

            expect(filtered.data.length).toBeGreaterThan(0);
            for (const recipe of filtered.data) {
                expect(recipe.categoryIds).toContain(categoryId);
            }
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "lọc moderationStatus ở server — row trả về đều đúng trạng thái",
        async () => {
            const filtered = await getAdminRecipes({ page: 1, size: 20, moderationStatus: "PENDING" });

            for (const recipe of filtered.data) {
                expect(recipe.moderationStatus).toBe("PENDING");
            }
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "moderationStatus lạ bị backend từ chối 400",
        async () => {
            const error = await getAdminRecipes({
                page: 1,
                size: 10,
                moderationStatus: "BOGUS" as ModerationStatus,
            }).catch((e) => e);

            expect(httpStatus(error)).toBe(400);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "approveRecipe trên UUID không tồn tại trả 404, không phải 5xx",
        async () => {
            const error = await approveRecipe(crypto.randomUUID()).catch((e) => e);

            expect(httpStatus(error)).toBe(404);
        },
        REMOTE_TIMEOUT_MS,
    );
});
