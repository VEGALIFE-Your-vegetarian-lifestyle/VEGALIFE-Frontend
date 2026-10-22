// @vitest-environment node
/**
 * Test categoryService — gọi BACKEND THẬT.
 * `getPublicCategories` / `getCategories` / `exportCategoriesCsv` đều đi qua
 * GET /api/categories (public) nên chạy được không cần tài khoản.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
    createCategory,
    exportCategoriesCsv,
    getCategories,
    getPublicCategories,
    retireCategory,
    updateCategory,
} from "../api";
import { E2E_ADMIN, E2E_ALLOW_WRITES, HAS_ADMIN, REMOTE_TIMEOUT_MS, httpStatus, signInAs, signOut } from "@/test/e2eEnv";

const MISSING_UUID = "00000000-0000-0000-0000-000000000000";

describe("categoryService — public", () => {
    it(
        "getPublicCategories trả PageResponse với content là mảng",
        async () => {
            const page = await getPublicCategories({ page: 0, size: 10 });

            expect(Array.isArray(page.content)).toBe(true);
            expect(page.page).toBe(0);
            expect(page.size).toBe(10);
            expect(typeof page.totalElements).toBe("number");
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "mọi category public đều có id + name + createdAt",
        async () => {
            const page = await getPublicCategories({ page: 0, size: 20 });

            for (const category of page.content) {
                expect(category.id).toBeTruthy();
                expect(category.name).toBeTruthy();
                expect(Number.isNaN(Date.parse(category.createdAt))).toBe(false);
            }
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getPublicCategories lọc theo name — mọi kết quả chứa từ khoá",
        async () => {
            const all = await getPublicCategories({ page: 0, size: 100 });
            if (all.content.length === 0) return;

            const keyword = all.content[0].name.slice(0, 4);
            const filtered = await getPublicCategories({ page: 0, size: 20, name: keyword });

            for (const category of filtered.content) {
                expect(category.name.toLowerCase()).toContain(keyword.toLowerCase());
            }
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getCategories trả Paginated với page 1-based và deletedAt luôn null",
        async () => {
            const page = await getCategories({ page: 1, size: 8 });

            expect(page.page).toBe(1);
            expect(page.size).toBe(8);
            expect(page.totalPages).toBeGreaterThanOrEqual(1);
            // ponytail: backend chưa có GET /api/admin/categories nên luôn null.
            for (const category of page.data) expect(category.deletedAt).toBeNull();
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getCategories sort=name sắp xếp tăng dần theo tên",
        async () => {
            const page = await getCategories({ page: 1, size: 20, sort: "name" });
            const names = page.data.map((category) => category.name);

            expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "getCategories sort=newest sắp xếp giảm dần theo createdAt",
        async () => {
            const page = await getCategories({ page: 1, size: 20, sort: "newest" });
            const times = page.data.map((category) => new Date(category.createdAt).getTime());

            expect(times).toEqual([...times].sort((a, b) => b - a));
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "exportCategoriesCsv trả CSV có header và số dòng khớp số category",
        async () => {
            const [csv, page] = await Promise.all([
                exportCategoriesCsv(),
                getPublicCategories({ page: 0, size: 100 }),
            ]);

            const lines = csv.split("\n");
            // Header không escape — chỉ các dòng dữ liệu mới bọc nháy.
            expect(lines[0]).toBe("ID,Name,Description,Created At");
            expect(lines).toHaveLength(page.content.length + 1);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "exportCategoriesCsv escape dấu nháy kép để CSV không vỡ cột",
        async () => {
            const csv = await exportCategoriesCsv();
            const dataLines = csv.split("\n").slice(1);

            for (const line of dataLines) {
                // 4 field đều được bọc nháy → số dấu " luôn chẵn (kể cả nháy escape).
                const quotes = (line.match(/"/g) ?? []).length;
                expect(quotes % 2).toBe(0);
            }
        },
        REMOTE_TIMEOUT_MS,
    );
});

describe("categoryService — chặn khi chưa đăng nhập", () => {
    it(
        "retireCategory không có token bị từ chối 401/403",
        async () => {
            const error = await retireCategory(MISSING_UUID).catch((e) => e);

            expect([401, 403]).toContain(httpStatus(error));
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "createCategory không có token bị từ chối 401/403",
        async () => {
            const error = await createCategory({ name: "vitest-should-not-exist" }).catch((e) => e);

            expect([401, 403]).toContain(httpStatus(error));
        },
        REMOTE_TIMEOUT_MS,
    );
});

describe.skipIf(!HAS_ADMIN)("categoryService — cần JWT admin (E2E_ADMIN_*)", () => {
    beforeAll(async () => {
        await signInAs(E2E_ADMIN);
    });
    afterAll(signOut);

    it(
        "updateCategory trên UUID không tồn tại trả 4xx",
        async () => {
            const error = await updateCategory(MISSING_UUID, { name: "vitest" }).catch((e) => e);

            expect(httpStatus(error)).toBeGreaterThanOrEqual(400);
            expect(httpStatus(error)).toBeLessThan(500);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "retireCategory trên UUID không tồn tại trả 4xx",
        async () => {
            const error = await retireCategory(MISSING_UUID).catch((e) => e);

            expect(httpStatus(error)).toBeGreaterThanOrEqual(400);
            expect(httpStatus(error)).toBeLessThan(500);
        },
        REMOTE_TIMEOUT_MS,
    );
});

// Tạo/retire category thật — chỉ chạy khi bật E2E_ALLOW_WRITES=1.
describe.skipIf(!HAS_ADMIN || !E2E_ALLOW_WRITES)("categoryService — ghi dữ liệu thật (E2E_ALLOW_WRITES=1)", () => {
    it.todo("createCategory → updateCategory → retireCategory, rồi xác nhận đã rời danh sách public");
});
