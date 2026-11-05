import type { PostAuthorCard } from "./types";

/**
 * Pool tác giả cho card feed + sidebar Post Detail.
 * ponytail: backend chưa trả hồ sơ tác giả (chờ GET /api/profile/{userId}).
 * Xoá file này khi endpoint sẵn sàng — xem `./mockEnrichment.ts`.
 */
const AUTHORS: PostAuthorCard[] = [
    {
        username: "Elena Vance",
        role: "Nutrition Enthusiast",
        bio: "Plant-based home cook exploring fermentation, whole-food proteins, and seasonal produce from the Pacific Northwest.",
        followers: 12_400,
        postCount: 48,
    },
    {
        username: "Chef Marcus Green",
        role: "Culinary Educator",
        bio: "Plant-based culinary educator, passionate about whole-food fermentation, crispy tempeh, and micronutrient density. Sharing recipes from Portland, OR.",
        followers: 10_400,
        postCount: 62,
    },
    {
        username: "Dr. Sarah Lin",
        role: "Clinical Dietitian",
        bio: "Registered dietitian translating nutrition research into everyday plant-based meals. Focus on iron, B12, and complete amino acid pairing.",
        followers: 8_900,
        postCount: 31,
    },
    {
        username: "Maya Kim",
        role: "Recipe Developer",
        bio: "Developing approachable vegan recipes with pantry staples. Obsessed with texture and one-pan dinners.",
        followers: 6_200,
        postCount: 27,
    },
    {
        username: "Julian Roy",
        role: "Home Chef",
        bio: "Slow-food enthusiast cooking mushroom-forward comfort dishes. Farmers market regular.",
        followers: 4_750,
        postCount: 19,
    },
    {
        username: "Clara Bloom",
        role: "Baking Specialist",
        bio: "Dairy-free baking, sourdough, and plant milk chemistry. Testing every ratio so you do not have to.",
        followers: 9_100,
        postCount: 35,
    },
];

/** Chọn tác giả ổn định theo id bài — cùng bài luôn ra cùng người. */
export function getAuthorCard(seed: string): PostAuthorCard {
    return AUTHORS[hash(seed) % AUTHORS.length];
}

export const AUTHOR_COUNT = AUTHORS.length;

/** Băm chuỗi thành số dương — dùng chung cho mọi lựa chọn "ngẫu nhiên nhưng cố định". */
export function hash(input: string): number {
    let value = 0;
    for (let index = 0; index < input.length; index += 1) {
        value = (value * 31 + input.charCodeAt(index)) >>> 0;
    }
    return value;
}
