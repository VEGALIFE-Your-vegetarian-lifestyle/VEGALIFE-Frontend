import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import AdminDashboardPage from "../AdminDashboardPage";
import * as dashboardApi from "@/features/admin/dashboardApi";
import type { DashboardResponse } from "@/features/admin/types";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const mockDashboardData: DashboardResponse = {
    range: {
        type: "week",
        from: "2026-10-15T00:00:00Z",
        to: "2026-10-22T09:00:00Z",
    },
    users: {
        total: 1024,
        newInRange: 37,
        activeInRange: 142,
    },
    content: {
        totalPosts: 512,
        newPosts: 28,
        totalRecipes: 210,
        newRecipes: 9,
        totalComments: 3300,
        newComments: 150,
    },
    engagement: {
        votesInRange: 420,
        commentsInRange: 150,
    },
    moderationQueue: {
        pendingPosts: 4,
        pendingRecipes: 2,
        reportedComments: 6,
    },
};

describe("AdminDashboardPage", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(dashboardApi, "getAdminDashboard").mockResolvedValue(mockDashboardData);
    });

    it("render tiêu đề, mô tả và breadcrumb", async () => {
        renderWithProviders(<AdminDashboardPage />);

        expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
        expect(screen.getByText("Overview of platform metrics and management links.")).toBeInTheDocument();
    });

    it("hiển thị 4 thẻ KPI với số liệu chuẩn từ backend", async () => {
        renderWithProviders(<AdminDashboardPage />);

        await waitFor(() => expect(screen.getByText("1,024")).toBeInTheDocument());

        expect(screen.getByText("Members")).toBeInTheDocument();
        expect(screen.getByText("+37 new in range")).toBeInTheDocument();

        expect(screen.getAllByText("512").length).toBeGreaterThan(0);
        expect(screen.getByText("+28 new posts")).toBeInTheDocument();

        expect(screen.getAllByText("210").length).toBeGreaterThan(0);
        expect(screen.getByText("+9 new recipes")).toBeInTheDocument();

        expect(screen.getAllByText("3,300").length).toBeGreaterThan(0);
        expect(screen.getByText("+150 new comments")).toBeInTheDocument();
    });

    it("hiển thị hàng chờ kiểm duyệt (Moderation Queue) với liên kết tới các trang admin", async () => {
        renderWithProviders(<AdminDashboardPage />);

        await waitFor(() => expect(screen.getByText("Pending Posts")).toBeInTheDocument());

        expect(screen.getByText("Pending Recipes")).toBeInTheDocument();
        expect(screen.getByText("Reported Comments")).toBeInTheDocument();

        const reviewLinks = screen.getAllByRole("link", { name: /Review now/i });
        expect(reviewLinks.some((link) => link.getAttribute("href") === "/admin/posts")).toBe(true);
        expect(reviewLinks.some((link) => link.getAttribute("href") === "/admin/recipes")).toBe(true);
        expect(reviewLinks.some((link) => link.getAttribute("href") === "/admin/comments")).toBe(true);
    });

    it("hiển thị phân bổ nội dung và chỉ số tương tác cộng đồng", async () => {
        renderWithProviders(<AdminDashboardPage />);

        await waitFor(() => expect(screen.getByText("Total Votes")).toBeInTheDocument());

        expect(screen.getByText("Community Engagement")).toBeInTheDocument();
        expect(screen.getByText("420")).toBeInTheDocument();
        expect(screen.getAllByText("150").length).toBeGreaterThan(0);
    });

    it("chuyển đổi bộ lọc thời gian gọi lại API với range tương ứng", async () => {
        const user = userEvent.setup();
        const spy = vi.spyOn(dashboardApi, "getAdminDashboard").mockResolvedValue(mockDashboardData);

        renderWithProviders(<AdminDashboardPage />);

        await waitFor(() => expect(screen.getByText("Last 7 Days")).toBeInTheDocument());

        const dayButton = screen.getByRole("button", { name: "Today (24h)" });
        await user.click(dayButton);

        await waitFor(() => {
            expect(spy).toHaveBeenCalledWith(expect.objectContaining({ range: "day" }));
        });
    });

    it("render đầy đủ 8 liên kết lối tắt quản trị nhanh", async () => {
        renderWithProviders(<AdminDashboardPage />);

        await waitFor(() => expect(screen.getByText("Quick Management")).toBeInTheDocument());

        expect(screen.getByRole("link", { name: /Posts/i })).toHaveAttribute("href", "/admin/posts");
        expect(screen.getByRole("link", { name: /Recipes/i })).toHaveAttribute("href", "/admin/recipes");
        expect(screen.getByRole("link", { name: /Categories/i })).toHaveAttribute("href", "/admin/categories");
        expect(screen.getByRole("link", { name: /Comments/i })).toHaveAttribute("href", "/admin/comments");
        expect(screen.getByRole("link", { name: /Ingredients/i })).toHaveAttribute("href", "/admin/ingredients");
        expect(screen.getByRole("link", { name: /Locations/i })).toHaveAttribute("href", "/admin/locations");
        expect(screen.getByRole("link", { name: /Users/i })).toHaveAttribute("href", "/admin/users");
        expect(screen.getByRole("link", { name: /Videos/i })).toHaveAttribute("href", "/admin/videos");
    });

    it("hiện ErrorState khi API gặp lỗi và cho phép retry", async () => {
        const user = userEvent.setup();
        const spy = vi.spyOn(dashboardApi, "getAdminDashboard").mockRejectedValue(new Error("Network Error"));

        renderWithProviders(<AdminDashboardPage />);

        await waitFor(() => {
            expect(screen.getByRole("alert")).toBeInTheDocument();
        });

        spy.mockResolvedValue(mockDashboardData);
        const retryBtn = screen.getByRole("button", { name: /Try again/i });
        await user.click(retryBtn);

        await waitFor(() => {
            expect(screen.getByText("1,024")).toBeInTheDocument();
        });
    });
});
