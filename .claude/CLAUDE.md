# VEGALIFE Frontend — Context for Claude

Project React SPA cho nền tảng VEGALIFE, tập trung vào lối sống thực vật.

## Stack & Tooling

- **Framework**: React 19 + Vite 8 + TypeScript 6
- **Routing**: react-router-dom v7
- **Styling**: TailwindCSS v4 qua `@tailwindcss/vite`
- **State**: Zustand cho auth, React Query cho server state
- **Forms**: Formik + Yup
- **HTTP**: Axios với interceptor xử lý token/refresh
- **i18n**: i18next + react-i18next, ngôn ngữ `en` mặc định, `vi` là secondary
- **Toast**: sonner
- **Icons**: lucide-react
- **Port dev**: 5173
- **Proxy API**: `/api` → `https://vegalife-backend.onrender.com`

## Cấu trúc thư mục quan trọng

```text
src/
  components/
    auth/           # ProtectedRoute, PublicRoute, AdminRoute, AuthLayout
    admin-shell/    # Layout admin với nested routes
    ui/             # Button, Input, Dialog, Table, Select, Badge, Skeleton, Textarea
    layout/         # Layouts chính của app
  pages/
    auth/           # Login, Register, VerifyEmail, ForgotPassword
    Admin/          # AdminDashboardPage, Posts, Videos, Categories, Users
    HomePage/
    ProfilePage/
  services/
    api.ts          # Axios instance + refresh token interceptor
    authService.ts  # Các hàm auth API
  stores/
    authStore.ts    # Zustand store lưu user/token trong sessionStorage
    uiStore.ts      # UI state + language preference
  hooks/
    useAuth.ts      # Tiện ích lấy trạng thái auth
  types/
    user.ts         # Các interface/auth types
```

## Auth Flow

1. `RegisterPage` gọi `register()` → redirect `/verify-email` với email.
2. `LoginPage` gọi `login()` → decode JWT để lấy `role`, lưu `user`, `accessToken`, `refreshToken` vào `authStore` + `localStorage`.
3. `api.ts` tự động gắn `Authorization: Bearer <accessToken>`.
4. Khi 401, interceptor dùng `refreshToken` gọi `/auth/refresh` để lấy accessToken mới; nếu thất bại thì logout + redirect `/login`.
5. `ProtectedRoute`: yêu cầu đăng nhập.
6. `AdminRoute`: yêu cầu đăng nhập + `user.role === "ADMIN"`.
7. `PublicRoute`: nếu đã đăng nhập, redirect admin đến `/admin/dashboard`, user đến `/`.
8. Sau khi login: admin → `/admin/dashboard`, user → `/`.

## Conventions

- Alias `@/` trỏ đến `src/`.
- Components auth sử dụng `useAuth()` từ `src/hooks/useAuth.ts`.
- Form validation dùng Yup; message lỗi tiếng Việt.
- API trả về wrapper: `{ success: boolean, message: string, data: T }`.
- UI components nằm trong `src/components/ui/`; sử dụng `class-variance-authority` cho variants.

## Các route chính

- `/` — Home
- `/login`, `/register`, `/verify-email`, `/forgot-password` — auth (public)
- `/profile` — user đã đăng nhập
- `/admin/dashboard` — admin dashboard
- `/admin/posts|videos|categories|users` — admin

## Admin Dashboard & Category Management

- `AdminDashboardPage` hiển thị metric cards (tổng danh mục, active, soft-deleted, nội dung liên kết) và quick links.
- `/admin` redirect đến `/admin/dashboard`.
- `CategoriesPage` hỗ trợ: tabs All/Active/Deleted, tìm kiếm theo tên/UUID, sort (newest/name/content), phân trang, soft delete, restore, permanent delete, export CSV.
- `categoryService` mock dữ liệu, có thể thay bằng API thật sau này.

## Lưu ý khi làm việc

- Đừng tự ý thêm dependencies nếu thư viện hiện có đã giải quyết được.
- Giữ form theo pattern Formik + Yup đã có.
- Auth store persist vào `sessionStorage` với key `vegalife_auth`.
- i18n setup ở `src/i18n/index.ts`; namespaces: `common`, `auth`, `admin`, `validation`. Mặc định `en`, có thể chuyển `vi` qua `LanguageSwitcher`.
- Role từ JWT được decode ở `LoginPage` qua `src/utils/jwt.ts`.
