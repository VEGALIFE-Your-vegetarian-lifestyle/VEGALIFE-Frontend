// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "../apiError";

const wrap = (data: unknown) => ({ response: { data } });

describe("getApiErrorMessage", () => {
    it("ưu tiên mảng errors[]", () => {
        expect(getApiErrorMessage(wrap({ message: "loi chung", errors: ["a", "b"] }), "fb")).toBe("a\nb");
    });

    it("đọc map field của Spring validate (register 400)", () => {
        expect(
            getApiErrorMessage(
                wrap({
                    success: false,
                    message: "Validation failed",
                    data: { password: "Password must be at least 8 characters", displayName: "Display name is required" },
                }),
                "fb",
            ),
        ).toBe("Password must be at least 8 characters\nDisplay name is required");
    });

    it("bỏ qua data không phải map chuỗi (vd LoginResponse)", () => {
        expect(getApiErrorMessage(wrap({ message: "Invalid password", data: { userId: "x", expiresIn: 60 } }), "fb")).toBe(
            "Invalid password",
        );
    });

    it("fallback khi không có gì", () => {
        expect(getApiErrorMessage(new Error("boom"), "fb")).toBe("fb");
    });
});
