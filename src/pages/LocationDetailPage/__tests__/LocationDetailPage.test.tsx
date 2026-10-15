import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import LocationDetailPage from "@/pages/LocationDetailPage/LocationDetailPage";

// Dùng bản giả của locationService (dữ liệu trong bộ nhớ) vì backend thật cần đăng nhập.
vi.mock("@/services/locationService", () => import("@/test/fakeLocationService"));

const renderDetail = (id: string) =>
    renderWithProviders(<LocationDetailPage />, { route: `/nearby/${id}`, path: "/nearby/:id" });

describe("LocationDetailPage", () => {
    afterEach(() => vi.restoreAllMocks());

    it("hiện thông tin thật của địa điểm: tên, địa chỉ, điện thoại", async () => {
        renderDetail("loc-01");

        expect(await screen.findByRole("heading", { name: "Quán Chay Lá Xanh" })).toBeInTheDocument();
        expect(screen.getAllByText(/12 Nguyễn Huệ/).length).toBeGreaterThan(0);
        expect(screen.getByText("028 3822 0001")).toBeInTheDocument();
    });

    it("Get Directions mở Google Maps tới địa chỉ của địa điểm", async () => {
        const open = vi.spyOn(window, "open").mockReturnValue(null);
        const user = userEvent.setup();
        renderDetail("loc-01");

        await user.click(await screen.findByRole("button", { name: /Get Directions/ }));

        const url = new URL(String(open.mock.calls[0][0]));
        expect(url.searchParams.get("destination")).toBe("12 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM");
    });

    it("địa điểm không tồn tại hoặc đã xóa mềm thì hiện trang không tìm thấy", async () => {
        renderDetail("loc-12");

        expect(await screen.findByText("Location not found")).toBeInTheDocument();
    });
});
