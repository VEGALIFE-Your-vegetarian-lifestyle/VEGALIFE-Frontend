import { describe, expect, it } from "vitest";
import { formatOpeningHours, isOpenNow } from "@/utils/openingHours";

const HOURS = {
    monday: [
        { open: "08:00", close: "12:00" },
        { open: "14:00", close: "21:00" },
    ],
    tuesday: [{ open: "08:00", close: "21:00" }],
    sunday: [],
};

// 2026-10-12 là thứ Hai.
const monday = (time: string) => new Date(`2026-10-12T${time}:00`);

describe("formatOpeningHours", () => {
    it("liệt kê từ thứ Hai, nối các khung giờ, đánh dấu hôm nay", () => {
        const rows = formatOpeningHours(HOURS, monday("10:00"));

        expect(rows.map((row) => row.day)).toEqual(["Monday", "Tuesday", "Sunday"]);
        expect(rows[0]).toEqual({
            day: "Monday",
            dayKey: "monday",
            hours: "08:00 - 12:00, 14:00 - 21:00",
            today: true,
        });
        expect(rows[1].today).toBe(false);
        expect(rows[2].hours).toBe("—");
    });
});

describe("isOpenNow", () => {
    it("mở trong khung giờ, đóng ngoài khung giờ và giữa hai ca", () => {
        expect(isOpenNow(HOURS, monday("09:30"))).toBe(true);
        expect(isOpenNow(HOURS, monday("13:00"))).toBe(false);
        expect(isOpenNow(HOURS, monday("21:00"))).toBe(false);
    });

    it("không có giờ cho hôm nay thì đóng", () => {
        expect(isOpenNow({ tuesday: HOURS.tuesday }, monday("10:00"))).toBe(false);
    });

    it("nhận key viết tắt, không phân biệt hoa thường", () => {
        expect(isOpenNow({ Mon: [{ open: "08:00", close: "12:00" }] }, monday("09:00"))).toBe(true);
    });
});
