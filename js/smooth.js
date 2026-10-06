/* Weiches Scrollen mit dem Mausrad: Jede Bewegung gibt der Seite einen kurzen Schwung, sie gleitet
   ein Stück weiter und bremst sanft ab. Kommt währenddessen die nächste Bewegung, wird der Schwung
   einfach länger — nichts rastet ein, nichts stockt.

   Gerechnet wird mit einem Ziel: Jedes Rad-Ereignis schiebt es weiter, und die Seite läuft ihm in
   jedem Bild ein festes Stück des Restwegs hinterher (ease). Ein Rasten am Mausrad wird dabei
   kräftiger gewertet als die feinen Schritte eines Trackpads (gain), damit schon eine kleine
   Bewegung spürbar trägt. Am Handy bleibt das Wischen beim Browser: iOS gibt jedem Wisch bereits
   genau diesen auslaufenden Schwung. */
export function smoothScroll({ skip = () => false, ease = .085, gain = 2 } = {}) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const max = () => document.documentElement.scrollHeight - innerHeight;
  let target = scrollY, cur = scrollY, set = scrollY, running = false, last = 0;

  addEventListener("wheel", e => {
    if (e.ctrlKey || skip(e)) return;                        /* Zoomen; Fenster, die selbst scrollen */
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;     /* seitlich: dem Browser überlassen */
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    /* Mausrad: wenige große, ganzzahlige Schritte. Trackpad: viele feine, die schon selbst auslaufen. */
    const wheel = Math.abs(d) >= 50 && Number.isInteger(d);
    if (!running) target = cur = set = scrollY;
    target = Math.max(0, Math.min(max(), target + d * (wheel ? gain : 1)));
    if (!running) { running = true; last = 0; requestAnimationFrame(step); }
  }, { passive: false });

  function step(now) {
    /* Hat jemand anders gescrollt (Scrollbalken, Tasten, Anker), gibt der Schwung nach */
    if (Math.abs(scrollY - set) > 2) { running = false; return; }
    const dt = last ? Math.min(64, now - last) : 16.7; last = now;
    cur += (target - cur) * (1 - Math.pow(1 - ease, dt / 16.7));   /* gleich weich bei 60 und 120 Bildern */
    if (Math.abs(target - cur) < .5) cur = target;
    scrollTo(0, cur); set = scrollY;
    if (cur !== target) requestAnimationFrame(step); else running = false;
  }
}
