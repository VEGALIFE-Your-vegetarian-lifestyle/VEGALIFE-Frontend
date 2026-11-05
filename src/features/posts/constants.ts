import type { PostFlag, PostStatus } from "./types";

/** Nhãn hiển thị nằm ở i18n `common:postStatus.*` — xem `PostStatusBadge`. */
export const POST_STATUS_VARIANT: Record<PostStatus, "secondary" | "cream" | "lightgreen" | "destructive"> = {
    created: "secondary",
    processed: "cream",
    published: "lightgreen",
    unpublished: "destructive",
};

/** `approvePost` đưa bài lên công khai; bài đang published thì không cần gọi lại. */
export function canPublish(status: PostStatus): boolean {
    return status !== "published";
}

/**
 * `rejectPost` chỉ nhận bài đang chờ duyệt (`processed`).
 * Bài đã `published` không có endpoint admin để bỏ xuống nữa — ADR-016 xoá `/moderate`,
 * và `PATCH /api/posts/{id}/visibility` (ẩn hẳn) là việc khác, chủ bài mới đăng lại được.
 */
export function canReject(status: PostStatus): boolean {
    return status === "processed";
}

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
