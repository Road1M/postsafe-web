/* Weiches Scrollen am Rechner: Jede Bewegung am Mausrad gibt der Seite einen kurzen Schwung, sie
   gleitet ein Stück weiter und bremst sanft ab. Kommt währenddessen die nächste Bewegung, wird der
   Schwung einfach länger — nichts rastet ein, nichts stockt.

   Gerechnet wird mit einem Ziel: Jedes Rad-Ereignis schiebt es weiter, und die Seite läuft ihm in
   jedem Bild ein festes Stück des Restwegs hinterher (ease).
   - Mausrad: jede Raste schiebt um ein festes Stück (step). Erkannt wird sie an wheelDelta, das
     Browser für Rasten in Vielfachen von 120 melden — die Pixelwerte dagegen schwanken je nach
     Browser stark (Safari meldet für eine Raste nur wenige Pixel; daran lag der fehlende Schwung).
   - Trackpad und Magic Mouse: feine Schritte, verstärkt (gain), und jede neue Geste bekommt einen
     kleinen Anstoß (kick), damit auch eine kurze Bewegung spürbar trägt.
   Am Handy und Tablet bleibt das Scrollen beim Browser, ohne jeden Zusatz. */
export function smoothScroll({ skip = () => false, ease = .08, step = 240, gain = 1.5, kick = 90 } = {}) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const max = () => document.documentElement.scrollHeight - innerHeight;
  let target = scrollY, cur = scrollY, set = scrollY, running = false, last = 0, lastWheel = 0;

  addEventListener("wheel", e => {
    if (e.ctrlKey || skip(e)) return;                        /* Zoomen; Fenster, die selbst scrollen */
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || !e.deltaY) return;   /* seitlich: dem Browser überlassen */
    e.preventDefault();
    const now = performance.now(), fresh = now - lastWheel > 180, dir = Math.sign(e.deltaY);
    lastWheel = now;
    const notch = e.deltaMode === 1 || (e.wheelDeltaY && e.wheelDeltaY % 120 === 0);
    const d = e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    if (!running) target = cur = set = scrollY;
    /* Gegen die Fahrtrichtung: der Schwung endet, die neue Richtung beginnt hier */
    if (running && Math.sign(target - cur) === -dir) target = cur;
    target += notch ? dir * step : d * gain + (fresh ? dir * kick : 0);
    target = Math.max(0, Math.min(max(), target));
    if (!running) { running = true; last = 0; requestAnimationFrame(tick); }
  }, { passive: false });

  function tick(now) {
    /* Hat jemand anders gescrollt (Scrollbalken, Tasten, Anker), gibt der Schwung nach */
    if (Math.abs(scrollY - set) > 2) { running = false; return; }
    const dt = last ? Math.min(64, now - last) : 16.7; last = now;
    cur += (target - cur) * (1 - Math.pow(1 - ease, dt / 16.7));   /* gleich weich bei 60 und 120 Bildern */
    if (Math.abs(target - cur) < .5) cur = target;
    scrollTo(0, cur); set = scrollY;
    if (cur !== target) requestAnimationFrame(tick); else running = false;
  }
}
