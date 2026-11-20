import type { PostFlag, PostStatus } from "./types";

/** Nhãn hiển thị nằm ở i18n `common:postStatus.*` — xem `PostStatusBadge`. */
export const POST_STATUS_VARIANT: Record<PostStatus, "secondary" | "cream" | "lightgreen" | "destructive"> = {
    drafted: "secondary",
    processing: "secondary",
    pending: "cream",
    published: "lightgreen",
    unpublished: "destructive",
};

/**
 * `approvePost` có nghĩa trên bài đang chờ quyết: `pending` (verdict đã có, chờ admin) và
 * `processing` (admin được quyết sớm, verdict tới sau bị bỏ — AdminPostService). Bài `drafted`
 * chưa ai gửi thì BE trả 400; bài `published`/`unpublished` không còn nút.
 */
export function canPublish(status: PostStatus): boolean {
    return status === "pending" || status === "processing";
}

/** `rejectPost` cùng điều kiện với `canPublish` — xem chú thích trên. */
export function canReject(status: PostStatus): boolean {
    return status === "pending" || status === "processing";
}

/**
 * Nhãn hiển thị nằm ở i18n `common:postFlag.*` — component đọc qua `t()`.
 * ponytail: chỉ giữ variant ở đây vì Tailwind cần class tĩnh.
 */
export const POST_FLAG_VARIANT: Record<PostFlag, "secondary" | "lightgreen" | "destructive" | "cream"> = {
    FILTER_PASSED: "lightgreen",
    FILTER_FAILED: "destructive",
    SIMILAR_CONTENT: "cream",
    FILTER_SKIPPED: "secondary",
};
