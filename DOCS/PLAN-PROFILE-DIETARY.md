# Plan — Profile Dietary (món không thích, dị ứng, sở thích, hạn chế, mục tiêu sức khoẻ)

> Trạng thái: **đã code xong** — `npm run typecheck` sạch, `dietary.test.ts` 14/14 pass · Ngày lập: 2026-10-24 · Branch: `feat/recipes`
> Endpoint: `GET /api/profile`, `PUT /api/profile` (5 field dietary)
> Tài liệu backend: `VEGALIFE-backend/docs/apis/profile/{get-profile,put-profile}.md` (nhánh `dev`)

## 1. Mục tiêu

Cho người dùng khai báo **5 field dietary** trong hồ sơ để chatbot AI và gợi ý món
dùng đúng khẩu vị / tránh thứ gây dị ứng:

| Field | Kiểu | Ý nghĩa | Giới hạn |
|---|---|---|---|
| `preferences` | `string[]` | Sở thích ăn uống (spicy, high-protein…) | ≤50 tag, mỗi tag ≤100 ký tự |
| `dislikes` | `string[]` | Món/nguyên liệu **không thích** | ≤50 × 100 |
| `allergies` | `string[]` | Dị ứng — ràng buộc cứng | ≤50 × 100 |
| `restrictions` | `string[]` | Hạn chế chế độ ăn — ràng buộc cứng | ≤50 × 100 |
| `healthGoal` | `string` | Mục tiêu sức khoẻ, text tự do | ≤200 ký tự |

**Phạm vi**: hiển thị + sửa 5 field trên `/profile` và `/admin/profile`.

**Ngoài phạm vi**: trang profile công khai `GET /api/profile/{userId}` (backend đã có,
FE chưa có màn hình), đổi cách BMI hoạt động, đồng bộ dietary sang AI prompt (backend
tự đọc JSONB, FE không gửi gì thêm).

## 2. Hiện trạng

Code dietary **đã viết một nửa** nhưng chưa dùng được:

| Thứ | Trạng thái |
|---|---|
| `src/features/profile/api.ts` | ✅ đọc/ghi 5 field, wire **camelCase**, chỉ gửi field có mặt |
| `src/features/profile/dietary.ts` | ✅ `toDietaryValues`, `normalizeTags`, `buildDietaryPatch` |
| `src/features/profile/TagInput.tsx` | ✅ chip input (Enter/dấu phẩy thêm, Backspace xoá, gợi ý bấm-để-thêm) |
| `src/features/profile/DietaryPreferencesSection.tsx` | ⚠️ có, nhưng **chưa mount vào page nào** |
| i18n `profile:dietary.*` (28 key) | ❌ **thiếu ở cả `en` và `vi`** → UI hiện ra raw key |
| `npm run typecheck` | ❌ **5 lỗi** trong 2 file mới (xem §5.1) |
| Test | ❌ chưa có |
| Docs | ⚠️ `SRS.md` FR-02 đã ghi "chưa mount"; `API-COVERAGE.md` đã ghi 5 field |

Backend (nhánh `dev`, đã deploy — `GET /api/profile/{uuid}` trả 404 `"User not found"`
đúng đặc tả mới):

- 5 field nằm chung **một cột JSONB** `user_profile.dietary_preferences` nhưng **trả
  phẳng** ở top-level response, **không** bọc object.
- Field chưa set thì **vắng hẳn khỏi JSON** (không trả `null`, không trả `[]`).
- `PUT` merge **từng field**: vắng mặt = giữ nguyên, `[]` = xoá sạch. Nhờ vậy gửi
  riêng dietary không đụng height/weight/age.
- Response cũng đã có `bmi` (tính từ height/weight, 1 chữ số lẻ, không lưu DB) và
  `username`/`email`.

## 3. Quyết định

### 3.1 Mount thành section riêng, **ngoài** form hồ sơ

`DietaryPreferencesSection` tự render `<form>`. `ProfilePage` cũng đang bọc toàn bộ
phần sửa hồ sơ trong một `<form>`. Lồng `<form>` trong `<form>` là HTML không hợp lệ —
trình duyệt tự đóng thẻ ngoài và nút Lưu của hồ sơ có thể submit sai form.

→ Mount như **card anh em**, đặt sau khối "Edit profile", truyền `profile` đã có từ
`useProfile()`. Không truyền state Formik sang.

### 3.2 Lưu riêng, không gộp vào nút Save của hồ sơ

Hai nút Save độc lập, hai mutation độc lập. Lý do:

- `buildDietaryPatch` chỉ gửi field **đã đổi** → không ghi đè height/weight đang gõ dở.
- Gộp sẽ phải đưa 5 field vào Formik + Yup, kéo theo validate mảng/độ dài — nhiều code
  hơn mà lợi ích bằng 0 (backend vốn merge từng field).

Cả hai mutation dùng chung query key `["profile"]` nên cache tự đồng bộ.

### 3.3 Chip tự do + gợi ý, **không** phải enum

Backend nhận chuỗi bất kỳ (chỉ giới hạn số lượng/độ dài). `SUGGESTIONS` trong
`DietaryPreferencesSection.tsx` chỉ là nút bấm nhanh, người dùng vẫn gõ được giá trị
khác. Giữ nguyên — đổi sang `Select` nhiều lựa chọn sẽ chặn mất nhu cầu thật
("dị ứng đậu phộng rang muối" không có trong danh sách nào).

### 3.4 BMI: giữ cách tính ở client

Backend đã trả `bmi`, nhưng `ProfilePage` đang tính từ state Formik — tức là **cập nhật
ngay khi gõ**, trước khi lưu. Dùng `profile.bmi` sẽ chỉ đổi sau khi Save, tệ hơn.

→ Giữ nguyên, thêm `ponytail:` ghi rõ lý do. `toUserProfile` **không** map `bmi` (YAGNI).

### 3.5 `healthGoal` xoá trắng → gửi `""`

Backend không có cách riêng để null hoá một member trong JSONB (gửi `null` = giữ
nguyên). Gửi `""` là cách duy nhất để xoá. Hệ quả: response trả `""` chứ không vắng
field — `toDietaryValues` đã xử lý đúng (`?? ""`). Ghi chú trong `dietary.ts`.

## 4. Thiết kế

### 4.1 File đụng tới

```text
src/features/profile/DietaryPreferencesSection.tsx   sửa: type groups, bỏ icon thừa, truyền id
src/features/profile/TagInput.tsx                    sửa: bỏ import Input thừa, nhận prop id
src/features/profile/dietary.ts                      thêm: comment healthGoal "" (không đổi logic)
src/features/profile/ProfilePage.tsx                 thêm: import + render section
src/i18n/locales/en/profile.json                     thêm: 28 key dietary.*
src/i18n/locales/vi/profile.json                     thêm: 28 key dietary.*
src/features/profile/__tests__/dietary.test.ts       mới: test logic thuần
DOCS/{API-COVERAGE,SRS,CODE-STRUCTURE,TEST-COVERAGE}.md   cập nhật trạng thái
```

### 4.2 Chỗ mount trong `ProfilePage.tsx`

```tsx
{/* sau khối "Edit profile" — KHÔNG nằm trong <form> của hồ sơ */}
<DietaryPreferencesSection profile={profile} />
```

`profile` lấy từ `const { data: profile, isLoading } = useProfile();` đã có sẵn.
Section tự xử lý `profile === undefined` (`toDietaryValues` mặc định rỗng) nên không
cần chờ `isLoading`; nhưng để tránh nháy chip, chỉ render khi `!isLoading`.

### 4.3 Sửa 5 lỗi typecheck

Nguyên nhân chung: mảng `groups` bị suy ra `key: string`, nên index `values[key]` và
`SUGGESTIONS[key]` mất type.

```ts
// DietaryPreferencesSection.tsx
import { DIETARY_LIST_KEYS, type DietaryListKey, ... } from "./dietary";

const SUGGESTIONS: Record<DietaryListKey, readonly string[]> = { ... };

const groups: Array<{
    key: DietaryListKey;
    label: string;
    hint: string;
    placeholder: string;
    tone: "green" | "alert";
}> = [ ... ];          // bỏ hẳn field `icon` — không nơi nào render
```

- Bỏ `Icon` khỏi destructure ở `groups.map` (lỗi TS6133).
- Bỏ `Input` khỏi import `TagInput.tsx` (lỗi TS6133).
- `DIETARY_LIST_KEYS` đang export mà chưa dùng — dùng lại để assert `groups` phủ đủ
  4 key (`groups.map(g => g.key)` so với `DIETARY_LIST_KEYS`) hoặc xoá export. Chọn:
  dùng, vì `dietary.ts` cũng cần nó cho `buildDietaryPatch`.

### 4.4 Sửa a11y: `FormField htmlFor` trỏ vào id không tồn tại

`DietaryPreferencesSection` đặt `htmlFor={`dietary-${key}`}` nhưng `TagInput` tự sinh
`id` bằng `useId()` → bấm vào label **không** focus được ô nhập.

```ts
// TagInputProps thêm:
id?: string;          // dùng id của FormField nếu có, không thì useId()

// trong TagInput:
const generatedId = useId();
const inputId = id ?? generatedId;
```

`DietaryPreferencesSection` truyền `id={`dietary-${key}`}`.

### 4.5 i18n — 28 key, cả `en` và `vi`

Thêm vào `profile.json` (root), theo đúng key code đang gọi:

```json
"dietary": {
  "eyebrow": "Nutrition profile",
  "title": "Dietary preferences",
  "footnote": "Your AI nutrition assistant uses these to tailor every suggestion.",
  "saved": "Dietary preferences saved",
  "saveFailed": "Could not save dietary preferences",
  "cancel": "Discard changes",
  "counter": "{{used}} / {{max}}",
  "customHint": "Suggestions are shortcuts — type anything that fits you.",
  "itemTooLong": "Each entry must be at most {{max}} characters.",
  "limitReached": "You can add at most {{max}} entries.",
  "duplicate": "That entry is already in the list.",
  "removeTag": "Remove {{tag}}",
  "preferences": { "label": "Preferences", "hint": "…", "placeholder": "e.g. spicy, high-protein" },
  "dislikes":    { "label": "Dislikes",    "hint": "…", "placeholder": "e.g. cilantro, mushroom" },
  "allergies":   { "label": "Allergies",   "hint": "…", "placeholder": "e.g. peanuts, soy" },
  "restrictions":{ "label": "Restrictions","hint": "…", "placeholder": "e.g. no added sugar" },
  "healthGoal":  { "label": "Health goal", "hint": "…", "placeholder": "e.g. lose 3 kg in 3 months",
                   "tooLong": "Health goal must be at most {{max}} characters." }
}
```

Lưu ý `counter`: code đang gọi `t("dietary.counter", { count, max })`. i18next thấy
`count` sẽ đi tìm `counter_one` / `counter_other` trước khi rơi về `counter`. Đổi tham
số thành `{ used, max }` để khỏi phải khai báo key số nhiều (cả 2 ngôn ngữ đều không
chia số nhiều ở đây).

Bản `vi` dịch tương ứng; **bắt buộc thêm cả hai** theo convention repo.

## 5. Kiểm chứng

### 5.1 Lỗi typecheck hiện tại (phải hết sau §4.3)

```
src/features/profile/DietaryPreferencesSection.tsx(128,47): TS6133 'Icon' is declared but its value is never read.
src/features/profile/DietaryPreferencesSection.tsx(132,40): TS7053 index DietaryValues bằng 'string'
src/features/profile/DietaryPreferencesSection.tsx(133,51): TS2345 'string' không gán được vào union key
src/features/profile/DietaryPreferencesSection.tsx(135,46): TS7053 index SUGGESTIONS bằng 'string'
src/features/profile/TagInput.tsx(4,1): TS6133 'Input' is declared but its value is never read.
```

### 5.2 Test mới — logic thuần, không React

`src/features/profile/__tests__/dietary.test.ts` (`// @vitest-environment node`):

- `normalizeTags`: trim, gộp khoảng trắng, bỏ rỗng, bỏ trùng không phân biệt hoa thường.
- `toDietaryValues`: `profile` undefined → 4 mảng rỗng + `""`; có dữ liệu → **copy**
  mảng (sửa kết quả không ghi ngược vào profile gốc).
- `buildDietaryPatch`:
  - không đổi gì → `{}` (không gửi request rỗng — backend trả 400 "At least one field").
  - đổi 1 field → chỉ field đó có mặt.
  - xoá hết tag → gửi `[]` (không phải vắng mặt).
  - `healthGoal` xoá trắng → gửi `""`.
  - thứ tự / khoảng trắng khác nhưng nội dung như nhau → **không** tính là đổi.

### 5.3 Lệnh

```sh
npm run typecheck
npm test
```

### 5.4 Kiểm tay (cần tài khoản thật)

1. `/profile` → thấy card "Dietary preferences" với 4 nhóm chip + ô Health goal.
2. Bấm gợi ý `+ Vegan` → chip xuất hiện, nút Save bật.
3. Gõ tag dài >100 ký tự → báo lỗi tại chỗ, không thêm được.
4. Gõ tag trùng (khác hoa thường) → báo "đã có trong danh sách".
5. Save → toast thành công; **F5** → chip còn nguyên.
6. Xoá hết chip của một nhóm → Save → F5 → nhóm đó rỗng (không quay lại giá trị cũ).
7. Sửa height rồi Save hồ sơ → dietary **không** bị đổi (và ngược lại).
8. Đổi ngôn ngữ EN/VI → không còn key thô.

## 6. Rủi ro

| Rủi ro | Xử lý |
|---|---|
| Backend production chưa deploy bản dietary | `GET /api/profile` sẽ **không** trả 5 field → section hiện rỗng và `PUT` trả 400 field lạ. Kiểm tra trước khi merge: gọi `GET /api/profile` bằng token thật, xem có `preferences`/`bmi` không |
| Nested `<form>` | Đã tránh bằng §3.1 — mount ngoài form hồ sơ |
| Hai nút Save gây nhầm | Nút của section nằm trong card riêng, chỉ bật khi có thay đổi; có nút Discard |
| `healthGoal` = `""` khác "chưa set" | Chấp nhận: UI hiển thị giống nhau; backend không có cách null hoá |

## 7. Thứ tự thực hiện

1. §4.3 sửa 5 lỗi typecheck → `npm run typecheck` sạch.
2. §4.4 sửa `htmlFor`/`id`.
3. §4.5 thêm i18n `en` + `vi`.
4. §4.2 mount vào `ProfilePage`.
5. §5.2 viết test logic → `npm test`.
6. Cập nhật docs: `SRS.md` FR-02 (bỏ "chưa mount"), `API-COVERAGE.md` (Profile row),
   `CODE-STRUCTURE.md` §3.7, `TEST-COVERAGE.md` (thêm 1 file test),
   `.claude/CLAUDE.md` mục "Lưu ý khi làm việc" (bỏ ghi chú chưa mount nếu có).
