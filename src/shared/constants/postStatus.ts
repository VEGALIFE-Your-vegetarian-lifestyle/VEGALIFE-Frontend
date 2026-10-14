import type { PostStatus } from "@/types/post";

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
