import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { renderWithProviders } from "@/test/renderWithProviders";
import { REMOTE_TIMEOUT_MS } from "@/test/e2eEnv";
import CreatePostPage from "../CreatePostPage";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// TipTap cần layout engine thật (ProseMirror đo vị trí DOM) — jsdom không có.
// Thay bằng textarea: test này kiểm form/checklist, không kiểm editor.
vi.mock("../../../components/editor/RichTextEditor", () => ({
    RichTextEditor: ({ placeholder }: { placeholder?: string }) => (
        <textarea aria-label="Article content" placeholder={placeholder} />
    ),
}));

function renderComposer() {
    return renderWithProviders(<CreatePostPage />, { route: "/posts/create", path: "/posts/create" });
}

describe("CreatePostPage — chế độ tạo mới", () => {
    it("render tiêu đề 'Create Post' và mô tả", () => {
        renderComposer();

        expect(screen.getByRole("heading", { name: "Create Post" })).toBeInTheDocument();
        expect(
            screen.getByText("Compose in one scroll — every section is saved together with the publishing checklist."),
        ).toBeInTheDocument();
    });

    it("render 5 phần của trình soạn thảo", () => {
        renderComposer();

        expect(screen.getByText("Section 1 · Content Format")).toBeInTheDocument();
        expect(screen.getByText("Section 2 · Title & Details")).toBeInTheDocument();
        expect(screen.getByText("Section 3 · Categorization")).toBeInTheDocument();
        expect(screen.getByText("Section 4 · Cover & Visuals")).toBeInTheDocument();
        expect(screen.getByText("Section 5 · Article Content")).toBeInTheDocument();
    });

    it("mặc định chọn Blog và hiện checklist 5 mục", () => {
        renderComposer();

        expect(screen.getByRole("button", { name: /Blog & Recipe Article/ })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Publishing Checklist" })).toBeInTheDocument();
        expect(screen.getByText("Title added")).toBeInTheDocument();
        expect(screen.getByText("At least one category")).toBeInTheDocument();
        expect(screen.getByText("Cover image uploaded")).toBeInTheDocument();
        expect(screen.getByText("Article content written")).toBeInTheDocument();
    });

    it("chuyển sang Video thì checklist thêm mục nguồn video", async () => {
        const user = userEvent.setup();
        renderComposer();

        expect(screen.queryByText("Video source provided")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Cooking Video Tutorial/ }));

        expect(await screen.findByText("Video source provided")).toBeInTheDocument();
    });

    it("ô tiêu đề có bộ đếm ký tự theo maxLength", async () => {
        const user = userEvent.setup();
        renderComposer();

        await user.type(screen.getByLabelText(/Post Title/), "Pho chay");

        expect(screen.getByText("8/255")).toBeInTheDocument();
    });

    it("bấm Publish khi thiếu tiêu đề thì hiện lỗi required", async () => {
        const user = userEvent.setup();
        renderComposer();

        await user.click(screen.getByRole("button", { name: /Publish Post/ }));

        expect(await screen.findByText("This field is required")).toBeInTheDocument();
    });

    it("chuyển sang Video thì hiện ô chọn tệp video", async () => {
        const user = userEvent.setup();
        renderComposer();

        expect(screen.queryByText("Video File")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Cooking Video Tutorial/ }));

        expect(await screen.findByText("Video File")).toBeInTheDocument();
    });

    it("sidebar hiện panel AI với số liệu tĩnh", () => {
        renderComposer();

        expect(screen.getByText("AI Nutrition Snapshot")).toBeInTheDocument();
        expect(screen.getByText("Protein")).toBeInTheDocument();
        expect(screen.getByText("Fiber")).toBeInTheDocument();
    });

    it("bấm Save Draft khi thiếu tiêu đề cũng chạy validate", async () => {
        const user = userEvent.setup();
        renderComposer();

        await user.click(screen.getByRole("button", { name: /Save Draft/ }));

        expect(await screen.findByText("This field is required")).toBeInTheDocument();
    });

    it("bấm Publish khi form chưa hợp lệ thì không có toast thành công", async () => {
        const user = userEvent.setup();
        renderComposer();

        await user.click(screen.getByRole("button", { name: /Publish Post/ }));
        await screen.findByText("This field is required");

        expect(toast.success).not.toHaveBeenCalled();
        expect(toast.error).not.toHaveBeenCalled();
    });

    it(
        "nạp danh mục công khai từ backend vào phần Categorization",
        async () => {
            renderComposer();

            await waitFor(
                () => {
                    // Nút chọn category có aria-pressed; backend rỗng thì hiện câu thông báo.
                    const loaded =
                        screen.queryAllByRole("button").some((el) => el.hasAttribute("aria-pressed")) ||
                        screen.queryByText("No active categories available.") !== null;
                    expect(loaded).toBe(true);
                },
                { timeout: REMOTE_TIMEOUT_MS - 5_000 },
            );
        },
        REMOTE_TIMEOUT_MS,
    );
});

describe("CreatePostPage — chế độ sửa", () => {
    it.todo("route /posts/:id/edit nạp dữ liệu bài có sẵn vào form và hiện tiêu đề 'Edit Post'");
});
