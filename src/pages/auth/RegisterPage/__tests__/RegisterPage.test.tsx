import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RegisterPage from "@/pages/auth/RegisterPage/RegisterPage";
import { createTestQueryClient } from "@/test/renderWithProviders";

vi.mock("sonner", () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
function renderRegister() {
    return render(
        <QueryClientProvider client={createTestQueryClient()}>
            <MemoryRouter initialEntries={["/register"]}>
                <Routes>
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<div>LOGIN_SENTINEL</div>} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

/** Mật khẩu hợp lệ theo schema: ≥8 ký tự, có hoa/thường/số/ký tự đặc biệt. */
const VALID_PASSWORD = "Vegalife1!";

describe("RegisterPage", () => {
    beforeEach(() => vi.clearAllMocks());

    it("render tiêu đề và 4 ô nhập", () => {
        renderRegister();

        expect(screen.getByRole("heading", { name: "Create VEGALIFE account" })).toBeInTheDocument();
        expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirm password/)).toBeInTheDocument();
    });

    it("bỏ trống hết thì báo lỗi required cho cả 4 ô", async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.click(screen.getByRole("button", { name: /Register/ }));

        expect(await screen.findByText("Please enter a username")).toBeInTheDocument();
        expect(screen.getByText("Please enter your email")).toBeInTheDocument();
        expect(screen.getByText("Please enter password")).toBeInTheDocument();
        expect(screen.getByText("Please confirm your password")).toBeInTheDocument();
    });

    it("username có ký tự lạ bị từ chối", async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.type(screen.getByLabelText(/Username/), "minh sao");
        await user.click(screen.getByRole("button", { name: /Register/ }));

        expect(
            await screen.findByText("Username may only contain letters, numbers, dots and underscores"),
        ).toBeInTheDocument();
    });

    it("username ngắn hơn 3 ký tự bị từ chối", async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.type(screen.getByLabelText(/Username/), "ab");
        await user.click(screen.getByRole("button", { name: /Register/ }));

        expect(await screen.findByText("Username must be at least 3 characters")).toBeInTheDocument();
    });

    it("email sai định dạng bị từ chối", async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.type(screen.getByLabelText(/^Email/), "khong-phai-email");
        await user.click(screen.getByRole("button", { name: /Register/ }));

        expect(await screen.findByText("Invalid email (example: user@example.com)")).toBeInTheDocument();
    });

    it("mật khẩu thiếu chữ HOA bị từ chối", async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.type(screen.getByLabelText(/^Password/), "lowercase1!");
        await user.click(screen.getByRole("button", { name: /Register/ }));

        expect(await screen.findByText("Password must contain at least 1 uppercase letter")).toBeInTheDocument();
    });

    it("mật khẩu thiếu chữ số bị từ chối", async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.type(screen.getByLabelText(/^Password/), "Lowercase!");
        await user.click(screen.getByRole("button", { name: /Register/ }));

        expect(await screen.findByText("Password must contain at least 1 number")).toBeInTheDocument();
    });

    it("mật khẩu thiếu ký tự đặc biệt bị từ chối", async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.type(screen.getByLabelText(/^Password/), "Lowercase1");
        await user.click(screen.getByRole("button", { name: /Register/ }));

        expect(await screen.findByText("Password must contain at least 1 special character")).toBeInTheDocument();
    });

    it("mật khẩu ngắn hơn 8 ký tự bị từ chối", async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.type(screen.getByLabelText(/^Password/), "Ab1!");
        await user.click(screen.getByRole("button", { name: /Register/ }));

        expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument();
    });

    it("xác nhận mật khẩu không khớp bị từ chối", async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.type(screen.getByLabelText(/^Password/), VALID_PASSWORD);
        await user.type(screen.getByLabelText(/Confirm password/), "Khac1234!");
        await user.click(screen.getByRole("button", { name: /Register/ }));

        expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    });

    it("dữ liệu hợp lệ thì không còn lỗi validate nào (không submit thật)", async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.type(screen.getByLabelText(/Username/), "minh_01");
        await user.type(screen.getByLabelText(/^Email/), "minh@example.com");
        await user.type(screen.getByLabelText(/^Password/), VALID_PASSWORD);
        await user.type(screen.getByLabelText(/Confirm password/), VALID_PASSWORD);
        // Rời ô để Formik đánh dấu touched, KHÔNG bấm Register — tránh tạo tài khoản thật.
        await user.tab();

        await waitFor(() => {
            expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        });
    });

    it("đổi type ô mật khẩu khi bấm nút hiện/ẩn", async () => {
        const user = userEvent.setup();
        renderRegister();

        const password = screen.getByLabelText(/^Password/);
        expect(password).toHaveAttribute("type", "password");

        await user.click(screen.getAllByRole("button", { name: "Show password" })[0]);
        expect(password).toHaveAttribute("type", "text");
    });

    it("điều hướng sang trang đăng nhập", async () => {
        const user = userEvent.setup();
        renderRegister();

        // Trang có 2 link cùng nhãn "Log In" (tab trên và dòng cuối) — lấy link đầu.
        await user.click(screen.getAllByRole("link", { name: "Log In" })[0]);

        expect(await screen.findByText("LOGIN_SENTINEL")).toBeInTheDocument();
    });
});
