import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    ArrowLeft,
    Banknote,
    Clock,
    Coffee,
    ExternalLink,
    Globe,
    MapPin,
    Navigation,
    Phone,
    Share2,
    ShoppingBasket,
    Star,
    Store,
    Utensils,
    type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { PlaceMap } from "../components/PlaceMap";
import { getNearbyPlaceDetail } from "../nearbyApi";
import type { LocationType } from "../types";
import { openDirections } from "../geo";
import { cn } from "@/shared/utils/cn";

const TYPE_ICONS: Record<LocationType, LucideIcon> = {
    restaurant: Utensils,
    cafe: Coffee,
    grocery: ShoppingBasket,
    market: Store,
};

const linkClass =
    "flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground transition hover:bg-muted-bg hover:text-vegan-green";

export default function LocationDetailPage() {
    const { t } = useTranslation("nearby");
    const { t: tl } = useTranslation("location");
    const { id = "" } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const developing = () => toast.info(t("common:featureDeveloping"));

    const {
        data: place,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["nearby-place", id],
        queryFn: () => getNearbyPlaceDetail(id),
        enabled: id !== "",
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <Skeleton className="h-48 w-full rounded-3xl" />
                <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
        );
    }

    if (isError || !place) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
                <EmptyState
                    icon={MapPin}
                    title={t("detail.notFound.title")}
                    description={t("detail.notFound.description")}
                    action={<Button onClick={() => navigate("/nearby")}>{t("detail.notFound.action")}</Button>}
                />
            </div>
        );
    }

    const TypeIcon = TYPE_ICONS[place.placeType];
    // Cả tuần cùng một khung giờ thì gom thành một dòng "Hằng ngày".
    const sameEveryDay = place.hours.length > 1 && place.hours.every((item) => item.hours === place.hours[0].hours);
    const todayHours = place.hours.find((item) => item.today)?.hours ?? "";

    // Chỉ hiện những thông tin DB thực sự có.
    const chips = [
        place.hours.length > 0 && {
            icon: Clock,
            text: place.openNow ? t("detail.openNow", { hours: todayHours }) : t("detail.closed"),
            highlight: place.openNow,
        },
        place.priceLevel !== undefined && {
            icon: Banknote,
            text: `${t("detail.priceLevel")}: ${"$".repeat(place.priceLevel)}`,
            highlight: false,
        },
    ].filter((item): item is { icon: LucideIcon; text: string; highlight: boolean } => Boolean(item));

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb" className="mb-5 flex items-center justify-between gap-4">
                <ol className="flex items-center gap-2 text-sm text-muted-foreground">
                    <li>
                        <Link to="/" className="hover:text-vegan-green">
                            {t("common:home")}
                        </Link>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li>
                        <Link to="/nearby" className="hover:text-vegan-green">
                            {t("title")}
                        </Link>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li className="font-medium text-dark" aria-current="page">
                        {place.name}
                    </li>
                </ol>
                <Link
                    to="/nearby"
                    className="hidden whitespace-nowrap text-sm font-semibold text-vegan-green hover:underline sm:block"
                >
                    <ArrowLeft className="mr-1 inline h-4 w-4" aria-hidden="true" />
                    {t("detail.back")}
                </Link>
            </nav>

            {/* Banner */}
            <header className="rounded-3xl border border-vegan-green-muted bg-gradient-to-br from-vegan-green-light to-vegan-green-subtle p-6 sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-5">
                        <span className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-vegan-green text-white shadow-md">
                            <TypeIcon className="h-9 w-9" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <Badge variant="lightgreen">{t(`filter.${place.placeType}`)}</Badge>
                            <h1 className="mt-2 text-3xl font-extrabold text-dark">{place.name}</h1>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                {place.rating !== undefined && (
                                    <span className="flex items-center gap-1.5">
                                        <Star
                                            className="h-4 w-4 fill-amber-soft text-amber-strong"
                                            aria-hidden="true"
                                        />
                                        <span className="font-bold text-dark">{place.rating}</span>
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                                    {place.address}
                                </span>
                            </div>
                            {chips.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {chips.map(({ icon: Icon, text, highlight }) => (
                                        <span
                                            key={text}
                                            className={cn(
                                                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                                                highlight
                                                    ? "border-vegan-green bg-vegan-green text-white"
                                                    : "border-border bg-surface text-dark",
                                            )}
                                        >
                                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                            {text}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-shrink-0 flex-wrap gap-2">
                        <Button onClick={() => openDirections(place)}>
                            <Navigation className="h-4 w-4" aria-hidden="true" />
                            {t("detail.getDirections")}
                        </Button>
                        <Button variant="outline" onClick={developing}>
                            {t("detail.saveToFavorites")}
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={t("detail.share")} onClick={developing}>
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
                {/* Bản đồ thật */}
                <section className="rounded-2xl border border-border bg-card p-4">
                    <h2 className="px-1 pb-3 font-bold text-dark">{t("detail.locationTitle")}</h2>
                    <PlaceMap
                        places={[place]}
                        center={{ lat: place.latitude, lng: place.longitude }}
                        showOrigin={false}
                        selectedId={place.id}
                        className="h-[440px] w-full rounded-xl"
                    />
                </section>

                {/* Thông tin liên hệ + giờ mở cửa gộp một thẻ */}
                <aside className="h-fit rounded-2xl border border-border bg-card p-5">
                    <h2 className="font-bold text-dark">{t("detail.contactTitle")}</h2>
                    <ul className="mt-2 space-y-0.5">
                        <li className="flex items-start gap-3 px-2 py-2 text-sm text-muted-foreground">
                            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-vegan-green" aria-hidden="true" />
                            <span>{place.address}</span>
                        </li>
                        {place.phoneNumber && (
                            <li>
                                <a href={`tel:${place.phoneNumber.replace(/\s/g, "")}`} className={linkClass}>
                                    <Phone className="h-4 w-4 flex-shrink-0 text-vegan-green" aria-hidden="true" />
                                    <span className="min-w-0 flex-1 truncate">{place.phoneNumber}</span>
                                </a>
                            </li>
                        )}
                        {place.websiteUrl && (
                            <li>
                                <a
                                    href={place.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={linkClass}
                                >
                                    <Globe className="h-4 w-4 flex-shrink-0 text-vegan-green" aria-hidden="true" />
                                    <span className="min-w-0 flex-1 truncate">{place.websiteUrl}</span>
                                </a>
                            </li>
                        )}
                    </ul>

                    {place.hours.length > 0 && (
                        <div className="mt-4 border-t border-border pt-4">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="font-bold text-dark">{t("detail.hoursTitle")}</h3>
                                {place.openNow && <Badge variant="lightgreen">{t("detail.openNowBadge")}</Badge>}
                            </div>
                            <ul className="mt-3 space-y-1.5 text-sm">
                                {(sameEveryDay
                                    ? [
                                          {
                                              day: t("detail.daily"),
                                              dayKey: undefined,
                                              hours: place.hours[0].hours,
                                              today: true,
                                          },
                                      ]
                                    : place.hours
                                ).map((item) => (
                                    <li
                                        key={item.day}
                                        className={cn(
                                            "flex items-center justify-between gap-3 rounded-lg px-2 py-1",
                                            item.today
                                                ? "bg-vegan-green-light font-semibold text-vegan-green"
                                                : "text-muted-foreground",
                                        )}
                                    >
                                        <span>{item.dayKey ? tl(`days.${item.dayKey}`) : item.day}</span>
                                        <span>{item.hours}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <Button variant="outline" className="mt-5 w-full" onClick={() => openDirections(place)}>
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        {t("detail.openInMaps")}
                    </Button>
                </aside>
            </div>
        </div>
    );
}
