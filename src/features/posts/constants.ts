import type { PostFlag, PostStatus } from "./types";

/** Nhãn hiển thị nằm ở i18n `common:postStatus.*` — xem `PostStatusBadge`. */
export const POST_STATUS_VARIANT: Record<PostStatus, "secondary" | "cream" | "lightgreen" | "destructive"> = {
    created: "secondary",
    processed: "cream",
    published: "lightgreen",
    unpublished: "destructive",
};

/** `PUBLISH` đưa bài lên công khai; bài đang published thì không cần gọi lại. */
export function canPublish(status: PostStatus): boolean {
    return status !== "published";
}

/** `UNPUBLISH` ẩn bài khỏi công khai — từ chối bài chờ duyệt hoặc ngừng đăng bài đã đăng. */
export function canUnpublish(status: PostStatus): boolean {
    return status === "published" || status === "processed";
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
