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
