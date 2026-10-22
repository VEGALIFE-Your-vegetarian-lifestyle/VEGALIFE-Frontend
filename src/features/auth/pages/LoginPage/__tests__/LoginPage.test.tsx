import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "../LoginPage";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { useAuthStore } from "@/shared/auth/authStore";
import { E2E_USER, HAS_USER, REMOTE_TIMEOUT_MS } from "@/test/e2eEnv";

vi.mock("sonner", () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

/** Route đích chỉ là sentinel — khẳng định đã điều hướng mà không render cả trang. */
function renderLogin() {
    return render(
        <QueryClientProvider client={createTestQueryClient()}>
            <MemoryRouter initialEntries={["/login"]}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<div>HOME_SENTINEL</div>} />
                    <Route path="/admin/dashboard" element={<div>ADMIN_SENTINEL</div>} />
                    <Route path="/register" element={<div>REGISTER_SENTINEL</div>} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe("LoginPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.getState().clearAuth();
    });

    it("render tiêu đề, hai ô nhập và nút đăng nhập", () => {
        renderLogin();

        expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
        expect(screen.getByLabelText(/Email or username/)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Log in/ })).toBeInTheDocument();
    });

    it("chặn submit khi bỏ trống và hiện lỗi required", async () => {
        const user = userEvent.setup();
        renderLogin();

        await user.click(screen.getByRole("button", { name: /Log in/ }));

        expect(await screen.findByText("Please enter email or username")).toBeInTheDocument();
        expect(screen.getByText("Please enter password")).toBeInTheDocument();
    });

    it("báo lỗi định dạng khi identifier có @ nhưng không phải email", async () => {
        const user = userEvent.setup();
        renderLogin();

        await user.type(screen.getByLabelText(/Email or username/), "khong-phai-email@");
        await user.type(screen.getByLabelText(/^Password/), "Whatever1!");
        await user.click(screen.getByRole("button", { name: /Log in/ }));

        expect(await screen.findByText("Email must be in the format user@example.com")).toBeInTheDocument();
    });

    it("chấp nhận username thuần không có @ (không bắt lỗi định dạng email)", async () => {
        const user = userEvent.setup();
        renderLogin();

        await user.type(screen.getByLabelText(/Email or username/), "minh");
        await user.type(screen.getByLabelText(/^Password/), "Whatever1!");
        await user.click(screen.getByRole("button", { name: /Log in/ }));

        await waitFor(() => {
            expect(screen.queryByText("Email must be in the format user@example.com")).not.toBeInTheDocument();
        });
    });

    it("đổi type ô mật khẩu khi bấm nút hiện/ẩn", async () => {
        const user = userEvent.setup();
        renderLogin();

        const password = screen.getByLabelText(/^Password/);
        expect(password).toHaveAttribute("type", "password");

        await user.click(screen.getByRole("button", { name: "Show password" }));
        expect(password).toHaveAttribute("type", "text");

        await user.click(screen.getByRole("button", { name: "Hide password" }));
        expect(password).toHaveAttribute("type", "password");
    });

    it("nút Google báo tính năng đang phát triển, không gọi API", async () => {
        const user = userEvent.setup();
        renderLogin();

        await user.click(screen.getByRole("button", { name: /Continue with Google/ }));

        expect(toast.info).toHaveBeenCalledWith("Feature under development");
    });

    it("điều hướng sang trang đăng ký qua tab", async () => {
        const user = userEvent.setup();
        renderLogin();

        await user.click(screen.getByRole("link", { name: "Create Account" }));

        expect(await screen.findByText("REGISTER_SENTINEL")).toBeInTheDocument();
    });

    it(
        "sai thông tin đăng nhập thì báo lỗi và KHÔNG lưu token",
        async () => {
            const user = userEvent.setup();
            renderLogin();

            await user.type(screen.getByLabelText(/Email or username/), "vitest-no-such-account@example.invalid");
            await user.type(screen.getByLabelText(/^Password/), "WrongPass123!");
            await user.click(screen.getByRole("button", { name: /Log in/ }));

            await waitFor(() => expect(toast.error).toHaveBeenCalled(), { timeout: REMOTE_TIMEOUT_MS - 5_000 });
            expect(useAuthStore.getState().accessToken).toBeNull();
            expect(screen.queryByText("HOME_SENTINEL")).not.toBeInTheDocument();
        },
        REMOTE_TIMEOUT_MS,
    );
});

describe.skipIf(!HAS_USER)("LoginPage — backend thật (E2E_USER_*)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.getState().clearAuth();
    });

    it(
        "đăng nhập thành công lưu token và điều hướng theo role",
        async () => {
            const user = userEvent.setup();
            renderLogin();

            await user.type(screen.getByLabelText(/Email or username/), E2E_USER.identifier!);
            await user.type(screen.getByLabelText(/^Password/), E2E_USER.password!);
            await user.click(screen.getByRole("button", { name: /Log in/ }));

            await waitFor(() => expect(useAuthStore.getState().accessToken).toBeTruthy(), {
                timeout: REMOTE_TIMEOUT_MS - 5_000,
            });

            expect(toast.success).toHaveBeenCalledWith("Logged in successfully");

            const role = useAuthStore.getState().user?.role;
            const expected = role === "ADMIN" ? "ADMIN_SENTINEL" : "HOME_SENTINEL";
            expect(await screen.findByText(expected)).toBeInTheDocument();
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "tick Remember me thì identifier được ghi nhớ vào localStorage",
        async () => {
            const user = userEvent.setup();
            renderLogin();

            await user.type(screen.getByLabelText(/Email or username/), E2E_USER.identifier!);
            await user.type(screen.getByLabelText(/^Password/), E2E_USER.password!);
            await user.click(screen.getByLabelText("Remember me"));
            await user.click(screen.getByRole("button", { name: /Log in/ }));

            await waitFor(() => expect(useAuthStore.getState().accessToken).toBeTruthy(), {
                timeout: REMOTE_TIMEOUT_MS - 5_000,
            });

            expect(localStorage.getItem("vegalife_remembered_identifier")).toBe(E2E_USER.identifier);
            // rememberMe bật → token nằm ở localStorage, không phải sessionStorage.
            expect(localStorage.getItem("vegalife_auth_persistent")).toBeTruthy();
        },
        REMOTE_TIMEOUT_MS,
    );
});
