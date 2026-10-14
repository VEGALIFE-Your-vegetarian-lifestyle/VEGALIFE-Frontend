/**
 * Nearby / location — backend chưa có API (SRS nhóm 22–23).
 * Kiểu dữ liệu bám theo mockup UI để khi BE xong chỉ cần đổi ruột `nearbyService`.
 */
export interface NearbyPlace {
    id: string;
    name: string;
    category: "restaurant" | "cafe" | "bakery" | "market";
    address: string;
    district: string;
    distanceKm: number;
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
