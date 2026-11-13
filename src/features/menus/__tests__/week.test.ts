// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
    addDays,
    clampStartDate,
    minStartDateISO,
    parseISODate,
    startOfWeek,
    toISODate,
    todayISO,
    weekDays,
} from "../week";

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
    it("7 ngày liên tiếp từ ngày bắt đầu", () => {
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

    it("bắt đầu giữa tuần vẫn trả 7 ngày liền kề", () => {
        expect(toISODate(weekDays(day("2026-10-08"))[6])).toBe("2026-10-14");
    });
});

describe("clampStartDate / minStartDateISO", () => {
    it("minStartDateISO là ngày mai, đúng định dạng YYYY-MM-DD", () => {
        expect(minStartDateISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(minStartDateISO()).toBe(toISODate(addDays(new Date(), 1)));
    });

    it("ngày trong quá khứ và hôm nay đều bị kẹp về ngày mai", () => {
        expect(clampStartDate("2020-01-01")).toBe(minStartDateISO());
        expect(clampStartDate(todayISO())).toBe(minStartDateISO());
    });

    it("từ ngày mai trở đi giữ nguyên", () => {
        expect(clampStartDate(minStartDateISO())).toBe(minStartDateISO());
        expect(clampStartDate("2099-01-01")).toBe("2099-01-01");
    });
});
