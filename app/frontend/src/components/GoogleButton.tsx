import { useEffect, useRef, useState } from "react";

// Кнопка «Войти через Google» (Google Identity Services).
//
// Скрипт Google рисует свою кнопку. По нажатию открывается окошко Google
// со списком аккаунтов в браузере: выбрал — и Google отдаёт нам подписанный
// токен (credential) с почтой и именем. Его проверяет уже наш сервер.

type GoogleId = {
  initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void;
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const SRC = "https://accounts.google.com/gsi/client";
let loading: Promise<void> | null = null;

// Скрипт грузим один раз и только на экране входа
function loadScript(): Promise<void> {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Google не загрузился"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

type Props = { clientId: string; onCredential: (credential: string) => void };

export function GoogleButton({ clientId, onCredential }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  // Свежий обработчик без перерисовки кнопки Google
  const handler = useRef(onCredential);
  handler.current = onCredential;

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        const id = window.google?.accounts.id;
        if (cancelled || !id || !box.current) return;
        id.initialize({ client_id: clientId, callback: (r) => handler.current(r.credential) });
        id.renderButton(box.current, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: "continue_with",
          locale: "ru",
          width: box.current.offsetWidth,
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (failed) {
    return <p className="text-center text-xs text-text-faint">Google сейчас недоступен</p>;
  }
  return <div ref={box} className="flex h-11 w-full justify-center" />;
}
