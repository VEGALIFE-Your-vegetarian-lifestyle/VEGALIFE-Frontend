# Test

Test gọi **backend thật** (`VITE_API_BASE_URL` trong `.env`), không mock.

```sh
npm run test          # chạy 1 lần
npm run test:watch    # theo dõi khi đang viết
npm run test:ui       # giao diện Vitest (cần cài @vitest/ui)
```

## Biến môi trường

Test tự `skip` khi thiếu biến, nên mặc định chạy được ngay. Muốn chạy đủ thì
tạo `.env.test.local` (đã gitignore). Vite chỉ đưa biến có tiền tố `VITE_` vào
`import.meta.env`, nên trong file `.env*` phải viết kèm tiền tố:

```sh
VITE_E2E_USER_IDENTIFIER=...
VITE_E2E_USER_PASSWORD=...
VITE_E2E_ADMIN_IDENTIFIER=...
VITE_E2E_ADMIN_PASSWORD=...
# Chỉ bật khi chấp nhận test TẠO/XOÁ dữ liệu trên backend thật.
VITE_E2E_ALLOW_WRITES=1
```

Set trực tiếp trong shell thì dùng tên **không** tiền tố (`E2E_USER_IDENTIFIER=...`),
`src/test/e2eEnv.ts` đọc `process.env` trước khi bỏ cuộc.

## Phân tầng

| Nhóm | Cần gì | File |
|---|---|---|
| Public API (`/api/posts/feed`, `/api/categories`) | không | `src/features/**/__tests__/*` |
| Cần JWT user | `E2E_USER_*` | `features/posts/api`, `features/auth/api` |
| Cần JWT admin | `E2E_ADMIN_*` | `features/posts/api`, `features/categories/api`, `features/admin/api` |
| Ghi dữ liệu thật | thêm `E2E_ALLOW_WRITES=1` | các `describe` cuối mỗi file |
| Screen | không (form/validate), hoặc tài khoản (luồng thật) | `src/features/**/pages/**/__tests__/*` |

## Ghi chú

- jsdom dùng XHR và áp CORS, backend không mở CORS cho origin test → `src/test/setup.ts`
  ép axios sang adapter `fetch` (Node undici không có ràng buộc CORS). Không dùng
  adapter `http`: bản browser của axios đã thay nó bằng `null` nên sẽ ném lỗi.
- TipTap/ProseMirror cần layout engine thật → mock ở test screen
  (`RichTextEditor`, `PostContent`).
- `src/test/storageShim.ts` cấp `localStorage`/`sessionStorage` cho môi trường `node`.
