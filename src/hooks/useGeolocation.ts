import { useCallback, useState } from "react";

export type GeolocationStatus = "idle" | "loading" | "granted" | "denied" | "unsupported";

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
