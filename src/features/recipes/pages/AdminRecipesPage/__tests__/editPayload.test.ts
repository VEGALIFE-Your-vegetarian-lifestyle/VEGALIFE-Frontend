import { describe, expect, it } from "vitest";
import { buildRecipePatch, toForm, type RecipeEditValues } from "../editRecipeForm";
import type { AdminRecipe } from "../../../types";

function makeRecipe(overrides: Partial<AdminRecipe> = {}): AdminRecipe {
    return {
        id: "r1",
        userId: "u1",
        dishId: "d1",
        dishName: "canh chua",
        name: "Canh chua chay",
        description: null,
        instructions: "Nấu nước.",
        prepTimeMinutes: 10,
        cookTimeMinutes: null,
        servings: 2,
        difficulty: "EASY",
        ingredients: [],
        missingRequiredIngredients: [],
        moderationStatus: "PENDING",
        dishModerationStatus: "PENDING",
        score: null,
        displayName: "Minh",
        email: "minh@example.com",
        categoryIds: [],
        status: "ACTIVE",
        createdAt: "2026-10-01T00:00:00Z",
        updatedAt: "2026-10-02T00:00:00Z",
        ...overrides,
    };
}

const edit = (recipe: AdminRecipe, changes: Partial<RecipeEditValues>) => {
    const initial = toForm(recipe);
    return buildRecipePatch(initial, { ...initial, ...changes });
};

describe("buildRecipePatch", () => {
    it("không đổi gì thì trả null — khỏi gọi API", () => {
        expect(edit(makeRecipe(), {})).toBeNull();
    });

    it("chỉ gửi field đã đổi, không gửi cả object", () => {
        expect(edit(makeRecipe(), { name: "  Canh chua  " })).toEqual({ name: "Canh chua" });
    });

    it("description null → chuỗi rỗng khi gửi lần đầu", () => {
        expect(edit(makeRecipe(), { description: "Món chay dễ làm" })).toEqual({
            description: "Món chay dễ làm",
        });
    });

    it("ô thời gian để trống nghĩa là giữ nguyên, không phải xoá về 0", () => {
        // cookTimeMinutes đang null → ô trống; xoá trắng ô prep (đang "10") cũng không gửi.
        expect(edit(makeRecipe(), { prepTimeMinutes: "" })).toBeNull();
    });

    it("nhập số phút thì gửi dạng number", () => {
        expect(edit(makeRecipe(), { cookTimeMinutes: "25" })).toEqual({ cookTimeMinutes: 25 });
    });

    it("difficulty rỗng là giữ nguyên, không xoá được về null", () => {
        expect(edit(makeRecipe(), { difficulty: "" })).toBeNull();
        expect(edit(makeRecipe(), { difficulty: "HARD" })).toEqual({ difficulty: "HARD" });
    });

    it("servings đổi thì gửi number", () => {
        expect(edit(makeRecipe(), { servings: "4" })).toEqual({ servings: 4 });
    });
});
