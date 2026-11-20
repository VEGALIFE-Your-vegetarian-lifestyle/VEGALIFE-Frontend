import { api } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/types/common";
import type { DashboardChartsParams, DashboardChartsResponse, DashboardResponse } from "./types";

/**
 * `GET /api/admin/dashboard` — ảnh chụp lifetime/trạng thái hiện tại, KHÔNG có tham số thời gian.
 * Cache 5 phút, một entry dùng chung cho mọi admin; `meta.generatedAt` là mốc dữ liệu.
 */
export async function getAdminDashboard(): Promise<DashboardResponse> {
    const { data } = await api.get<ApiResponse<DashboardResponse>>("/api/admin/dashboard");
    return data.data;
}

/**
 * `GET /api/admin/dashboard/charts` — các series theo thời gian, `range` chỉ nhận
 * `day|week|month` (giá trị khác → 400). Cache 15 phút theo từng range.
 */
export async function getAdminDashboardCharts(
    params: DashboardChartsParams = {},
): Promise<DashboardChartsResponse> {
    const { data } = await api.get<ApiResponse<DashboardChartsResponse>>("/api/admin/dashboard/charts", {
        params,
    });
    return data.data;
}
