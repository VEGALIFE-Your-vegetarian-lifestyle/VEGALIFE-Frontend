import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Cấu hình riêng, KHÔNG merge vite.config.ts: plugin Tailwind không cần cho test
 * và chỉ làm chậm khởi động. Chỉ giữ plugin React (JSX) + alias `@/`.
 *
 * Test service khai báo `// @vitest-environment node` ở đầu file; mặc định ở
 * đây là jsdom cho test screen.
 */
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: { "@": path.resolve(import.meta.dirname, "./src") },
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        include: ["src/**/*.test.{ts,tsx}"],
        css: false,
        restoreMocks: true,
        // Backend thật trên Render free tier có cold start.
        testTimeout: 60_000,
        hookTimeout: 60_000,
    },
});
