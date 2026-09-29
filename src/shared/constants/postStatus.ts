import type { PostStatus } from "@/types/post";

export const POST_STATUS_LABEL: Record<PostStatus, string> = {
    created: "Mới tạo",
    processed: "Chờ duyệt",
    published: "Đã đăng",
    hidden: "Đã ẩn",
    unpublished: "Ngừng đăng",
};

export const POST_STATUS_VARIANT: Record<PostStatus, "secondary" | "cream" | "lightgreen" | "outline" | "destructive"> = {
    created: "secondary",
    processed: "cream",
    published: "lightgreen",
    hidden: "outline",
    unpublished: "destructive",
};