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

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 365 * 24 * 3600],
    ["month", 30 * 24 * 3600],
    ["day", 24 * 3600],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
];

/**
 * "2 hours ago" / "2 giờ trước" bằng `Intl.RelativeTimeFormat` (có sẵn, không cần thư viện).
 * Ngày hỏng trả chuỗi rỗng để chỗ gọi `&&`.
 */
export function formatRelativeTime(iso: string, language: string = i18n.language): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    const diffSeconds = (date.getTime() - Date.now()) / 1000;
    const rtf = new Intl.RelativeTimeFormat(language === "vi" ? "vi" : "en", { numeric: "auto" });

    for (const [unit, seconds] of RELATIVE_UNITS) {
        if (Math.abs(diffSeconds) >= seconds) {
            return rtf.format(Math.round(diffSeconds / seconds), unit);
        }
    }
    return rtf.format(0, "second");
}
