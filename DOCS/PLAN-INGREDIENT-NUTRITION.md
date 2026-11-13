# Plan — áp dụng thay đổi BE "dinh dưỡng theo nguyên liệu" (V49/V50)

**Nguồn:** `DOCS/frontend-api-changes-ingredient-nutrition.md` (BE merge `991a7ef`, PR #183)
**Phạm vi:** mục A (bắt buộc — chống vỡ typecheck / 400) + mục B (hiển thị dữ liệu mới)
**Không làm:** mục C của tài liệu BE (`GET /api/dishes/suggestions` + 10 filter, màn admin curation ingredient) — FE chưa gọi / chưa có màn.
**Trạng thái:** đã làm xong mục A + B (2026-11-06). `npm run typecheck` sạch, `npm test` 253 pass.

---

## 0. Quyết định đã chốt

| # | Câu hỏi | Chốt |
|---|---|---|
| 1 | Hiện dinh dưỡng ở đâu trong `MyRecipesPage` | **Cả card lẫn dialog chi tiết** — card 1 dòng gọn (kcal + protein), dialog đủ 5 chỉ số |
| 2 | Nhãn đơn vị trong ô unit | **Giữ tiếng Anh**: giá trị hiển thị và wire đều là `g` / `ml` / `piece`. Không dịch sang "gam/cái/quả", không dùng nhãn `piece` → "phần" |
| 3 | Cách hiển thị tổng | **Tổng cả công thức**, ghi nhãn rõ ("Cả công thức"). Không chia `servings`, không re-round |

Hệ quả của #2:
- `UNIT_SUGGESTIONS` = `["g", "ml", "piece"]`.
- Datalist chỉ gợi ý, nhưng **schema chặn cứng** các giá trị ngoài 3 mã này (khi hàng là nguyên liệu mới) → tránh member gõ `kg` và ăn `400`.
- Không cần key i18n cho tên đơn vị; chỉ cần nhãn "Đơn vị" sẵn có.

Hệ quả của #3:
- API trả tổng cả recipe, FE hiện nguyên số + nhãn. Không có `perServing` ở bất kỳ đâu → key `readiness.value.perServing` bị xoá hẳn.

---

## 1. Bối cảnh ngắn

BE đổi mô hình: mỗi nguyên liệu có **1 đơn vị duy nhất** (`G`/`ML`/`PIECE`) + 5 giá trị dinh dưỡng **trên 1 đơn vị đó**. Tổng recipe = `Σ(amount × giá trị)`, làm tròn 1 lần trên tổng (HALF_UP, 2 số lẻ). Trả 5 tổng + `nutritionResolved`; tất cả `null` khi chưa resolve.

Ba bẫy ảnh hưởng trực tiếp tới code FE:

1. `POST /api/recipes` **bỏ** 5 field dinh dưỡng — FE đang gửi, BE bỏ qua.
2. Line `unit`: optional; **bị bỏ qua** nếu nguyên liệu đã tồn tại; **400** nếu không map được (`kg`, `tbsp`, `cup`…) và tên là **mới**.
3. ~~`GET /api/ingredients` **không trả `unit`**~~ — **đã sửa**: BE trả `unit` (`G|ML|PIECE|null`),
   form hiện đơn vị đã lưu ở ô read-only khi member chọn nguyên liệu có sẵn.

---

## 2. Mục A — bắt buộc (theo thứ tự thực hiện)

### A1. `src/features/recipes/types.ts`

| Đối tượng | Thay đổi |
|---|---|
| `CreateRecipeRequest` | Xoá `calories`, `proteinG`, `carbohydrateG`, `fatG`, `fiberG`. Inline `ingredients` đổi `unit: string` → `unit?: string` |
| `RecipeIngredientInput` | `unit: string` → `unit?: string` |
| `RecipeIngredient` | `unit: string` → `unit: string \| null` |
| `Recipe` | Thêm `nutritionResolved: boolean`; giữ 5 field `number \| null` |
| `AdminRecipe` | `Omit<Recipe, "dishName">` → `Omit<Recipe, "dishName" \| "nutritionResolved">` (admin list **không** trả tổng dinh dưỡng — đừng để type hứa điều BE không gửi) |
| `Ingredient` (autocomplete) | Giữ nguyên hôm nay. Chừa `ponytail:` note: khi BE thêm `unit` vào `IngredientResponse` thì mở đọc unit thật ở đây (xem A5) |

### A2. `CreateRecipePage/schema.ts`

- Xoá 5 field khỏi `RecipeFormValues`, `initialRecipeValues()`, `buildRecipeSchema()`.
- Xoá `optionalDecimal()` — không còn chỗ dùng.
- `ingredientSchema.unit`:
  - bỏ `.required()`, bỏ `.max(MAX_UNIT_LENGTH)` (xoá luôn hằng số nếu hết chỗ dùng);
  - thêm test: rỗng → hợp lệ; khác rỗng → phải thuộc `g | ml | piece` (case-insensitive, trim trước khi so).
- Message lỗi mới: `recipe:errors.unitInvalid` = "Đơn vị chỉ nhận g / ml / piece".

### A3. `CreateRecipePage/payload.ts`

- Xoá 5 block `toOptionalNumber(...)` + 5 dòng gán `payload.*`.
- Ingredient line: chỉ gán `unit` khi **hàng là nguyên liệu mới** và `unit.trim() !== ""`; ngược lại **bỏ khoá khỏi object**.

### A4. `CreateRecipePage/AutocompleteField.tsx`

- Thêm prop optional `onSelect?: (item: T) => void`, gọi trong `select()` **trước/sau** `onChange(getLabel(item))`.
- Không truyền `onSelect` → hành vi y như cũ (không phá chỗ gọi khác).

### A5. `CreateRecipePage/IngredientEditor.tsx`

- `UNIT_SUGGESTIONS` → `["g", "ml", "piece"]`.
- Hàng đã chọn từ autocomplete (nguyên liệu có sẵn) → ô unit render **read-only**, hiển thị text tĩnh "standard unit" (i18n), không cho gõ. Lý do: BE bỏ qua unit đã gõ, hiển thị ô nhập editable là nói dối member.
- Cần biết hàng là "có sẵn" → thêm cờ phụ trên hàng form. **Phương án:** thêm `existing?: boolean` vào `RecipeIngredientInput`, set `true` qua `onSelect` của `AutocompleteField`, reset `false` khi member sửa tay tên (onChange của ô tên).
  - Cờ này chỉ để điều khiển UI + payload, **không** gửi lên BE (payload map thủ công từng field, nên tự nhiên bị loại).
- Tooltip/helper dưới ô unit khi `existing`: "Nguyên liệu đã có sẵn — số lượng tính theo đơn vị hiển thị ở đây."

### A6. `CreateRecipePage.tsx`

- `filledIngredients` (dòng ~135) bỏ điều kiện `item.unit.trim()` → chỉ cần tên + amount.
- Rà lại: nếu còn chỗ nào đọc `values.calories`… thì xoá.

### A7. `CreateRecipePage/RecipePreviewCard.tsx`

- Xoá `const calories = values.calories.trim()` và block badge kcal.
- Không thay bằng ước lượng: form không có dinh dưỡng nguyên liệu, tính client-side là bịa.

### A8. `AdminRecipesPage/RecipeDetailDialog.tsx`

- `ingredient.unit` có thể `null` → render `unit ? \`${amount} ${unit}\` : amount`. Không để chuỗi `"200 null"`.
- Không thêm panel dinh dưỡng ở đây (admin list không có tổng).

### A9. Test + i18n

- `CreateRecipePage/__tests__/schema.test.ts`: xoá khối assert 5 field dinh dưỡng; thêm case:
  - `unit: ""` → pass; `unit: "g"|"ml"|"piece"` (và hoa) → pass; `unit: "kg"|"tbsp"` → fail.
  - `buildRecipePayload` không còn `calories`/`proteinG`…; hàng existing không gửi `unit`; hàng mới có unit thì gửi.
- `MyRecipesPage/__tests__/filter.test.ts`: fixture `Recipe` thêm `nutritionResolved: false`.
- `i18n/{vi,en}/recipe.json`:
  - xoá `readiness.value.perServing`;
  - thêm `errors.unitInvalid`, `ingredient.existingUnit` (nhãn read-only), `ingredient.existingUnitHint`.

---

## 3. Mục B — hiển thị dữ liệu mới

### B1. `MyRecipesPage` card — 1 dòng gọn

- `nutritionResolved === true`: 1 dòng cuối card, ví dụ `594 kcal · 71 g protein`, ghi rõ là **cả công thức** (dùng key i18n `nutrition.cardTotals`).
- `false`: "Chưa có dữ liệu dinh dưỡng".
- Không hiện `0` khi `null`; không sort/filter theo giá trị `null` (`filter.ts` giữ nguyên).

---

## C. Trang quản lý nguyên liệu (admin) — ✅ 2026-11-06

- Route `/admin/ingredients` (`recipes/pages/AdminIngredientsPage/`), sidebar có badge đếm `PENDING`.
- 5/7 endpoint ingredient: `GET` list (`page`/`size`/`name`), `POST`, `PATCH`, `DELETE`.
  **Cố ý bỏ** `POST /{id}/approve` và `/reject` theo yêu cầu.
- Bảng nguyên liệu **không** có cột duyệt và **không** có filter trạng thái — chỉ tên, đơn vị,
  5 chỉ số dinh dưỡng, thao tác. `moderationStatus` vẫn nằm trong type (response trả về).
- `ApproveRecipeDialog`: duyệt recipe có nguyên liệu thiếu → nhập `unit` + 5 dinh dưỡng → PATCH
  từng nguyên liệu rồi mới approve.
- Logic thuần + test: `src/features/recipes/ingredientForm.ts` (+ `AdminIngredientsPage/__tests__`).

### B2. `recipes/components/RecipeDetailDialog.tsx` — đủ 5 chỉ số

- Thêm khối "Dinh dưỡng" dưới dải 4 thông số.
- `true`: kcal (làm tròn nguyên), protein / carb / fat / fibre (0–1 số lẻ) + đơn vị `g`/`kcal`, nhãn "Cả công thức".
- `false`: một dòng "Chưa có dữ liệu dinh dưỡng" — không hiện ô rỗng, không hiện thanh macro 0.
- Format tập trung ở 1 helper nhỏ trong file (hoặc `MyRecipesPage/filter.ts` nếu tái dùng): `formatNutrition(recipe) → { kcal, protein, ... } | null`.

### B3. Cảnh báo trước submit (form tạo recipe)

- BE không có endpoint update recipe cho member → sai amount/nguyên liệu chỉ sửa được bằng xoá + tạo lại.
- Thêm 1 dòng cảnh báo cạnh nút submit / trong checklist: "Công thức đã tạo không sửa được — kiểm tra định lượng trước khi gửi."

---

## 4. Ngoài phạm vi (ghi lại để khỏi quên)

| Việc | Lý do hoãn |
|---|---|
| 10 filter dinh dưỡng của `GET /api/dishes/suggestions` | FE chưa gọi endpoint (`DOCS/API-COVERAGE.md:438` = ❌) |
| Màn admin curation ingredient (unit + 5 giá trị) | FE chưa có màn |
| Panel dinh dưỡng ở `AdminRecipesPage` | `GET /api/admin/recipes` không trả tổng — cần BE bổ sung |
| Sửa recipe đã tạo | BE chưa có endpoint |
| Đọc `unit` thật của nguyên liệu có sẵn | `GET /api/ingredients` không trả — chờ BE thêm field additive |

---

## 5. Thứ tự & kiểm chứng

```
A1 types → A2 schema → A3 payload → A4 AutocompleteField → A5 IngredientEditor
→ A6 CreateRecipePage → A7 PreviewCard → A8 admin dialog → A9 test/i18n
→ B1 card → B2 detail dialog → B3 cảnh báo
```

Kiểm chứng sau mỗi cụm:
1. `npm run typecheck` — phải sạch sau A1 (mọi chỗ đọc field đã xoá sẽ đỏ ngay).
2. `npm test` — test schema/payload đã viết lại xanh.
3. Tay: tạo recipe 2 nguyên liệu mới (`g`, `ml`) → response `nutritionResolved: false`, 5 tổng `null`, card hiện "Chưa có dữ liệu dinh dưỡng".
4. Tay: gõ `tbsp` cho nguyên liệu **mới** → form chặn tại Yup, không gửi được `400`.
5. Tay: chọn `đậu hũ` từ autocomplete → ô unit read-only, payload **không** có `unit`.

---

## 6. Rủi ro / điểm dễ sai

1. ~~**Unit read-only chỉ là giải pháp tạm** vì thiếu `unit`~~ — **đã xong**: `IngredientResponse` có `unit`, ô read-only hiện đúng đơn vị đã lưu (`null` → "Chưa có đơn vị").
2. Cờ `existing` dễ bị sai trạng thái: member chọn gợi ý rồi **sửa tay** tên thành tên khác → phải reset `existing = false`, nếu không unit bị khoá vĩnh viễn và payload thiếu unit cho nguyên liệu mới.
3. `AdminRecipe` kế thừa `Recipe`: nếu quên `Omit<…, "nutritionResolved">`, TS vẫn biên dịch (chỉ đọc ra `undefined`) → card admin có thể render "Chưa có dữ liệu" sai nghĩa. Dùng `Omit` để type nói đúng.
4. `Recipe.servings` là `number` (khác `RecipeSummaryResponse.servings` có thể `null`) — không liên quan ở phạm vi này, nhưng đừng nhầm khi làm B1/B2.
