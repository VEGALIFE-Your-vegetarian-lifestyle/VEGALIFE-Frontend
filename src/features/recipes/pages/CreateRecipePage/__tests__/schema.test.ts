import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";
import i18n from "@/i18n";
import { buildRecipeSchema, duplicateIngredientIndexes, initialRecipeValues, type RecipeFormValues } from "../schema";
import { buildRecipePayload, joinSteps } from "../payload";

// i18n đã init sẵn (setup.ts) nên `t` dùng được ngay, không cần React.
const t = i18n.t.bind(i18n) as unknown as TFunction;

function makeValues(overrides: Partial<RecipeFormValues> = {}): RecipeFormValues {
    return {
        ...initialRecipeValues(),
        name: "Canh chua chay",
        dishName: "Canh chua",
        description: "",
        steps: [{ title: "Nấu nước", body: "Nấu nước, cho rau vào." }],
        servings: "2",
        ingredients: [{ name: "Cà chua", amount: "2", unit: "quả" }],
        ...overrides,
    };
}

const schema = () => buildRecipeSchema(t);

describe("buildRecipeSchema", () => {
    it("form hợp lệ được chấp nhận", async () => {
        await expect(schema().validate(makeValues())).resolves.toBeTruthy();
    });

    it("tên công thức rỗng bị từ chối", async () => {
        await expect(schema().validate(makeValues({ name: "   " }))).rejects.toBeTruthy();
    });

    it("tên món rỗng bị từ chối", async () => {
        await expect(schema().validate(makeValues({ dishName: "   " }))).rejects.toBeTruthy();
    });

    it("không có bước nào bị từ chối", async () => {
        await expect(schema().validate(makeValues({ steps: [] }))).rejects.toBeTruthy();
        await expect(
            schema().validate(makeValues({ steps: [{ title: "   ", body: "  " }] })),
        ).rejects.toBeTruthy();
    });

    it("bước có tiêu đề nhưng thân rỗng bị từ chối", async () => {
        await expect(
            schema().validate(makeValues({ steps: [{ title: "Nấu nước", body: "  " }] })),
        ).rejects.toBeTruthy();
    });

    it("bước để trống hoàn toàn lẫn với bước hợp lệ thì được chấp nhận", async () => {
        await expect(
            schema().validate(makeValues({ steps: [{ title: "", body: "" }, ...makeValues().steps] })),
        ).resolves.toBeTruthy();
    });

    it("servings = 0 bị từ chối", async () => {
        await expect(schema().validate(makeValues({ servings: "0" }))).rejects.toBeTruthy();
    });

    it("không có nguyên liệu nào bị từ chối", async () => {
        await expect(schema().validate(makeValues({ ingredients: [] }))).rejects.toBeTruthy();
    });

    it("hai nguyên liệu trùng tên khác hoa thường bị đánh dấu trùng", () => {
        const ingredients = [
            { name: "Cà chua", amount: "2", unit: "quả" },
            { name: "  cà CHUA ", amount: "1", unit: "quả" },
            { name: "Muối", amount: "1", unit: "g" },
        ];

        // Trùng tên kiểm ở onSubmit (cần so cả mảng) — không phải rule của Yup.
        expect(duplicateIngredientIndexes(ingredients)).toEqual([1]);
    });

    it("tên khác nhau thì không bị đánh dấu trùng", () => {
        const ingredients = [
            { name: "Cà chua", amount: "2", unit: "quả" },
            { name: "Muối", amount: "1", unit: "g" },
        ];

        expect(duplicateIngredientIndexes(ingredients)).toEqual([]);
    });

    it("amount = 0 bị từ chối", async () => {
        await expect(
            schema().validate(makeValues({ ingredients: [{ name: "Muối", amount: "0", unit: "g" }] })),
        ).rejects.toBeTruthy();
    });

    it("amount 4 chữ số thập phân bị từ chối", async () => {
        await expect(
            schema().validate(makeValues({ ingredients: [{ name: "Muối", amount: "1.2345", unit: "g" }] })),
        ).rejects.toBeTruthy();
    });

    it("thời gian nấu để trống được chấp nhận", async () => {
        await expect(
            schema().validate(makeValues({ prepTimeMinutes: "", cookTimeMinutes: "" })),
        ).resolves.toBeTruthy();
    });

    it("thời gian nấu không phải số bị từ chối", async () => {
        await expect(schema().validate(makeValues({ prepTimeMinutes: "abc" }))).rejects.toBeTruthy();
    });

    it("5 field dinh dưỡng để trống hoặc là số ≥ 0 đều được chấp nhận", async () => {
        await expect(schema().validate(makeValues({ calories: "", proteinG: "" }))).resolves.toBeTruthy();
        await expect(
            schema().validate(makeValues({ calories: "380", proteinG: "0", carbohydrateG: "12.5", fatG: "9", fiberG: "4.2" })),
        ).resolves.toBeTruthy();
    });

    it("dinh dưỡng nhập số âm hoặc chữ bị từ chối", async () => {
        await expect(schema().validate(makeValues({ calories: "-5" }))).rejects.toBeTruthy();
        await expect(schema().validate(makeValues({ proteinG: "abc" }))).rejects.toBeTruthy();
    });
});

describe("joinSteps / buildRecipePayload", () => {
    it("gộp tiêu đề và thân bằng ' — ', mỗi bước một dòng", () => {
        expect(
            joinSteps([
                { title: "  Nấu nước  ", body: "  Đun sôi nước.  " },
                { title: "", body: "Cho rau vào." },
                { title: "Nêm", body: "" },
            ]),
        ).toBe("Nấu nước — Đun sôi nước.\nCho rau vào.\nNêm");
    });

    it("bỏ bước để trống hoàn toàn thay vì sinh dòng rỗng", () => {
        expect(joinSteps([{ title: "", body: "" }, { title: "Xào", body: "Xào 2 phút." }])).toBe("Xào — Xào 2 phút.");
    });

    it("instructions gửi lên là chuỗi đã gộp", () => {
        const payload = buildRecipePayload(
            makeValues({ steps: [{ title: "Nấu", body: "Đun sôi." }, { title: "", body: "Cho rau vào." }] }),
        );

        expect(payload.instructions).toBe("Nấu — Đun sôi.\nCho rau vào.");
    });

    it("trim chuỗi và đổi amount sang number", () => {
        const payload = buildRecipePayload(
            makeValues({
                name: "  Canh chua chay  ",
                ingredients: [{ name: " Cà chua ", amount: " 2.5 ", unit: " quả " }],
            }),
        );

        expect(payload.name).toBe("Canh chua chay");
        expect(payload.ingredients[0]).toEqual({ name: "Cà chua", amount: 2.5, unit: "quả" });
    });

    it("bỏ field rỗng thay vì gửi chuỗi rỗng", () => {
        const payload = buildRecipePayload(
            makeValues({ description: "   ", prepTimeMinutes: "", cookTimeMinutes: "", difficulty: "" }),
        );

        expect(payload).not.toHaveProperty("description");
        expect(payload).not.toHaveProperty("prepTimeMinutes");
        expect(payload).not.toHaveProperty("cookTimeMinutes");
        expect(payload).not.toHaveProperty("difficulty");
    });

    it("giữ field optional khi có giá trị", () => {
        const payload = buildRecipePayload(
            makeValues({
                description: "  Món chay dễ làm ",
                prepTimeMinutes: "10",
                cookTimeMinutes: "0",
                difficulty: "EASY",
            }),
        );

        expect(payload.description).toBe("Món chay dễ làm");
        expect(payload.prepTimeMinutes).toBe(10);
        expect(payload.cookTimeMinutes).toBe(0);
        expect(payload.difficulty).toBe("EASY");
    });

    it("dinh dưỡng rỗng thì không gửi, có giá trị thì gửi dạng number", () => {
        const empty = buildRecipePayload(makeValues({ calories: "", proteinG: "  " }));
        expect(empty).not.toHaveProperty("calories");
        expect(empty).not.toHaveProperty("proteinG");

        const filled = buildRecipePayload(
            makeValues({ calories: "380", proteinG: "22", carbohydrateG: "40", fatG: "12", fiberG: "6" }),
        );
        expect(filled.calories).toBe(380);
        expect(filled.proteinG).toBe(22);
        expect(filled.carbohydrateG).toBe(40);
        expect(filled.fatG).toBe(12);
        expect(filled.fiberG).toBe(6);
    });
});
