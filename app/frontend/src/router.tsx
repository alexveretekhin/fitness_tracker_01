import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { isSignedIn, queryClient, setOnUnauthorized } from "./api";
import { getMeOptions } from "./api/generated/@tanstack/react-query.gen";
import { BottomNav } from "./components/BottomNav";
import { FlyProvider } from "./components/FlyToHome";
import { AvatarChoice } from "./screens/AvatarChoice";
import { Exercises } from "./screens/Exercises";
import { History } from "./screens/History";
import { Home } from "./screens/Home";
import { Login } from "./screens/Login";
import { MuscleGroups } from "./screens/MuscleGroups";
import { Profile } from "./screens/Profile";
import { Settings } from "./screens/Settings";
import { Splash } from "./screens/Splash";

// Карта экранов приложения. Каждый route = адрес в браузере + компонент.
//
//  /                      заставка
//  /login                 вход и регистрация
//  /avatar                выбор аватара
//  /home                  главная          ┐
//  /muscles               группы мышц      │ внутри «оболочки» shell:
//  /muscles/$groupId      упражнения       │ у них общее нижнее меню
//  /history               история          │
//  /settings              настройки        │
//  /me                    аватар и уровень ┘

// Корень: рамка «телефона», на десктопе по центру экрана
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-canvas">
      <div className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-bg">
        {children}
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <Frame>
      <Outlet />
    </Frame>
  ),
  // Если сервер не ответил (например, бэкенд не запущен), показываем это вместо экрана
  errorComponent: ({ reset }) => (
    <Frame>
      <div className="grid h-full place-items-center px-6 text-center">
        <div>
          <p className="text-weekend">Нет связи с сервером</p>
          <p className="mt-2 text-sm text-text-muted">Запущен ли бэкенд (uv run fastapi dev)?</p>
          <button
            type="button"
            onClick={() => {
              reset();
              router.invalidate();
            }}
            className="mt-4 h-11 rounded-row bg-accent px-6 font-bold text-bg"
          >
            Повторить
          </button>
        </div>
      </div>
    </Frame>
  ),
});

const splashRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Splash });

// Без входа во все экраны, кроме заставки и входа, не пускаем
function requireSignIn() {
  if (!isSignedIn()) throw redirect({ to: "/login" });
}

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
  // Уже вошёл: экран входа не нужен
  beforeLoad: () => {
    if (isSignedIn()) throw redirect({ to: "/home" });
  },
});

const avatarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/avatar",
  component: AvatarChoice,
  beforeLoad: requireSignIn,
});

// Оболочка без своего адреса (id вместо path): общий отступ и нижнее меню
const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "shell",
  beforeLoad: async () => {
    requireSignIn();
    // Без выбранного аватара сначала отправляем выбирать его.
    // ensureQueryData берёт профиль из кэша, а если его нет, спрашивает сервер.
    try {
      const me = await queryClient.ensureQueryData(getMeOptions());
      if (!me.avatar) throw redirect({ to: "/avatar" });
    } catch (error) {
      // Сервер сказал «войдите заново»: токен уже забыт, ведём на вход
      if (!isSignedIn()) throw redirect({ to: "/login" });
      throw error;
    }
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

const profileRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/me",
  component: Profile,
});

const routeTree = rootRoute.addChildren([
  splashRoute,
  loginRoute,
  avatarRoute,
  shellRoute.addChildren([
    homeRoute,
    musclesRoute,
    exercisesRoute,
    historyRoute,
    settingsRoute,
    profileRoute,
  ]),
]);

export const router = createRouter({ routeTree });

// Токен истёк посреди работы: открываем экран входа
setOnUnauthorized(() => router.navigate({ to: "/login", replace: true }));

// Подсказка TypeScript: теперь navigate({ to: "..." }) проверяет адреса
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
