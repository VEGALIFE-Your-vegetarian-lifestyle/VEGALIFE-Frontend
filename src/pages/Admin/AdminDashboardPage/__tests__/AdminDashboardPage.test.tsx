import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import AdminDashboardPage from "@/pages/Admin/AdminDashboardPage/AdminDashboardPage";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

describe("AdminDashboardPage", () => {
    it("render tiêu đề và mô tả", () => {
        renderWithProviders(<AdminDashboardPage />);

        expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
        expect(screen.getByText("Overview of platform metrics and management links.")).toBeInTheDocument();
    });

    it("hiện skeleton trước, rồi thay bằng 4 metric card", async () => {
        const { container } = renderWithProviders(<AdminDashboardPage />);

        expect(container.querySelectorAll(".animate-pulse").length).toBe(4);

        await waitFor(() => expect(container.querySelectorAll(".animate-pulse").length).toBe(0));

        for (const label of ["Total Categories", "Active Categories", "Soft Deleted", "Associated Content"]) {
            expect(screen.getByText(label)).toBeInTheDocument();
        }
    });

    it("số liệu mock khớp nhau: active + soft deleted = total", async () => {
        renderWithProviders(<AdminDashboardPage />);

        await waitFor(() => expect(screen.getByText("Total Categories")).toBeInTheDocument());

        const valueOf = (label: string) => {
            const card = screen.getByText(label).closest("div");
            return Number(card?.querySelector("p.mt-1")?.textContent?.replace(/,/g, "") ?? NaN);
        };

        const total = valueOf("Total Categories");
        const active = valueOf("Active Categories");
        const deleted = valueOf("Soft Deleted");

        expect(active + deleted).toBe(total);
    });

    it("render 4 quick link trỏ đúng route quản trị", () => {
        renderWithProviders(<AdminDashboardPage />);

        expect(screen.getByRole("link", { name: /Categories/ })).toHaveAttribute("href", "/admin/categories");
        expect(screen.getByRole("link", { name: /Posts/ })).toHaveAttribute("href", "/admin/posts");
        expect(screen.getByRole("link", { name: /Videos/ })).toHaveAttribute("href", "/admin/videos");
        expect(screen.getByRole("link", { name: /Users/ })).toHaveAttribute("href", "/admin/users");
    });

    it("hiện mục Guide và nút mở quản lý danh mục", () => {
        renderWithProviders(<AdminDashboardPage />);

        expect(screen.getByRole("heading", { name: "Guide" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Open category management/ })).toHaveAttribute(
            "href",
            "/admin/categories",
        );
    });
});
