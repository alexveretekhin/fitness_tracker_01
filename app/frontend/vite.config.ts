import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Vite собирает фронтенд и запускает сервер разработки.
// Плагины: react (JSX и быстрая перезагрузка) и tailwindcss (классы стилей).
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
