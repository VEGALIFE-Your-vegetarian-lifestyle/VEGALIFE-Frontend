import { api } from "@/shared/api/client";
import { enrichListItem, getMockActivity } from "./mockEnrichment";
import { parseStoredContent } from "./components/editor/editorContent";
import type { ApiResponse, ListParams, PageResponse, Paginated } from "@/shared/types/common";
import type {
    AdminPost,
    ApiComment,
    CreateCommentRequest,
    CreatePostRequest,
    CreatePostResponse,
    PostActivity,
    PostCommentThread,
    PostFlag,
    PostListResponse,
    PostStatus,
    ReportCommentRequest,
    UpdateCommentRequest,
    UpdatePostRequest,
} from "./types";
import { delay } from "@/shared/utils/delay";

/**
 * POST /api/posts chỉ nhận { title, content, rawContent, featuredImageUrl } và luôn tạo ở status "created".
 * Đăng bài / gán category phải gọi PATCH /api/posts/{id} sau đó.
 *
 * `content` là text thuần, `rawContent` là object JSON ProseMirror.
 */
export async function createPost(request: CreatePostRequest): Promise<CreatePostResponse> {
    const { data } = await api.post<ApiResponse<CreatePostResponse>>("/api/posts", {
        title: request.title,
        content: request.content,
        rawContent: request.rawContent,
        featuredImageUrl: request.featuredImageUrl ?? null,
    });
    return data.data;
}

/**
 * PATCH /api/posts/{postId} — sửa một phần; field bỏ trống giữ nguyên.
 * type là bất biến, chỉ gửi khi cần set cho post vừa tạo.
 */
export async function updatePost(id: string, request: UpdatePostRequest): Promise<PostListResponse> {
    const { data } = await api.patch<ApiResponse<PostListResponse>>(`/api/posts/${id}`, request);
    return data.data;
}

/**
 * POST /api/posts/{postId}/recipes — gắn danh sách công thức vào bài.
 * Thay thế toàn bộ tập cũ; gửi mảng rỗng để bỏ hết.
 */
export async function attachPostRecipes(id: string, recipeIds: string[]): Promise<PostListResponse> {
    const { data } = await api.post<ApiResponse<PostListResponse>>(`/api/posts/${id}/recipes`, { recipeIds });
    return data.data;
}

/**
 * GET /api/posts/{postId} — chi tiết bài đã published (yêu cầu JWT).
 * BE trả đúng shape của feed; chỉ `rawContent` cần parse sang JSON ProseMirror.
 */
export async function getPostDetail(id: string): Promise<PostListResponse> {
    const { data } = await api.get<ApiResponse<PostListResponse>>(`/api/posts/${id}`);
    const post = data.data;
    return { ...post, contentJson: post.contentJson ?? parseStoredContent(post.rawContent) };
}

export interface CommentListParams {
    /** 0-based, khớp Spring `page`. */
    page?: number;
    /** 1–100, mặc định 20. */
    size?: number;
}

/**
 * GET /api/posts/{postId}/comments — public, không cần JWT.
 * Phân trang ở comment gốc; mỗi comment mang theo **cả cây reply** (không phân trang).
 * Comment đã xoá mềm vẫn nằm trong cây: `deleted: true`, `content: "[deleted]"`,
 * `userId`/`username`/`avatarUrl` = null.
 */
export async function getPostComments(
    postId: string,
    { page = 0, size = 20 }: CommentListParams = {},
): Promise<PageResponse<PostCommentThread>> {
    const { data } = await api.get<ApiResponse<PageResponse<PostCommentThread>>>(`/api/posts/${postId}/comments`, {
        params: { page, size },
    });
    return data.data;
}

/** Hoạt động cộng đồng — ponytail: backend chưa có endpoint activity. */
export async function getMyActivity(seed: string): Promise<PostActivity[]> {
    await delay();
    return getMockActivity(seed);
}

export interface AdminPostListParams {
    page: number;
    size: number;
    /** `q` lọc client-side — BE chưa có tham số tìm kiếm. */
    q?: string;
    status?: PostStatus;
    /** Mặc định `all` — BE mặc định `NEEDS_REVIEW`, bỏ trống sẽ giấu hết bài đã duyệt. */
    flag?: PostFlag | "all";
    sort?: AdminPostSort;
    userId?: string;
    categoryId?: string;
    createdFrom?: string;
    createdTo?: string;
}

export type AdminPostSort = "createdAt" | "publishedAt" | "updatedAt" | "viewCount" | "title";

/**
 * GET /api/admin/posts — mọi status (khác `GET /api/posts`), có `flag`/`displayName`/`email`.
 * Sort mặc định mới nhất trước, khớp hành vi mock cũ.
 */
export const getPosts = async ({
    page,
    size,
    q,
    status,
    flag = "all",
    sort = "createdAt",
    userId,
    categoryId,
    createdFrom,
    createdTo,
}: AdminPostListParams): Promise<Paginated<AdminPost>> => {
    const params: Record<string, string | number> = {
        page: page - 1,
        size,
        sort: `${sort},desc`,
        flag,
    };
    if (status) params.status = status;
    if (userId) params.userId = userId;
    if (categoryId) params.categoryId = categoryId;
    if (createdFrom) params.createdFrom = createdFrom;
    if (createdTo) params.createdTo = createdTo;

    const { data } = await api.get<ApiResponse<PageResponse<AdminPost>>>("/api/admin/posts", { params });

    const keyword = q?.trim().toLowerCase() ?? "";
    // ponytail: BE chưa có tham số `q` — lọc trong trang hiện tại, phân trang vẫn theo server.
    const filtered = keyword
        ? data.data.content.filter(
              (post) =>
                  post.title.toLowerCase().includes(keyword) ||
                  (post.displayName ?? "").toLowerCase().includes(keyword) ||
                  post.email.toLowerCase().includes(keyword),
          )
        : data.data.content;

    return {
        data: filtered,
        total: Number(data.data.totalElements),
        page,
        size: data.data.size,
        totalPages: data.data.totalPages,
    };
};

/** Số đếm toàn tài khoản — không phụ thuộc bộ lọc/trang đang xem. */
export interface MyPostsCounts {
    all: number;
    published: number;
    draft: number;
    unpublished: number;
    video: number;
    views: number;
}

export type MyPostsPage = Paginated<PostListResponse> & { counts: MyPostsCounts };

export const getMyPosts = async ({
    page,
    size,
    q,
    status,
}: ListParams<PostStatus>): Promise<MyPostsPage> => {
    // GET /api/posts chỉ hỗ trợ page/size (trả mọi status, sort createdAt desc).
    // ponytail: lọc q/status ở client trên tối đa 100 bài; khi backend thêm filter thì bỏ.
    const { data } = await api.get<ApiResponse<PageResponse<PostListResponse>>>("/api/posts", {
        params: { page: 0, size: 100 },
    });

    const all = data.data.content.map(enrichListItem);

    // Đếm trên danh sách đầy đủ, TRƯỚC khi lọc — dải số đầu trang phải cố định,
    // không nhảy theo từ khoá/trang.
    const counts: MyPostsCounts = {
        all: all.length,
        published: all.filter((post) => post.status === "published").length,
        draft: all.filter((post) => post.status === "created").length,
        unpublished: all.filter((post) => post.status === "unpublished").length,
        video: all.filter((post) => post.type === "video").length,
        views: all.reduce((sum, post) => sum + post.viewCount, 0),
    };

    const keyword = q?.trim().toLowerCase() ?? "";
    const filtered = all.filter(
        (item) =>
            (!status || item.status === status) && (keyword === "" || item.title.toLowerCase().includes(keyword)),
    );

    const start = (page - 1) * size;

    return {
        data: filtered.slice(start, start + size),
        total: filtered.length,
        page,
        size,
        totalPages: Math.max(1, Math.ceil(filtered.length / size)),
        counts,
    };
};

/**
 * POST /api/admin/posts/{postId}/approve — duyệt bài (ADR-016 thay `/moderate`).
 * Publish bài + duyệt luôn các component còn PENDING mà bài tham chiếu (dish/ingredient/recipe).
 * 400 khi bài chưa có category hoặc đang `hidden`; 404 khi không có / xoá mềm.
 * `flag` (verdict kiểm duyệt tự động) KHÔNG đổi.
 */
export const approvePost = async (id: string, reason?: string): Promise<void> => {
    await api.post<ApiResponse<unknown>>(`/api/admin/posts/${id}/approve`, reason ? { reason } : {});
};

/**
 * POST /api/admin/posts/{postId}/reject — từ chối bài.
 * Unpublish + từ chối các component **còn PENDING**; component đã duyệt giữ nguyên.
 * 400 khi bài đang `hidden`; 404 khi không có / xoá mềm.
 */
export const rejectPost = async (id: string, reason?: string): Promise<void> => {
    await api.post<ApiResponse<unknown>>(`/api/admin/posts/${id}/reject`, reason ? { reason } : {});
};

/**
 * POST /api/posts/{postId}/comments — tạo bình luận hoặc reply (cần JWT).
 * Response là `CommentResponse` (không có `replies`, không có `username`) → sau khi
 * gửi phải invalidate `["post-comments", postId]` để lấy lại cây từ `GET`.
 */
export const createComment = async (postId: string, request: CreateCommentRequest): Promise<ApiComment> => {
    const { data } = await api.post<ApiResponse<ApiComment>>(`/api/posts/${postId}/comments`, request);
    return data.data;
};

/**
 * PATCH /api/posts/{postId}/comments/{commentId} — sửa nội dung (yêu cầu JWT, chỉ chủ comment).
 */
export const updateComment = async (
    postId: string,
    commentId: string,
    request: UpdateCommentRequest,
): Promise<ApiComment> => {
    const { data } = await api.patch<ApiResponse<ApiComment>>(
        `/api/posts/${postId}/comments/${commentId}`,
        request,
    );
    return data.data;
};

/**
 * DELETE /api/posts/{postId}/comments/{commentId} — xoá comment (chủ comment hoặc admin).
 * Backend soft-delete: chuyển thành "[deleted]" và giữ nguyên cấu trúc nhánh reply.
 */
export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/api/posts/${postId}/comments/${commentId}`);
};

/**
 * POST /api/posts/{postId}/comments/{commentId}/report — báo cáo vi phạm comment.
 */
export const reportComment = async (
    postId: string,
    commentId: string,
    request: ReportCommentRequest = {},
): Promise<void> => {
    await api.post<ApiResponse<unknown>>(`/api/posts/${postId}/comments/${commentId}/report`, request);
};

// PATCH /api/posts/{postId} { publish: false } — về draft, xoá publishedAt
export const unpublishPost = async (id: string): Promise<void> => {
    await api.patch<ApiResponse<PostListResponse>>(`/api/posts/${id}`, { publish: false });
};

// DELETE /api/posts/{postId} — soft delete
export const deletePost = async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/api/posts/${id}`);
};

export interface GetFeedParams {
    page?: number;
    size?: number;
}

/** `GET /api/posts/{id}/related` — `[{post, similarityScore}]`, xếp giảm dần. */
export interface RelatedPost {
    post: PostListResponse;
    similarityScore: number;
}

/**
 * GET /api/posts/{postId}/related?limit= — bài liên quan do backend chấm điểm.
 * `limit` mặc định 10 phía BE; xin ít hơn thì server cắt.
 */
export async function getRelatedPosts(id: string, limit = 3): Promise<RelatedPost[]> {
    const { data } = await api.get<ApiResponse<RelatedPost[]>>(`/api/posts/${id}/related`, { params: { limit } });
    return data.data;
}

/**
 * `GET /api/posts/{id}/votes` — đọc được khi chưa đăng nhập (curl anon 2026-11-02 → 200).
 * Chỉ `PUT` mới cần JWT.
 */
export interface PostVotes {
    postId: string;
    likeCount: number;
    dislikeCount: number;
    /** `null` = chưa đăng nhập hoặc chưa vote. */
    userVote: "UPVOTE" | "DOWNVOTE" | null;
}

export async function getPostVotes(id: string): Promise<PostVotes> {
    const { data } = await api.get<ApiResponse<PostVotes>>(`/api/posts/${id}/votes`);
    return data.data;
}

/** PUT /api/posts/{id}/votes — gửi lại cùng `voteType` để bỏ vote (BE xử lý toggle). */
export async function setPostVote(id: string, voteType: "UPVOTE" | "DOWNVOTE"): Promise<PostVotes> {
    const { data } = await api.put<ApiResponse<PostVotes>>(`/api/posts/${id}/votes`, { voteType });
    return data.data;
}

/**
 * GET /api/posts/feed — public published posts, no JWT required.
 * Bọc qua `enrichListItem` để card có tác giả / thời lượng / rating như mockup.
 */
export async function getFeedPosts({ page = 0, size = 20 }: GetFeedParams = {}): Promise<PageResponse<PostListResponse>> {
    const { data } = await api.get<ApiResponse<PageResponse<PostListResponse>>>("/api/posts/feed", {
        params: { page, size },
    });
    return { ...data.data, content: data.data.content.map(enrichListItem) };
}
