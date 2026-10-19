import { afterEach, describe, expect, it, vi } from "vitest";
import { buildDirectionsUrl, openDirections } from "@/utils/maps";

const place = { address: "12 Nguyễn Huệ, Quận 1, TP.HCM", latitude: 10.7742, longitude: 106.7039 };

describe("buildDirectionsUrl", () => {
    it("dùng địa chỉ chữ làm đích và vị trí người dùng làm điểm xuất phát", () => {
        const url = new URL(buildDirectionsUrl(place, { lat: 10.7769, lng: 106.7009 }));
        expect(url.origin + url.pathname).toBe("https://www.google.com/maps/dir/");
        expect(url.searchParams.get("api")).toBe("1");
        expect(url.searchParams.get("origin")).toBe("10.7769,106.7009");
        expect(url.searchParams.get("destination")).toBe("12 Nguyễn Huệ, Quận 1, TP.HCM");
    });

    it("không có địa chỉ thì dùng tọa độ, không có origin thì bỏ origin", () => {
        const url = new URL(buildDirectionsUrl({ latitude: 10.7742, longitude: 106.7039 }));
        expect(url.searchParams.get("destination")).toBe("10.7742,106.7039");
        expect(url.searchParams.has("origin")).toBe(false);
    });
});

describe("openDirections", () => {
    afterEach(() => vi.restoreAllMocks());

    it("mở tab mới với noopener", () => {
        const open = vi.spyOn(window, "open").mockReturnValue(null);
        openDirections(place);
        expect(open).toHaveBeenCalledWith(buildDirectionsUrl(place), "_blank", "noopener,noreferrer");
    });
});
