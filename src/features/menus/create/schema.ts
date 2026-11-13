import type { MealType } from "../types";
import { addDays, parseISODate, toISODate } from "../week";

/**
 * Luật tuần sống ở `types.ts` vì bảng tuần (`MenuCard`) cũng cần hiển thị — đừng khai báo lại.
 * Re-export để chỗ đang import từ `./schema` không phải sửa.
 */
export { MAX_DISH_REPEATS, MAX_NOTES_LENGTH, MEAL_TYPES, MIN_DISTINCT_DISHES } from "../types";
import { MEAL_TYPES } from "../types";

/** Món đã chọn — chỉ giữ đủ để gửi `dishId` và hiện tên. */
export interface PickedDish {
    id: string;
    name: string;
}

/**
 * Một ô bữa. `dish: null` = bữa trống, không gửi lên.
 * Không có `servings` — thực đơn là của cá nhân nên luôn gửi 1 (xem `payload.ts`).
 */
export interface MealSlot {
    mealType: MealType;
    dish: PickedDish | null;
}

export interface DayForm {
    /** YYYY-MM-DD */
    date: string;
    /** Luôn đủ 3, theo thứ tự BREAKFAST → LUNCH → DINNER. */
    slots: MealSlot[];
}

export interface MenuFormValues {
    /** Ngày bắt đầu của 7 ngày — thứ mấy cũng được (backend chỉ kiểm đúng 7 ngày liền kề). */
    startDate: string;
    notes: string;
    /** Luôn đủ 7, tính từ `startDate`. */
    days: DayForm[];
}

function emptySlots(): MealSlot[] {
    return MEAL_TYPES.map((mealType) => ({ mealType, dish: null }));
}

/** 7 ngày rỗng liên tiếp từ `startDate`, mỗi ngày đủ 3 ô trống. */
export function emptyWeek(startDate: string): MenuFormValues {
    const first = parseISODate(startDate);
    return {
        startDate,
        notes: "",
        days: Array.from({ length: 7 }, (_, index) => ({
            date: toISODate(addDays(first, index)),
            slots: emptySlots(),
        })),
    };
}

/**
 * Dịch cửa sổ 7 ngày sang `startDate` mới mà **giữ món theo vị trí** (ngày 1 vẫn là ngày 1) —
 * user đang lập plan cho khoảng khác, không phải xoá đi làm lại.
 */
export function moveWeek(values: MenuFormValues, startDate: string): MenuFormValues {
    const first = parseISODate(startDate);
    return {
        ...values,
        startDate,
        days: values.days.map((day, index) => ({ ...day, date: toISODate(addDays(first, index)) })),
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

/**
 * Ghi cùng một món (hoặc xoá nếu `dish = null`) vào ô `mealType` của những ngày được chọn.
 * Trả values mới — đây là đường ghi duy nhất của form, cả popover lẫn nút xoá ô đều đi qua đây.
 */
export function setDishInDays(
    values: MenuFormValues,
    mealType: MealType,
    dayIndexes: readonly number[],
    dish: PickedDish | null,
): MenuFormValues {
    const targets = new Set(dayIndexes);
    return {
        ...values,
        days: values.days.map((day, index) =>
            targets.has(index)
                ? {
                      ...day,
                      slots: day.slots.map((slot) =>
                          slot.mealType === mealType ? { ...slot, dish } : slot,
                      ),
                  }
                : day,
        ),
    };
}

/** Món dùng nhiều nhất — `null` khi chưa chọn món nào. */
export function mostRepeatedDish(values: MenuFormValues): { name: string; count: number } | null {
    let worst: { name: string; count: number } | null = null;
    for (const entry of dishUsage(values).values()) {
        if (!worst || entry.count > worst.count) worst = entry;
    }
    return worst;
}
