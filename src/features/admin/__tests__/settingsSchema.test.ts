import { describe, expect, it } from "vitest";
import { SETTING_SPECS, validateSetting, validateSettings } from "../settingsSchema";

const spec = SETTING_SPECS.max_image_upload_mb;

describe("validateSetting", () => {
    it("INT: chặn số lẻ và giá trị ngoài biên 1–100", () => {
        expect(validateSetting(spec, "5")).toBeNull();
        expect(validateSetting(spec, "1")).toBeNull();
        expect(validateSetting(spec, "100")).toBeNull();
        expect(validateSetting(spec, "0")).toEqual({ code: "belowMin", min: 1 });
        expect(validateSetting(spec, "101")).toEqual({ code: "aboveMax", max: 100 });
        expect(validateSetting(spec, "5.5")).toEqual({ code: "notInteger" });
        expect(validateSetting(spec, "")).toEqual({ code: "notInteger" });
    });

    it("DECIMAL: nhận dấu phẩy của bàn phím VN", () => {
        const decimal = SETTING_SPECS.content_filter_accept_threshold;
        expect(validateSetting(decimal, "0.7")).toBeNull();
        expect(validateSetting(decimal, "0,7")).toBeNull();
        expect(validateSetting(decimal, "1.2")).toEqual({ code: "aboveMax", max: 1 });
        expect(validateSetting(decimal, "abc")).toEqual({ code: "notDecimal" });
    });

    it("STRING_LIST: rỗng và MIME lạ đều bị chặn", () => {
        const list = SETTING_SPECS.upload_allowed_image_types;
        expect(validateSetting(list, "image/png, image/jpeg")).toBeNull();
        expect(validateSetting(list, " , ")).toEqual({ code: "emptyList" });
        expect(validateSetting(list, "image/png,application/pdf")).toEqual({
            code: "unknownValue",
            values: "application/pdf",
        });
    });

    it("BOOLEAN: chỉ nhận true/false", () => {
        const bool = SETTING_SPECS.ai_chat_enabled;
        expect(validateSetting(bool, "true")).toBeNull();
        expect(validateSetting(bool, "false")).toBeNull();
        expect(validateSetting(bool, "yes")).toEqual({ code: "notBoolean" });
    });
});

describe("validateSettings", () => {
    it("chặn reject >= accept đọc từ giá trị đã merge", () => {
        const errors = validateSettings({
            content_filter_accept_threshold: "0.5",
            content_filter_reject_threshold: "0.5",
        });

        expect(errors.content_filter_reject_threshold).toEqual({ code: "rejectNotLessThanAccept" });
    });

    it("reject < accept hợp lệ thì không báo lỗi", () => {
        const errors = validateSettings({
            content_filter_accept_threshold: "0.7",
            content_filter_reject_threshold: "0.45",
        });

        expect(errors).toEqual({});
    });

    it("không báo lỗi cross-key khi một vế tự nó đã sai kiểu", () => {
        const errors = validateSettings({
            content_filter_accept_threshold: "abc",
            content_filter_reject_threshold: "0.5",
        });

        expect(errors.content_filter_accept_threshold).toEqual({ code: "notDecimal" });
        expect(errors.content_filter_reject_threshold).toBeUndefined();
    });

    it("bỏ qua key không có trong registry (backend thêm key mới)", () => {
        expect(validateSettings({ some_future_key: "anything" })).toEqual({});
    });
});
