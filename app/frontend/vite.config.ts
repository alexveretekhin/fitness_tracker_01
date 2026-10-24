import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Vite собирает фронтенд и запускает сервер разработки.
// Плагины: react (JSX и быстрая перезагрузка) и tailwindcss (классы стилей).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Запросы /api/... Vite пересылает на бэкенд. Браузер думает, что всё
    // идёт с одного адреса, поэтому CORS не мешает, и это работает даже
    // с телефона в той же Wi-Fi сети.
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
});
