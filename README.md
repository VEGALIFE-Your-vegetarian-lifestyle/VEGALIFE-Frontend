# Stock AI Analysis — Frontend

A production-ready frontend foundation for a team-based Stock AI Analysis web application.

This frontend is designed for **Users, Staff, and Admins**. It currently provides a scalable architecture, role-based route protection, theme support, and placeholder feature pages/forms. It will connect to backend APIs for authentication, stock data, AI reports, watchlists, portfolio holdings, alerts, crawl-job monitoring, and data source management.

**Current status:** frontend architecture and placeholders are implemented; backend integration contracts are pending.

## 1. Tech Stack

| Technology                                       | Purpose                                                |
| ------------------------------------------------ | ------------------------------------------------------ |
| React 19                                         | UI rendering                                           |
| TypeScript                                       | Strict type safety                                     |
| Vite                                             | Fast build and dev server                              |
| React Router DOM v6                              | Client-side routing                                    |
| Zustand v5                                       | Client-only global state (auth/session/UI preferences) |
| TanStack React Query v5                          | Server/API state management                            |
| Tailwind CSS v4                                  | Utility-first styling                                  |
| Radix UI + shadcn/ui patterns                    | Accessible primitives and reusable UI components       |
| Lucide React                                     | Iconography                                            |
| Geist Font                                       | Typography                                             |
| next-themes                                      | Light/dark/system theming                              |
| Formik + Yup                                     | Form state + validation                                |
| Axios                                            | Centralized HTTP client                                |
| class-variance-authority + clsx + tailwind-merge | Component variant/class composition                    |
| JSZip                                            | Client-side visualization export packaging             |
| Sonner                                           | Toast notifications                                    |
| ESLint + eslint-plugin-react-hooks               | Linting and hook correctness                           |
| Prettier                                         | Code formatting                                        |

## 2. Project Architecture

```text
Component
  ↓
React Query / Zustand
  ↓
Service
  ↓
Axios API Client
  ↓
Backend API
```

- **Use Zustand** for client-only global state (auth user, token, auth status, UI preferences).
- **Use React Query** for all server/API state (stocks, watchlists, holdings, alerts, reports, etc.).
- **Put API calls in `src/services/*`**, never directly in components.
- **Shared domain types** go in `src/types`.
- **Reusable UI** goes in `src/components` and `src/shared/components`.

## 3. Folder Structure

```text
src/
├── App.tsx
├── main.tsx
├── index.css
│
├── assets/
│
├── components/
│   ├── theme-provider.tsx
│   ├── admin-shell/
│   ├── data-formulator/
│   ├── holdings/
│   ├── portfolio/
│   ├── staff-shell/
│   ├── topbar/
│   ├── ui/
│   └── visualization/
│
├── hooks/
│   └── usePortfolioAnalysis.ts
│
├── layouts/
│   ├── AdminLayout.tsx
│   ├── StaffLayout.tsx
│   └── UserLayout.tsx
│
├── lib/
│   ├── api-client.ts
│   ├── config.ts
│   ├── form-utils.ts
│   ├── role-routes.ts
│   └── utils.ts
│
├── pages/
│   ├── Admin/
│   ├── AiReportHistoryPage/
│   ├── AlertsPage/
│   ├── auth/
│   ├── ComparisonPage/
│   ├── CrawlJobsPage/
│   ├── DataSourcesPage/
│   ├── LoginPage/
│   ├── Register/
│   ├── StockAnalysisPage/
│   ├── StockDetailPage/
│   ├── StockListPage/
│   ├── UserDashboard/
│   ├── UserProfilePage/
│   └── WatchlistPage/
│
├── providers/
│   ├── AuthProvider.tsx
│   └── QueryProvider.tsx
│
├── routes/
│   ├── AppRoutes.tsx
│   ├── layoutRoutes.tsx
│   ├── RequireAuth.tsx
│   └── renderProtectedLayoutRoute.tsx
│
├── services/
│   ├── auth.service.ts
│   ├── stock.service.ts
│   ├── aiReportService.ts
│   ├── holdings.service.ts
│   ├── watchlist.service.ts
│   ├── alert.service.ts
│   └── crawl.service.ts
│
├── shared/
│   └── components/
│
├── stores/
│   └── auth.store.ts
│
├── types/
│   ├── aiReport.ts
│   ├── holdings.ts
│   ├── subscription.ts
│   └── visualization.ts
│
└── utils/
    └── visualizationExport.ts
```

Responsibilities:

- `components/`: reusable UI and feature-level building blocks.
- `pages/`: route-level screens.
- `layouts/`: role-based shells and navigation containers.
- `routes/`: route tree + auth guards.
- `services/`: API interaction layer.
- `stores/`: Zustand client state.
- `providers/`: app-level providers (auth/query/theme).
- `types/`: shared type models.
- `hooks/`: reusable domain hooks.
- `lib/`: config and cross-cutting helpers.
- `utils/`: utility helpers (e.g., export helpers).
- `shared/`: cross-feature shared components.

## 4. Prerequisites

- Node.js **20.x LTS** (recommended)
- npm (bundled with Node)
- Git

Verify:

```bash
node -v
npm -v
git --version
```

## 5. Clone Repository

```bash
git clone <repository-url>
cd <repository-name>
```

## 6. Install Dependencies

```bash
npm install
```

Dependencies are installed from `package.json`.

## 7. Environment Setup

1. Copy `.env.example` values.
2. Create a local file named `.env.local` in the project root.
3. Add required variables.
4. Never commit `.env.local`.

Required variable:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

- `.env.example` is committed and documents required variables.
- `.env.local` is machine-specific and must stay uncommitted.
- Get the backend URL from the backend team/environment documentation.

## 8. Run Development Server

```bash
npm run dev
```

Default local URL:

- `http://localhost:5173`

## 9. Available Scripts

| Command           | Description                            |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start Vite dev server                  |
| `npm run build`   | Type-check and build production bundle |
| `npm run preview` | Preview production build locally       |
| `npm run lint`    | Run ESLint                             |
| `npm run format`  | Run Prettier formatting                |

## 10. Git Workflow for Team

Recommended branching:

- `main`
- `develop`
- `feature/*`

Example workflow:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/stock-detail
# implement changes
git add .
git commit -m "feat: add stock detail page"
git push origin feature/stock-detail
```

Then open a Pull Request to `develop`.

Rules:

- Do not commit directly to `main`.
- Do not commit `.env.local`.
- Pull latest `develop` before starting.
- Keep commits focused.
- Resolve merge conflicts before opening PR.
- Run `npm run lint` and `npm run build` before PR.

## 11. Naming Conventions

- Components: `PascalCase` (e.g., `StockDetailPage.tsx`)
- Hooks: `useSomething.ts` (e.g., `usePortfolioAnalysis.ts`)
- Services: `something.service.ts`
- Types: domain-based in `src/types` (e.g., `holdings.ts`, `aiReport.ts`)
- Page folders: `PascalCase` where appropriate.

## 12. How to Add a New Page

Example: add `StockNewsPage`.

1. Create `src/pages/StockNewsPage/StockNewsPage.tsx`.
2. Add the route in `src/routes/layoutRoutes.tsx`.
3. If API is needed, add/update a service in `src/services`.
4. Add a React Query hook in `src/hooks`.
5. Reuse/build UI components in `src/components`.
6. Test the page manually.
7. Run `npm run lint`.
8. Run `npm run build`.

## 13. How to Add a New API

Example: `GET /stocks/:symbol/news`

```text
types
  ↓
service
  ↓
React Query hook
  ↓
page/component
```

Implementation rule: do not place API requests directly inside JSX/components.

## 14. Authentication

Authentication architecture:

- `AuthProvider` initializes auth session from local storage.
- Zustand `auth.store.ts` stores user/token/auth-state.
- `RequireAuth` guards protected routes.
- Role restrictions are applied per protected layout route.
- Separate role layouts: `UserLayout`, `StaffLayout`, `AdminLayout`.

Route diagram:

```text
/login, /register (public)
/
├── user routes (USER/STAFF/ADMIN)
├── /staff/* (STAFF/ADMIN)
└── /admin/* (ADMIN only)
```

## 15. Backend Integration

Frontend integration key:

- `VITE_API_BASE_URL`

Expect backend to enable CORS for frontend origin(s), e.g. `http://localhost:5173` during local development.

**Backend API contracts will be documented separately.**

## 16. Troubleshooting

### npm install fails

- Verify Node/npm versions.
- Delete `node_modules` and lockfile, then reinstall.
- Check network/proxy settings.

### npm run dev fails

- Ensure dependencies installed.
- Check terminal output for TypeScript/lint/config errors.

### API connection fails

- Verify `.env.local` exists.
- Verify `VITE_API_BASE_URL` value.
- Ensure backend is running.
- Check CORS configuration on backend.

### Environment variable changes are not detected

- Restart Vite dev server after changing `.env.local`.

### Port already in use

Run Vite on a different port:

```bash
npm run dev -- --port 5174
```

## 17. Development Checklist

- [ ] Clone repository
- [ ] Install Node.js
- [ ] Run npm install
- [ ] Create .env.local
- [ ] Configure API URL
- [ ] Run npm run dev
- [ ] Verify application
- [ ] Create feature branch
- [ ] Implement feature
- [ ] Run npm run lint
- [ ] Run npm run build
- [ ] Push branch
- [ ] Create Pull Request

## 18. Contribution Guidelines

- Branch naming: `feature/*`, `fix/*`, `chore/*`
- Commit naming: use Conventional Commits
  - `feat:`
  - `fix:`
  - `refactor:`
  - `docs:`
  - `chore:`
- PR expectations:
  - clear scope and summary
  - linked issue/task
  - screenshots for UI changes where relevant
  - lint/build pass status
- Respect formatting and linting rules before pushing.

## 19. Current Project Status

Implemented now:

- React + TypeScript + Vite foundation
- Role-based layouts and protected-route placeholders
- Theme provider (light/dark/system)
- Core reusable UI primitives
- Formik + Yup examples for Login/Register/Profile
- Service-layer placeholders ready for backend contract integration
- Centralized Axios client with auth header/error interceptors

Not implemented yet:

- Real backend authentication flow
- Real stock/portfolio/watchlist/alerts/report API integration
- Backend-defined endpoint contracts and payload mappings
- Production feature business logic
