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
                manualChunks: {
                    // Tách vendor lớn ra chunks riêng
                    vendor: ["react", "react-dom", "react-router-dom"],
                    ui: ["@tailwindcss/vite"],
                },
            },
        },
    },
});
