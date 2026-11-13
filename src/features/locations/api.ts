import { api } from "@/shared/api/client";
import type { ApiResponse, PageResponse, Paginated } from "@/shared/types/common";
import type {
    LocationItem,
    LocationListParams,
    LocationPayload,
    NearbyParams,
    OpeningHours,
} from "./types";

// Backend trả null cho field không có; FE dùng undefined.
interface BackendLocation {
    id: string;
    name: string;
    description?: string;
    address: string;
    latitude: number;
    longitude: number;
    phoneNumber: string | null;
    openingHours: OpeningHours | null;
    websiteUrl: string | null;
    rating: number | null;
    priceLevel: number | null;
    distance?: number;
    dishes?: {
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        cuisineType: string | null;
    }[];
    dishIds?: string[];
    createdAt?: string;
    updatedAt?: string;
}

const toLocation = (item: BackendLocation): LocationItem => ({
    id: item.id,
    name: item.name,
    description: item.description,
    address: item.address,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    phoneNumber: item.phoneNumber ?? undefined,
    openingHours: item.openingHours ?? undefined,
    websiteUrl: item.websiteUrl ?? undefined,
    rating: item.rating === null ? undefined : Number(item.rating),
    priceLevel: item.priceLevel ?? undefined,
    distance: item.distance === undefined ? undefined : Number(item.distance),
    dishes: item.dishes?.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        imageUrl: d.imageUrl,
        cuisineType: d.cuisineType,
    })),
    dishIds: item.dishIds ?? item.dishes?.map((d) => d.id),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
});

/**
 * GET /api/restaurants/nearby?lat=&lng=&radius= — `radius` tính bằng mét (#194 đổi từ /api/locations/nearby).
 * Không phân trang, gần nhất trước, mỗi địa điểm có `distance` (mét). Không có kết quả thì trả mảng rỗng.
 */
export async function getNearbyLocations(params: NearbyParams): Promise<LocationItem[]> {
    const { data } = await api.get<ApiResponse<BackendLocation[]>>("/api/restaurants/nearby", {
        params: { lat: params.lat, lng: params.lng, radius: params.radius },
    });
    return data.data.map(toLocation);
}

/**
 * GET /api/restaurants — các bộ lọc kết hợp bằng AND, xếp theo rating giảm dần (#194, #196).
 * Backend phân trang từ 0; ở đây nhận và trả trang bắt đầu từ 1 như các trang Admin khác.
 * `keyword`: tìm món hoặc tên nhà hàng (không phân biệt hoa thường).
 */
export async function getLocations(params: LocationListParams): Promise<Paginated<LocationItem>> {
    const keywordTrimmed = params.keyword?.trim();
    const { data } = await api.get<ApiResponse<PageResponse<BackendLocation>>>("/api/restaurants", {
        params: {
            page: Math.max(params.page - 1, 0),
            size: params.size,
            ...(keywordTrimmed ? { keyword: keywordTrimmed } : {}),
            ...(params.minRating !== undefined ? { minRating: params.minRating } : {}),
            ...(params.maxPriceLevel !== undefined ? { maxPriceLevel: params.maxPriceLevel } : {}),
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

/**
 * GET /api/restaurants/{restaurantId} (mới #195, public, có mảng dishes).
 * Fallback: nếu gọi GET /{id} lỗi (ví dụ backend cũ chưa có endpoint riêng), fallback lấy danh sách rồi tìm theo id.
 */
export async function getLocationById(id: string): Promise<LocationItem> {
    try {
        const { data } = await api.get<ApiResponse<BackendLocation>>(`/api/restaurants/${id}`);
        if (data.data?.id) {
            return toLocation(data.data);
        }
    } catch {
        // Fallback cho backend chưa deploy endpoint GET /api/restaurants/{id}
    }
    const page = await getLocations({ page: 1, size: 100 });
    const found = page.data.find((item) => item.id === id);
    if (!found) throw new Error("Location not found");
    return found;
}

/** POST /api/admin/restaurants — chỉ Admin. Field text rỗng được bỏ đi. Nhận thêm dishIds (#194). */
export async function createLocation(payload: LocationPayload): Promise<LocationItem> {
    const body = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined && value !== ""),
    );
    const { data } = await api.post<ApiResponse<BackendLocation>>("/api/admin/restaurants", body);
    return toLocation(data.data);
}

/**
 * PATCH /api/admin/restaurants/{restaurantId} — chỉ Admin, sửa từng phần. Nhận thêm dishIds (#194).
 * Field bỏ qua = giữ nguyên; field text gửi "" = xóa giá trị đang lưu; phải gửi ít nhất một field.
 */
export async function updateLocation(id: string, payload: Partial<LocationPayload>): Promise<LocationItem> {
    const body = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
    const { data } = await api.patch<ApiResponse<BackendLocation>>(`/api/admin/restaurants/${id}`, body);
    return toLocation(data.data);
}

/** DELETE /api/admin/restaurants/{restaurantId} — chỉ Admin, xóa mềm, không khôi phục được qua API (#194). */
export async function deleteLocation(id: string): Promise<void> {
    await api.delete<ApiResponse<null>>(`/api/admin/restaurants/${id}`);
}
