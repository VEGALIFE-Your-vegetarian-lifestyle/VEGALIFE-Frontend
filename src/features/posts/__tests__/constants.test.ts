import { describe, expect, it } from "vitest";
import { canPublish, canReject } from "../constants";

describe("canReject / canPublish", () => {
    it("chỉ bài đang chờ duyệt mới từ chối được", () => {
        expect(canReject("processing")).toBe(true);
        expect(canReject("unpublished")).toBe(false);
        expect(canReject("published")).toBe(false);
        expect(canReject("drafted")).toBe(false);
    });

    it("chỉ bài đang chờ duyệt mới duyệt được", () => {
        expect(canPublish("processing")).toBe(true);
        expect(canPublish("unpublished")).toBe(false);
        expect(canPublish("published")).toBe(false);
        expect(canPublish("drafted")).toBe(false);
    });
});
