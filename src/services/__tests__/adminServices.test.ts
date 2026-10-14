// @vitest-environment node
/** Test adminUserService + videoService + dashboardService — gọi BACKEND THẬT. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getUsers, restoreUser, suspendUser } from "@/services/adminUserService";
import { deleteVideo, getVideos } from "@/services/videoService";
import { getDashboardStats } from "@/services/dashboardService";
import { E2E_ADMIN, E2E_ALLOW_WRITES, HAS_ADMIN, REMOTE_TIMEOUT_MS, httpStatus, signInAs, signOut } from "@/test/e2eEnv";

const MISSING_UUID = "00000000-0000-0000-0000-000000000000";

describe("adminUserService — chặn khi chưa đăng nhập", () => {
    it(
        "getUsers không có token bị từ chối 401/403",
        async () => {
            const error = await getUsers({ page: 1, size: 10 }).catch((e) => e);

            expect([401, 403]).toContain(httpStatus(error));
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "suspendUser không có token bị từ chối 401/403",
        async () => {
            const error = await suspendUser(MISSING_UUID).catch((e) => e);

            expect([401, 403]).toContain(httpStatus(error));
        },
        REMOTE_TIMEOUT_MS,
    );
});

describe.skipIf(!HAS_ADMIN)("adminUserService — cần JWT admin (E2E_ADMIN_*)", () => {
    beforeAll(async () => {
        await signInAs(E2E_ADMIN);
    });
    afterAll(signOut);

    it(
        "getUsers trả Paginated với page 1-based và sort createdAt,desc",
        async () => {
            // LƯU Ý: khác các service khác, `getUsers` nhận page 0-based
            // (UsersPage truyền `page - 1`) và trả về page 1-based.
            const page = await getUsers({ page: 0, size: 10 });

            expect(page.page).toBe(1);
            expect(page.size).toBe(10);
            expect(page.data.length).toBeLessThanOrEqual(10);
            expect(page.totalPages).toBeGreaterThanOrEqual(1);

            const times = page.data.map((user) => new Date(user.createdAt).getTime());
            expect(times).toEqual([...times].sort((a, b) => b - a));
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "mọi user trả về có id/email/username/role/status hợp lệ",
        async () => {
            const page = await getUsers({ page: 0, size: 10 });

            for (const user of page.data) {
                expect(user.id).toBeTruthy();
                expect(user.email).toContain("@");
                expect(["ADMIN", "USER"]).toContain(user.role);
                expect(["created", "activated", "deactivated", "suspended"]).toContain(user.status);
            }
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getUsers lọc status ở server — mọi dòng khớp status yêu cầu",
        async () => {
            const page = await getUsers({ page: 0, size: 20, status: "activated" });

            for (const user of page.data) expect(user.status).toBe("activated");
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getUsers lọc role ở server — mọi dòng khớp role yêu cầu",
        async () => {
            const page = await getUsers({ page: 0, size: 20, role: "ADMIN" });

            for (const user of page.data) expect(user.role).toBe("ADMIN");
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "suspendUser trên UUID không tồn tại trả 4xx chứ không 5xx",
        async () => {
            const error = await suspendUser(MISSING_UUID).catch((e) => e);

            expect(httpStatus(error)).toBeGreaterThanOrEqual(400);
            expect(httpStatus(error)).toBeLessThan(500);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "restoreUser trên UUID không tồn tại trả 4xx chứ không 5xx",
        async () => {
            const error = await restoreUser(MISSING_UUID).catch((e) => e);

            expect(httpStatus(error)).toBeGreaterThanOrEqual(400);
            expect(httpStatus(error)).toBeLessThan(500);
        },
        REMOTE_TIMEOUT_MS,
    );
});

describe("videoService — chặn khi chưa đăng nhập", () => {
    it(
        "getVideos không có token bị từ chối 401/403",
        async () => {
            const error = await getVideos({ page: 1, size: 8 }).catch((e) => e);

            expect([401, 403]).toContain(httpStatus(error));
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "deleteVideo không có token bị từ chối 401/403",
        async () => {
            const error = await deleteVideo(MISSING_UUID).catch((e) => e);

            expect([401, 403]).toContain(httpStatus(error));
        },
        REMOTE_TIMEOUT_MS,
    );
});

describe.skipIf(!HAS_ADMIN)("videoService — cần JWT admin (E2E_ADMIN_*)", () => {
    beforeAll(async () => {
        await signInAs(E2E_ADMIN);
    });
    afterAll(signOut);

    it(
        "getVideos trả Paginated và mọi dòng đã map sang kiểu Video",
        async () => {
            const page = await getVideos({ page: 1, size: 8 });

            expect(page.page).toBe(1);
            expect(page.size).toBe(8);
            expect(page.totalPages).toBeGreaterThanOrEqual(1);

            for (const video of page.data) {
                expect(video.id).toBeTruthy();
                expect(typeof video.title).toBe("string");
                expect(video.uploader).toBeDefined();
                expect(typeof video.uploader.username).toBe("string");
            }
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getVideos lọc q ở client — từ khoá không khớp trả rỗng",
        async () => {
            const page = await getVideos({ page: 1, size: 8, q: "zzz-khong-video-nao-khop-zzz" });

            expect(page.data).toHaveLength(0);
            expect(page.total).toBe(0);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getVideos phân trang ở client trên tối đa 100 row",
        async () => {
            const [first, second] = await Promise.all([
                getVideos({ page: 1, size: 8 }),
                getVideos({ page: 2, size: 8 }),
            ]);

            // Trang 2 rỗng nếu tổng < 8 — không được lỗi.
            expect(first.page).toBe(1);
            expect(second.page).toBe(2);
            expect(first.data.length).toBeLessThanOrEqual(8);
            expect(second.data.length).toBeLessThanOrEqual(8);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "deleteVideo trên UUID không tồn tại không làm sập backend (4xx hoặc idempotent 2xx)",
        async () => {
            const error = await deleteVideo(MISSING_UUID).catch((e) => e);

            expect(httpStatus(error) ?? 200).toBeLessThan(500);
        },
        REMOTE_TIMEOUT_MS,
    );
});

describe("dashboardService — dữ liệu mock cục bộ (chưa có endpoint)", () => {
    it("getDashboardStats trả đủ 4 metric và active + softDeleted = total", async () => {
        const stats = await getDashboardStats();

        expect(stats.totalCategories).toBeGreaterThanOrEqual(0);
        expect(stats.activeCategories + stats.softDeletedCategories).toBe(stats.totalCategories);
        expect(stats.associatedContent).toBeGreaterThanOrEqual(0);
    });
});

describe.skipIf(!HAS_ADMIN || !E2E_ALLOW_WRITES)("adminUserService/videoService — ghi dữ liệu thật", () => {
    it.todo("suspendUser → restoreUser trên một tài khoản test do chính test tạo");
    it.todo("deleteVideo trên video do chính test upload");
});
