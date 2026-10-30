// Помощники для календаря истории. Недели начинаются с понедельника.

// Все дни месяца по порядку: 1, 2, … 30/31
export function monthDays(month: Date): Date[] {
  const y = month.getFullYear();
  const m = month.getMonth();
  const length = new Date(y, m + 1, 0).getDate(); // 0-е число следующего месяца = последний день этого
  return Array.from({ length }, (_, i) => new Date(y, m, i + 1));
}

// Колонка дня в календаре: пн = 0 … вс = 6 (в JavaScript неделя начинается с воскресенья)
export function weekColumn(date: Date): number {
  return (date.getDay() + 6) % 7;
}

// Первое число месяца, сдвинутого на n месяцев: 30.10 и n = -1 → 01.09
export function shiftMonth(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

// Последний день того же месяца: 01.10 → 31.10
export function monthEnd(month: Date): Date {
  return new Date(month.getFullYear(), month.getMonth() + 1, 0);
}
