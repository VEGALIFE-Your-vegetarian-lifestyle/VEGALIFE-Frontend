import type { Category } from "@/types/category";

export const categoriesSeed: Category[] = [
    { id: "cat-01", name: "Món chính", description: "Các món chay cho bữa trưa và bữa tối", createdAt: "2026-08-01T08:00:00Z", deletedAt: null },
    { id: "cat-02", name: "Món ăn vặt", description: "Snack và món nhẹ từ thực vật", createdAt: "2026-08-01T08:05:00Z", deletedAt: null },
    { id: "cat-03", name: "Đồ uống", description: "Sinh tố, sữa hạt, nước ép", createdAt: "2026-08-03T09:00:00Z", deletedAt: null },
    { id: "cat-04", name: "Thực đơn tuần", description: "Gợi ý thực đơn chay theo tuần", createdAt: "2026-08-05T10:30:00Z", deletedAt: null },
    { id: "cat-05", name: "Dinh dưỡng", description: "Kiến thức dinh dưỡng cho người ăn chay", createdAt: "2026-08-10T14:00:00Z", deletedAt: null },
    { id: "cat-06", name: "Mẹo nấu ăn", description: "Mẹo vặt trong bếp", createdAt: "2026-08-12T16:20:00Z", deletedAt: "2026-09-20T07:00:00Z" },
];