// @vitest-environment node
import { describe, expect, it } from "vitest";
import { currentWeekRange, toISODate } from "../homeData";

describe("currentWeekRange", () => {
    it("bắt đầu từ thứ Hai, đủ 7 ngày liên tiếp", () => {
        // 2026-10-29 là thứ Năm.
        const { from, to, days } = currentWeekRange(new Date(2026, 9, 29));
        expect(from).toBe("2026-10-26");
        expect(to).toBe("2026-11-01");
        expect(days).toHaveLength(7);
        expect(days[0]).toBe(from);
        expect(days[6]).toBe(to);
    });

    it("Chủ nhật thuộc tuần đang chạy, không nhảy sang tuần sau", () => {
        const { from, to } = currentWeekRange(new Date(2026, 10, 1)); // Chủ nhật 01/11
        expect(from).toBe("2026-10-26");
        expect(to).toBe("2026-11-01");
    });

    it("thứ Hai là chính nó", () => {
        const { from } = currentWeekRange(new Date(2026, 9, 26)); // thứ Hai 26/10
        expect(from).toBe("2026-10-26");
    });

    it("bắc qua ranh giới tháng/năm", () => {
        const { from, to } = currentWeekRange(new Date(2027, 0, 1)); // thứ Sáu 01/01/2027
        expect(from).toBe("2026-12-28");
        expect(to).toBe("2027-01-03");
    });

    it("dùng giờ máy, không lệch vì UTC", () => {
        expect(toISODate(new Date(2026, 0, 1))).toBe("2026-01-01");
    });
});
