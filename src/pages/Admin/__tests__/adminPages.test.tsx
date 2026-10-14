import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useAuthStore } from "@/stores/authStore";
import { E2E_ADMIN, HAS_ADMIN, REMOTE_TIMEOUT_MS } from "@/test/e2eEnv";
import PostsPage from "@/pages/Admin/PostsPage/PostsPage";
import CategoriesPage from "@/pages/Admin/CategoriesPage/CategoriesPage";
import UsersPage from "@/pages/Admin/UsersPage/UsersPage";
import VideosPage from "@/pages/Admin/VideosPage/VideosPage";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

/**
 * Các trang admin gọi API thật cần JWT. Chưa đăng nhập thì query lỗi và trang
 * hiện `ErrorState` — vẫn là hành vi đúng cần khẳng định (không sập trắng).
 */
describe("Trang admin — chưa đăng nhập", () => {
    it("PostsPage render header, ô tìm kiếm và bộ lọc trạng thái", () => {
        renderWithProviders(<PostsPage />);

        expect(screen.getByRole("heading", { name: "Posts" })).toBeInTheDocument();
        expect(screen.getByLabelText("Search posts")).toBeInTheDocument();
        expect(screen.getByLabelText("Filter by status")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "All statuses" })).toBeInTheDocument();
    });

    it("PostsPage hiện ErrorState khi API từ chối, bấm Try again không sập", async () => {
        const user = userEvent.setup();
        renderWithProviders(<PostsPage />);

        const retry = await screen.findByRole("button", { name: "Try again" }, { timeout: REMOTE_TIMEOUT_MS - 5_000 });
        await user.click(retry);

        // Bấm retry cho query chạy lại; backend vẫn từ chối (không token) nên
        // ErrorState quay lại. Khẳng định trang tự phục hồi chứ không trắng màn hình.
        expect(
            await screen.findByRole("button", { name: "Try again" }, { timeout: REMOTE_TIMEOUT_MS - 5_000 }),
        ).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Posts" })).toBeInTheDocument();
    });

    it("CategoriesPage render header, tìm kiếm và nút tạo danh mục", () => {
        renderWithProviders(<CategoriesPage />);

        expect(screen.getByRole("heading", { name: "Category Management" })).toBeInTheDocument();
        expect(screen.getByLabelText("Search by name or UUID")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Create Category/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Export CSV/ })).toBeInTheDocument();
    });

    it("CategoriesPage hiện bảng danh mục thật từ backend", async () => {
        renderWithProviders(<CategoriesPage />);

        // GET /api/categories là public — không cần token.
        await waitFor(
            () => {
                expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
                expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
            },
            { timeout: REMOTE_TIMEOUT_MS - 5_000 },
        );
    });

    it("CategoriesPage đổi sort sang Name A-Z không gây lỗi", async () => {
        const user = userEvent.setup();
        renderWithProviders(<CategoriesPage />);

        await waitFor(() => expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument(), {
            timeout: REMOTE_TIMEOUT_MS - 5_000,
        });

        await user.selectOptions(screen.getByLabelText("Newest"), "name");

        expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    });

    it("UsersPage render header, tìm kiếm và bộ lọc", () => {
        renderWithProviders(<UsersPage />);

        expect(screen.getByRole("heading", { name: "User Management" })).toBeInTheDocument();
        expect(screen.getByLabelText("Search users")).toBeInTheDocument();
        expect(screen.getByLabelText("Filter by status")).toBeInTheDocument();
    });

    it("UsersPage hiện ErrorState khi thiếu quyền admin", async () => {
        renderWithProviders(<UsersPage />);

        expect(await screen.findByRole("button", { name: "Try again" }, { timeout: REMOTE_TIMEOUT_MS - 5_000 })).toBeInTheDocument();
    });

    it("VideosPage render header, tìm kiếm và bộ lọc", () => {
        renderWithProviders(<VideosPage />);

        expect(screen.getByRole("heading", { name: "Video Management" })).toBeInTheDocument();
        expect(screen.getByLabelText("Search videos")).toBeInTheDocument();
        expect(screen.getByLabelText("Filter by upload status")).toBeInTheDocument();
    });

    it("VideosPage hiện ErrorState khi thiếu quyền admin", async () => {
        renderWithProviders(<VideosPage />);

        expect(await screen.findByRole("button", { name: "Try again" }, { timeout: REMOTE_TIMEOUT_MS - 5_000 })).toBeInTheDocument();
    });
});

describe.skipIf(!HAS_ADMIN)("Trang admin — đã đăng nhập admin (E2E_ADMIN_*)", () => {
    beforeAll(async () => {
        const { login } = await import("@/services/authService");
        const data = await login({ identifier: E2E_ADMIN.identifier!, password: E2E_ADMIN.password! });
        useAuthStore.getState().setAuth({
            user: {
                id: data.userId,
                username: data.username,
                email: data.email,
                role: data.role,
                status: data.status,
            },
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresIn: data.expiresIn,
        });
    });

    // Token nằm trong store dùng chung — dọn để không rò sang test khác.
    afterAll(() => useAuthStore.getState().clearAuth());

    it(
        "PostsPage hiện bảng bài viết từ backend",
        async () => {
            renderWithProviders(<PostsPage />);

            await waitFor(
                () => {
                    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
                    expect(screen.getByRole("columnheader", { name: "Author" })).toBeInTheDocument();
                },
                { timeout: REMOTE_TIMEOUT_MS - 5_000 },
            );
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "UsersPage hiện bảng người dùng từ backend",
        async () => {
            renderWithProviders(<UsersPage />);

            await waitFor(
                () => {
                    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
                    expect(screen.getByRole("columnheader", { name: "Email" })).toBeInTheDocument();
                },
                { timeout: REMOTE_TIMEOUT_MS - 5_000 },
            );
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "VideosPage tải xong (bảng hoặc empty state) mà không hiện lỗi",
        async () => {
            renderWithProviders(<VideosPage />);

            await waitFor(
                () => {
                    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
                    const loaded =
                        screen.queryByRole("columnheader", { name: "Uploader" }) ?? screen.queryByText("No videos yet");
                    expect(loaded).toBeTruthy();
                },
                { timeout: REMOTE_TIMEOUT_MS - 5_000 },
            );
        },
        REMOTE_TIMEOUT_MS,
    );
});
