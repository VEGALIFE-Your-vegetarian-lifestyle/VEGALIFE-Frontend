import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import { MenuCard } from "../MenuCard";
import type { MenuDetail } from "../../types";

const dish = (id: string, name: string) => ({
    id,
    name,
    description: `${name} description`,
    imageUrl: null,
    cuisineType: "Vietnamese",
});

/** Thứ 2 03/11 → CN 09/11; chỉ có 2 ngày có bữa, mỗi ngày 1 bữa. */
const menu: MenuDetail = {
    id: "m1",
    startDate: "2025-11-03",
    endDate: "2025-11-09",
    status: "scheduled",
    notes: "No peanuts",
    createdAt: "2025-11-01T10:00:00Z",
    updatedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    days: [
        { date: "2025-11-03", meals: [{ mealType: "LUNCH", servings: 2, dish: dish("d1", "Phở chay") }] },
        { date: "2025-11-05", meals: [{ mealType: "DINNER", servings: 3, dish: dish("d2", "Bún chả") }] },
    ],
};

describe("MenuCard", () => {
    it("vẽ đủ 3 ô bữa cho cả 7 ngày, kể cả ngày không có bữa", () => {
        renderWithProviders(<MenuCard menu={menu} />);

        // 7 ngày × 3 nhãn bữa = 21 ô, không phụ thuộc số meal backend trả.
        expect(screen.getAllByText("Breakfast")).toHaveLength(7);
        expect(screen.getAllByText("Lunch")).toHaveLength(7);
        expect(screen.getAllByText("Dinner")).toHaveLength(7);
    });

    it("ô bữa chỉ hiện tên món — mô tả để trong dialog chi tiết món", () => {
        renderWithProviders(<MenuCard menu={menu} />);
        expect(screen.getByText("Phở chay")).toBeInTheDocument();
        expect(screen.queryByText("Phở chay description")).not.toBeInTheDocument();
    });

    it("bấm tên món → mở dialog dựng từ chính response của tuần", async () => {
        const user = userEvent.setup();
        renderWithProviders(<MenuCard menu={menu} />);

        await user.click(screen.getByRole("button", { name: "Open details for Phở chay" }));

        expect(screen.getByText("Phở chay description")).toBeInTheDocument();
        expect(screen.getByText("Vietnamese")).toBeInTheDocument();
        expect(screen.getByText("2 servings")).toBeInTheDocument();
    });

    it("mọi món đều bấm được — không phụ thuộc món đó có recipe hay không", async () => {
        const user = userEvent.setup();
        renderWithProviders(<MenuCard menu={menu} />);

        await user.click(screen.getByRole("button", { name: "Open details for Bún chả" }));

        expect(screen.getByText("Bún chả description")).toBeInTheDocument();
        expect(screen.getByText("3 servings")).toBeInTheDocument();
    });

    it("thống kê tính từ response: 2 bữa / 21 ô, 2 món, 2 ngày, 5 khẩu phần", () => {
        renderWithProviders(<MenuCard menu={menu} />);

        expect(screen.getByText("Meals planned").previousSibling).toHaveTextContent("2");
        expect(screen.getByText("of 21 slots")).toBeInTheDocument();
        expect(screen.getByText("Distinct dishes").previousSibling).toHaveTextContent("2");
        expect(screen.getByText("Days covered").previousSibling).toHaveTextContent("2/7");
        expect(screen.getByText("Total servings").previousSibling).toHaveTextContent("5");
    });

    it("render ghi chú và thời điểm cập nhật", () => {
        renderWithProviders(<MenuCard menu={menu} />);
        expect(screen.getByText("No peanuts")).toBeInTheDocument();
        expect(screen.getByText(/Updated .*hours ago/)).toBeInTheDocument();
    });

    it("menu cancelled vẫn hiện đủ ô nhưng mờ đi", () => {
        const { container } = renderWithProviders(<MenuCard menu={{ ...menu, status: "cancelled" }} />);
        expect(within(container).getAllByText("Breakfast")).toHaveLength(7);
        expect(container.querySelector(".opacity-55")).not.toBeNull();
    });
});
