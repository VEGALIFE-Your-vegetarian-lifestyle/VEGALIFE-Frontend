import type { MealType } from "../../types";
import { addDays, parseISODate, toISODate } from "../../week";

export const MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];

/** Khớp `MenuValidator` backend — sai là 400 cả tuần, không lưu gì. */
export const MIN_DISTINCT_DISHES = 5;
export const MAX_DISH_REPEATS = 3;
export const MIN_SERVINGS = 1;
export const MAX_NOTES_LENGTH = 500;

/** Món đã chọn — chỉ giữ đủ để gửi `dishId` và hiện tên. */
export interface PickedDish {
    id: string;
    name: string;
}

/** Một ô bữa. `dish: null` = bữa trống, không gửi lên. */
export interface MealSlot {
    mealType: MealType;
    dish: PickedDish | null;
    /** Chuỗi vì `<input type="number">` trả string. */
    servings: string;
}

export interface DayForm {
    /** YYYY-MM-DD */
    date: string;
    /** Luôn đủ 3, theo thứ tự BREAKFAST → LUNCH → DINNER. */
    slots: MealSlot[];
}

export interface MenuFormValues {
    /** Thứ 2 của tuần. */
    startDate: string;
    notes: string;
    /** Luôn đủ 7, tính từ `startDate`. */
    days: DayForm[];
}

function emptySlots(): MealSlot[] {
    return MEAL_TYPES.map((mealType) => ({ mealType, dish: null, servings: "1" }));
}

/** Tuần rỗng: 7 ngày liên tiếp từ `startDate`, mỗi ngày đủ 3 ô trống. */
export function emptyWeek(startDate: string): MenuFormValues {
    const monday = parseISODate(startDate);
    return {
        startDate,
        notes: "",
        days: Array.from({ length: 7 }, (_, index) => ({
            date: toISODate(addDays(monday, index)),
            slots: emptySlots(),
        })),
    };
}

/**
 * Đổi tuần mà **giữ món theo vị trí trong tuần** (thứ 2 vẫn là thứ 2) — user đang lập
 * plan cho tuần khác, không phải xoá đi làm lại.
 */
export function moveWeek(values: MenuFormValues, startDate: string): MenuFormValues {
    const monday = parseISODate(startDate);
    return {
        ...values,
        startDate,
        days: values.days.map((day, index) => ({ ...day, date: toISODate(addDays(monday, index)) })),
    };
}

/** Đếm số lần mỗi món được dùng trong tuần (bỏ ô trống). */
export function dishUsage(values: MenuFormValues): Map<string, { name: string; count: number }> {
    const usage = new Map<string, { name: string; count: number }>();
    for (const day of values.days) {
        for (const slot of day.slots) {
            if (!slot.dish) continue;
            const current = usage.get(slot.dish.id);
            usage.set(slot.dish.id, { name: slot.dish.name, count: (current?.count ?? 0) + 1 });
        }
    }
    return usage;
}

/** Số ngày có ít nhất một bữa. */
export function daysWithMeals(values: MenuFormValues): number {
    return values.days.filter((day) => day.slots.some((slot) => slot.dish !== null)).length;
}

/** Món dùng nhiều nhất — `null` khi chưa chọn món nào. */
export function mostRepeatedDish(values: MenuFormValues): { name: string; count: number } | null {
    let worst: { name: string; count: number } | null = null;
    for (const entry of dishUsage(values).values()) {
        if (!worst || entry.count > worst.count) worst = entry;
    }
    return worst;
}
