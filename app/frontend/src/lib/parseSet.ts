// Разбор сказанной фразы в вес и повторы.
//
//   «60 кг на 10»                     → { weight: 60, reps: 10 }
//   «шестьдесят два с половиной кило» → { weight: 62.5 }
//   «десять раз»                      → { reps: 10 }
//   «свой вес 15 повторов»            → { weight: 0, reps: 15 }
//
// Браузер присылает текст то цифрами, то словами, поэтому понимаем и то и другое.
// Число без подписи («60 на 10») заполняет пустые поля по порядку: сначала вес, потом повторы.

export type ParsedSet = { weight?: number; reps?: number };

const NUMBER_WORDS: Record<string, number> = {
  ноль: 0,
  один: 1,
  одна: 1,
  одну: 1,
  два: 2,
  две: 2,
  три: 3,
  четыре: 4,
  пять: 5,
  шесть: 6,
  семь: 7,
  восемь: 8,
  девять: 9,
  десять: 10,
  одиннадцать: 11,
  двенадцать: 12,
  тринадцать: 13,
  четырнадцать: 14,
  пятнадцать: 15,
  шестнадцать: 16,
  семнадцать: 17,
  восемнадцать: 18,
  девятнадцать: 19,
  двадцать: 20,
  тридцать: 30,
  сорок: 40,
  пятьдесят: 50,
  шестьдесят: 60,
  семьдесят: 70,
  восемьдесят: 80,
  девяносто: 90,
  сто: 100,
  двести: 200,
  триста: 300,
  четыреста: 400,
  пятьсот: 500,
};

const isWeightUnit = (w: string) => /^(кг|кило|килограм)/.test(w);
const isRepsUnit = (w: string) => /^(раз|повтор|повт)/.test(w);

type Token = { word: string; num?: number };

// «62,5кг» → ["62.5", "кг"], «60x10» → ["60", "x", "10"]
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/(\d)([^\d.\s])/g, "$1 $2")
    .replace(/([^\d.\s])(\d)/g, "$1 $2")
    .split(/[^\p{L}\d.]+/u)
    .map((w) => w.replace(/^\.+|\.+$/g, "")) // точка в конце фразы: «10.»
    .filter(Boolean);
}

// Какое число-слово может стоять следом: «сто» + «двадцать», «двадцать» + «пять».
// «десять пять» или «двадцать десять» — это уже два разных числа.
function canFollow(prev: number, next: number): boolean {
  if (prev >= 100) return next > 0 && next < 100;
  if (prev >= 20) return next > 0 && next < 10;
  return false;
}

// Склеиваем числа словами: «сто двадцать пять» → 125, «шестьдесят два с половиной» → 62.5
function joinNumbers(words: string[]): Token[] {
  const tokens: Token[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (/^\d+(\.\d+)?$/.test(word)) {
      tokens.push({ word, num: Number(word) });
      continue;
    }
    if (!(word in NUMBER_WORDS)) {
      tokens.push({ word });
      continue;
    }
    let total = NUMBER_WORDS[word];
    let last = total;
    while (i + 1 < words.length && words[i + 1] in NUMBER_WORDS) {
      const next = NUMBER_WORDS[words[i + 1]];
      if (!canFollow(last, next)) break;
      total += next;
      last = next;
      i++;
    }
    tokens.push({ word, num: total });
  }

  // «с половиной» прибавляет 0.5 к числу перед ним
  for (let i = 0; i < tokens.length - 2; i++) {
    const t = tokens[i];
    if (
      t.num !== undefined &&
      tokens[i + 1].word === "с" &&
      tokens[i + 2].word.startsWith("полов")
    ) {
      t.num += 0.5;
      tokens.splice(i + 1, 2);
    }
  }
  return tokens;
}

export function parseSet(text: string): ParsedSet | null {
  const tokens = joinNumbers(tokenize(text));
  const result: ParsedSet = {};
  const unlabeled: number[] = [];

  // «свой вес», «собственный вес», «без веса» = вес 0
  if (/(свой|собственн\p{L}*|без) вес/u.test(text.toLowerCase())) result.weight = 0;

  tokens.forEach((t, i) => {
    if (t.num === undefined) return;
    const next = tokens[i + 1]?.word ?? "";
    const prev = tokens[i - 1]?.word ?? "";
    if (next.startsWith("подход")) return; // «три подхода»: одна фраза = один подход
    // Подпись после числа важнее, чем перед ним: «вес 15 повторов» = 15 повторов
    let field: keyof ParsedSet | null = null;
    if (isWeightUnit(next)) field = "weight";
    else if (isRepsUnit(next)) field = "reps";
    else if (prev === "вес") field = "weight";
    else if (prev.startsWith("повтор")) field = "reps";

    if (field && result[field] === undefined) result[field] = t.num;
    else unlabeled.push(t.num);
  });

  for (const n of unlabeled) {
    if (result.weight === undefined) result.weight = n;
    else if (result.reps === undefined) result.reps = n;
  }

  // Отбрасываем то, что не может быть подходом
  if (result.weight !== undefined && (result.weight < 0 || result.weight > 1000)) {
    delete result.weight;
  }
  if (result.reps !== undefined && (!Number.isInteger(result.reps) || result.reps < 1)) {
    delete result.reps;
  }

  return result.weight === undefined && result.reps === undefined ? null : result;
}
