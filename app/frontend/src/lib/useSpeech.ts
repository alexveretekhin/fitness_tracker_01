import { useCallback, useEffect, useRef, useState } from "react";

// Распознавание речи прямо в браузере (Web Speech API).
// Chrome и Safari отправляют звук на свои серверы и возвращают текст,
// поэтому нужен интернет. Ключи и деньги не нужны.
//
// Важно: браузер даёт микрофон только на «безопасной» странице:
// https://... или http://localhost. С телефона по http://192.168... не сработает,
// для проверки запускай pnpm dev:https.

// В TypeScript нет описания SpeechRecognition, поэтому описываем то, чем пользуемся
type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionClass = new () => Recognition;

function getRecognition(): RecognitionClass | undefined {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionClass;
    webkitSpeechRecognition?: RecognitionClass; // так это называется в Chrome и Safari
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const ERRORS: Record<string, string> = {
  "not-allowed": "Нет доступа к микрофону. Разреши его в настройках браузера.",
  "service-not-allowed": "Нет доступа к микрофону. Разреши его в настройках браузера.",
  "no-speech": "Ничего не услышал, попробуй ещё раз.",
  "audio-capture": "Микрофон не найден.",
  network: "Нужен интернет: речь распознаётся на серверах браузера.",
};

// onText получает несколько вариантов того, что услышал браузер, от самого вероятного
export function useSpeech(onText: (variants: string[]) => void) {
  const supported = typeof window !== "undefined" && getRecognition() !== undefined;
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const callback = useRef(onText);
  callback.current = onText;

  // Закрыли карточку посреди фразы: перестаём слушать
  useEffect(() => () => recognition.current?.abort(), []);

  const start = useCallback(() => {
    const Recognition = getRecognition();
    if (!Recognition) return;
    if (!window.isSecureContext) {
      setError("Микрофон работает только по https. Для телефона запусти pnpm dev:https.");
      return;
    }
    const r = new Recognition();
    r.lang = "ru-RU";
    r.interimResults = false; // ждём конца фразы
    r.maxAlternatives = 3;
    r.onresult = (e) => {
      const result = e.results[0];
      callback.current(Array.from({ length: result.length }, (_, i) => result[i].transcript));
    };
    r.onerror = (e) => {
      if (e.error !== "aborted") setError(ERRORS[e.error] ?? "Не получилось распознать речь.");
    };
    r.onend = () => setListening(false);
    recognition.current = r;
    setError(null);
    setListening(true);
    r.start();
  }, []);

  const stop = useCallback(() => recognition.current?.stop(), []);

  return { supported, listening, error, start, stop };
}
