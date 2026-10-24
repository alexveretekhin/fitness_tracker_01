import "@fontsource/source-code-pro/400.css";
import "@fontsource/source-code-pro/500.css";
import "@fontsource/source-code-pro/700.css";
import "./styles/main.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { queryClient } from "./api";
import { router } from "./router";

// Точка входа: React рисует приложение внутрь <div id="root"> из index.html.
// QueryClientProvider даёт всем экранам доступ к кэшу запросов к API.
const root = document.getElementById("root");
if (!root) throw new Error("Нет элемента #root в index.html");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
