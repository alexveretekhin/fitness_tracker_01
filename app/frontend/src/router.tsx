import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { BottomNav } from "./components/BottomNav";
import { FlyProvider } from "./components/FlyToHome";
import { AvatarChoice } from "./screens/AvatarChoice";
import { Exercises } from "./screens/Exercises";
import { History } from "./screens/History";
import { Home } from "./screens/Home";
import { MuscleGroups } from "./screens/MuscleGroups";
import { Settings } from "./screens/Settings";
import { Splash } from "./screens/Splash";
import { useAppStore } from "./store/useAppStore";

// Карта экранов приложения. Каждый route = адрес в браузере + компонент.
//
//  /                      заставка
//  /avatar                выбор аватара
//  /home                  главная          ┐
//  /muscles               группы мышц      │ внутри «оболочки» shell:
//  /muscles/$groupId      упражнения       │ у них общее нижнее меню
//  /history               история          │
//  /settings              настройки        ┘

// Корень: рамка «телефона», на десктопе по центру экрана
const rootRoute = createRootRoute({
  component: () => (
    <div className="flex min-h-dvh justify-center bg-canvas">
      <div className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-bg">
        <Outlet />
      </div>
    </div>
  ),
});

const splashRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Splash });

const avatarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/avatar",
  component: AvatarChoice,
});

// Оболочка без своего адреса (id вместо path): общий отступ и нижнее меню
const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "shell",
  beforeLoad: () => {
    // Без выбранного аватара сначала отправляем выбирать его
    if (!useAppStore.getState().avatar) throw redirect({ to: "/avatar" });
  },
  component: () => (
    <FlyProvider>
      <div className="flex min-h-0 flex-1 flex-col px-3.5 pt-3.5">
        <Outlet />
      </div>
      <BottomNav />
    </FlyProvider>
  ),
});

const homeRoute = createRoute({ getParentRoute: () => shellRoute, path: "/home", component: Home });
const musclesRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/muscles",
  component: MuscleGroups,
});
const exercisesRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/muscles/$groupId",
  component: Exercises,
});
const historyRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/history",
  component: History,
});
const settingsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/settings",
  component: Settings,
});

const routeTree = rootRoute.addChildren([
  splashRoute,
  avatarRoute,
  shellRoute.addChildren([homeRoute, musclesRoute, exercisesRoute, historyRoute, settingsRoute]),
]);

export const router = createRouter({ routeTree });

// Подсказка TypeScript: теперь navigate({ to: "..." }) проверяет адреса
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
