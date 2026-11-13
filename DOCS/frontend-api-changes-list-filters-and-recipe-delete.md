# Frontend API changes — list filters + recipe soft delete (PR #202, PR #203)

**Backend:** `VEGALIFE-backend` — PR #202 (list filters, merged as `0177b33`) and PR #203 (recipe
soft delete, merged as `8bd91a0`).
**Feature spec:** `docs/feats/post-recipe-list-filters.md`
**API references:** `docs/apis/post/get-posts.md`, `docs/apis/post/get-posts-me.md`,
`docs/apis/post/get-users-userid-posts.md`, `docs/apis/recipes/get-recipes.md`,
`docs/apis/recipes/get-recipes-me.md`, `docs/apis/recipes/delete-recipes-recipeid.md`,
`docs/apis/search/get-search.md`
**Business rules:** BR-RECP-008 (approved catalogue), BR-RECP-009 (recipe filters only narrow),
BR-RECP-010 (owner soft delete), BR-POST-010 (public feed), BR-POST-014 (post filters only narrow),
BR-PUBLIC-001 (public visibility)
**Date:** 2026-11-13
**Status:** both PRs are merged into `dev`. No migration and no schema change — `recipe.deleted_at`
has existed since `V6`. Deploy the backend first; nothing here requires a data backfill.

Two releases, one migration:

1. **PR #202** gives every post/recipe list its own filters and makes `GET /api/recipes/me`
   paginated. The pagination change is the **only breaking change** in either PR.
2. **PR #203** adds `DELETE /api/recipes/{recipeId}` for the recipe's owner (soft delete only).

Read §1 first. If your client only consumes post/recipe lists and never calls `DELETE` on a recipe,
§1 row 1 is the whole migration.

---

## 1. TL;DR — what breaks

| # | Change | Frontend impact |
|---|---|---|
| 1 | **`GET /api/recipes/me` is now paginated.** `data` changed from an **array** to a **page object** (`data.content` + paging fields) | **This is the only breaking change.** Every screen that reads `data.length` / `data.map(...)` on the caller's own recipes must switch to `data.content` and add paging (default page size is **20**, so a client that ignores paging silently shows the first 20 recipes). See §3.2. |
| 2 | New optional filters on `GET /api/posts`, `GET /api/posts/me`, `GET /api/users/{userId}/posts`, `GET /api/recipes`, `GET /api/recipes/me` | Additive. Existing calls keep working unchanged; response shapes are unchanged. See §4. |
| 3 | `GET /api/search` is **deprecated** (OpenAPI `deprecated: true`), behaviour unchanged | Keep calling it if you want, but post/recipe search should move to `GET /api/posts?keyword=` / `GET /api/recipes?keyword=`. There is **no** typed replacement for `type=video` / `type=restaurant`. See §4.6. |
| 4 | New `DELETE /api/recipes/{recipeId}` — owner-only soft delete | New delete button/hook for the recipe author. Returns `200` with `data: null`; a repeat delete is `404`, not `200`. See §4.7. |
| 5 | A soft-deleted recipe disappears from every recipe list and `404`s on detail | Public catalogue, "my recipes", saved recipes, and post recipe chips lose it. Detail screens must handle `404` for a recipe the user owns. See §6. |
| 6 | Recipes have **no** category filter and **no** date filter | Do not wire a category dropdown to `GET /api/recipes` — the parameter does not exist. A recipe has no category of its own (categories are reachable only through posts). |
| 7 | Ordering is fixed on every list; there is still no `sort` parameter | If the UI offers sorting, keep sorting only what the API already returns. Feed = `publishedAt DESC, createdAt DESC`; every other list = `createdAt DESC`. |
| 8 | A **present but empty** enum filter (`?status=`, `?difficulty=`, `?moderationStatus=`) is `400`, not "no filter" | Build query strings by **omitting** unset params. `""` fails the enum pattern; `keyword=` is the only blank value that is accepted as "no filter". |

---

## 2. Mental model

**Filters only narrow.** Every filter is AND-combined and is applied *on top of* the route's existing
visibility rule. No combination of parameters can surface a draft (on the public feed), a
non-`APPROVED` recipe (on the public catalogue), another member's recipe, or a soft-deleted row
(BR-POST-014, BR-RECP-009).

**Order is fixed.** There is no `sort` parameter on any of these routes. If you need a different
order, sort the current page client-side — do not assume the API will honour a sort you send.

**`keyword` is a plain substring, not a search engine.** It is trimmed, lowercased, and matched as a
whole phrase with `LIKE '%…%'`. No tokenization, no stemming, no synonyms, no ranking, no relevance
score, and no `<mark>` snippet. `%`, `_`, and `\` are matched **literally** (the backend escapes
them), so `keyword=%` matches rows containing a literal percent sign instead of every row.

**All time filters are on `createdAt`.** On the public feed the *order* is by `publishedAt`, but
`createdFrom`/`createdTo` bound `createdAt`. A post created a month ago but published today appears
at the top of the feed and still counts as "last month" for the date filter.

**Paging defaults are `page=0`, `size=20`, `size` max `100`.** Bounds are validated: negative page,
size outside 1–100, or an unparseable UUID/instant is `400 Validation failed` (details in §7).

**Three enums, two casings — do not "normalize" them:**

| Parameter | Accepted values | Casing |
|---|---|---|
| `status` | `drafted`, `processing`, `published`, `unpublished` | **lowercase** |
| `moderationStatus` | `PENDING`, `APPROVED`, `REJECTED` | **UPPERCASE** |
| `difficulty` | `EASY`, `MEDIUM`, `HARD` | **UPPERCASE** |

---

## 3. Response shapes

### 3.1 `PageResponse<T>` — the envelope for every list route

All five list routes return the same envelope. It is unchanged; only `GET /api/recipes/me` is newly
wrapped in it.

```json
{
  "success": true,
  "message": "Recipes retrieved successfully",
  "data": {
    "content": [],
    "page": 0,
    "size": 20,
    "totalElements": 0,
    "totalPages": 0,
    "first": true,
    "last": true
  }
}
```

| Field | Type | Meaning |
|---|---|---|
| `data.content` | array | The items on this page |
| `data.page` | integer | Zero-based page index actually returned |
| `data.size` | integer | Page size actually used |
| `data.totalElements` | integer | Total matches for the **filtered** query |
| `data.totalPages` | integer | `ceil(totalElements / size)`; `0` when there are no matches |
| `data.first` / `data.last` | boolean | Convenience flags for pagination controls |

Use `totalElements`/`totalPages` for the pager and `data.length` **nowhere**.

### 3.2 `GET /api/recipes/me` — the breaking diff

**Before (PR #201 and earlier):** `data` was the caller's entire recipe list, unpaged.

```json
{
  "success": true,
  "message": "Recipes retrieved successfully",
  "data": [
    { "id": "550e8400-…", "name": "Spicy tofu stir-fry", "…": "…" },
    { "id": "3fa85f64-…", "name": "Tofu bowl", "…": "…" }
  ]
}
```

**After (PR #202):** `data` is a `PageResponse<RecipeResponse>`.

```json
{
  "success": true,
  "message": "Recipes retrieved successfully",
  "data": {
    "content": [
      { "id": "550e8400-…", "name": "Spicy tofu stir-fry", "…": "…" },
      { "id": "3fa85f64-…", "name": "Tofu bowl", "…": "…" }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 2,
    "totalPages": 1,
    "first": true,
    "last": true
  }
}
```

The **item** shape is unchanged — each element is the same `RecipeResponse` as before (full field
table in `docs/apis/recipes/get-recipes-me.md`). Only the wrapper changed.

Two consequences that are easy to miss:

- **Truncation.** A client that keeps reading `data[0]`/`data.length` breaks outright; a client that
  switches to `data.content` but keeps an unpaged "load everything" assumption now silently sees at
  most 20 recipes. Either add paging UI or request `size=100` for a compact screen, and do not treat
  the first page as the full list.
- **`GET /api/saved/recipes` already used this envelope.** If your saved-recipes screen already
  reads `data.content`, reuse that code path for `/api/recipes/me`.

---

## 4. Endpoint by endpoint

### 4.0 Filter support matrix

No route accepts a filter it does not implement — an unknown query parameter is simply ignored, so a
typo fails silently. Wire exactly this:

| Route | `page`/`size` | `keyword` | `status` | `moderationStatus` | `categoryId` | `dishId` | `difficulty` | `maxTotalTimeMinutes` | `createdFrom`/`createdTo` |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| `GET /api/posts` | ✅ | ✅ | — | — | ✅ | — | — | — | ✅ |
| `GET /api/posts/me` | ✅ | — | ✅ | — | ✅ | — | — | — | ✅ |
| `GET /api/users/{userId}/posts` | ✅ | — | — | — | ✅ | — | — | — | ✅ |
| `GET /api/recipes` | ✅ | ✅ | — | — | — | ✅ | ✅ | ✅ | — |
| `GET /api/recipes/me` | ✅ | — | — | ✅ | — | ✅ | ✅ | ✅ | — |

### 4.1 `GET /api/posts` — public feed (modified: filters added)

Public; no token needed. A supplied but invalid/expired token is still rejected with `401`.

Returns **published, non-deleted** posts only, ordered `publishedAt DESC, createdAt DESC`.

| Param | Type | Notes |
|---|---|---|
| `page` | integer | Default `0`, `>= 0` |
| `size` | integer | Default `20`, `1…100` |
| `keyword` | string | Whole-phrase, case-insensitive match on `title` **or** the plain-text `content` |
| `categoryId` | UUID | Posts carrying that category; a post is never returned twice |
| `createdFrom` | ISO-8601 instant | Inclusive lower bound on `createdAt` |
| `createdTo` | ISO-8601 instant | Inclusive upper bound on `createdAt` |

```bash
curl "http://localhost:8080/api/posts?keyword=pho&categoryId=7c9e6679-7425-40de-944b-e07fc1f90ae7&createdFrom=2026-11-01T00:00:00Z&page=0&size=20"
```

`keyword` does **not** search `rawContent` (the rich-text JSON document). If the editor stores body
text only in `rawContent`, those words will not match — check how `content` is populated before
promising "search finds everything".

### 4.2 `GET /api/posts/me` — caller's own posts (modified: filters added)

JWT required. Returns **every non-deleted post owned by the caller, any status**, ordered
`createdAt DESC`.

| Param | Type | Notes |
|---|---|---|
| `page` | integer | Default `0` |
| `size` | integer | Default `20`, `1…100` |
| `status` | string | `drafted` \| `processing` \| `published` \| `unpublished`. Omit for all |
| `categoryId` | UUID | Narrow to that category |
| `createdFrom` | ISO-8601 instant | Inclusive on `createdAt` |
| `createdTo` | ISO-8601 instant | Inclusive on `createdAt` |

```bash
curl "http://localhost:8080/api/posts/me?status=drafted&page=0&size=20" \
  -H "Authorization: Bearer <access-token>"
```

No `keyword` here — the author's list is not a search surface. No `flag` filter either; `status` is
the only lifecycle filter on this route.

### 4.3 `GET /api/users/{userId}/posts` — a member's posts (modified: filters added)

Public route; auth optional.

Visibility is per caller and unchanged by these filters:

| Caller | Sees | Order |
|---|---|---|
| Guest / any other member | `published`, non-deleted only | `publishedAt DESC, createdAt DESC` |
| The profile owner | every non-deleted status | `createdAt DESC` |
| Administrator | every non-deleted status | `createdAt DESC` |

| Param | Type | Notes |
|---|---|---|
| `page` / `size` | integer | Defaults `0` / `20` |
| `categoryId` | UUID | Narrow to that category |
| `createdFrom` / `createdTo` | ISO-8601 instant | Inclusive on `createdAt` |

No `status` and no `keyword`. An unknown or soft-deleted `userId` is `404` with `User not found`.

### 4.4 `GET /api/recipes` — public catalogue (modified: filters added)

Public. Returns **`APPROVED`, non-deleted** recipes only, ordered `createdAt DESC`.

| Param | Type | Notes |
|---|---|---|
| `page` / `size` | integer | Defaults `0` / `20` |
| `keyword` | string | Whole-phrase, case-insensitive match on `name`, `description`, `instructions`, the **dish name**, or **any attached ingredient name** |
| `dishId` | UUID | Only recipes using that dish |
| `difficulty` | string | `EASY` \| `MEDIUM` \| `HARD` |
| `maxTotalTimeMinutes` | integer | `prepTimeMinutes + cookTimeMinutes <= value`; `>= 0` |

```bash
curl "http://localhost:8080/api/recipes?keyword=tofu&difficulty=EASY&maxTotalTimeMinutes=30"
```

Gotchas:

- A recipe is returned **once** even if several ingredient lines match the keyword (the backend uses
  an `EXISTS` subquery, so `totalElements` stays correct).
- `maxTotalTimeMinutes` **excludes** recipes missing `prepTimeMinutes` or `cookTimeMinutes`. Unknown
  time is not treated as "short enough", so a filter chip of "≤ 30 min" can hide otherwise valid
  recipes.
- `difficulty` excludes recipes whose difficulty is `null` (it is an optional field on a recipe).
- There is **no `categoryId`** and **no date filter** on this route. Recipes have no category of
  their own; categories only exist through attached posts.

### 4.5 `GET /api/recipes/me` — caller's own recipes (modified: filters **added**, response **changed**)

JWT required. Returns **every non-deleted recipe owned by the caller, any moderation state**, ordered
`createdAt DESC`, as a page (**breaking — see §3.2**).

| Param | Type | Notes |
|---|---|---|
| `page` / `size` | integer | Defaults `0` / `20`, max `100` |
| `moderationStatus` | string | `PENDING` \| `APPROVED` \| `REJECTED`. Omit for all |
| `dishId` | UUID | Only recipes using that dish |
| `difficulty` | string | `EASY` \| `MEDIUM` \| `HARD` |
| `maxTotalTimeMinutes` | integer | Sum of prep + cook; `>= 0` |

No `keyword` here. Without `moderationStatus` the list still contains pending and rejected recipes,
each carrying its own `moderationStatus` and (for the author) `rejectionReason` — that is deliberate,
so a withheld recipe is not a mystery to its author. Do not hide them client-side unless the design
says so.

### 4.6 `GET /api/search` — deprecated (behaviour unchanged)

Still works exactly as before, still returns the mixed `SearchResultItem` page
(`type`, `id`, `title`, `snippet` with `<mark>`, `categoryIds`, `createdAt`). It is now marked
`deprecated: true` in the generated OpenAPI document and carries a deprecation banner in its API
reference.

Mapping to the typed routes:

| Old search call | Replacement | Notes |
|---|---|---|
| `GET /api/search?q=tofu&type=post` | `GET /api/posts?keyword=tofu` | Full `PostListResponse` instead of a snippet |
| `GET /api/search?q=tofu&type=recipe` | `GET /api/recipes?keyword=tofu` | Full `RecipeResponse`; **broader** matching (dish + ingredient names) |
| `categoryId` | `GET /api/posts?categoryId=…` | Post routes only — recipes ignore categories |
| `dateFrom` / `dateTo` | `createdFrom` / `createdTo` | Post routes only — recipe lists have no date filter |
| `type=video`, `type=restaurant` | **no typed replacement** | Keep `/api/search` for these |

Differences that will be visible in the UI:

- The typed routes return the real entity response (the card can render with no second fetch), but
  they have **no `snippet` and no `<mark>` highlighting**. Highlight client-side if needed.
- Recipe keyword matching widened from `name`/`description`/`instructions` (old search) to those
  **plus** dish name and ingredient names, so the same query can return more recipes than before.
- There is no relevance ranking on the typed routes — results are in the route's fixed order.

### 4.7 `DELETE /api/recipes/{recipeId}` (new)

Soft-deletes the authenticated member's **own** recipe. Only the author may call it; administrators
have no override here (they use `DELETE /api/admin/recipes/{recipeId}`).

```text
DELETE /api/recipes/{recipeId}
Authorization: Bearer <access-token>
```

No body, no query parameters.

**Success — `200 OK`:**

```json
{
  "success": true,
  "message": "Recipe deleted successfully",
  "data": null
}
```

Not `204`; the body is the standard envelope with `data: null`.

**Errors:**

| Status | Condition | `message` |
|---|---|---|
| `400` | `recipeId` is not a UUID | `Invalid value for parameter 'recipeId'` |
| `401` | Missing/invalid/expired JWT, inactive account | `Unauthorized` |
| `404` | Recipe missing, **already soft-deleted**, or **owned by another member** | `Recipe not found` |
| `500` | Unexpected server error | `Internal server error` |

The three `404` cases are deliberately identical, so the route cannot be used to probe whether
another member's recipe exists. An administrator calling this member route is treated as an ordinary
caller and gets the same `404` for someone else's recipe.

**What the delete does and does not do:**

- Sets `deleted_at`; **the row is kept**. There is no hard delete, no cascade, and no schema change.
- The recipe disappears from `GET /api/recipes`, `GET /api/recipes/me`, `GET /api/saved/recipes`,
  and from the recipe list of any post it was attached to.
- `GET /api/recipes/{recipeId}` returns `404` for **everyone**, including its author.
- `post_recipe` links and `saved_item` rows are **not** removed, so an attachment/save silently
  reappears if the recipe is ever restored. There is **no restore endpoint** in this API — do not
  build a restore button.
- Deleting a recipe that a **published** post references is allowed; the post is not modified and
  no `409` is returned.
- Menu meals are snapshots and are **not** affected.
- Dish and ingredient rows are untouched.

**Retry semantics (important for optimistic UI):** a second `DELETE` on the same id returns `404`.
If a delete request times out after the backend committed, the retry looks like "not found". Treat
`404` on delete as "already gone": remove the row and refresh rather than showing an error toast.

---

## 5. Keyword semantics, exactly

| Route | Searched fields | Not searched |
|---|---|---|
| `GET /api/posts` | `title`, plain-text `content` | `rawContent`, author name, comments, category names |
| `GET /api/recipes` | `name`, `description`, `instructions`, dish `name`, attached ingredient `name` | ingredient amount/unit/nutrition, author name, post text, category |

- Case-insensitive; trimmed; blank (`keyword=` or whitespace) means "no filter".
- Whole-phrase substring only. `tofu stir` matches "tofu stir-fry"; `tofu fry` does not.
- `%`, `_`, `\` are literal, so no wildcard syntax is needed or honoured.
- The value is still URL-encoded normally (`%` → `%25`, space → `%20`) — encoding is a transport
  concern; the backend decodes first and then treats the characters literally.
- Leading wildcards mean the query scans the visible rows; very broad keywords are slower. Keep the
  page bounded and debounce the input (300–500 ms) instead of firing on every keystroke.
- Results are not ranked and there is no snippet. `page`/`size` and `totalElements` reflect the
  filtered result set.

---

## 6. Blast radius of a soft-deleted recipe

| Surface | Before delete | After delete |
|---|---|---|
| `GET /api/recipes` | Listed if `APPROVED` | Gone |
| `GET /api/recipes/me` | Listed | Gone |
| `GET /api/recipes/{recipeId}` | `200` for everyone if approved (author always) | `404 Recipe not found` for **everyone**, author included |
| `GET /api/saved/recipes` | Listed if saved | Gone (the save row survives, the recipe is filtered out) |
| `GET /api/posts/{postId}` recipe list | Recipe shown as an attachment | Attachment omitted; the post itself is unchanged |
| Menu meals | Snapshot copy | **Unchanged** — menus do not re-read recipes |
| Admin `GET /api/admin/recipes` | Row present | Row **still present**, `status: "DELETED"` (derived from `deletedAt`) |

Admin UI note: the admin recipe list intentionally keeps deleted rows and reports
`status: "DELETED"`. That is not a bug and it is not a restore affordance — there is no restore
endpoint.

---

## 7. Error reference for the new filters

Field-level validation failures return `400` with the standard envelope, `message: "Validation failed"`,
and a field → message map in `data`:

```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "difficulty": "Difficulty must be EASY, MEDIUM, or HARD"
  }
}
```

Exact messages you can match on (prefer the key, not the prose):

| Parameter | Failure | Message in `data` |
|---|---|---|
| `page` | negative | `Page must be >= 0` |
| `size` | `< 1` or `> 100` | `Size must be between 1 and 100` |
| `status` | anything else (including `""`) | `Status must be one of: drafted, processing, published, unpublished` |
| `moderationStatus` | anything else (including `""`) | `moderationStatus must be PENDING, APPROVED, or REJECTED` |
| `difficulty` | anything else (including `""`) | `Difficulty must be EASY, MEDIUM, or HARD` |
| `maxTotalTimeMinutes` | negative | `maxTotalTimeMinutes must be >= 0` |
| `categoryId`, `dishId` | not a UUID | `Invalid value for parameter 'categoryId'` / `'dishId'` |
| `createdFrom`, `createdTo` | not an ISO-8601 instant | `Invalid value for parameter 'createdFrom'` / `'createdTo'` |

Non-validation notes:

- Omit a parameter entirely instead of sending `""`. Only `keyword` tolerates an empty value.
- URL-encode the `+` in an offset timestamp: `2026-11-01T00:00:00+07:00` must be sent as
  `2026-11-01T00%3A00%3A00%2B07%3A00` (or just use `Z`).
- `createdFrom` later than `createdTo` is **not** an error — it returns an empty page.
- An unknown `categoryId`/`dishId` is **not** an error — it returns an empty page.
- Other statuses: `401 Unauthorized` (missing/expired token on an authenticated route),
  `404` only where documented (recipe delete, unknown `userId`), `500 Internal server error`.

---

## 8. Frontend implementation checklist

1. **Fix `GET /api/recipes/me` first.** Change the response type from `RecipeResponse[]` to
   `PageResponse<RecipeResponse>` and read `data.content`. Search the whole app for
   `recipes/me` call sites, including profile screens and "my recipes" counters.
2. **Add paging to the "my recipes" screen** (or request `size=100` for a compact list) — the default
   page size is 20, so the list is now truncated. Show a pager using `totalPages`, or an infinite
   scroll driven by `page`/`last`.
3. **Typed search.** Replace post/recipe calls to `GET /api/search` with
   `GET /api/posts?keyword=` / `GET /api/recipes?keyword=`. Keep `/api/search` only for videos and
   restaurants (no typed replacement exists).
4. **Remove snippet rendering** on the replaced screens: the typed routes return the full entity,
   not `{type, id, title, snippet, categoryIds, createdAt}`. Highlight the keyword client-side if
   the design calls for it.
5. **Build query strings without empty params.** Drop `undefined`, `null`, and `""` values for
   every enum/number/UUID/instant filter. Keep the query builder in one place so no screen sends
   `?status=`.
6. **Use the right casing per enum**: `status` lowercase, `moderationStatus` uppercase,
   `difficulty` uppercase. Type them as unions so a stale literal fails to compile.
7. **Do not add a sort dropdown** to these lists. If a sort control already exists, make it
   client-side over the current page or remove it.
8. **Do not add a category filter to recipes.** Category filtering exists only on the three post
   routes. Recipes can be narrowed by `dishId`, `difficulty`, `maxTotalTimeMinutes`, and `keyword`.
9. **"My posts" filter bar**: status chips map 1:1 to `drafted`/`processing`/`published`/
   `unpublished`; add a category picker and (optionally) a date range using `createdFrom`/
   `createdTo`.
10. **Public feed filter bar**: keyword input (debounced), category picker, date range. Also note an
    invalid `categoryId` just returns an empty feed, so validate the picker's value client-side.
11. **Recipe delete action.** Show it only when the signed-in user is the recipe's `userId` and the
    recipe is not already deleted. `DELETE /api/recipes/{recipeId}`, then navigate away from the
    detail page (it will `404`) and invalidate the recipe lists, saved recipes, and any post detail
    that embeds the recipe.
12. **Handle delete retries.** `200` → removed. `404` → also removed (already gone, or not yours).
    `401` → re-auth. Do not show `404` as a hard error after a timeout.
13. **Handle `404` on recipe detail generically** — it now means missing, deleted, *or* invisible
    (not approved and not yours). Show the same "recipe not found" state in all three cases.
14. **Post detail recipe chips** may shrink between renders after any author deletes a recipe. Do not
    cache the attachment list across sessions, and do not assume a saved `recipeId` still resolves.
15. **Refresh after mutations.** Nothing in these two PRs is pushed by the server; re-fetch the list
    after create/delete rather than mutating a cached row.

---

## 9. Testing checklist

- [ ] "My recipes" renders from `data.content` and shows more than 20 recipes via paging (create 21+).
- [ ] "My recipes" no longer reads `data[0]` / `data.length`.
- [ ] `GET /api/recipes/me?moderationStatus=REJECTED` shows only rejected recipes, with
      `rejectionReason` where present.
- [ ] `GET /api/recipes?difficulty=EASY&maxTotalTimeMinutes=30` narrows both dimensions; a recipe
      with a missing prep or cook time is excluded.
- [ ] `GET /api/recipes?keyword=tofu` returns a recipe matched only by an ingredient name, exactly
      once.
- [ ] `GET /api/posts?keyword=pho&categoryId=<id>` returns published posts in that category.
- [ ] `GET /api/posts/me?status=drafted` shows only the caller's drafts; clearing the chip removes
      the parameter (no `status=`).
- [ ] `GET /api/users/{userId}/posts?createdFrom=…` as a guest returns only published posts.
- [ ] A request with `?difficulty=easy` (wrong case) surfaces the validation error, not an empty list.
- [ ] Post/recipe search no longer calls `/api/search`; video/restaurant search still does.
- [ ] Owner deletes a recipe → `200`, row disappears, detail route shows "not found" after refresh.
- [ ] Second delete of the same recipe → `404`, UI treats it as already deleted.
- [ ] Non-owner (or admin on the member route) deleting someone else's recipe → `404`, no id probing.
- [ ] Guest `DELETE` → `401`.
- [ ] Recipe attached to a published post: delete it, reload the post, attachment chip is gone and
      the post still loads.
- [ ] Saved recipe: delete it as its author, reload saved recipes, it is gone.

---

## 10. Reference

- Feature spec: `VEGALIFE-backend/docs/feats/post-recipe-list-filters.md`
- Endpoint docs: `docs/apis/post/get-posts.md`, `docs/apis/post/get-posts-me.md`,
  `docs/apis/post/get-users-userid-posts.md`, `docs/apis/recipes/get-recipes.md`,
  `docs/apis/recipes/get-recipes-me.md`, `docs/apis/recipes/delete-recipes-recipeid.md`,
  `docs/apis/search/get-search.md`
- Error contract: `docs/apis/error-responses.md`
- Business rules: `docs/brs/recipes.md` (BR-RECP-008, BR-RECP-009, BR-RECP-010), `docs/brs/posts.md`
  (BR-POST-010, BR-POST-014)
- Backend commits: `0177b33` (PR #202 merge), `8bd91a0` (PR #203 merge)
