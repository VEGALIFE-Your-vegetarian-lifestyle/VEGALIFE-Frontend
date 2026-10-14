// @vitest-environment node
/**
 * Test postService — gọi BACKEND THẬT.
 * Endpoint public (/api/posts/feed) chạy được ngay; phần cần JWT tự bỏ qua
 * khi thiếu `E2E_USER_*` / `E2E_ADMIN_*`.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getFeedPosts, getPostDetail, getPosts, getMyPosts, moderatePost } from "@/services/postService";
import {
    E2E_ADMIN,
    E2E_USER,
    E2E_ALLOW_WRITES,
    HAS_ADMIN,
    HAS_USER,
    REMOTE_TIMEOUT_MS,
    httpStatus,
    signInAs,
    signOut,
} from "@/test/e2eEnv";

const MISSING_UUID = "00000000-0000-0000-0000-000000000000";

describe("postService — public", () => {
    it(
        "getFeedPosts trả về trang có shape PageResponse hợp lệ",
        async () => {
            const page = await getFeedPosts({ page: 0, size: 5 });

            expect(Array.isArray(page.content)).toBe(true);
            expect(page.page).toBe(0);
            expect(page.size).toBe(5);
            expect(typeof page.totalElements).toBe("number");
            expect(page.totalPages).toBeGreaterThanOrEqual(0);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "mọi bài trong feed đều ở status published và đã có id",
        async () => {
            const page = await getFeedPosts({ page: 0, size: 10 });

            for (const post of page.content) {
                expect(post.id).toBeTruthy();
                expect(post.status).toBe("published");
            }
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "enrichListItem đã bơm field mock cho card (tác giả / nhãn thời lượng)",
        async () => {
            const page = await getFeedPosts({ page: 0, size: 5 });
            if (page.content.length === 0) return; // backend rỗng — không có gì để khẳng định

            const [first] = page.content;
            expect(first.authorCard).toBeDefined();
            expect(typeof first.authorCard?.username).toBe("string");
            expect(typeof first.durationLabel).toBe("string");
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getPostDetail với UUID không tồn tại trả lỗi 4xx",
        async () => {
            const error = await getPostDetail(MISSING_UUID).catch((e) => e);

            expect(httpStatus(error)).toBeGreaterThanOrEqual(400);
            expect(httpStatus(error)).toBeLessThan(500);
        },
        REMOTE_TIMEOUT_MS,
    );
});

describe.skipIf(!HAS_USER)("postService — cần JWT user (E2E_USER_*)", () => {
    beforeAll(async () => {
        await signInAs(E2E_USER);
    });
    afterAll(signOut);

    it(
        "getMyPosts trả về trang đã map sang Paginated (page 1-based)",
        async () => {
            const page = await getMyPosts({ page: 1, size: 5 });

            expect(Array.isArray(page.data)).toBe(true);
            expect(page.page).toBe(1);
            expect(page.size).toBe(5);
            expect(page.totalPages).toBeGreaterThanOrEqual(1);
            expect(page.data.length).toBeLessThanOrEqual(5);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getMyPosts lọc theo status ở client — mọi dòng trả về khớp status yêu cầu",
        async () => {
            const page = await getMyPosts({ page: 1, size: 20, status: "published" });

            for (const post of page.data) expect(post.status).toBe("published");
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getMyPosts lọc theo từ khoá ở client — tiêu đề đều chứa từ khoá",
        async () => {
            const keyword = "zzz-khong-bai-nao-khop-zzz";
            const page = await getMyPosts({ page: 1, size: 20, q: keyword });

            expect(page.data).toHaveLength(0);
            expect(page.total).toBe(0);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getPostDetail trên bài của chính mình trả về object có id khớp",
        async () => {
            const mine = await getMyPosts({ page: 1, size: 1 });
            if (mine.data.length === 0) return;

            const detail = await getPostDetail(mine.data[0].id);
            expect(detail.id).toBe(mine.data[0].id);
        },
        REMOTE_TIMEOUT_MS,
    );
});

describe.skipIf(!HAS_ADMIN)("postService — cần JWT admin (E2E_ADMIN_*)", () => {
    beforeAll(async () => {
        await signInAs(E2E_ADMIN);
    });
    afterAll(signOut);

    it(
        "getPosts trả về Paginated với page 1-based và size đúng yêu cầu",
        async () => {
            const page = await getPosts({ page: 1, size: 5 });

            expect(Array.isArray(page.data)).toBe(true);
            expect(page.page).toBe(1);
            expect(page.size).toBe(5);
            expect(page.totalPages).toBeGreaterThanOrEqual(1);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getPosts mặc định flag=all — khớp đúng khi truyền flag tường minh",
        async () => {
            const byDefault = await getPosts({ page: 1, size: 20 });
            const explicit = await getPosts({ page: 1, size: 20, flag: "all" });

            // BE mặc định NEEDS_REVIEW, nên nếu service quên flag thì total sẽ
            // nhỏ hơn hẳn tập flag=all.
            expect(byDefault.total).toBe(explicit.total);
            expect(byDefault.data.map((post) => post.id)).toEqual(explicit.data.map((post) => post.id));
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getPosts lọc status ở server — mọi dòng khớp status yêu cầu",
        async () => {
            const page = await getPosts({ page: 1, size: 10, status: "published" });

            for (const post of page.data) expect(post.status).toBe("published");
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getPosts lọc q ở client — từ khoá không khớp trả rỗng nhưng không lỗi",
        async () => {
            const page = await getPosts({ page: 1, size: 10, q: "zzz-khong-bai-nao-khop-zzz" });

            expect(page.data).toHaveLength(0);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "moderatePost trên UUID không tồn tại trả 4xx chứ không 5xx",
        async () => {
            const error = await moderatePost(MISSING_UUID, { action: "PUBLISH" }).catch((e) => e);

            expect(httpStatus(error)).toBeGreaterThanOrEqual(400);
            expect(httpStatus(error)).toBeLessThan(500);
        },
        REMOTE_TIMEOUT_MS,
    );
});

// Ghi dữ liệu lên backend thật — chỉ chạy khi bật E2E_ALLOW_WRITES=1.
describe.skipIf(!HAS_ADMIN || !E2E_ALLOW_WRITES)("postService — ghi dữ liệu thật (E2E_ALLOW_WRITES=1)", () => {
    it.todo("createPost → moderate PUBLISH → deletePost rồi kiểm tra đã biến mất khỏi danh sách");
});
