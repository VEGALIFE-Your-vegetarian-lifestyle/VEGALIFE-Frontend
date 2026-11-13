import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
    ChevronDown,
    Compass,
    LayoutGrid,
    List,
    LocateFixed,
    Map as MapIcon,
    MapPin,
    Navigation,
    Phone,
    Search,
    Star,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaceMap } from "../components/PlaceMap";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useGeolocation, formatDistance, openDirections, type Coordinates } from "../geo";
import { MOCK_AREAS, type MockAreaKey } from "../mocks";
import { getLocations, getNearbyLocations } from "../api";
import type { LocationItem } from "../types";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { cn } from "@/shared/utils/cn";

type ViewMode = "split" | "list" | "map";

// Bán kính tìm kiếm cố định; backend nhận bán kính qua tham số khi có API.
const RADIUS_KM = 10;

const VIEW_MODES: { key: ViewMode; labelKey: string; icon: typeof List }[] = [
    { key: "split", labelKey: "view.split", icon: LayoutGrid },
    { key: "list", labelKey: "view.list", icon: List },
    { key: "map", labelKey: "view.map", icon: MapIcon },
];

function PlaceCard({
    place,
    origin,
    selected,
    onSelect,
}: {
    place: LocationItem;
    origin?: Coordinates;
    selected: boolean;
    onSelect: () => void;
}) {
    const { t } = useTranslation("nearby");
    const navigate = useNavigate();

    return (
        <article
            onClick={onSelect}
            className={cn(
                "flex cursor-pointer flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row",
                selected ? "border-vegan-green ring-2 ring-vegan-green/30" : "border-border",
            )}
        >
            <div className="relative flex h-32 w-full flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-vegan-green-subtle sm:w-44">
                <MapPin className="h-8 w-8 text-vegan-green" aria-hidden="true" />
                {place.distance !== undefined && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-dark/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                        {formatDistance(place.distance / 1000)}
                    </span>
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                {(place.rating !== undefined || place.priceLevel !== undefined) && (
                    <div className="flex flex-wrap items-center gap-2">
                        {place.rating !== undefined && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="h-3.5 w-3.5 fill-amber-soft text-amber-strong" aria-hidden="true" />
                                <span className="font-bold text-dark">{place.rating.toFixed(1)}</span>
                            </span>
                        )}
                        {place.priceLevel !== undefined && (
                            <span
                                className="text-xs font-semibold text-muted-foreground"
                                aria-label={`${place.priceLevel}/4`}
                            >
                                {"$".repeat(place.priceLevel)}
                            </span>
                        )}
                    </div>
                )}

                <h3 className="mt-1 font-bold text-dark">{place.name}</h3>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                    {place.address}
                </p>
                {place.phoneNumber && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                        {place.phoneNumber}
                    </p>
                )}

                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/nearby/${place.id}`);
                        }}
                    >
                        {t("viewDetails")}
                    </Button>
                    <Button
                        size="sm"
                        onClick={(event) => {
                            event.stopPropagation();
                            openDirections(place, origin);
                        }}
                    >
                        <Navigation className="h-4 w-4" aria-hidden="true" />
                        {t("directions")}
                    </Button>
                </div>
            </div>
        </article>
    );
}

export default function NearbyPage() {
    const { t } = useTranslation(["nearby", "common"]);
    const { t: tl } = useTranslation("location");
    const geo = useGeolocation();
    const [areaKey, setAreaKey] = useState<MockAreaKey>(MOCK_AREAS[0].key);
    const [useGps, setUseGps] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [view, setView] = useState<ViewMode>("split");
    const [sort, setSort] = useState("distance");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const debouncedKeyword = useDebounce(keyword.trim(), 300);
    const hasKeyword = debouncedKeyword.length > 0;

    // Điểm xuất phát: GPS nếu người dùng đã cho phép, ngược lại là khu vực đang chọn (BR-NEARBY-001).
    const area = MOCK_AREAS.find((item) => item.key === areaKey) ?? MOCK_AREAS[0];
    const origin: Coordinates = useGps && geo.coords ? geo.coords : { lat: area.lat, lng: area.lng };
    // Chỉ chỉ đường từ GPS thật; khu vực mock chỉ để lọc, nên để Google Maps tự lấy vị trí hiện tại của người dùng.
    const directionsOrigin = useGps && geo.coords ? geo.coords : undefined;

    const nearbyQuery = useQuery({
        queryKey: ["nearby-locations", origin.lat, origin.lng, RADIUS_KM],
        queryFn: () => getNearbyLocations({ lat: origin.lat, lng: origin.lng, radius: RADIUS_KM * 1000 }),
        enabled: !hasKeyword,
    });

    const searchQuery = useQuery({
        queryKey: ["restaurants-search", debouncedKeyword],
        queryFn: () => getLocations({ page: 1, size: 50, keyword: debouncedKeyword }),
        enabled: hasKeyword,
    });

    const { isLoading, isError, refetch } = hasKeyword ? searchQuery : nearbyQuery;
    const allPlaces = hasKeyword ? (searchQuery.data?.data ?? []) : (nearbyQuery.data ?? []);

    const sorted = [...allPlaces].sort((a, b) =>
        sort === "rating" ? (b.rating ?? 0) - (a.rating ?? 0) : (a.distance ?? 0) - (b.distance ?? 0),
    );

    const requestGps = () => {
        setUseGps(true);
        geo.request();
    };

    const geoMessage =
        geo.status === "loading"
            ? tl("page.locating")
            : geo.status === "denied"
              ? tl("page.denied")
              : geo.status === "unsupported"
                ? tl("page.unsupported")
                : null;

    const showList = view !== "map";
    const showMap = view !== "list";

    return (
        <div className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
            <header className="mb-6">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-vegan-green">
                    <Compass className="h-4 w-4" aria-hidden="true" />
                    {t("directoryLabel")}
                </p>
                <h1 className="mt-2 text-3xl font-extrabold text-dark">{t("title")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
            </header>

            {/* Toolbar gọn: [dropdown location] [ô search] [nút location] + view/sort */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-40 sm:w-44">
                        <MapPin
                            className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <Select
                            value={areaKey}
                            onChange={(event) => {
                                setAreaKey(event.target.value as MockAreaKey);
                                setUseGps(false);
                                setSelectedId(null);
                            }}
                            aria-label={tl("page.areaLabel")}
                            className="h-10 pl-9 text-sm"
                        >
                            {MOCK_AREAS.map((item) => (
                                <option key={item.key} value={item.key}>
                                    {tl(`page.area.${item.key}`)}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="w-56 sm:w-64">
                        <Input
                            leadingIcon={Search}
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                            placeholder={tl("page.searchPlaceholder")}
                            aria-label={tl("page.searchLabel")}
                            className="h-10 text-sm"
                            trailing={
                                keyword ? (
                                    <button
                                        type="button"
                                        onClick={() => setKeyword("")}
                                        aria-label={t("common:clearFilter")}
                                        className="rounded p-1 text-muted-foreground hover:text-dark"
                                    >
                                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                                    </button>
                                ) : undefined
                            }
                        />
                    </div>
                    <Button
                        type="button"
                        variant={useGps && geo.coords ? "primary" : "outline"}
                        size="sm"
                        onClick={requestGps}
                        disabled={geo.status === "loading"}
                        title={t("changeLocation")}
                        aria-label={t("changeLocation")}
                        className="h-10 shrink-0 px-3"
                    >
                        <LocateFixed className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden md:inline">{t("changeLocation")}</span>
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-0.5">
                        {VIEW_MODES.map(({ key, labelKey, icon: Icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setView(key)}
                                aria-pressed={view === key}
                                title={t(labelKey)}
                                aria-label={t(labelKey)}
                                className={cn(
                                    "flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition",
                                    view === key
                                        ? "bg-vegan-green text-white"
                                        : "text-muted-foreground hover:text-vegan-green",
                                )}
                            >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                                <span className="hidden sm:inline">{t(labelKey)}</span>
                            </button>
                        ))}
                    </div>
                    <Select
                        value={sort}
                        onChange={(event) => setSort(event.target.value)}
                        className="h-10 w-44 text-sm"
                        aria-label={t("sortBy")}
                    >
                        <option value="distance">{t("sort.distance")}</option>
                        <option value="rating">{t("sort.rating")}</option>
                    </Select>
                </div>
            </div>

            {geoMessage && (
                <p role="status" className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-vegan-green" aria-hidden="true" />
                    {geoMessage}
                </p>
            )}

            {/* Nhãn sắp xếp cố định theo mockup */}
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <ChevronDown className="h-3.5 w-3.5 text-vegan-green" aria-hidden="true" />
                {t("sortStrict")}
            </p>

            <div
                className={cn(
                    "mt-6 grid gap-6",
                    view === "split" && "lg:grid-cols-[1fr_420px]",
                    view === "map" && "lg:grid-cols-1",
                )}
            >
                {showList && (
                    <div className="space-y-4">
                        {isError ? (
                            <div className="rounded-2xl border border-border bg-card p-4">
                                <p className="text-sm text-danger" role="alert">
                                    {t("error")}
                                </p>
                                <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>
                                    {t("retry")}
                                </Button>
                            </div>
                        ) : isLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <Skeleton key={index} className="h-44 rounded-2xl" />
                            ))
                        ) : sorted.length === 0 ? (
                            <div className="rounded-2xl border border-border bg-card">
                                <EmptyState
                                    icon={MapPin}
                                    title={t("empty.title")}
                                    description={hasKeyword ? t("common:emptySearch") : t("empty.description")}
                                    action={
                                        hasKeyword ? (
                                            <Button onClick={() => setKeyword("")}>{t("common:clearFilter")}</Button>
                                        ) : undefined
                                    }
                                />
                            </div>
                        ) : (
                            sorted.map((place) => (
                                <PlaceCard
                                    key={place.id}
                                    place={place}
                                    origin={directionsOrigin}
                                    selected={place.id === selectedId}
                                    onSelect={() => setSelectedId(place.id)}
                                />
                            ))
                        )}
                    </div>
                )}

                {showMap && (
                    <aside className={cn(view === "split" && "hidden lg:block")}>
                        <div className={cn(view === "split" && "sticky top-24")}>
                            <PlaceMap
                                places={sorted}
                                center={origin}
                                directionsOrigin={directionsOrigin}
                                selectedId={selectedId}
                                onSelect={setSelectedId}
                                className="h-[520px] w-full rounded-2xl border border-border"
                            />
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
