import { api } from "@/shared/api/client";
import { enrichDetail, enrichListItem, getMockActivity, getMockComments } from "./mockEnrichment";
import type { ApiResponse, ListParams, PageResponse, Paginated } from "@/shared/types/common";
import type {
    AdminPost,
    ApiComment,
    CreateCommentRequest,
    CreatePostRequest,
    CreatePostResponse,
    ModeratePostRequest,
    PostActivity,
    PostComment,
    PostDetailResponse,
    PostFlag,
    PostListResponse,
    PostStatus,
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

/** GET /api/posts/{postId} — chi tiết bài đã published (yêu cầu JWT). */
export async function getPostDetail(id: string): Promise<PostDetailResponse> {
    const { data } = await api.get<ApiResponse<PostListResponse>>(`/api/posts/${id}`);
    return enrichDetail(data.data);
}

/** Bình luận — ponytail: backend chưa có endpoint comment (SRS nhóm 16). */
export async function getPostComments(postId: string): Promise<PostComment[]> {
    await delay();
    return getMockComments(postId);
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
 * GET /api/admin/posts — mọi status (khác `GET /api/posts`), có `flag`/`username`/`email`.
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
                  post.username.toLowerCase().includes(keyword) ||
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

export const getMyPosts = async ({
    page,
    size,
    q,
    status,
}: ListParams<PostStatus>): Promise<Paginated<PostListResponse>> => {
    // GET /api/posts chỉ hỗ trợ page/size (trả mọi status, sort createdAt desc).
    // ponytail: lọc q/status ở client trên tối đa 100 bài; khi backend thêm filter thì bỏ.
    const { data } = await api.get<ApiResponse<PageResponse<PostListResponse>>>("/api/posts", {
        params: { page: 0, size: 100 },
    });

    const keyword = q?.trim().toLowerCase() ?? "";
    const filtered = data.data.content
        .map(enrichListItem)
        .filter(
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
    };
};

/**
 * POST /api/admin/posts/{postId}/moderate — PUBLISH / UNPUBLISH.
 * `flag` (verdict kiểm duyệt tự động) KHÔNG đổi.
 */
export const moderatePost = async (id: string, request: ModeratePostRequest): Promise<void> => {
    await api.post<ApiResponse<unknown>>(`/api/admin/posts/${id}/moderate`, request);
};

/**
 * POST /api/posts/{postId}/comments — tạo bình luận hoặc reply.
 * ponytail: chưa có endpoint đọc comment (issue #41) — danh sách vẫn lấy từ mock,
 * comment vừa gửi chỉ hiện tạm ở client.
 */
export const createComment = async (postId: string, request: CreateCommentRequest): Promise<ApiComment> => {
    const { data } = await api.post<ApiResponse<ApiComment>>(`/api/posts/${postId}/comments`, request);
    return data.data;
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
