import type { NearbyPlace, NearbyPlaceDetail } from "@/types/nearby";
import { delay } from "@/utils/delay";

const IMG = {
    bistro: "https://images.unsplash.com/photo-1559339352-11d035aa65b6?w=800&auto=format&fit=crop",
    cafe: "https://images.unsplash.com/photo-1498837167922-ddd27525d2cc?w=800&auto=format&fit=crop",
    kitchen: "https://images.unsplash.com/photo-1563245372-f21724e3856c?w=800&auto=format&fit=crop",
    market: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop",
    wild: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop",
};

const PLACES: NearbyPlace[] = [
    {
        id: "loc-01",
        name: "Green Sprout Bistro",
        category: "restaurant",
        address: "824 NW 12th Ave, Pearl District",
        district: "Pearl District",
        distanceKm: 0.4,
        rating: 4.9,
        reviewCount: 240,
        priceLevel: "$$ - Moderate",
        tags: ["Organic", "Gluten-Free Options", "Dine-in"],
        imageUrl: IMG.bistro,
        isVerified: true,
        recipeMatch: "Tofu Bowl",
    },
    {
        id: "loc-02",
        name: "Pure Harmony Plant Cafe",
        category: "cafe",
        address: "1420 SE Belmont St",
        district: "Belmont",
        distanceKm: 0.8,
        rating: 4.8,
        reviewCount: 185,
        priceLevel: "$ - Budget",
        tags: ["Cold-Pressed Juices", "Sourdough", "Vegan Bakery"],
        imageUrl: IMG.cafe,
        isVerified: true,
    },
    {
        id: "loc-03",
        name: "Root & Bloom Kitchen",
        category: "restaurant",
        address: "608 SW Broadway",
        district: "Downtown",
        distanceKm: 1.2,
        rating: 4.7,
        reviewCount: 310,
        priceLevel: "$$ - Moderate",
        tags: ["Farm-to-Table", "Tempeh Specialties", "Zero Waste"],
        imageUrl: IMG.kitchen,
        isVerified: true,
    },
    {
        id: "loc-04",
        name: "Terra Madre Organics",
        category: "market",
        address: "2315 NE Alberta St",
        district: "Alberta Arts",
        distanceKm: 1.9,
        rating: 4.9,
        reviewCount: 95,
        priceLevel: "$$ - Moderate",
        tags: ["Bulk Grains", "House-Made Tofu", "Fresh Produce"],
        imageUrl: IMG.market,
        isVerified: true,
    },
    {
        id: "loc-05",
        name: "Wild Fern Plant Kitchen",
        category: "restaurant",
        address: "3108 SE Division St",
        district: "Division",
        distanceKm: 2.5,
        rating: 4.6,
        reviewCount: 142,
        priceLevel: "$$ - Moderate",
        tags: ["Comfort Food", "Vegan Brunch", "Casual"],
        imageUrl: IMG.wild,
        isVerified: false,
    },
];

const DETAIL: NearbyPlaceDetail = {
    ...PLACES[0],
    description:
        "Founded in 2021 in the heart of Portland's Pearl District, Green Sprout Bistro is dedicated to reimagining compassionate, mindful eating without sacrificing depth, texture, or indulgence. We believe that whole-food plant nutrition is the most vibrant way to fuel human health and heal our living biosphere.\n\nEvery single sauce, nut creamer, and grain flour is prepared from scratch in our open kitchen. We partner exclusively with Willamette Valley organic growers, harvesting seasonal greens and wild Pacific Northwest mushrooms at their nutritional peak. No hydrogenated oils, zero synthetic preservatives, and zero animal exploitation.",
    openNow: true,
    openingHours: [
        { day: "Monday", hours: "11:00 AM - 9:00 PM" },
        { day: "Tuesday", hours: "11:00 AM - 9:00 PM", today: true },
        { day: "Wednesday", hours: "11:00 AM - 9:00 PM" },
        { day: "Thursday", hours: "11:00 AM - 10:00 PM" },
        { day: "Friday", hours: "11:00 AM - 10:00 PM" },
        { day: "Saturday", hours: "10:00 AM - 10:00 PM" },
        { day: "Sunday", hours: "10:00 AM - 9:00 PM" },
    ],
    phone: "(503) 555-0192",
    email: "greensproutbistro.com",
    website: "@greensproutbistro",
    gallery: [IMG.bistro, IMG.cafe, IMG.kitchen],
    popularDishes: [
        {
            name: "Crispy Air-Fried Sesame Tofu Bowl",
            description:
                "House-pressed non-GMO organic tofu, toasted white & black sesame crust, edamame ribbons, scallion crunch.",
            price: "$14.60",
            tags: ["100% Vegan", "Gluten-Free", "23g Protein"],
            imageUrl: IMG.bistro,
        },
        {
            name: "Smoked Tempeh Truffle Burger",
            description:
                "House-cultured organic soy & flax tempeh patty, Oregon black truffle cashew aioli, pickled heirloom onions.",
            price: "$16.00",
            tags: ["100% Vegan", "Nut-Free Bun", "28g Protein"],
            imageUrl: IMG.kitchen,
        },
        {
            name: "Wild Forest Mushroom Bourguignon",
            description:
                "Slow-simmered Pacific chanterelles and porcini in Oregon Pinot Noir reduction, over whipped parsnip.",
            price: "$17.80",
            tags: ["100% Vegan", "Gluten-Free", "Anti-Inflammatory"],
            imageUrl: IMG.wild,
        },
        {
            name: "Golden Glow Turmeric Rice Bowl",
            description:
                "Steamed organic California brown rice infused with fresh turmeric root, warm edamame, shaved rainbow carrots.",
            price: "$13.50",
            tags: ["100% Vegan", "Gluten-Free", "Gut-Health Friendly"],
            imageUrl: IMG.cafe,
        },
    ],
    dietary: [
        { label: "100% Dairy-Free", description: "Dedicated dairy-free production line" },
        { label: "Peanut-Free", description: "100% peanut-free kitchen certified" },
        { label: "GF Options", description: "Dedicated gluten-safe preparation zone" },
        { label: "Non-GMO Verified", description: "All soy and grain inputs tested" },
    ],
    reviews: [
        {
            id: "rev-01",
            author: "Maya K.",
            badge: "Plant-based eater for 6 years",
            date: "Visited 3 days ago",
            rating: 5,
            content:
                "\"Hands down the best house-pressed tofu in the entire city of Portland. The crispness on the outside without excess oil is pure mastery. Definitely get the community turmeric bowl!\"",
            tip: "Ask for extra chili sesame crisp on the side.",
        },
        {
            id: "rev-02",
            author: "David R.",
            badge: "VEGALIFE Verified Ambassador",
            date: "Visited last week",
            rating: 4,
            content:
                "\"The cashew dressing is extraordinary. It feels like fine-dining level emulsion technique applied to clean, unadulterated botanical ingredients. Patio seating fills up quickly around 6:30 PM.\"",
            tip: "Outdoor patio is dog-friendly and heated in cooler months.",
        },
        {
            id: "rev-03",
            author: "Sarah L.",
            badge: "Gluten-Free Vegan",
            date: "Visited 2 weeks ago",
            rating: 5,
            content:
                "\"Finding authentic celiac-safe mushroom bourguignon felt like a dream. Rich, unctuous wine reduction without any wheat thickeners. Staff was knowledgeable about every single ingredient.\"",
        },
    ],
    coordinates: { lat: 45.5265, lng: -122.6821 },
};

/** GET nearby places — MOCK, chờ backend. */
export async function getNearbyPlaces(params: { category?: NearbyPlace["category"] | "all"; q?: string } = {}) {
    await delay();
    const keyword = params.q?.trim().toLowerCase() ?? "";
    const items = PLACES.filter((place) => {
        if (params.category && params.category !== "all" && place.category !== params.category) return false;
        if (!keyword) return true;
        return `${place.name} ${place.address} ${place.tags.join(" ")}`.toLowerCase().includes(keyword);
    }).sort((a, b) => a.distanceKm - b.distanceKm);

    return { data: items, total: items.length };
}

/** GET location detail — MOCK, chờ backend. */
export async function getNearbyPlaceDetail(id: string): Promise<NearbyPlaceDetail> {
    await delay();
    const base = PLACES.find((place) => place.id === id);
    if (!base) throw new Error("Location not found");
    return { ...DETAIL, ...base };
}
