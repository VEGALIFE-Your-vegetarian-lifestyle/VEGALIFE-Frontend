import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    ArrowLeft,
    Award,
    BadgeCheck,
    Banknote,
    ChevronRight,
    Clock,
    ExternalLink,
    Globe,
    Leaf,
    Mail,
    MapPin,
    Navigation,
    Phone,
    Share2,
    Star,
    ThumbsUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { getNearbyPlaceDetail } from "@/services/nearbyService";
import { cn } from "@/lib/utils";

const GALLERY_LABELS = ["interior", "kitchen", "plating"] as const;

export default function LocationDetailPage() {
    const { t } = useTranslation("nearby");
    const { id = "" } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const developing = () => toast.info(t("common:featureDeveloping"));

    const { data: place, isLoading, isError } = useQuery({
        queryKey: ["nearby-place", id],
        queryFn: () => getNearbyPlaceDetail(id),
        enabled: id !== "",
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-10 w-80" />
                <Skeleton className="h-40 w-full" />
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

    const todayHours = place.openingHours.find((item) => item.today)?.hours ?? "";

    const facts = [
        { icon: MapPin, label: t("detail.distance"), value: `${place.distanceKm} km (${place.district})` },
        {
            icon: Clock,
            label: t("detail.status"),
            value: place.openNow ? t("detail.openNow", { hours: todayHours }) : t("detail.closed"),
        },
        { icon: Banknote, label: t("detail.priceLevel"), value: place.priceLevel },
        { icon: Leaf, label: t("detail.ethics"), value: t("detail.ethicsValue") },
    ];

    const contacts = [
        { icon: Phone, value: place.phone },
        { icon: Mail, value: place.email },
        { icon: Globe, value: place.website },
    ];

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

            {/* Gallery 3 ảnh có nhãn */}
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                <figure className="relative h-64 overflow-hidden rounded-2xl sm:h-80">
                    <img src={place.gallery[0]} alt={place.name} className="h-full w-full object-cover" />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        <Badge variant="lightgreen">{t(`filter.${place.category}`)}</Badge>
                        {place.isVerified && (
                            <Badge variant="default">
                                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                                {t("detail.farmDirect")}
                            </Badge>
                        )}
                    </div>
                    <figcaption className="absolute bottom-4 left-4 rounded-full bg-dark/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {t(`detail.galleryLabels.${GALLERY_LABELS[0]}`)}
                    </figcaption>
                    <span className="absolute bottom-4 right-4 rounded-full bg-dark/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {t("detail.photoCount", { count: place.gallery.length })}
                    </span>
                </figure>
                <div className="hidden grid-rows-2 gap-3 sm:grid">
                    {[1, 2].map((index) => (
                        <figure key={index} className="relative overflow-hidden rounded-2xl">
                            <img src={place.gallery[index]} alt="" className="h-full w-full object-cover" />
                            <figcaption className="absolute bottom-3 left-3 rounded-full bg-dark/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                                {t(`detail.galleryLabels.${GALLERY_LABELS[index]}`)}
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>

            {/* Header */}
            <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-dark">{place.name}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-amber-soft text-amber-strong" aria-hidden="true" />
                            <span className="font-bold text-dark">{place.rating}</span>
                            <span className="flex items-center gap-1">
                                <BadgeCheck className="h-3.5 w-3.5 text-vegan-green" aria-hidden="true" />
                                {t("detail.verifiedReviews", { count: place.reviewCount })}
                            </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" aria-hidden="true" />
                            {place.address} · {place.district}
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={developing}>
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

            {/* Fact strip */}
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {facts.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                        <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-vegan-green" aria-hidden="true" />
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {label}
                            </p>
                            <p className="truncate text-sm font-semibold text-dark">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
                {/* Main */}
                <div className="space-y-8">
                    <section>
                        <h2 className="flex items-center gap-2 text-xl font-bold text-dark">
                            <Leaf className="h-5 w-5 text-vegan-green" aria-hidden="true" />
                            {t("detail.aboutTitle", { name: place.name })}
                        </h2>
                        {place.description.split("\n\n").map((paragraph, index) => (
                            <p key={index} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                {paragraph}
                            </p>
                        ))}
                        <div className="mt-5 flex flex-wrap gap-2">
                            {(["solar", "farmPartners", "zeroWaste"] as const).map((item) => (
                                <span
                                    key={item}
                                    className="flex items-center gap-2 rounded-full border border-vegan-green-muted bg-vegan-green-light px-3 py-1.5 text-xs font-semibold text-vegan-green"
                                >
                                    <Award className="h-4 w-4" aria-hidden="true" />
                                    {t(`detail.sustainability.${item}`)}
                                </span>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-dark">{t("detail.dishesTitle")}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{t("detail.dishesSubtitle")}</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            {place.popularDishes.map((dish) => (
                                <article key={dish.name} className="overflow-hidden rounded-2xl border border-border bg-card">
                                    <div className="relative h-40">
                                        <img
                                            src={dish.imageUrl}
                                            alt={dish.name}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                        <Badge variant="lightgreen" size="sm" className="absolute left-3 top-3">
                                            {t("detail.communityRecipeMatch")}
                                        </Badge>
                                        <span className="absolute bottom-3 right-3 rounded-full bg-surface px-3 py-1 text-sm font-bold text-dark">
                                            {dish.price}
                                        </span>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-dark">{dish.name}</h3>
                                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                            {dish.description}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {dish.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded-full bg-vegan-green-light px-2 py-0.5 text-[10px] font-bold text-vegan-green"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={developing}
                                            className="mt-3 flex w-full items-center gap-1.5 rounded-lg bg-lavender px-3 py-2 text-xs font-semibold text-lavender-strong transition hover:bg-lavender-hover/40"
                                        >
                                            <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
                                            {t("detail.cookAtHome")}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-dark">{t("detail.dietaryTitle")}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{t("detail.dietarySubtitle")}</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {place.dietary.map((item) => (
                                <div key={item.label} className="rounded-xl border border-border bg-card p-3 text-center">
                                    <Leaf className="mx-auto h-5 w-5 text-vegan-green" aria-hidden="true" />
                                    <p className="mt-2 text-sm font-bold text-dark">{item.label}</p>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-xl font-bold text-dark">{t("detail.reviewsTitle")}</h2>
                            <span className="text-xs text-muted-foreground">
                                {t("detail.totalReviews", { count: place.reviewCount })}
                            </span>
                        </div>
                        <div className="mt-4 space-y-3">
                            {place.reviews.map((review) => (
                                <article key={review.id} className="rounded-2xl border border-border bg-card p-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar name={review.author} size="md" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-bold text-dark">{review.author}</p>
                                                {review.badge && (
                                                    <Badge variant="lightgreen" size="sm">
                                                        {review.badge}
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">{review.date}</span>
                                            </div>
                                            <div className="mt-1 flex gap-0.5">
                                                {Array.from({ length: 5 }).map((_, index) => (
                                                    <Star
                                                        key={index}
                                                        className={cn(
                                                            "h-3.5 w-3.5",
                                                            index < review.rating
                                                                ? "fill-amber-soft text-amber-strong"
                                                                : "text-border",
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                ))}
                                            </div>
                                            <p className="mt-2 text-sm italic text-muted-foreground">{review.content}</p>
                                            {review.tip && (
                                                <div className="mt-3 rounded-xl border-l-4 border-lavender-hover bg-lavender px-3 py-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-lavender-strong">
                                                        {t("detail.insiderTip")}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">{review.tip}</p>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={developing}
                                                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-vegan-green"
                                            >
                                                <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                                                {t("detail.helpful")}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <p className="mt-4 flex items-start gap-2 rounded-xl bg-muted-bg px-3 py-2.5 text-xs text-muted-foreground">
                            <BadgeCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-vegan-green" aria-hidden="true" />
                            {t("detail.verifiedNote")}
                        </p>
                    </section>
                </div>

                {/* Sidebar */}
                <aside className="space-y-5">
                    <section className="rounded-2xl border border-border bg-card p-5">
                        <h2 className="font-bold text-dark">{t("detail.locationTitle")}</h2>
                        {/* ponytail: chưa có API/key bản đồ — thumbnail dựng bằng CSS. */}
                        <div className="relative mt-3 h-48 overflow-hidden rounded-xl bg-vegan-green-subtle">
                            <div
                                aria-hidden="true"
                                className="absolute inset-0 opacity-60"
                                style={{
                                    backgroundImage:
                                        "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
                                    backgroundSize: "32px 32px",
                                }}
                            />
                            <div aria-hidden="true" className="absolute left-0 right-0 top-1/2 h-2 bg-lavender-hover/70" />
                            <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-vegan-green text-white shadow-lg">
                                <MapPin className="h-4 w-4" aria-hidden="true" />
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{place.address}</p>
                        <Button variant="outline" className="mt-3 w-full" onClick={developing}>
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            {t("detail.openInMaps")}
                        </Button>
                        <p className="mt-3 text-xs text-muted-foreground">{t("detail.parkingNote")}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{t("detail.transitNote")}</p>
                    </section>

                    <section className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="font-bold text-dark">{t("detail.hoursTitle")}</h2>
                            {place.openNow && <Badge variant="lightgreen">{t("detail.openNowBadge")}</Badge>}
                        </div>
                        <ul className="mt-3 space-y-1.5 text-sm">
                            {place.openingHours.map((item) => (
                                <li
                                    key={item.day}
                                    className={cn(
                                        "flex items-center justify-between gap-3 rounded-lg px-2 py-1",
                                        item.today
                                            ? "bg-vegan-green-light font-semibold text-vegan-green"
                                            : "text-muted-foreground",
                                    )}
                                >
                                    <span>
                                        {item.day}
                                        {item.today && ` (${t("detail.today")})`}
                                    </span>
                                    <span>{item.hours}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="rounded-2xl border border-border bg-card p-5">
                        <h2 className="font-bold text-dark">{t("detail.contactTitle")}</h2>
                        <ul className="mt-3 space-y-1 text-sm">
                            {contacts.map(({ icon: Icon, value }) => (
                                <li key={value}>
                                    <button
                                        type="button"
                                        onClick={developing}
                                        className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left text-muted-foreground transition hover:bg-muted-bg hover:text-vegan-green"
                                    >
                                        <Icon className="h-4 w-4 flex-shrink-0 text-vegan-green" aria-hidden="true" />
                                        <span className="min-w-0 flex-1 truncate">{value}</span>
                                        <ChevronRight className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                </aside>
            </div>
        </div>
    );
}
