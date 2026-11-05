import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import MealPlanPage from "../../pages/MealPlanPage";
import type { MenuDetail } from "../../types";

const menu = (id: string, status: MenuDetail["status"], startDate: string): MenuDetail => ({
    id,
    startDate,
    endDate: startDate,
    status,
    notes: null,
    createdAt: "2025-11-01T10:00:00Z",
    updatedAt: "2025-11-01T10:00:00Z",
    days: [],
});

const menus = [
    menu("sched", "scheduled", "2025-11-03"),
    menu("draft", "drafted", "2025-11-04"),
    menu("cancel", "cancelled", "2025-11-05"),
];

vi.mock("../../api", () => ({ getMealPlans: vi.fn(async () => menus), changeMenuStatus: vi.fn() }));

describe("MealPlanPage — lọc theo trạng thái", () => {
    it("mặc định chỉ hiện menu scheduled, draft/cancelled chỉ nằm trong pill", async () => {
        renderWithProviders(<MealPlanPage />);

        expect(await screen.findByText("03/11 – 03/11")).toBeInTheDocument();
        expect(screen.queryByText("04/11 – 04/11")).not.toBeInTheDocument();
        expect(screen.queryByText("05/11 – 05/11")).not.toBeInTheDocument();

        // Count vẫn thấy đủ 3 trạng thái.
        expect(screen.getByRole("tab", { name: /Scheduled/ })).toHaveTextContent("1");
        expect(screen.getByRole("tab", { name: /Draft/ })).toHaveTextContent("1");
        expect(screen.getByRole("tab", { name: /Cancelled/ })).toHaveTextContent("1");
    });

    it("bấm pill Draft thì hiện menu draft", async () => {
        const user = userEvent.setup();
        renderWithProviders(<MealPlanPage />);

        await user.click(await screen.findByRole("tab", { name: /Draft/ }));

        expect(await screen.findByText("04/11 – 04/11")).toBeInTheDocument();
        expect(screen.queryByText("03/11 – 03/11")).not.toBeInTheDocument();
    });

    it("báo rỗng khi tuần có menu nhưng không có menu ở trạng thái đang lọc", async () => {
        const user = userEvent.setup();
        renderWithProviders(<MealPlanPage />);

        await user.click(await screen.findByRole("tab", { name: /Completed/ }));

        expect(await screen.findByText(/No menu with status/)).toBeInTheDocument();
        expect(within(screen.getByRole("tablist")).getAllByRole("tab")).toHaveLength(4);
    });
});
