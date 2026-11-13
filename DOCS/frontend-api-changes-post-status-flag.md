# Frontend API changes — post moderation: `status` + a persistent verdict `flag` (V56, V57, V58)

**Backend:** `VEGALIFE-backend` — PR #199 (`727f60a`, migration `V56`), plus the `flag_detail` change
(migration `V57`) and the follow-up verdict change (migration `V58`) merged into `dev` as `3a96a07`
(PR #200).
**Decisions:** `docs/adrs/023-post-processing-status-and-flag-blocker.md` (supersedes ADR-011
decisions 2, 4 and 5), `docs/adrs/024-post-flag-detail-json-snapshot.md`,
`docs/adrs/025-post-flag-survives-publication.md`
**Business rules:** `docs/brs/posts.md` — BR-POST-004/007/009/010/012, BR-FILTER-002/004/005/007/008/009
**API references:** `docs/apis/post/post-posts.md`, `docs/apis/post/patch-posts-postid.md`,
`docs/apis/admin/get-posts.md`, `docs/apis/admin/post-posts-postid-approve.md`
**Date:** 2026-11-13
**Status:** `V56`, `V57` and `V58` are all merged into `dev` (PR #199 and PR #200). Both new
migrations run on the next backend deploy; until then the deployed API still returns the old
vocabulary.
**Only §1, §4 and §5 are migrations you must action** if your client is already live against `V56`.

The moderation model lost a column's worth of confusion: a post now has **one lifecycle column**
(`status`) and **one verdict column** (`flag`). `hidden` is gone, a filter failure no longer
unpublishes anything, and — since `V58` — publishing no longer erases the verdict. The evidence
behind a verdict is one JSON object instead of an opaque string, and it is exposed on the **admin
endpoints only**.

Read section 1 first. It is the only part that will break a running client.

---

## 1. TL;DR — what breaks

| # | Change | Frontend impact |
|---|---|---|
| 1 | `status` values renamed and reduced: `created` → **`drafted`**, `processed` → **`processing`**, **`hidden` removed** | Every `status === "created"` / `"processed"` / `"hidden"` check, every status badge map, every filter dropdown. The four live values are `drafted`, `processing`, `published`, `unpublished`. |
| 2 | `flag` is no longer the filter verdict of the old model; it is the **last verdict**, and it is **no longer returned on member endpoints** | Delete any member-side rendering of `flag`/`flagDetail` — the fields are gone from `PostListResponse` (§5.1). Delete every branch for `PASSED`/`PENDING`/`REJECTED`/`NEEDS_REVIEW`/`DUPLICATE`. |
| 3 | **`flagDetail` is now an object**, not a string | `{"kind": …, "score": …, "threshold": …}` and friends. Replaces the old `score=0.312` / `SIMILAR_CONTENT_POST_<uuid>` / `FILTER_DISABLED` strings. See §4. |
| 4 | **`FILTER_PASSED` is a new value**, and publishing keeps the flag | A published post can carry `FILTER_PASSED` (the filter cleared it) or the blocker an admin overrode. See §2 and §4. |
| 5 | `PATCH /api/posts/{postId}/visibility` **removed** → `404` | Delete the hide/unhide admin UI. Replace with reject (`unpublished`) or the author's own withdraw (`publish: false`). |
| 6 | `publish: true` on create/edit **no longer publishes** — it submits | The post comes back `processing`. Show a "Đang chờ duyệt" state instead of "Đã đăng". It flips to `published` later, asynchronously. |
| 7 | Admin list `flag` default changed from `NEEDS_REVIEW` to **`all`** | An admin landing on `GET /api/admin/posts` now sees every post. Drive the review queue with `?status=processing`. |
| 8 | Dashboard `pendingPosts` now counts `status = processing` **with any blocker** | Same field name; the number now means "held posts", including duplicates and filter-skipped ones. |
| 9 | A filter failure holds the post at `processing`; **only an admin can reject** | The author's "your post was rejected" screen must key off `status === "unpublished"` + `rejectionReason`, not off `flag`. |
| 10 | Approve/reject **keep** the blocker they found | After `approve`, a row may still say `flag: "FILTER_FAILED"`. That is correct: it means a human overrode the filter. Do not "fix" it in the UI. |

There is no data migration on the frontend for the vocabulary: the backend rewrote old values in
`V56`. Published rows that predate `V58` keep `flag: null` — read that as "no verdict recorded",
not as an error.

---

## 2. Mental model

Two columns, two different questions:

- **`status` answers "can the public see it?"**
- **`flag` answers "what was the last verdict on it?"** — it is the reason a post *was* parked, and
  it stays after the decision, because that is what tells a reviewer how the post got published.

`flag` is absent only on a `drafted` post. The database enforces exactly that:
`CHECK (flag IS NULL OR status <> 'drafted')` (`V58`). A flag on `published` or `unpublished` is
normal and not a bug.

```
                        ┌─────────────────────────────┐
                        │            drafted          │  private draft, no flag
                        └──────────────┬──────────────┘
                  publish:true         │        ▲   publish:false (from any non-drafted state)
                                       ▼        │
                        ┌─────────────────────────────┐
                  ┌────▶│          processing         │  submitted; a decision is outstanding
                  │     │  flag: null | FILTER_FAILED│
        publish:true│     │  SIMILAR_CONTENT | SKIPPED  │
        (edit/resubmit) └───────┬──────────────┬──────┘
                  │             │ filter PASS  │ admin reject
                  │             ▼              ▼
                  │     ┌────────────────┐  ┌───────────────────────┐
                  └─────│   published    │  │      unpublished      │  admin refusal
                        │ flag:FILTER_   │  │  rejectionReason set  │
                        │      PASSED    │  │  flag: kept           │
                        │ (or a blocker  │  └───────────────────────┘
                        │  an admin kept)│
                        └────────────────┘
                              ▲ admin approve (keeps the blocker)
```

Transitions you can rely on:

| From | Trigger | To |
|---|---|---|
| — (create) | `publish: false` / omitted | `drafted`, `flag: null` |
| — (create) | `publish: true` | `processing`, `flag: null` |
| `drafted` | edit with `publish: true` | `processing`, `flag: null` |
| `drafted` | edit with `publish: false` | `drafted` (no-op) |
| `processing` | filter passes | `published`, `flag: FILTER_PASSED`, `publishedAt` set (kept if a re-check) |
| `processing` | filter fails / duplicate / skipped | stays `processing`, `flag` set |
| `processing` | author `publish: false` | `drafted`, `flag: null`, `publishedAt: null` |
| `processing` | admin approve | `published`, `flag` **kept**, `rejectionReason: null` |
| `processing` | admin reject | `unpublished`, `flag` **kept**, `rejectionReason: <reason>` |
| `published` | edit title/content without `publish` | `processing`, re-queued, `flag: null` until the new verdict lands |
| `published` | author `publish: false` | `drafted`, `flag: null`, `publishedAt: null` |
| `published` | admin reject | `unpublished`, `flag` kept |
| `unpublished` | edit with `publish: true` | `processing` (the appeal path), `flag: null` until the new verdict lands |
| `unpublished` | author `publish: false` | `drafted`, `flag: null` |
| `drafted` | admin approve / reject | `400` — nobody submitted it |

Rules that follow:

1. **A verdict is written once per filter run** and overwritten by the next run. Publishing, approving
   and rejecting do not touch it; withdrawing does.
2. **The filter never unpublishes.** A machine refusal is evidence for a human, not a terminal state.
   `unpublished` means *an admin* said no.
3. **`processing` with `flag: null` is normal, not a bug** — the filter run is still in flight.
4. **Only an admin may set `unpublished`.** The author's own unlist is `publish: false` → `drafted`.
5. **`flag` never implies visibility in either direction.** Ask `status`.

---

## 3. Status reference

| `status` | Public feed? | Meaning | Suggested member copy | Suggested admin copy |
|---|---|---|---|---|
| `drafted` | no | Private draft. Never filtered, never carries a verdict. Was called `created`. | "Bản nháp" | "Draft" |
| `processing` | no | Submitted; the content filter or an admin still has to decide. `flag` says why, once known. Was called `processed`. | "Đang chờ duyệt" | "In review" |
| `published` | yes | Filter passed (`FILTER_PASSED`) or an admin approved it (blocker kept). | "Đã đăng" | "Published" |
| `unpublished` | no | An admin rejected it. `rejectionReason` explains why; `flag` records what the machine saw. | "Bị từ chối" | "Rejected" |

`hidden` no longer exists. Do not keep a branch for it — the value cannot come back.

## 4. `flag` and `flagDetail` reference (admin endpoints only)

> **These fields are not part of any member-facing response.** Since `V58`,
> `PostListResponse` (create, edit, list, detail, saved items) no longer carries `flag` or
> `flagDetail`. Read them from `GET /api/admin/posts` and `GET /api/admin/posts/{postId}` only.

`flag` is the post's last verdict. `flagDetail` is the evidence behind it, as **one object** whose
`kind` is always equal to `flag`:

| `flag` | When | `flagDetail` object | Meaning for the UI |
|---|---|---|---|
| `FILTER_PASSED` | The content filter cleared the post and published it | `{"kind":"FILTER_PASSED","score":0.87,"threshold":0.70}` | "Cleared by the automatic check." For `published` rows this distinguishes a genuine pass from an admin override. |
| `FILTER_FAILED` | The content filter refused the post, or was uncertain about it | `{"kind":"FILTER_FAILED","outcome":"FAIL","score":0.312,"threshold":0.45}` — `outcome` is `FAIL` (below the reject line) or `UNCERTAIN` (between the lines) | "The automatic check was not confident." On a `processing` row it is the blocker; on a `published` row it means an admin overrode it. |
| `SIMILAR_CONTENT` | The post is too similar to an already-published post | `{"kind":"SIMILAR_CONTENT","postId":"<uuid>","similarity":0.9712,"threshold":0.85}` | "97% similar to post `<uuid>`." `postId` is linkable; `similarity` is 0–1, render `Math.round(similarity * 100) + "%"`. |
| `FILTER_SKIPPED` | No verdict was reached: filtering is disabled, the provider was unavailable, the message was abandoned, or a 24-hour sweep caught it | `{"kind":"FILTER_SKIPPED","cause":"DISABLED"}` — `cause` is `DISABLED`, `SWEPT` or `UNAVAILABLE` | "The automatic check could not run." It needs a human, not a re-submit. The provider's exact error is not exposed; do not build copy around it. |
| `null` | No verdict: the post is a draft, its filter run is still in flight, or it was published before `V58` | `null` | Render nothing. |

Fields that do not belong to a verdict are **absent**, not `null` — e.g. a `FILTER_SKIPPED` object has
no `score` key at all. Type it as one object with all fields optional:

```ts
type PostFlag =
  | "FILTER_PASSED"
  | "FILTER_FAILED"
  | "SIMILAR_CONTENT"
  | "FILTER_SKIPPED";

type FlagDetail = {
  kind: PostFlag;
  outcome?: "FAIL" | "UNCERTAIN";        // FILTER_FAILED
  score?: number;                        // FILTER_PASSED / FILTER_FAILED, 0–1
  threshold?: number;                    // FILTER_PASSED / FILTER_FAILED / SIMILAR_CONTENT, 0–1
  postId?: string;                       // SIMILAR_CONTENT
  similarity?: number;                   // SIMILAR_CONTENT, 0–1
  cause?: "DISABLED" | "SWEPT" | "UNAVAILABLE"; // FILTER_SKIPPED
};
```

`threshold` is **the bar that was in force for that run**, snapshotted at decision time — an admin may
have retuned it since, so never compare against a threshold you fetched elsewhere. It is missing on
rows decided before `V57` and when the platform could not know it; treat a missing threshold as
"unknown", not as zero.

Never derive the post's fate from `flag`. `flag` describes the last verdict; `status` describes the
answer.

---

## 5. Response shape diff

### 5.1 `PostListResponse` (member: create, edit, list, detail, saved items) — **fields removed**

```json
{
  "status": "processing",
  "rejectionReason": null
}
```

- `status` — one of the four values above.
- `rejectionReason` — unchanged: owner-scoped, populated only after an admin reject.
- **`flag` and `flagDetail` are gone.** If your member UI rendered "why is my post pending", move that
  panel to the admin screens. On member screens, `status` (plus `rejectionReason`) is the whole story.
  A `processing` post may be in flight or held; the member does not get to tell those apart.

### 5.2 `AdminPostListResponse`

Carries **`flag`** (the verdict vocabulary) and **`flagDetail`**. Everything else is unchanged.

```json
{
  "status": "processing",
  "flag": "FILTER_FAILED",
  "flagDetail": { "kind": "FILTER_FAILED", "outcome": "FAIL", "score": 0.312, "threshold": 0.45 },
  "rejectionReason": null
}
```

A `published` row can look like either of these — both are valid:

```json
{ "status": "published", "flag": "FILTER_PASSED",
  "flagDetail": { "kind": "FILTER_PASSED", "score": 0.87, "threshold": 0.70 } }
```

```json
{ "status": "published", "flag": "FILTER_FAILED",
  "flagDetail": { "kind": "FILTER_FAILED", "outcome": "FAIL", "score": 0.21, "threshold": 0.45 } }
```

The second one means "an admin approved a post the filter refused". Surface it as such (e.g. an
"approved over filter" chip) instead of hiding the flag once `status` is `published`.

### 5.3 `AdminPostDetailResponse`

Same fields as the list plus components. The component lists are `recipes` and `names`
(`ComponentSummary[]`), not a single `components` array:

```json
{
  "status": "processing",
  "flag": "FILTER_FAILED",
  "flagDetail": { "kind": "FILTER_FAILED", "outcome": "FAIL", "score": 0.312, "threshold": 0.45 },
  "rejectionReason": null,
  "contentScore": 0.312,
  "recipes": [
    { "id": "…", "type": "RECIPE", "name": "Phở chay", "moderationStatus": "PENDING", "score": 0.61 }
  ],
  "names": [
    { "id": "…", "type": "DISH", "name": "phở chay", "moderationStatus": "PENDING", "score": null },
    { "id": "…", "type": "INGREDIENT", "name": "cocain", "moderationStatus": "PENDING", "score": null }
  ]
}
```

`contentScore` is the post's own relevance score (`null` = never scored); `names[].score` is `null`
for dish/ingredient names because those are gated by `moderationStatus`, not scored.

---

## 6. Endpoint by endpoint

### 6.1 `POST /api/posts`

Request unchanged (`publish` is a plain boolean, default `false`).

| Request | Response `status` | Response `flag` |
|---|---|---|
| no `publish` / `publish: false` | `drafted` | not returned |
| `publish: true` | `processing` | not returned (the run has not reported yet) |

`publish: true` **does not publish**. A `CONTENT_FILTER` message is enqueued; the post stays
`processing` until a verdict arrives. If filtering is disabled platform-wide, the post is
`processing` + `FILTER_SKIPPED` with `cause: "DISABLED"` immediately — visible to an admin, not to the
author's response.

### 6.2 `PATCH /api/posts/{postId}`

`publish` is a nullable boolean:

| Value | Effect |
|---|---|
| omitted / `null` | Publication state unchanged. A *title or content* change on a `published`, `unpublished`, or held (`processing` + flag) post still re-queues the filter and moves it to `processing` with `flag: null` until the new verdict lands. |
| `true` | Submit / re-check: `processing`, `flag: null`, filter queued. Works from `drafted`, `processing`, and `unpublished`. |
| `false` | Withdraw: `drafted`, `publishedAt: null`, `flag`/`flagDetail` cleared. Works from any non-`drafted` state; a no-op on a draft. |

Because an unchanged-body `publish: true` always re-queues, "Đăng lại" on a rejected post is a single
`PATCH` with `publish: true`.

### 6.3 `GET /api/posts/{postId}`

Unchanged visibility rule (only `deletedAt` matters), new vocabulary in the payload.
**`flag`/`flagDetail` are not returned here any more**; `rejectionReason` is still owner-scoped.

### 6.4 `GET /api/posts`, `GET /api/users/{userId}/posts`

Only `published` posts are listed for other members/guests. The owner sees all four statuses.
`flag`/`flagDetail` are **not returned**. An owner-side "Vì sao bài chưa hiển thị?" panel can say
"đang chờ duyệt" from `status` and "bị từ chối" plus the reason from `rejectionReason`, and nothing
more.

### 6.5 `GET /api/admin/posts`

| Param | Allowed values | Default |
|---|---|---|
| `status` | `drafted`, `processing`, `published`, `unpublished` | none (all statuses) |
| `flag` | `FILTER_PASSED`, `FILTER_FAILED`, `SIMILAR_CONTENT`, `FILTER_SKIPPED`, `all` | **`all`** |

- **Review queue = `?status=processing`.** That includes a post whose filter run is still in flight
  (`flag: null`); if you only want actionable rows, use `?status=processing&flag=FILTER_FAILED`
  (or add `SIMILAR_CONTENT` / `FILTER_SKIPPED` — the filter is an exact match on one value, so three
  calls or a client-side union).
- **Filter accuracy view = `?status=published&flag=FILTER_PASSED`** for genuine passes, versus
  `?status=published&flag=FILTER_FAILED` (etc.) for admin overrides. That distinction is the reason
  the flag survives publication — use it.
- The old default (`NEEDS_REVIEW`) is gone. Any caller relying on "no filter by default" must now
  pass `?flag=all` explicitly, though it happens to be the default.
- Response rows carry `flagDetail`.

### 6.6 `GET /api/admin/posts/{postId}`

Unchanged, plus `flagDetail`. `contentScore` is `null` when the post was never scored (a provider
failure is recorded as `FILTER_SKIPPED`, not a low score).

### 6.7 `POST /api/admin/posts/{postId}/approve`

```json
{ "reason": "Confirmed vegan recipe, ingredient names valid" }
```

`reason` optional, ≤1000 chars, stored on the moderation log.

- `status` → `published`; `publishedAt` stamped if null (a re-check keeps the original time).
- `rejectionReason` → `null`.
- **`flag` and `flagDetail` are kept as they were.** A `FILTER_FAILED` post stays `FILTER_FAILED`:
  the response says "approved over the filter", not "the filter passed". Refresh the row from the
  response; do not assume the flag disappears.
- `400` when the post is `drafted`
  (`A drafted post has not been submitted for publication and cannot be moderated`)
  or has no category (`At least one category is required to publish a post`).
- Approving a `published` post is still allowed — that is how pending component names get approved.

### 6.8 `POST /api/admin/posts/{postId}/reject`

```json
{ "reason": "Contains a non-food ingredient" }
```

- `status` → `unpublished`; `publishedAt: null`; `rejectionReason` ← the supplied reason.
- **`flag`/`flagDetail` are kept** — together with `rejectionReason` they are the full decision
  record (what the machine saw, what the admin decided).
- `400` on a `drafted` post, `404` when missing/soft-deleted.

### 6.9 Removed endpoints

| Endpoint | Now | Replacement |
|---|---|---|
| `PATCH /api/posts/{postId}/visibility` | `404 Not Found` | Admin: `POST /api/admin/posts/{id}/reject`. Author: `PATCH /api/posts/{id}` with `publish: false`. |
| `POST /api/admin/posts/{postId}/moderate` | `404` (removed earlier, ADR-016) | `/approve` and `/reject`. |

There is no "unhide". A post an admin took down can only be restored by approving it
(`processing`/`published`) or by its author editing and resubmitting.

### 6.10 `GET /api/admin/dashboard`

`moderationQueue.pendingPosts` counts **posts held for review**: `status = processing` with a
non-null blocker (`FILTER_FAILED`, `SIMILAR_CONTENT`, or `FILTER_SKIPPED`). It never counts
`FILTER_PASSED`, because a passed post is `published`. The field name and type are unchanged. If your
admin home page previously linked that number to `?flag=NEEDS_REVIEW`, point it at
`?status=processing`.

---

## 7. Frontend implementation checklist

1. **Status enum.** Replace `created`/`processed`/`hidden` with `drafted`/`processing`/`unpublished`.
   Type it as a union, not a `string`, so a stale literal fails to compile. Search the whole app for
   the old literals — they appear in badge maps, i18n keys, and sort/filter default arrays.
2. **Remove `flag`/`flagDetail` from every member-side type and component.** They are no longer in
   `PostListResponse`. If a member screen used them for a "why is it pending" tooltip, either drop the
   tooltip or replace it with `status`-based copy.
3. **Admin flag enum.** `"FILTER_PASSED" | "FILTER_FAILED" | "SIMILAR_CONTENT" | "FILTER_SKIPPED" | null`.
   Delete every branch for `PASSED`/`PENDING`/`REJECTED`/`NEEDS_REVIEW`/`DUPLICATE`.
4. **Admin flag filter dropdown.** Add `FILTER_PASSED`; keep `all` first and default.
5. **Remove the hide/unhide UI** (admin post list row action, its confirm dialog, its mutation hook).
6. **Post editor submit.** After create/edit with `publish: true`, do not show "Đã đăng". Show
   "Đang chờ duyệt" and refresh the post after a short delay (see §8).
7. **Author-side status chip.** `drafted` → "Bản nháp", `processing` → "Đang chờ duyệt",
   `published` → "Đã đăng", `unpublished` → "Bị từ chối" (+ `rejectionReason`).
8. **Admin review queue.** `GET /api/admin/posts?status=processing&page=0&size=20`. Render the blocker
   from `flag`/`flagDetail`: for `SIMILAR_CONTENT` link `flagDetail.postId` and show
   `Math.round(flagDetail.similarity * 100) + "%"`; for `FILTER_FAILED` show
   `flagDetail.score` against `flagDetail.threshold` only when both exist.
9. **Admin decision buttons.** `approve` / `reject` with an optional reason; both return the updated
   `AdminPostDetailResponse`, so update the row from the response instead of refetching the list.
10. **The flag survives `approve`, `reject` and publication.** Do not null it in local state, and do
    not hide it because `status === "published"`. `published` + `FILTER_FAILED` is an admin override
    worth showing; `published` + `FILTER_PASSED` is a genuine pass.
11. **Duplicate copy.** `SIMILAR_CONTENT` should read as "possible duplicate", not "spam" or
    "rejected" — an admin may still approve it.
12. **`FILTER_SKIPPED` copy.** "Không kiểm tra được nội dung" rather than "bị từ chối"; the automatic
    check never ran.
13. **Dashboard counter.** Keep the field, relabel it "Bài đang chờ duyệt" and link to the queue above.
14. **Error handling.** `approve`/`reject` on a draft returns `400`; handle it by surfacing the message
    and refreshing the row (the post may have been withdrawn in another tab).

---

## 8. Timing and polling

Filtering is asynchronous by design (outbound queue + scheduled drainer), so a submit can return
`processing` and become `published` seconds to minutes later. There is no push channel and no
webhook — the client must re-read.

Practical guidance:

- After a submit, show the `processing` state and re-fetch the post once after ~3 s, then back off
  (5 s, 10 s, 30 s) a few times while the detail screen is open. Stop polling once `status` is no
  longer `processing`.
- A post that stays `processing` for more than ~24 h has been `FILTER_SKIPPED` by the stale-message
  sweep and is waiting for an admin — it will not resolve on its own.
- Do not block the editor on the verdict. The submit is accepted the moment the post is saved.

---

## 9. Testing checklist

- [ ] Create without `publish` → `drafted`, no `flag` key in the member response.
- [ ] Create with `publish: true` → `processing`, no `flag` key; the post is absent from
      `GET /api/posts` (feed) and from other members' profile lists.
- [ ] Return later: the same post is either `published` or `processing` with
      `FILTER_FAILED` / `SIMILAR_CONTENT` — read on the admin endpoints.
- [ ] Author withdraws a `processing` post → `drafted`, `publishedAt: null`, no verdict on the admin
      row.
- [ ] Author withdraws a `published` post → `drafted` and it disappears from the feed.
- [ ] Author edits a `published` post's title → `processing` (the post leaves the feed until the
      filter passes) and its admin verdict becomes `FILTER_PASSED` or the new blocker.
- [ ] Admin list with no params → every post (default `flag=all`).
- [ ] Admin list `?status=processing` → every held post, including `flag: null` in-flight ones.
- [ ] Admin list `?flag=SIMILAR_CONTENT` → only duplicates.
- [ ] Admin list `?status=published&flag=FILTER_PASSED` → only posts the filter cleared.
- [ ] Admin list `?status=published&flag=FILTER_FAILED` → only posts an admin approved over the filter.
- [ ] Approve a held post → `published`, `rejectionReason` `null`, `publishedAt` set, **`flag` still
      the old blocker**.
- [ ] Reject a held post with a reason → `unpublished`, **`flag` still the old blocker**, author sees
      `rejectionReason`.
- [ ] Approve/reject a `drafted` post → `400`.
- [ ] `PATCH /api/posts/{id}/visibility` → `404`.
- [ ] Rejected post + `publish: true` → `processing` again (appeal path).
- [ ] Dashboard `pendingPosts` equals the number of `?status=processing` rows with a blocker.

---

## 10. Reference

| Topic | Where |
|---|---|
| Decision | `docs/adrs/023-post-processing-status-and-flag-blocker.md` |
| Flag survives publication | `docs/adrs/025-post-flag-survives-publication.md` |
| Superseded decision | `docs/adrs/011-post-status-and-filter-axis-separation.md` |
| Business rules | `docs/brs/posts.md` |
| Create a post | `docs/apis/post/post-posts.md` |
| Edit / withdraw / re-check | `docs/apis/post/patch-posts-postid.md` |
| Owner post list | `docs/apis/post/get-posts.md` |
| Public profile list | `docs/apis/post/get-users-userid-posts.md` |
| Single post | `docs/apis/post/get-posts-postid.md` |
| Admin post list | `docs/apis/admin/get-posts.md` |
| Admin approve / reject / detail | `docs/apis/admin/post-posts-postid-approve.md` |
| Admin dashboard | `docs/apis/admin/get-dashboard.md` |
| Removed visibility endpoint (tombstone) | `docs/apis/post/patch-posts-postid-visibility.md` |
| Schema | `src/main/resources/db/migration/V56__post_processing_status_and_flag_blocker.sql`, `V57__store_post_flag_detail_as_json.sql`, `V58__keep_post_flag_after_publication.sql` |
