import type { PostFlag, PostStatus } from "./types";

/** Nhãn hiển thị nằm ở i18n `common:postStatus.*` — xem `PostStatusBadge`. */
export const POST_STATUS_VARIANT: Record<PostStatus, "secondary" | "cream" | "lightgreen" | "destructive"> = {
    drafted: "secondary",
    processing: "cream",
    published: "lightgreen",
    unpublished: "destructive",
};

/**
 * `approvePost` chỉ có nghĩa trên bài đang chờ duyệt (`processing`). Bài `published` đã
 * duyệt rồi → không còn nút; bài `drafted` chưa ai gửi thì BE trả 400; bài `unpublished`
 * đã từ chối rồi → cũng không còn nút.
 */
export function canPublish(status: PostStatus): boolean {
    return status === "processing";
}

/**
 * `rejectPost` chỉ hiện trên bài đang chờ duyệt (`processing`). Bài đã duyệt (`published`)
 * hay đã từ chối (`unpublished`) thì ẩn nút, chỉ còn xoá.
 */
export function canReject(status: PostStatus): boolean {
    return status === "processing";
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
