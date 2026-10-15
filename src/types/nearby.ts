/**
 * Trang chi tiết địa điểm. Danh sách `/nearby` dùng `LocationItem` (types/location.ts) bám bảng DB.
 * Các khối chưa có trong DB (ảnh, đánh giá, món nổi bật...) vẫn là mock — chờ backend bổ sung.
 */
import type { LocationType } from "@/types/location";

export interface NearbyPlace {
    id: string;
    name: string;
    category: LocationType;
    address: string;
    rating: number;
    reviewCount: number;
    priceLevel: string;
    /** Nhãn ngắn: "100% Vegan", "Organic", "Farm-to-Table"… */
    tags: string[];
    imageUrl: string;
    isVerified: boolean;
    /** Món khớp với công thức cộng đồng, hiện thành badge "Recipe Match". */
    recipeMatch?: string;
}

export interface NearbyPlaceDetail extends NearbyPlace {
    description: string;
    openNow: boolean;
    openingHours: { day: string; hours: string; today?: boolean }[];
    phone: string;
    email: string;
    website: string;
    gallery: string[];
    /** Món nổi bật kèm giá. */
    popularDishes: { name: string; description: string; price: string; tags: string[]; imageUrl: string }[];
    /** Tiện ích minh bạch dị ứng. */
    dietary: { label: string; description: string }[];
    reviews: { id: string; author: string; badge?: string; date: string; rating: number; content: string; tip?: string }[];
    coordinates: { lat: number; lng: number };
}
