// @vitest-environment node
import { describe, expect, it } from "vitest";
import { stripMarkdown } from "../display";

describe("stripMarkdown", () => {
    it("bỏ tiêu đề và gạch đầu dòng, gộp khoảng trắng", () => {
        expect(stripMarkdown("## Nguyên liệu\n- 2 miếng đậu hũ non\n- 1 thìa canh tương")).toBe(
            "Nguyên liệu 2 miếng đậu hũ non 1 thìa canh tương",
        );
    });

    it("giữ chữ trong link, bỏ ảnh và code fence", () => {
        expect(stripMarkdown("Xem [công thức](https://a.b) ![ảnh](x.png)\n```\ncode\n```")).toBe(
            "Xem công thức",
        );
    });

    it("bỏ đậm/nghiêng nhưng không phá gạch dưới trong tên", () => {
        expect(stripMarkdown("**Đậu hũ** *non* và rau_cải")).toBe("Đậu hũ non và rau_cải");
    });

    it("text thuần giữ nguyên", () => {
        expect(stripMarkdown("Bữa sáng nhanh gọn")).toBe("Bữa sáng nhanh gọn");
    });
});
