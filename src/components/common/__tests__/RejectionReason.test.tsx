import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RejectionReason } from "@/components/common/RejectionReason";
import "@/i18n";

describe("RejectionReason", () => {
    it("hiện lý do admin nhập", () => {
        render(<RejectionReason reason="Thiếu nguồn trích dẫn dinh dưỡng." />);
        expect(screen.getByText("Thiếu nguồn trích dẫn dinh dưỡng.")).toBeInTheDocument();
    });

    it("null / chuỗi rỗng / toàn khoảng trắng → không render gì", () => {
        for (const reason of [null, undefined, "", "   "]) {
            const { container, unmount } = render(<RejectionReason reason={reason} />);
            expect(container).toBeEmptyDOMElement();
            unmount();
        }
    });
});
