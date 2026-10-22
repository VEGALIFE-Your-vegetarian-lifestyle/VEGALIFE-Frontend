// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildRecipeRequest, validateRows, type RecipeFormValues } from "@/pages/RecipePage/payload";

const MSG = { name: "name", duplicate: "duplicate", unit: "unit", amount: "amount" };

const values = (patch: Partial<RecipeFormValues> = {}): RecipeFormValues => ({
    name: "  Creamy pasta ",
    dishName: " Cashew Pasta ",
    description: "  ",
    instructions: " Boil. Blend. ",
    servings: "2",
    prepTimeMinutes: "",
    cookTimeMinutes: " 15 ",
    difficulty: "",
    ...patch,
});

describe("validateRows", () => {
    it("dòng hợp lệ không có lỗi", () => {
        expect(validateRows([{ name: "Cashews", amount: "100", unit: "g" }], MSG)).toEqual({});
    });

    it("tên rỗng báo lỗi ở đúng index", () => {
        const errors = validateRows(
            [
                { name: "Cashews", amount: "100", unit: "g" },
                { name: "   ", amount: "1", unit: "g" },
            ],
            MSG,
        );
        expect(errors).toEqual({ 1: "name" });
    });

    it("trùng tên không phân biệt hoa thường — báo ở dòng sau", () => {
        const errors = validateRows(
            [
                { name: "Cashews", amount: "100", unit: "g" },
                { name: "  CASHEWS ", amount: "50", unit: "g" },
            ],
            MSG,
        );
        expect(errors).toEqual({ 1: "duplicate" });
    });

    it("thiếu đơn vị báo lỗi", () => {
        expect(validateRows([{ name: "Salt", amount: "1", unit: "  " }], MSG)).toEqual({ 0: "unit" });
    });

    it("amount = 0 hoặc âm hoặc không phải số đều bị chặn", () => {
        for (const amount of ["0", "-3", "", "abc"]) {
            expect(validateRows([{ name: "Salt", amount, unit: "tsp" }], MSG)).toEqual({ 0: "amount" });
        }
    });
});

describe("buildRecipeRequest", () => {
    it("trim mọi chuỗi và bỏ field optional rỗng thành null", () => {
        const request = buildRecipeRequest(values(), [{ name: " Cashews ", amount: "100", unit: " g " }]);

        expect(request).toEqual({
            name: "Creamy pasta",
            dishName: "Cashew Pasta",
            instructions: "Boil. Blend.",
            servings: 2,
            ingredients: [{ name: "Cashews", amount: 100, unit: "g" }],
            description: null,
            prepTimeMinutes: null,
            cookTimeMinutes: 15,
            difficulty: null,
        });
    });

    it("không gửi field do server sở hữu", () => {
        const request: Record<string, unknown> = { ...buildRecipeRequest(values(), []) };
        for (const key of ["id", "userId", "dishId", "createdAt", "updatedAt"]) {
            expect(request).not.toHaveProperty(key);
        }
    });

    it("difficulty đã chọn được gửi nguyên giá trị enum", () => {
        expect(buildRecipeRequest(values({ difficulty: "HARD" }), []).difficulty).toBe("HARD");
    });
});
