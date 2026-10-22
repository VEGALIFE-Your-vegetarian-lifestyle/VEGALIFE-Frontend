# VEGALIFE — Frontend

React SPA cho nền tảng VEGALIFE (lối sống thực vật): công thức, bài viết, địa điểm vegan, video, AI nutrition.

## Stack

React 19 · Vite 8 · TypeScript 6 · TailwindCSS v4 · react-router-dom v7 · Zustand · TanStack React Query · Formik + Yup · Axios · i18next · TipTap 3 · sonner · lucide-react

## Bắt đầu

```bash
npm install
npm run dev     # http://localhost:5173
```

Dev server proxy `/api` → `https://vegalife-backend.onrender.com` (xem `vite.config.ts`).

## Script

| Lệnh | Việc |
|---|---|
| `npm run dev` | Dev server, port 5173 |
| `npm run build` | `tsc -b` + `vite build` |
| `npm run typecheck` | Chỉ kiểm tra type (`tsc -b`) — dùng khi verify, nhanh hơn `build` |
| `npm run lint` | ESLint |
| `npm run preview` | Xem thử bản build |

## Cấu trúc

```text
src/
  app/          # Khởi động: main, App, routes, guards, layout
  components/   # ui/ (primitive) + common/ (ghép sẵn)
  features/     # Nghiệp vụ theo domain: admin, auth, categories, locations,
                # nutrition-ai, posts, profile, videos
  i18n/         # i18next setup + locales/{en,vi} (11 namespace)
  shared/       # api, auth, hooks, types, ui, utils — KHÔNG import features/
  test/         # Hạ tầng test (setup, e2eEnv, fixtures)
```

Alias `@/` trỏ đến `src/`. Quy tắc import một chiều và bản đồ file chi tiết:
[`DOCS/CODE-STRUCTURE.md`](DOCS/CODE-STRUCTURE.md).

## Tài liệu

- [`.claude/CLAUDE.md`](.claude/CLAUDE.md) — bản đồ codebase, conventions, tra cứu nhanh
- [`GETSTARTED.md`](GETSTARTED.md) — hướng dẫn setup chi tiết
- [`DOCS/CODE-STRUCTURE.md`](DOCS/CODE-STRUCTURE.md) — cây thư mục + quy tắc import
- [`DOCS/API-COVERAGE.md`](DOCS/API-COVERAGE.md) — endpoint nào đã nối, cái nào còn mock
- [`DOCS/SRS.md`](DOCS/SRS.md) — đặc tả yêu cầu
- [`DOCS/DESIGN-MASTER.md`](DOCS/DESIGN-MASTER.md) — design system, tokens, component library

## Ngôn ngữ

i18n với 2 locale `en` (mặc định) và `vi`, 10 namespace. Đổi ngôn ngữ qua `LanguageSwitcher`; lưu ở `localStorage["vegalife-language"]`.
