import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";
import { buildValidationSchema } from "../schema";
import { buildContentPayload, buildPatch, type FormValues } from "../payload";
import i18n from "@/i18n";

// i18n đã init sẵn (setup.ts) nên `t` dùng được ngay, không cần React.
// Ép qua `unknown` vì kiểu overload của `i18n.t` không gán trực tiếp được cho TFunction.
const t = i18n.t.bind(i18n) as unknown as TFunction;

function makeValues(overrides: Partial<FormValues> = {}): FormValues {
    return {
        title: "Pho chay",
        summary: "",
        content: { type: "doc", content: [{ type: "paragraph" }] },
        rawContent: "  Pho chay  ",
        featuredImageUrl: "https://x.test/cover.png",
        videoMediaId: "",
        categoryIds: [],
        recipeIds: [],
        ...overrides,
    };
}

describe("buildValidationSchema", () => {
    it("tiêu đề rỗng bị từ chối", async () => {
        const schema = buildValidationSchema(t);

        await expect(schema.validateAt("title", { title: "   " })).rejects.toThrow("This field is required");
    });

    it("tiêu đề dài quá 90 ký tự bị từ chối", async () => {
        const schema = buildValidationSchema(t);

        await expect(schema.validateAt("title", { title: "a".repeat(91) })).rejects.toThrow(
            "Must be at most 90 characters",
        );
    });

    it("tiêu đề đúng 90 ký tự vẫn hợp lệ", async () => {
        const schema = buildValidationSchema(t);

        await expect(schema.validateAt("title", { title: "a".repeat(90) })).resolves.toBe("a".repeat(90));
    });

    it("URL ảnh bìa sai định dạng bị từ chối", async () => {
        const schema = buildValidationSchema(t);

        await expect(schema.validateAt("featuredImageUrl", { featuredImageUrl: "khong-phai-url" })).rejects.toThrow(
            "Invalid URL",
        );
    });
});

describe("buildContentPayload", () => {
    it("cắt khoảng trắng text thuần nhưng giữ nguyên object JSON", () => {
        const values = makeValues();

        const payload = buildContentPayload(values);

        expect(payload.content).toBe("Pho chay");
        expect(payload.rawContent).toBe(values.content);
    });
});

describe("buildPatch", () => {
    it("luôn gửi title và nội dung", () => {
        const patch = buildPatch(makeValues({ title: "  Pho chay  " }));

        expect(patch.title).toBe("Pho chay");
        expect(patch.content).toBe("Pho chay");
    });

    it("bỏ trống ảnh bìa thì KHÔNG gửi field — giữ ảnh cũ", () => {
        const patch = buildPatch(makeValues({ featuredImageUrl: "   " }));

        expect(patch).not.toHaveProperty("featuredImageUrl");
    });

    it("có ảnh bìa thì gửi đã trim", () => {
        const patch = buildPatch(makeValues({ featuredImageUrl: "  https://x.test/a.png  " }));

        expect(patch.featuredImageUrl).toBe("https://x.test/a.png");
    });

    it("danh sách danh mục rỗng thì KHÔNG gửi — giữ danh mục cũ", () => {
        const patch = buildPatch(makeValues({ categoryIds: [] }));

        expect(patch).not.toHaveProperty("categoryIds");
    });

    it("có danh mục thì gửi nguyên mảng", () => {
        const ids = ["a", "b"];
        const patch = buildPatch(makeValues({ categoryIds: ids }));

        expect(patch.categoryIds).toEqual(ids);
    });

    it("KHÔNG bao giờ tự set publish — việc đăng bài do người gọi quyết định", () => {
        const patch = buildPatch(makeValues());

        expect(patch).not.toHaveProperty("publish");
    });

    it("KHÔNG gửi recipeIds — việc đó do POST /api/posts/{id}/recipes lo", () => {
        const patch = buildPatch(makeValues({ recipeIds: ["r1"] }));

        expect(patch).not.toHaveProperty("recipeIds");
    });
});
