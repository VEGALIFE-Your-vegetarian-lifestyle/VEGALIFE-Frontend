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
        ingredients: [{ name: "Cà chua", amount: "2", unit: "piece" }],
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

    // Hồi quy: `Yup.object()` rỗng không fill khoá thiếu, nên bước thiếu `title`/`body`
    // từng làm `visibleSteps`/`joinSteps` nổ `TypeError: … reading 'trim'` thay vì báo lỗi form.
    it("bước thiếu hẳn một khoá không ném TypeError", async () => {
        const bodyOnly = [{ body: "Nấu nước" }] as never;
        const titleOnly = [{ title: "Nấu nước" }] as never;

        // Thiếu tiêu đề vẫn là bước hợp lệ; thiếu thân thì phải **bị từ chối**, không nổ.
        await expect(schema().validate(makeValues({ steps: bodyOnly }))).resolves.toBeTruthy();
        await expect(schema().validate(makeValues({ steps: titleOnly }))).rejects.toBeTruthy();
        expect(() => joinSteps(bodyOnly)).not.toThrow();
        expect(joinSteps(bodyOnly)).toBe("Nấu nước");
    });

    it("servings = 0 bị từ chối", async () => {
        await expect(schema().validate(makeValues({ servings: "0" }))).rejects.toBeTruthy();
    });

    it("không có nguyên liệu nào bị từ chối", async () => {
        await expect(schema().validate(makeValues({ ingredients: [] }))).rejects.toBeTruthy();
    });

    it("hai nguyên liệu trùng tên khác hoa thường bị đánh dấu trùng", () => {
        const ingredients = [
            { name: "Cà chua", amount: "2", unit: "piece" },
            { name: "  cà CHUA ", amount: "1", unit: "piece" },
            { name: "Muối", amount: "1", unit: "g" },
        ];

        // Trùng tên kiểm ở onSubmit (cần so cả mảng) — không phải rule của Yup.
        expect(duplicateIngredientIndexes(ingredients)).toEqual([1]);
    });

    it("tên khác nhau thì không bị đánh dấu trùng", () => {
        const ingredients = [
            { name: "Cà chua", amount: "2", unit: "piece" },
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

    it("unit rỗng được chấp nhận (nguyên liệu đã tồn tại)", async () => {
        await expect(
            schema().validate(makeValues({ ingredients: [{ name: "Đậu hũ", amount: "2", unit: "" }] })),
        ).resolves.toBeTruthy();
    });

    it("unit thuộc g / ml / piece (kể cả hoa) được chấp nhận", async () => {
        for (const unit of ["g", "ml", "piece", "G", " ML ", "Piece"]) {
            await expect(
                schema().validate(makeValues({ ingredients: [{ name: "Cà chua", amount: "2", unit }] })),
            ).resolves.toBeTruthy();
        }
    });

    it("unit ngoài 3 mã BE nhận bị từ chối", async () => {
        for (const unit of ["kg", "tbsp", "cup", "quả"]) {
            await expect(
                schema().validate(makeValues({ ingredients: [{ name: "Cà chua", amount: "2", unit }] })),
            ).rejects.toBeTruthy();
        }
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
                ingredients: [{ name: " Cà chua ", amount: " 2.5 ", unit: " PIECE " }],
            }),
        );

        expect(payload.name).toBe("Canh chua chay");
        expect(payload.ingredients[0]).toEqual({ name: "Cà chua", amount: 2.5, unit: "piece" });
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

    it("không gửi dinh dưỡng lên BE — BE tự tính từ nguyên liệu", () => {
        const payload = buildRecipePayload(makeValues());
        expect(payload).not.toHaveProperty("calories");
        expect(payload).not.toHaveProperty("proteinG");
        expect(payload).not.toHaveProperty("carbohydrateG");
        expect(payload).not.toHaveProperty("fatG");
        expect(payload).not.toHaveProperty("fiberG");
    });

    it("nguyên liệu mới có unit thì gửi (lowercase), không có thì bỏ khoá", () => {
        const withUnit = buildRecipePayload(
            makeValues({ ingredients: [{ name: "Cà chua", amount: "2", unit: " PIECE " }] }),
        );
        expect(withUnit.ingredients[0]).toEqual({ name: "Cà chua", amount: 2, unit: "piece" });

        const without = buildRecipePayload(makeValues({ ingredients: [{ name: "Muối", amount: "1", unit: "" }] }));
        expect(without.ingredients[0]).not.toHaveProperty("unit");
    });

    it("nguyên liệu đã có sẵn không gửi unit dù ô có giá trị", () => {
        const payload = buildRecipePayload(
            makeValues({ ingredients: [{ name: "Đậu hũ", amount: "2", unit: "g", existing: true }] }),
        );
        expect(payload.ingredients[0]).not.toHaveProperty("unit");
    });
});
