import i18n from "@/i18n";

/**
 * Ngày dạng ngắn theo locale UI. Mặc định lấy ngôn ngữ hiện tại của i18n —
 * chỗ gọi chỉ cần truyền `language` khi muốn ghi đè.
 */
export function formatDateLocale(iso: string, language: string = i18n.language): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/** Ước lượng thời gian đọc từ nội dung — 200 từ/phút. */
export function estimateReadMinutes(content: string): number {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
}
