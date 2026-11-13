// Thứ tự import quan trọng: shim Web Storage phải chạy trước `@/i18n`
// (LanguageDetector đọc localStorage ngay lúc init).
import "./storageShim";
import "./domPolyfills";

import { afterEach, beforeEach } from "vitest";
import { api } from "@/shared/api/client";

// jsdom dùng XHR và ÁP CORS — backend thật không mở CORS cho origin của test.
// `fetch` của Node (undici) không có ràng buộc đó. Adapter `fetch` tồn tại ở cả
// bản node lẫn bản browser của axios, nên ép một lần là chạy đúng ở cả hai môi
// trường. KHÔNG ép `"http"`: bản browser đã thay adapter đó bằng null.
api.defaults.adapter = "fetch";

const hasDom = typeof document !== "undefined";

// Nạp động nhưng KHÔNG `await` ở top level: Vitest 5 không đăng ký được hook khai báo
// sau một top-level await ("failed to find the current suite"). Hook chờ promise bên trong.
const domReady = hasDom
    ? Promise.all([
          import("@testing-library/jest-dom/vitest"),
          import("@testing-library/react"),
          import("@/i18n"),
      ])
    : null;

// Phần dưới chỉ dùng được khi có DOM. Test service khai báo
// `// @vitest-environment node` nên phải nạp động, không import tĩnh.
if (hasDom) {
    // Ghim ngôn ngữ để assertion không phụ thuộc LanguageDetector / máy chạy test.
    beforeEach(async () => {
        const [, , { default: i18n }] = await domReady!;
        await i18n.changeLanguage("en");
    });

    afterEach(async () => {
        const [, { cleanup }] = await domReady!;
        cleanup();
    });
}

afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
});
