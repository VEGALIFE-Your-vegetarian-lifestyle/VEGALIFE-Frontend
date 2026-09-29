import { postsSeed } from "@/shared/mocks/posts";
import type { ListParams, Paginated } from "@/types/common";
import type { Post, PostStatus } from "@/types/post";
import { delay } from "@/utils/delay";

// Mock data — thay từng hàm bằng api call khi backend xong.
// SRS 11.2 chưa có endpoint duyệt/từ chối/ẩn bài và list bài theo mọi status cho Admin — cần thống nhất với backend.
let posts = [...postsSeed];

export const getPosts = async ({ page, size, q, status }: ListParams<PostStatus>): Promise<Paginated<Post>> => {
    await delay();
    const keyword = q?.trim().toLowerCase() ?? "";
    const filtered = posts.filter(
        (post) =>
            (!status || post.status === status) &&
            (post.title.toLowerCase().includes(keyword) || post.author.username.toLowerCase().includes(keyword)),
    );
    const start = (page - 1) * size;
    return {
        data: filtered.slice(start, start + size),
        total: filtered.length,
        page,
        size,
        totalPages: Math.max(1, Math.ceil(filtered.length / size)),
    };
};

// processed -> published
export const approvePost = async (id: string): Promise<void> => {
    await delay();
    posts = posts.map((post) => (post.id === id ? { ...post, status: "published" } : post));
};

// processed -> unpublished
export const rejectPost = async ({ id, reason }: { id: string; reason: string }): Promise<void> => {
    await delay();
    posts = posts.map((post) => (post.id === id ? { ...post, status: "unpublished", rejectReason: reason } : post));
};

// published -> hidden
export const hidePost = async (id: string): Promise<void> => {
    await delay();
    posts = posts.map((post) => (post.id === id ? { ...post, status: "hidden" } : post));
};

// hidden -> published
export const republishPost = async (id: string): Promise<void> => {
    await delay();
    posts = posts.map((post) => (post.id === id ? { ...post, status: "published" } : post));
};

// Soft delete
export const deletePost = async (id: string): Promise<void> => {
    await delay();
    posts = posts.filter((post) => post.id !== id);
};