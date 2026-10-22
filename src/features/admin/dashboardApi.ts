import { categoriesSeed } from "@/features/categories/mocks";
import type { DashboardStats } from "./types";
import { delay } from "@/shared/utils/delay";

export async function getDashboardStats(): Promise<DashboardStats> {
    await delay();
    const total = categoriesSeed.length;
    const softDeleted = categoriesSeed.filter((category) => category.deletedAt !== null).length;
    const active = total - softDeleted;
    const associatedContent = categoriesSeed.reduce((sum, category) => sum + (category.contentCount ?? 0), 0);

    return {
        totalCategories: total,
        activeCategories: active,
        softDeletedCategories: softDeleted,
        associatedContent,
    };
}
