/** Nhóm 17 — vote. `DOCS/API-REFERENCE.md` #33/#34. */

export type VoteType = "UPVOTE" | "DOWNVOTE";

export interface VoteState {
    postId: string;
    likeCount: number;
    dislikeCount: number;
    /** `null` khi chưa đăng nhập, hoặc khi lời gọi vừa gỡ vote của caller. */
    userVote: VoteType | null;
}

export interface VoteRequest {
    voteType: VoteType;
}
