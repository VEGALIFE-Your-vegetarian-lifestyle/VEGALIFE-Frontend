import type { SyntheticEvent } from "react";

/** Ảnh dự phòng dùng chung cho card bài/món khi `featuredImageUrl`/`imageUrl` null hoặc lỗi. */
export const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop";

/**
 * `onError` cho `<img>`: BE có bài trỏ vào file đã xoá → ảnh vỡ hiện alt text.
 * Chặn vòng lặp nếu chính ảnh dự phòng cũng lỗi.
 */
export function showFallbackImage(fallback: string = FALLBACK_IMAGE) {
    return (event: SyntheticEvent<HTMLImageElement>) => {
        const image = event.currentTarget;
        if (image.getAttribute("src") !== fallback) image.src = fallback;
    };
}

/**
 * `content` của BE phần lớn là text thuần, nhưng vài bài dán nguyên markdown
 * ("## Nguyên liệu", "- 2 miếng đậu hũ non") → bỏ ký hiệu trước khi hiện trích đoạn.
 */
export function stripMarkdown(text: string): string {
    return text
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`([^`]*)`/g, "$1")
        .replace(/^\s{0,3}#{1,6}\s+/gm, "")
        .replace(/^\s{0,3}>\s?/gm, "")
        .replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
}
