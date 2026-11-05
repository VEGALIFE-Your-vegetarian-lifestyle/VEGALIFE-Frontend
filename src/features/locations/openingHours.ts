import type { OpeningHours } from "./types";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

/** Chấp nhận key tiếng Anh dạng đầy đủ hoặc 3 chữ cái, không phân biệt hoa thường: "Monday", "mon". */
const dayIndex = (key: string) =>
    DAYS.findIndex((day) => day === key.toLowerCase() || day.slice(0, 3) === key.toLowerCase());

// Thứ Hai = 0 … Chủ nhật = 6; key không nhận ra xếp cuối.
const order = (index: number) => (index < 0 ? 99 : (index + 6) % 7);

const toMinutes = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    return hour * 60 + minute;
};

const formatRanges = (ranges: { open: string; close: string }[]) =>
    ranges.map((range) => `${range.open} - ${range.close}`).join(", ");

/** Danh sách theo thứ tự thứ Hai đến Chủ nhật; key lạ giữ nguyên ở cuối. `today` đánh dấu ngày của `now`. */
export function formatOpeningHours(openingHours: OpeningHours, now: Date = new Date()) {
    const today = now.getDay();
    return Object.entries(openingHours)
        .map(([key, ranges]) => ({ key, index: dayIndex(key), ranges }))
        .sort((a, b) => order(a.index) - order(b.index))
        .map(({ key, index, ranges }) => ({
            day: key.charAt(0).toUpperCase() + key.slice(1),
            /** Tên thứ chuẩn (monday…sunday) để dịch; key lạ thì không có. */
            dayKey: index < 0 ? undefined : DAYS[index],
            hours: ranges.length > 0 ? formatRanges(ranges) : "—",
            today: index === today,
        }));
}

/** Có đang mở lúc `now` không (theo giờ máy người dùng). Không có giờ cho hôm nay thì coi là đóng. */
export function isOpenNow(openingHours: OpeningHours, now: Date = new Date()): boolean {
    const entry = Object.entries(openingHours).find(([key]) => dayIndex(key) === now.getDay());
    if (!entry) return false;
    const minutes = now.getHours() * 60 + now.getMinutes();
    return entry[1].some((range) => toMinutes(range.open) <= minutes && minutes < toMinutes(range.close));
}
