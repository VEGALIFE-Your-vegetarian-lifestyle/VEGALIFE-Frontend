import type { MealType, MenuDayInput, MenuDetail, MenuDayDetail } from "@/types/menu";

/** Thứ tự hiển thị + thứ tự gửi. Spec: `BREAKFAST|LUNCH|DINNER`. */
export const MEAL_TYPES: readonly MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];

/** BR-MENU-005: mỗi dish dùng tối đa 3 lần, tối thiểu 5 dish khác nhau. */
export const MAX_DISH_USES = 3;
export const MIN_DISTINCT_DISHES = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD` → Date ở UTC (tránh lệch ngày do timezone máy người dùng). */
export function parseISODate(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return Number.isNaN(date.getTime()) ? null : date;
}

export function toISODate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
    const date = parseISODate(iso);
    if (!date) return iso;
    return toISODate(new Date(date.getTime() + days * DAY_MS));
}

/** BR-MENU-004: tuần tính theo giờ server UTC. */
export function isMonday(iso: string): boolean {
    return parseISODate(iso)?.getUTCDay() === 1;
}

/** Thứ Hai của tuần ISO chứa `iso` (mặc định: hôm nay theo UTC). */
export function weekStartOf(iso: string = toISODate(new Date())): string {
    const date = parseISODate(iso);
    if (!date) return iso;
    const offset = (date.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
    return addDays(iso, -offset);
}

/** 7 ngày liên tiếp từ `startDate`. */
export function weekDates(startDate: string): string[] {
    return Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
}

export interface MealSlot {
    dishId: string;
    dishName: string;
    servings: number;
}

/** `date|mealType` → slot. Ngày không có slot nào thì ngày đó để trống. */
export type DraftSlots = Record<string, MealSlot>;

export const slotKey = (date: string, mealType: MealType): string => `${date}|${mealType}`;

export function readSlot(slots: DraftSlots, date: string, mealType: MealType): MealSlot | undefined {
    return slots[slotKey(date, mealType)];
}

/** Chỉ những slot có dish mới được gửi — ngày trống sinh `meals: []`. */
export function buildDays(dates: string[], slots: DraftSlots): MenuDayInput[] {
    return dates.map((date) => ({
        date,
        meals: MEAL_TYPES.flatMap((mealType) => {
            const slot = readSlot(slots, date, mealType);
            return slot ? [{ mealType, dishId: slot.dishId, servings: slot.servings }] : [];
        }),
    }));
}

/** Đếm số lần dùng từng dish — chỉ để hiển thị, server mới là nơi chặn (BR-MENU-005). */
export function dishUsage(slots: DraftSlots): Map<string, number> {
    const usage = new Map<string, number>();
    for (const slot of Object.values(slots)) {
        usage.set(slot.dishId, (usage.get(slot.dishId) ?? 0) + 1);
    }
    return usage;
}

/**
 * Kiểm tra cấu trúc mà UI có thể tạo ra: tuần đủ 7 ngày, mỗi ngày ≥ 1 bữa,
 * `servings ≥ 1`. Các rule còn lại của BR-MENU-005 (≥5 dish, ≤3 lần/dish) do
 * server quyết — client chỉ hiển thị bộ đếm, không tự chặn.
 */
export function validateWeek(dates: string[], slots: DraftSlots): string[] {
    const errors: string[] = [];

    if (dates.length !== 7) errors.push("days");

    for (const date of dates) {
        const meals = MEAL_TYPES.filter((mealType) => readSlot(slots, date, mealType));
        if (meals.length === 0) {
            errors.push(`emptyDay:${date}`);
            continue;
        }
        for (const mealType of meals) {
            const slot = readSlot(slots, date, mealType);
            if (!slot || !Number.isInteger(slot.servings) || slot.servings < 1) {
                errors.push(`servings:${date}:${mealType}`);
            }
        }
    }

    return errors;
}

/** #61 detail → slots để mở form sửa. */
export function detailToSlots(detail: MenuDetail): DraftSlots {
    const slots: DraftSlots = {};
    for (const day of detail.days) {
        for (const meal of day.meals) {
            slots[slotKey(day.date, meal.mealType)] = {
                dishId: meal.dish.id,
                dishName: meal.dish.name,
                servings: meal.servings,
            };
        }
    }
    return slots;
}

/** Meal của một ngày theo đúng thứ tự bữa, kể cả khi backend trả lệch thứ tự. */
export function sortMeals(day: MenuDayDetail) {
    return [...day.meals].sort(
        (a, b) => MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType),
    );
}

/**
 * `formatDateLocale` nhận ISO timestamp; menu trả `YYYY-MM-DD` nên `new Date()`
 * hiểu là nửa đêm UTC và ở múi giờ âm sẽ lùi mất một ngày. Định dạng theo UTC.
 */
export function formatDayLabel(iso: string, language: string): string {
    const date = parseISODate(iso);
    if (!date) return "";
    return date.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}
