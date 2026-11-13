// Токен входа (JWT), который выдаёт сервер после входа или регистрации.
//
// Храним его в localStorage браузера: так вход не слетает после перезагрузки
// страницы. Токен прикладывается к каждому запросу (см. src/api/index.ts).
// Выход = просто забыть токен.

const KEY = "fitness.token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null; // приватный режим или запрет хранилища: считаем, что не вошли
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    // без хранилища вход продержится до перезагрузки страницы
  }
  memory = token;
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // нечего удалять
  }
  memory = null;
}

// Запасная копия в памяти, если localStorage недоступен
let memory: string | null = null;

export function currentToken(): string | null {
  return getToken() ?? memory;
}
