import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Vite собирает фронтенд и запускает сервер разработки.
// Плагины: react (JSX и быстрая перезагрузка) и tailwindcss (классы стилей).
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // pnpm dev:https: сервер по https с самодельным сертификатом.
    // Нужен для микрофона на телефоне: по http браузер его не даёт.
    ...(mode === "https" ? [basicSsl()] : []),
  ],
  server: {
    // Запросы /api/... Vite пересылает на бэкенд. Браузер думает, что всё
    // идёт с одного адреса, поэтому CORS не мешает, и это работает даже
    // с телефона в той же Wi-Fi сети.
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
}));
