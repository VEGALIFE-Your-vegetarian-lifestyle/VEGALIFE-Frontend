// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
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
        displayName: "tester",
        email: "tester@example.com",
        heightCm: null,
        weightKg: null,
        bmi: null,
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
