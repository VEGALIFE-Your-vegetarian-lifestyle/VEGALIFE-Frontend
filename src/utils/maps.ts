import type { Coordinates } from "@/hooks/useGeolocation";

interface Destination {
    address?: string;
    latitude: number;
    longitude: number;
}

/**
 * Link chỉ đường Google Maps. Không cần API key.
 * Đích: ưu tiên địa chỉ chữ (Google tự tìm đúng chỗ), không có thì dùng tọa độ.
 * Điểm xuất phát: vị trí người dùng đã chọn trên trang (nếu có).
 */
export function buildDirectionsUrl(destination: Destination, origin?: Coordinates | null): string {
    const url = new URL("https://www.google.com/maps/dir/");
    url.searchParams.set("api", "1");
    if (origin) url.searchParams.set("origin", `${origin.lat},${origin.lng}`);
    url.searchParams.set(
        "destination",
        destination.address?.trim() || `${destination.latitude},${destination.longitude}`,
    );
    return url.toString();
}

/** Mở chỉ đường ở tab mới. */
export function openDirections(destination: Destination, origin?: Coordinates | null) {
    window.open(buildDirectionsUrl(destination, origin), "_blank", "noopener,noreferrer");
}
