/** Key = tên thứ trong tuần, giá trị = các khung giờ mở cửa trong ngày. */
export type OpeningHours = Record<string, { open: string; close: string }[]>;

export interface RestaurantDish {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    cuisineType: string | null;
}

export interface LocationItem {
    id: string;
    name: string;
    description?: string;
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
    /** Chỉ có ở `GET /api/restaurants/nearby`, tính bằng mét. */
    distance?: number;
    /** Chỉ có ở `GET /api/restaurants/{id}` (#195). */
    dishes?: RestaurantDish[];
    /** ID các món ăn đã gắn (#194). */
    dishIds?: string[];
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
    description?: string;
    address: string;
    latitude: number;
    longitude: number;
    phoneNumber?: string;
    openingHours?: OpeningHours;
    websiteUrl?: string;
    rating?: number;
    priceLevel?: number;
    dishIds?: string[];
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
    keyword?: string;
    minRating?: number;
    maxPriceLevel?: number;
    openNow?: boolean;
    keyword?: string;
}
