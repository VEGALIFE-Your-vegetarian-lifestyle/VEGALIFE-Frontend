// @vitest-environment jsdom
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import { AutocompleteField } from "../AutocompleteField";

/** Backend không có tên trùng → danh sách rỗng, dropdown hiện `emptyLabel`. */
const noMatches = () => Promise.resolve({ content: [] as { name: string }[] });

function Field() {
    const [value, setValue] = useState("");
    return (
        <AutocompleteField<{ name: string }>
            id="ingredient"
            value={value}
            onChange={setValue}
            queryKey="test-suggestions"
            search={noMatches}
            getLabel={(item) => item.name}
            emptyLabel="No matches"
        />
    );
}

/**
 * Hồi quy: `trailing` từng nhận `undefined` khi hết fetch, khiến `Input` đổi cấu trúc
 * và remount <input> — focus mất mà `isFocused` vẫn `true` nên dropdown kẹt mở.
 */
describe("AutocompleteField", () => {
    it("giữ focus và vẫn đóng dropdown sau khi fetch trả rỗng", async () => {
        const user = userEvent.setup();
        renderWithProviders(<Field />);

        const input = screen.getByRole("combobox");
        await user.type(input, "xyz");

        // Chờ cả debounce 300ms lẫn query chạy xong (focus sẽ mất ở bản lỗi).
        await screen.findByText("No matches");
        await waitFor(() => expect(input).toHaveFocus());

        await user.tab();

        await waitFor(() => expect(screen.queryByText("No matches")).not.toBeInTheDocument());
    });
});
