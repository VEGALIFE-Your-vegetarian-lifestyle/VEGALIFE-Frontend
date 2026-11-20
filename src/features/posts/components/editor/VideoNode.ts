import { Node, mergeAttributes } from "@tiptap/react";

/**
 * Video chèn trong nội dung bài.
 *
 * Node giữ `mediaId` (nguồn sự thật, dùng cho `attachPostMedia`) và `src` (bản sao URL
 * để render ngay, khỏi gọi `GET /api/media/{id}` cho từng video). Khi lưu, composer gom
 * `mediaId` của mọi node gửi lên `POST /api/posts/{id}/media`.
 *
 * `ponytail:` `src` có thể lệch nếu media bị thay ở nơi khác — đổi sang chỉ lưu `mediaId`
 * khi cần render bằng `getMedia` (thêm 1 request mỗi video).
 */
export const VideoNode = Node.create({
    name: "video",
    group: "block",
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            mediaId: { default: null },
            src: { default: null },
        };
    },

    parseHTML() {
        return [{ tag: "video[src]" }];
    },

    renderHTML({ node }) {
        // Chỉ đưa `src` ra DOM — `mediaId` là attr của ProseMirror, không phải thuộc tính HTML.
        return [
            "video",
            mergeAttributes({
                src: node.attrs.src,
                controls: "true",
                preload: "metadata",
                playsinline: "true",
            }),
        ];
    },
});
