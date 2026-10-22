// @vitest-environment node
/**
 * Test locationService — mock axios `api`, kiểm tra đúng endpoint, tham số và cách đổi dữ liệu.
 * Backend yêu cầu JWT cho cả API đọc nên không gọi backend thật ở đây.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import {
    createLocation,
    deleteLocation,
    getLocationById,
    getLocations,
    getNearbyLocations,
    updateLocation,
} from "../api";

vi.mock("@/shared/api/client", () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

const RAW = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Quán Chay Lá Xanh",
    address: "12 Nguyễn Huệ, Quận 1",
    latitude: 10.7742,
    longitude: 106.7039,
    placeType: "restaurant",
    phoneNumber: null,
    openingHours: null,
    websiteUrl: null,
    rating: 4.7,
    priceLevel: null,
};

const ok = <T,>(data: T) => ({ data: { success: true, message: "ok", data } });
const page = (content: unknown[], overrides = {}) =>
    ok({ content, page: 0, size: 20, totalElements: content.length, totalPages: 1, first: true, last: true, ...overrides });

beforeEach(() => vi.resetAllMocks());

describe("getNearbyLocations", () => {
    it("gọi GET /api/locations/nearby với lat, lng, radius (mét) và đổi null thành undefined", async () => {
        vi.mocked(api.get).mockResolvedValue(ok([{ ...RAW, distance: 444.2 }]));

        const result = await getNearbyLocations({ lat: 10.7769, lng: 106.7009, radius: 10_000 });

        expect(api.get).toHaveBeenCalledWith("/api/locations/nearby", {
            params: { lat: 10.7769, lng: 106.7009, radius: 10_000 },
        });
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ name: "Quán Chay Lá Xanh", rating: 4.7, distance: 444.2 });
        expect(result[0].phoneNumber).toBeUndefined();
        expect(result[0].priceLevel).toBeUndefined();
    });

    it("không có kết quả thì trả mảng rỗng", async () => {
        vi.mocked(api.get).mockResolvedValue(ok([]));

        expect(await getNearbyLocations({ lat: 0, lng: 0, radius: 100 })).toEqual([]);
    });
});

describe("getLocations", () => {
    it("đổi trang bắt đầu từ 1 sang trang bắt đầu từ 0 của backend và chỉ gửi bộ lọc đã đặt", async () => {
        vi.mocked(api.get).mockResolvedValue(page([RAW], { page: 1, size: 8, totalElements: 9, totalPages: 2 }));

        const result = await getLocations({ page: 2, size: 8, placeType: "cafe", minRating: 4 });

        expect(api.get).toHaveBeenCalledWith("/api/locations", {
            params: { page: 1, size: 8, placeType: "cafe", minRating: 4 },
        });
        expect(result).toMatchObject({ page: 2, size: 8, total: 9, totalPages: 2 });
        expect(result.data).toHaveLength(1);
    });
});

describe("getLocationById", () => {
    it("tìm theo id trong danh sách, báo lỗi khi không có", async () => {
        vi.mocked(api.get).mockResolvedValue(page([RAW]));

        expect((await getLocationById(RAW.id)).name).toBe("Quán Chay Lá Xanh");
        await expect(getLocationById("khong-co")).rejects.toThrow("Location not found");
    });
});

describe("Admin CRUD", () => {
    it("createLocation gọi POST /api/admin/locations và bỏ field rỗng", async () => {
        vi.mocked(api.post).mockResolvedValue(ok({ ...RAW, createdAt: "2026-10-15T00:00:00Z", updatedAt: "2026-10-15T00:00:00Z" }));

        const created = await createLocation({
            name: "Quán Mới",
            address: "1 Đường Test",
            latitude: 10.78,
            longitude: 106.7,
            placeType: "cafe",
            phoneNumber: "",
            websiteUrl: "",
            rating: undefined,
        });

        expect(api.post).toHaveBeenCalledWith("/api/admin/locations", {
            name: "Quán Mới",
            address: "1 Đường Test",
            latitude: 10.78,
            longitude: 106.7,
            placeType: "cafe",
        });
        expect(created.createdAt).toBe("2026-10-15T00:00:00Z");
    });

    it("updateLocation gọi PATCH, giữ chuỗi rỗng (xóa giá trị) và bỏ field undefined", async () => {
        vi.mocked(api.patch).mockResolvedValue(ok(RAW));

        await updateLocation(RAW.id, { name: "Tên mới", phoneNumber: "", rating: undefined });

        expect(api.patch).toHaveBeenCalledWith(`/api/admin/locations/${RAW.id}`, { name: "Tên mới", phoneNumber: "" });
    });

    it("deleteLocation gọi DELETE /api/admin/locations/{id}", async () => {
        vi.mocked(api.delete).mockResolvedValue(ok(null));

        await deleteLocation(RAW.id);

        expect(api.delete).toHaveBeenCalledWith(`/api/admin/locations/${RAW.id}`);
    });
});
