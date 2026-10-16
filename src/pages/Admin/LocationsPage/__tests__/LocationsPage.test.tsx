import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { renderWithProviders } from "@/test/renderWithProviders";
import LocationsPage from "@/pages/Admin/LocationsPage/LocationsPage";

// Dùng bản giả của locationService (dữ liệu trong bộ nhớ) vì backend thật cần đăng nhập.
vi.mock("@/services/locationService", () => import("@/test/fakeLocationService"));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// Dữ liệu mock sắp theo ngày tạo mới nhất trước, nên dòng đầu là địa điểm này.
const FIRST_ROW = "Quán Chay Hoa Sen Tân Bình";

// jsdom chưa có showModal / close cho <dialog> (components/ui/dialog dùng chúng).
beforeAll(() => {
    HTMLDialogElement.prototype.showModal ??= function showModal() {
        this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close ??= function close() {
        this.removeAttribute("open");
        this.dispatchEvent(new Event("close"));
    };
});

const openDialog = () => within(document.querySelector("dialog[open]") as HTMLElement);

describe("LocationsPage (Admin)", () => {
    it("render tiêu đề, bộ lọc loại và nút thêm", async () => {
        renderWithProviders(<LocationsPage />);

        expect(screen.getByRole("heading", { name: "Location Management" })).toBeInTheDocument();
        expect(screen.getByLabelText("Filter by type")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Add location/ })).toBeInTheDocument();
        expect(await screen.findByText(FIRST_ROW)).toBeInTheDocument();
    });

    it("không hiện địa điểm đã xóa mềm", async () => {
        const user = userEvent.setup();
        renderWithProviders(<LocationsPage />);
        await screen.findByText(FIRST_ROW);

        await user.selectOptions(screen.getByLabelText("Filter by type"), "Restaurant");

        expect(await screen.findByText("Quán Chay Lá Xanh")).toBeInTheDocument();
        expect(screen.queryByText("Quán Chay Đã Đóng Cửa")).not.toBeInTheDocument();
    });

    it("lọc theo loại chỉ hiện loại đó", async () => {
        const user = userEvent.setup();
        renderWithProviders(<LocationsPage />);
        await screen.findByText(FIRST_ROW);

        await user.selectOptions(screen.getByLabelText("Filter by type"), "Market");

        await waitFor(() => expect(screen.queryByText(FIRST_ROW)).not.toBeInTheDocument());
        expect(await screen.findByText("Chợ Chay Bình Thạnh")).toBeInTheDocument();
    });

    it("form báo lỗi khi để trống và khi nhập vĩ độ ngoài khoảng", async () => {
        const user = userEvent.setup();
        renderWithProviders(<LocationsPage />);
        await screen.findByText(FIRST_ROW);

        await user.click(screen.getByRole("button", { name: /Add location/ }));
        await user.click(openDialog().getByRole("button", { name: "Add location" }));

        expect((await openDialog().findAllByText("This field is required")).length).toBeGreaterThanOrEqual(4);
        expect(toast.success).not.toHaveBeenCalled();

        await user.type(openDialog().getByLabelText(/Latitude/), "95");
        await user.tab();
        expect(await openDialog().findByText("Latitude must be between -90 and 90")).toBeInTheDocument();
    });

    it("thêm địa điểm hợp lệ thì có thông báo và hiện trong bảng", async () => {
        const user = userEvent.setup();
        renderWithProviders(<LocationsPage />);
        await screen.findByText(FIRST_ROW);

        await user.click(screen.getByRole("button", { name: /Add location/ }));
        const dialog = openDialog();
        await user.type(dialog.getByLabelText(/^Name/), "Quán Test Admin");
        await user.type(dialog.getByLabelText(/^Address/), "1 Đường Test");
        await user.type(dialog.getByLabelText(/Latitude/), "10.78");
        await user.type(dialog.getByLabelText(/Longitude/), "106.7");
        await user.selectOptions(dialog.getByLabelText(/Type/), "Cafe");
        await user.type(dialog.getByLabelText(/Phone/), "028 1111 1111");
        await user.click(dialog.getByRole("button", { name: "Add location" }));

        await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Location added"));
        expect(await screen.findByText("Quán Test Admin")).toBeInTheDocument();
    });

    it("chỉ nhập các trường bắt buộc (tên, địa chỉ, tọa độ, loại) vẫn thêm được, ô thiếu hiện dấu gạch", async () => {
        const user = userEvent.setup();
        renderWithProviders(<LocationsPage />);
        await screen.findByText(FIRST_ROW);

        await user.click(screen.getByRole("button", { name: /Add location/ }));
        const dialog = openDialog();
        await user.type(dialog.getByLabelText(/^Name/), "Quán Chỉ Có Tên");
        await user.type(dialog.getByLabelText(/^Address/), "2 Đường Test");
        await user.type(dialog.getByLabelText(/Latitude/), "10.79");
        await user.type(dialog.getByLabelText(/Longitude/), "106.69");
        await user.selectOptions(dialog.getByLabelText(/Type/), "Market");
        await user.click(dialog.getByRole("button", { name: "Add location" }));

        const row = (await screen.findByText("Quán Chỉ Có Tên")).closest("tr")!;
        expect(within(row).getAllByText("—")).toHaveLength(2);
    });

    it("nhập giờ mở cửa: báo lỗi khi thiếu một giờ hoặc giờ đóng trước giờ mở, lưu được và mở lại vẫn còn", async () => {
        const user = userEvent.setup();
        renderWithProviders(<LocationsPage />);
        await screen.findByText(FIRST_ROW);

        await user.click(screen.getByRole("button", { name: /Add location/ }));
        let dialog = openDialog();
        await user.type(dialog.getByLabelText(/^Name/), "Quán Có Giờ");
        await user.type(dialog.getByLabelText(/^Address/), "3 Đường Test");
        await user.type(dialog.getByLabelText(/Latitude/), "10.79");
        await user.type(dialog.getByLabelText(/Longitude/), "106.69");
        await user.selectOptions(dialog.getByLabelText(/Type/), "Cafe");

        fireEvent.change(dialog.getByLabelText("Opening time"), { target: { value: "07:00" } });
        await user.click(dialog.getByRole("button", { name: "Add location" }));
        expect(await dialog.findByText("Enter both opening and closing time")).toBeInTheDocument();

        fireEvent.change(dialog.getByLabelText("Closing time"), { target: { value: "06:00" } });
        await user.click(dialog.getByRole("button", { name: "Add location" }));
        expect(await dialog.findByText("Closing time must be after opening time")).toBeInTheDocument();

        fireEvent.change(dialog.getByLabelText("Closing time"), { target: { value: "21:30" } });
        await user.click(dialog.getByRole("button", { name: "Add location" }));
        await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Location added"));

        const row = (await screen.findByText("Quán Có Giờ")).closest("tr")!;
        await user.click(within(row).getByRole("button", { name: "Edit" }));
        dialog = openDialog();
        expect(dialog.getByLabelText("Opening time")).toHaveValue("07:00");
        expect(dialog.getByLabelText("Closing time")).toHaveValue("21:30");
    });

    it("xóa mềm có xác nhận, địa điểm biến khỏi bảng", async () => {
        const user = userEvent.setup();
        renderWithProviders(<LocationsPage />);
        const row = (await screen.findByText(FIRST_ROW)).closest("tr")!;

        await user.click(within(row).getByRole("button", { name: /Delete/ }));
        await user.click(openDialog().getByRole("button", { name: "Delete" }));

        await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Location deleted"));
        await waitFor(() => expect(screen.queryByText(FIRST_ROW)).not.toBeInTheDocument());
    });
});
