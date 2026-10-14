import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
        },
    },
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "https://vegalife-backend.onrender.com",
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        // Gợi ý code-splitting để tránh bundle chính >500KB (Claude Code)
        chunkSizeWarningLimit: 500,
        rollupOptions: {
            output: {
                // Tách vendor lớn ra chunk riêng. (@tailwindcss/vite là plugin build-time,
                // không vào bundle nên không cần chunk.)
                manualChunks(id) {
                    if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) {
                        return "vendor";
                    }
                },
            },
        },
    },
});
