# Этап 6.1. Вход через Google

## Цель

На экране входа есть кнопка «Продолжить с Google»: нажал, выбрал свой аккаунт Google в окошке, и ты внутри. Почту и пароль вводить не нужно.

## Что сделали

- **Бэкенд:**
  - `POST /api/auth/google` в [api/auth.py](../../app/backend/app/api/auth.py): принимает токен от кнопки Google, проверяет его и отвечает нашим обычным токеном. Нет аккаунта с этой почтой — создаётся новый (без пароля, имя берётся из Google). Есть аккаунт с той же почтой (регистрировался паролем) — входишь в него, тренировки на месте;
  - `GET /api/auth/config`: включён ли Google. Если в `.env` нет `GOOGLE_CLIENT_ID`, кнопки нет, а `/api/auth/google` отвечает 503;
  - проверка токена в [security.py](../../app/backend/app/security.py), библиотека `google-auth`;
  - 4 новых теста в [test_auth.py](../../app/backend/tests/test_auth.py) (настоящий Google в тестах подменяется).
- **Фронтенд:**
  - [GoogleButton.tsx](../../app/frontend/src/components/GoogleButton.tsx): грузит скрипт Google и рисует его кнопку в тёмной теме;
  - на [экране входа](../../app/frontend/src/screens/Login.tsx) под формой «или» и кнопка Google.
- Решение записано в [ADR 0015](../decisions/0015-google-login.md).

## Новые технологии

- **Google Identity Services (GIS).** Скрипт Google, который рисует кнопку «Войти через Google» и показывает окошко выбора аккаунта. Пароль от Google наше приложение никогда не видит.
- **ID token.** Что Google отдаёт после выбора аккаунта: строка с почтой, именем и подписью Google. Наш сервер проверяет подпись и что токен выписан именно нашему приложению (по Client ID).
- **Client ID.** «Имя» нашего приложения в Google. Это не секрет, он виден в браузере.

## Как получить Client ID (один раз, ~10 минут)

1. Открой https://console.cloud.google.com и войди своим Google-аккаунтом.
2. Сверху выбор проекта → **New Project** → имя `fitness-tracker` → Create.
3. Меню → **APIs & Services → OAuth consent screen** (может называться **Google Auth Platform**) → Get started:
   - App name: `Fitness Tracker`, support email: твоя почта;
   - Audience: **External**;
   - контактная почта: твоя → Create.
4. Там же раздел **Audience → Test users → Add users**: добавь свою почту Gmail (и почты друзей, кто будет тестировать). Пока приложение в режиме тестирования, войти через Google могут только они.
5. **Clients** (или **Credentials → Create credentials → OAuth client ID**):
   - Application type: **Web application**, имя любое;
   - **Authorized JavaScript origins** → Add URI: `http://localhost` и `http://localhost:5173`;
   - Redirect URIs не нужны → Create.
6. Скопируй **Client ID** (вида `1234-abc.apps.googleusercontent.com`).
7. Впиши его в `app\backend\.env` (если файла нет, скопируй из `.env.example`):

```powershell
cd D:\fitness_tracker_01\fitness_tracker\app\backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env   # строка GOOGLE_CLIENT_ID=1234-abc.apps.googleusercontent.com
```

## Как запустить и проверить

```powershell
cd D:\fitness_tracker_01\fitness_tracker\app\backend
uv sync
uv run fastapi dev
```

Во втором окне:

```powershell
cd D:\fitness_tracker_01\fitness_tracker\app\frontend
pnpm dev
```

1. Открой **http://localhost:5173** (именно localhost, не 127.0.0.1 и не IP).
2. Выйди, если был внутри. Под формой появилась кнопка Google.
3. Нажми её, выбери аккаунт → главная. Если это новая почта, сначала выбор аватара.
4. Если ты уже регистрировался паролем на ту же Gmail-почту, попадёшь в тот же аккаунт.

## На что обратить внимание

- **Нет кнопки Google** — бэкенд не видит `GOOGLE_CLIENT_ID`: проверь `.env` и перезапусти `uv run fastapi dev`.
- **Ошибка `origin_mismatch`** в окошке Google — адрес страницы не добавлен в Authorized JavaScript origins. Нужен точный адрес с портом. Изменения в Google применяются до 5 минут.
- **Ошибка `access_denied`** — твоя почта не добавлена в Test users (шаг 4).
- **На телефоне по `192.168.1.11` Google не работает:** Google не разрешает адреса локальной сети. На телефоне пока входи по паролю. После деплоя (этап 8) добавим настоящий домен в origins, и кнопка заработает везде.
- У аккаунта, созданного через Google, нет пароля: входить в него только кнопкой Google.
- Если кнопка подписана по-английски, это решает сам Google по языку браузера.

## Задание для тебя

В [GoogleButton.tsx](../../app/frontend/src/components/GoogleButton.tsx) поменяй `shape: "pill"` на `shape: "rectangular"`, а `text: "continue_with"` на `text: "signin_with"`, и посмотри, как изменится кнопка.
