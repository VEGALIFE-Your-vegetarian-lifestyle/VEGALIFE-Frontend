import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
    ChevronDown,
    Compass,
    LayoutGrid,
    List,
    Map as MapIcon,
    MapPin,
    Navigation,
    Phone,
    RefreshCw,
    Sparkles,
    Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlaceMap } from "../components/PlaceMap";
import { PillTabs } from "@/components/ui/pill-tabs";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useGeolocation, formatDistance, openDirections, type Coordinates } from "../geo";
import { MOCK_AREAS, type MockAreaKey } from "../mocks";
import { getNearbyLocations } from "../api";
import type { LocationItem, LocationType } from "../types";
import { cn } from "@/shared/utils/cn";

type CategoryFilter = LocationType | "all";
type ViewMode = "split" | "list" | "map";

const FILTERS: CategoryFilter[] = ["all", "restaurant", "cafe", "grocery", "market"];

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
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={place.placeType === "restaurant" ? "lightgreen" : "cream"} size="sm">
                        {t(`filter.${place.placeType}`)}
                    </Badge>
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

                <h3 className="mt-2 font-bold text-dark">{place.name}</h3>
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
    const { t } = useTranslation("nearby");
    const { t: tl } = useTranslation("location");
    const navigate = useNavigate();
    const geo = useGeolocation();
    const [areaKey, setAreaKey] = useState<MockAreaKey>(MOCK_AREAS[0].key);
    const [useGps, setUseGps] = useState(false);
    const [category, setCategory] = useState<CategoryFilter>("all");
    const [view, setView] = useState<ViewMode>("split");
    const [sort, setSort] = useState("distance");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Điểm xuất phát: GPS nếu người dùng đã cho phép, ngược lại là khu vực đang chọn (BR-NEARBY-001).
    const area = MOCK_AREAS.find((item) => item.key === areaKey) ?? MOCK_AREAS[0];
    const origin: Coordinates = useGps && geo.coords ? geo.coords : { lat: area.lat, lng: area.lng };
    // Chỉ chỉ đường từ GPS thật; khu vực mock chỉ để lọc, nên để Google Maps tự lấy vị trí hiện tại của người dùng.
    const directionsOrigin = useGps && geo.coords ? geo.coords : undefined;

    // Một request lấy hết trong bán kính, lọc client-side — đủ để có count cho từng pill.
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["nearby-locations", origin.lat, origin.lng, RADIUS_KM],
        queryFn: () => getNearbyLocations({ lat: origin.lat, lng: origin.lng, radius: RADIUS_KM * 1000 }),
    });

    const allPlaces = data ?? [];

    const countFor = (key: CategoryFilter) =>
        key === "all" ? allPlaces.length : allPlaces.filter((place) => place.placeType === key).length;

    const tabs = FILTERS.map((key) => ({
        key,
        label: t(`filter.${key}`),
        count: countFor(key),
    }));

    const sorted = allPlaces
        .filter((place) => category === "all" || place.placeType === category)
        .sort((a, b) =>
            sort === "rating" ? (b.rating ?? 0) - (a.rating ?? 0) : (a.distance ?? 0) - (b.distance ?? 0),
        );

    const requestGps = () => {
        setUseGps(true);
        geo.request();
    };

    const notice =
        geo.status === "loading"
            ? tl("page.locating")
            : geo.status === "denied"
              ? tl("page.denied")
              : geo.status === "unsupported"
                ? tl("page.unsupported")
                : useGps && geo.coords
                  ? t("locationNoticeGps", { radius: RADIUS_KM })
                  : t("locationNoticeArea", { area: tl(`page.area.${area.key}`), radius: RADIUS_KM });

    const showList = view !== "map";
    const showMap = view !== "list";

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <header className="mb-6">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-vegan-green">
                    <Compass className="h-4 w-4" aria-hidden="true" />
                    {t("directoryLabel")}
                </p>
                <h1 className="mt-2 text-3xl font-extrabold text-dark">{t("title")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
            </header>

            <div
                role="status"
                className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted-bg px-4 py-3 text-sm"
            >
                <span className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                    {notice}
                </span>
                <button
                    type="button"
                    onClick={requestGps}
                    className="whitespace-nowrap text-xs font-semibold text-vegan-green hover:underline"
                >
                    {t("changeLocation")}
                </button>
            </div>

            {/* Dải Recipe Finder */}
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-lavender-hover bg-lavender p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface text-lavender-strong">
                        <Sparkles className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                        <h2 className="text-sm font-bold text-lavender-strong">{t("recipeFinder.title")}</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">{t("recipeFinder.subtitle")}</p>
                    </div>
                </div>
                <Button variant="soft" className="whitespace-nowrap" onClick={() => navigate("/ai-nutrition")}>
                    {t("recipeFinder.cta")}
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:min-w-64">
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
                        className="h-11 pl-9"
                    >
                        {MOCK_AREAS.map((item) => (
                            <option key={item.key} value={item.key}>
                                {tl(`page.area.${item.key}`)}
                            </option>
                        ))}
                    </Select>
                </div>
                <Button variant="outline" onClick={requestGps} disabled={geo.status === "loading"}>
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {t("gpsRefresh")}
                </Button>
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
                    className="w-52"
                    aria-label={t("sortBy")}
                >
                    <option value="distance">{t("sort.distance")}</option>
                    <option value="rating">{t("sort.rating")}</option>
                </Select>
            </div>

            {/* Nhãn sắp xếp cố định theo mockup */}
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <ChevronDown className="h-3.5 w-3.5 text-vegan-green" aria-hidden="true" />
                {t("sortStrict")}
            </p>

            {/* Category pills có count */}
            <PillTabs items={tabs} value={category} onChange={setCategory} className="mt-4" />

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
                                    description={t("empty.description")}
                                    action={<Button onClick={() => setCategory("all")}>{t("empty.action")}</Button>}
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
