// Bám API Location của backend (docs mục "Location management" và "Danh sách địa điểm").
export type LocationType = "restaurant" | "grocery" | "cafe" | "market";

export const LOCATION_TYPES: LocationType[] = ["restaurant", "grocery", "cafe", "market"];

/** Key = tên thứ trong tuần, giá trị = các khung giờ mở cửa trong ngày. */
export type OpeningHours = Record<string, { open: string; close: string }[]>;

export interface LocationItem {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    placeType: LocationType;
    phoneNumber?: string;
    openingHours?: OpeningHours;
    websiteUrl?: string;
    /** 0.0 đến 5.0 */
    rating?: number;
    /** 1 đến 4 (1 = rẻ) */
    priceLevel?: number;
    /** Chỉ có ở `GET /api/locations/nearby`, tính bằng mét. */
    distance?: number;
    /** Chỉ có ở response của Admin. */
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Dữ liệu gửi khi tạo / sửa. Khi sửa (PATCH), field text gửi chuỗi rỗng = xóa giá trị đang lưu;
 * khi tạo, chuỗi rỗng được bỏ đi.
 */
export interface LocationPayload {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    placeType: LocationType;
    phoneNumber?: string;
    openingHours?: OpeningHours;
    websiteUrl?: string;
    rating?: number;
    priceLevel?: number;
}

/** `GET /api/locations/nearby` — `radius` tính bằng mét. */
export interface NearbyParams {
    lat: number;
    lng: number;
    radius: number;
}

/** `GET /api/locations` — các bộ lọc kết hợp bằng AND. */
export interface LocationListParams {
    page: number;
    size: number;
    placeType?: LocationType;
    minRating?: number;
    maxPriceLevel?: number;
}
