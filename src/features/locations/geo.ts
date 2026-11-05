import { useCallback, useState } from "react";

export type GeolocationStatus = "idle" | "loading" | "granted" | "denied" | "unsupported";

/** Tọa độ WGS-84. Khai ở đây (feature) để `utils` không phải import ngược từ `hooks`. */
export interface Coordinates {
    lat: number;
    lng: number;
}

// Chỉ xin vị trí khi người dùng bấm nút (gọi `request`), không tự xin lúc mở trang.
export function useGeolocation() {
    const [status, setStatus] = useState<GeolocationStatus>("idle");
    const [coords, setCoords] = useState<Coordinates | null>(null);

    const request = useCallback(() => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            setStatus("unsupported");
            return;
        }
        setStatus("loading");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
                setStatus("granted");
            },
            () => setStatus("denied"),
            { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
        );
    }, []);

    return { status, coords, request };
}

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Khoảng cách giữa hai tọa độ (km) theo công thức Haversine. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** "850 m" dưới 1 km, "2.4 km" từ 1 km trở lên. */
export function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}

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
