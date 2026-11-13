# Frontend API changes — ingredient-level recipe nutrition (V49/V50)

**Backend:** `VEGALIFE-backend`, merge commit `991a7ef` on `dev` (PR #183)
**Decisions:** `docs/adrs/022-ingredient-level-nutrition.md`
**Feature spec:** `docs/feats/ingredient-nutrition.md`
**Date:** 2026-11-05
**Status:** merged to `dev`. `V50` seeds 50 common Vietnamese vegan ingredients.

Recipe nutrition is no longer something a member types. It is **computed from the
ingredients**: every ingredient now carries one unit (`G`, `ML`, `PIECE`) and five
nutrition values measured **per one of that unit**, and a recipe total is the sum of
`amount × per-unit value` across its lines.

Read section 1 first. It is the only part that will break a running client.

---

## 1. TL;DR — what breaks

| # | Change | Frontend impact |
|---|---|---|
| 1 | `POST /api/recipes` **no longer accepts** `calories`, `proteinG`, `carbohydrateG`, `fatG`, `fiberG` | Delete the five nutrition inputs and stop sending them. They are ignored, not stored. |
| 2 | `POST /api/recipes` line `unit` is now **optional** and normalised to `G` / `ML` / `PIECE` | Unit is still worth asking for, but it must be optional and the suggestion list must use the new vocabulary. |
| 3 | `POST /api/recipes` line `unit` is **ignored for an existing ingredient** | The amount is always read in the ingredient's stored unit. A member who types `2 quả` for an ingredient stored as `G` has created `2 g`. |
| 4 | Recipe reads (`GET /api/recipes/me`, `GET /api/recipes/{id}`, `POST /api/recipes`) gain **5 totals + `nutritionResolved`** | Nutrition display is a new UI state: known (`true`) vs not yet known (`false`). |
| 5 | `GET /api/dishes/suggestions` gains **10 nutrition filters** and 5 totals + `nutritionResolved` per recommended recipe | Optional filter UI; the same null handling as recipes. |
| 6 | `POST /api/recipes` requires `unit` today in the client, and the form treats it as required | Relax validation (see 5.2). |
| 7 | Admin ingredient endpoints: `pieceGrams` **removed**, `unit` + 5 nutrition values added | Admin curation screen needs a rebuild of that form. |
| 8 | No member recipe-update endpoint exists | A recipe created with a wrong amount/ingredient cannot be edited. The only fix is delete + recreate. |

There is no migration on the frontend for existing data: every recipe the API returns
now reports totals or `null`, never the old author-entered numbers.

---

## 2. Mental model

One formula, no conversions anywhere:

```
recipe.calories      = Σ (line.amount × ingredient.calories)
recipe.proteinG      = Σ (line.amount × ingredient.proteinG)
recipe.carbohydrateG = Σ (line.amount × ingredient.carbohydrateG)
recipe.fatG          = Σ (line.amount × ingredient.fatG)
recipe.fiberG        = Σ (line.amount × ingredient.fiberG)
```

Rules that follow from it:

1. **`amount` is expressed in the ingredient's single unit.** `200` + `G` means 200 g;
   `2` + `PIECE` means 2 pieces. The client does not send a per-line unit that the
   server honours — see 4.1.
2. **Values are per 1 g / 1 ml / 1 piece, never per 100 g.** Do not multiply by 100
   anywhere in the UI, and never label them "per 100 g".
3. **All five totals or none.** A recipe with one unresolved ingredient yields five
   `null`s and `nutritionResolved: false`. Partial sums are never returned.
4. **Totals are for the whole recipe, not per serving.** If the UI shows "per
   serving", divide by `servings` and label it explicitly. See 6.2.
5. **Rounding happens once, on the total**, `HALF_UP` to 2 decimal places. Do not
   round per line — the numbers would no longer add up on screen.

---

## 3. What the API now returns

### 3.1 `RecipeResponse` — member recipe (create / list / detail)

New fields, after `missingRequiredIngredients`:

```json
{
  "calories": 297.00,
  "proteinG": 35.60,
  "carbohydrateG": 6.40,
  "fatG": 17.46,
  "fiberG": 4.72,
  "nutritionResolved": true
}
```

Unresolved:

```json
{
  "calories": null,
  "proteinG": null,
  "carbohydrateG": null,
  "fatG": null,
  "fiberG": null,
  "nutritionResolved": false
}
```

- The five fields are **always present** and are `null` when unknown (there is no
  `@JsonInclude(NON_NULL)` on these DTOs).
- `0.00` is a real answer (water is legitimately 0 kcal); `null` means "the catalogue
  cannot price this recipe yet".
- `nutritionResolved` is redundant with `calories != null`, but use it as the
  branch condition — it is the contract, not an inference.

### 3.2 `RecipeSummaryResponse` — a recommended recipe in dish suggestions

Same six fields, plus `servings`, which describes the totals:

```json
{
  "id": "…",
  "name": "Vegan pho",
  "description": "…",
  "prepTimeMinutes": 20,
  "cookTimeMinutes": 40,
  "servings": 4,
  "difficulty": "MEDIUM",
  "calories": 512.00,
  "proteinG": 18.40,
  "carbohydrateG": 74.20,
  "fatG": 12.10,
  "fiberG": 6.80,
  "nutritionResolved": true
}
```

`servings` can be `null` on this surface. Do not divide by a null serving count.

### 3.3 `AdminIngredientResponse` — admin ingredient detail/list row

```json
{
  "id": "…",
  "name": "đậu hũ",
  "moderationStatus": "APPROVED",
  "unit": "G",
  "calories": 74.00,
  "proteinG": 8.00,
  "carbohydrateG": 1.90,
  "fatG": 4.80,
  "fiberG": 0.30,
  "nutritionResolved": true,
  "createdAt": "…",
  "updatedAt": "…"
}
```

`unit` is `G`, `ML`, `PIECE` or `null`. Nutrition is per one of that unit.

### 3.4 `RecipeIngredientResponse` — a recipe line

`unit` is now **derived from the ingredient** and can be `null` (legacy unmapped
rows). The line itself has no nutrition fields:

```json
{
  "ingredientId": "…",
  "name": "đậu hũ",
  "amount": 200.0,
  "unit": "G"
}
```

---

## 4. Endpoint by endpoint

### 4.1 `POST /api/recipes`

**Before**

```json
{
  "name": "Spicy tofu stir-fry",
  "dishName": "Tofu Stir-Fry",
  "instructions": "…",
  "servings": 2,
  "calories": 380,
  "proteinG": 22,
  "carbohydrateG": 40,
  "fatG": 12,
  "fiberG": 6,
  "ingredients": [
    { "name": "tofu", "amount": 200, "unit": "g" }
  ]
}
```

**After**

```json
{
  "name": "Spicy tofu stir-fry",
  "dishName": "Tofu Stir-Fry",
  "instructions": "…",
  "servings": 2,
  "ingredients": [
    { "name": "tofu", "amount": 200, "unit": "g" }
  ]
}
```

Request rules for a line:

| Case | Behaviour |
|---|---|
| `unit` omitted, name **new** | Ingredient is created with no unit. Recipe is saved and `nutritionResolved` stays `false` until an admin sets the unit and nutrition. |
| `unit` omitted, name **existing** | Fine. The ingredient's own unit governs. |
| `unit` maps to `G`/`ML`/`PIECE`, name **new** | Ingredient is created with that unit. Accepted spellings: `g`, `gram(s)`, `gam`, `gr`, `ml`, `milliliter/litre(s)`, `mililit`, `piece(s)`, `pcs`, `pc`, `cái`, `chiếc`, `quả`, `trái`, `củ`, `cây`, `miếng`, `ổ`, `con`. |
| `unit` maps to `G`/`ML`/`PIECE`, name **existing** | **Ignored.** The ingredient already has a unit, and every recipe that references it must agree. |
| `unit` present but unmappable (`kg`, `tbsp`, `tsp`, `cup`, `bó`, `slice`, free text), name **new** | `400`. These are not spelling variants — accepting them would silently change the quantity. |
| `unit` present but unmappable, name **existing** | Ignored (not parsed), so it does not fail. |

**The dangerous consequence, and what the UI must do about it.** For an existing
ingredient the typed unit is discarded and `amount` is read in the ingredient's
stored unit. The client cannot currently see that stored unit (`GET /api/ingredients`
returns only `id`, `name`, `createdAt`). Choices, in order of preference:

1. Ask the backend to add `unit` to `IngredientResponse` (additive, safe). Then, when
   the member picks an existing ingredient, show the unit as a fixed suffix and send
   `amount` in that unit.
2. Until then: when the name comes from autocomplete (existing ingredient), render the
   unit column as read-only "theo đơn vị chuẩn" and do not let the typed unit imply a
   different quantity. When the member types a brand-new name, show the unit picker
   with only `g` / `ml` / `piece` (plus Vietnamese labels) and make it optional.

Do **not** accept `kg`/`tbsp`/`cup` in the new-ingredient picker: the request will be
rejected with `400`. If the member wants 0.5 kg, send `amount: 500, unit: "g"`.

Amount validation is unchanged: `> 0`, at most 3 decimal places.

### 4.2 `GET /api/recipes/me` and `GET /api/recipes/{id}`

Both now include the five totals and `nutritionResolved`. Everything else is
unchanged. `GET /api/recipes/{id}` is owner-only (another member's recipe is a `404`,
not a `403`) — do not build a public recipe detail on top of it.

Use `nutritionResolved` to choose between three UI states:

| State | Source | Suggested rendering |
|---|---|---|
| Known | `nutritionResolved: true` | Show `calories` etc., 0–2 decimals |
| Not yet known | `nutritionResolved: false` | "Chưa có dữ liệu dinh dưỡng" / "Nutrition not available yet" — never `0` |
| No data, filtered out | n/a | Recipes with unknown nutrition never pass a nutrition filter (see 4.3) |

### 4.3 `GET /api/dishes/suggestions`

Ten new query parameters, all decimals, all optional, all evaluated against the
**whole recipe**:

| Parameter | Meaning |
|---|---|
| `minCalories` / `maxCalories` | kcal, whole recipe |
| `minProtein` / `maxProtein` | g protein, whole recipe |
| `minCarbohydrate` / `maxCarbohydrate` | g carbohydrate, whole recipe |
| `minFat` / `maxFat` | g fat, whole recipe |
| `minFiber` / `maxFiber` | g fibre, whole recipe |

Semantics to design around:

- **Unknown fails every bound**, lower and upper. Do not send `maxCalories: 500`
  expecting unresolved recipes back — they are excluded, deliberately.
- Filters narrow **recipes**, not dishes. A dish with no surviving recipe disappears,
  and `totalElements` counts only what the caller receives.
- If the filter UI collects per-serving values, multiply by `servings` before
  sending. The API only knows whole-recipe totals.

Each item in `recommendedRecipes` is a `RecipeSummaryResponse` (see 3.2), so the
suggestion card can show nutrition directly.

### 4.4 `GET /api/ingredients` (autocomplete)

Unchanged: `id`, `name`, `createdAt` only. No unit, no nutrition, on purpose — it is
a name suggestion, not a label. This is exactly why 4.1 item 1 matters.

### 4.5 Admin ingredient endpoints

| Endpoint | Change |
|---|---|
| `POST /api/admin/ingredients` | Body: `name`, `unit`, `calories`, `proteinG`, `carbohydrateG`, `fatG`, `fiberG`. No `pieceGrams`. |
| `PATCH /api/admin/ingredients/{id}` | Same fields, all optional; omitted fields keep their value. No `pieceGrams`. |
| `GET /api/admin/ingredients` / `{id}` | Response gains `unit`, five values and `nutritionResolved`; drops `pieceGrams`. |

Validation rules the curation UI must encode:

- **All five or none.** On an ingredient with no values, sending 1–4 values is `400`.
  On one that already has all five, sending a single value is accepted as a
  correction (the other four are carried over). The same is true for `PATCH`.
- **Nutrition without a unit is `400`**: a per-unit figure with no unit is
  meaningless. A bare name (no unit, no nutrition) is **allowed** — that is how a
  pending ingredient enters the curation queue.
- **`PIECE` takes a per-piece estimate** — the admin types the calories/macros of one
  piece directly. There is no piece-weight field to fill in, and none to display.
- **Changing `unit` is silent and allowed.** It reinterprets every existing recipe
  amount for that ingredient (`200 g` of rice becomes `200 ml` of rice) and every
  recipe is recomputed in the same transaction. If the UI offers a unit change,
  warn the admin in plain language; the API will not stop them.
- `nutritionResolved` is read-only: `true` only when the unit and all five values are
  present.
- Deleting is soft. Names are not freed; a member reusing a deleted name gets `400`.

---

## 5. Frontend implementation checklist

Paths below are in `../VEGALIFE-Frontend`.

### 5.1 `src/features/recipes/types.ts`

- `CreateRecipeRequest`: delete `calories` / `proteinG` / `carbohydrateG` / `fatG` /
  `fiberG`; make `RecipeIngredientInput.unit` optional (`unit?: string`).
- `RecipeIngredient.unit`: `string | null`.
- `Recipe`: keep the five nullable numbers, add `nutritionResolved: boolean`.
- Add `nutritionResolved: boolean` to whatever type models
  `RecipeSummaryResponse` (suggestions / meal plan), and any ingredient summary type
  that gets `unit`.
- Add an admin ingredient type with `unit: "G" | "ML" | "PIECE" | null`, the five
  nullable numbers and `nutritionResolved`.

### 5.2 `CreateRecipePage/schema.ts`

- Delete `calories`, `proteinG`, `carbohydrateG`, `fatG`, `fiberG` from
  `RecipeFormValues`, `initialRecipeValues()` and `buildRecipeSchema()`.
- Delete `optionalDecimal` if nothing else uses it.
- Ingredient row: `unit` is no longer required. Keep `MAX_UNIT_LENGTH` only if the
  field survives; stop validating free text as the source of truth.
- If you keep the unit input for new ingredients, validate it against
  `g | ml | piece` (case-insensitive, plus the Vietnamese variants the backend
  accepts) instead of accepting any string — otherwise the form will happily produce
  a `400`.

### 5.3 `CreateRecipePage/payload.ts`

Delete the five `toOptionalNumber(...)` blocks and their `payload.*` assignments.
Ingredient lines: send `unit` only when non-empty, and only when the member is
creating a new ingredient; otherwise omit it.

### 5.4 `CreateRecipePage/IngredientEditor.tsx`

The current `UNIT_SUGGESTIONS` list (`kg`, `l`, `tbsp`, `tsp`, `cup`, `clove`,
`pinch`) now produces `400` for new ingredients. Replace it with the three-code
vocabulary and label it clearly:

| Wire value | Vietnamese label |
|---|---|
| `g` | gam |
| `ml` | ml |
| `piece` | phần / cái / quả (pick one, keep it consistent) |

Make the field optional, and show the "ignored for an existing ingredient" behaviour
(4.1) rather than letting the member believe they chose a unit.

### 5.5 `CreateRecipePage/RecipePreviewCard.tsx`

- Remove the `calories` badge source (`values.calories`).
- The preview is built from form values, so it cannot know the totals before the
  recipe is saved — either drop the kcal badge entirely or label it as unknown. Do
  **not** compute an estimate client-side: the client does not and should not hold
  ingredient nutrition.
- `readiness.value.perServing` translation becomes unused; delete it from
  `vi/recipe.json` and `en/recipe.json` rather than leaving dead copy.

### 5.6 `CreateRecipePage.tsx`

- `filledIngredients` (line ~135) currently treats a row as complete only when
  `unit.trim()` is non-empty. Drop the unit part.
- If a nutrition panel exists anywhere in the form, remove it. As of this writing the
  five fields exist in the form values/schema/payload but no input renders them, so
  the visible work is the schema/payload cleanup plus the readiness logic.

### 5.7 `MyRecipesPage`

- Show nutrition on the card: kcal and at least protein/carb/fat/fibre when
  `nutritionResolved` is true; show "Chưa có dữ liệu dinh dưỡng" when false. The
  screen subtitle already promises "nutrition at a glance" — the data is now
  available.
- Keep `filter.ts` client-side filtering as-is; it has no nutrition filter today.

### 5.8 `AdminRecipesPage/RecipeDetailDialog.tsx`

- `ingredient.unit` may be `null` — render `amount` alone rather than `"200 null"`.
- The admin recipe list response (`AdminRecipeListResponse`) does **not** carry
  nutrition totals today. If the admin needs to see why a recipe is unresolved, that
  is a backend follow-up (add the totals + `nutritionResolved`), not something the
  frontend can derive.

### 5.9 Admin ingredient curation screen

- Rebuild the form around `name`, `unit` (select: G / ML / PIECE), and five decimal
  inputs — all five required together.
- Remove any "piece weight (g)" input; `PIECE` means "the values below are for one
  piece".
- A partially filled row must be impossible to submit: disable save until the unit is
  set and all five values are present, or until the row is intentionally left as a
  bare name with no unit and no nutrition.
- On a unit change, show an explicit warning that existing recipe quantities will be
  reinterpreted. The server will not ask for confirmation.

### 5.10 Suggestions / meal-plan surface

- Add the ten nutrition filters next to the existing time/difficulty filters, or
  expose a smaller subset (e.g. kcal range + protein floor). All are independent.
- Read `nutritionResolved` per recommended recipe; omit the macro row rather than
  showing zeros.
- Remember: filtering by nutrition hides unresolved recipes entirely.

---

## 6. Display rules

### 6.1 Null vs zero

| Value | Meaning | UI |
|---|---|---|
| `nutritionResolved: true`, `calories: 0.00` | Genuinely zero (water, black coffee) | `0 kcal` |
| `nutritionResolved: false`, `calories: null` | Unknown, catalogue incomplete | "Chưa có dữ liệu" |
| Field absent | Should not happen for recipes; treat like `null` defensively | "Chưa có dữ liệu" |

Never coerce `null` to `0` for sorting, charting or filtering.

### 6.2 Whole recipe vs per serving

The API returns whole-recipe totals. If the product shows per-serving values:

```
perServing = total / servings
```

- Require `servings != null && servings > 0`.
- Re-round for display (the stored values already carry 2 decimals; dividing adds
  more).
- Label it. A "297 kcal" badge on a 2-serving recipe that is actually 594 kcal is a
  support ticket.

### 6.3 Formatting

- Values are `BigDecimal` serialised with scale 2 (`297.00`), parsed as JS `number`.
- Show kcal as an integer (`Math.round`) and macros with 0–1 decimals.
- Keep units explicit: `kcal`, `g`. Fibre is `g` too.

### 6.4 Don't recompute on the client

The client never receives per-ingredient nutrition, so it cannot recompute a total.
Treat totals as read-only server output. This also means the create-form preview
cannot show a live kcal estimate — do not fake one.

---

## 7. Behaviour after deploy (data readiness)

1. `V49` nulled every existing recipe's stored nutrition; `V50` recomputed the ones
   whose ingredients were seeded. Anything still unresolved (custom ingredient, unit
   not mappable, ingredient not in the seed) stays `null` until an admin curates it.
2. Every nutrition filter fails closed on `null`. Post-deploy, dish suggestions and AI
   menu building return **fewer** dishes than before, not wrong ones. Do not "fix" this
   by defaulting missing values to 0.
3. Admin curation is the recovery path: set `unit` + all five values on a `PENDING`
   ingredient, and every recipe using it becomes resolved in the same transaction.
4. Seeded data is real USDA FDC (CC0) values, per one unit. Spot-check before
   presenting nutrition as authoritative: the `PIECE` rows are per-piece estimates
   (`trứng gà` 1 quả, `chuối` 1 quả, `cà chua` 1 quả, …), not weights.

---

## 8. Testing checklist

- Create a recipe using only new ingredients with units `g`, `ml`, `piece` → response
  has `nutritionResolved: false` (the ingredients are `PENDING` and uncurated), and
  all five totals are `null`.
- Create a recipe with a seeded ingredient (`đậu hũ` 200 + `nước tương` 15) → totals
  are `297.00 / 35.60 / 6.40 / 17.46 / 4.72` kcal / protein / carb / fat / fibre, and
  `nutritionResolved: true`.
- Send `unit: "tbsp"` for a brand-new ingredient → `400`; sending it for an existing
  one → accepted and ignored.
- Send `calories` on `POST /api/recipes` → accepted but absent from the response
  totals (they come from ingredients).
- Render a recipe with `nutritionResolved: false` → no `0 kcal`, no empty macro bars.
- Filter suggestions with `maxCalories` → no unresolved recipe appears.
- Admin: try to save a unit with 3 of 5 values → `400`; save all five → recipes
  referencing it flip to resolved.
- Admin: change `unit` from `G` to `ML` → recipe totals change and no confirmation is
  requested from the API.

---

## 9. Known backend gaps (not blockers, but they shape the UI)

1. **`GET /api/ingredients` does not expose `unit`.** The create form therefore cannot
   tell the member which unit their amount will be interpreted in. The clean fix is an
   additive `unit` field on `IngredientResponse`; until then use the read-only-unit
   treatment in 4.1.
2. **`GET /api/admin/recipes` has no nutrition totals.** An admin cannot see why a
   recipe is unresolved without opening the ingredient rows. Additive follow-up.
3. **`RecipeIngredientResponse` has no per-line nutrition.** A calorie breakdown per
   ingredient would need an additive field; the totals alone are what ships today.
4. **`docs/apis/recipes/get-dishes-suggestions.md` says nutrition fields are omitted
   when `null`.** They are not — there is no `NON_NULL` serialisation on those DTOs,
   so they arrive as `null`. Build against `null`, not absence. (Doc fix tracked
   separately.)
5. **No member recipe update endpoint.** The UI should warn before submission, because
   a wrong ingredient amount is only correctable by deleting the recipe.

---

## 10. Reference

- `docs/adrs/022-ingredient-level-nutrition.md` — why one unit per ingredient, why
  three units only, why the per-piece value is stored directly.
- `docs/feats/ingredient-nutrition.md` — feature behaviour and edge cases.
- `docs/brs/recipes.md` — BR-RECP-003/004/005/006.
- `docs/apis/recipes/post-recipes.md`, `get-recipes-me.md`, `get-recipes-recipeid.md`,
  `get-dishes-suggestions.md`.
- `docs/apis/admin/dish-and-ingredient-crud.md` — curation validation rules.
