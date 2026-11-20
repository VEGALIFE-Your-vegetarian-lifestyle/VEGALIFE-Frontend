import { describe, expect, it } from "vitest";
import { buildDishCreate, buildDishUpdate, toDishForm, type DishFormValues } from "../dishForm";
import type { AdminDish } from "../../../types";

function makeDish(overrides: Partial<AdminDish> = {}): AdminDish {
    return {
        id: "d1",
        name: "đậu hũ kho",
        description: "Món chay",
        imageUrl: null,
        cuisineType: "Việt Nam",
        moderationStatus: "APPROVED",
        suggestedIngredients: [],
        createdAt: "2026-11-01T00:00:00Z",
        updatedAt: "2026-11-02T00:00:00Z",
        ...overrides,
    };
}

const edit = (dish: AdminDish, changes: Partial<DishFormValues>) => {
    const initial = toDishForm(dish);
    return buildDishUpdate(initial, { ...initial, ...changes });
};

describe("buildDishCreate", () => {
    it("bỏ field rỗng, chỉ gửi tên đã trim", () => {
        expect(buildDishCreate({ name: "  đậu hũ kho  ", description: " ", cuisineType: "", imageUrl: null })).toEqual({
            name: "đậu hũ kho",
        });
    });

    it("gửi đủ 4 field khi đều có giá trị", () => {
        expect(
            buildDishCreate({ name: "a", description: "b", cuisineType: "c", imageUrl: "https://x/y.png" }),
        ).toEqual({ name: "a", description: "b", cuisineType: "c", imageUrl: "https://x/y.png" });
    });
});

describe("buildDishUpdate", () => {
    it("không đổi gì thì trả null — khỏi gọi API", () => {
        expect(edit(makeDish(), {})).toBeNull();
    });

    it("chỉ gửi field đã đổi", () => {
        expect(edit(makeDish(), { cuisineType: "Trung Quốc" })).toEqual({ cuisineType: "Trung Quốc" });
    });

    it("xoá trắng description gửi chuỗi rỗng (PATCH = xoá giá trị)", () => {
        expect(edit(makeDish(), { description: "" })).toEqual({ description: "" });
    });

    it("gỡ ảnh gửi chuỗi rỗng", () => {
        expect(edit(makeDish({ imageUrl: "https://x/y.png" }), { imageUrl: null })).toEqual({ imageUrl: "" });
    });

    it("description null ở BE + ô trống = không đổi", () => {
        expect(edit(makeDish({ description: null }), { description: "   " })).toBeNull();
    });
});
