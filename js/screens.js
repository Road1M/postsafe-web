/* Das iPhone: Apples Original-Produktbild (iPhone 18 Pro Max, Silber), unverändert.
   In seiner Bildschirmöffnung (1320 × 2868 Pixel bei 75/66) liegen echte Aufnahmen
   der App vom iPhone 18 Pro Max mit iOS 27, Pixel für Pixel. Gezeichnet wird nur,
   was auf dem Bildschirm steht: die Aufnahme, die Statuszeile und — wo die Geschichte
   es braucht — eine Mitteilung von iOS oder eine Markierung. Das Gerät selbst wird
   nie verändert.                                                                    */

const S = 3;                                   /* Pixel je Punkt */
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
export const BEZEL = { w: 1470, h: 3000, sx: 75, sy: 66, sw: 1320, sh: 2868 };
/* Gemalt in zwei Dritteln von Apples Bild: das iPhone ist auf der Seite nie breiter als rund
   400 Punkte, also 800 Pixel auf einem Retina-Bildschirm — mehr Pixel sieht niemand, sie
   kosteten nur Arbeitsspeicher. Die App-Aufnahmen in img/ liegen in genau dieser Größe vor
   (880 × 1912). */
const K = 2 / 3;

/* Ein Gerät als HTML: eine einzige Leinwand mit Bildschirm und Apples Rahmen darüber.
   Zwei getrennte Ebenen (Leinwand unter einem Bild) verrutschten im Browser um ein Pixel
   gegeneinander: links schien ein heller Strich durch, rechts verschwand ein Stück App
   unter dem Rahmen (Josef, 28.10.2026). In einer Leinwand können sie das nicht. */
export function mountDevice(el, base = "img/") {
  el.classList.add("device");
  el.innerHTML = `<canvas width="${Math.round(BEZEL.w * K)}" height="${Math.round(BEZEL.h * K)}" aria-hidden="true"></canvas>`;
  return createScreen(el.querySelector("canvas"), base);
}

export function createScreen(canvas, base = "img/") {
  /* Im großen Farbraum Display P3 zeichnen — so, wie die App ihre Ordnerfarben malt.
     Im kleinen sRGB-Raum würden sie blasser. */
  const ctx = canvas.getContext("2d", { colorSpace: "display-p3" }) || canvas.getContext("2d"), main = ctx, W = BEZEL.sw, H = BEZEL.sh;
  const k = canvas.width / BEZEL.w, Z = k;               /* Leinwand-Pixel je Pixel in Apples Bild (Z: in draw heißt k der Übergang) */
  const cache = {};
  /* look: die Farbe, in der die App gezeigt wird (setTheme); ein Bildschirm kann eine eigene verlangen
     (state.theme). theme: die Farbe des Bildschirms, der gerade steht. */
  let look = "hell", theme = look, state = { a: "scan", notif: 0, notifText: null, ring: null, theme: null }, last = "", wanted = [];
  const load = src => { const i = new Image(); i.src = base + src; i.onload = () => { last = ""; }; return i; };
  const icon = load("icon.png?v=3");
  const bezel = load("iphone-18-pro-max-silber.png?v=1");
  /* Die Form des Bildschirms, aus Apples Bild gerechnet und 3 Pixel unter den Rahmen geweitet */
  const mask = load("maske-18-pro-max.png?v=1");

  function img(name, t = theme) {
    const key = name + "-" + t;
    /* Aufnahmen der App 1.0.1 (12) vom 28.10.2026 als JPEG in Display P3 */
    if (!cache[key]) { const i = new Image(); i.decoding = "async"; i.src = base + key + ".jpg?v=7"; i.onload = () => { last = ""; }; cache[key] = i; }
    return cache[key];
  }
  const ok = i => i && i.complete && i.naturalWidth;

  /* Die Statuszeile von iOS 27 auf dem iPhone 18 Pro Max, vermessen am Simulator (in Punkten) */
  function statusBar(light, ctx = main) {
    const c = light ? "#fff" : "#000";
    ctx.save(); ctx.fillStyle = c; ctx.strokeStyle = c;
    ctx.font = `600 ${19.5 * S}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText("09:41", 90.5 * S, 39 * S);
    [33.3, 31, 28.3, 25.3].forEach((top, i) => { ctx.beginPath(); ctx.roundRect((302 + i * 6.2) * S, top * S, 3.6 * S, (40 - top) * S, 1.8 * S); ctx.fill(); });
    ctx.translate(342.7 * S, 39.6 * S); ctx.lineCap = "round"; ctx.lineWidth = 2.2 * S;
    for (const r of [8.6, 13.6]) { ctx.beginPath(); ctx.arc(0, 0, r * S, -Math.PI * .74, -Math.PI * .26); ctx.stroke(); }
    ctx.lineJoin = "round"; ctx.lineWidth = .9 * S; ctx.beginPath(); ctx.moveTo(0, -.4 * S); ctx.arc(0, -.4 * S, 4.1 * S, -Math.PI * .75, -Math.PI * .25); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.translate(-342.7 * S, -39.6 * S);
    ctx.beginPath(); ctx.roundRect(361.7 * S, 24.7 * S, 29.3 * S, 14.6 * S, 4.2 * S); ctx.fill();
    ctx.beginPath(); ctx.roundRect(391.8 * S, 29.7 * S, 2 * S, 4.8 * S, [0, 1 * S, 1 * S, 0]); ctx.fill();
    ctx.restore();
  }

  /* Die Mitteilung ist Liquid Glass, gerechnet wie die auf Josefs App-Store-Bild 4
     (design/store/bilder/werkzeug/fluessigglas.py): innen flach, der Hintergrund leicht
     weichgezeichnet und getönt; im gewölbten Rand verschiebt die Steigung der Oberfläche,
     woher das Glas den Hintergrund holt, nach außen — die Kante des Briefs dahinter biegt
     sich zum Rand hin, Rot und Blau leicht verschieden (feiner Farbsaum); an der Kante
     eine Lichtkante, am hellsten, wo sie zum Licht oben links zeigt oder davon weg.
     Gerechnet in den Pixeln der Leinwand; Maße des Store-Bilds (3 px/pt) mal G. */
  const NOTE = { x: 10, y: 56, w: W / S - 20, h: 84, r: 26, from: -96 };     /* in Punkten */
  const G = k * S / 3;                                                          /* Leinwand-Pixel je Store-Pixel */
  const RIM = 66 * G, LENS = 112 * G, REACH = Math.ceil(RIM + LENS + 8), LIGHT = [-.55, -.83];
  const P3 = { colorSpace: "display-p3" };
  const pw = Math.round(NOTE.w * S * k), ph = Math.round(NOTE.h * S * k), pr = NOTE.r * S * k;
  let lens = null, glassSrc = {}, glassOut = null, glassKey = "", job = null;
  /* Vorbereitet wird stückweise in freien Augenblicken (je höchstens 4 ms), bevor die Mitteilung
     kommt — so ruckelt nichts. Kommt sie früher, wird der Rest sofort gerechnet. */
  function* surface() {                      /* einmal: Rand, Verschiebung, Tönung und Lichtkante je Pixel */
    const n = pw * ph, a = new Float32Array(n), dx = new Float32Array(n), dy = new Float32Array(n), rim = new Float32Array(n), spec = new Float32Array(n);
    const cx = pw / 2, cy = ph / 2, hx = cx - pr, hy = cy - pr;
    for (let j = 0; j < ph; j++, yield) for (let i = 0; i < pw; i++) {
      const x = i + .5 - cx, y = j + .5 - cy, qx = Math.abs(x) - hx, qy = Math.abs(y) - hy;
      let sd, nx, ny;
      if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy); sd = l - pr; nx = qx / l; ny = qy / l; }
      else if (qx > qy) { sd = qx - pr; nx = 1; ny = 0; } else { sd = qy - pr; nx = 0; ny = 1; }
      nx *= Math.sign(x) || 1; ny *= Math.sign(y) || 1;
      const d = -sd, p = j * pw + i; a[p] = Math.min(Math.max(d + .5, 0), 1); if (a[p] <= 0) continue;
      const t = Math.max(0, 1 - d / RIM), slope = t / Math.sqrt(Math.max(1 - t * t, .0025)), disp = LENS * Math.min(slope, 4) / 4;
      const face = Math.abs(nx * LIGHT[0] + ny * LIGHT[1]), ds = d / G;
      dx[p] = nx * disp; dy[p] = ny * disp; rim[p] = t;
      spec[p] = Math.max(0, 1 - ds / 3) * (.3 + .7 * face * face) * .85 + Math.pow(Math.max(0, 1 - ds / 10), 2) * Math.pow(face, 4) * .35;
    }
    lens = { a, dx, dy, rim, spec };
  }
  function* backdrop(name, key) {            /* was hinter dem Glas liegt, weichgezeichnet (einmal je Bildschirm) */
    const i = img(name), cw = Math.round(W * k), ch = Math.ceil((NOTE.y + NOTE.h) * S * k) + REACH + 4;
    const off = document.createElement("canvas"); off.width = cw; off.height = ch;
    const c = off.getContext("2d", P3) || off.getContext("2d"); c.scale(k, k);
    c.fillStyle = theme === "dunkel" ? "#0F0F0F" : "#FFFFFF"; c.fillRect(0, 0, W, ch / k); c.drawImage(i, 0, 0, W, H); statusBar(theme === "dunkel", c);
    yield;
    let d; try { d = c.getImageData(0, 0, cw, ch, P3).data; } catch (e) { d = c.getImageData(0, 0, cw, ch).data; }
    yield;
    const f = new Float32Array(cw * ch * 3);
    for (let p = 0, q = 0; p < d.length; p += 4, q += 3) { f[q] = d[p]; f[q + 1] = d[p + 1]; f[q + 2] = d[p + 2]; }
    /* drei Kastenfilter je Richtung ≈ Gauß mit 4,5 px: Mitteilungen sind „regular“ Glas, die Schrift bleibt lesbar */
    for (let pass = 0; pass < 3; pass++) { yield* blur(f, cw, ch, 4, 1, cw); yield* blur(f, ch, cw, 4, cw, 1); }
    glassSrc[key] = { f, cw, ch };
  }
  function* blur(f, len, lines, r, step, stride) {
    const row = new Float32Array(len * 3), n = 2 * r + 1;
    for (let l = 0; l < lines; l++, yield) {
      const base = l * stride;
      for (let i = 0; i < len; i++) { const q = (base + i * step) * 3; row[i * 3] = f[q]; row[i * 3 + 1] = f[q + 1]; row[i * 3 + 2] = f[q + 2]; }
      for (let ch = 0; ch < 3; ch++) {
        let s = 0; for (let i = -r; i <= r; i++) s += row[Math.min(Math.max(i, 0), len - 1) * 3 + ch];
        for (let i = 0; i < len; i++) {
          f[(base + i * step) * 3 + ch] = s / n;
          s += row[Math.min(i + r + 1, len - 1) * 3 + ch] - row[Math.max(i - r, 0) * 3 + ch];
        }
      }
    }
  }
  function prepare(name, now) {              /* gibt true, sobald Glas für diesen Bildschirm bereitliegt */
    const key = name + "-" + theme;
    if (lens && glassSrc[key]) return true;
    if (!ok(img(name))) return false;
    if (!job || job.key !== key) {
      job = { key, it: (function* () { if (!lens) yield* surface(); if (!glassSrc[key]) yield* backdrop(name, key); })() };
      const pump = () => { if (!job || job.done) return; const t = performance.now(); while (performance.now() - t < 4) if (job.it.next().done) { job.done = true; return; } setTimeout(pump, 16); };
      setTimeout(pump, 0);
    }
    if (now) { while (!job.it.next().done); job.done = true; }   /* jetzt gebraucht: den Rest sofort */
    return !!(lens && glassSrc[key]);
  }
  function glass(name, gx, gy) {             /* die Glasfläche an ihrer Stelle (in Leinwand-Pixeln) */
    const key = [name, theme, gx, gy].join(); if (glassKey === key) return glassOut;
    if (!prepare(name, true)) return null;
    const { f, cw, ch } = glassSrc[name + "-" + theme], dark = theme === "dunkel";
    const out = glassOut || document.createElement("canvas"); out.width = pw; out.height = ph;
    const c = out.getContext("2d", P3) || out.getContext("2d");
    let im; try { im = c.createImageData(pw, ph, P3); } catch (e) { im = c.createImageData(pw, ph); }
    const o = im.data, X = cw - 1.001, Y = ch - 1.001;
    const at = (x, y, chn) => {
      x = Math.min(Math.max(x, 0), X); y = Math.min(Math.max(y, 0), Y);
      const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, q = (y0 * cw + x0) * 3 + chn, q2 = q + cw * 3;
      return (f[q] * (1 - fx) + f[q + 3] * fx) * (1 - fy) + (f[q2] * (1 - fx) + f[q2 + 3] * fx) * fy;
    };
    /* Hell: weiß getönt wie Bild 4. Dunkel: dunkel getönt, damit die weiße Schrift auch über dem
       weißen Brief lesbar bleibt — zum Rand hin klarer, damit man die Brechung sieht. */
    for (let j = 0, p = 0; j < ph; j++) for (let i = 0; i < pw; i++, p++) {
      const al = lens.a[p]; if (al <= 0) continue;
      const sx = gx + i + .5, sy = gy + j + .5, ddx = lens.dx[p], ddy = lens.dy[p], t = lens.rim[p];
      let r = at(sx + ddx * 1.03, sy + ddy * 1.03, 0), g = at(sx + ddx, sy + ddy, 1), b = at(sx + ddx * .97, sy + ddy * .97, 2);
      if (dark) { const kd = .64 * (1 - .45 * t * t), w = .12 * t * t * t; r = r * (1 - kd) + 24 * kd; g = g * (1 - kd) + 24 * kd; b = b * (1 - kd) + 26 * kd; r += (255 - r) * w; g += (255 - g) * w; b += (255 - b) * w; }
      else { const kl = .24 + .2 * t * t * t; r += (255 - r) * kl; g += (255 - g) * kl; b += (255 - b) * kl; }
      const sp = lens.spec[p] * (dark ? .7 : 1); r += (255 - r) * sp; g += (255 - g) * sp; b += (255 - b) * sp;
      const q = p * 4; o[q] = r; o[q + 1] = g; o[q + 2] = b; o[q + 3] = al * 255;
    }
    c.putImageData(im, 0, 0); glassOut = out; glassKey = key; return out;
  }

  function notification(v, text, under) {
    if (v <= 0) return;
    const yPt = NOTE.from + (NOTE.y - NOTE.from) * v, gx = Math.round(NOTE.x * S * k), gy = Math.round(yPt * S * k);
    const x = gx / k, y = gy / k, w = pw / k, h = ph / k, dark = theme === "dunkel";
    const g = glass(under, gx, gy); if (!g) return;
    ctx.save(); ctx.globalAlpha = Math.min(1, Math.max(0, v) * 1.4);
    ctx.shadowColor = dark ? "rgba(0,0,0,.35)" : "rgba(0,0,0,.14)"; ctx.shadowBlur = 30 * S * v; ctx.shadowOffsetY = 8 * S * v;
    ctx.drawImage(g, x, y, w, h); ctx.shadowColor = "transparent";
    ctx.save(); ctx.beginPath(); ctx.roundRect(x + 14 * S, y + 22 * S, 40 * S, 40 * S, 9.5 * S); ctx.clip();
    if (ok(icon)) ctx.drawImage(icon, x + 14 * S, y + 22 * S, 40 * S, 40 * S); ctx.restore();
    const ink = dark ? "#fff" : "#000", ink2 = dark ? "rgba(235,235,245,.6)" : "rgba(60,60,67,.6)";
    ctx.textBaseline = "alphabetic"; ctx.fillStyle = ink; ctx.font = `600 ${15 * S}px ${FONT}`; ctx.fillText(text.title, x + 66 * S, y + 28 * S);
    ctx.fillStyle = ink2; ctx.font = `400 ${13 * S}px ${FONT}`; ctx.textAlign = "right"; ctx.fillText("jetzt", x + w - 16 * S, y + 28 * S); ctx.textAlign = "left";
    ctx.fillStyle = ink; ctx.font = `400 ${15 * S}px ${FONT}`; ctx.fillText(text.l1, x + 66 * S, y + 48 * S); if (text.l2) ctx.fillText(text.l2, x + 66 * S, y + 68 * S);
    ctx.restore();
  }

  /* Übergänge wie in iOS: ein neuer Bildschirm schiebt sich von rechts herein
     (zurück: nach rechts hinaus), ein Tab-Wechsel blendet weich über. */
  const ORDER = ["scan", "archiv", "brief", "suche0", "suche1", "einst", "du", "web", "anfrage"];
  const KIND = { brief: "push", web: "push" };
  let cur = state.a, prev = null, prevT = theme, t0 = -1e9, kind = "fade", dir = 1, notifOn = false, nT0 = -1e9, nText = null, nUnder = null, drawn = false;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const back = t => { const c = 1.25; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  function frameOf(name, t, x = 0, alpha = 1, dim = 0) {
    const i = img(name, t); if (!ok(i)) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(i, x, 0, W, H);
    if (dim > 0) { ctx.fillStyle = `rgba(0,0,0,${dim})`; ctx.fillRect(x, 0, W, H); }
    ctx.restore();
  }
  function draw(now = performance.now()) {
    const want = state.theme || look;
    if (!drawn) { cur = state.a; theme = want; }                            /* das erste Bild ohne Übergang */
    else if (state.a !== cur || want !== theme) {                            /* neuer Bildschirm oder neue Farbe: weich hinüber */
      prev = cur; prevT = theme; cur = state.a; theme = want; t0 = now;
      kind = prev === cur ? "fade" : KIND[cur] || KIND[prev] || "fade"; dir = ORDER.indexOf(cur) >= ORDER.indexOf(prev) ? 1 : -1;
    }
    const on = state.notif > .5 && !!state.notifText;
    if (on !== notifOn) { notifOn = on; nT0 = now; if (on) { nText = state.notifText; nUnder = cur; } }
    const k = Math.min(1, (now - t0) / (kind === "push" ? 560 : 420)), e = ease(k);
    const nk = Math.min(1, (now - nT0) / 700), nv = notifOn ? back(nk) : 1 - ease(nk);
    const busy = k < 1 || nk < 1 || (state.ring && state.ring.k > 0);
    if (state.notifText && !notifOn && k >= 1) prepare(cur);              /* die Mitteilung kommt hier gleich */
    const key = JSON.stringify([cur, state.ring, notifOn]) + theme;
    const ready = ok(img(cur)) && (!prev || k >= 1 || ok(img(prev, prevT)));
    if (!ready || !ok(bezel) || (!busy && key === last)) return false;
    last = key; drawn = true;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.setTransform(Z, 0, 0, Z, BEZEL.sx * Z, BEZEL.sy * Z);          /* ab hier in Pixeln des Bildschirms */
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    ctx.fillStyle = theme === "dunkel" ? "#0F0F0F" : "#FFFFFF"; ctx.fillRect(0, 0, W, H);   /* der Grund der App (canvasBase) */
    if (k >= 1 || !prev) frameOf(cur, theme);
    else if (kind === "push") {
      if (dir > 0) { frameOf(prev, prevT, -W * .3 * e, 1, .14 * e); ctx.save(); ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = 40 * k; frameOf(cur, theme, W * (1 - e)); ctx.restore(); }
      else { frameOf(cur, theme, -W * .3 * (1 - e), 1, .14 * (1 - e)); frameOf(prev, prevT, W * e); }
    } else {
      frameOf(prev, prevT); ctx.save(); ctx.globalAlpha = e; const sc = .985 + .015 * e;
      ctx.translate(W / 2, H / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2); frameOf(cur, theme); ctx.restore();
    }
    statusBar(theme === "dunkel");
    if (nText && nv > .001) notification(Math.max(0, nv), nText, nUnder);
    if (state.ring && state.ring.k > 0) {
      const r = state.ring; ctx.save(); ctx.globalAlpha = r.k * (k >= 1 ? 1 : e); ctx.strokeStyle = "color(display-p3 0 .4157 1)";   /* das Blau der App */ ctx.lineWidth = 3.5 * S;
      ctx.shadowColor = "color(display-p3 0 .4157 1 / .5)"; ctx.shadowBlur = 16 * S * k;
      ctx.beginPath(); ctx.roundRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12, r.r + 6); ctx.stroke(); ctx.restore();
    }
    if (ok(mask)) { ctx.globalCompositeOperation = "destination-in"; ctx.drawImage(mask, 0, 0, W, H); }
    ctx.restore();
    ctx.drawImage(bezel, 0, 0, canvas.width, canvas.height);                       /* Apples Rahmen, unverändert, obenauf */
    return true;
  }

  return {
    set(s) { Object.assign(state, s); },
    setTheme(t) { if (t !== look) { look = t; last = ""; wanted.forEach(n => img(n, t)); } },
    preload(names, t) { if (t) names.forEach(n => img(n, t)); else { wanted = names; names.forEach(n => img(n, look)); } },
    draw
  };
}
