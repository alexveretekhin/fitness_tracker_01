import { defineConfig } from "@hey-api/openapi-ts";

// Генератор клиента API. Читает схему бэкенда (openapi.json) и пишет
// в src/api/generated типы и готовые функции запросов. Руками туда не лезем,
// после изменения API запускаем: pnpm api
export default defineConfig({
  input: "./openapi.json",
  output: "src/api/generated",
  plugins: [
    "@hey-api/client-fetch",
    "@hey-api/typescript",
    "@hey-api/sdk",
    "@tanstack/react-query",
  ],
});
