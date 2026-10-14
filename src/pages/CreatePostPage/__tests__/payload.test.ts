import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";
import { buildValidationSchema } from "@/pages/CreatePostPage/schema";
import { buildContentPayload, buildPatch, type FormValues } from "@/pages/CreatePostPage/payload";
import i18n from "@/i18n";

// i18n đã init sẵn (setup.ts) nên `t` dùng được ngay, không cần React.
// Ép qua `unknown` vì kiểu overload của `i18n.t` không gán trực tiếp được cho TFunction.
const t = i18n.t.bind(i18n) as unknown as TFunction;

function makeValues(overrides: Partial<FormValues> = {}): FormValues {
    return {
        title: "Pho chay",
        type: "blog",
        summary: "",
        content: { type: "doc", content: [{ type: "paragraph" }] },
        rawContent: "  Pho chay  ",
        // URL hợp lệ để test nguồn video không bị lỗi URL ảnh bìa che mất.
        featuredImageUrl: "https://x.test/cover.png",
        videoUrl: "",
        categoryIds: [],
        ...overrides,
    };
}

describe("buildValidationSchema", () => {
    it("tiêu đề rỗng bị từ chối", async () => {
        const schema = buildValidationSchema(t, false);

        await expect(schema.validateAt("title", { title: "   " })).rejects.toThrow("This field is required");
    });

    it("tiêu đề dài quá 255 ký tự bị từ chối", async () => {
        const schema = buildValidationSchema(t, false);

        await expect(schema.validateAt("title", { title: "a".repeat(256) })).rejects.toThrow(
            "Must be at most 255 characters",
        );
    });

    it("blog không cần nguồn video", async () => {
        const schema = buildValidationSchema(t, false);

        await expect(schema.validate(makeValues({ type: "blog", videoUrl: "" }))).resolves.toBeTruthy();
    });

    it("video mới tạo mà thiếu nguồn video thì bị từ chối", async () => {
        const schema = buildValidationSchema(t, false);

        await expect(schema.validate(makeValues({ type: "video", videoUrl: "" }))).rejects.toThrow(
            "Please upload a video file",
        );
    });

    it("video đang sửa thì không bắt nhập lại nguồn (đã có trên server)", async () => {
        const schema = buildValidationSchema(t, true);

        await expect(schema.validate(makeValues({ type: "video", videoUrl: "" }))).resolves.toBeTruthy();
    });

    it("URL ảnh bìa sai định dạng bị từ chối", async () => {
        const schema = buildValidationSchema(t, false);

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

    it("bài blog KHÔNG gửi videoUrl dù có giá trị", () => {
        const patch = buildPatch(makeValues({ type: "blog", videoUrl: "https://x.test/v.mp4" }));

        expect(patch).not.toHaveProperty("videoUrl");
    });

    it("bài video gửi videoUrl đã trim", () => {
        const patch = buildPatch(makeValues({ type: "video", videoUrl: "  https://x.test/v.mp4  " }));

        expect(patch.videoUrl).toBe("https://x.test/v.mp4");
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
});
