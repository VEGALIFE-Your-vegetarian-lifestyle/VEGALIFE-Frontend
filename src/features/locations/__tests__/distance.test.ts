import { describe, expect, it } from "vitest";
import { distanceKm, formatDistance } from "../geo";

describe("distanceKm", () => {
    it("cùng một điểm thì ra 0", () => {
        expect(distanceKm(10.7769, 106.7009, 10.7769, 106.7009)).toBe(0);
    });

    it("hai điểm trong Quận 1 cách nhau vài trăm mét đến vài km", () => {
        // Nguyễn Huệ -> Lê Thánh Tôn
        const km = distanceKm(10.7742, 106.7039, 10.7795, 106.7055);
        expect(km).toBeGreaterThan(0.3);
        expect(km).toBeLessThan(1);
    });

    it("TP.HCM đến Hà Nội khoảng 1.150 km", () => {
        const km = distanceKm(10.7769, 106.7009, 21.0285, 105.8542);
        expect(km).toBeGreaterThan(1100);
        expect(km).toBeLessThan(1200);
    });

    it("đối xứng: đi và về cùng khoảng cách", () => {
        expect(distanceKm(10.77, 106.7, 10.85, 106.75)).toBeCloseTo(distanceKm(10.85, 106.75, 10.77, 106.7), 10);
    });
});

describe("formatDistance", () => {
    it("dưới 1 km hiện mét", () => {
        expect(formatDistance(0.85)).toBe("850 m");
    });

    it("từ 1 km hiện 1 chữ số thập phân", () => {
        expect(formatDistance(2.44)).toBe("2.4 km");
    });
});
