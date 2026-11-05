import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import NearbyPage from "../NearbyPage";
import { getNearbyLocations } from "../../api";

// Bản đồ Leaflet cần layout thật của trình duyệt nên thay bằng khối đơn giản.
vi.mock("../../components/PlaceMap", () => ({
    PlaceMap: ({ places }: { places: { id: string }[] }) => <div data-testid="map">{places.length} markers</div>,
}));

// Dùng bản giả của locationService (dữ liệu trong bộ nhớ) vì backend thật cần đăng nhập.
vi.mock("../../api", async () => {
    const fake = await import("@/test/fakeLocationService");
    return { ...fake, getNearbyLocations: vi.fn(fake.getNearbyLocations) };
});

const cards = () => screen.getAllByRole("article");

describe("NearbyPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("mặc định hiện khu vực Quận 1, xếp gần đến xa và có bản đồ", async () => {
        renderWithProviders(<NearbyPage />);

        expect(screen.getByRole("heading", { name: "Nearby Vegan Places" })).toBeInTheDocument();
        await screen.findByText("Quán Chay Lá Xanh");
        const names = cards().map((card) => within(card).getByRole("heading").textContent);
        expect(names[0]).toBe("Quán Chay Lá Xanh");
        expect(names[1]).toBe("Cà Phê Hạt Sen");
        expect(screen.getByTestId("map")).toHaveTextContent(`${names.length} markers`);
    });

    it("pill có số lượng, bấm vào chỉ hiện đúng loại", async () => {
        const user = userEvent.setup();
        renderWithProviders(<NearbyPage />);
        await screen.findByText("Quán Chay Lá Xanh");

        const marketTab = screen.getByRole("tab", { name: /Vegan Market/ });
        expect(marketTab).toHaveTextContent("2");
        await user.click(marketTab);

        const names = cards().map((card) => within(card).getByRole("heading").textContent);
        expect(names).toEqual(["Chợ Chay Bình Thạnh", "Chợ Hữu Cơ Cuối Tuần Quận 7"]);
    });

    it("không hiện địa điểm đã xóa mềm", async () => {
        renderWithProviders(<NearbyPage />);
        await screen.findByText("Quán Chay Lá Xanh");

        expect(screen.queryByText("Quán Chay Đã Đóng Cửa")).not.toBeInTheDocument();
    });

    it("sắp xếp theo đánh giá cao nhất", async () => {
        const user = userEvent.setup();
        renderWithProviders(<NearbyPage />);
        await screen.findByText("Quán Chay Lá Xanh");

        await user.selectOptions(screen.getByLabelText("Sort by"), "Highest rated");

        expect(within(cards()[0]).getByRole("heading")).toHaveTextContent("Nhà Hàng Chay Sen Việt");
    });

    it("đổi khu vực thì tìm lại theo tọa độ mới", async () => {
        const user = userEvent.setup();
        renderWithProviders(<NearbyPage />);
        await screen.findByText("Quán Chay Lá Xanh");

        await user.selectOptions(screen.getByLabelText("Choose an area"), "District 7");

        await waitFor(() => expect(within(cards()[0]).getByRole("heading")).toHaveTextContent("Chợ Hữu Cơ Cuối Tuần Quận 7"));
        expect(vi.mocked(getNearbyLocations)).toHaveBeenLastCalledWith(
            expect.objectContaining({ lat: 10.734, lng: 106.7219, radius: 10_000 }),
        );
    });

    it("Directions mở Google Maps với địa chỉ làm đích và để Google tự lấy vị trí hiện tại khi chưa dùng GPS", async () => {
        const open = vi.spyOn(window, "open").mockReturnValue(null);
        const user = userEvent.setup();
        renderWithProviders(<NearbyPage />);
        const card = (await screen.findByText("Quán Chay Lá Xanh")).closest("article")!;

        await user.click(within(card).getByRole("button", { name: /Directions/ }));

        const [href, target, features] = open.mock.calls[0];
        const url = new URL(String(href));
        expect(url.origin + url.pathname).toBe("https://www.google.com/maps/dir/");
        expect(url.searchParams.has("origin")).toBe(false);
        expect(url.searchParams.get("destination")).toBe("12 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM");
        expect(target).toBe("_blank");
        expect(features).toBe("noopener,noreferrer");
    });

    it("từ chối quyền vị trí thì báo và vẫn dùng được khu vực đã chọn (BR-NEARBY-001)", async () => {
        const getCurrentPosition = vi.fn((_: PositionCallback, onError?: PositionErrorCallback | null) =>
            onError?.({ code: 1, message: "denied" } as GeolocationPositionError),
        );
        Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition }, configurable: true });
        const user = userEvent.setup();
        renderWithProviders(<NearbyPage />);
        await screen.findByText("Quán Chay Lá Xanh");

        await user.click(screen.getByRole("button", { name: "Use my location" }));

        expect(await screen.findByText(/Location permission was denied/)).toBeInTheDocument();
        expect(screen.getByText("Quán Chay Lá Xanh")).toBeInTheDocument();
    });

    it("không có địa điểm thì hiện thông báo rỗng, bấm hiện tất cả", async () => {
        vi.mocked(getNearbyLocations).mockResolvedValueOnce([]);
        renderWithProviders(<NearbyPage />);

        expect(await screen.findByText("No places in this category")).toBeInTheDocument();
        expect(screen.queryByRole("article")).not.toBeInTheDocument();
    });

    it("lỗi tải thì báo lỗi và thử lại được", async () => {
        vi.mocked(getNearbyLocations).mockRejectedValueOnce(new Error("boom"));
        const user = userEvent.setup();
        renderWithProviders(<NearbyPage />);

        expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load nearby places");
        await user.click(screen.getByRole("button", { name: "Try again" }));

        expect(await screen.findByText("Quán Chay Lá Xanh")).toBeInTheDocument();
    });
});
