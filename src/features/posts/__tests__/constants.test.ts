import { describe, expect, it } from "vitest";
import { canPublish, canReject } from "../constants";

describe("canReject / canPublish", () => {
    it("từ chối được bài chờ duyệt và bài đã bị từ chối (để ghi lý do mới)", () => {
        expect(canReject("processed")).toBe(true);
        expect(canReject("unpublished")).toBe(true);
    });

    it("không từ chối bài đã công khai hay còn là nháp", () => {
        expect(canReject("published")).toBe(false);
        expect(canReject("created")).toBe(false);
    });

    it("duyệt được mọi trạng thái trừ published", () => {
        expect(canPublish("published")).toBe(false);
        expect(canPublish("processed")).toBe(true);
        expect(canPublish("unpublished")).toBe(true);
    });
});
