/** Schedule layout-dependent updates outside ResizeObserver delivery. */
export function observeLayoutChanges(elements: readonly Element[], measure: () => void): () => void {
  let frame: number | null = null;
  const schedule = () => {
    if (frame !== null) return;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      measure();
    });
  };
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
  elements.forEach((element) => observer?.observe(element));
  window.addEventListener('resize', schedule);
  return () => {
    observer?.disconnect();
    window.removeEventListener('resize', schedule);
    if (frame !== null) window.cancelAnimationFrame(frame);
  };
}
