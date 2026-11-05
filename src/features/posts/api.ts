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

function normalizeComment(item: any, parentId?: string | null, parentAuthor?: string | null): PostCommentThread {
    const displayName = item?.displayName ?? item?.username ?? null;
    const pid = item?.parentId ?? parentId ?? null;
    return {
        id: item?.id ?? "",
        userId: item?.userId ?? null,
        parentId: pid,
        replyToUsername: item?.replyToUsername ?? parentAuthor ?? null,
        username: displayName,
        displayName,
        avatarUrl: item?.avatarUrl ?? null,
        content: item?.content ?? "",
        edited: Boolean(item?.edited),
        deleted: Boolean(item?.deleted),
        createdAt: item?.createdAt ?? "",
        updatedAt: item?.updatedAt ?? "",
        replies: Array.isArray(item?.replies)
            ? item.replies.map((r: any) => normalizeComment(r, item?.id, displayName))
            : [],
    };
}

const LOCAL_COMMENTS_PREFIX = "vegalife_local_comments_";

export function insertCommentIntoTree(
    threads: PostCommentThread[],
    newComment: PostCommentThread,
    parentId?: string | null,
): PostCommentThread[] {
    const pid = parentId || newComment.parentId;
    if (!pid) {
        if (threads.some((c) => c.id === newComment.id)) return threads;
        return [newComment, ...threads];
    }
    let inserted = false;
    const updated = threads.map((c) => {
        if (c.id === pid) {
            inserted = true;
            if (c.replies?.some((r) => r.id === newComment.id)) return c;
            return { ...c, replies: [...(c.replies ?? []), newComment] };
        }
        if (c.replies && c.replies.length > 0) {
            const nested = insertCommentIntoTree(c.replies, newComment, pid);
            if (nested !== c.replies) inserted = true;
            return { ...c, replies: nested };
        }
        return c;
    });

    if (!inserted) {
        if (threads.some((c) => c.id === newComment.id)) return threads;
        return [...threads, newComment];
    }
    return updated;
}

export function organizeCommentTree(threads: PostCommentThread[]): PostCommentThread[] {
    const allItems: PostCommentThread[] = [];
    function collect(list: PostCommentThread[]) {
        for (const item of list) {
            allItems.push({ ...item, replies: [] });
            if (item.replies && item.replies.length > 0) {
                collect(item.replies);
            }
        }
    }
    collect(threads);

    const map = new Map<string, PostCommentThread>();
    const roots: PostCommentThread[] = [];
    for (const item of allItems) {
        map.set(item.id, item);
    }

    for (const item of allItems) {
        if (item.parentId && map.has(item.parentId)) {
            const parent = map.get(item.parentId)!;
            if (!parent.replies.some((r) => r.id === item.id)) {
                parent.replies.push(item);
            }
        } else {
            roots.push(item);
        }
    }
    return roots;
}

/**
 * Đếm tổng số bình luận **chưa bị xoá** bao gồm cả bình luận gốc và các câu trả lời.
 * Comment đã `deleted: true` không được tính vào tổng.
 */
export function countAllComments(threads: PostCommentThread[]): number {
    let count = 0;
    for (const item of threads) {
        if (!item.deleted) count += 1;
        if (item.replies && item.replies.length > 0) {
            count += countAllComments(item.replies);
        }
    }
    return count;
}

/**
 * Xoá comment khỏi localStorage khi người dùng xoá thành công trên backend.
 * Nếu comment có replies, đánh dấu `deleted: true` thay vì xoá hẳn (giữ cấu trúc cây cho replies).
 * Nếu comment không có replies, xoá hẳn khỏi cây.
 */
export function removeLocalComment(postId: string, commentId: string): void {
    try {
        if (typeof window === "undefined" || !window.localStorage) return;
        const existing = getLocalComments(postId);
        if (existing.length === 0) return;

        function processTree(list: PostCommentThread[]): PostCommentThread[] {
            return list
                .map((c) => {
                    const nextReplies = c.replies && c.replies.length > 0 ? processTree(c.replies) : [];
                    if (c.id === commentId) {
                        // Có replies → đánh dấu deleted, giữ cấu trúc cây cho replies
                        if (nextReplies.length > 0) {
                            return {
                                ...c,
                                deleted: true,
                                content: "[deleted]",
                                userId: null,
                                username: null,
                                displayName: null,
                                avatarUrl: null,
                                replies: nextReplies,
                            };
                        }
                        // Không có replies → xoá hẳn
                        return null;
                    }
                    if (c.deleted && nextReplies.length === 0) {
                        return null;
                    }
                    return {
                        ...c,
                        replies: nextReplies,
                    };
                })
                .filter((c): c is PostCommentThread => c !== null);
        }

        const updated = processTree(existing);
        if (updated.length === 0) {
            localStorage.removeItem(`${LOCAL_COMMENTS_PREFIX}${postId}`);
        } else {
            localStorage.setItem(`${LOCAL_COMMENTS_PREFIX}${postId}`, JSON.stringify(updated));
        }
    } catch {
        // ignore storage errors
    }
}

export function getLocalComments(postId: string): PostCommentThread[] {
    try {
        if (typeof window === "undefined" || !window.localStorage) return [];
        const raw = localStorage.getItem(`${LOCAL_COMMENTS_PREFIX}${postId}`);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? organizeCommentTree(parsed) : [];
    } catch {
        return [];
    }
}

export function saveLocalComment(
    postId: string,
    comment: PostCommentThread,
    parentId?: string | null,
    replyToUsername?: string | null,
): void {
    try {
        if (typeof window === "undefined" || !window.localStorage) return;
        const target: PostCommentThread = {
            ...comment,
            parentId: parentId || comment.parentId || null,
            replyToUsername: replyToUsername || comment.replyToUsername || null,
        };
        const existing = getLocalComments(postId);
        function remove(list: PostCommentThread[]): PostCommentThread[] {
            return list
                .filter((c) => c.id !== target.id)
                .map((c) => ({
                    ...c,
                    replies: c.replies ? remove(c.replies) : [],
                }));
        }
        const cleaned = remove(existing);
        const updated = insertCommentIntoTree(cleaned, target, target.parentId);
        localStorage.setItem(`${LOCAL_COMMENTS_PREFIX}${postId}`, JSON.stringify(updated));
    } catch {
        // ignore storage errors
    }
}

/**
 * Cập nhật nội dung comment trong localStorage để đảm bảo reload trang không bị hoàn tác.
 */
export function updateLocalComment(
    postId: string,
    commentId: string,
    newContent: string,
): void {
    try {
        if (typeof window === "undefined" || !window.localStorage) return;
        const existing = getLocalComments(postId);
        if (existing.length === 0) return;

        function updateTree(list: PostCommentThread[]): PostCommentThread[] {
            return list.map((c) => {
                const nextReplies = c.replies && c.replies.length > 0 ? updateTree(c.replies) : [];
                if (c.id === commentId) {
                    return {
                        ...c,
                        content: newContent,
                        edited: true,
                        updatedAt: new Date().toISOString(),
                        replies: nextReplies,
                    };
                }
                return {
                    ...c,
                    replies: nextReplies,
                };
            });
        }

        const updated = updateTree(existing);
        localStorage.setItem(`${LOCAL_COMMENTS_PREFIX}${postId}`, JSON.stringify(updated));
    } catch {
        // ignore storage errors
    }
}

function mergeComments(server: PostCommentThread[], local: PostCommentThread[]): PostCommentThread[] {
    if (!local || local.length === 0) return server;

    // Thu thập tất cả comment có trong local để tra cứu nhanh khi server chưa cập nhật
    const localMap = new Map<string, PostCommentThread>();
    function mapLocal(list: PostCommentThread[]) {
        for (const item of list) {
            localMap.set(item.id, item);
            if (item.replies && item.replies.length > 0) {
                mapLocal(item.replies);
            }
        }
    }
    mapLocal(local);

    // Thu thập tất cả ID có trên server (kể cả đã xoá mềm) và đồng bộ nội dung nếu local đã sửa
    const serverIds = new Set<string>();
    function patchServerTree(list: PostCommentThread[]): PostCommentThread[] {
        return list.map((item) => {
            serverIds.add(item.id);
            const nextReplies = item.replies && item.replies.length > 0 ? patchServerTree(item.replies) : [];
            const localVer = localMap.get(item.id);
            if (localVer && localVer.edited && localVer.content !== item.content) {
                return {
                    ...item,
                    content: localVer.content,
                    edited: true,
                    replies: nextReplies,
                };
            }
            return {
                ...item,
                replies: nextReplies,
            };
        });
    }
    const patchedServer = patchServerTree(server);

    // Chỉ merge local comments mà server CHƯA biết (chưa có id trên server)
    let merged = [...patchedServer];
    function collectAll(list: PostCommentThread[]): PostCommentThread[] {
        const result: PostCommentThread[] = [];
        for (const item of list) {
            if (!serverIds.has(item.id)) {
                result.push(item);
            }
            if (item.replies && item.replies.length > 0) {
                result.push(...collectAll(item.replies));
            }
        }
        return result;
    }
    const extraLocal = collectAll(local);
    for (const loc of extraLocal) {
        merged = insertCommentIntoTree(merged, loc, loc.parentId);
    }
    return organizeCommentTree(merged);
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
    try {
        const { data } = await api.get<ApiResponse<PageResponse<PostCommentThread>>>(`/api/posts/${postId}/comments`, {
            params: { page, size },
        });
        const pageData = data.data;
        const normalized = (pageData?.content ?? []).map((item) => normalizeComment(item));
        const local = getLocalComments(postId);
        const merged = mergeComments(normalized, local);

        const allActiveCount = countAllComments(merged);
        const isSinglePage = (pageData?.totalPages ?? 1) <= 1;
        const totalElements = isSinglePage
            ? allActiveCount
            : Math.max(Number(pageData?.totalElements ?? 0), allActiveCount);

        return {
            ...pageData,
            content: merged,
            totalElements,
        };
    } catch {
        // Fallback an toàn nếu backend bị sự cố 500 hoặc mất mạng:
        // Trả về danh sách local (hoặc mảng rỗng nếu chưa có/đã xoá hết) thay vì làm sập UI
        const local = getLocalComments(postId);
        return {
            content: local,
            page,
            size,
            totalElements: countAllComments(local),
            totalPages: 1,
            first: true,
            last: true,
        };
    }
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
    const payload: { content: string; parentId?: string } = { content: request.content.trim() };
    if (request.parentId && request.parentId.trim()) {
        payload.parentId = request.parentId.trim();
    }
    const { data } = await api.post<ApiResponse<ApiComment>>(`/api/posts/${postId}/comments`, payload);
    return data.data;
};

/**
 * PATCH /api/posts/{postId}/comments/{commentId} — sửa nội dung (yêu cầu JWT, chỉ chủ comment).
 * Đồng bộ localStorage để sau khi F5 nội dung đã sửa vẫn được bảo toàn.
 * Xử lý resilient: nếu backend trả 404 (comment chỉ có ở local) hoặc server gặp lỗi 500,
 * vẫn cập nhật localStorage và trả về comment đã sửa để không chặn người dùng.
 */
export const updateComment = async (
    postId: string,
    commentId: string,
    request: UpdateCommentRequest,
): Promise<ApiComment> => {
    try {
        const { data } = await api.patch<ApiResponse<ApiComment>>(
            `/api/posts/${postId}/comments/${commentId}`,
            request,
        );
        updateLocalComment(postId, commentId, request.content);
        return data.data;
    } catch (error: any) {
        if (error?.response?.status === 404 || error?.response?.status >= 500 || !error?.response) {
            updateLocalComment(postId, commentId, request.content);
            return {
                id: commentId,
                postId,
                parentId: null,
                userId: "",
                content: request.content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        }
        throw error;
    }
};

/**
 * DELETE /api/posts/{postId}/comments/{commentId} — xoá comment (chủ comment hoặc admin).
 * Backend soft-delete: chuyển thành "[deleted]" và giữ nguyên cấu trúc nhánh reply.
 * Hàm xử lý idempotent: nếu comment đã bị xoá trên server (404) hoặc server gặp lỗi 500,
 * vẫn hoàn tất xoá ở phía client và localStorage để không làm kẹt dữ liệu người dùng.
 */
export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
    try {
        await api.delete<ApiResponse<null>>(`/api/posts/${postId}/comments/${commentId}`);
    } catch (error: any) {
        // Idempotent: nếu server trả 404 (Comment not found), comment đã không còn trên server
        if (error?.response?.status === 404) {
            return;
        }
        // Nếu server gặp lỗi 500 hoặc mất mạng, vẫn cho phép hoàn tất xoá ở local cache
        if (error?.response?.status >= 500 || !error?.response) {
            return;
        }
        throw error;
    }
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
