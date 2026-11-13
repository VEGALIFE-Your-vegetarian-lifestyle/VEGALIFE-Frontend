import { api } from "@/shared/api/client";
import type { ApiResponse, PageResponse, Paginated } from "@/shared/types/common";
import type { LocationItem, LocationListParams, LocationPayload, NearbyParams, OpeningHours } from "./types";

// Backend trả null cho field không có; FE dùng undefined.
interface BackendLocation {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    phoneNumber: string | null;
    openingHours: OpeningHours | null;
    websiteUrl: string | null;
    rating: number | null;
    priceLevel: number | null;
    distance?: number;
    createdAt?: string;
    updatedAt?: string;
}

const toLocation = (item: BackendLocation): LocationItem => ({
    id: item.id,
    name: item.name,
    address: item.address,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    phoneNumber: item.phoneNumber ?? undefined,
    openingHours: item.openingHours ?? undefined,
    websiteUrl: item.websiteUrl ?? undefined,
    rating: item.rating === null ? undefined : Number(item.rating),
    priceLevel: item.priceLevel ?? undefined,
    distance: item.distance === undefined ? undefined : Number(item.distance),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
});

/**
 * GET /api/restaurants/nearby?lat=&lng=&radius= — `radius` tính bằng mét.
 * Không phân trang, gần nhất trước, mỗi địa điểm có `distance` (mét). Không có kết quả thì trả mảng rỗng.
 */
export async function getNearbyLocations(params: NearbyParams): Promise<LocationItem[]> {
    const { data } = await api.get<ApiResponse<BackendLocation[]>>("/api/restaurants/nearby", {
        params: { lat: params.lat, lng: params.lng, radius: params.radius },
    });
    return data.data.map(toLocation);
}

/**
 * GET /api/restaurants — các bộ lọc kết hợp bằng AND.
 * Backend phân trang từ 0; ở đây nhận và trả trang bắt đầu từ 1 như các trang Admin khác.
 */
export async function getLocations(params: LocationListParams): Promise<Paginated<LocationItem>> {
    const { data } = await api.get<ApiResponse<PageResponse<BackendLocation>>>("/api/restaurants", {
        params: {
            page: Math.max(params.page - 1, 0),
            size: params.size,
            ...(params.minRating !== undefined ? { minRating: params.minRating } : {}),
            ...(params.maxPriceLevel !== undefined ? { maxPriceLevel: params.maxPriceLevel } : {}),
            ...(params.openNow !== undefined ? { openNow: params.openNow } : {}),
            ...(params.keyword ? { keyword: params.keyword } : {}),
        },
    });

    return {
        data: data.data.content.map(toLocation),
        total: data.data.totalElements,
        page: data.data.page + 1,
        size: data.data.size,
        totalPages: data.data.totalPages,
    };
}

/** GET /api/restaurants/{restaurantId} — chi tiết một địa điểm. */
export async function getLocationById(id: string): Promise<LocationItem> {
    const { data } = await api.get<ApiResponse<BackendLocation>>(`/api/restaurants/${id}`);
    return toLocation(data.data);
}

/** POST /api/admin/restaurants — chỉ Admin. Field text rỗng được bỏ đi. */
export async function createLocation(payload: LocationPayload): Promise<LocationItem> {
    const body = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined && value !== ""),
    );
    const { data } = await api.post<ApiResponse<BackendLocation>>("/api/admin/restaurants", body);
    return toLocation(data.data);
}

/**
 * PATCH /api/admin/restaurants/{restaurantId} — chỉ Admin, sửa từng phần.
 * Field bỏ qua = giữ nguyên; field text gửi "" = xóa giá trị đang lưu; phải gửi ít nhất một field.
 */
export async function updateLocation(id: string, payload: Partial<LocationPayload>): Promise<LocationItem> {
    const body = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
    const { data } = await api.patch<ApiResponse<BackendLocation>>(`/api/admin/restaurants/${id}`, body);
    return toLocation(data.data);
}

/** DELETE /api/admin/restaurants/{restaurantId} — chỉ Admin, xóa mềm, không khôi phục được qua API. */
export async function deleteLocation(id: string): Promise<void> {
    await api.delete<ApiResponse<null>>(`/api/admin/restaurants/${id}`);
}
