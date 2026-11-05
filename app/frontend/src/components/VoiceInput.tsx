import { motion } from "motion/react";
import { useState } from "react";
import { type ParsedSet, parseSet } from "../lib/parseSet";
import { useSpeech } from "../lib/useSpeech";
import { Icon } from "./Icon";

const EXAMPLE = "«60 кило 10 раз»";

// Кнопка 🎤 в карточке: сказал подход, и вес с повторами встали в поля.
// Сам подход не записывается: проверяешь числа и жмёшь «+ подход».
export function VoiceInput({ onParsed }: { onParsed: (set: ParsedSet) => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const speech = useSpeech((variants) => {
    // Браузер даёт несколько вариантов услышанного: берём первый, который понятен
    for (const text of variants) {
      const parsed = parseSet(text);
      if (parsed) {
        onParsed(parsed);
        setMessage(`Услышал «${text}»`);
        return;
      }
    }
    setMessage(`Не понял «${variants[0] ?? ""}». Скажи, например, ${EXAMPLE}`);
  });

  // Firefox и старые браузеры не умеют распознавать речь: кнопку просто не показываем
  if (!speech.supported) return null;

  // Постоянной подсказки рядом с кнопкой нет: текст появляется,
  // только когда есть что сказать (слушаю / услышал / ошибка)
  const hint = speech.listening ? `Слушаю… например, ${EXAMPLE}` : (speech.error ?? message);

  return (
    <div className="mt-3 flex flex-col items-center gap-2">
      <motion.button
        type="button"
        onClick={speech.listening ? speech.stop : speech.start}
        animate={{ scale: speech.listening ? [1, 1.12, 1] : 1 }}
        transition={speech.listening ? { repeat: Number.POSITIVE_INFINITY, duration: 1 } : {}}
        aria-label={speech.listening ? "Остановить запись" : "Сказать подход голосом"}
        className={`grid size-16 shrink-0 place-items-center rounded-full border ${
          speech.listening ? "border-accent bg-accent text-bg" : "border-border text-accent"
        }`}
      >
        <Icon name="mic" className="size-8" />
      </motion.button>
      {hint && (
        <p className={`text-center text-xs ${speech.error ? "text-weekend" : "text-text-muted"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
