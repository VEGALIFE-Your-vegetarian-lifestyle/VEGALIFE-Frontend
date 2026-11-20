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

/** Một gợi ý địa chỉ từ Photon — `address` đã ghép sẵn để hiện/ghi vào form. */
export interface AddressSuggestion {
    /** Dạng đọc được: "Số nhà Đường, Phường, Quận, Thành phố". */
    address: string;
    lat: number;
    lng: number;
    /**
     * `true` khi kết quả là cấp đường/thành phố chứ không phải số nhà — OSM Việt Nam
     * thường thiếu `housenumber`, admin phải tự xác nhận vị trí.
     */
    approximate: boolean;
}

/** Thứ tự ghép nhãn: số nhà trước tên đường, rồi phường/quận/tỉnh. */
const ADDRESS_PARTS = [
    "housenumber",
    "street",
    "locality",
    "district",
    "subdistrict",
    "city",
    "county",
    "state",
] as const;

const joinAddress = (properties: Record<string, unknown>): string => {
    const seen = new Set<string>();
    const parts: string[] = [];
    for (const key of ADDRESS_PARTS) {
        const value = properties[key];
        if (typeof value !== "string" || !value.trim()) continue;
        const part = value.trim();
        if (seen.has(part.toLowerCase())) continue;
        seen.add(part.toLowerCase());
        parts.push(part);
    }
    // Photon hay trả `name` là tên POI; có tên mà không có số nhà thì ghép lên đầu.
    const name = typeof properties.name === "string" ? properties.name.trim() : "";
    if (name && !seen.has(name.toLowerCase())) parts.unshift(name);
    return parts.join(", ");
};

/**
 * `https://photon.komoot.io` — Photon của Komoot: dữ liệu OSM, **không cần key**,
 * cho phép gọi liên tục (khác Nominatim cấm autocomplete).
 *
 * ponytail: giới hạn bằng `countrycodes` không có trong API này — lọc client-side theo
 * `properties.countrycode === "VN"`. Bỏ phần lọc khi cần tìm cả ngoài Việt Nam.
 */
export async function searchAddresses(query: string, limit = 5): Promise<AddressSuggestion[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) return [];

    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", trimmed);
    url.searchParams.set("limit", String(limit * 3)); // lọc VN xong có thể còn ít hơn `limit`
    url.searchParams.set("lang", "en");

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Photon ${response.status}`);

    const payload = (await response.json()) as {
        features?: {
            properties?: Record<string, unknown>;
            geometry?: { coordinates?: [number, number] };
        }[];
    };

    return (payload.features ?? [])
        .filter((feature) => feature.properties?.countrycode === "VN")
        .map((feature) => {
            // GeoJSON trả `[lng, lat]` — đúng thứ tự này, đừng đảo.
            const [lng, lat] = feature.geometry?.coordinates ?? [NaN, NaN];
            const properties = feature.properties ?? {};
            return {
                address: joinAddress(properties),
                lat,
                lng,
                approximate: properties.type !== "house",
            };
        })
        .filter((item) => item.address !== "" && Number.isFinite(item.lat) && Number.isFinite(item.lng))
        .slice(0, limit);
}
