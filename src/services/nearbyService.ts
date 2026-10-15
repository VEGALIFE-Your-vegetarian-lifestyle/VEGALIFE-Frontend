import { getLocationById } from "@/services/locationService";
import type { NearbyPlaceDetail } from "@/types/nearby";
import { formatOpeningHours, isOpenNow } from "@/utils/openingHours";

const IMG = {
    bistro: "https://images.unsplash.com/photo-1559339352-11d035aa65b6?w=800&auto=format&fit=crop",
    cafe: "https://images.unsplash.com/photo-1498837167922-ddd27525d2cc?w=800&auto=format&fit=crop",
    kitchen: "https://images.unsplash.com/photo-1563245372-f21724e3856c?w=800&auto=format&fit=crop",
    market: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop",
    wild: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop",
};

/**
 * ponytail: các khối chưa có trong DB (mô tả, ảnh, món nổi bật, đánh giá, tiện ích) dùng chung mẫu này cho mọi địa điểm,
 * chờ backend bổ sung. Thông tin thật (tên, địa chỉ, tọa độ, điện thoại, website, rating, mức giá) lấy từ `locationService`.
 */
const DETAIL_TEMPLATE: Omit<NearbyPlaceDetail, "id" | "name" | "address" | "category" | "coordinates"> = {
    rating: 4.5,
    reviewCount: 0,
    priceLevel: "",
    tags: [],
    imageUrl: IMG.bistro,
    isVerified: false,
    description:
        "Founded in 2021 in the heart of Portland's Pearl District, Green Sprout Bistro is dedicated to reimagining compassionate, mindful eating without sacrificing depth, texture, or indulgence. We believe that whole-food plant nutrition is the most vibrant way to fuel human health and heal our living biosphere.\n\nEvery single sauce, nut creamer, and grain flour is prepared from scratch in our open kitchen. We partner exclusively with Willamette Valley organic growers, harvesting seasonal greens and wild Pacific Northwest mushrooms at their nutritional peak. No hydrogenated oils, zero synthetic preservatives, and zero animal exploitation.",
    // Giờ mở cửa thật lấy từ địa điểm; chưa có thì để trống.
    openNow: false,
    openingHours: [],
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
};

/** GET location detail — dữ liệu thật từ `locationService`, phần còn lại là mẫu mock. */
export async function getNearbyPlaceDetail(id: string): Promise<NearbyPlaceDetail> {
    const location = await getLocationById(id);
    return {
        ...DETAIL_TEMPLATE,
        id: location.id,
        name: location.name,
        address: location.address,
        category: location.placeType,
        coordinates: { lat: location.latitude, lng: location.longitude },
        phone: location.phoneNumber ?? "—",
        website: location.websiteUrl ?? "—",
        rating: location.rating ?? DETAIL_TEMPLATE.rating,
        priceLevel: location.priceLevel ? "$".repeat(location.priceLevel) : "—",
        ...(location.openingHours
            ? {
                  openingHours: formatOpeningHours(location.openingHours),
                  openNow: isOpenNow(location.openingHours),
              }
            : {}),
    };
}
