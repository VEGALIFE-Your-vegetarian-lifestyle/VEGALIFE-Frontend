// @vitest-environment node
import { describe, expect, it } from "vitest";
import { addDays, parseISODate, shiftWeek, startOfWeek, toISODate, weekDays } from "../week";

const day = (iso: string) => parseISODate(iso);

describe("parseISODate / toISODate", () => {
    it("round-trip giữ nguyên ngày", () => {
        expect(toISODate(parseISODate("2026-10-05"))).toBe("2026-10-05");
    });

    it("parse ra ngày LOCAL, không phải UTC", () => {
        const date = day("2026-10-05");
        expect(date.getFullYear()).toBe(2026);
        expect(date.getMonth()).toBe(9);
        expect(date.getDate()).toBe(5);
    });

    it("đệm 0 cho tháng và ngày một chữ số", () => {
        expect(toISODate(new Date(2026, 0, 3))).toBe("2026-01-03");
    });

    it("chuỗi rác → Invalid Date", () => {
        expect(Number.isNaN(parseISODate("abc").getTime())).toBe(true);
        expect(Number.isNaN(parseISODate("2026-10").getTime())).toBe(true);
        expect(Number.isNaN(parseISODate("").getTime())).toBe(true);
    });

    it("ngày không tồn tại → Invalid Date (không tự nhảy tháng)", () => {
        expect(Number.isNaN(parseISODate("2026-02-31").getTime())).toBe(true);
    });
});

describe("startOfWeek", () => {
    it("Thứ 2 trả về chính nó", () => {
        expect(toISODate(startOfWeek(day("2026-10-05")))).toBe("2026-10-05");
    });

    it("Chủ nhật lùi 6 ngày", () => {
        expect(toISODate(startOfWeek(day("2026-10-11")))).toBe("2026-10-05");
    });

    it("Thứ 4 lùi 2 ngày", () => {
        expect(toISODate(startOfWeek(day("2026-10-07")))).toBe("2026-10-05");
    });

    it("bỏ giờ/phút/giây của đầu vào", () => {
        const date = new Date(2026, 9, 7, 23, 59, 59);
        expect(toISODate(startOfWeek(date))).toBe("2026-10-05");
    });
});

describe("addDays", () => {
    it("qua ranh giới tháng", () => {
        expect(toISODate(addDays(day("2026-10-31"), 1))).toBe("2026-11-01");
    });

    it("qua ranh giới năm", () => {
        expect(toISODate(addDays(day("2026-12-31"), 1))).toBe("2027-01-01");
        expect(toISODate(addDays(day("2027-01-01"), -1))).toBe("2026-12-31");
    });

    it("số âm", () => {
        expect(toISODate(addDays(day("2026-10-05"), -7))).toBe("2026-09-28");
    });

    it("không sửa Date gốc", () => {
        const original = day("2026-10-05");
        addDays(original, 3);
        expect(toISODate(original)).toBe("2026-10-05");
    });
});

describe("weekDays", () => {
    it("7 ngày liên tiếp, bắt đầu từ Thứ 2", () => {
        const days = weekDays(day("2026-10-05")).map(toISODate);
        expect(days).toEqual([
            "2026-10-05",
            "2026-10-06",
            "2026-10-07",
            "2026-10-08",
            "2026-10-09",
            "2026-10-10",
            "2026-10-11",
        ]);
    });
});

describe("shiftWeek", () => {
    it("+1 qua ranh giới tháng", () => {
        expect(toISODate(shiftWeek(day("2026-10-26"), 1))).toBe("2026-11-02");
    });

    it("-1 qua ranh giới tháng", () => {
        expect(toISODate(shiftWeek(day("2026-10-05"), -1))).toBe("2026-09-28");
    });

    it("0 giữ nguyên", () => {
        expect(toISODate(shiftWeek(day("2026-10-05"), 0))).toBe("2026-10-05");
    });
});
