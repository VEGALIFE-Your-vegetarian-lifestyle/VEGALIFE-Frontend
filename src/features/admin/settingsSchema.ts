/**
 * Bản sao `SettingKey` của backend (`service/admin/SettingKey.java`).
 *
 * `GET /api/admin/settings` chỉ trả `{category, key, value, updatedAt}` — **không có type**,
 * nên FE phải biết sẵn kiểu + biên để chọn ô nhập và validate trước khi PATCH. Backend vẫn là
 * chốt cuối: nó chặn đúng các luật dưới đây và trả 400 kèm message.
 */
export type SettingType = "STRING_LIST" | "INT" | "DECIMAL" | "BOOLEAN";

export interface SettingSpec {
    type: SettingType;
    /** INT/DECIMAL */
    min?: number;
    max?: number;
    /** STRING_LIST — danh sách MIME được phép; backend từ chối phần tử lạ. */
    knownValues?: readonly string[];
}

export const SETTING_SPECS: Record<string, SettingSpec> = {
    upload_allowed_image_types: {
        type: "STRING_LIST",
        knownValues: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    },
    upload_allowed_video_types: {
        type: "STRING_LIST",
        knownValues: ["video/mp4", "video/webm", "video/quicktime"],
    },
    max_image_upload_mb: { type: "INT", min: 1, max: 100 },
    max_video_upload_mb: { type: "INT", min: 1, max: 1024 },
    content_filter_enabled: { type: "BOOLEAN" },
    content_filter_accept_threshold: { type: "DECIMAL", min: 0, max: 1 },
    content_filter_reject_threshold: { type: "DECIMAL", min: 0, max: 1 },
    ai_chat_enabled: { type: "BOOLEAN" },
};

/** Backend đòi `reject < accept` (EmbeddingRelevanceScorer); hai key này kiểm chéo nhau. */
export const ACCEPT_THRESHOLD_KEY = "content_filter_accept_threshold";
export const REJECT_THRESHOLD_KEY = "content_filter_reject_threshold";

/** Mã lỗi (không phải câu chữ) — trang dịch qua `admin:settings.errors.*`. */
export type SettingError =
    | { code: "emptyList" }
    | { code: "unknownValue"; values: string }
    | { code: "notInteger" }
    | { code: "notDecimal" }
    | { code: "notBoolean" }
    | { code: "belowMin"; min: number }
    | { code: "aboveMax"; max: number }
    | { code: "rejectNotLessThanAccept" };

function checkBounds(spec: SettingSpec, value: number): SettingError | null {
    if (spec.min !== undefined && value < spec.min) return { code: "belowMin", min: spec.min };
    if (spec.max !== undefined && value > spec.max) return { code: "aboveMax", max: spec.max };
    return null;
}

/** Trả `null` khi hợp lệ. */
export function validateSetting(spec: SettingSpec, raw: string): SettingError | null {
    const value = raw.trim();

    switch (spec.type) {
        case "STRING_LIST": {
            const items = value
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item !== "");
            if (items.length === 0) return { code: "emptyList" };
            const unknown = items.filter((item) => !spec.knownValues?.includes(item));
            return unknown.length > 0 ? { code: "unknownValue", values: unknown.join(", ") } : null;
        }
        case "INT": {
            if (!/^-?\d+$/.test(value)) return { code: "notInteger" };
            return checkBounds(spec, Number(value));
        }
        case "DECIMAL": {
            // Chấp nhận "0.7" lẫn "0,7" (bàn phím VN) — backend chỉ hiểu dấu chấm, nên chuẩn hoá khi gửi.
            if (!/^-?\d*[.,]?\d+$/.test(value)) return { code: "notDecimal" };
            return checkBounds(spec, Number(value.replace(",", ".")));
        }
        case "BOOLEAN":
            return value === "true" || value === "false" ? null : { code: "notBoolean" };
    }
}

/**
 * Validate **toàn bộ** giá trị đã merge (server + bản nháp). Cần cả map vì luật
 * reject < accept so hai key với nhau — validate lẻ từng key sẽ bỏ sót.
 */
export function validateSettings(values: Record<string, string>): Record<string, SettingError> {
    const errors: Record<string, SettingError> = {};

    for (const [key, raw] of Object.entries(values)) {
        const spec = SETTING_SPECS[key];
        if (!spec) continue;
        const error = validateSetting(spec, raw);
        if (error) errors[key] = error;
    }

    const accept = values[ACCEPT_THRESHOLD_KEY];
    const reject = values[REJECT_THRESHOLD_KEY];
    if (
        accept !== undefined &&
        reject !== undefined &&
        !errors[ACCEPT_THRESHOLD_KEY] &&
        !errors[REJECT_THRESHOLD_KEY] &&
        !(Number(reject.replace(",", ".")) < Number(accept.replace(",", ".")))
    ) {
        errors[REJECT_THRESHOLD_KEY] = { code: "rejectNotLessThanAccept" };
    }

    return errors;
}
