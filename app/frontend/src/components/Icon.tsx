import chart from "../assets/icons/chart.svg?raw";
import flame from "../assets/icons/flame.svg?raw";
import folder from "../assets/icons/folder.svg?raw";
import history from "../assets/icons/history.svg?raw";
import mic from "../assets/icons/mic.svg?raw";
import play from "../assets/icons/play.svg?raw";
import plus from "../assets/icons/plus.svg?raw";
import search from "../assets/icons/search.svg?raw";
import settings from "../assets/icons/settings.svg?raw";

// "?raw" — Vite отдаёт файл как строку. Вставляем SVG прямо в разметку,
// поэтому иконка берёт цвет из CSS-свойства color (currentColor).
const icons = { chart, flame, folder, history, mic, play, plus, search, settings };

export type IconName = keyof typeof icons;

type Props = {
  name: IconName;
  className?: string;
};

export function Icon({ name, className }: Props) {
  return (
    <span
      aria-hidden
      className={`inline-block [&>svg]:h-full [&>svg]:w-full ${className ?? ""}`}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: наши собственные SVG из репозитория
      dangerouslySetInnerHTML={{ __html: icons[name] }}
    />
  );
}
