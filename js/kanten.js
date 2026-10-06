/* Safaris Leisten am iPhone (iOS 26): Alles, was beim Scrollen feststeht — das iPhone, die Briefe,
   die Navigation —, schneidet Safari genau an seinen Leisten oben und unten ab, während die Seite
   darunter weiterläuft. Ohne Vorgabe entstand so oben und unten ein Streifen, an dem iPhone und
   Briefe einfach aufhörten.
   Safari färbt seine Leisten aber nach festen Elementen über die volle Breite am Rand und zeichnet
   sie dann deckend. Diese zwei Kanten geben ihm die Farbe vor — immer die der Fläche, die gerade
   am jeweiligen Rand liegt: Papier, die Karte „Dein Speicher", der Fuß. Zu sehen sind sie nicht,
   sie liegen hinter der Seite (seite.css, .kante). */
export function edges() {
  const mk = side => { const el = document.createElement("div"); el.className = "kante kante--" + side; el.setAttribute("aria-hidden", "true"); document.body.append(el); return el; };
  const top = mk("oben"), bottom = mk("unten");
  const clear = c => !c || c === "transparent" || /,\s*0\)$/.test(c);
  /* Farbe der ersten deckenden Fläche an einem Punkt; feste Ebenen ohne Zeiger (Briefe, iPhone) zählen nicht */
  const colorAt = y => {
    for (let el = document.elementFromPoint(innerWidth / 2, y); el && el !== document.documentElement; el = el.parentElement) {
      const c = getComputedStyle(el).backgroundColor;
      if (!clear(c)) return c;
    }
    return getComputedStyle(document.body).backgroundColor;
  };
  let queued = false, lastTop = "", lastBottom = "";
  const update = () => {
    queued = false;
    const t = colorAt(1), b = colorAt(innerHeight - 2);
    if (t !== lastTop) top.style.backgroundColor = lastTop = t;
    if (b !== lastBottom) bottom.style.backgroundColor = lastBottom = b;
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  new MutationObserver(queue).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", queue);
  queue();
}
