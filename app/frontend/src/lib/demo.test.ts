import { expect, test } from "vitest";
import { demoSources } from "./demo";

test("путь по id упражнения: сначала webm, потом mp4", () => {
  expect(demoSources("squat")).toEqual([
    { src: "/animations/exercises/squat.webm", type: "video/webm" },
    { src: "/animations/exercises/squat.mp4", type: "video/mp4" },
  ]);
});

test("путь из каталога берём без расширения", () => {
  const [webm, mp4] = demoSources("push-ups", "/animations/exercises/push-ups.mp4");
  expect(webm.src).toBe("/animations/exercises/push-ups.webm");
  expect(mp4.src).toBe("/animations/exercises/push-ups.mp4");
});
