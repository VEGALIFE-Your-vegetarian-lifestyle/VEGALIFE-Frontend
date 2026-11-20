// @vitest-environment jsdom
/**
 * jsdom không có `MediaRecorder` / `canvas.captureStream` — đúng trường hợp trình
 * duyệt cũ. Hàm phải trả nguyên file, không ném: upload vẫn chạy tiếp.
 */
import { describe, expect, it } from "vitest";
import { compressVideo } from "../compressVideo";

function makeFile(bytes: number) {
    return new File([new Uint8Array(bytes)], "clip.mp4", { type: "video/mp4" });
}

describe("compressVideo — thoái hoá an toàn", () => {
    it("file nhỏ trả nguyên", async () => {
        const file = makeFile(1024);
        expect(await compressVideo(file)).toBe(file);
    });

    it("file lớn nhưng thiếu MediaRecorder trả nguyên", async () => {
        const file = makeFile(9 * 1024 * 1024);
        expect(await compressVideo(file)).toBe(file);
    });
});
