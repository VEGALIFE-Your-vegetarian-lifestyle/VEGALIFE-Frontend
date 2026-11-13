import { describe, expect, it } from "vitest";
import {
    buildIngredientCreate,
    buildIngredientUpdate,
    buildMissingIngredientsPatch,
    emptyIngredientForm,
    emptyMissingRow,
    toIngredientForm,
} from "../../../ingredientForm";
import type { AdminIngredient } from "../../../types";

function makeIngredient(overrides: Partial<AdminIngredient> = {}): AdminIngredient {
    return {
        id: "i1",
        name: "đậu hũ",
        moderationStatus: "APPROVED",
        unit: "G",
        calories: 74,
        proteinG: 8,
        carbohydrateG: 1.9,
        fatG: 4.8,
        fiberG: 0.3,
        nutritionResolved: true,
        createdAt: "2026-10-01T00:00:00Z",
        updatedAt: "2026-10-02T00:00:00Z",
        ...overrides,
    };
}

const withUnit = (unit: "G" | "ML" | "PIECE" | "") => ({ ...emptyIngredientForm(), name: "gạo", unit });

describe("buildIngredientCreate", () => {
    it("chỉ có tên là hợp lệ — không unit, không dinh dưỡng", () => {
        const result = buildIngredientCreate({ ...emptyIngredientForm(), name: "  gạo  " });
        expect(result).toEqual({ ok: true, payload: { name: "gạo" } });
    });

    it("đủ 5 giá trị + unit thì gửi cả 6 field dạng number", () => {
        const result = buildIngredientCreate({
            ...withUnit("G"),
            calories: "360",
            proteinG: "7.5",
            carbohydrateG: "78",
            fatG: "0.8",
            fiberG: "1.2",
        });
        expect(result).toEqual({
            ok: true,
            payload: { name: "gạo", unit: "G", calories: 360, proteinG: 7.5, carbohydrateG: 78, fatG: 0.8, fiberG: 1.2 },
        });
    });

    it("nhập 1–4 giá trị dinh dưỡng là lỗi — BE trả 400", () => {
        const result = buildIngredientCreate({ ...withUnit("G"), calories: "360" });
        expect(result).toEqual({ ok: false, error: "partialNutrition" });
    });

    it("có dinh dưỡng mà không có đơn vị là lỗi", () => {
        const result = buildIngredientCreate({
            ...withUnit(""),
            calories: "360",
            proteinG: "7",
            carbohydrateG: "78",
            fatG: "0.8",
            fiberG: "1.2",
        });
        expect(result).toEqual({ ok: false, error: "unitRequired" });
    });

    it("0 là giá trị thật, không phải ô trống", () => {
        const result = buildIngredientCreate({
            ...withUnit("ML"),
            calories: "0",
            proteinG: "0",
            carbohydrateG: "0",
            fatG: "0",
            fiberG: "0",
        });
        expect(result.ok && result.payload).toMatchObject({ calories: 0, fiberG: 0 });
    });
});

describe("toIngredientForm / buildIngredientUpdate", () => {
    it("null → ô trống, 0 → '0'", () => {
        const form = toIngredientForm(makeIngredient({ calories: null, fiberG: 0 }));
        expect(form.calories).toBe("");
        expect(form.fiberG).toBe("0");
    });

    it("không đổi gì thì payload null — khỏi gọi API", () => {
        const ingredient = makeIngredient();
        const result = buildIngredientUpdate(ingredient, toIngredientForm(ingredient));
        expect(result).toEqual({ ok: true, payload: null });
    });

    it("chỉ gửi field đã đổi", () => {
        const ingredient = makeIngredient();
        const result = buildIngredientUpdate(ingredient, { ...toIngredientForm(ingredient), name: "đậu phụ" });
        expect(result).toEqual({ ok: true, payload: { name: "đậu phụ" } });
    });

    it("xoá trắng 1 trong 5 ô là partial — BE không nhận bộ thiếu", () => {
        const ingredient = makeIngredient();
        const result = buildIngredientUpdate(ingredient, { ...toIngredientForm(ingredient), calories: "" });
        expect(result).toEqual({ ok: false, error: "partialNutrition" });
    });

    it("giữ nguyên giá trị cũ thì không gửi lại — diff rỗng", () => {
        const ingredient = makeIngredient();
        const result = buildIngredientUpdate(ingredient, toIngredientForm(ingredient));
        expect(result).toEqual({ ok: true, payload: null });
    });
});

describe("buildMissingIngredientsPatch", () => {
    it("dòng bỏ trống hết thì không có patch cho nguyên liệu đó", () => {
        const rows = [emptyMissingRow("i1", "gạo"), emptyMissingRow("i2", "muối")];
        expect(buildMissingIngredientsPatch(rows)).toEqual({ ok: true, patches: [] });
    });

    it("dòng có unit + đủ 5 giá trị thì tạo patch", () => {
        const rows = [
            {
                ...emptyMissingRow("i1", "gạo"),
                unit: "G" as const,
                calories: "360",
                proteinG: "7",
                carbohydrateG: "78",
                fatG: "0.8",
                fiberG: "1.2",
            },
        ];
        expect(buildMissingIngredientsPatch(rows)).toEqual({
            ok: true,
            patches: [{ ingredientId: "i1", payload: { unit: "G", calories: 360, proteinG: 7, carbohydrateG: 78, fatG: 0.8, fiberG: 1.2 } }],
        });
    });

    it("một dòng sai thì chặn cả lần duyệt", () => {
        const rows = [emptyMissingRow("i1", "gạo"), { ...emptyMissingRow("i2", "muối"), calories: "5" }];
        expect(buildMissingIngredientsPatch(rows)).toEqual({ ok: false, error: "partialNutrition" });
    });
});
