// Bám API Restaurant của backend (backend đổi `/api/locations` → `/api/restaurants`).
// Không còn `placeType`: response restaurant không có field này.

/** Key = tên thứ trong tuần, giá trị = các khung giờ mở cửa trong ngày. */
export type OpeningHours = Record<string, { open: string; close: string }[]>;

export interface LocationItem {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
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
    phoneNumber?: string;
    openingHours?: OpeningHours;
    websiteUrl?: string;
    rating?: number;
    priceLevel?: number;
}

/** `GET /api/restaurants/nearby` — `radius` tính bằng mét. */
export interface NearbyParams {
    lat: number;
    lng: number;
    radius: number;
}

/** `GET /api/restaurants` — các bộ lọc kết hợp bằng AND. */
export interface LocationListParams {
    page: number;
    size: number;
    minRating?: number;
    maxPriceLevel?: number;
    openNow?: boolean;
    keyword?: string;
}
