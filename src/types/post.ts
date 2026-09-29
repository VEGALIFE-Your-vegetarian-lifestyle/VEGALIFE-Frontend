// Post status machine — SRS 5.2
export type PostStatus = "created" | "processed" | "published" | "hidden" | "unpublished";

export interface Post {
    id: string;
    title: string;
    content: string;
    status: PostStatus;
    viewCount: number;
    author: { id: string; username: string };
    categories: { id: string; name: string }[];
    rejectReason?: string;
    createdAt: string;
}