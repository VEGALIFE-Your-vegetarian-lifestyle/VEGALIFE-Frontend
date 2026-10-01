// Post status machine — SRS 5.2
export type PostStatus = "created" | "processed" | "published" | "hidden" | "unpublished";

export type PostType = "blog" | "video";

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

export interface CreatePostRequest {
    title: string;
    type: PostType;
    content: string;
    featuredImageUrl: string | null;
    videoUrl?: string | null;
    mediaId?: string | null;
    categoryIds: string[];
    publish: boolean;
}

export interface CreatePostResponse {
    id: string;
    title: string;
    content: string;
    featuredImageUrl: string | null;
    status: PostStatus;
    flag: string | null;
    viewCount: number;
    publishedAt: string | null;
    createdAt: string;
}

export interface PostListResponse {
    id: string;
    title: string;
    type: PostType;
    content: string;
    featuredImageUrl: string | null;
    videoUrl: string | null;
    categoryIds: string[];
    mediaIds: string[];
    status: PostStatus;
    flag: string | null;
    viewCount: number;
    publishedAt: string | null;
    createdAt: string;
}