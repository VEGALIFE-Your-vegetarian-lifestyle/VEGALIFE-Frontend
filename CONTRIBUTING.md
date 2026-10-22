# Quy ước Git — VEGALIFE Frontend

Áp dụng cho mọi thành viên. Mục tiêu: lịch sử commit đọc được, review nhanh, tự sinh changelog.

## 1. Đặt tên branch

```
<type>/<scope-ngắn-gọn>
```

| Type | Dùng khi |
|---|---|
| `feat/` | tính năng mới |
| `fix/` | sửa bug |
| `refactor/` | đổi cấu trúc, không đổi hành vi |
| `docs/` | chỉ tài liệu |
| `chore/` | cấu hình, dependency, tooling |
| `test/` | chỉ thêm/sửa test |

- Chữ thường, nối bằng `-`, không dấu, không viết hoa.
- Một branch = một mục tiêu. Tên nêu domain, không nêu tên người.
- **Không** dùng `feature/` — repo đang lẫn `feat/` và `feature/`, thống nhất `feat/`.

```bash
git switch -c feat/meal-plan
git switch -c fix/refresh-token-loop
```

## 2. Commit message — Conventional Commits

```
<type>(<scope>): <mô tả ngắn, thì hiện tại, không viết hoa đầu, không chấm cuối>

<body: vì sao + thay đổi chính, dòng ≤ 100 ký tự>

<footer: BREAKING CHANGE / refs #issue>
```

**Type**: `feat` `fix` `refactor` `perf` `docs` `test` `style` `chore` `build` `ci`

**Scope** (tuỳ chọn, lấy theo domain): `auth` `post` `admin` `ai` `menu` `recipe` `profile` `i18n` `docs`

Quy tắc:

- Subject ≤ 72 ký tự, mô tả **cái gì thay đổi**, không phải "update code".
- Body giải thích **vì sao**, liệt kê thay đổi lớn; ghi rõ phần chưa làm.
- Mỗi commit một việc. Không trộn feature với format/dependency.
- Không commit `.env`; chỉ `.env.example`.

Ví dụ:

```
feat(menu): add weekly meal plan CRUD

Thêm MealPlanPage, MenuFormPage, MenuWeekView, DishPickerDialog;
useMenus + menuService nối #60–#64.

Chưa nối route /meal-plan — làm ở commit tiếp theo.
```

```
fix(auth): refresh token loop on 401

Interceptor gọi refresh cho chính request /auth/refresh, gây vòng lặp.
Bỏ qua refresh khi URL là endpoint refresh.
```

## 3. Quy trình làm một feature

```bash
git switch main && git pull
git switch -c feat/<scope>
# ... code, test ...
npm run typecheck && npm test
git add <file>            # chỉ file thuộc feature
git commit                # message theo mục 2
git push -u origin feat/<scope>
gh pr create --base main --fill
```

## 4. Trước khi push

- [ ] `npm run typecheck` sạch
- [ ] `npm test` xanh
- [ ] `git status` không có file rác (dist, log, .env)
- [ ] Commit message đúng format, đọc lại lần cuối
