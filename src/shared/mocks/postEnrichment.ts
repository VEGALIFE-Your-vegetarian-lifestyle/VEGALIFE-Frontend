import { parseStoredContent } from "@/components/editor/editorContent";
import type {
    PostActivity,
    PostComment,
    PostDetailResponse,
    PostIngredientGroup,
    PostListResponse,
    PostNutrition,
    PostStep,
} from "@/types/post";
import { getAuthorCard, hash } from "./authors";

/**
 * Điền các field mockup vẽ nhưng backend CHƯA trả (macro, nguyên liệu, bước nấu,
 * rating, comment, followers…).
 *
 * ponytail: mọi giá trị suy từ `post.id` nên cùng một bài luôn ra cùng số —
 * không nhảy loạn giữa các lần render. Khi BE bổ sung field, xoá file này và
 * cho `postService` trả thẳng response; UI không phải sửa.
 */

const DIFFICULTIES = ["Easy", "Medium", "Advanced"];

/** Nhãn thời gian cho video (mm:ss) — băm ra độ dài 4–18 phút. */
function videoDuration(seed: string): string {
    const totalSeconds = 240 + (hash(`${seed}-dur`) % 840);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function enrichListItem(post: PostListResponse): PostListResponse {
    const isVideo = post.type === "video";
    // `content` đã là text thuần BE trả sẵn — dùng luôn cho excerpt/card.
    const plain = post.content;
    const words = plain.trim().split(/\s+/).filter(Boolean).length;
    const readMinutes = Math.max(1, Math.round(words / 200));

    return {
        ...post,
        content: plain,
        authorCard: getAuthorCard(post.id),
        durationLabel: isVideo ? videoDuration(post.id) : `${readMinutes} min read`,
        rating: Number((4.2 + (hash(`${post.id}-rating`) % 8) / 10).toFixed(1)),
        commentCount: hash(`${post.id}-comments`) % 160,
        saveCount: hash(`${post.id}-saves`) % 900,
    };
}

function buildNutrition(seed: string): PostNutrition {
    const base = hash(`${seed}-nutri`);
    return {
        calories: 320 + (base % 260),
        proteinG: 12 + (base % 18),
        carbsG: 28 + (base % 26),
        fatG: 8 + (base % 14),
        fiberG: 6 + (base % 9),
    };
}

function buildIngredients(seed: string): PostIngredientGroup[] {
    return [
        {
            title: "For the base",
            items: [
                { quantity: "300g", name: "Organic non-GMO tempeh, cubed" },
                { quantity: "1 tbsp", name: "Toasted sesame oil" },
                { quantity: "2 tbsp", name: "Gluten-free tamari sauce" },
                { quantity: "1 cup", name: "Steamed brown jasmine rice" },
            ],
        },
        {
            title: "For the sauce",
            items: [
                { quantity: "1/3 cup", name: "Creamy lime peanut drizzle" },
                { quantity: "1 tsp", name: "Freshly grated ginger" },
                { quantity: "1 clove", name: "Garlic, finely minced" },
                { quantity: "1 tsp", name: "Maple syrup" },
            ],
        },
        {
            title: "To finish",
            items: [
                { quantity: "1 cup", name: "Fresh broccoli florets, lightly steamed" },
                { quantity: "2 tbsp", name: "Toasted sesame seeds" },
                { quantity: "1", name: "Avocado, sliced" },
            ],
        },
    ].slice(0, 2 + (hash(`${seed}-ing`) % 2));
}

function buildSteps(seed: string): PostStep[] {
    const offset = hash(`${seed}-steps`) % 5;
    return [
        {
            title: "Press & Cube Tofu",
            body: "Wrap the tofu block securely in clean kitchen towels or unbleached paper towels. Set a heavy cast-iron skillet on top for 15 minutes to press out excess moisture. Once pressed, cut into uniform 2 cm (3/4 inch) bite-sized cubes.",
            timestamp: `${5 + offset} Mins`,
        },
        {
            title: "Marinate in Tamari Glaze",
            body: "In a shallow bowl, whisk together the tamari soy sauce, toasted sesame oil, and a dash of grated garlic. Gently fold in the tofu cubes, coating to cover every surface evenly. Allow the cubes to absorb the rich savory infusion for 5 minutes.",
            timestamp: `${10 + offset} Mins`,
        },
        {
            title: "Cook & Air-Fry at 200°C",
            body: "Spread the marinated cubes evenly across the perforated basket and toss lightly until coated. Set the air fryer to 200°C (400°F). Spread the cubes in a single layer to ensure even crisping. Cook for 14 minutes, shaking the basket halfway through.",
            timestamp: `${12 + offset} Mins`,
        },
        {
            title: "Assemble Quinoa Bowl & Garnish",
            body: "Spoon the fluffy warm quinoa into wide bowls. Arrange the crispy golden cubes, steamed broccoli florets, creamy avocado slices, and shredded cucumbers in sections. Finish with a generous sprinkle of toasted sesame seeds and fresh scallions.",
            timestamp: `${3 + offset} Mins`,
        },
    ];
}

export function enrichDetail(post: PostListResponse): PostDetailResponse {
    return {
        ...enrichListItem(post),
        // `rawContent` là object JSON ProseMirror; bài cũ không có → null.
        contentJson: post.contentJson ?? parseStoredContent(post.rawContent),
        nutrition: buildNutrition(post.id),
        ingredientGroups: buildIngredients(post.id),
        steps: buildSteps(post.id),
        servings: 2 + (hash(`${post.id}-serv`) % 3),
        difficulty: DIFFICULTIES[hash(`${post.id}-diff`) % DIFFICULTIES.length],
        prepTimeMinutes: 15 + (hash(`${post.id}-prep`) % 20),
        chefTip:
            "For that glass-shatter crunch, toss the tofu in cornstarch right before dropping into the air fryer basket. Do not let cornstarch sit on wet tofu for too long before frying, or it will turn pasty instead of crisp.",
    };
}

const COMMENT_POOL: Omit<PostComment, "id">[] = [
    {
        author: "Elena Vance",
        badge: "Author",
        date: "2 days ago",
        content: "Made this for a quick post-gym dinner. The cornstarch trick is unbelievable. Even my partner who usually avoids tofu asked for seconds.",
        likes: 24,
        isAuthor: true,
    },
    {
        author: "Nina Patel",
        badge: "Community Member",
        date: "3 days ago",
        content: "Swapped the peanut drizzle for tahini because of a nut allergy and it still worked beautifully. Noted it for anyone else in the same boat.",
        likes: 18,
        tip: "Tahini needs a splash more water to reach the same pourable consistency.",
    },
    {
        author: "David R.",
        badge: "Verified Ambassador",
        date: "1 week ago",
        content: "The tamari marinade is doing a lot of heavy lifting here. I let mine sit for 20 minutes instead of 5 and the depth was noticeably better.",
        likes: 41,
    },
    {
        author: "Sarah L.",
        date: "1 week ago",
        content: "Followed it exactly and got a great crust on the first try. The temperature cue at 200°C is spot on for my air fryer.",
        likes: 12,
    },
    {
        author: "Tomas Alvarez",
        date: "2 weeks ago",
        content: "Great base recipe. I added a handful of pickled red onion at the end for acidity and it balanced the sesame really well.",
        likes: 9,
        tip: "Quick-pickle the onion in lime juice while the tofu air-fries.",
    },
];

export function getMockComments(postId: string): PostComment[] {
    const count = 3 + (hash(`${postId}-cmt`) % 3);
    return COMMENT_POOL.slice(0, count).map((comment, index) => ({
        ...comment,
        id: `${postId}-cmt-${index}`,
    }));
}

const ACTIVITY_POOL: Omit<PostActivity, "id">[] = [
    { kind: "upvote", title: "Upvoted “Creamy Coconut Spinach & Chickpea Curry” by Elena Vance", date: "2 days ago" },
    {
        kind: "comment",
        title: "Left a comment on “Silken Tofu Berry Breakfast Smoothie”",
        detail: "Adding 1 tbsp chia seeds gives this the perfect consistency!",
        date: "4 days ago",
    },
    { kind: "save", title: "Saved “Smoky Maple Glazed Tofu Steaks” to your recipe collection", date: "1 week ago" },
];

export function getMockActivity(seed: string): PostActivity[] {
    return ACTIVITY_POOL.map((item, index) => ({ ...item, id: `${seed}-act-${index}` }));
}
