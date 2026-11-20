import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import AdminDashboardPage from "../AdminDashboardPage";
import * as dashboardApi from "@/features/admin/dashboardApi";
import type { DashboardChartsResponse, DashboardResponse } from "@/features/admin/types";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const mockSummary: DashboardResponse = {
    meta: { generatedAt: "2026-11-20T02:59:47Z", currency: "VND" },
    users: {
        total: 191,
        emailVerified: 179,
        activatedEver: 78,
        suspended: 7,
        deactivated: 8,
        activationRate: 0.937,
    },
    content: { totalPosts: 65, totalRecipes: 60, totalComments: 176 },
    engagement: {
        totalVotes: 285,
        votesUp: 256,
        votesDown: 29,
        totalSaves: 107,
        savedPosts: 66,
        savedRecipes: 41,
    },
    moderationQueue: {
        pendingPosts: 13,
        pendingRecipes: 5,
        reportedComments: 6,
        oldestPendingAgeHours: 1186,
        filterSkippedPosts: 4,
    },
    money: {
        revenueTotal: 6069000,
        transactionsTotal: 81,
        payingUsersTotal: 28,
        averageOrderValue: 74925.9,
        arpu: 216750,
        freeGrantsTotal: 28,
        payerConversionRate: 0.1466,
        pendingStaleCount: 5,
    },
};

const mockCharts: DashboardChartsResponse = {
    meta: {
        range: "week",
        interval: "day",
        from: "2026-11-14T00:00:00Z",
        to: "2026-11-20T02:59:35Z",
        boundary: "inclusiveStartExclusiveEnd",
        currency: "VND",
        generatedAt: "2026-11-20T02:59:35Z",
    },
    revenueByPlan: {
        items: [
            { planId: "p1", code: "PRO", name: "Pro", amount: 882000, purchases: 18, active: true },
        ],
    },
    publishedPosts: {
        points: [
            { bucketStart: "2026-11-14T00:00:00Z", published: 2 },
            { bucketStart: "2026-11-15T00:00:00Z", published: 1 },
        ],
    },
};

describe("AdminDashboardPage", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(dashboardApi, "getAdminDashboard").mockResolvedValue(mockSummary);
        vi.spyOn(dashboardApi, "getAdminDashboardCharts").mockResolvedValue(mockCharts);
    });

    it("render tiêu đề, mô tả và breadcrumb", async () => {
        renderWithProviders(<AdminDashboardPage />);

        expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
        expect(screen.getByText("Overview of platform metrics and management links.")).toBeInTheDocument();
    });

    it("hiển thị 5 thẻ tổng quan: user, post, recipe, paying member, revenue", async () => {
        renderWithProviders(<AdminDashboardPage />);

        await waitFor(() => expect(screen.getByText("191")).toBeInTheDocument());

        // Thành viên
        expect(screen.getByText("Members")).toBeInTheDocument();
        // Bài viết / Công thức
        expect(screen.getByText("Posts")).toBeInTheDocument();
        expect(screen.getByText("65")).toBeInTheDocument();
        expect(screen.getByText("Recipes")).toBeInTheDocument();
        expect(screen.getByText("60")).toBeInTheDocument();
        // Thành viên trả phí
        expect(screen.getByText("Paying Members")).toBeInTheDocument();
        expect(screen.getByText("28")).toBeInTheDocument();
        // Doanh thu — đồng nguyên, không chia 100
        expect(screen.getByText(/6,069,000/)).toBeInTheDocument();
        expect(screen.queryByText(/60,690/)).not.toBeInTheDocument();
    });

    it("không còn thẻ Comments / ARPU / Stale Payments trong khối tổng quan", async () => {
        renderWithProviders(<AdminDashboardPage />);

        await waitFor(() => expect(screen.getByText("191")).toBeInTheDocument());

        expect(screen.queryByText("Total Comments")).not.toBeInTheDocument();
        expect(screen.queryByText("Revenue / Paying User")).not.toBeInTheDocument();
        expect(screen.queryByText("Stale Payments")).not.toBeInTheDocument();
    });

    it("hiển thị cảnh báo tuổi hàng chờ và bài lọt bộ lọc", async () => {
        renderWithProviders(<AdminDashboardPage />);

        await waitFor(() => expect(screen.getByText("Pending Posts")).toBeInTheDocument());

        // 1186 giờ ≈ 49 ngày
        expect(screen.getByText(/Oldest item has been waiting 49 days/)).toBeInTheDocument();
        expect(screen.getByText(/4 post\(s\) skipped by the safety filter/)).toBeInTheDocument();
    });

    it("hiển thị hàng chờ kiểm duyệt với liên kết tới các trang admin", async () => {
        renderWithProviders(<AdminDashboardPage />);

        await waitFor(() => expect(screen.getByText("Pending Recipes")).toBeInTheDocument());

        expect(screen.getByText("Reported Comments")).toBeInTheDocument();

        const reviewLinks = screen.getAllByRole("link", { name: /Review now/i });
        expect(reviewLinks.some((link) => link.getAttribute("href") === "/admin/posts")).toBe(true);
        expect(reviewLinks.some((link) => link.getAttribute("href") === "/admin/recipes")).toBe(true);
        expect(reviewLinks.some((link) => link.getAttribute("href") === "/admin/comments")).toBe(true);
    });

    it("hiển thị tương tác dạng tổng tích luỹ", async () => {
        renderWithProviders(<AdminDashboardPage />);

        await waitFor(() => expect(screen.getByText("Community Engagement")).toBeInTheDocument());

        expect(screen.getByText("285")).toBeInTheDocument();
        expect(screen.getByText("107")).toBeInTheDocument();
    });

    it("đổi range gọi lại API charts, KHÔNG gọi lại summary", async () => {
        const user = userEvent.setup();
        const summarySpy = vi.spyOn(dashboardApi, "getAdminDashboard").mockResolvedValue(mockSummary);
        const chartsSpy = vi
            .spyOn(dashboardApi, "getAdminDashboardCharts")
            .mockResolvedValue(mockCharts);

        renderWithProviders(<AdminDashboardPage />);

        await waitFor(() => expect(screen.getByRole("tab", { name: "Last 24h" })).toBeInTheDocument());

        await user.click(screen.getByRole("tab", { name: "Last 24h" }));

        await waitFor(() => {
            expect(chartsSpy).toHaveBeenCalledWith({ range: "day" });
        });
        expect(summarySpy).toHaveBeenCalledTimes(1);
    });

    it("hiện ErrorState khi API summary lỗi và cho phép retry", async () => {
        const user = userEvent.setup();
        const spy = vi.spyOn(dashboardApi, "getAdminDashboard").mockRejectedValue(new Error("Network Error"));

        renderWithProviders(<AdminDashboardPage />);

        await waitFor(() => {
            expect(screen.getByRole("alert")).toBeInTheDocument();
        });

        spy.mockResolvedValue(mockSummary);
        await user.click(screen.getByRole("button", { name: /Try again/i }));

        await waitFor(() => {
            expect(screen.getByText("191")).toBeInTheDocument();
        });
    });
});
