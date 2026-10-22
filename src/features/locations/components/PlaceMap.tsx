import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import type { Coordinates } from "../geo";
import type { LocationItem } from "../types";
import { openDirections } from "../geo";

// Dùng divIcon thay icon ảnh mặc định của Leaflet (icon mặc định hay vỡ đường dẫn khi build bằng Vite).
const makePlaceIcon = (color: string) =>
    L.divIcon({
        className: "",
        html: `<span style="display:block;width:22px;height:22px;border-radius:9999px;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);background:${color}"></span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
    });

// Tạo icon một lần ở ngoài component. Nếu tạo lại mỗi lần render, mọi marker bị vẽ lại liên tục nên bản đồ bị giật.
const normalIcon = makePlaceIcon("#15803d");
const selectedIcon = makePlaceIcon("#c2410c");
const placeIcon = (selected: boolean) => (selected ? selectedIcon : normalIcon);

const originIcon = L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;border:3px solid #fff;box-shadow:0 0 0 2px #2563eb;background:#2563eb"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

// Đổi tâm bản đồ khi người dùng đổi vị trí hoặc khu vực.
function Recenter({ center }: { center: Coordinates }) {
    const map = useMap();
    useEffect(() => {
        map.setView([center.lat, center.lng]);
    }, [map, center.lat, center.lng]);
    return null;
}

// Nguồn ô nền: nếu nguồn đầu không tải được thì chuyển sang nguồn kế tiếp.
const TILE_SOURCES = [
    {
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
    {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles &copy; Esri",
    },
];
const MAX_TILE_ERRORS = 4;

interface PlaceMapProps {
    places: LocationItem[];
    center: Coordinates;
    directionsOrigin?: Coordinates;
    /** Hiện chấm "vị trí của bạn" tại `center`; tắt khi `center` chính là địa điểm đang xem. */
    showOrigin?: boolean;
    selectedId?: string | null;
    onSelect?: (id: string) => void;
    className?: string;
}

export function PlaceMap({
    places,
    center,
    directionsOrigin,
    showOrigin = true,
    selectedId,
    onSelect,
    className,
}: PlaceMapProps) {
    const { t } = useTranslation("location");
    const [sourceIndex, setSourceIndex] = useState(0);
    const errorCount = useRef(0);
    const loadedAny = useRef(false);
    const source = TILE_SOURCES[Math.min(sourceIndex, TILE_SOURCES.length - 1)];
    const allFailed = sourceIndex >= TILE_SOURCES.length;

    const handleTileError = () => {
        if (loadedAny.current) return;
        errorCount.current += 1;
        if (errorCount.current >= MAX_TILE_ERRORS) {
            errorCount.current = 0;
            setSourceIndex((i) => i + 1);
        }
    };

    return (
        <div className="relative">
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={13}
                scrollWheelZoom
                className={className ?? "h-[420px] w-full rounded-2xl border border-border"}
            >
                <TileLayer
                    key={source.url}
                    attribution={source.attribution}
                    url={source.url}
                    referrerPolicy="strict-origin-when-cross-origin"
                    eventHandlers={{
                        tileerror: handleTileError,
                        tileload: () => {
                            loadedAny.current = true;
                        },
                    }}
                />
                <Recenter center={center} />
                {showOrigin && <Marker position={[center.lat, center.lng]} icon={originIcon} title={t("map.you")} />}
                {places.map((place) => (
                    <Marker
                        key={place.id}
                        position={[place.latitude, place.longitude]}
                        icon={placeIcon(place.id === selectedId)}
                        title={place.name}
                        eventHandlers={{ click: () => onSelect?.(place.id) }}
                    >
                        <Popup>
                            <div className="space-y-1">
                                <p className="font-bold">{place.name}</p>
                                <p className="text-xs">{place.address}</p>
                                <Button size="sm" onClick={() => openDirections(place, directionsOrigin)}>
                                    {t("directions")}
                                </Button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
            {allFailed && (
                <p
                    role="status"
                    className="absolute inset-x-3 top-3 z-[1000] rounded-lg bg-white/95 p-2 text-center text-xs text-dark shadow"
                >
                    {t("map.tilesFailed")}
                </p>
            )}
        </div>
    );
}
