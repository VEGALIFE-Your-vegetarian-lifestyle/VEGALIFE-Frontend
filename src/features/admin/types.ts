/** `GET /api/admin/dashboard/charts` — preset thời gian. `custom` đã bị bỏ (400 nếu gửi). */
export type DashboardRangeType = "day" | "week" | "month";
export type DashboardInterval = "hour" | "day";

export interface DashboardMeta {
    /** Server lúc dựng payload — response cache 5 phút nên có thể cũ hơn "bây giờ". */
    generatedAt: string;
    /** Luôn `"VND"`. Dùng để chọn formatter, đừng hardcode `₫`. */
    currency: string;
}

export interface DashboardUserMetrics {
    total: number;
    emailVerified: number;
    /** Đã từng dùng ≥1 lượt AI. Lifetime, đơn điệu tăng. */
    activatedEver: number;
    suspended: number;
    deactivated: number;
    /** `emailVerified / total`, 0..1 — backend đã guard chia 0. */
    activationRate: number;
}

export interface DashboardContentMetrics {
    totalPosts: number;
    totalRecipes: number;
    totalComments: number;
}

export interface DashboardEngagementMetrics {
    totalVotes: number;
    votesUp: number;
    votesDown: number;
    totalSaves: number;
    savedPosts: number;
    savedRecipes: number;
}

export interface DashboardModerationQueueMetrics {
    pendingPosts: number;
    pendingRecipes: number;
    reportedComments: number;
    /** Tuổi (giờ) của item cũ nhất trong cả 3 hàng chờ. 0 khi không có gì. */
    oldestPendingAgeHours: number;
    /** Post `flag = FILTER_SKIPPED` — bộ lọc không ra phán quyết, cần người xem. */
    filterSkippedPosts: number;
}

/** Khối doanh thu — số nguyên đồng, **gross** (backend không có đường hoàn tiền). */
export interface DashboardMoney {
    revenueTotal: number;
    transactionsTotal: number;
    payingUsersTotal: number;
    averageOrderValue: number;
    /** `revenueTotal / payingUsersTotal` — nhãn "revenue per paying user", KHÔNG phải ARPU. */
    arpu: number;
    freeGrantsTotal: number;
    /** `payingUsersTotal / total`, 0..1. */
    payerConversionRate: number;
    pendingStaleCount: number;
}

export interface DashboardResponse {
    meta: DashboardMeta;
    users: DashboardUserMetrics;
    content: DashboardContentMetrics;
    engagement: DashboardEngagementMetrics;
    moderationQueue: DashboardModerationQueueMetrics;
    money: DashboardMoney;
}

// ---------- GET /api/admin/dashboard/charts ----------

export interface DashboardChartsMeta {
    range: DashboardRangeType;
    /** Do server chọn. Chỉ dùng để format nhãn trục, không bao giờ gửi lên. */
    interval: DashboardInterval;
    from: string;
    to: string;
    boundary: "inclusiveStartExclusiveEnd";
    currency: string;
    generatedAt: string;
}

export interface RevenueByPlanItem {
    planId: string;
    code: string;
    name: string;
    amount: number;
    /** Số lượt mua sinh ra khoản tiền đó (không phải số giao dịch ledger). */
    purchases: number;
    /** Trạng thái catalogue hiện tại — plan đã ngừng bán vẫn xuất hiện, đừng lọc bỏ. */
    active: boolean;
}

export interface PublishedPostPoint {
    bucketStart: string;
    published: number;
}

export interface DashboardChartsResponse {
    meta: DashboardChartsMeta;
    revenueByPlan: { items: RevenueByPlanItem[] };
    publishedPosts: { points: PublishedPostPoint[] };
}

export interface DashboardChartsParams {
    range?: DashboardRangeType;
}

/** @deprecated Dùng DashboardResponse thay thế cho mock category stats cũ */
export interface DashboardStats {
    totalCategories: number;
    activeCategories: number;
    softDeletedCategories: number;
    associatedContent: number;
}

export interface DashboardRecentItem {
    id: string;
    title: string;
    type: "post" | "video" | "user";
    status: string;
    createdAt: string;
}

export type CommentStatus = "active" | "removed";

/** `GET /api/admin/comments` — một bình luận trong hàng chờ kiểm duyệt. */
export interface AdminComment {
    id: string;
    postId: string;
    userId: string;
    /** BE trả `displayName` (không có `username`) — xem DOCS/API-COVERAGE.md §12. */
    displayName: string | null;
    avatarUrl: string | null;
    content: string;
    parentId: string | null;
    status: CommentStatus;
    reportCount: number;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export type AdminCommentSort = "createdAt" | "updatedAt";

export interface AdminCommentListParams {
    /** 1-based trong UI, map sang 0-based khi gọi API. */
    page: number;
    size: number;
    /** Lọc từ khoá client-side theo nội dung, displayName hoặc id. */
    q?: string;
    /** "all" = không gửi param status (lấy cả 2 trạng thái). */
    status?: CommentStatus | "all";
    userId?: string;
    postId?: string;
    sort?: AdminCommentSort;
    createdFrom?: string;
    createdTo?: string;
}

export interface ModerateCommentRequest {
    /** Bắt buộc, tối đa 1000 ký tự. */
    reason: string;
}
