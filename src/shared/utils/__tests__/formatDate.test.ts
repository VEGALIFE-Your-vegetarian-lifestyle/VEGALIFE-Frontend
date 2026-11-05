// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "../formatDate";

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const HOUR = 3600_000;

describe("formatRelativeTime", () => {
    it("dưới 1 phút không rơi về 'now' của phút trước", () => {
        expect(formatRelativeTime(ago(20_000), "en")).toBe("20 seconds ago");
        expect(formatRelativeTime(ago(20_000), "vi")).toMatch(/20 giây/);
    });

    it("giờ và ngày theo locale", () => {
        expect(formatRelativeTime(ago(2 * HOUR), "en")).toBe("2 hours ago");
        expect(formatRelativeTime(ago(2 * HOUR), "vi")).toMatch(/2 giờ/);
        expect(formatRelativeTime(ago(48 * HOUR), "en")).toBe("2 days ago");
    });

    it("chuỗi hỏng trả rỗng để chỗ gọi && được", () => {
        expect(formatRelativeTime("không-phải-ngày", "en")).toBe("");
    });
});
