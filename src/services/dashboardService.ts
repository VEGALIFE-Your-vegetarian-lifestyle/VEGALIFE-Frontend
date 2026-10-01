import { categoriesSeed } from "@/shared/mocks/categories";
import type { DashboardStats } from "@/types/dashboard";
import { delay } from "@/utils/delay";

export async function getDashboardStats(): Promise<DashboardStats> {
    await delay();
    const total = categoriesSeed.length;
    const softDeleted = categoriesSeed.filter((category) => category.deletedAt !== null).length;
    const active = total - softDeleted;
    const associatedContent = categoriesSeed.reduce((sum, category) => sum + category.contentCount, 0);

    return {
        totalCategories: total,
        activeCategories: active,
        softDeletedCategories: softDeleted,
        associatedContent,
    };
}
