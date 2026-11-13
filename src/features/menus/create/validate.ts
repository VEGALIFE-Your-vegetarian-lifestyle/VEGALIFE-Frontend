import type { TFunction } from "i18next";
import { MAX_DISH_REPEATS, MAX_NOTES_LENGTH, MIN_DISTINCT_DISHES, dishUsage, type MenuFormValues } from "./schema";
import { minStartDateISO } from "../week";

/**
 * Luật BR-MENU-005 dạng quan hệ giữa các ô (đếm trên cả tuần), nên không dùng Yup —
 * Yup mô tả schema theo từng field, nhồi vào `.test()` gốc thì vẫn phải viết hàm đếm y hệt
 * mà mất khả năng gắn lỗi vào đúng ô.
 *
 * Key lỗi: `days.<i>` (ngày trống), `week` (cấp tuần), `startDate` (ngày bắt đầu).
 * Lỗi `week` ưu tiên luật lặp (cụ thể hơn) trước luật thiếu món.
 */
export function validate(values: MenuFormValues, t: TFunction): Record<string, string> {
    const errors: Record<string, string> = {};

    // Ngày bắt đầu phải **sau hôm nay** (từ mai trở đi) — hôm nay cũng không hợp lệ.
    // Chặn ở đây để nút Lưu khoá trước khi gửi.
    if (values.startDate < minStartDateISO()) {
        errors.startDate = t("menu:create.errors.startInPast");
    }

    if (values.notes.length > MAX_NOTES_LENGTH) {
        errors.notes = t("menu:create.errors.notesTooLong", { max: MAX_NOTES_LENGTH });
    }

    // Luật 2: mỗi ngày ≥ 1 bữa (luật 3 tự thoả — mỗi ngày chỉ có 1 ô mỗi `mealType`).
    values.days.forEach((day, dayIndex) => {
        if (day.slots.every((slot) => slot.dish === null)) {
            errors[`days.${dayIndex}`] = t("menu:create.errors.dayEmpty");
        }
    });

    // Luật 6 + 7.
    const usage = dishUsage(values);
    const repeated = [...usage.values()].find((entry) => entry.count > MAX_DISH_REPEATS);
    if (repeated) {
        errors.week = t("menu:create.errors.tooManyRepeats", { name: repeated.name, max: MAX_DISH_REPEATS });
    } else if (usage.size < MIN_DISTINCT_DISHES) {
        errors.week = t("menu:create.errors.tooFewDishes", { count: usage.size, min: MIN_DISTINCT_DISHES });
    }

    return errors;
}
