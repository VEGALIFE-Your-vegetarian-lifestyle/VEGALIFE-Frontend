import type { PostFlag } from "@/types/post";

/**
 * Nhãn hiển thị nằm ở i18n `common:postFlag.*` — component đọc qua `t()`.
 * ponytail: chỉ giữ variant ở đây vì Tailwind cần class tĩnh.
 */
export const POST_FLAG_VARIANT: Record<PostFlag, "secondary" | "lightgreen" | "destructive" | "cream"> = {
    PENDING: "secondary",
    PASSED: "lightgreen",
    REJECTED: "destructive",
    NEEDS_REVIEW: "cream",
};
