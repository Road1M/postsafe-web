/* Abschnitt für Abschnitt: Eine Scroll-Geste führt genau einen Halt weiter —
   nicht weniger, nicht mehr. Die Fahrt dorthin läuft ruhig zu Ende; was währenddessen
   an Schwung vom Trackpad oder Mausrad nachkommt, wird geschluckt. Erst wenn das Rad
   einen Moment still war, zählt die nächste Geste. So passiert beim schnellen Hin-
   und Herscrollen nichts Hektisches.

   Die Halte liefert die Seite (stops): die Momente ihrer Geschichte, nicht die
   Oberkanten ihrer Abschnitte.

   Wie lange eine Fahrt dauert, bestimmt nicht die Strecke, sondern was unterwegs
   passiert (pace): Wo ein Brief gescannt wird, fährt die Seite langsam, so dass
   jede Animation in ihrem Tempo abläuft; wo nichts geschieht, geht es zügig
   weiter. pace() liefert Bereiche [von, bis, Millisekunden]; alles andere fährt
   mit ms Millisekunden je Bildschirmhöhe.                                        */
export function snapScroll({ stops, skip = () => false, pace = () => [], ms = 1000 }) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let tween = null, lastWheel = 0, acc = 0, own = false, idle = null;
  const max = () => document.documentElement.scrollHeight - innerHeight;
  const list = () => [...new Set(stops().map(v => Math.round(Math.max(0, Math.min(v, max())))))].sort((a, b) => a - b);

  /* Anfahren und Abbremsen kurz, dazwischen gleichmäßig — so spielen die
     Animationen mit ihrer eigenen Dynamik statt im Zeitraffer der Fahrt */
  const profile = (t, A) => { const V = 1 / (1 - A); return t < A ? V * t * t / (2 * A) : t > 1 - A ? 1 - V * (1 - t) * (1 - t) / (2 * A) : V * (t - A / 2); };
  const cubic = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* Kosten jedes Pixels auf der Strecke in Millisekunden, aufsummiert */
  function plan(from, to) {
    const zones = pace(), N = Math.max(2, Math.min(600, Math.ceil(Math.abs(to - from) / 4)));
    const cost = y => { for (const [a, b, m] of zones) if (y >= Math.min(a, b) && y < Math.max(a, b)) return m / Math.abs(b - a); return ms / innerHeight; };
    const ys = [from], cum = [0];
    for (let i = 1; i <= N; i++) { const y = from + (to - from) * i / N; ys.push(y); cum.push(cum[i - 1] + cost((ys[i - 1] + y) / 2) * Math.abs(to - from) / N); }
    const total = cum[N];
    const at = c => {                                       /* Kostenanteil → Position */
      const want = c * total; let lo = 0, hi = N;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < want) lo = m; else hi = m; }
      const f = cum[hi] > cum[lo] ? (want - cum[lo]) / (cum[hi] - cum[lo]) : 0;
      return ys[lo] + (ys[hi] - ys[lo]) * f;
    };
    return { dur: Math.max(650, total), at };
  }

  function current() {
    const s = list(), y = scrollY;
    let best = 0;
    s.forEach((v, i) => { if (Math.abs(v - y) < Math.abs(s[best] - y)) best = i; });
    return { s, i: best };
  }
  /* paced: eine Fahrt zum Nachbarhalt, im Tempo ihrer Animationen. Sonst (Pos1,
     Ende, Anker über mehrere Abschnitte) ein zügiger Sprung. */
  function goTo(target, paced = true) {
    const from = scrollY, dist = Math.abs(target - from);
    if (dist < 1) return;
    let dur, pos;
    if (reduce) { dur = 1; pos = () => target; }
    else if (paced) { const p = plan(from, target), A = Math.min(.2, 450 / p.dur); dur = p.dur; pos = k => p.at(profile(k, A)); }   /* Anfahren höchstens eine knappe halbe Sekunde */
    else { dur = Math.max(800, Math.min(1600, 650 + dist / innerHeight * 200)); pos = k => from + (target - from) * cubic(k); }
    const t0 = performance.now();
    tween = { done: false };
    const me = tween;
    const step = now => {
      if (me !== tween) return;
      const k = Math.min(1, (now - t0) / dur);
      own = true; scrollTo(0, k < 1 ? pos(k) : target); own = false;
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
  const busy = () => (tween && !tween.done) || performance.now() - lastWheel < 450;

  /* Wann beginnt eine neue Geste? Wenn das Rad eine knappe halbe Sekunde still
     war — oder wenn der Ausschlag wieder ansteigt: Nachlauf wird immer schwächer,
     ein neuer Wisch dagegen stärker. So bleibt ein stockender Nachlauf (langsamer
     Rechner) eine Geste, ein zweiter Wisch mitten im Nachlauf zählt trotzdem.   */
  let locked = false, hist = [];
  addEventListener("wheel", e => {
    if (e.ctrlKey) return;
    const now = performance.now(), gap = now - lastWheel;
    lastWheel = now;
    /* Ein Fenster in der Seite scrollt selbst; sein Nachlauf am Rand bewegt die Seite nicht */
    if (skip(e)) { locked = true; return; }
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 18 : e.deltaY, mag = Math.abs(d);
    if (gap > 450) hist = [];
    /* ansteigend heißt: dreimal hintereinander stärker, zusammen deutlich über dem
       Nachlauf davor — ein einzelner Ausreißer (zusammengefasste Ereignisse bei
       voller Leitung) zählt nicht */
    hist.push(mag); if (hist.length > 8) hist.shift();
    const h = hist, m = h.length, base = h.slice(0, Math.max(1, m - 3)).reduce((a, b) => a + b, 0) / Math.max(1, m - 3);
    const rising = m >= 5 && mag >= 12 && h[m - 1] > h[m - 2] && h[m - 2] > h[m - 3] && mag > base * 1.8;
    if (tween && !tween.done) return;               /* Schwung während der Fahrt: geschluckt */
    if (gap > 450 || rising) { acc = 0; locked = false; }   /* eine neue Geste */
    if (locked) return;                             /* Nachlauf der letzten Geste */
    acc += d;
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
    if (e.key === "Home") goTo(0, false); else if (e.key === "End") goTo(max(), false); else go(down ? 1 : -1);
  });

  /* Wischen auf dem Handy: eine Wischgeste, ein Halt. Beginnt sie in einem Fenster,
     das in diese Richtung noch scrollen kann, gehört sie dem Fenster. */
  let ty = null, tx = null, from = null, mode = null;
  addEventListener("touchstart", e => { from = e.target; mode = null; ty = e.touches[0].clientY; tx = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchmove", e => {
    if (ty === null || e.touches.length !== 1) return;
    if (!mode) mode = skip({ target: from, deltaY: ty - e.touches[0].clientY }) ? "inner" : "page";
    if (mode === "page") e.preventDefault();
  }, { passive: false });
  addEventListener("touchend", e => {
    if (ty === null || mode !== "page") { ty = null; return; }
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
    goTo(s.find(v => v >= top - 2) ?? s[s.length - 1], false);
  });

  /* Kam die Seite anders an eine Stelle (Scrollbalken, Neuladen), rastet sie am nächsten Halt ein */
  addEventListener("scroll", () => {
    if (own || busy()) return;
    clearTimeout(idle);
    idle = setTimeout(() => { if (!busy()) { const { s, i } = current(); goTo(s[i]); } }, 260);
  }, { passive: true });

  return { resnap() { if (!busy()) { const { s, i } = current(); goTo(s[i]); } } };
}
