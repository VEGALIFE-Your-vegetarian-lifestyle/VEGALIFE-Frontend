# 🚀 Getting Started — VEGALIFE Frontend

Hướng dẫn setup và bắt đầu code cho dự án **Vegetarian Support Application (VEGALIFE)**.

---

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
3. [Setup lần đầu](#setup-lần-đầu)
4. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
5. [Tech Stack](#tech-stack)
6. [Quy tắc code](#quy-tắc-code)
7. [Commands thường dùng](#commands-thường-dùng)
8. [Troubleshooting](#troubleshooting)

---

## Tổng quan

**VEGALIFE** là ứng dụng web hỗ trợ người ăn chay, bao gồm các tính năng:

- 📝 Blog & Video về ẩm thực chay
- 🍽️ Gợi ý thực đơn hàng ngày
- 🤖 Chatbot AI tư vấn dinh dưỡng
- 🗺️ Tìm nhà hàng chay gần bạn
- 👤 Quản lý profile cá nhân
- ⚙️ Admin dashboard quản trị

Đây là **frontend-only** project sử dụng React + TypeScript + Vite.

---

## Yêu cầu hệ thống

| Công cụ | Phiên bản yêu cầu | Ghi chú |
|---------|-------------------|---------|
| **Node.js** | ≥ 18.x (khuyến nghị 20.x LTS) | Tải tại [nodejs.org](https://nodejs.org) |
| **npm** | ≥ 9.x | Đi kèm với Node.js |
| **Git** | ≥ 2.x | Tải tại [git-scm.com](https://git-scm.com) |
| **VS Code** | Bản mới nhất | Khuyến nghị cài extensions bên dưới |

### VS Code Extensions khuyến nghị

```
ESLint
Prettier
Tailwind CSS IntelliSense
Error Lens
GitLens
```

---

## Setup lần đầu

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd VEGALIFE-Frontend
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

⏱️ Quá trình này mất khoảng 2–5 phút tùy tốc độ mạng.

### Bước 3: Cấu hình environment variables

Tạo file `.env.local` từ template:

```bash
# Copy .env.example thành .env.local
cp .env.example .env.local
```

Hoặc tạo thủ công file `.env.local` với nội dung:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MAP_API_URL=
VITE_MAP_API_KEY=
```

> ⚠️ **QUAN TRỌNG:**
> - **KHÔNG BAO GIỜ** commit file `.env.local` hoặc `.env` vào Git
> - File này đã được thêm vào `.gitignore`
> - Mỗi developer tự cấu hình biến môi trường riêng
> - API key thật chỉ đưa vào server production

### Bước 4: Chạy development server

```bash
npm run dev
```

Truy cập: http://localhost:5173

✅ Nếu thấy trang chủ VEGALIFE hiển thị → Setup thành công!

### Bước 5: Kiểm tra build

```bash
npm run build
```

Không có lỗi → Dự án sẵn sàng phát triển!

---

## Cấu trúc thư mục

```
src/
├── assets/           # Ảnh, icon, font, file tĩnh
│
├── components/       # UI components (reusable)
│   ├── theme-provider/    # Dark/Light mode
│   ├── admin-shell/       # Layout admin
│   ├── user-shell/        # Layout user
│   ├── public-shell/      # Layout public (không login)
│   ├── topbar/            # Thanh điều hướng
│   ├── chatbot/           # Chatbot UI
│   ├── meal-plan/         # Meal plan UI
│   ├── blog/              # Blog components
│   ├── video/             # Video components
│   ├── restaurant/        # Restaurant components
│   ├── profile/           # Profile components
│   └── ui/                # shadcn/ui components
│
├── hooks/            # Custom React hooks
├── layouts/          # App layouts (Public, User, Admin)
├── lib/              # Utility functions, helpers
├── pages/            # Page components (mỗi route 1 folder)
│   ├── Admin/            # Trang admin
│   ├── auth/             # Login, Register
│   ├── HomePage/         # Trang chủ
│   ├── BlogPage/         # Danh sách blog
│   ├── BlogDetailPage/   # Chi tiết blog
│   ├── CreatePostPage/   # Tạo bài viết
│   ├── EditPostPage/     # Chỉnh sửa bài viết
│   ├── VideoPage/        # Danh sách video
│   ├── VideoDetailPage/  # Chi tiết video
│   ├── UploadVideoPage/  # Upload video
│   ├── MealPlanPage/     # Thực đơn
│   ├── ChatbotPage/      # Chatbot
│   ├── RestaurantPage/   # Nhà hàng
│   ├── SearchPage/       # Tìm kiếm
│   ├── ProfilePage/      # Profile
│   └── NotFoundPage/     # 404
│
├── providers/        # Context providers (React Query, Theme...)
├── routes/           # Route definitions & config
├── services/         # API calls (Axios)
├── shared/           # Shared resources
│   ├── components/     # Shared components
│   └── constants/      # Constants (API endpoints, messages...)
├── stores/           # Zustand stores (client state)
├── types/            # TypeScript interfaces & types
└── utils/            # Helper functions
```

### Nguyên tắc tổ chức code

| Thư mục | Dùng cho | Ví dụ |
|---------|----------|-------|
| `components/` | UI components tái sử dụng | `<Button />`, `<Card />` |
| `pages/` | Component đại diện cho 1 route | `HomePage.tsx` |
| `hooks/` | Custom hooks | `useAuth.ts`, `useDebounce.ts` |
| `stores/` | Zustand stores | `authStore.ts`, `uiStore.ts` |
| `services/` | API calls | `api.ts`, `blogService.ts` |
| `types/` | TypeScript interfaces | `User.ts`, `Blog.ts` |
| `utils/` | Helper functions | `formatDate.ts`, `validateEmail.ts` |
| `layouts/` | App layout wrappers | `AdminLayout.tsx` |
| `providers/` | React context providers | `QueryProvider.tsx` |

---

## Tech Stack

### Core

| Technology | Version |用途 |
|-----------|---------|-----|
| **React** | 19.x | UI library |
| **TypeScript** | 5.x+ | Type safety |
| **Vite** | 5.x | Build tool & dev server |

### Routing & State

| Technology |用途 |
|-----------|-----|
| **React Router DOM** v7 | Client-side routing |
| **Zustand** v5 | Client state management |
| **TanStack React Query** v5 | Server state / caching |

### UI & Styling

| Technology |用途 |
|-----------|-----|
| **Tailwind CSS** v4 | Utility-first CSS |
| **shadcn/ui** | Component library (Radix UI based) |
| **Radix UI** | Accessible primitives |
| **Lucide React** | Icon library |
| **next-themes** | Dark/Light mode |
| **class-variance-authority** | Conditional variants |
| **clsx** + **tailwind-merge** | Dynamic class merging |

### Forms & Validation

| Technology |用途 |
|-----------|-----|
| **Formik** | Form management |
| **Yup** | Schema validation |

### API & Utilities

| Technology |用途 |
|-----------|-----|
| **Axios** | HTTP client |
| **JSZip** | File compression |
| **Sonner** | Toast notifications |

---

## Quy tắc code

### ✅ Bắt buộc

1. **Dùng TypeScript** — Không dùng `any`, hãy define type rõ ràng
2. **Dùng path alias `@/`** — Import từ `@/components/...`, không dùng relative path dài
3. **Dùng React Query** cho server state — Không fetch data trong useEffect
4. **Dùng Zustand** cho client state — Global state, UI state, auth state
5. **Dùng Axios qua centralized API client** — Không hardcode URL
6. **Dùng Formik + Yup** cho forms — Không validate thủ công
7. **Dùng shadcn/ui** cho standard components — Không tự viết button/input cơ bản
8. **Không hardcode API URLs** — Dùng `VITE_API_BASE_URL` từ `.env`
9. **Không commit `.env.local`** — Chỉ commit `.env.example`
10. **Reusable components** — Đặt trong `components/`, không copy-paste

### 📦 Naming conventions

```typescript
// Components: PascalCase
UserProfile.tsx
AvatarImage.tsx

// Hooks: camelCase with 'use' prefix
useAuth.ts
useDebounce.ts

// Stores: camelCase with 'Store' suffix
authStore.ts
uiStore.ts

// Services: camelCase with 'Service' suffix
blogService.ts
api.ts

// Types: PascalCase
User.ts
Blog.ts
ApiResponse.ts

// Utils: camelCase
formatDate.ts
validateEmail.ts
```

### 📄 Component structure mẫu

```tsx
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  onClick: () => void;
}

export function Card({ title, onClick }: Props) {
  return (
    <div className={cn('p-4 rounded-lg border')}>
      <h2>{title}</h2>
      <Button onClick={onClick}>Click</Button>
    </div>
  );
}
```

---

## Commands thường dùng

| Command | Mô tả |
|---------|-------|
| `npm run dev` | Chạy dev server (http://localhost:5173) |
| `npm run build` | Build production version |
| `npm run preview` | Preview build kết quả |
| `npm run lint` | Chạy ESLint kiểm tra code quality |
| `npm run format` | Format code bằng Prettier |

### Development workflow

```bash
# 1. Start dev server
npm run dev

# 2. Make changes...

# 3. Check for linting errors
npm run lint

# 4. Fix auto-fixable issues
npx eslint --fix .

# 5. Format all files
npm run format

# 6. Test build locally
npm run build
```

---

## Troubleshooting

### ❌ Lỗi: `Cannot find module '@/...'`

**Nguyên nhân:** Path alias chưa được nhận diện

**Cách fix:**
1. Restart VS Code
2. Reload TypeScript server: `Ctrl+Shift+P` → `TypeScript: Restart TS Server`
3. Kiểm tra `tsconfig.app.json` có `paths` đúng chưa

### ❌ Lỗi: `Port 5173 already in use`

**Cách fix:**
```bash
# Windows (PowerShell)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Hoặc đổi port trong vite.config.ts
```

### ❌ Lỗi: `npm install` thất bại

**Cách fix:**
```bash
# Xóa cache và reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### ❌ Lỗi: Environment variables không load

**Cách fix:**
1. Đảm bảo file tên là `.env.local` (không phải `env.local`)
2. Tên biến phải bắt đầu bằng `VITE_`
3. Restart dev server sau khi thay đổi `.env`
4. Kiểm tra `console.log(import.meta.env.VITE_API_BASE_URL)`

### ❌ Lỗi: TypeScript báo `baseUrl is deprecated`

Đã được fix trong project. Nếu vẫn gặp, đảm bảo `tsconfig.app.json` không có `baseUrl`.

### ❌ Lỗi: Tailwind classes không hoạt động

**Cách fix:**
1. Kiểm tra `index.css` có `@import "tailwindcss"` không
2. Kiểm tra `vite.config.ts` có `tailwindcss()` plugin không
3. Restart dev server

### ❌ Lỗi: shadcn/ui components không hiện style

**Cách fix:**
1. Đảm bảo CSS variables trong `index.css` đúng
2. Đảm bảo theme provider wrap app trong `main.tsx`
3. Kiểm tra class names có conflict không

---

## First-Time Setup Checklist

Dán checklist này vào PR description hoặc ghi chép cá nhân:

```
[ ] Đã cài Node.js ≥ 18.x
[ ] Đã cài Git
[ ] Đã clone repository
[ ] Đã chạy npm install
[ ] Đã tạo .env.local từ .env.example
[ ] Đã cấu hình VITE_API_BASE_URL
[ ] Đã chạy npm run dev
[ ] Đã verify ứng dụng chạy được
[ ] Đã chạy npm run lint (không có lỗi)
[ ] Đã chạy npm run build (build thành công)
[ ] Đã cài VS Code extensions (ESLint, Prettier, Tailwind)
```

---

## Liên hệ & Hỗ trợ

- **Project Lead:** [Tên]
- **Backend Repo:** [Link backend repo]
- **Design:** [Link Figma/design]
- **Issue Tracker:** [Link GitHub Issues]

---

> 💡 **Mẹo:** Đọc kỹ `README.md` để biết thông tin chi tiết hơn về kiến trúc và quy định dự án.

**Chúc bạn code vui vẻ! 🎉**
