/* Weiches Scrollen: ein Ruck am Mausrad springt nicht, er gleitet und läuft aus.
   Auf Touch-Geräten bleibt das Scrollen des Systems — es ist dort schon weich.
   Wer „Bewegung reduzieren“ eingestellt hat, bekommt ebenfalls das normale. */
export function smoothScroll({ ease = .085, skip = () => false } = {}) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || matchMedia("(pointer: coarse)").matches) return;
  let target = scrollY, cur = scrollY, running = false;
  const max = () => document.documentElement.scrollHeight - innerHeight;
  addEventListener("wheel", e => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || skip(e)) return;
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 18 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    if (!running) { cur = target = scrollY; }
    target = Math.max(0, Math.min(max(), target + d));
    if (!running) { running = true; requestAnimationFrame(step); }
  }, { passive: false });
  function step() {
    cur += (target - cur) * ease;
    if (Math.abs(target - cur) < .4) { cur = target; running = false; }
    scrollTo(0, cur);
    if (running) requestAnimationFrame(step);
  }
  /* Anker-Links gleiten ebenfalls */
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const el = document.querySelector(a.getAttribute("href")); if (!el) return;
    e.preventDefault(); cur = scrollY; target = Math.min(max(), el.getBoundingClientRect().top + scrollY);
    if (!running) { running = true; requestAnimationFrame(step); }
  });
}
