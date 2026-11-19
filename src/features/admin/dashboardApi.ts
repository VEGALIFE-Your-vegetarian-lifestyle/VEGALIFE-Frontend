import { api } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/types/common";
import type { DashboardParams, DashboardResponse } from "./types";

/**
 * `GET /api/admin/dashboard` — Lấy các chỉ số tổng hợp toàn hệ thống cho Admin console.
 * Hỗ trợ lọc theo khoảng thời gian: range=day|week|month|custom.
 */
export async function getAdminDashboard(params?: DashboardParams): Promise<DashboardResponse> {
    const { data } = await api.get<ApiResponse<DashboardResponse>>("/api/admin/dashboard", {
        params,
    });
    return data.data;
}

/**
 * Alias cho getAdminDashboard để giữ tương thích ngược.
 */
export const getDashboardStats = getAdminDashboard;
