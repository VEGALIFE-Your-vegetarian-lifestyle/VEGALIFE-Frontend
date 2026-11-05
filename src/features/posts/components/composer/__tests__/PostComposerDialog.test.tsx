import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useUiStore } from "@/shared/ui/uiStore";
import { PostComposerDialog } from "../PostComposerDialog";
import { createPost, updatePost } from "../../../api";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

vi.mock("@/features/categories/usePublicCategories", () => ({
    usePublicCategories: () => ({
        data: { content: [{ id: "cat-1", name: "Vegan" }] },
        isLoading: false,
    }),
}));

vi.mock("@/features/recipes/api", () => ({ getMyRecipes: async () => [] }));

vi.mock("../../../api", () => ({
    getPostDetail: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    attachPostRecipes: vi.fn(),
}));

// ProseMirror cần layout engine thật — jsdom không có. Thay bằng textarea vẫn gọi
// `onChange(doc, text)` để form/checklist chạy đúng như editor thật.
vi.mock("../../editor/RichTextEditor", async () => {
    const { textToDoc } = await import("../../editor/editorContent");
    return {
        RichTextEditor: ({
            onChange,
            placeholder,
        }: {
            onChange: (doc: unknown, text: string) => void;
            placeholder?: string;
        }) => (
            <textarea
                aria-label="Article content"
                placeholder={placeholder}
                onChange={(event) => onChange(textToDoc(event.target.value), event.target.value)}
            />
        ),
    };
});

function openComposer() {
    useUiStore.setState({ composer: { postId: null } });
    return renderWithProviders(<PostComposerDialog />);
}

describe("PostComposerDialog", () => {
    beforeEach(() => {
        useUiStore.setState({ composer: null });
    });

    it("đóng cửa hàng thì không render gì", () => {
        const { container } = renderWithProviders(<PostComposerDialog />);
        expect(container).toBeEmptyDOMElement();
    });

    it("mở thì render tiêu đề, bộ đếm ký tự và checklist 5 mục", () => {
        openComposer();

        expect(screen.getByRole("heading", { name: "Create Post" })).toBeInTheDocument();
        expect(screen.getByText("0 / 90")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Publishing Readiness" })).toBeInTheDocument();
        expect(screen.getByText("0 / 5")).toBeInTheDocument();
    });

    it("gõ tiêu đề thì bộ đếm và checklist cập nhật", async () => {
        const user = userEvent.setup();
        openComposer();

        await user.type(screen.getByLabelText("Post Title"), "Pho chay");

        expect(screen.getByText("8 / 90")).toBeInTheDocument();
        expect(screen.getByText("1 / 5")).toBeInTheDocument();
    });

    it("Publish khi chưa chọn danh mục thì báo lỗi required, không gọi API", async () => {
        const user = userEvent.setup();
        openComposer();

        await user.type(screen.getByLabelText("Post Title"), "Pho chay");
        await user.type(screen.getByLabelText("Article content"), "Nuoc dung chay.");
        await user.click(screen.getByRole("button", { name: /Publish Post/ }));

        expect(await screen.findByText("This field is required")).toBeInTheDocument();
        expect(createPost).not.toHaveBeenCalled();
    });

    it("đóng khi đã sửa thì hỏi xác nhận bỏ bài, chưa đóng ngay", async () => {
        const user = userEvent.setup();
        openComposer();

        await user.type(screen.getByLabelText("Post Title"), "Pho chay");
        // jsdom không phát `cancel` cho Esc — bấm X đi cùng nhánh `onBeforeClose`.
        await user.click(screen.getByRole("button", { name: "Close" }));

        expect(await screen.findByText("Discard this post?")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Keep editing" })).toBeInTheDocument();
        expect(useUiStore.getState().composer).not.toBeNull();
        expect(updatePost).not.toHaveBeenCalled();
    });

    it("nút Cancel khi đã sửa cũng hỏi xác nhận, không đóng ngay", async () => {
        const user = userEvent.setup();
        openComposer();

        await user.type(screen.getByLabelText("Post Title"), "Pho chay");
        await user.click(screen.getByRole("button", { name: "Cancel" }));

        expect(await screen.findByText("Discard this post?")).toBeInTheDocument();
        expect(useUiStore.getState().composer).not.toBeNull();
    });

    it("dialog chưa sửa gì thì đóng ngay, không hỏi", async () => {
        const user = userEvent.setup();
        openComposer();

        await user.click(screen.getByRole("button", { name: "Close" }));

        await waitFor(() => expect(useUiStore.getState().composer).toBeNull());
        expect(screen.queryByText("Discard this post?")).not.toBeInTheDocument();
    });

    it("Save Draft gửi createPost rồi đóng dialog", async () => {
        vi.mocked(createPost).mockResolvedValue({ id: "post-1" } as never);
        vi.mocked(updatePost).mockResolvedValue({ id: "post-1" } as never);

        const user = userEvent.setup();
        openComposer();

        await user.type(screen.getByLabelText("Post Title"), "Pho chay");
        await user.click(screen.getByRole("button", { name: /Save Draft/ }));

        await waitFor(() => expect(createPost).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(useUiStore.getState().composer).toBeNull());
    });
});
