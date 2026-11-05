// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";
import i18n from "@/i18n";
import {
    MAX_DISH_REPEATS,
    MEAL_TYPES,
    daysWithMeals,
    dishUsage,
    emptyWeek,
    mostRepeatedDish,
    moveWeek,
    type MenuFormValues,
    type PickedDish,
} from "../schema";
import { validate } from "../validate";
import { buildCreateMenuPayload } from "../payload";

// i18n đã init sẵn (setup.ts) nên `t` dùng được ngay, không cần React.
const t = i18n.t.bind(i18n) as unknown as TFunction;

const dish = (id: string): PickedDish => ({ id, name: `Món ${id}` });

/** Tuần hợp lệ tối thiểu: 7 ngày, mỗi ngày 1 bữa sáng, 5 món khác nhau. */
function validWeek(): MenuFormValues {
    const values = emptyWeek("2026-10-05");
    const ids = ["a", "b", "c", "d", "e", "a", "b"];
    values.days.forEach((day, index) => {
        day.slots[0].dish = dish(ids[index]);
    });
    return values;
}

describe("emptyWeek", () => {
    it("tạo đúng 7 ngày liên tiếp từ startDate", () => {
        const dates = emptyWeek("2026-10-05").days.map((day) => day.date);
        expect(dates).toEqual([
            "2026-10-05",
            "2026-10-06",
            "2026-10-07",
            "2026-10-08",
            "2026-10-09",
            "2026-10-10",
            "2026-10-11",
        ]);
    });

    it("mỗi ngày đủ 3 slot đúng thứ tự và đều trống", () => {
        for (const day of emptyWeek("2026-10-05").days) {
            expect(day.slots.map((slot) => slot.mealType)).toEqual(MEAL_TYPES);
            expect(day.slots.every((slot) => slot.dish === null)).toBe(true);
        }
    });
});

describe("moveWeek", () => {
    it("giữ món theo vị trí trong tuần, chỉ đổi ngày", () => {
        const before = validWeek();
        const after = moveWeek(before, "2026-10-12");

        expect(after.startDate).toBe("2026-10-12");
        expect(after.days[0].date).toBe("2026-10-12");
        expect(after.days[6].date).toBe("2026-10-18");
        // Thứ 2 vẫn giữ món của thứ 2 tuần cũ.
        expect(after.days[0].slots[0].dish?.id).toBe("a");
        expect(after.days[3].slots[0].dish?.id).toBe("d");
    });

    it("giữ nguyên notes", () => {
        const values = { ...validWeek(), notes: "Tuần nhiều đạm" };
        expect(moveWeek(values, "2026-10-12").notes).toBe("Tuần nhiều đạm");
    });
});

describe("dishUsage / daysWithMeals / mostRepeatedDish", () => {
    it("bỏ ô trống và đếm đúng số lần dùng", () => {
        const usage = dishUsage(validWeek());
        expect(usage.size).toBe(5);
        expect(usage.get("a")?.count).toBe(2);
        expect(usage.get("c")?.count).toBe(1);
    });

    it("ngày toàn ô trống không được tính", () => {
        const values = emptyWeek("2026-10-05");
        values.days[0].slots[1].dish = dish("x");
        expect(daysWithMeals(values)).toBe(1);
    });

    it("mostRepeatedDish trả null khi chưa chọn món", () => {
        expect(mostRepeatedDish(emptyWeek("2026-10-05"))).toBeNull();
    });

    it("mostRepeatedDish trả món dùng nhiều nhất", () => {
        const values = emptyWeek("2026-10-05");
        values.days[0].slots[0].dish = dish("x");
        values.days[0].slots[1].dish = dish("x");
        values.days[0].slots[2].dish = dish("y");
        expect(mostRepeatedDish(values)).toEqual({ name: "Món x", count: 2 });
    });
});

describe("validate", () => {
    it("tuần hợp lệ không có lỗi", () => {
        expect(validate(validWeek(), t)).toEqual({});
    });

    it("ngày không có bữa nào báo lỗi đúng ngày", () => {
        const values = validWeek();
        values.days[2].slots[0].dish = null;
        expect(validate(values, t)["days.2"]).toBeTruthy();
    });

    it("servings = 0 báo lỗi đúng ô", () => {
        const values = validWeek();
        values.days[1].slots[0].servings = "0";
        expect(validate(values, t)["days.1.slots.0.servings"]).toBeTruthy();
    });

    it("servings không nguyên báo lỗi", () => {
        const values = validWeek();
        values.days[1].slots[0].servings = "1.5";
        expect(validate(values, t)["days.1.slots.0.servings"]).toBeTruthy();
    });

    it("servings không phải số báo lỗi", () => {
        const values = validWeek();
        values.days[1].slots[0].servings = "abc";
        expect(validate(values, t)["days.1.slots.0.servings"]).toBeTruthy();
    });

    it("ô trống không bị kiểm servings", () => {
        const values = validWeek();
        values.days[1].slots[2].servings = "abc"; // slot 2 vẫn trống
        expect(validate(values, t)["days.1.slots.2.servings"]).toBeUndefined();
    });

    it("dưới 5 món khác nhau báo lỗi cấp tuần", () => {
        const values = emptyWeek("2026-10-05");
        const ids = ["a", "b", "c", "d", "a", "b", "c"];
        values.days.forEach((day, index) => {
            day.slots[0].dish = dish(ids[index]);
        });
        expect(validate(values, t).week).toContain("5");
    });

    it("một món quá 3 lần báo lỗi và ưu tiên hơn thiếu món", () => {
        const values = emptyWeek("2026-10-05");
        // 1 món × 4 lần → vi phạm cả luật 6 lẫn luật 7; thông báo phải là luật 6.
        values.days.forEach((day) => {
            day.slots[0].dish = dish("a");
        });
        const errors = validate(values, t);
        expect(errors.week).toContain(`Món a`);
        expect(errors.week).toContain(String(MAX_DISH_REPEATS));
    });

    it("notes quá dài báo lỗi", () => {
        const values = { ...validWeek(), notes: "x".repeat(501) };
        expect(validate(values, t).notes).toBeTruthy();
    });
});

describe("buildCreateMenuPayload", () => {
    it("bỏ ô trống khỏi meals và đổi servings sang number", () => {
        const values = validWeek();
        values.days[0].slots[1].dish = dish("z");
        values.days[0].slots[1].servings = "3";

        const payload = buildCreateMenuPayload(values);
        expect(payload.days[0].meals).toEqual([
            { mealType: "BREAKFAST", dishId: "a", servings: 1 },
            { mealType: "LUNCH", dishId: "z", servings: 3 },
        ]);
    });

    it("luôn gửi đủ 7 ngày", () => {
        expect(buildCreateMenuPayload(validWeek()).days).toHaveLength(7);
    });

    it("notes rỗng không gửi key", () => {
        expect(buildCreateMenuPayload(validWeek())).not.toHaveProperty("notes");
    });

    it("notes có giá trị được trim và gửi", () => {
        const values = { ...validWeek(), notes: "  Tuần chay  " };
        expect(buildCreateMenuPayload(values).notes).toBe("Tuần chay");
    });
});
