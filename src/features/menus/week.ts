/**
 * Tính tuần trên `Date` local — backend trả ngày dạng `YYYY-MM-DD` (không có giờ),
 * nên mọi phép tính ở đây phải giữ nguyên ngày theo giờ máy.
 */

const pad = (value: number) => String(value).padStart(2, "0");

/** Date → "YYYY-MM-DD" theo giờ máy. */
export function toISODate(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * "YYYY-MM-DD" → Date local.
 * KHÔNG dùng `new Date(iso)`: chuỗi chỉ có ngày được parse thành UTC midnight, nên ở
 * múi giờ âm sẽ lùi mất một ngày. Chuỗi sai định dạng trả `Invalid Date` để chỗ gọi fallback.
 */
export function parseISODate(iso: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!match) return new Date(NaN);

    const [, year, month, day] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    // Chặn ngày không tồn tại (vd "2026-02-31" tự nhảy sang tháng 3).
    return date.getMonth() === Number(month) - 1 ? date : new Date(NaN);
}

/** Thứ 2 của tuần chứa `date` (tuần ISO: T2 → CN). */
export function startOfWeek(date: Date): Date {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    // getDay(): CN = 0 → đổi về Thứ 2 = 0.
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return monday;
}

/** Cộng/trừ ngày, trả Date mới. */
export function addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** 7 ngày của tuần, bắt đầu từ `monday`. */
export function weekDays(monday: Date): Date[] {
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** Dịch tuần đi `weeks` tuần (âm = lùi). */
export function shiftWeek(monday: Date, weeks: number): Date {
    return addDays(monday, weeks * 7);
}
