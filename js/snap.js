/* Abschnitt für Abschnitt: Eine Scroll-Geste führt genau einen Halt weiter —
   nicht weniger, nicht mehr. Die Fahrt dorthin läuft ruhig zu Ende; was währenddessen
   an Schwung vom Trackpad oder Mausrad nachkommt, wird geschluckt. Erst wenn das Rad
   einen Moment still war, zählt die nächste Geste. So passiert beim schnellen Hin-
   und Herscrollen nichts Hektisches.

   Die Halte liefert die Seite (stops): die Momente ihrer Geschichte, nicht die
   Oberkanten ihrer Abschnitte.                                                   */
export function snapScroll({ stops, skip = () => false }) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let tween = null, lastWheel = 0, acc = 0, own = false, idle = null;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const list = () => [...new Set(stops().map(v => Math.round(Math.max(0, Math.min(v, max())))))].sort((a, b) => a - b);
  const max = () => document.documentElement.scrollHeight - innerHeight;

  function current() {
    const s = list(), y = scrollY;
    let best = 0;
    s.forEach((v, i) => { if (Math.abs(v - y) < Math.abs(s[best] - y)) best = i; });
    return { s, i: best };
  }
  function goTo(target) {
    const from = scrollY, dist = Math.abs(target - from);
    if (dist < 1) return;
    const dur = reduce ? 1 : Math.max(800, Math.min(1500, 650 + dist / innerHeight * 260));
    const t0 = performance.now();
    tween = { done: false };
    const me = tween;
    const step = now => {
      if (me !== tween) return;
      const k = Math.min(1, (now - t0) / dur);
      own = true; scrollTo(0, from + (target - from) * ease(k)); own = false;
      if (k < 1) requestAnimationFrame(step); else me.done = true;
    };
    requestAnimationFrame(step);
  }
  function go(dir) {
    const { s, i } = current(), y = scrollY;
    /* Liegt die Seite zwischen zwei Halten, zählt der nächste in Richtung der Geste */
    let j = i;
    if (dir > 0) j = s[i] > y + 2 ? i : i + 1; else j = s[i] < y - 2 ? i : i - 1;
    j = Math.max(0, Math.min(s.length - 1, j));
    goTo(s[j]);
  }
  const busy = () => (tween && !tween.done) || performance.now() - lastWheel < 240;

  let locked = false;
  addEventListener("wheel", e => {
    if (e.ctrlKey) return;
    const now = performance.now(), quiet = now - lastWheel > 240;
    lastWheel = now;
    /* Ein Fenster in der Seite scrollt selbst; sein Nachlauf am Rand bewegt die Seite nicht */
    if (skip(e)) { locked = true; return; }
    e.preventDefault();
    if (tween && !tween.done) return;               /* Schwung während der Fahrt: geschluckt */
    if (quiet) { acc = 0; locked = false; }         /* das Rad war still: eine neue Geste */
    if (locked) return;                             /* Nachlauf der letzten Geste */
    acc += e.deltaMode === 1 ? e.deltaY * 18 : e.deltaY;
    if (Math.abs(acc) > 28) { go(Math.sign(acc)); acc = 0; locked = true; }
  }, { passive: false });

  /* Tastatur: Pfeile, Bild auf/ab, Leertaste, Pos1, Ende */
  addEventListener("keydown", e => {
    if (e.target.closest?.("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
    const down = ["ArrowDown", "PageDown", " "].includes(e.key) && !(e.key === " " && e.shiftKey);
    const up = ["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey);
    if (!down && !up && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    if (tween && !tween.done) return;
    if (e.key === "Home") goTo(0); else if (e.key === "End") goTo(max()); else go(down ? 1 : -1);
  });

  /* Wischen auf dem Handy: eine Wischgeste, ein Halt */
  let ty = null, tx = null, inner = false;
  addEventListener("touchstart", e => { inner = skip(e); ty = e.touches[0].clientY; tx = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchmove", e => { if (!inner && ty !== null && e.touches.length === 1) e.preventDefault(); }, { passive: false });
  addEventListener("touchend", e => {
    if (inner || ty === null) return;
    const dy = ty - e.changedTouches[0].clientY, dx = tx - e.changedTouches[0].clientX; ty = null;
    if (Math.abs(dy) < 36 || Math.abs(dx) > Math.abs(dy)) return;
    if (tween && !tween.done) return;
    go(Math.sign(dy));
  });

  /* Anker-Links fahren zum ersten Halt ab ihrem Ziel */
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const el = document.querySelector(a.getAttribute("href")); if (!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + scrollY, s = list();
    goTo(s.find(v => v >= top - 2) ?? s[s.length - 1]);
  });

  /* Kam die Seite anders an eine Stelle (Scrollbalken, Neuladen), rastet sie am nächsten Halt ein */
  addEventListener("scroll", () => {
    if (own || busy()) return;
    clearTimeout(idle);
    idle = setTimeout(() => { if (!busy()) { const { s, i } = current(); goTo(s[i]); } }, 260);
  }, { passive: true });

  return { resnap() { if (!busy()) { const { s, i } = current(); goTo(s[i]); } } };
}
