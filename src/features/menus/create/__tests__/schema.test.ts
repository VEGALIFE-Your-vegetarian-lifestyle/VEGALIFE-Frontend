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
    setDishInDays,
    type MenuFormValues,
    type PickedDish,
} from "../schema";
import { validate } from "../validate";
import { buildCreateMenuPayload } from "../payload";
import { minStartDateISO, todayISO } from "../../week";

// i18n đã init sẵn (setup.ts) nên `t` dùng được ngay, không cần React.
const t = i18n.t.bind(i18n) as unknown as TFunction;

const dish = (id: string): PickedDish => ({ id, name: `Món ${id}` });

/** Tuần hợp lệ tối thiểu: 7 ngày, mỗi ngày 1 bữa sáng, 5 món khác nhau. */
function validWeek(): MenuFormValues {
    // Không hard-code ngày: validate đòi ngày bắt đầu **sau hôm nay** nên mốc phải là ngày mai.
    const values = emptyWeek(minStartDateISO());
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
    it("giữ món theo vị trí trong cửa sổ, chỉ đổi ngày", () => {
        const before = validWeek();
        const after = moveWeek(before, "2026-10-12");

        expect(after.startDate).toBe("2026-10-12");
        expect(after.days[0].date).toBe("2026-10-12");
        expect(after.days[6].date).toBe("2026-10-18");
        // Ngày đầu vẫn giữ món của ngày đầu cửa sổ cũ.
        expect(after.days[0].slots[0].dish?.id).toBe("a");
        expect(after.days[3].slots[0].dish?.id).toBe("d");
    });

    it("bắt đầu giữa tuần: 7 ngày liền kề tính từ ngày được chọn", () => {
        const after = moveWeek(validWeek(), "2026-10-08");
        expect(after.days.map((day) => day.date)).toEqual([
            "2026-10-08",
            "2026-10-09",
            "2026-10-10",
            "2026-10-11",
            "2026-10-12",
            "2026-10-13",
            "2026-10-14",
        ]);
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

describe("setDishInDays", () => {
    it("ghi món vào đúng bữa của những ngày được chọn, không đụng ô khác", () => {
        const values = emptyWeek("2026-10-05");
        const next = setDishInDays(values, "LUNCH", [0, 3, 6], dish("x"));

        expect(next.days.map((day) => day.slots[1].dish?.id ?? null)).toEqual([
            "x",
            null,
            null,
            "x",
            null,
            null,
            "x",
        ]);
        // Bữa khác vẫn trống.
        expect(next.days[0].slots[0].dish).toBeNull();
        // Không sửa giá trị gốc.
        expect(values.days[0].slots[1].dish).toBeNull();
    });

    it("ghi null để xoá, giữ nguyên các ngày ngoài phạm vi", () => {
        const values = setDishInDays(emptyWeek("2026-10-05"), "DINNER", [2], dish("y"));
        const next = setDishInDays(values, "DINNER", [2], null);

        expect(next.days[2].slots[2].dish).toBeNull();
        expect(values.days[2].slots[2].dish?.id).toBe("y");
    });

    it("đè lên món cũ của cùng ô", () => {
        const values = setDishInDays(emptyWeek("2026-10-05"), "BREAKFAST", [1], dish("old"));
        const next = setDishInDays(values, "BREAKFAST", [1], dish("new"));

        expect(next.days[1].slots[0].dish).toEqual({ id: "new", name: "Món new" });
        expect(dishUsage(next).size).toBe(1);
    });
});

describe("validate", () => {
    it("tuần hợp lệ không có lỗi", () => {
        expect(validate(validWeek(), t)).toEqual({});
    });

    it("ngày bắt đầu trong quá khứ hoặc hôm nay đều bị chặn", () => {
        const past = validWeek();
        past.startDate = "2020-01-01";
        expect(validate(past, t).startDate).toBeTruthy();

        const today = validWeek();
        today.startDate = todayISO();
        expect(validate(today, t).startDate).toBeTruthy();
    });

    it("ngày bắt đầu từ mai trở đi hợp lệ", () => {
        expect(validate(validWeek(), t).startDate).toBeUndefined();

        const future = validWeek();
        future.startDate = "2099-01-01";
        expect(validate(future, t).startDate).toBeUndefined();
    });

    it("ngày không có bữa nào báo lỗi đúng ngày", () => {
        const values = validWeek();
        values.days[2].slots[0].dish = null;
        expect(validate(values, t)["days.2"]).toBeTruthy();
    });

    it("servings không còn là field của form", () => {
        expect(emptyWeek("2026-10-05").days[0].slots[0]).not.toHaveProperty("servings");
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
    it("bỏ ô trống khỏi meals, servings luôn là 1", () => {
        const values = validWeek();
        values.days[0].slots[1].dish = dish("z");

        const payload = buildCreateMenuPayload(values);
        expect(payload.days[0].meals).toEqual([
            { mealType: "BREAKFAST", dishId: "a", servings: 1 },
            { mealType: "LUNCH", dishId: "z", servings: 1 },
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
