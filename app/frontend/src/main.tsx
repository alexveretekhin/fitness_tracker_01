import "@fontsource/source-code-pro/400.css";
import "@fontsource/source-code-pro/500.css";
import "@fontsource/source-code-pro/700.css";
import "./styles/main.css";

import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "./router";

// Точка входа: React рисует приложение внутрь <div id="root"> из index.html
const root = document.getElementById("root");
if (!root) throw new Error("Нет элемента #root в index.html");

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
