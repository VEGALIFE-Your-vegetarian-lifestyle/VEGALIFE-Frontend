// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
    buildDietaryPatch,
    normalizeTags,
    toDietaryValues,
    type DietaryValues,
} from "../dietary";
import type { UserProfile } from "@/shared/types/user";

const EMPTY: DietaryValues = {
    preferences: [],
    dislikes: [],
    allergies: [],
    restrictions: [],
    healthGoal: "",
};

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
    return {
        id: "p1",
        userId: "u1",
        heightCm: null,
        weightKg: null,
        age: null,
        gender: null,
        description: null,
        avatarUrl: null,
        updatedAt: "2026-10-24T00:00:00Z",
        ...overrides,
    };
}

describe("normalizeTags", () => {
    it("trim, gộp khoảng trắng, bỏ rỗng", () => {
        expect(normalizeTags(["  spicy  ", "high   protein", "", "   "])).toEqual([
            "spicy",
            "high protein",
        ]);
    });

    it("bỏ trùng không phân biệt hoa thường, giữ bản gặp đầu", () => {
        expect(normalizeTags(["Vegan", "vegan", "VEGAN"])).toEqual(["Vegan"]);
    });

    it("giữ nguyên thứ tự xuất hiện", () => {
        expect(normalizeTags(["b", "a", "c"])).toEqual(["b", "a", "c"]);
    });
});

describe("toDietaryValues", () => {
    it("profile undefined → 4 mảng rỗng + goal rỗng", () => {
        expect(toDietaryValues(undefined)).toEqual(EMPTY);
    });

    it("field vắng khỏi JSON (chưa set) → rỗng, không phải undefined", () => {
        expect(toDietaryValues(profile())).toEqual(EMPTY);
    });

    it("copy mảng — sửa kết quả không ghi ngược vào profile", () => {
        const source = profile({ preferences: ["Vegan"], healthGoal: "Lose weight" });
        const values = toDietaryValues(source);

        values.preferences.push("Spicy");

        expect(source.preferences).toEqual(["Vegan"]);
    });
});

describe("buildDietaryPatch", () => {
    it("không đổi gì → {} (không gửi request rỗng)", () => {
        expect(buildDietaryPatch(EMPTY, { ...EMPTY })).toEqual({});
    });

    it("chỉ trả field đã đổi", () => {
        const patch = buildDietaryPatch(EMPTY, { ...EMPTY, allergies: ["peanuts"] });

        expect(patch).toEqual({ allergies: ["peanuts"] });
    });

    it("xoá hết tag → gửi [] chứ không phải vắng mặt", () => {
        const saved: DietaryValues = { ...EMPTY, dislikes: ["cilantro"] };
        const patch = buildDietaryPatch(saved, { ...saved, dislikes: [] });

        expect(patch).toEqual({ dislikes: [] });
    });

    it("healthGoal xoá trắng → gửi chuỗi rỗng", () => {
        const saved: DietaryValues = { ...EMPTY, healthGoal: "Lose weight" };
        const patch = buildDietaryPatch(saved, { ...saved, healthGoal: "   " });

        expect(patch).toEqual({ healthGoal: "" });
    });

    it("khác khoảng trắng nhưng cùng nội dung → không tính là đổi", () => {
        const saved: DietaryValues = { ...EMPTY, preferences: ["High protein"] };
        const patch = buildDietaryPatch(saved, {
            ...saved,
            preferences: ["  High   protein "],
        });

        expect(patch).toEqual({});
    });

    it("đổi hoa thường là thay đổi thật (người dùng cố ý sửa lại chữ)", () => {
        const saved: DietaryValues = { ...EMPTY, preferences: ["High protein"] };
        const patch = buildDietaryPatch(saved, { ...saved, preferences: ["high PROTEIN"] });

        expect(patch).toEqual({ preferences: ["high PROTEIN"] });
    });

    it("chuẩn hoá giá trị trước khi gửi", () => {
        const patch = buildDietaryPatch(EMPTY, {
            ...EMPTY,
            restrictions: ["  no  added sugar ", "No added sugar"],
        });

        expect(patch).toEqual({ restrictions: ["no added sugar"] });
    });

    it("nhiều field đổi cùng lúc → gộp vào một patch", () => {
        const patch = buildDietaryPatch(EMPTY, {
            ...EMPTY,
            preferences: ["spicy"],
            healthGoal: "Gain muscle",
        });

        expect(patch).toEqual({ preferences: ["spicy"], healthGoal: "Gain muscle" });
    });
});
