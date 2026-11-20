# Frontend API changes — admin post responses are now a superset of the member post shape

**Backend:** `VEGALIFE-backend` — PR #214, branch `feat/admin-post-list-superset`, based on `dev`
at `e6c984e`
**API references:** `docs/apis/admin/get-posts.md`, `docs/apis/admin/post-posts-postid-approve.md`,
`docs/feats/admin-post-list-superset-of-post-list.md`
**Date:** 2026-11-20
**Status:** **purely additive — nothing breaks.** No field was removed, renamed or retyped. Existing
clients that ignore unknown JSON need no change at all.

Read §1 to see what you get for free, and §2 for the three fields worth actually using.

> **Unrelated blocker, please read §6.** The frontend in `VEGALIFE-Frontend` (`main` = `e316405`) is
> still on the **4-value** `PostStatus` union, but `dev` has shipped the 5-value one
> (`pending`). That is a separate, pre-existing break from PR #210 and this backend change does not
> cause or fix it. It does mean the admin queue is un-actionable in the current FE build, so it is
> worth fixing in the same pass.

---

## 1. TL;DR

| # | Surface | Impact |
|---|---|---|
| 1 | `GET /api/admin/posts` item | **3 new fields**: `avatarUrl`, `rawContent`, `recipeIds`. 16 → 19 fields. |
| 2 | `GET /api/admin/posts/{postId}` | **Was a different, narrower shape.** Now carries all 19 list fields **plus** `contentScore`, `recipes[]`, `names[]` — 22 total. |
| 3 | Every other endpoint | **No change.** Member feed, post detail, my-posts, user posts, saved items untouched. |
| 4 | Field names and types | **No change** to anything that already existed. `status`, `flag`, `flagDetail`, `mediaIds`… all identical. |
| 5 | `recipeIds` on the member feed | **Still empty by design.** Only the admin list and the single-post member route populate it. |
| 6 | Existing FE code | **Compiles and runs unchanged.** Adding JSON fields cannot break a consumer. |

The one *behavioural* note: if you were relying on the detail endpoint to be the big one and the list
item to be the small one, that is now inverted. Detail ⊇ list item ⊇ member item.

---

## 2. The three new list fields, and whether you care

Your `AdminPost` type in `src/features/posts/types.ts` already declares `featuredImageUrl`,
`categoryIds` and `mediaIds` — the backend has been returning those all along. What is genuinely new:

### 2.1 `avatarUrl: string | null`

The author's avatar, from their `UserProfile`. `null` when the author has no profile row yet
(BR-PROFILE-003) — the same rule the member feed follows, so `null` is normal, not an error.

The admin table currently renders `post.displayName` as plain text. This is what lets it render an
avatar next to the name, matching the member feed. Costs one batched lookup per page server-side —
no N+1 for you.

### 2.2 `rawContent: JSONContent | null`

The ProseMirror document as the author submitted it. `content` stays the plain-text version.

**This is the field that makes rich-text moderation honest.** Today the admin preview
(`PostPreviewDialog`) renders `post.content` — plain text — so an admin approving a post with
headings, lists, links or embedded media is approving something they have not actually seen. Rendering
`rawContent` through the existing editor component shows them the real post.

Same trust model as everywhere else in the app: `rawContent` is a JSON object rendered by the editor,
not HTML injected into the DOM, so there is no XSS path. Do not `JSON.stringify` it into
`dangerouslySetInnerHTML`.

```tsx
{post.rawContent ? (
    <EditorContent json={post.rawContent} readOnly />
) : (
    <p className="whitespace-pre-line">{post.content}</p>
)}
```

### 2.3 `recipeIds: string[]`

Ids of the non-deleted recipes attached to the post. Soft-deleted recipes are **excluded** — so this
is not a historical record, it is what is attached right now.

On the admin list this is new (it was always `[]` before). Use it for an "N recipes attached" chip, or
resolve the ids through the recipe endpoints you already have.

Note the member feed still returns `[]` here. That asymmetry is intentional; do not add a
`recipeIds.length > 0` condition to a component shared between the feed and the admin table.

---

## 3. The detail endpoint changed shape — read before adopting it

`GET /api/admin/posts/{postId}` used to be a *different* shape, not a bigger one: it returned 10 of
the list item's fields and added `contentScore`, `recipes[]`, `names[]`. It now returns all 19 list
fields too.

**The current frontend never calls this endpoint.** `PostsPage` puts the already-fetched `AdminPost`
straight into `PostPreviewDialog` as `post={preview}`. That still works — but it means the preview is
limited to whatever the list item carries.

The reason this mattered enough to fix: since ADR-029 / BR-POST-015, a post carrying media waits at
`pending` for an admin to review *that media* — and the old detail response returned neither
`featuredImageUrl` nor `mediaIds`. An admin opening a post to decide on it could not see the thing they
were deciding about. The list item did carry them, which is why the list-based preview was
accidentally the better view.

Now the detail is the complete one. Worth switching to it when the dialog opens:

```ts
// on open, not on row render
const { data: detail } = useQuery({
    queryKey: ["admin", "post", postId],
    queryFn: () => getAdminPostDetail(postId),
});
```

`recipes[]` and `names[]` are the moderation payload — `{ id, type, name, moderationStatus }` per
component, `type` being `RECIPE` / `DISH` / `INGREDIENT`. **The FE does not model these anywhere
yet.** They are how an admin currently approves or rejects a post *without* seeing which dish and
ingredient names that approval will also approve — a real gap if you build the detail view properly.

`recipeIds` and `recipes` are deliberately both present and are not duplicates: `recipeIds` is the
plain id set (same shape as the list), `recipes` is the same set with each recipe's moderation state.
Use `recipes` when you need to show state, `recipeIds` when you just need identity.

---

## 4. TypeScript

### 4.1 `src/features/posts/types.ts` — `AdminPost` gains three fields

```ts
export interface AdminPost {
    id: string;
    title: string;
    content: string;
    /** NEW — ProseMirror doc as submitted; `content` is its plain-text twin. */
    rawContent?: JSONContent | null;
    featuredImageUrl: string | null;
    categoryIds: string[];
    mediaIds: string[];
    /** NEW — non-deleted attached recipes. Always `[]` on the member feed, populated here. */
    recipeIds: string[];
    status: PostStatus;
    flag: PostFlag | null;
    flagDetail?: FlagDetail | null;
    rejectionReason?: string | null;
    viewCount: number;
    publishedAt: string | null;
    createdAt: string;
    userId: string;
    displayName: string;
    /** NEW — null when the author has no profile row. */
    avatarUrl: string | null;
    email: string;
}
```

`rawContent` is optional (`?`) to match how `PostListResponse` already declares it, so existing
fixtures keep compiling.

### 4.2 New detail type — only if you adopt §3

```ts
import type { ModerationStatus } from "@/features/recipes/types";

export interface AdminPostComponent {
    id: string;
    type: "RECIPE" | "DISH" | "INGREDIENT";
    name: string;
    moderationStatus: ModerationStatus;
}

/** `GET /api/admin/posts/{postId}` — always a superset of `AdminPost`. */
export interface AdminPostDetail extends AdminPost {
    /** null = never scored (a provider failure, not a low score). */
    contentScore: number | null;
    recipes: AdminPostComponent[];
    names: AdminPostComponent[];
}
```

`extends AdminPost` is safe and correct here — the backend enforces the superset with an integration
test, so the inheritance will not silently drift.

### 4.3 New API function

```ts
export const getAdminPostDetail = async (id: string): Promise<AdminPostDetail> => {
    const { data } = await api.get<ApiResponse<AdminPostDetail>>(`/api/admin/posts/${id}`);
    return data.data;
};
```

---

## 5. Traps

1. **`recipeIds` is `[]` on the member feed but populated on the admin list.** Same field name, two
   behaviours, deliberately. Do not share a "has recipes" render branch across both.
2. **`avatarUrl` is nullable and normally null in dev/seed data.** Render a fallback initial, not a
   broken `<img>`.
3. **`rawContent` is a JSON object, not HTML.** Render via the editor. Never interpolate it.
4. **`mediaIds` are ids, not URLs.** There is no batch media endpoint — resolving N media ids is N
   requests to `GET /api/media/{id}`. If you build a media-review grid on the admin detail view,
   budget for that, or ask for a batch endpoint rather than firing a request per tile.
5. **`recipes[].moderationStatus` / `names[].moderationStatus` are platform-wide, not per-post.** A
   name is approved or rejected for everyone. Rejecting a post rejects only the still-`PENDING` names
   it referenced; already-`APPROVED` ones are untouched (BR-DISH-001). Do not design a per-post
   "reject this name" control — it does not exist.
6. **The list has no server-side keyword search.** `getPosts` in `api.ts` still filters the current
   page client-side (`ponytail:` comment on it). Unchanged by this PR — do not assume `q` works
   across pages.

---

## 6. Separate blocker: the FE is still on 4 `PostStatus` values

Not caused by this PR, but you will hit it on the same screens.

`dev` backend has five statuses (`drafted`, `processing`, `pending`, `published`, `unpublished`),
with `pending` being the admin review queue since PR #210. The frontend on `main` still has:

```ts
// src/features/posts/types.ts:6 — CURRENT, STALE
export type PostStatus = "drafted" | "processing" | "published" | "unpublished";
```

```ts
// src/features/posts/constants.ts:16,24 — CURRENT, STALE
export function canPublish(status: PostStatus) { return status === "processing"; }
export function canReject(status: PostStatus) { return status === "processing"; }
```

Consequences against the current `dev` backend:

- every held post renders the raw string `pending` with no i18n label (`POST_STATUS_VARIANT["pending"]`
  is `undefined`),
- `canPublish` / `canReject` return `false` for them, so **no approve/reject button ever renders** —
  the admin queue cannot be worked through the UI,
- `?status=pending` can be selected only if the dropdown list is widened too.

The full fix is spelled out in `frontend-api-changes-pending-status-and-media-moderation.md` (§5).
Do that before or with this change; it touches the same two files.

---

## 7. Migration checklist

Free (additive), do whenever convenient:

- [ ] Add `avatarUrl`, `rawContent`, `recipeIds` to `AdminPost` (§4.1).
- [ ] Render the author avatar in the admin table.
- [ ] Render `rawContent` through the editor in `PostPreviewDialog` instead of plain `content`.

Only if you want the real moderation view:

- [ ] Add `AdminPostDetail` + `getAdminPostDetail` (§4.2, §4.3).
- [ ] Fetch it on dialog open instead of reusing the list row.
- [ ] Render `featuredImageUrl` / `mediaIds` so a media hold can actually be reviewed.
- [ ] Render `recipes[]` / `names[]` with their `moderationStatus`.

Independent of this PR but blocking the same screens:

- [ ] Fix `PostStatus` to five values, `POST_STATUS_VARIANT`, `canPublish`, `canReject`, i18n (§6).
