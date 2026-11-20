# Frontend API changes — dish image on recipe responses (PR #205)

**Backend:** `VEGALIFE-backend`, `dev` at merge commit `4dc3b15` (PR #205), on top of `d310e82`
**Branch:** `feat/recipe-dish-image` (`aaecb0f`, `fc45add`, `fce516d`, `06ffae6`)
**API references:** `docs/apis/recipes/get-recipes.md`, `docs/apis/admin/recipe-crud.md`,
`docs/apis/menus/post-menus.md`, `docs/apis/menus/patch-menus.md`,
`docs/apis/menus/post-menu-status.md`, `docs/apis/menus/get-menus-details.md`,
`docs/apis/recipes/get-dishes-suggestions.md`
**Date:** 2026-11-19
**Status:** merged into `dev`. **No migration, no schema change, no breaking change.** Purely
additive — every existing response keeps every field it had, and old clients keep working
untouched.

A recipe now reports a **picture**: a nullable `imageUrl` string. Nothing else about recipes
changed.

Read §1 first. If your client only renders recipes and never touches meal plans, §1 plus §5 is the
whole migration.

---

## 1. TL;DR — nothing breaks; here is where the new field lands

| # | Surface | Where `imageUrl` appears | Impact |
|---|---|---|---|
| 1 | `POST /api/recipes`, `GET /api/recipes`, `GET /api/recipes/me`, `GET /api/recipes/{recipeId}`, `GET /api/saved/recipes` | **top level** of each recipe object, next to `dishName` | Additive. Optional to use. |
| 2 | `GET /api/admin/recipes`, `GET /api/admin/recipes/{id}`, `PATCH /api/admin/recipes/{id}`, `POST /api/admin/recipes/{id}/approve`, `POST /api/admin/recipes/{id}/reject` | **top level**, next to `dishName` | Additive. |
| 3 | `POST /api/menus`, `PATCH /api/menus/{menuId}`, `POST /api/menus/{menuId}/status` | `data.days[].meals[].imageUrl` — sibling of `dishId`/`dishName` | Additive. `meals[]` still has **no** nested `dish` object. |
| 4 | `GET /api/menus/details` | `data[].days[].meals[].recommendedRecipes[].imageUrl` | Additive. The meal's own `dish.imageUrl` already existed. |
| 5 | `GET /api/dishes/suggestions` | `data.content[].recommendedRecipes[].imageUrl` | Additive. This endpoint is **not consumed by the frontend yet** (see §6.6). |

**The one thing that will bite you:** the field is `null` far more often than not — see §5.1.

---

## 2. Mental model — the image belongs to the *dish*, not the recipe

There is no `recipe.image_url` column and no recipe image upload. A recipe has no picture of its
own; it borrows the picture of the **shared dish** it is cooked from (`recipe → dish → image_url`,
`V5__create_dish_table.sql`).

Three consequences you should design around:

1. **Two recipes for the same dish always show the same picture.** "Phở chay" by Alice and "Phở
   chay" by Bob are both `dishName: "phở chay"` → identical `imageUrl`. That is intended, not a bug.
2. **The client cannot change it.** `imageUrl` is read-only on every recipe endpoint. There is no
   upload, no PATCH field, no `imageUrl` in `CreateRecipeRequest`. Sending one is ignored. Only
   an admin, through the **dish** endpoints (`POST /api/admin/dishes`, `PATCH /api/admin/dishes/{id}`),
   can set it.
3. **It can change under you.** An admin setting an image on a dish silently changes the picture
   for every recipe using that dish — no version, no cache-busting, no notification. Do not treat
   a recipe's image as immutable content; re-read it with the recipe.

---

## 3. The new field, surface by surface

### 3.1 `RecipeResponse` — the member-facing recipe object

Endpoints:

- `POST /api/recipes` → `201`, `data`
- `GET /api/recipes` → `data.content[]`
- `GET /api/recipes/me` → `data.content[]`
- `GET /api/recipes/{recipeId}` → `data`
- `GET /api/saved/recipes` → `data.content[]`

```json
{
  "success": true,
  "data": {
    "id": "8f1c...",
    "userId": "0a2b...",
    "dishId": "c3d4...",
    "dishName": "phở chay",
    "imageUrl": "https://cdn.example.com/dishes/pho-chay.jpg",
    "dishModerationStatus": "APPROVED",
    "moderationStatus": "APPROVED",
    "name": "Phở chay nấm hương",
    "...": "unchanged"
  }
}
```

**Shape notes**

- **Top level.** Not `data.dish.imageUrl` — `RecipeResponse` never had a nested `dish` object, and
  still does not. Do not invent one.
- `string | null`. Never `""`, never a placeholder URL, never an object with dimensions.
- No new field anywhere else in this response. `ingredients[]`, nutrition, moderation fields are
  byte-identical.

### 3.2 `AdminRecipeListResponse` — the admin recipe row

Endpoints:

- `GET /api/admin/recipes` → `data.content[]`
- `GET /api/admin/recipes/{recipeId}` → `data`
- `PATCH /api/admin/recipes/{recipeId}` → `data`
- `POST /api/admin/recipes/{recipeId}/approve` → `data`
- `POST /api/admin/recipes/{recipeId}/reject` → `data`

Field sits next to `dishId` / `dishName`, before `dishModerationStatus`:

```json
{ "dishId": "c3d4...", "dishName": "phở chay", "imageUrl": null, "dishModerationStatus": "PENDING" }
```

`DELETE /api/admin/recipes/{recipeId}` is **not** affected — it returns `data: null`.

### 3.3 `MealResponse` — meals on the menu *write* paths

Endpoints:

- `POST /api/menus` → `201`
- `PATCH /api/menus/{menuId}`
- `POST /api/menus/{menuId}/status`

All three return a `MenuDetailResponse`, whose meals are `MealResponse`:

```json
{
  "id": "menu-uuid",
  "startDate": "2026-11-16",
  "endDate": "2026-11-22",
  "status": "drafted",
  "days": [
    {
      "date": "2026-11-16",
      "meals": [
        {
          "mealType": "LUNCH",
          "dishId": "c3d4...",
          "dishName": "phở chay",
          "imageUrl": "https://cdn.example.com/dishes/pho-chay.jpg",
          "servings": 2
        }
      ]
    }
  ]
}
```

**This is the section that actually matters for existing FE code.** `MealResponse` is deliberately
flat — it has `dishId` + `dishName` and **no nested `dish`** (see the Javadoc on
`MealDetailResponse`). That is exactly what `MenuWriteResult` in
`src/features/menus/types.ts` models. `imageUrl` joins that flat shape; it does **not** become
`meal.dish.imageUrl`.

**No more re-read for the image.** `CreateMealPlanPage.tsx:52` currently invalidates and navigates
because *"Response chỉ có `dishId`/`dishName` — đọc lại để có `dish` đầy đủ"*. After this PR a meal
row can render its thumbnail straight from the write response. The re-read is still needed for the
rest of the dish (`cuisineType`, `description`, `id`-based links), so keep the invalidation — just
stop believing the image is the reason for it.

### 3.4 `RecipeSummaryResponse` — recommendations

Field goes after `description`:

```json
{
  "id": "rec-uuid",
  "name": "Phở chay nấm hương",
  "description": "...",
  "imageUrl": "https://cdn.example.com/dishes/pho-chay.jpg",
  "prepTimeMinutes": 20,
  "...": "unchanged"
}
```

Reached through two endpoints:

- `GET /api/menus/details` → `data[].days[].meals[].recommendedRecipes[]`
- `GET /api/dishes/suggestions` → `data.content[].recommendedRecipes[]`

Note that these summaries carry no `dishName` — the dish is already the parent object, and the
image is that same dish's image. So `recommendedRecipes[].imageUrl` is usually **identical to the
enclosing meal's `dish.imageUrl`**. Rendering both would show the same picture twice.

---

## 4. Explicitly **not** changed

Do not add fields or touch screens on the strength of these — they are listed so nobody "fixes"
them twice.

| Surface | Why it is unchanged |
|---|---|
| `GET /api/menus` | Returns `MenuSummaryResponse` — menu header only, no meals, so no recipe and no image. |
| `GET /api/menus/details` meal `dish` object | Already carried `imageUrl` (it embeds the full `DishResponse`). Only the nested `recommendedRecipes[]` is new. |
| `GET /api/dishes`, `GET /api/dishes/{dishId}` | `DishResponse.imageUrl` has existed for a long time. |
| `GET /api/dishes/{dishId}/ingredients/suggestions` | Returns ingredient suggestions, no recipes. |
| `DELETE /api/recipes/{recipeId}`, `DELETE /api/admin/recipes/{recipeId}` | `data: null`. |
| `GET /api/search` | `SearchResultItem` has **no** image field for any entity type. Search results still cannot show a thumbnail. Out of scope for PR #205. |
| `CreateRecipeRequest` / recipe PATCH body | No `imageUrl` field. Writes stay on the admin dish endpoints. |
| Any migration | None. `dish.image_url` has existed since `V5`. Deploy order does not matter. |

---

## 5. Semantics and edge cases

### 5.1 `null` is the normal case, not an error

`dish.image_url` is nullable with no seed and no backfill, and only an admin can populate it. In
practice **most dishes have no image**. A client that assumes a string will render broken `<img>`
tags across the whole recipe catalogue.

Always fall back. The frontend already has the helper for this in
`src/shared/utils/display.ts`:

```tsx
import { FALLBACK_IMAGE, showFallbackImage } from "@/shared/utils/display";

<img
  src={recipe.imageUrl ?? FALLBACK_IMAGE}
  alt={recipe.name}
  loading="lazy"
  onError={showFallbackImage()}
/>
```

`showFallbackImage()` matters here as much as for posts: `imageUrl` is a free-form 1000-char string
with **no URL validation** on the backend (`@Size(max = 1000)` only), so an admin can store a URL
that later 404s. Treat every value as untrusted text.

### 5.2 It is an opaque string — do not build it

The backend does not validate, normalize, or prefix the value. Do not:

- prepend an API base URL,
- append a cache-busting `?v=`,
- run it through an image-resizing CDN helper,
- assume it starts with `/` or with `http`.

Render it as-is, or use the fallback.

### 5.3 "No image yet" ≠ "no image, ever"

A freshly created recipe whose `dishName` is brand new will report `imageUrl: null` on the `POST`
response. The same recipe will later report a URL if an admin curates the dish. Since the response
is read at request time, simply re-fetching the recipe list picks the change up — there is no
invalidation signal to listen for.

### 5.4 A recipe cannot have its own picture

If a product requirement says "let a member add a photo to their recipe", that is **not** what this
PR does. Shipping a photo picker on the recipe form will silently discard what the user uploads,
because the field does not exist on the request. Open a backend issue first.

---

## 6. Frontend touch-points (checklist)

Concrete files and edits, verified against `VEGALIFE-Frontend` on 2026-11-19.

### 6.1 `src/features/recipes/types.ts` — **required**

`Recipe` has no `imageUrl` today. Add it next to `dishName`:

```ts
export interface Recipe {
    id: string;
    userId: string;
    dishId: string;
    dishName: string;
    /** Ảnh của dish dùng chung — `null` khi admin chưa đặt ảnh. Chỉ đọc. */
    imageUrl: string | null;
    name: string;
    // ...
}
```

`AdminRecipe` is declared as `extends Omit<Recipe, "dishName">`, so it inherits `imageUrl`
automatically — **no edit needed there**. Only add it explicitly if admin and member shapes ever
diverge.

### 6.2 `src/features/menus/types.ts` — **required**

Add to `MenuWriteResult.days[].meals[]` only:

```ts
export interface MenuWriteResult extends Omit<MenuDetail, "days"> {
    days: {
        date: string;
        meals: {
            mealType: MealType;
            dishId: string;
            dishName: string;
            /** Ảnh dish, đi kèm `dishName` để row bữa ăn khỏi phải đọc lại. `null` nếu chưa có. */
            imageUrl: string | null;
            servings: number;
        }[];
    }[];
}
```

**Do not add it to `CreateMenuRequest.days[].meals[]`** — that is a request payload; the server
does not accept a per-meal image.

`MenuDetail` / `Meal` / `Dish` are untouched: they keep the nested `dish.imageUrl`. If you want a
uniform render, keep reading `dish.imageUrl` there — do not add a second, top-level copy.

### 6.3 `src/features/menus/components/MealRow.tsx` — **no change required**

It reads `meal.dish.imageUrl`, and `Meal` (the details shape) still nests `dish`. Leave it. If a
new component renders a `MenuWriteResult` meal, it must read `meal.imageUrl` (flat), not
`meal.dish.imageUrl`.

### 6.4 `src/features/menus/pages/CreateMealPlanPage/CreateMealPlanPage.tsx` — **optional**

Line 52's comment becomes half-outdated. Reword it; keep the invalidation:

```ts
// Response có `dishId`/`dishName`/`imageUrl` nhưng vẫn thiếu `cuisineType`/`description`
// → đọc lại `GET /api/menus/details` cho dish đầy đủ.
```

### 6.5 `src/features/recipes/pages/MyRecipesPage/MyRecipesPage.tsx` — **optional**

`RecipeManageCard` (line ~241) has no image today; it starts with a badge row over
`recipe.dishName`. That is now a natural place for a thumbnail. Purely cosmetic — nothing breaks
by leaving it.

### 6.6 `recommendedRecipes` — **nothing to do**

`grep -r "recommendedRecipes" src/` returns zero hits in the frontend. The recommendation UI does
not exist yet, so the new field on `RecipeSummaryResponse` has no consumer. Do not wire it up as
part of this change.

### 6.7 Saved recipes — **nothing to do**

The frontend does not call `GET /api/saved/recipes` today (no `api/saved/recipes` reference in
`src/`). When that screen is built it gets `imageUrl` for free.

---

## 7. Verifying against a running backend

Recipes with a null image are the norm, so seed one first as an admin:

```bash
# 1. give a dish an image
curl -X PATCH "$API/api/admin/dishes/$DISH_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://cdn.example.com/dishes/pho-chay.jpg"}'

# 2. every recipe of that dish now reports it
curl "$API/api/recipes?keyword=ph%E1%BB%9F" -H "Authorization: Bearer $TOKEN"
```

Check, in order:

1. `imageUrl` is **top-level** on each recipe — not nested under a `dish` object.
2. It is the exact string that was PATCHed — no prefix, no suffix.
3. Rename the dish or edit the recipe and confirm the image does **not** disappear (a recipe edit
   never touches the dish image).
4. `POST /api/menus` with that dish → `days[].meals[].imageUrl` is populated, and there is still
   **no** `days[].meals[].dish` object.
5. A dish with no image → `"imageUrl": null`, not `""` and not a missing key.

---

## 8. FAQ

**Q: Is this a breaking change?**
No. A new nullable property was added to four response types (`RecipeResponse`,
`AdminRecipeListResponse`, `MealResponse`, `RecipeSummaryResponse`), reached through five endpoint
groups. Nothing was removed, renamed, or re-typed. A client that ignores `imageUrl` behaves exactly
as before.

**Q: Do I need to redeploy the frontend before or after the backend?**
Either order. The backend never reads anything new from the client, and the field is optional in
every response.

**Q: Why is `imageUrl` on the recipe, if the image belongs to the dish?**
Because a recipe list would otherwise need a second call per row to resolve `dishId → dish`. The
value is a copy of the dish's image at read time, not a second source of truth.

**Q: Can the recipe edit form let a member set the picture?**
No. Single source of truth is the dish. Recipe writes must not carry `imageUrl`.

**Q: One recipe of the dish has a picture and another doesn't — how?**
That cannot happen through this API. They share one `dish.image_url`. If you see it, you are
looking at two *different* dishes with similar names (find-or-create matched on the exact trimmed,
lowercased name).

**Q: The image is stale after an admin changes it.**
The recipe payload stores no version. Re-fetch; there is no push notification for dish curation.

**Q: Does search show recipe thumbnails now?**
No. `GET /api/search` results (`SearchResultItem`) carry no image for any entity type. Unchanged.
