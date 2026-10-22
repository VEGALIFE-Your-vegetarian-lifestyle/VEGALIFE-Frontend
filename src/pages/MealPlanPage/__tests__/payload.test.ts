// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
    MAX_DISH_USES,
    MIN_DISTINCT_DISHES,
    addDays,
    buildDays,
    detailToSlots,
    dishUsage,
    formatDayLabel,
    isMonday,
    parseISODate,
    sortMeals,
    validateWeek,
    weekDates,
    weekStartOf,
    type DraftSlots,
} from "@/pages/MealPlanPage/payload";
import type { MenuDetail } from "@/types/menu";

// Logic thuần: không gọi backend, không cần JWT.

const MONDAY = "2026-10-19";

describe("parseISODate / addDays", () => {
    it("đọc ngày theo UTC, không lệch múi giờ", () => {
        expect(parseISODate(MONDAY)?.toISOString()).toBe("2026-10-19T00:00:00.000Z");
    });

    it("từ chối chuỗi không phải YYYY-MM-DD", () => {
        expect(parseISODate("19/10/2026")).toBeNull();
        expect(parseISODate("")).toBeNull();
    });

    it("cộng ngày bắc qua tháng", () => {
        expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
        expect(addDays(MONDAY, -1)).toBe("2026-10-18");
    });
});

describe("isMonday / weekStartOf / weekDates", () => {
    it("nhận đúng thứ Hai theo UTC", () => {
        expect(isMonday(MONDAY)).toBe(true);
        expect(isMonday("2026-10-20")).toBe(false);
    });

    it("Chủ nhật lùi về thứ Hai của tuần chứa nó", () => {
        expect(weekStartOf("2026-10-25")).toBe(MONDAY);
        expect(weekStartOf(MONDAY)).toBe(MONDAY);
    });

    it("sinh đúng 7 ngày liên tiếp", () => {
        const dates = weekDates(MONDAY);
        expect(dates).toHaveLength(7);
        expect(dates[0]).toBe(MONDAY);
        expect(dates[6]).toBe("2026-10-25");
    });
});

describe("buildDays / dishUsage", () => {
    const slots: DraftSlots = {
        [`${MONDAY}|BREAKFAST`]: { dishId: "d1", dishName: "Pho", servings: 2 },
        [`${MONDAY}|DINNER`]: { dishId: "d1", dishName: "Pho", servings: 1 },
    };

    it("chỉ gửi slot có món, giữ đúng thứ tự bữa", () => {
        const [day] = buildDays([MONDAY], slots);
        expect(day.meals.map((meal) => meal.mealType)).toEqual(["BREAKFAST", "DINNER"]);
        expect(day.meals[0]).toEqual({ mealType: "BREAKFAST", dishId: "d1", servings: 2 });
    });

    it("ngày trống sinh meals rỗng", () => {
        const [, second] = buildDays([MONDAY, "2026-10-20"], slots);
        expect(second.meals).toEqual([]);
    });

    it("đếm số lần dùng món", () => {
        expect(dishUsage(slots).get("d1")).toBe(2);
    });
});

describe("validateWeek", () => {
    const oneMealPerDay = (dishId: (date: string) => string): DraftSlots =>
        Object.fromEntries(
            weekDates(MONDAY).map(
                (date) => [`${date}|LUNCH`, { dishId: dishId(date), dishName: date, servings: 1 }] as const,
            ),
        );

    const full = oneMealPerDay((date) => `dish-${date}`);

    it("tuần đủ 7 ngày, mỗi ngày 1 bữa → hợp lệ", () => {
        expect(validateWeek(weekDates(MONDAY), full)).toEqual([]);
    });

    it("báo ngày thiếu bữa", () => {
        const missing = { ...full };
        delete missing[`${MONDAY}|LUNCH`];
        expect(validateWeek(weekDates(MONDAY), missing)).toEqual([`emptyDay:${MONDAY}`]);
    });

    it("báo servings không phải số nguyên ≥ 1", () => {
        const bad = {
            ...full,
            [`${MONDAY}|LUNCH`]: { dishId: "d", dishName: "d", servings: 0 },
        };
        expect(validateWeek(weekDates(MONDAY), bad)).toEqual([`servings:${MONDAY}:LUNCH`]);
    });

    it("báo khi không đủ 7 ngày", () => {
        expect(validateWeek([MONDAY], full)).toContain("days");
    });

    it("không tự chặn rule server-owned của BR-MENU-005", () => {
        // 7 ngày dùng chung 1 món: vi phạm ≥5 món và ≤3 lần/món, nhưng client phải để server chặn.
        const sameDish = oneMealPerDay(() => "only");
        expect(validateWeek(weekDates(MONDAY), sameDish)).toEqual([]);
        expect(dishUsage(sameDish).get("only")).toBeGreaterThan(MAX_DISH_USES);
        expect(dishUsage(sameDish).size).toBeLessThan(MIN_DISTINCT_DISHES);
    });
});

describe("detailToSlots / sortMeals", () => {
    const detail: MenuDetail = {
        id: "m1",
        startDate: MONDAY,
        endDate: "2026-10-25",
        status: "drafted",
        notes: null,
        createdAt: "2026-10-19T00:00:00.000Z",
        updatedAt: "2026-10-19T00:00:00.000Z",
        days: [
            {
                date: MONDAY,
                meals: [
                    {
                        mealType: "DINNER",
                        servings: 1,
                        dish: { id: "d2", name: "B", description: null, imageUrl: null, cuisineType: null },
                    },
                    {
                        mealType: "BREAKFAST",
                        servings: 2,
                        dish: { id: "d1", name: "A", description: null, imageUrl: null, cuisineType: "VN" },
                    },
                ],
            },
        ],
    };

    it("đổ detail vào slots", () => {
        const slots = detailToSlots(detail);
        expect(slots[`${MONDAY}|BREAKFAST`]).toEqual({ dishId: "d1", dishName: "A", servings: 2 });
    });

    it("sắp bữa theo BREAKFAST → LUNCH → DINNER mà không sửa mảng gốc", () => {
        const sorted = sortMeals(detail.days[0]);
        expect(sorted.map((meal) => meal.mealType)).toEqual(["BREAKFAST", "DINNER"]);
        expect(detail.days[0].meals[0].mealType).toBe("DINNER");
    });
});

describe("formatDayLabel", () => {
    it("không lệch ngày ở múi giờ âm (UTC-based)", () => {
        // Nếu dùng `new Date("2026-10-19")` rồi toLocaleDateString local, máy UTC-7 ra 18/10.
        expect(formatDayLabel(MONDAY, "en")).toContain("19");
        expect(formatDayLabel(MONDAY, "vi")).toContain("19");
    });

    it("chuỗi hỏng trả rỗng thay vì Invalid Date", () => {
        expect(formatDayLabel("not-a-date", "en")).toBe("");
    });
});
