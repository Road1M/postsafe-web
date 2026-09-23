/* Das iPhone: Apples Original-Produktbild (iPhone 18 Pro, Silber), unverändert.
   In seiner Bildschirmöffnung (1206 × 2622 Pixel bei 72/69) liegen echte
   Aufnahmen der App. Gezeichnet wird nur, was auf dem Bildschirm steht: die
   Aufnahme, die Statuszeile und — wo die Geschichte es braucht — eine Mitteilung
   von iOS oder eine Markierung. Das Gerät selbst wird nie verändert.         */

const S = 3;                                   /* Pixel je Punkt */
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
export const BEZEL = { w: 1350, h: 2760, sx: 72, sy: 69, sw: 1206, sh: 2622 };

/* Ein Gerät als HTML: Bildschirm-Canvas unter dem Apple-Bild */
export function mountDevice(el, base = "img/") {
  el.classList.add("device");
  el.innerHTML = `<canvas width="${BEZEL.sw}" height="${BEZEL.sh}" aria-hidden="true"></canvas><img src="${base}iphone-18-pro-silber.png" alt="" draggable="false">`;
  return createScreen(el.querySelector("canvas"), base);
}

export function createScreen(canvas, base = "img/") {
  /* Im großen Farbraum Display P3 zeichnen — so, wie die App ihre Ordnerfarben malt.
     Im kleinen sRGB-Raum würden sie blasser. */
  const ctx = canvas.getContext("2d", { colorSpace: "display-p3" }) || canvas.getContext("2d"), W = canvas.width, H = canvas.height;
  const cache = {};
  let theme = "hell", state = { a: "scan", notif: 0, notifText: null, ring: null }, last = "";
  const icon = new Image(); icon.src = base + "icon.png"; icon.onload = () => { last = ""; };
  /* Die Form des Bildschirms, pixelgenau aus Apples Bild gerechnet */
  const mask = new Image(); mask.src = base + "screen-mask.png"; mask.onload = () => { last = ""; };

  function img(name) {
    const key = name + "-" + theme;
    if (!cache[key]) { const i = new Image(); i.decoding = "async"; i.src = base + key + ".webp"; i.onload = () => { last = ""; }; cache[key] = i; }
    return cache[key];
  }
  const ok = i => i && i.complete && i.naturalWidth;

  function statusBar(light) {
    const c = light ? "#fff" : "#000";
    ctx.fillStyle = c; ctx.font = `600 ${17 * S}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("9:41", 68 * S, 30 * S); ctx.textAlign = "left";
    for (let i = 0; i < 4; i++) { const h = (4 + i * 2.6) * S; ctx.beginPath(); ctx.roundRect((306 + i * 5) * S, 35 * S - h, 3.2 * S, h, 1 * S); ctx.fill(); }
    ctx.save(); ctx.translate(335 * S, 35 * S); ctx.strokeStyle = c; ctx.lineWidth = 2 * S; ctx.lineCap = "round";
    for (let r = 1; r <= 3; r++) { ctx.beginPath(); ctx.arc(0, 0, r * 3.6 * S, -Math.PI * .78, -Math.PI * .22); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, -.3 * S, 1.3 * S, 0, 7); ctx.fill(); ctx.restore();
    ctx.globalAlpha = .4; ctx.lineWidth = 1 * S; ctx.strokeStyle = c; ctx.beginPath(); ctx.roundRect(349 * S, 24.5 * S, 25 * S, 12 * S, 3.8 * S); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(375.4 * S, 28.5 * S, 1.6 * S, 4 * S, 1 * S); ctx.fill(); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.roundRect(351 * S, 26.5 * S, 21 * S, 8 * S, 2.3 * S); ctx.fill();
  }

  function notification(k, text) {
    if (k <= 0) return;
    const y = (-90 + 146 * k) * S, x = 10 * S, w = 382 * S, h = 78 * S, dark = theme === "dunkel";
    ctx.save(); ctx.globalAlpha = Math.min(1, Math.max(0, k) * 1.4);
    ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = 30 * S; ctx.shadowOffsetY = 8 * S;
    ctx.fillStyle = dark ? "rgba(44,44,46,.97)" : "rgba(246,246,248,.98)";
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 26 * S); ctx.fill(); ctx.shadowColor = "transparent";
    ctx.save(); ctx.beginPath(); ctx.roundRect(x + 14 * S, y + 19 * S, 40 * S, 40 * S, 9.5 * S); ctx.clip();
    if (ok(icon)) ctx.drawImage(icon, x + 14 * S, y + 19 * S, 40 * S, 40 * S); ctx.restore();
    const ink = dark ? "#fff" : "#000", ink2 = dark ? "rgba(235,235,245,.6)" : "rgba(60,60,67,.6)";
    ctx.textBaseline = "alphabetic"; ctx.fillStyle = ink; ctx.font = `600 ${15 * S}px ${FONT}`; ctx.fillText(text.title, x + 66 * S, y + 32 * S);
    ctx.fillStyle = ink2; ctx.font = `400 ${13 * S}px ${FONT}`; ctx.textAlign = "right"; ctx.fillText("jetzt", x + w - 16 * S, y + 32 * S); ctx.textAlign = "left";
    ctx.fillStyle = ink; ctx.font = `400 ${15 * S}px ${FONT}`; ctx.fillText(text.l1, x + 66 * S, y + 51 * S); if (text.l2) ctx.fillText(text.l2, x + 66 * S, y + 69 * S);
    ctx.restore();
  }

  /* Übergänge wie in iOS: ein neuer Bildschirm schiebt sich von rechts herein
     (zurück: nach rechts hinaus), ein Tab-Wechsel blendet weich über. */
  const ORDER = ["scan", "archiv", "brief", "suche0", "suche1", "einst", "web"];
  const KIND = { brief: "push", web: "push" };
  let cur = state.a, prev = null, t0 = -1e9, kind = "fade", dir = 1, notifOn = false, nT0 = -1e9;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const back = t => { const c = 1.25; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  function frameOf(name, x = 0, alpha = 1, dim = 0) {
    const i = img(name); if (!ok(i)) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(i, x, 0, W, H);
    if (dim > 0) { ctx.fillStyle = `rgba(0,0,0,${dim})`; ctx.fillRect(x, 0, W, H); }
    ctx.restore();
  }
  function draw(now = performance.now()) {
    if (state.a !== cur) {
      prev = cur; cur = state.a; t0 = now;
      const k = KIND[cur] || KIND[prev] || "fade";
      kind = k; dir = ORDER.indexOf(cur) >= ORDER.indexOf(prev) ? 1 : -1;
    }
    const on = state.notif > .5; if (on !== notifOn) { notifOn = on; nT0 = now; }
    const k = Math.min(1, (now - t0) / (kind === "push" ? 560 : 420)), e = ease(k);
    const nk = Math.min(1, (now - nT0) / 700), nv = notifOn ? back(nk) : 1 - ease(nk);
    const busy = k < 1 || nk < 1 || (state.ring && state.ring.k > 0);
    const key = JSON.stringify([cur, state.ring, notifOn]) + theme;
    const ready = ok(img(cur)) && (!prev || k >= 1 || ok(img(prev)));
    if (!ready || (!busy && key === last)) return false;
    last = key;
    ctx.fillStyle = theme === "dunkel" ? "#000" : "#F2F2F0"; ctx.fillRect(0, 0, W, H);
    if (k >= 1 || !prev) frameOf(cur);
    else if (kind === "push") {
      if (dir > 0) { frameOf(prev, -W * .3 * e, 1, .14 * e); ctx.save(); ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = 40; frameOf(cur, W * (1 - e)); ctx.restore(); }
      else { frameOf(cur, -W * .3 * (1 - e), 1, .14 * (1 - e)); frameOf(prev, W * e); }
    } else {
      frameOf(prev); ctx.save(); ctx.globalAlpha = e; const sc = .985 + .015 * e;
      ctx.translate(W / 2, H / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2); frameOf(cur); ctx.restore();
    }
    statusBar(theme === "dunkel");
    if (state.notifText && nv > .001) notification(Math.max(0, nv), state.notifText);
    if (state.ring && state.ring.k > 0) {
      const r = state.ring; ctx.save(); ctx.globalAlpha = r.k * (k >= 1 ? 1 : e); ctx.strokeStyle = "#0A84FF"; ctx.lineWidth = 3.5 * S;
      ctx.shadowColor = "rgba(10,132,255,.5)"; ctx.shadowBlur = 16 * S;
      ctx.beginPath(); ctx.roundRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12, r.r + 6); ctx.stroke(); ctx.restore();
    }
    if (ok(mask)) { ctx.save(); ctx.globalCompositeOperation = "destination-in"; ctx.drawImage(mask, 0, 0, W, H); ctx.restore(); }
    return true;
  }

  return {
    set(s) { Object.assign(state, s); },
    setTheme(t) { if (t !== theme) { theme = t; last = ""; } },
    preload(names) { names.forEach(img); },
    draw
  };
}
