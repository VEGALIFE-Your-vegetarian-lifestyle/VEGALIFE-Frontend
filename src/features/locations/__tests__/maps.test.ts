import { afterEach, describe, expect, it, vi } from "vitest";
import { buildDirectionsUrl, openDirections, searchAddresses } from "../geo";

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

/** Photon trả GeoJSON — `[lng, lat]` đúng thứ tự này, đừng đảo. */
const feature = (properties: Record<string, unknown>, coords: [number, number]) => ({
    properties,
    geometry: { type: "Point", coordinates: coords },
});

describe("searchAddresses", () => {
    afterEach(() => vi.restoreAllMocks());

    it("query ngắn hơn 3 ký tự thì không gọi mạng", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch");
        await expect(searchAddresses("Q1")).resolves.toEqual([]);
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("lọc ngoài Việt Nam, đảo đúng thứ tự toạ độ, đánh dấu kết quả không phải số nhà", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({
                features: [
                    feature({ countrycode: "VN", housenumber: "12", street: "Nguyễn Huệ", district: "Quận 1", city: "Hồ Chí Minh", type: "house" }, [106.7039, 10.7742]),
                    // Cùng địa chỉ nhưng chỉ tới cấp đường → `approximate`.
                    feature({ countrycode: "VN", street: "Nguyễn Huệ", city: "Hồ Chí Minh", type: "street" }, [106.704, 10.774]),
                    feature({ countrycode: "TH", name: "Bangkok", type: "city" }, [100.5, 13.7]),
                ],
            }),
        } as Response);

        const hits = await searchAddresses("12 Nguyễn Huệ, Quận 1");

        expect(hits).toHaveLength(2);
        expect(hits[0]).toMatchObject({ lat: 10.7742, lng: 106.7039, approximate: false });
        expect(hits[0].address).toContain("12");
        expect(hits[0].address).toContain("Nguyễn Huệ");
        expect(hits[1]).toMatchObject({ approximate: true });
        expect(hits.every((hit) => hit.address.includes("Hồ Chí Minh"))).toBe(true);
    });

    it("userId không có trong query gửi lên — chỉ q/limit/lang", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ features: [] }),
        } as Response);

        await searchAddresses("Chợ Bến Thành");
        const url = new URL(String(fetchSpy.mock.calls[0][0]));
        expect(url.origin + url.pathname).toBe("https://photon.komoot.io/api/");
        expect(url.searchParams.get("q")).toBe("Chợ Bến Thành");
        expect(url.searchParams.get("lang")).toBe("en");
    });

    it("HTTP lỗi thì ném ra để UI hiện thông báo", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 503, json: async () => ({}) } as Response);
        await expect(searchAddresses("Chợ Bến Thành")).rejects.toThrow("Photon 503");
    });
});
