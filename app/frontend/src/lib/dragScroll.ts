// Прокрутка мышью «как пальцем»: зажал кнопку мыши на списке и потянул вверх
// или вниз, и список едет за курсором. На телефоне это и так работает пальцем,
// здесь только для мыши на компьютере. Включается один раз для всего
// приложения (см. main.tsx), поэтому работает на всех экранах.
//
// Если мышь сдвинулась больше чем на THRESHOLD пикселей, это прокрутка,
// и клик после неё гасим: иначе отпустил кнопку над упражнением, и оно открылось.

const THRESHOLD = 6;

// Ближайший предок, который сам прокручивается по вертикали
function scrollableParent(el: Element | null): HTMLElement | null {
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    if (!(node instanceof HTMLElement)) continue;
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
  }
  return null;
}

// Поля ввода и элементы со своим жестом (риска календаря) не трогаем
function ownsGesture(el: Element): boolean {
  return el.closest("input, textarea, select, [contenteditable], .touch-none") !== null;
}

export function enableDragScroll() {
  let box: HTMLElement | null = null;
  let startY = 0;
  let startTop = 0;
  let dragging = false;

  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const target = e.target as Element;
    if (ownsGesture(target)) return;
    box = scrollableParent(target);
    startY = e.clientY;
    startTop = box?.scrollTop ?? 0;
    dragging = false;
  });

  document.addEventListener("pointermove", (e) => {
    if (!box) return;
    const dy = e.clientY - startY;
    if (!dragging && Math.abs(dy) < THRESHOLD) return;
    if (!dragging) {
      dragging = true;
      document.body.style.userSelect = "none"; // текст не выделяется, пока тянем
      document.body.style.cursor = "grabbing";
    }
    box.scrollTop = startTop - dy;
  });

  const stop = () => {
    box = null;
    // Клик (если он будет) приходит сразу после отпускания кнопки. Потом флаг
    // сбрасываем, чтобы не съесть следующий настоящий клик, если этот не пришёл.
    setTimeout(() => {
      dragging = false;
    });
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };
  document.addEventListener("pointerup", stop);
  document.addEventListener("pointercancel", stop);

  // Клик сразу после прокрутки не считается нажатием
  document.addEventListener(
    "click",
    (e) => {
      if (!dragging) return;
      dragging = false;
      e.preventDefault();
      e.stopPropagation();
    },
    true,
  );
}
