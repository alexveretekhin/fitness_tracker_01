import { describe, expect, it } from "vitest";
import { parseSet } from "./parseSet";

// Тесты разбора фраз. Запуск: pnpm test
describe("parseSet", () => {
  it.each([
    // фраза                                  ожидаем
    ["60 кг 10 раз", { weight: 60, reps: 10 }],
    ["60 кг на 10", { weight: 60, reps: 10 }],
    ["60 на 10", { weight: 60, reps: 10 }],
    ["60x10", { weight: 60, reps: 10 }],
    ["62,5 кг на 8", { weight: 62.5, reps: 8 }],
    ["62.5кг 8 повторов", { weight: 62.5, reps: 8 }],
    ["10 раз 60 кило", { weight: 60, reps: 10 }],
    ["10 раз по 60", { weight: 60, reps: 10 }],
    ["повторов 12 вес 40", { weight: 40, reps: 12 }],
    ["шестьдесят килограмм десять раз", { weight: 60, reps: 10 }],
    ["шестьдесят два с половиной кило восемь повторений", { weight: 62.5, reps: 8 }],
    ["сто двадцать пять на пять", { weight: 125, reps: 5 }],
    ["Сто десять кг. Шесть раз.", { weight: 110, reps: 6 }],
    ["свой вес 15 повторов", { weight: 0, reps: 15 }],
    ["без веса двадцать раз", { weight: 0, reps: 20 }],
    ["три подхода по 10 раз", { reps: 10 }],
  ])("«%s»", (phrase, expected) => {
    expect(parseSet(phrase)).toEqual(expected);
  });

  it("одно число без подписи считает весом", () => {
    expect(parseSet("80")).toEqual({ weight: 80 });
  });

  it("только повторы", () => {
    expect(parseSet("десять раз")).toEqual({ reps: 10 });
  });

  it("числа подряд словами не склеивает неправильно", () => {
    // «десять пять»: это 10 и 5, а не 15
    expect(parseSet("десять пять")).toEqual({ weight: 10, reps: 5 });
  });

  it("дробные повторы и бред отбрасывает", () => {
    expect(parseSet("10 кг 2.5 раза")).toEqual({ weight: 10 });
    expect(parseSet("привет как дела")).toBeNull();
    expect(parseSet("")).toBeNull();
  });
});
