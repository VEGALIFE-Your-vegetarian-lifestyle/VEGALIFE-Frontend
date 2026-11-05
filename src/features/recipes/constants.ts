import type { ModerationStatus } from "./types";

/** Nhãn hiển thị ở i18n `admin:recipes.moderation.status.*`. */
export const MODERATION_VARIANT: Record<ModerationStatus, "amber" | "lightgreen" | "destructive"> = {
    PENDING: "amber",
    APPROVED: "lightgreen",
    REJECTED: "destructive",
};
