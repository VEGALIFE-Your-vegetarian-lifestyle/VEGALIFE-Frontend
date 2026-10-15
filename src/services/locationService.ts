import { api } from "@/services/api";
import type { ApiResponse, PageResponse, Paginated } from "@/types/common";
import type {
    LocationItem,
    LocationListParams,
    LocationPayload,
    LocationType,
    NearbyParams,
    OpeningHours,
} from "@/types/location";

// Backend trả null cho field không có; FE dùng undefined.
interface BackendLocation {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    placeType: LocationType;
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
    placeType: item.placeType,
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
 * GET /api/locations/nearby?lat=&lng=&radius= — `radius` tính bằng mét.
 * Không phân trang, gần nhất trước, mỗi địa điểm có `distance` (mét). Không có kết quả thì trả mảng rỗng.
 */
export async function getNearbyLocations(params: NearbyParams): Promise<LocationItem[]> {
    const { data } = await api.get<ApiResponse<BackendLocation[]>>("/api/locations/nearby", {
        params: { lat: params.lat, lng: params.lng, radius: params.radius },
    });
    return data.data.map(toLocation);
}

/**
 * GET /api/locations — các bộ lọc kết hợp bằng AND, xếp theo rating giảm dần.
 * Backend phân trang từ 0; ở đây nhận và trả trang bắt đầu từ 1 như các trang Admin khác.
 */
export async function getLocations(params: LocationListParams): Promise<Paginated<LocationItem>> {
    const { data } = await api.get<ApiResponse<PageResponse<BackendLocation>>>("/api/locations", {
        params: {
            page: Math.max(params.page - 1, 0),
            size: params.size,
            ...(params.placeType ? { placeType: params.placeType } : {}),
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
 * ponytail: backend chưa có GET /api/locations/{id}, nên lấy tối đa 100 địa điểm đầu của GET /api/locations rồi tìm theo id.
 * Đổi sang endpoint riêng khi có; quá 100 địa điểm thì tìm không ra.
 */
export async function getLocationById(id: string): Promise<LocationItem> {
    const page = await getLocations({ page: 1, size: 100 });
    const found = page.data.find((item) => item.id === id);
    if (!found) throw new Error("Location not found");
    return found;
}

/** POST /api/admin/locations — chỉ Admin. Field text rỗng được bỏ đi. */
export async function createLocation(payload: LocationPayload): Promise<LocationItem> {
    const body = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined && value !== ""),
    );
    const { data } = await api.post<ApiResponse<BackendLocation>>("/api/admin/locations", body);
    return toLocation(data.data);
}

/**
 * PATCH /api/admin/locations/{locationId} — chỉ Admin, sửa từng phần.
 * Field bỏ qua = giữ nguyên; field text gửi "" = xóa giá trị đang lưu; phải gửi ít nhất một field.
 */
export async function updateLocation(id: string, payload: Partial<LocationPayload>): Promise<LocationItem> {
    const body = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
    const { data } = await api.patch<ApiResponse<BackendLocation>>(`/api/admin/locations/${id}`, body);
    return toLocation(data.data);
}

/** DELETE /api/admin/locations/{locationId} — chỉ Admin, xóa mềm, không khôi phục được qua API. */
export async function deleteLocation(id: string): Promise<void> {
    await api.delete<ApiResponse<null>>(`/api/admin/locations/${id}`);
}
