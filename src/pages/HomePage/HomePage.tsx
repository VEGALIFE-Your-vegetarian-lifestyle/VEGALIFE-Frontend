import { Link } from "react-router-dom";
import {
    ArrowRight,
    Bookmark,
    ChefHat,
    Clock,
    MapPin,
    Play,
    Search,
    Sparkles,
    Star,
    User,
    Utensils,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePublicCategories } from "@/hooks/usePublicCategories";

const HERO_IMAGE = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop";

const RECOMMENDED_IMAGES = [
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679a4?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604382354936-795c7ff397a6?w=800&auto=format&fit=crop",
];

const RECIPE_IMAGES = [
    "https://images.unsplash.com/photo-1511690656952-34342d5c2891?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529006557810-274b9b2fc6b1?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1540420773420-3366772f6b5f?w=800&auto=format&fit=crop",
];

const MASTERCLASS_IMAGES = {
    featured: "https://images.unsplash.com/photo-1505253716362-709628d1c56a?w=1200&auto=format&fit=crop",
    list: [
        "https://images.unsplash.com/photo-1546069901-ba9599a7bbf2?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1610970881739-847f5b9d8c5a?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550617931-e17f7d595f3e?w=800&auto=format&fit=crop",
    ],
};

const SPOT_IMAGES = [
    "https://images.unsplash.com/photo-1559339352-11d035aa65b6?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d2cc?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1563245372-f21724e3856c?w=800&auto=format&fit=crop",
];

const MAP_IMAGE = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop";

const TRUST_METRICS = ["10,000+ Plant Recipes", "450+ Verified Green Spots", "98% Nutrition Accuracy"];

export default function HomePage() {
    const { data: publicCategories, isLoading: isCategoriesLoading, isError: isCategoriesError } = usePublicCategories({
        page: 0,
        size: 10,
        sort: "name,asc",
    });

    const categoryPills = ["All", ...(publicCategories?.content.map((c) => c.name) ?? [])];

    return (
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <section className="relative overflow-hidden bg-surface px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-20">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-vegan-green-muted bg-vegan-green-light px-4 py-1.5 text-xs font-semibold text-vegan-green">
                                <Sparkles className="h-3.5 w-3.5" />
                                {TRUST_METRICS.join(" • ")}
                            </div>
                            <h1 className="text-4xl font-extrabold leading-tight text-dark sm:text-5xl lg:text-6xl">
                                Eat Well. <span className="text-vegan-green">Live Green.</span>
                            </h1>
                            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                                Khám phá công thức nấu ăn thuần thực vật, video ẩm thực, địa điểm ăn chay lân cận và cố vấn
                                dinh dưỡng AI cá nhân hoá.
                            </p>

                            {/* Search */}
                            <div className="flex max-w-md flex-col gap-3 sm:flex-row">
                                <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Tìm công thức, địa điểm, dinh dưỡng..."
                                        className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm text-dark shadow-sm focus:outline-none focus:ring-2 focus:ring-vegan-green"
                                    />
                                </div>
                                <Button>Tìm kiếm</Button>
                            </div>

                            {/* Category pills */}
                            <div className="flex flex-wrap gap-2">
                                {isCategoriesError ? (
                                    <span className="text-xs text-terracotta">Không thể tải danh mục</span>
                                ) : isCategoriesLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <span
                                            key={i}
                                            className="h-6 w-16 animate-pulse rounded-full bg-muted-bg"
                                            aria-hidden="true"
                                        />
                                    ))
                                ) : (
                                    categoryPills.map((pill) => (
                                        <button
                                            key={pill}
                                            type="button"
                                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                pill === "All"
                                                    ? "border-vegan-green bg-vegan-green text-white"
                                                    : "border-border bg-card text-muted-foreground hover:border-vegan-green-muted hover:text-vegan-green"
                                            }`}
                                        >
                                            {pill}
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-vegan-green-light text-xs font-bold text-vegan-green"
                                        >
                                            <User className="h-4 w-4" />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-muted-foreground">Trusted by 42,000+ conscious daily food lovers</p>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
                                <img src={HERO_IMAGE} alt="Colorful vegan bowl with fresh vegetables and grains" className="h-64 w-full object-cover sm:h-80" />
                                <div className="flex items-center justify-between gap-2 bg-card p-5 text-sm">
                                    <div className="text-center">
                                        <p className="font-bold text-dark">420 kcal</p>
                                        <p className="text-xs text-muted-foreground">Calories</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-dark">19g</p>
                                        <p className="text-xs text-muted-foreground">Plant Protein</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-dark">15m</p>
                                        <p className="text-xs text-muted-foreground">Cook Time</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recommended for You */}
            <section id="recommended" className="px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-dark sm:text-3xl">Recommended for You</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Gợi ý cá nhân hoá dựa trên sở thích của bạn</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {["All Highlights", "Quick Meals", "Gut Nutrition"].map((tab) => (
                                <Button key={tab} variant={tab === "All Highlights" ? "primary" : "outline"} size="sm">
                                    {tab}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Article Card */}
                        <article className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
                            <div className="relative h-48">
                                <img
                                    src={RECOMMENDED_IMAGES[0]}
                                    alt="Fresh colorful salad bowl for gut health"
                                    className="h-full w-full object-cover"
                                />
                                <button className="absolute right-3 top-3 rounded-full bg-white/80 p-2 text-dark hover:text-vegan-green">
                                    <Bookmark className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="p-5">
                                <div className="mb-2 flex items-center gap-2">
                                    <Badge variant="lightgreen">Gut Health</Badge>
                                    <span className="text-xs text-muted-foreground">6 min read</span>
                                </div>
                                <h3 className="mb-3 font-bold text-dark">The Fiber-Fueled Gut: Why Plants Win</h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-vegan-green-light text-vegan-green">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-dark">Dr. Sarah Lin</p>
                                        <p className="text-xs text-muted-foreground">1.2k likes</p>
                                    </div>
                                </div>
                            </div>
                        </article>

                        {/* Recipe Card */}
                        <article className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
                            <div className="relative h-48">
                                <img
                                    src={RECOMMENDED_IMAGES[1]}
                                    alt="Creamy avocado and white bean bowl"
                                    className="h-full w-full object-cover"
                                />
                                <button className="absolute right-3 top-3 rounded-full bg-white/80 p-2 text-dark hover:text-vegan-green">
                                    <Bookmark className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="p-5">
                                <div className="mb-2 flex items-center gap-2">
                                    <Badge>Quick 15-Min</Badge>
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" /> 15 min
                                    </span>
                                </div>
                                <h3 className="mb-3 font-bold text-dark">Creamy Avocado & White Bean Bowl</h3>
                                <p className="text-xs text-muted-foreground">by Green Kitchen</p>
                            </div>
                        </article>

                        {/* Video Card */}
                        <article className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
                            <div className="relative h-48">
                                <img
                                    src={RECOMMENDED_IMAGES[2]}
                                    alt="High protein plant based meal prep"
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Play className="h-12 w-12 text-white/80 drop-shadow-md" />
                                </div>
                                <span className="absolute bottom-3 left-3 rounded bg-dark/70 px-2 py-0.5 text-xs text-white">8 mins</span>
                                <button className="absolute right-3 top-3 rounded-full bg-white/80 p-2 text-dark hover:text-vegan-green">
                                    <Bookmark className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="p-5">
                                <Badge variant="cream" className="mb-2">High Protein Plant</Badge>
                                <h3 className="mb-3 font-bold text-dark">Build Muscle on Plants: Top 5 Tips</h3>
                                <p className="text-xs text-muted-foreground">Chef Minh Vegan</p>
                            </div>
                        </article>
                    </div>
                </div>
            </section>

            {/* Popular Vegetarian Recipes */}
            <section id="recipes" className="bg-muted-bg px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 flex items-end justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-dark sm:text-3xl">Popular Vegetarian Recipes</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Bộ sưu tập công thức thịnh hành</p>
                        </div>
                        <a href="#" className="hidden items-center gap-1 text-sm font-bold text-vegan-green hover:underline sm:flex">
                            Browse 10,000+ Recipes <ArrowRight className="h-4 w-4" />
                        </a>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                title: "Mediterranean Super Bowl",
                                time: "25m",
                                kcal: "410 kcal",
                                tags: ["Vegan", "High-Protein"],
                                rating: 4.8,
                                reviews: 124,
                                level: "Easy",
                            },
                            {
                                title: "Spicy Peanut Noodle Stir-Fry",
                                time: "20m",
                                kcal: "380 kcal",
                                tags: ["Vegan", "Spicy"],
                                rating: 4.7,
                                reviews: 89,
                                level: "Medium",
                            },
                            {
                                title: "Grilled Halloumi & Veggie Skewers",
                                time: "30m",
                                kcal: "320 kcal",
                                tags: ["Gluten-Free", "Low-Carb"],
                                rating: 4.6,
                                reviews: 56,
                                level: "Easy",
                            },
                            {
                                title: "Quinoa Stuffed Bell Peppers",
                                time: "40m",
                                kcal: "360 kcal",
                                tags: ["Vegan", "Gluten-Free"],
                                rating: 4.9,
                                reviews: 210,
                                level: "Medium",
                            },
                        ].map((recipe, idx) => (
                            <article key={idx} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
                            <div className="relative h-48">
                                <img
                                    src={RECIPE_IMAGES[idx]}
                                    alt={recipe.title}
                                    className="h-full w-full object-cover"
                                />
                                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-dark">
                                    {recipe.time} • {recipe.kcal}
                                </span>
                                <button className="absolute right-3 top-3 rounded-full bg-white/80 p-2 text-dark hover:text-vegan-green">
                                    <Bookmark className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="mb-2 flex flex-wrap gap-1">
                                    {recipe.tags.map((tag) => (
                                        <span key={tag} className="rounded-full bg-vegan-green-light px-2 py-0.5 text-[10px] font-bold text-vegan-green">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <h3 className="mb-2 font-bold text-dark">{recipe.title}</h3>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-3.5 w-3.5 fill-cream text-terracotta" />
                                        <span className="font-bold text-dark">{recipe.rating}</span>
                                        <span>({recipe.reviews})</span>
                                    </div>
                                    <span>{recipe.level}</span>
                                </div>
                            </div>
                        </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Plant-Based Masterclasses */}
            <section id="masterclasses" className="px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 flex items-end justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-dark sm:text-3xl">Plant-Based Masterclasses</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Video hướng dẫn từ các đầu bếp thực vật</p>
                        </div>
                        <a href="#" className="hidden items-center gap-1 text-sm font-bold text-vegan-green hover:underline sm:flex">
                            View All Videos <ArrowRight className="h-4 w-4" />
                        </a>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="relative overflow-hidden rounded-2xl border border-border bg-card lg:col-span-2 lg:row-span-2">
                            <div className="relative h-64 sm:h-80 lg:h-full">
                                <img
                                    src={MASTERCLASS_IMAGES.featured}
                                    alt="Creamy vegan risotto with fresh herbs"
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Play className="h-16 w-16 text-white/80 drop-shadow-md" />
                                </div>
                                <span className="absolute left-4 top-4 rounded bg-dark/70 px-2 py-1 text-xs text-white">12:45 HD</span>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-dark/80 to-transparent p-6 text-white">
                                    <h3 className="text-xl font-bold">Mastering Umami: The Art of Creamy Vegan Risotto</h3>
                                    <div className="mt-2 flex items-center gap-2 text-sm text-white/90">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-vegan-green-light text-vegan-green">
                                            <ChefHat className="h-4 w-4" />
                                        </div>
                                        <span>Chef Marco Verde</span>
                                        <span className="mx-1">•</span>
                                        <span>128K views</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {[
                            { title: "Tempeh Bacon 101", channel: "Plant Kitchen", duration: "08:20", tag: "Technique" },
                            { title: "Morning Green Smoothie Ritual", channel: "Daily Greens", duration: "05:40", tag: "Daily Ritual" },
                            { title: "Artisanal Nut Cheese Board", channel: "Vegan Artisan", duration: "14:10", tag: "Artisanal" },
                        ].map((video, idx) => (
                            <div key={idx} className="flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-sm">
                                <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-xl">
                                    <img
                                        src={MASTERCLASS_IMAGES.list[idx]}
                                        alt={video.title}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Play className="h-8 w-8 text-white/80 drop-shadow-sm" />
                                    </div>
                                    <span className="absolute bottom-1 left-1 rounded bg-dark/70 px-1 text-[10px] text-white">{video.duration}</span>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <span className="mb-1 w-fit rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-dark">{video.tag}</span>
                                    <h4 className="line-clamp-2 text-sm font-bold text-dark">{video.title}</h4>
                                    <p className="mt-1 text-xs text-muted-foreground">{video.channel}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Nearby Green Spots */}
            <section id="nearby" className="bg-muted-bg px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 flex items-end justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-dark sm:text-3xl">Nearby Green Spots</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Địa điểm ăn chay lân cận</p>
                        </div>
                        <button className="flex items-center gap-1 text-sm font-bold text-vegan-green hover:underline">
                            Open Full Interactive Map <span className="text-lg">◱</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="relative h-80 overflow-hidden rounded-2xl border border-border bg-vegan-green-light lg:col-span-1">
                            <img
                                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop"
                                alt="Vegan cafe interior"
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark/80 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                <p className="font-bold">32 Spots near Downtown Hub</p>
                                <p className="text-sm text-white/80">Mini Map Preview</p>
                            </div>
                        </div>

                        <div className="space-y-4 lg:col-span-2">
                            {[
                                {
                                    name: "Green Leaf Bistro",
                                    distance: "0.8 km",
                                    rating: 4.7,
                                    reviews: 214,
                                    price: "$$",
                                    type: "Nhà hàng",
                                    badges: ["100% Vegan", "Organic Certified"],
                                },
                                {
                                    name: "Sunshine Juicery",
                                    distance: "1.2 km",
                                    rating: 4.5,
                                    reviews: 98,
                                    price: "$",
                                    type: "Quán nước/Juicery",
                                    badges: ["Zero-Waste", "Outdoor Garden"],
                                },
                                {
                                    name: "Bamboo Noodle Bar",
                                    distance: "2.1 km",
                                    rating: 4.8,
                                    reviews: 156,
                                    price: "$$",
                                    type: "Noodle Bar",
                                    badges: ["100% Vegan", "Organic Certified"],
                                },
                            ].map((spot, idx) => (
                                <div key={idx} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-4">
                                        <img
                                            src={SPOT_IMAGES[idx]}
                                            alt={spot.name}
                                            className="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
                                        />
                                        <div>
                                            <h4 className="font-bold text-dark">{spot.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {spot.type} • {spot.distance} • {spot.price}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {spot.badges.map((badge) => (
                                                    <span key={badge} className="rounded-full bg-vegan-green-light px-2 py-0.5 text-[10px] font-bold text-vegan-green">
                                                        {badge}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Star className="h-4 w-4 fill-cream text-terracotta" />
                                            <span className="font-bold text-dark">{spot.rating}</span>
                                            <span>({spot.reviews})</span>
                                        </div>
                                        <Button size="sm" variant="outline">View Menu</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Nutrition Banner */}
            <section id="ai-nutrition" className="bg-vegan-green px-4 py-16 text-white sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
                        <div className="space-y-5">
                            <h2 className="text-3xl font-bold sm:text-4xl">Personalized Vegetarian Nutrition at Your Fingertips</h2>
                            <p className="text-white/90">
                                Tính toán protein, calo và gợi ý thực đơn thích ứng theo nhu cầu sinh học của bạn.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    "How to hit 75g protein daily without whey?",
                                    "Egg substitutes for baking soft cookies",
                                    "Plant sources high in bioavailable iron",
                                ].map((prompt) => (
                                    <span key={prompt} className="cursor-pointer rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs transition hover:bg-white/20">
                                        {prompt}
                                    </span>
                                ))}
                            </div>
                            <Link to="#">
                                <Button variant="cream" size="lg">
                                    <Sparkles className="h-4 w-4" /> Chat with AI Dietitian
                                </Button>
                            </Link>
                            <p className="text-xs text-white/70">Free forever • Powered by Evidence-Based Nutritional Science</p>
                        </div>
                        <div className="hidden items-center justify-center lg:flex">
                            <div className="flex h-64 w-64 items-center justify-center rounded-full bg-white/10">
                                <Sparkles className="h-24 w-24 text-white/40" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
