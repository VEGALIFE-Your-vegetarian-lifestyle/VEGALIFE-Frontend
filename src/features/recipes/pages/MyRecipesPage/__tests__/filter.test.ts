import { describe, expect, it } from "vitest";
import type { ModerationStatus, Recipe } from "../../../types";
import { matchesRecipe, QUICK_MINUTES, recipeStats, sortRecipes } from "../filter";

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
    return {
        id: "r1",
        userId: "u1",
        dishId: "d1",
        dishName: "canh chua",
        name: "Canh chua chay",
        description: null,
        instructions: "Nấu nước.",
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        difficulty: "EASY",
        ingredients: [{ ingredientId: "i1", name: "cà chua", amount: 2, unit: "quả" }],
        moderationStatus: "PENDING" as ModerationStatus,
        dishModerationStatus: "PENDING",
        calories: null,
        proteinG: null,
        carbohydrateG: null,
        fatG: null,
        fiberG: null,
        createdAt: "2026-10-01T00:00:00Z",
        updatedAt: "2026-10-02T00:00:00Z",
        ...overrides,
    };
}

describe("matchesRecipe", () => {
    it("tab all nhận mọi trạng thái", () => {
        const recipes = [
            makeRecipe({ id: "a", moderationStatus: "APPROVED" }),
            makeRecipe({ id: "b", moderationStatus: "PENDING" }),
            makeRecipe({ id: "c", moderationStatus: "REJECTED" }),
        ];
        const kept = recipes.filter((r) => matchesRecipe(r, { tab: "all", difficulty: "", keyword: "" }));
        expect(kept.map((r) => r.id)).toEqual(["a", "b", "c"]);
    });

    it("tab trạng thái chỉ giữ đúng trạng thái đó", () => {
        const approved = makeRecipe({ moderationStatus: "APPROVED" });
        const rejected = makeRecipe({ moderationStatus: "REJECTED" });
        expect(matchesRecipe(approved, { tab: "APPROVED", difficulty: "", keyword: "" })).toBe(true);
        expect(matchesRecipe(rejected, { tab: "APPROVED", difficulty: "", keyword: "" })).toBe(false);
    });

    it("độ khó rỗng = không lọc", () => {
        expect(matchesRecipe(makeRecipe({ difficulty: null }), { tab: "all", difficulty: "", keyword: "" })).toBe(true);
    });

    it("độ khó không khớp bị loại", () => {
        const recipe = makeRecipe({ difficulty: "HARD" });
        expect(matchesRecipe(recipe, { tab: "all", difficulty: "EASY", keyword: "" })).toBe(false);
        expect(matchesRecipe(recipe, { tab: "all", difficulty: "HARD", keyword: "" })).toBe(true);
    });

    it("từ khoá khớp tên công thức / tên món / tên nguyên liệu, không phân biệt hoa thường", () => {
        const recipe = makeRecipe({ name: "Canh chua chay", dishName: "canh chua" });
        expect(matchesRecipe(recipe, { tab: "all", difficulty: "", keyword: "  CHAY  " })).toBe(true);
        expect(matchesRecipe(recipe, { tab: "all", difficulty: "", keyword: "cà chua" })).toBe(true);
        expect(matchesRecipe(recipe, { tab: "all", difficulty: "", keyword: "canh" })).toBe(true);
        expect(matchesRecipe(recipe, { tab: "all", difficulty: "", keyword: "pizza" })).toBe(false);
    });
});

describe("sortRecipes", () => {
    const older = makeRecipe({ id: "old", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z" });
    const newer = makeRecipe({ id: "new", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z" });

    it("newest-first khi desc, đảo khi asc", () => {
        expect(sortRecipes([older, newer], "updated", "desc", "en").map((r) => r.id)).toEqual(["new", "old"]);
        expect(sortRecipes([older, newer], "updated", "asc", "en").map((r) => r.id)).toEqual(["old", "new"]);
    });

    it("sort theo createdAt dùng đúng field", () => {
        expect(sortRecipes([older, newer], "created", "desc", "en").map((r) => r.id)).toEqual(["new", "old"]);
    });

    it("sort theo tên dùng locale truyền vào", () => {
        const a = makeRecipe({ id: "a", name: "Apple pie" });
        const b = makeRecipe({ id: "b", name: "Bánh xèo" });
        expect(sortRecipes([b, a], "name", "asc", "en").map((r) => r.id)).toEqual(["a", "b"]);
    });

    it("ngày hỏng bị đẩy xuống cuối thay vì làm loạn danh sách", () => {
        const broken = makeRecipe({ id: "broken", updatedAt: "không phải ngày" });
        expect(sortRecipes([broken, older, newer], "updated", "desc", "en").map((r) => r.id)).toEqual([
            "new",
            "old",
            "broken",
        ]);
    });

    it("không sửa mảng gốc", () => {
        const input = [older, newer];
        sortRecipes(input, "updated", "desc", "en");
        expect(input.map((r) => r.id)).toEqual(["old", "new"]);
    });
});

describe("recipeStats", () => {
    it("đếm total / approved / pending / quick", () => {
        const stats = recipeStats([
            makeRecipe({ moderationStatus: "APPROVED", prepTimeMinutes: 5, cookTimeMinutes: 10 }),
            makeRecipe({ moderationStatus: "PENDING", prepTimeMinutes: QUICK_MINUTES, cookTimeMinutes: 0 }),
            makeRecipe({ moderationStatus: "REJECTED", prepTimeMinutes: null, cookTimeMinutes: 45 }),
        ]);
        expect(stats).toEqual({ total: 3, approved: 1, pending: 1, quick: 2 });
    });

    it("không có thời gian thì không tính là món nhanh", () => {
        expect(recipeStats([makeRecipe({ prepTimeMinutes: null, cookTimeMinutes: null })]).quick).toBe(0);
    });

    it("mảng rỗng trả toàn số 0", () => {
        expect(recipeStats([])).toEqual({ total: 0, approved: 0, pending: 0, quick: 0 });
    });
});
