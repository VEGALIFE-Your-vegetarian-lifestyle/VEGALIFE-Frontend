import { LOCATION_FIXTURES as MOCK_LOCATIONS, type MockLocation } from "@/test/locationFixtures";
import type { Paginated } from "@/types/common";
import type { LocationItem, LocationListParams, LocationPayload, NearbyParams } from "@/types/location";
import { delay } from "@/utils/delay";
import { distanceKm } from "@/utils/distance";

// Bản giả của locationService dùng cho test (không gọi backend): dữ liệu nằm trong bộ nhớ.
// Chữ ký các hàm giống hệt `@/services/locationService`.
let locations: MockLocation[] = MOCK_LOCATIONS.map((item) => ({ ...item }));

const active = () => locations.filter((item) => item.deletedAt === null);

/** Response public không có createdAt / updatedAt / deletedAt. */
const toPublic = (row: MockLocation): LocationItem => {
    const item: Partial<MockLocation> = { ...row };
    delete item.createdAt;
    delete item.updatedAt;
    delete item.deletedAt;
    return item as LocationItem;
};

/** Response Admin có createdAt, updatedAt, không có deletedAt. */
const toAdmin = (row: MockLocation): LocationItem => {
    const item: Partial<MockLocation> = { ...row };
    delete item.deletedAt;
    return item as LocationItem;
};

/**
 * Tìm địa điểm gần một tọa độ — MOCK của `GET /api/locations/nearby?lat=&lng=&radius=`.
 * - `radius` tính bằng mét; kết quả không phân trang, gần nhất trước (BR-NEARBY-002).
 * - Mỗi địa điểm có `distance` (mét), không phải cột DB. Không bao giờ có địa điểm đã xóa mềm.
 */
export async function getNearbyLocations(params: NearbyParams): Promise<LocationItem[]> {
    await delay();

    return active()
        .map((item) => ({
            ...toPublic(item),
            distance: Math.round(distanceKm(params.lat, params.lng, item.latitude, item.longitude) * 1000),
        }))
        .filter((item) => item.distance <= params.radius)
        .sort((a, b) => a.distance - b.distance);
}

/**
 * Danh sách địa điểm — MOCK của `GET /api/locations` (public, các bộ lọc kết hợp bằng AND).
 * Backend phân trang từ 0; ở đây trả `Paginated` bắt đầu từ 1 như các trang Admin khác.
 */
export async function getLocations(params: LocationListParams): Promise<Paginated<LocationItem>> {
    await delay();

    const filtered = active()
        .filter((item) => !params.placeType || item.placeType === params.placeType)
        .filter((item) => params.minRating === undefined || (item.rating ?? 0) >= params.minRating)
        .filter((item) => params.maxPriceLevel === undefined || (item.priceLevel ?? 0) <= params.maxPriceLevel)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const start = (params.page - 1) * params.size;
    return {
        data: filtered.slice(start, start + params.size).map(toAdmin),
        total: filtered.length,
        page: params.page,
        size: params.size,
        totalPages: Math.max(1, Math.ceil(filtered.length / params.size)),
    };
}

/**
 * Chi tiết một địa điểm — MOCK.
 * ponytail: backend chưa có `GET /api/locations/{id}`; trang chi tiết cần endpoint này.
 */
export async function getLocationById(id: string): Promise<LocationItem> {
    await delay();
    const current = active().find((item) => item.id === id);
    if (!current) throw new Error("Location not found");
    return toPublic(current);
}

/** `POST /api/admin/locations` — MOCK. */
export async function createLocation(payload: LocationPayload): Promise<LocationItem> {
    await delay();
    const item: MockLocation = {
        ...payload,
        id: `loc-${crypto.randomUUID().slice(0, 8)}`,
        createdAt: new Date().toISOString(),
        deletedAt: null,
    };
    locations = [item, ...locations];
    return toAdmin(item);
}

/** `PATCH /api/admin/locations/{locationId}` — MOCK, chỉ gửi field muốn sửa. */
export async function updateLocation(id: string, payload: Partial<LocationPayload>): Promise<LocationItem> {
    await delay();
    const current = active().find((item) => item.id === id);
    if (!current) throw new Error("Location not found");
    const updated: MockLocation = { ...current, ...payload, updatedAt: new Date().toISOString() };
    locations = locations.map((item) => (item.id === id ? updated : item));
    return toAdmin(updated);
}

/** `DELETE /api/admin/locations/{locationId}` — MOCK, xóa mềm. */
export async function deleteLocation(id: string): Promise<void> {
    await delay();
    const current = active().find((item) => item.id === id);
    if (!current) throw new Error("Location not found");
    locations = locations.map((item) => (item.id === id ? { ...item, deletedAt: new Date().toISOString() } : item));
}
