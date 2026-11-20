import type { JSONContent } from "@tiptap/react";

// Post status machine — ADR-023, ADR-029 (V61). `status` trả lời "công khai thấy được không?";
// `flag` trả lời "verdict cuối là gì?".
//   processing — đã gửi, filter còn đang chạy; CHƯA có verdict nên flag luôn null.
//   pending    — verdict đã có, chờ admin quyết. Đây là hàng chờ duyệt thật sự.
// Filter fail KHÔNG đẩy bài sang unpublished — chỉ admin từ chối mới tới đó.
// `hidden` đã bỏ khỏi backend (V56).
export type PostStatus = "drafted" | "processing" | "pending" | "published" | "unpublished";

/** Verdict cuối của lần kiểm duyệt tự động gần nhất — chỉ có ở admin endpoint. */
export type PostFlag = "FILTER_PASSED" | "FILTER_FAILED" | "SIMILAR_CONTENT" | "FILTER_SKIPPED";

/** Bằng chứng verdict — field nào không thuộc `kind` đó thì VẮNG MẶT (không phải null). */
export type FlagDetail = {
    kind: PostFlag;
    outcome?: "FAIL" | "UNCERTAIN"; // FILTER_FAILED
    score?: number; // FILTER_PASSED / FILTER_FAILED, 0–1
    threshold?: number; // FILTER_PASSED / FILTER_FAILED / SIMILAR_CONTENT, 0–1
    postId?: string; // SIMILAR_CONTENT
    similarity?: number; // SIMILAR_CONTENT, 0–1
    cause?: "DISABLED" | "SWEPT" | "UNAVAILABLE"; // FILTER_SKIPPED
};

/**
 * Một dòng trong bảng kiểm duyệt — `GET /api/admin/posts`.
 * Từ PR #214: superset của shape member (`PostListResponse`) + 3 field duyệt bài.
 */
export interface AdminPost {
    id: string;
    title: string;
    /** Text thuần, BE giữ lại để admin đọc duyệt. */
    content: string;
    /** ProseMirror doc gốc — render qua editor để duyệt đúng như tác giả viết. */
    rawContent?: JSONContent | null;
    featuredImageUrl: string | null;
    categoryIds: string[];
    mediaIds: string[];
    /** Recipe còn sống đang gắn vào bài. Member feed luôn `[]`; admin list mới có. */
    recipeIds: string[];
    status: PostStatus;
    flag: PostFlag | null;
    /** Bằng chứng của `flag` — `null` khi chưa có verdict. */
    flagDetail?: FlagDetail | null;
    /** Chỉ có sau khi admin từ chối (`status === "unpublished"`). */
    rejectionReason?: string | null;
    viewCount: number;
    publishedAt: string | null;
    createdAt: string;
    userId: string;
    /** Tên hiển thị của tác giả — BE trả `displayName` (không có `username`). */
    displayName: string;
    /** Avatar tác giả — `null` khi chưa có profile (BR-PROFILE-003). */
    avatarUrl: string | null;
    email: string;
}

/** Một tên dùng chung gắn với bài (dish / ingredient / recipe) — chỉ `GET /api/admin/posts/{id}` trả. */
export interface AdminPostComponent {
    id: string;
    type: "RECIPE" | "DISH" | "INGREDIENT";
    name: string;
    moderationStatus: "PENDING" | "APPROVED" | "REJECTED";
}

/**
 * `GET /api/admin/posts/{postId}` — chi tiết để duyệt.
 * Từ PR #214 là **superset của `AdminPost`** (19 field list + 22 field detail),
 * nên `extends` là đúng: BE có integration test giữ ràng buộc này.
 */
export interface AdminPostDetail extends AdminPost {
    /** `null` = chưa từng chấm (provider lỗi, không phải điểm thấp). */
    contentScore: number | null;
    /** Component đính kèm (recipe / dish / ingredient) + trạng thái duyệt của từng cái. */
    recipes: AdminPostComponent[];
    names: AdminPostComponent[];
}

/* ------------------------------------------------------------------ *
 * Nội dung bài viết — lưu hai dạng (xem `components/editor/editorContent.ts`)
 *
 * `content`    — text thuần, để tìm kiếm / trích đoạn / hiển thị ở card.
 * `rawContent` — JSON ProseMirror (object), để render lại (không có đường XSS).
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Field hiển thị theo mockup nhưng backend CHƯA trả — CARD thôi.
 * Blog/Explore/MyPosts vẫn bơm ở `./mockEnrichment.ts`; Post Detail đã bỏ
 * hết (xem DOCS/MOCK-FIELDS.md § Post Detail).
 * ------------------------------------------------------------------ */

export interface PostAuthorCard {
    username: string;
    role: string;
    bio: string;
    followers: number;
    postCount: number;
    avatarUrl?: string;
}

/** `POST /api/posts/{postId}/comments` — shape BE trả về khi tạo. */
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

export interface UpdateCommentRequest {
    content: string;
}

export interface ReportCommentRequest {
    reason?: string;
}

/**
 * `GET /api/posts/{postId}/comments` — một mục trong cây bình luận.
 * Chỉ comment gốc bị phân trang; `replies[]` là cả cây con, không phân trang.
 */
export interface PostCommentThread {
    id: string;
    /** null khi đã xoá mềm. */
    userId: string | null;
    /** ID của comment cha nếu là câu trả lời (reply). */
    parentId?: string | null;
    /** Tên người dùng đang được trả lời. */
    replyToUsername?: string | null;
    username: string | null;
    /** Tên hiển thị người bình luận — BE trả `displayName`. */
    displayName?: string | null;
    avatarUrl: string | null;
    /** Đã xoá mềm thì BE trả đúng chuỗi `"[deleted]"`, các field tác giả null. */
    content: string;
    edited: boolean;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
    replies: PostCommentThread[];
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
    categoryIds?: string[];
    /** true = gửi duyệt (→ `processing`, filter chạy async); false = rút về `drafted`. */
    publish?: boolean;
    /** JSON ProseMirror (object) — gửi kèm khi sửa nội dung. */
    rawContent?: JSONContent;
}

export interface PostListResponse {
    id: string;
    title: string;
    /** Text thuần — hiển thị card / trích đoạn / ước lượng thời gian đọc. */
    content: string;
    /** JSON ProseMirror (object) — BE trả về để render lại. */
    rawContent?: JSONContent | string | null;
    /** JSON ProseMirror đã parse từ `rawContent` — xem `getPostDetail` trong `./api.ts`. */
    contentJson?: JSONContent | null;
    featuredImageUrl: string | null;
    categoryIds: string[];
    /** Media đính kèm (video/ảnh) — id thôi, lấy URL qua `GET /api/media/{id}`. */
    mediaIds: string[];
    /** Công thức gắn vào bài — ghi qua `POST /api/posts/{id}/recipes`. */
    recipeIds: string[];
    status: PostStatus;
    /** Lý do admin từ chối — chỉ có khi `status === "unpublished"`. */
    rejectionReason?: string | null;
    viewCount: number;
    publishedAt: string | null;
    createdAt: string;

    /* Field mock của CARD — xem khối PostAuthorCard phía trên. */
    authorCard?: PostAuthorCard;
    /** "25 mins" | "8:45" | "5 min read" — nhãn overlay góc ảnh. */
    durationLabel?: string;
    rating?: number;
    commentCount?: number;
    saveCount?: number;
}
