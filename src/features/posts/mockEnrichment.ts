import type { PostActivity, PostListResponse } from "./types";
import { getAuthorCard, hash } from "./mockAuthors";

/**
 * Điền các field mockup vẽ nhưng backend CHƯA trả ở tầng CARD (tác giả, rating,
 * số bình luận…). Post Detail đã bỏ hết mock — xem `DOCS/MOCK-FIELDS.md`.
 *
 * ponytail: mọi giá trị suy từ `post.id` nên cùng một bài luôn ra cùng số —
 * không nhảy loạn giữa các lần render. Khi BE bổ sung field, xoá file này và
 * cho `postService` trả thẳng response; UI không phải sửa.
 */

/** Nhãn thời gian cho video (mm:ss) — băm ra độ dài 4–18 phút. */
function videoDuration(seed: string): string {
    const totalSeconds = 240 + (hash(`${seed}-dur`) % 840);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function enrichListItem(post: PostListResponse): PostListResponse {
    // Backend bỏ `type`/`videoUrl`; bài có media đính kèm thì coi là có video.
    const hasVideo = post.mediaIds.length > 0;
    // `content` đã là text thuần BE trả sẵn — dùng luôn cho excerpt/card.
    const plain = post.content;
    const words = plain.trim().split(/\s+/).filter(Boolean).length;
    const readMinutes = Math.max(1, Math.round(words / 200));

    return {
        ...post,
        content: plain,
        authorCard: getAuthorCard(post.id),
        durationLabel: hasVideo ? videoDuration(post.id) : `${readMinutes} min read`,
        rating: Number((4.2 + (hash(`${post.id}-rating`) % 8) / 10).toFixed(1)),
        commentCount: hash(`${post.id}-comments`) % 160,
        saveCount: hash(`${post.id}-saves`) % 900,
    };
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
