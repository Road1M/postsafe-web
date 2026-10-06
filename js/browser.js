/* Die Vorschau von PostSafe Web: echte Seiten, erzeugt vom WebPageRenderer der
   App (seiten.json), in einem Browserfenster. Ordner und Briefe lassen sich
   anklicken, die Suche sucht, Zurück und Vor funktionieren. Was in echt Daten
   aufs iPhone schicken würde (Hochladen, Export, PDF, Signatur), sagt hier nur,
   was es täte.                                                               */

import { LETTERS, drawLetter } from "./letters.js?v=23";   /* gleiche Fassung wie in index.html, sonst zweimal geladen */

const W = 1180;                                 /* Breite, in der die Seite gesetzt wird */

export async function mountBrowser(el, { height = 620 } = {}) {
  el.classList.add("browser");
  el.innerHTML = `
    <div class="browser__bar">
      <i></i><i></i><i></i>
      <span class="browser__nav"><button type="button" data-back aria-label="Zurück" disabled><svg width="10" height="16" viewBox="0 0 10 16"><path d="M8 2 2 8l6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button type="button" data-fwd aria-label="Vor" disabled><svg width="10" height="16" viewBox="0 0 10 16"><path d="m2 2 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></span>
      <span class="browser__url"><svg width="11" height="13" viewBox="0 0 11 13" aria-hidden="true"><rect x="1" y="5.5" width="9" height="6.5" rx="1.6" fill="currentColor"/><path d="M3 5.5V4a2.5 2.5 0 0 1 5 0v1.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>postsafe.eu</span>
    </div>
    <div class="browser__view" tabindex="0"><div class="browser__page"></div><p class="browser__toast" role="status"></p></div>`;
  const view = el.querySelector(".browser__view"), page = el.querySelector(".browser__page"), toast = el.querySelector(".browser__toast");
  const back = el.querySelector("[data-back]"), fwd = el.querySelector("[data-fwd]");
  const [pages, css] = await Promise.all([fetch("vorschau/seiten.json").then(r => r.json()), fetch("vorschau/stil.css").then(r => r.text())]);
  const host = document.createElement("div"); host.style.width = W + "px"; host.style.transformOrigin = "0 0";
  const root = host.attachShadow({ mode: "open" });
  page.appendChild(host);
  const darkCss = css;                          /* stil.css kennt Hell und Dunkel selbst */
  const papers = {};
  const paper = n => papers[n] || (papers[n] = drawLetter(LETTERS[n]).toDataURL("image/jpeg", .88));

  let hist = ["/"], pos = 0;
  function render(path) {
    let html = pages[path];
    if (path.startsWith("/suche?")) html = search(decodeURIComponent(path.split("q=")[1] || ""));
    if (!html) return;
    root.innerHTML = `<style>${darkCss} :host{display:block} .foot__in p:nth-child(2){display:none}</style><div class="wa-html"><div class="wa-body">${html}</div></div>`;
    root.querySelectorAll("img").forEach(i => { const s = i.getAttribute("src") || ""; if (s.startsWith("papier:")) i.src = paper(+s.slice(7)); });
    const q = root.querySelector('input[type="search"]'); if (q && path.startsWith("/suche?")) q.value = decodeURIComponent(path.split("q=")[1] || "");
    fit(); view.scrollTop = 0;
    back.disabled = pos === 0; fwd.disabled = pos >= hist.length - 1;
  }
  function go(path) { hist = hist.slice(0, pos + 1); hist.push(path); pos++; render(path); }
  function search(q) {
    const tpl = document.createElement("template"); tpl.innerHTML = pages["/"];
    const rows = [...tpl.content.querySelectorAll(".wrow")];
    const hits = rows.filter(r => r.textContent.toLowerCase().includes(q.toLowerCase()));
    rows.forEach(r => { if (!hits.includes(r)) r.remove(); });
    const h1 = tpl.content.querySelector("h1"); if (h1) h1.innerHTML = `<span class="lt">Suche nach</span> ${q.replace(/</g, "&lt;")}`;
    const say = tpl.content.querySelector(".say"); if (say) say.textContent = hits.length === 1 ? "1 Treffer" : hits.length + " Treffer";
    tpl.content.querySelectorAll('[aria-current="page"]').forEach(a => a.removeAttribute("aria-current"));
    const up = tpl.content.querySelector("form:not([role])"); if (up) up.remove();
    if (!hits.length) { const m = tpl.content.querySelector(".main"); if (m) m.innerHTML = `<p class="say">Dazu findet sich nichts in deinem Archiv.</p>`; }
    return tpl.innerHTML;
  }
  let tt;
  function say(msg) { toast.textContent = msg; toast.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("on"), 2600); }

  root.addEventListener("click", e => {
    const a = e.target.closest("a"); if (!a) return;
    const href = a.getAttribute("href") || "";
    if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener"; return; }
    e.preventDefault();
    if (href === "/export") return say("Im echten PostSafe Web lädt das jetzt dein ganzes Archiv als ZIP herunter.");
    if (/\/pdf$/.test(href)) return say("Im echten PostSafe Web lädt das jetzt den Brief als PDF herunter.");
    if (/unterschreiben$/.test(href)) return say("Im echten PostSafe Web unterschreibst du jetzt auf dem iPhone.");
    if (pages[href]) go(href);
  });
  root.addEventListener("submit", e => {
    e.preventDefault();
    const f = e.target, q = f.querySelector('input[type="search"]');
    if (q) { const v = q.value.trim(); if (v) go("/suche?q=" + encodeURIComponent(v)); return; }
    say("Im echten PostSafe Web geht die Datei jetzt über dein WLAN auf dein iPhone.");
  });
  /* Wer über das Fenster hinwegscrollt, scrollt die Seite. Erst ein Klick hinein
     macht das Fenster selbst scrollbar — bis der Zeiger es wieder verlässt. Auf dem
     Handy ist jeder Wisch auch ein Antippen; dort macht erst ein Tippen ins Fenster
     es scrollbar, und ein Tippen daneben wieder die Seite. */
  const arm = on => view.classList.toggle("live", on);
  view.addEventListener("pointerdown", e => { if (e.pointerType !== "touch") arm(true); });
  view.addEventListener("click", () => arm(true));
  view.addEventListener("focusin", () => arm(true));
  view.addEventListener("pointerleave", e => { if (e.pointerType !== "touch") arm(false); });
  view.addEventListener("focusout", () => arm(false));
  document.addEventListener("pointerdown", e => { if (e.pointerType === "touch" && !view.contains(e.target)) arm(false); });
  back.addEventListener("click", () => { if (pos > 0) { pos--; render(hist[pos]); } });
  fwd.addEventListener("click", () => { if (pos < hist.length - 1) { pos++; render(hist[pos]); } });

  function fit() {
    const s = view.clientWidth / W; host.style.transform = `scale(${s})`;
    page.style.height = host.offsetHeight * s + "px"; view.style.height = Math.min(height, Math.max(360, view.clientWidth * .62)) + "px";
  }
  addEventListener("resize", fit);
  render("/");
  return { setDark(d) { host.classList.toggle("dark", d); }, fit };
}
