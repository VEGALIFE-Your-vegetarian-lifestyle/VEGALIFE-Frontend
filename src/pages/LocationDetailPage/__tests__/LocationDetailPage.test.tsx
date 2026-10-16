import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import LocationDetailPage from "@/pages/LocationDetailPage/LocationDetailPage";

// Bản đồ Leaflet cần layout thật của trình duyệt nên thay bằng khối đơn giản.
vi.mock("@/components/map/PlaceMap", () => ({
    PlaceMap: ({ places }: { places: { id: string }[] }) => <div data-testid="map">{places.length} markers</div>,
}));

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

    it("chỉ hiện dữ liệu thật: không còn nội dung mẫu (món ăn, đánh giá, ảnh) và có bản đồ", async () => {
        renderDetail("loc-01");

        await screen.findByRole("heading", { name: "Quán Chay Lá Xanh" });
        expect(screen.getByTestId("map")).toHaveTextContent("1 markers");
        expect(screen.queryByText(/Portland/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Community Reviews/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Popular Plant-Based Foods/)).not.toBeInTheDocument();
        expect(screen.queryAllByRole("img")).toHaveLength(0);
    });

    it("hiện giờ mở cửa thật, bỏ qua các ngày nghỉ", async () => {
        renderDetail("loc-01");

        await screen.findByRole("heading", { name: "Quán Chay Lá Xanh" });
        expect(screen.getByText("Monday")).toBeInTheDocument();
        expect(screen.getByText("09:00 - 22:00")).toBeInTheDocument();
        expect(screen.queryByText("Sunday")).not.toBeInTheDocument();
    });

    it("cả tuần cùng một khung giờ thì gom thành một dòng Every day", async () => {
        renderDetail("loc-03");

        await screen.findByRole("heading", { level: 1 });
        expect(screen.getByText("Every day")).toBeInTheDocument();
        expect(screen.getByText("07:00 - 20:00")).toBeInTheDocument();
        expect(screen.queryByText("Monday")).not.toBeInTheDocument();
    });

    it("địa điểm chưa có giờ mở cửa thì không hiện mục giờ mở cửa và trạng thái", async () => {
        renderDetail("loc-02");

        await screen.findByRole("heading", { name: "Cà Phê Hạt Sen" });
        expect(screen.queryByText("Opening Hours")).not.toBeInTheDocument();
        expect(screen.queryByText("Closed")).not.toBeInTheDocument();
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
