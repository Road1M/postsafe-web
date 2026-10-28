/* Das Kapitel „Ein Foto“, sobald die Briefe als Fächer liegen — wie Schritt 1 des Onboardings der App
   (OnboardingLetterDeck, OnboardingLetterNote, LetterWave): der vordere Brief wird gelesen, eine farblose
   Welle läuft über ihn und hebt die Schrift heraus, was sie gelesen hat, ist gleich danach markiert wie
   bei Live Text. Dann baut sich die Karte des Briefs auf ihm auf — Kopf, dann Zu tun und Fällig, dann die
   Erinnerung —, und Brief und Karte gehen klein in ihren Ordner. Josefs Wahl aus der Vorschau (28.10.2026).

   Alles hängt an einer Zeit t (Sekunden, 0 = der Fächer liegt), die index.html aus dem Scrollen ableitet;
   die Abstände sind die des Onboardings (OnboardingLetterDeck.run). Gezeichnet wird in Pixeln des
   Fensters, in einer festen Ebene über den 3D-Briefen. */
import { drawLetter, paper } from "./letters.js?v=27";

const P3 = CSS.supports("color", "color(display-p3 0 0 0)");
const MARK = P3 ? "color(display-p3 0 .4157 1)" : "rgb(0,106,255)";   /* das Blau der App, deckend; durchscheinend wird die ganze Fläche */
const BELL = '<svg width="15" height="15" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.6a4.6 4.6 0 0 0-4.6 4.6v3.3L3.6 13.6h12.8l-1.8-3.1V7.2A4.6 4.6 0 0 0 10 2.6z" fill="currentColor"/><path d="M8 15.6a2.1 2.1 0 0 0 4 0z" fill="currentColor"/></svg>';

export const PW = 230, PH = Math.round(230 * 1188 / 840);       /* ein Brief bei Maßstab 1, DIN A4 */
export const NEED = PH / 2 - 4 + 190;                             /* von seiner Oberkante bis unter die Karte mit Erinnerung */
const NOTE_W = 330;
/* Der Fächer aus einem Fuß: vorn gerade, dann links und rechts geneigt (Onboarding) */
const POSES = [[0, 0, 0], [-7, -26, 6], [7, 26, 8], [-3, -9, 11]];

const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
/* Federn wie in SwiftUI: spring(duration, bounce); bounce 0 ist .smooth */
function spring(t, d, b = 0) {
  if (t <= 0) return 0; const w = 2 * Math.PI / d, z = 1 - b;
  if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t));
}
const easeInOut = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
/* SwiftUI easeInOut (0.42, 0, 0.58, 1), mit der die Welle läuft */
function bez(t) { t = clamp(t); let u = t; for (let i = 0; i < 6; i++) { const x = 3 * .42 * u * (1 - u) * (1 - u) + 3 * .58 * u * u * (1 - u) + u * u * u - t, dx = 3 * .42 * (1 - u) * (1 - 4 * u + 3 * u * u) + 3 * .58 * (2 * u - 3 * u * u) + 3 * u * u; if (Math.abs(dx) < 1e-6) break; u -= x / dx; } return 3 * u * u * (1 - u) + u * u * u; }
const poseAt = r => { const i = Math.min(POSES.length - 1, Math.floor(r)), j = Math.min(POSES.length - 1, i + 1), f = clamp(r - i); return POSES[i].map((v, k) => lerp(v, POSES[j][k], f)); };
const el = (tag, cls, html, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.append(e); return e; };

/* Die Textstellen eines Blatts, aus dem Druck gelesen wie Live Text sie markiert: erst die Zeilen (Reihen
   mit Tinte, Lücken dazwischen), dann in jeder Zeile die Spalten — Anschrift links und Angaben rechts, die
   drei Spalten der Fußzeile — getrennt, wo eine breite Lücke ist. Tinte ist alles deutlich Dunklere als das
   Papier, auch die hellgraue Fußzeile; farbige Tinte nur oben im Briefkopf (Logo des Absenders) — weiter
   unten ist sie die Unterschrift, und die ist kein Text. */
function textLines(cv) {
  const W = cv.width, H = cv.height, d = cv.getContext("2d").getImageData(0, 0, W, H).data, out = [], head = H * .12;
  const x0 = Math.round(W * .1), x1 = Math.round(W * .95), gapCols = Math.round(W * .025);
  const ink = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = x0; x < x1; x++) {
    const i = (y * W + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2];
    if (r + g + b < 560 && (y < head || Math.abs(r - b) < 30)) ink[y * W + x] = 1;
  }
  const rowInk = y => { let n = 0; for (let x = x0; x < x1 && n < 2; x++) n += ink[y * W + x]; return n > 1; };
  let y0 = -1, gap = 0;
  for (let y = 0; y <= H; y++) {
    if (y < H && rowInk(y)) { if (y0 < 0) y0 = y; gap = 0; continue; }
    if (y0 < 0 || ++gap <= 2) continue;
    const ya = y0, yb = y - gap, h = yb - ya + 1; y0 = -1;
    if (h < 3 || h > H * .06) continue;
    /* Spalten in dieser Zeile */
    let start = -1, last = -1;
    for (let x = x0; x <= x1; x++) {
      let col = 0; if (x < x1) for (let yy = ya; yy <= yb && !col; yy++) col = ink[yy * W + x];
      if (col) { if (start < 0) start = x; last = x; }
      else if (start >= 0 && x - last > gapCols) { if (last - start > 14) out.push([start / W, ya / H, (last - start) / W, h / H]); start = -1; }
    }
    if (start >= 0 && last - start > 14) out.push([start / W, ya / H, (last - start) / W, h / H]);
  }
  return out;
}

/* Die Zeiten je Brief, ab „der Fächer liegt“ (t = 0) */
function schedule(letters) {
  const times = []; let tc = 0;
  for (const f of letters) {
    const t = { tc, tw: tc + .2 };
    t.n1 = t.tw + 1.1 + .45; t.liveOut = t.n1 + .3;
    t.n2 = t.n1 + .5; t.n3 = f.remind ? t.n2 + .65 : null;
    /* Einsortieren in Ruhe (Josef: „viel zu schnell“): klein über den Ordner, dann hinein, dann leuchtet er */
    t.tf = f.remind ? t.n3 + 1.3 : t.n2 + 1.1; t.te = t.tf + 1.4; t.filed = t.te + .5; t.gone = t.filed + 1.2;   /* filed: der Brief ist (fast) ganz drin — erst dann leuchtet er */
    times.push(t); tc = t.gone + .3;
  }
  return times;
}

/* layer: feste Ebene über den Briefen; tiles: die vier Ordnerkacheln (Reihenfolge wie folders);
   letters: die vier Briefe, in der Reihenfolge, in der sie gelesen werden */
export function createDeck(layer, tiles, { letters, folders, LETTERS }) {
  const times = schedule(letters), END = times[times.length - 1].gone + .3;   /* bis der letzte Ordner ausgeleuchtet hat */
  const dpr = Math.min(3, devicePixelRatio || 1);
  const pieces = letters.map(f => {
    const print = drawLetter(LETTERS[f.L]);
    const bold = document.createElement("canvas"); bold.width = print.width; bold.height = print.height;
    const b = bold.getContext("2d"); b.drawImage(print, 0, 0); b.globalCompositeOperation = "darken";
    for (const [dx, dy] of [[1.1, 0], [0, 1.1], [1.1, 1.1], [-.6, 0]]) b.drawImage(print, dx, dy);   /* nur die Schrift wird kräftiger */
    const blank = document.createElement("canvas"); blank.width = print.width; blank.height = print.height;
    paper(blank.getContext("2d"), blank.width, blank.height, "#FBFAF6");
    const p = el("div", "dk-piece", null, layer); p.style.width = PW + "px"; p.style.height = PH + "px";
    el("div", "dk-paper", null, p).append(print);
    const wave = el("canvas", null, null, p); wave.width = Math.round(PW * dpr); wave.height = Math.round(PH * dpr); wave.style.opacity = 0;
    /* Die Markierungen alle auf einer Fläche, deckend gezeichnet und erst als Ganzes durchscheinend:
       wo sich zwei berühren, wird es nicht dunkler (Josef, 28.10.2026: dunklere Streifen) */
    const live = el("canvas", "dk-live", null, p); live.width = Math.round(PW * dpr); live.height = Math.round(PH * dpr);
    const lctx = live.getContext("2d"), bands = textLines(print).map(([x, y, w, h]) => ({ x, y, w, h }));
    const fo = folders[f.f];
    const note = el("div", "dk-note", `<div class="in"><div class="hd"><i></i>${fo.name}</div><div class="ti">${f.title}</div><div class="se">${f.sender}</div>` +
      `<div class="fl"><div><span>Zu tun</span><b>${f.task}</b></div><hr><div><span>${f.dueLabel}</span><b>${f.due}</b></div></div>` +
      (f.remind ? `<div class="rm"><i>${BELL}</i><div><b>${f.remind}</b><span>${f.remindNote}</span></div></div>` : "") + `</div>`, p);
    note.style.setProperty("--c", fo.c);
    Object.assign(note.style, { width: NOTE_W + "px", left: (PW - NOTE_W) / 2 + "px", top: (PH / 2 - 4) + "px" });
    return { f, print, bold, blank, el: p, wave, wctx: wave.getContext("2d"), live, lctx, bands, liveKey: "", note, parts: note.querySelectorAll(".fl, .rm"), waveClear: false };
  });
  /* Was nicht passt, wird kleiner (wie minimumScaleFactor in der App); dann die Höhen der drei Stufen */
  function fitNotes() {
    for (const P of pieces) {
      const inner = NOTE_W - 32, ti = P.note.querySelector(".ti"); let s = 1; ti.style.fontSize = "";
      while (ti.scrollWidth > inner && s > .8) { s -= .01; ti.style.fontSize = (19 * s) + "px"; }
      const fl = P.note.querySelector(".fl"), bs = fl.querySelectorAll("b"); let q = 1; bs.forEach(b => b.style.fontSize = "");
      while (fl.scrollWidth > inner && q > .8) { q -= .01; bs.forEach(b => b.style.fontSize = (19 * q) + "px"); }
      const inEl = P.note.querySelector(".in"), se = inEl.querySelector(".se"), flEl = inEl.querySelector(".fl"), rmEl = inEl.querySelector(".rm");
      P.h1 = se.offsetTop + se.offsetHeight + 30; P.h2 = flEl.offsetTop + flEl.offsetHeight + 30; P.h3 = rmEl ? rmEl.offsetTop + rmEl.offsetHeight + 30 : P.h2;
    }
  }

  /* Die Welle wie LetterWave in der App, aber farblos: wo sie ist, hebt sich der Druck um bis zu 3,5 pt
     (bei 190 pt Seitenbreite) und wird fetter; darunter liegt blankes Papier, damit nichts doppelt steht */
  const tmp = document.createElement("canvas"), tctx = tmp.getContext("2d"), bb = document.createElement("canvas"), bctx = bb.getContext("2d");
  function drawWave(P, prog) {
    const c = P.wctx, W = P.wave.width, H = P.wave.height;
    if (prog <= .001 || prog >= .999) { if (!P.waveClear) { c.clearRect(0, 0, W, H); P.wave.style.opacity = 0; P.waveClear = true; } return; }
    c.clearRect(0, 0, W, H); P.wave.style.opacity = 1; P.waveClear = false;
    const k = H / (190 * 1697 / 1200), centre = -24 * k + prog * (H + 48 * k), band = H * .16, strips = 90, strip = H / strips;
    c.save(); c.beginPath(); c.rect(0, centre - band * .8, W, band * 1.6); c.clip(); c.drawImage(P.blank, 0, 0, W, H); c.restore();
    if (tmp.width !== W || tmp.height !== H) { tmp.width = bb.width = W; tmp.height = bb.height = H; }
    tctx.clearRect(0, 0, W, H); tctx.drawImage(P.print, 0, 0, W, H);
    const g = bctx.createLinearGradient(0, centre - band / 2, 0, centre + band / 2);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(.5, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
    bctx.globalCompositeOperation = "source-over"; bctx.clearRect(0, 0, W, H); bctx.drawImage(P.bold, 0, 0, W, H);
    bctx.globalCompositeOperation = "destination-in"; bctx.fillStyle = g; bctx.fillRect(0, 0, W, H); bctx.globalCompositeOperation = "source-over";
    tctx.drawImage(bb, 0, 0);
    for (let i = 0; i < strips; i++) {
      const mid = (i + .5) * strip; if (Math.abs(mid - centre) >= band * .8) continue;
      const dist = (mid - centre) / (band * .32), off = -3.5 * k * Math.exp(-dist * dist);
      c.drawImage(tmp, 0, i * strip, W, strip + .6, 0, i * strip + off, W, strip + .6);
    }
  }

  let geo = null;
  return {
    END,
    /* home: Mitte des vorderen Briefs (Fenster), k: Maßstab, folder(i): { x, top, y } eines Ordners */
    layout(g) {
      geo = g; fitNotes();
      /* Welle und Markierung so fein wie der Brief groß ist — am Rechner ist er größer als Maßstab 1 */
      const s = Math.max(1, g.k), w = Math.round(PW * dpr * s), h = Math.round(PH * dpr * s);
      for (const P of pieces) if (P.wave.width !== w) {
        P.wave.width = P.live.width = w; P.wave.height = P.live.height = h; P.liveKey = ""; P.waveClear = false;
      }
    },
    /* Wo und wie der Brief mit Rang r im Fächer liegt (Mitte, Drehung um seine Mitte, Breite): dahin
       fliegen die 3D-Briefe aus dem Hintergrund, bevor der Fächer übernimmt */
    restPose(r) {
      const [a, px, py] = poseAt(r), k = geo.k, x = geo.home.x + px * k, y = geo.home.y + py * k, rad = a * Math.PI / 180;
      return { x: x + k * PH / 2 * Math.sin(rad), y: y + k * PH / 2 * (1 - Math.cos(rad)), rot: a, w: PW * k };
    },
    render(t, show) {
      layer.style.visibility = show ? "visible" : "hidden";
      if (!geo) return;
      const k = geo.k;
      if (show) pieces.forEach((P, j) => {
        const T = times[j];
        let rank = 0; for (let i = 0; i < j; i++) rank += 1 - spring(t - times[i].tf, .6, 0);
        const [ang, px, py] = poseAt(rank);
        let x = geo.home.x + px * k, y = geo.home.y + py * k, rot = ang, sc = 1, op = 1;
        /* klein über seinen Ordner, dann hinein — dessen Oberkante schneidet ihn ab wie eine Tasche */
        const fo = geo.folder(P.f.f), pf = spring(t - T.tf, 1.5, 0), pe = spring(t - T.te, 1.1, 0);
        x = lerp(x, fo.x, pf); y = lerp(y, fo.top - 30, pf); rot = lerp(rot, 0, pf); sc = lerp(sc, .22 / k, pf);
        y = lerp(y, fo.y + 14, pe); sc = lerp(sc, .2 / k, pe);
        if (t > T.gone) op = 1 - clamp((t - T.gone) / .25);
        const s = sc * k, filing = t > T.tf;
        P.el.style.zIndex = filing ? 60 : 50 - Math.round(rank * 10);
        P.el.style.opacity = op.toFixed(3); P.el.style.visibility = op < .005 ? "hidden" : "";
        P.el.style.transform = `translate3d(${(x - PW / 2).toFixed(2)}px, ${(y - PH / 2).toFixed(2)}px, 0) scale(${s.toFixed(4)}) translateY(${PH / 2}px) rotate(${rot.toFixed(3)}deg) translateY(${-PH / 2}px)`;
        if (filing) { const cut = (fo.top - (y - PH * s / 2)) / s; P.el.style.clipPath = `polygon(-3000px -3000px, 3000px -3000px, 3000px ${cut.toFixed(1)}px, -3000px ${cut.toFixed(1)}px)`; }
        else if (P.el.style.clipPath) P.el.style.clipPath = "";
        /* die Welle, und wo sie vorbei ist, ist der Text markiert */
        const wp = bez((t - T.tw) / 1.1); drawWave(P, wp);
        const kH = PH / (190 * 1697 / 1200), front = wp >= .999 ? 2 : wp <= .001 ? -1 : (-24 * kH + wp * (PH + 48 * kH)) / PH;
        P.live.style.opacity = (.26 * (1 - easeOut((t - T.liveOut) / .3))).toFixed(3);
        const marks = P.bands.map(b => easeOut((front - (b.y + b.h) - .02) / .06)), key = marks.map(m => m.toFixed(2)).join();
        if (key !== P.liveKey) {
          P.liveKey = key; const c = P.lctx, sx = P.live.width / PW, sy = P.live.height / PH;
          c.clearRect(0, 0, P.live.width, P.live.height); c.fillStyle = MARK;
          P.bands.forEach((b, i) => { const m = marks[i]; if (m <= 0) return; c.beginPath(); c.roundRect((b.x * PW - 2.5) * sx, (b.y * PH - 2) * sy, (b.w * PW + 5) * m * sx, (b.h * PH + 4) * sy, 3 * sx); c.fill(); });
        }
        /* die Karte: Kopf, dann Zu tun und Fällig, dann die Erinnerung */
        const s1 = spring(t - T.n1, .45, 0), s2 = spring(t - T.n2, .5, 0), s3 = T.n3 != null ? spring(t - T.n3, .5, 0) : 0;
        Object.assign(P.note.style, { height: lerp(lerp(P.h1, P.h2, s2), P.h3, s3).toFixed(1) + "px", opacity: clamp(s1 * 1.4).toFixed(3), transform: `scale(${lerp(.94, 1, s1).toFixed(4)})`, visibility: t < T.n1 ? "hidden" : "" });
        const arr = t0 => easeOut((t - t0 - .12) / .3);
        P.parts[0].style.opacity = arr(T.n2).toFixed(3); if (P.parts[1]) P.parts[1].style.opacity = arr(T.n3).toFixed(3);
      });
      /* Ordner: während ein Brief hineingeht, treten die anderen zurück; seiner nimmt ihn, gibt nach,
         leuchtet in seiner Farbe auf und zählt hoch — damit man sieht: dort liegt er jetzt */
      let focus = -1, fw = 0;
      pieces.forEach((P, j) => { const T = times[j], w = easeInOut((t - T.tf) / .5) * (1 - easeInOut((t - T.filed - .7) / .5)); if (w > fw) { fw = w; focus = P.f.f; } });
      tiles.forEach((tile, i) => {
        let n = folders[i].n, sc = 1 + (i === focus ? .03 * fw : 0), dip = 0, roll = 1, glow = 0, ring = 1;
        pieces.forEach((P, j) => {
          if (P.f.f !== i) return; const dt = t - times[j].filed; if (dt < 0) return;
          n++; roll = Math.min(roll, easeOut(dt / .5));
          sc += .06 * (dt < .16 ? easeInOut(dt / .16) : 1 - spring(dt - .16, .6, .45));
          dip = 4 * (dt < .12 ? easeInOut(dt / .12) : 1 - spring(dt - .12, .55, .5));
          glow = Math.max(glow, dt < .2 ? easeOut(dt / .2) : Math.exp(-(dt - .2) / .6));
          ring = Math.min(ring, easeOut(dt / 1.1));
        });
        tile.style.transform = `translateY(${dip.toFixed(2)}px) scale(${sc.toFixed(4)})`;
        /* zurücktreten über filter: opacity gehört edgeFade (index.html), sonst überschrieben sich beide */
        const dim = focus >= 0 && i !== focus ? 1 - .55 * fw : 1, c = a => folders[i].c.replace(")", ` / ${a.toFixed(3)})`);
        const sh = glow > .01 ? `0 6px 10px rgba(0,0,0,.12), inset 0 0 0 1px rgba(255,255,255,${(.14 + .5 * glow).toFixed(3)}), 0 0 ${(30 * glow).toFixed(1)}px ${(6 * glow).toFixed(1)}px ${c(.8 * glow)}` : "";
        tile.style.boxShadow = sh;
        /* dazu eine Lichtwelle, die vom Ordner wegläuft — der Moment, in dem er ihn nimmt */
        tile.style.outline = ring < 1 ? `2px solid ${c(.75 * (1 - ring))}` : "";
        tile.style.outlineOffset = ring < 1 ? (2 + 18 * ring).toFixed(1) + "px" : "";
        tile.style.zIndex = glow > .01 ? 2 : "";
        tile.style.filter = [dim < .999 ? `opacity(${dim.toFixed(3)})` : "", glow > .01 ? `brightness(${(1 + .14 * glow).toFixed(3)})` : ""].join(" ").trim();
        const ct = tile.querySelector("[data-n]");
        if (ct.dataset.v !== String(n)) { ct.dataset.v = n; ct.innerHTML = n === folders[i].n ? `<i>${n} Briefe</i>` : `<i>${n - 1} Briefe</i><i>${n} Briefe</i>`; }
        const r = ct.children; if (r.length === 2) { r[0].style.transform = r[1].style.transform = `translateY(${(-14 * roll).toFixed(1)}px)`; r[0].style.opacity = (1 - roll).toFixed(3); }
      });
    }
  };
}
