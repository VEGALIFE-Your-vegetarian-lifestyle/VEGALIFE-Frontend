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
