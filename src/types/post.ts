import type { JSONContent } from "@tiptap/react";

// Post status machine — SRS 5.2. `flagged` đã bỏ ở ADR-011: bài filter fail
// thành status=unpublished + flag REJECTED/NEEDS_REVIEW. `hidden` bỏ theo yêu cầu:
// chỉ còn published (hiện) / unpublished (không hiện).
export type PostStatus = "created" | "processed" | "published" | "unpublished";

export type PostType = "blog" | "video";

/** Trạng thái kiểm duyệt tự động — `GET /api/admin/posts`. */
export type PostFlag = "PENDING" | "PASSED" | "REJECTED" | "NEEDS_REVIEW";

/** Một dòng trong bảng kiểm duyệt — `GET /api/admin/posts`. */
export interface AdminPost {
    id: string;
    title: string;
    /** Text thuần, BE giữ lại để admin đọc duyệt. */
    content: string;
    featuredImageUrl: string | null;
    categoryIds: string[];
    mediaIds: string[];
    status: PostStatus;
    flag: PostFlag | null;
    viewCount: number;
    publishedAt: string | null;
    createdAt: string;
    userId: string;
    username: string;
    email: string;
}

/** `POST /api/admin/posts/{postId}/moderate` — duyệt hoặc từ chối bài chờ duyệt. */
export type ModerationAction = "PUBLISH" | "UNPUBLISH";

export interface ModeratePostRequest {
    action: ModerationAction;
    /** ≤1000 ký tự — lưu vào moderation_log. Bỏ trống khi không cần nêu lý do. */
    reason?: string;
}

/* ------------------------------------------------------------------ *
 * Nội dung bài viết — lưu hai dạng (xem components/editor/editorContent.ts)
 *
 * `content`    — text thuần, để tìm kiếm / trích đoạn / hiển thị ở card.
 * `rawContent` — JSON ProseMirror (object), để render lại (không có đường XSS).
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Field hiển thị theo mockup nhưng backend CHƯA trả.
 * Tất cả optional — điền ở `shared/mocks/postEnrichment.ts`, xoá khi BE có.
 * ------------------------------------------------------------------ */

export interface PostAuthorCard {
    username: string;
    role: string;
    bio: string;
    followers: number;
    postCount: number;
    avatarUrl?: string;
}

export interface PostNutrition {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
}

export interface PostIngredientGroup {
    title: string;
    items: { quantity: string; name: string }[];
}

export interface PostStep {
    title: string;
    body: string;
    /** "10 Mins" — nhãn thời gian ở góc phải mỗi bước. */
    timestamp?: string;
}

/** `POST /api/posts/{postId}/comments` — shape BE trả về. */
export interface ApiComment {
    id: string;
    postId: string;
    parentId: string | null;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCommentRequest {
    /** Bắt buộc, không được blank. */
    content: string;
    /** null = comment gốc; UUID = reply dưới comment đó. */
    parentId?: string | null;
}

export interface PostComment {
    id: string;
    author: string;
    badge?: string;
    date: string;
    content: string;
    likes: number;
    /** "Insider Tip" của người bình luận. */
    tip?: string;
    /** Bình luận của tác giả bài, hiện khung nổi bật. */
    isAuthor?: boolean;
}

export interface PostActivity {
    id: string;
    kind: "upvote" | "comment" | "save";
    title: string;
    detail?: string;
    date: string;
}

/* ------------------------------------------------------------------ *
 * Request / response
 * ------------------------------------------------------------------ */

/**
 * POST /api/posts — chỉ nhận 3 field; type/category/publish set qua PATCH sau.
 *
 * `content` là text thuần, `rawContent` là object JSON ProseMirror
 * (xem `components/editor/editorContent.ts`).
 */
export interface CreatePostRequest {
    title: string;
    /** Text thuần suy từ editor — BE dùng để tìm kiếm / trích đoạn. */
    content: string;
    /** JSON ProseMirror — gửi thẳng object, không stringify. */
    rawContent?: JSONContent;
    featuredImageUrl: string | null;
}

export interface CreatePostResponse {
    id: string;
    title: string;
    content: string;
    rawContent?: JSONContent | null;
    featuredImageUrl: string | null;
    status: PostStatus;
    flag: string | null;
    viewCount: number;
    publishedAt: string | null;
    createdAt: string;
}

/** PATCH /api/posts/{postId} — bỏ trống field nào thì giữ nguyên field đó. */
export interface UpdatePostRequest {
    title?: string;
    /** Text thuần. */
    content?: string;
    featuredImageUrl?: string;
    videoUrl?: string;
    mediaId?: string;
    categoryIds?: string[];
    /** true = đăng (cần ≥1 category active), false = về draft. */
    publish?: boolean;
    /** Bất biến — chỉ nhận giá trị hiện tại của bài. */
    type?: PostType;
    /** JSON ProseMirror (object) — gửi kèm khi sửa nội dung. */
    rawContent?: JSONContent;
}

export interface PostListResponse {
    id: string;
    title: string;
    type: PostType;
    /** Text thuần — hiển thị card / trích đoạn / ước lượng thời gian đọc. */
    content: string;
    /** JSON ProseMirror (object) — BE trả về để render lại. */
    rawContent?: JSONContent | string | null;
    /** JSON ProseMirror đã parse từ `rawContent` — xem `shared/mocks/postEnrichment.ts`. */
    contentJson?: JSONContent | null;
    featuredImageUrl: string | null;
    videoUrl: string | null;
    categoryIds: string[];
    mediaIds: string[];
    status: PostStatus;
    flag: string | null;
    viewCount: number;
    publishedAt: string | null;
    createdAt: string;

    /* Field mock — xem khối PostAuthorCard phía trên. */
    authorCard?: PostAuthorCard;
    /** "25 mins" | "8:45" | "5 min read" — nhãn overlay góc ảnh. */
    durationLabel?: string;
    rating?: number;
    commentCount?: number;
    saveCount?: number;
}

export interface PostDetailResponse extends PostListResponse {
    nutrition?: PostNutrition;
    ingredientGroups?: PostIngredientGroup[];
    steps?: PostStep[];
    servings?: number;
    difficulty?: string;
    prepTimeMinutes?: number;
    /** "Chef's Kitchen Secret". */
    chefTip?: string;
}
