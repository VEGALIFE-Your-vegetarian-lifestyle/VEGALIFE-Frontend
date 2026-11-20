/** Tiền trong dashboard luôn là **đồng nguyên** (VND không có phần lẻ) — đừng chia 100. */
export function formatVnd(amount: number, language: string, currency = "VND"): string {
    return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

/** 1186 giờ → "49 ngày". Backend trả giờ nguyên, chỉ cần bậc thô nhất. */
export function formatHoursAge(hours: number, language: string): string {
    const vi = language === "vi";
    if (hours < 1) return vi ? "dưới 1 giờ" : "under 1 hour";
    if (hours < 48) return vi ? `${hours} giờ` : `${hours} hours`;
    return vi ? `${Math.floor(hours / 24)} ngày` : `${Math.floor(hours / 24)} days`;
}

/** `0.93717` → `"93,7%"` / `"93.7%"`. Rate backend đã là 0..1. */
export function formatRate(rate: number, language: string): string {
    return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
        style: "percent",
        maximumFractionDigits: 1,
    }).format(rate);
}
