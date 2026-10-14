import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
    ChevronDown,
    Compass,
    LayoutGrid,
    List,
    Map as MapIcon,
    MapPin,
    Navigation,
    RefreshCw,
    Sparkles,
    Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PillTabs } from "@/components/ui/pill-tabs";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { getNearbyPlaces } from "@/services/nearbyService";
import type { NearbyPlace } from "@/types/nearby";
import { cn } from "@/lib/utils";

type CategoryFilter = NearbyPlace["category"] | "all";
type ViewMode = "split" | "list" | "map";

const FILTERS: CategoryFilter[] = ["all", "restaurant", "cafe", "bakery", "market"];

const VIEW_MODES: { key: ViewMode; labelKey: string; icon: typeof List }[] = [
    { key: "split", labelKey: "view.split", icon: LayoutGrid },
    { key: "list", labelKey: "view.list", icon: List },
    { key: "map", labelKey: "view.map", icon: MapIcon },
];

function PlaceCard({ place }: { place: NearbyPlace }) {
    const { t } = useTranslation("nearby");
    const navigate = useNavigate();

    return (
        <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row">
            <div className="relative h-40 w-full flex-shrink-0 overflow-hidden rounded-xl sm:h-32 sm:w-44">
                <img src={place.imageUrl} alt={place.name} className="h-full w-full object-cover" loading="lazy" />
                {place.recipeMatch && (
                    <Badge variant="glass" size="sm" className="absolute left-2 top-2">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        {t("recipeMatch", { dish: place.recipeMatch })}
                    </Badge>
                )}
                <span className="absolute bottom-2 left-2 rounded-full bg-dark/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                    {place.distanceKm} km
                </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={place.category === "restaurant" ? "lightgreen" : "cream"} size="sm">
                        {t(`filter.${place.category}`)}
                    </Badge>
                    {place.isVerified && (
                        <Badge variant="info" size="sm">
                            {t("verified")}
                        </Badge>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3.5 w-3.5 fill-amber-soft text-amber-strong" aria-hidden="true" />
                        <span className="font-bold text-dark">{place.rating}</span>({place.reviewCount})
                    </span>
                </div>

                <h3 className="mt-2 font-bold text-dark">{place.name}</h3>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {place.address}
                </p>

                <div className="mt-2 flex flex-wrap gap-1">
                    {place.tags.map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/nearby/${place.id}`)}>
                        {t("viewDetails")}
                    </Button>
                    <Button size="sm" onClick={() => toast.info(t("common:featureDeveloping"))}>
                        <Navigation className="h-4 w-4" aria-hidden="true" />
                        {t("directions")}
                    </Button>
                </div>
            </div>
        </article>
    );
}

/**
 * Bản đồ dựng bằng CSS theo mockup.
 * ponytail: chưa có API/key bản đồ — thay bằng Google Maps/Mapbox khi có key.
 */
function MapCanvas({ places, onSelect }: { places: NearbyPlace[]; onSelect: (id: string) => void }) {
    const { t } = useTranslation("nearby");

    return (
        <div className="relative h-[520px] overflow-hidden rounded-2xl border border-border bg-vegan-green-subtle">
            {/* Lưới đường */}
            <div
                aria-hidden="true"
                className="absolute inset-0 opacity-60"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
                    backgroundSize: "56px 56px",
                }}
            />
            <div aria-hidden="true" className="absolute left-0 right-0 top-1/3 h-3 bg-lavender-hover/70" />
            <div aria-hidden="true" className="absolute bottom-0 left-1/4 top-0 w-3 bg-lavender-hover/70" />

            {/* Ghim giá */}
            {places.slice(0, 5).map((place, index) => (
                <button
                    key={place.id}
                    type="button"
                    onClick={() => onSelect(place.id)}
                    style={{
                        left: `${14 + ((index * 17) % 70)}%`,
                        top: `${18 + ((index * 23) % 60)}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-vegan-green-muted bg-surface px-3 py-1.5 text-xs font-bold text-dark shadow-md transition hover:bg-vegan-green hover:text-white"
                >
                    {place.name.split(" ")[0]}
                </button>
            ))}

            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl border border-border bg-surface/95 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
                <MapIcon className="h-3.5 w-3.5 text-vegan-green" aria-hidden="true" />
                {t("mapPlaceholder")}
            </div>
        </div>
    );
}

export default function NearbyPage() {
    const { t } = useTranslation("nearby");
    const navigate = useNavigate();
    const [category, setCategory] = useState<CategoryFilter>("all");
    const [view, setView] = useState<ViewMode>("split");
    const [sort, setSort] = useState("distance");

    // Một request lấy hết, lọc client-side — đủ để có count cho từng pill.
    // ponytail: đổi sang query theo category khi danh bạ lớn hơn vài trăm mục.
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["nearby-places"],
        queryFn: () => getNearbyPlaces(),
    });

    const allPlaces = data?.data ?? [];

    const countFor = (key: CategoryFilter) =>
        key === "all" ? allPlaces.length : allPlaces.filter((place) => place.category === key).length;

    const tabs = FILTERS.map((key) => ({
        key,
        label: t(`filter.${key}`),
        count: countFor(key),
    }));

    const sorted = allPlaces
        .filter((place) => category === "all" || place.category === category)
        .sort((a, b) => {
            if (sort === "rating") return b.rating - a.rating;
            if (sort === "reviews") return b.reviewCount - a.reviewCount;
            return a.distanceKm - b.distanceKm;
        });

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

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted-bg px-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                    {t("locationNotice")}
                </span>
                <button
                    type="button"
                    onClick={() => toast.info(t("common:featureDeveloping"))}
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
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <input
                        readOnly
                        value={t("areaPlaceholder")}
                        aria-label={t("areaPlaceholder")}
                        className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm text-dark"
                    />
                </div>
                <Button variant="outline" onClick={() => refetch()}>
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
                                view === key ? "bg-vegan-green text-white" : "text-muted-foreground hover:text-vegan-green",
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
                    <option value="reviews">{t("sort.reviews")}</option>
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
                            <p className="text-sm text-danger" role="alert">
                                {t("error")}
                            </p>
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
                            sorted.map((place) => <PlaceCard key={place.id} place={place} />)
                        )}
                    </div>
                )}

                {showMap && (
                    <aside className={cn(view === "split" && "hidden lg:block")}>
                        <div className={cn(view === "split" && "sticky top-24")}>
                            <MapCanvas places={sorted} onSelect={(id) => navigate(`/nearby/${id}`)} />
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
