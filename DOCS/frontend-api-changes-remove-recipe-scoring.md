# Frontend API changes — recipe scoring removed (breaking)

**Backend:** `VEGALIFE-backend`, branch `refactor/remove-recipe-scoring`, based on `dev` at
`4dc3b15` (PR #205)
**API references:** `docs/apis/admin/recipe-crud.md`,
`docs/apis/admin/post-posts-postid-approve.md`,
`docs/apis/recipes/get-dishes-suggestions.md`,
`docs/adrs/026-remove-recipe-scoring.md`, `docs/feats/remove-recipe-scoring.md`
**Date:** 2026-11-19
**Status:** **breaking** for two admin surfaces. One migration (`V59`) drops the `recipe.score`
column permanently. Deploy the frontend with or after the backend: against the new backend an
un-updated client reads `undefined` where it expected `score`.

The content filter used to score a recipe's body (name + description + instructions) every time a
post carrying it was published, and stored the result on the recipe. That is gone: only the post
body is scored now, and `score` no longer exists anywhere in the API.

Read §1 first — for most of the app, nothing changes.

---

## 1. TL;DR — what breaks and what doesn't

| # | Surface | Impact |
|---|---|---|
| 1 | `GET /api/admin/recipes` (list), `GET /api/admin/recipes/{id}`, `PATCH`, `approve`, `reject` | **Breaking.** `score` is gone from `AdminRecipeListResponse`. |
| 2 | `GET /api/admin/recipes?sort=…` | **Breaking.** `score` is no longer an accepted sort property → `400` if sent. |
| 3 | `GET /api/admin/posts/{postId}` (detail) | **Breaking.** `data.recipes[].score` and `data.names[].score` are gone. `data.contentScore` stays. The admin post **list** (`GET /api/admin/posts`) is unaffected. |
| 4 | `GET /api/dishes/suggestions` | **Ordering change.** Recipes are now `createdAt DESC, id ASC`. A recipe with an old score no longer jumps ahead of newer unscored ones. |
| 5 | Every member-facing recipe endpoint (`POST /api/recipes`, `GET /api/recipes`, `GET /api/recipes/me`, `GET /api/recipes/{id}`, saved recipes) | **Unchanged.** `RecipeResponse` never carried a recipe score. |
| 6 | Filter behaviour (a post being held for review) | **Effectively unchanged** for clients — a held post still gets `flag` + `flagDetail` exactly as before. See §4. |

**The one thing that will bite you:** `src/features/recipes/types.ts:82` declares
`AdminRecipe.score`, and it is now a lie. See §5.1.

---

## 2. Why this changed

Scoring the recipe body never did the job it was added for:

1. The text it judged had already been approved by an admin — a post may only attach an `APPROVED`
   recipe (`BR-POST-013`). The score could not keep anything off the feed.
2. An embedding failure overwrote a good score with `null` — indistinguishable from "never scored".
3. The value was overwritten by every filter run of every post using that recipe, including runs
   triggered by editing a *different* post.
4. An admin editing recipe instructions never recomputed it, so it went stale on the only path that
   edits recipe text.
5. Nothing read it to make a decision.

Full reasoning: `docs/adrs/026-remove-recipe-scoring.md`.

**Accepted product consequence:** recipe text now has no automated topical check at all. It is
reviewed when approved, and that approval is the control. This is deliberate, not an oversight.

---

## 3. Surface by surface

### 3.1 `AdminRecipeListResponse` — `score` removed (breaking)

Endpoints:

- `GET /api/admin/recipes` → `data.content[]`
- `GET /api/admin/recipes/{recipeId}` → `data`
- `PATCH /api/admin/recipes/{recipeId}` → `data`
- `POST /api/admin/recipes/{recipeId}/approve` → `data`
- `POST /api/admin/recipes/{recipeId}/reject` → `data`

**Before**

```json
{
  "id": "0b0f8c1e-…",
  "name": "Phở chay",
  "moderationStatus": "PENDING",
  "score": 0.79,
  "rejectionReason": null,
  "...": "unchanged"
}
```

**After**

```json
{
  "id": "0b0f8c1e-…",
  "name": "Phở chay",
  "moderationStatus": "PENDING",
  "rejectionReason": null,
  "...": "unchanged"
}
```

The property is **absent**, not `null`. A JSON reader gets `undefined`, which is falsy — so
`recipe.score === null` turns from `true` into `false`, and any `??` fallback still works while any
strict-null check silently breaks. Delete the field from the type rather than making it optional.

Everything else on the row is byte-identical: `status`, `moderationStatus`, `rejectionReason`,
`dishName`, `imageUrl`, `categoryIds`, `ingredients[]`, nutrition, `displayName`, `email`.

### 3.2 `sort` whitelist — `score` rejected (breaking)

`GET /api/admin/recipes?sort=…`

| Accepted (unchanged) | Removed |
|---|---|
| `createdAt`, `updatedAt`, `name`, `moderationStatus` | `score` |

Sending `sort=score,desc` now returns `400`:

```json
{
  "success": false,
  "message": "Sort property must be one of: createdAt, updatedAt, name, moderationStatus",
  "data": null
}
```

The frontend never exposed a score sort (`RecipeSort` is `createdAt,desc | updatedAt,desc |
name,asc`), so no UI change is needed here — this is only a guard against a hand-written request.

### 3.3 `AdminPostDetailResponse` — components no longer scored (breaking)

`GET /api/admin/posts/{postId}`

**Before**

```json
{
  "contentScore": 0.312,
  "recipes": [
    { "id": "…", "type": "RECIPE", "name": "Phở chay", "moderationStatus": "PENDING", "score": 0.79 }
  ],
  "names": [
    { "id": "…", "type": "DISH", "name": "phở chay", "moderationStatus": "PENDING", "score": null }
  ]
}
```

**After**

```json
{
  "contentScore": 0.312,
  "recipes": [
    { "id": "…", "type": "RECIPE", "name": "Phở chay", "moderationStatus": "PENDING" }
  ],
  "names": [
    { "id": "…", "type": "DISH", "name": "phở chay", "moderationStatus": "PENDING" }
  ]
}
```

Both arrays share one DTO (`ComponentSummary`), so removing the property removed it from `names[]`
too — where it was always `null`. **`contentScore` is untouched** and remains `null` when the post
was never scored.

This is the only place a reviewer saw a per-component number. The moderation decision is unaffected:
components have always been approved or rejected by `moderationStatus`, never by their score
(`BR-DISH-001`).

### 3.4 `GET /api/dishes/suggestions` — ordering change

`data.content[].recommendedRecipes[]` is now ordered **`createdAt DESC, id ASC`**.

It was `score DESC NULLS LAST, createdAt DESC, id ASC`. Because `NULLS LAST` put any scored recipe
ahead of every unscored one, and almost no recipe ever had a score, the order was *in practice*
already pure recency. The visible difference is narrow but real: **a recipe that does carry an old
score no longer jumps to the front of its dish**, and a dish whose recipe order previously hinged on
one scored row may reorder.

**For the UI:** the list of up to `recipesPerDish` (default 3) recipes under a dish can change order
for a given dish, and can pick different recipes at the boundary. Nothing about the shape changes.
No frontend code consumes this endpoint today (§5.4).

### 3.5 Member-facing recipe responses — unchanged

`RecipeResponse` (`POST /api/recipes`, `GET /api/recipes`, `GET /api/recipes/me`,
`GET /api/recipes/{recipeId}`, `GET /api/saved/recipes`) never carried a score and still does not.
Nothing to do.

---

## 4. Logic changes the frontend should understand

### 4.1 A held post looks the same as before

The filter still holds a post and still sets `flag` + `flagDetail`. The only thing removed is the
*recipe half* of the scoring. Concretely:

| Situation | Before | After |
|---|---|---|
| Post body scores below the reject threshold | held, `flag=FILTER_FAILED` | unchanged |
| Post body scores in the review band | held, `flag=FILTER_FAILED` | unchanged |
| Post attaches an off-topic but *approved* recipe | could be held for the recipe score | **body decides only** |
| Post references a `PENDING` dish or ingredient name | held, escalated to review | unchanged (state check, not a score) |

So the review queue may contain **slightly fewer** posts — specifically, ones that were held purely
because of an attached recipe's score. Expect a small one-time decrease in `flag=FILTER_FAILED`
entries that have no off-topic post body behind them. That is the intended fix, not a regression.

### 4.2 Nothing the reviewer needs was lost

A reviewer decided from `contentScore`, `flagDetail`, and each component's `moderationStatus`. All
three survive. The removed number was a second opinion that contradicted the admin's own approval.

### 4.3 Old scores are deleted, not migrated

`V59__drop_recipe_score.sql` drops the column outright. There is no historical data to display, no
"last scored at" to show, and no rollback that restores values. If a screen ever displayed a recipe
score, it cannot be backfilled — remove the element instead of showing a placeholder.

---

## 5. Required frontend changes

Checked against `VEGALIFE-Frontend` on 2026-11-19.

### 5.1 `src/features/recipes/types.ts:82` — **required, compile-level**

```ts
export interface AdminRecipe extends Omit<Recipe, "dishName"> {
    dishName: string | null;
    status: RecipeStatus;
    moderationStatus: ModerationStatus;
    /** Điểm liên quan lúc nộp; `null` = chưa từng chấm. */
    score: number | null;      // ← DELETE
    dishModerationStatus: ModerationStatus;
    displayName: string;
    email: string;
    categoryIds: string[];
}
```

Delete the field and its comment. No other change in the file. `RecipeSort` (line 104) already
excludes `score` and needs nothing.

**This is the only required edit.** A grep of the frontend confirms nothing reads it:
`AdminRecipesPage.tsx` and `RecipeDetailDialog.tsx` never reference `score`, and no request sets
`sort=score`.

### 5.2 Admin recipe UI — **nothing to do**

Neither the list table nor the detail dialog renders a score, so removing it from the type has no
visual consequence. There is no "relevance" column to delete.

### 5.3 Admin post detail — **nothing to do**

`features/posts/api.ts` calls `GET /api/admin/posts` (the **list**, line 138) and the
`approve`/`reject` actions — it never calls `GET /api/admin/posts/{postId}`, and has no type for
`AdminPostDetailResponse`.

The list is **unaffected**: `AdminPostListResponse` never carried a recipe or component score. Only
the detail response changed (§3.3). If you add a moderation-detail screen later, do not add
`recipes[].score` or `names[].score` — they do not exist.

### 5.4 Dish suggestions — **nothing to do**

`grep` finds no consumer of `GET /api/dishes/suggestions` or `recommendedRecipes` in `src/`. When
that UI is built, read `recommendedRecipes` as an already-ordered list and do not re-sort it — the
server's `createdAt DESC, id ASC` is the contract, and the `recipesPerDish` cap is applied after
that ordering.

---

## 6. Explicitly **not** changed

| Surface | Why it is unchanged |
|---|---|
| `post.contentScore` | The post body is still scored; the field and its `null` semantics are identical. |
| `flagDetail` (`score` / `threshold` / `outcome`) | Post-body evidence, not a recipe score. Same shape. |
| `data.names[].moderationStatus`, `data.recipes[].moderationStatus` | Still `PENDING` / `APPROVED` / `REJECTED`. |
| `GET /api/admin/posts` (list) | `AdminPostListResponse` never had a recipe or component score; it carries `flag`/`flagDetail` only. Unchanged. |
| `moderation_status` in the database and `moderationStatus` in every response | Untouched by this change: the only migration drops the `score` column, and every component still reports its review state. |
| `RecipeResponse` and every member recipe endpoint | Never had a recipe score. |
| Recipe write payloads (`POST /api/recipes`, admin `PATCH`) | No score field in the request either — do not add one. |
| Recipe approval flow | Unchanged: approval is the control for recipe text. |
| `GET /api/menus/details` meal shapes | Unrelated to scoring. |
| `GET /api/search` | Unrelated. |

---

## 7. Checklist

- [ ] Delete `score` from `AdminRecipe` in `src/features/recipes/types.ts` (§5.1).
- [ ] `tsc --noEmit` — confirm nothing referenced it.
- [ ] Confirm no request builds `sort=score` (§3.2).
- [ ] Confirm no admin screen renders a per-recipe or per-component relevance number (§5.2, §5.3).
- [ ] If a moderation-detail screen is added later, omit `recipes[].score` / `names[].score`.
- [ ] If dish suggestions are wired up later, treat the server order as final (§5.4).

---

## 8. Verifying against a running backend

```bash
# 1. score is absent from the admin recipe list
curl "$API/api/admin/recipes" -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data.content[0] | has("score")'
# → false

# 2. score is no longer a valid sort
curl -o /dev/null -w '%{http_code}\n' "$API/api/admin/recipes?sort=score,desc" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# → 400

# 3. post-detail components carry no score, but contentScore survives
curl "$API/api/admin/posts/$POST_ID" -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '{contentScore: .data.contentScore, recipeKeys: (.data.recipes[0] | keys), nameKeys: (.data.names[0] | keys)}'
# → contentScore present; recipeKeys/nameKeys contain no "score"
```

Check, in order:

1. `has("score")` is **false** on admin recipe rows — the key is missing, not `null`.
2. A `sort=score,desc` request returns `400` with the "Sort property must be one of…" message.
3. `data.recipes[]` and `data.names[]` have `id`, `type`, `name`, `moderationStatus` and nothing else.
4. `data.contentScore` is still present and still nullable.
5. A member's own recipe list (`GET /api/recipes/me`) is unchanged — it never had a score.

---

## 9. FAQ

**Q: Is this a breaking change?**
Yes, for two admin surfaces: `score` disappears from `AdminRecipeListResponse` (reached through five
admin endpoints) and from both component arrays on `GET /api/admin/posts/{postId}`. Also
`sort=score` becomes a `400`. Member-facing endpoints are untouched.

**Q: Do I need to deploy the frontend before the backend?**
Either order works, but deploy the frontend *with or after* the backend. If the new backend ships
first, an un-updated client reads `undefined` for `recipe.score` — which renders as blank rather than
crashing, but any strict `=== null` branch will behave differently.

**Q: Should I keep `score` in the type as `number | null` for safety?**
No. The backend will never send it again, and that type would silently let a new screen depend on a
value that cannot exist. Delete it.

**Q: A post is still held for review with `FILTER_FAILED` — didn't you remove scoring?**
Only *recipe* scoring. The post body is still embedded and scored, and pending dish/ingredient names
still escalate a post to review. See §4.1.

**Q: Why did some posts stop being held?**
Because they were held solely for an attached recipe's score, which contradicted the admin who
approved that recipe. The body decides now.

**Q: Can we still show "why was this post flagged?"**
Yes — `flagDetail` is unchanged and is the intended source: `kind` plus `outcome`/`score`/`threshold`
for `FILTER_FAILED`, `postId`/`similarity`/`threshold` for `SIMILAR_CONTENT`, `cause` for
`FILTER_SKIPPED`.

**Q: What about recipes that were never scored (`score: null`)?**
Nothing to migrate. The column is dropped, so "never scored" and "scored 0.3" are both simply gone.

**Q: Does dish suggestion order change visibly?**
Barely, but not never. `NULLS LAST` meant an unscored recipe could still outrank a scored one on
recency, so the effective order was already mostly recency. What changes: a recipe holding an old
score no longer jumps ahead of newer unscored ones. Still up to `recipesPerDish` per dish, newest
first.

**Q: Did moderation status change?**
No. `moderation_status` in the schema and `moderationStatus` in every response are untouched — V59
only drops the `score` column, and each component still reports `PENDING`/`APPROVED`/`REJECTED`
exactly as before. The approve/reject flows are unchanged.

**Q: Is there any way to get a recipe score back?**
No. ADR-026 rejects adding an automated topical check for recipe text elsewhere; a return would need
a new ADR explaining what changed.
