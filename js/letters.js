/* PostSafe — echte Briefe auf Papier, gezeichnet nach DIN 5008.

   Alle Namen, Anschriften, Nummern und Beträge sind erfunden. Sie entsprechen
   den Beispielbriefen, mit denen die App-Aufnahmen auf dieser Seite entstanden
   sind — derselbe Brief, der hier durchs Bild fliegt, liegt danach im iPhone. */

const PX = 4;                                  /* Pixel je Millimeter — scharf genug für den nahen Scan, ein Drittel weniger Speicher als 5 */
const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

function day(offset) {
  /* Fester Stichtag: derselbe Tag, an dem die App-Bildschirme dieser Seite aufgenommen sind —
     sonst liefen Briefe und iPhone mit jedem Tag weiter auseinander. */
  const d = new Date(2026, 8, 23, 9); d.setDate(d.getDate() + offset);
  return d;
}
const dmy = d => String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear();

const TO = ["Frau", "Josefine Berger", "Lindenweg 12", "12345 Musterstadt"];

export const LETTERS = [
  {
    from: "Stadtwerke", legal: "Stadtwerke GmbH", addr: "Am Werk 3 · 12340 Musterstadt", mark: "werk", tint: "#F5A300",
    ref: [["Vertragskonto", "4711 22 883"], ["Rechnung", "RE-2026-0084217"], ["Datum", dmy(day(-9))]],
    subject: "Ihre Jahresabrechnung Strom 2025",
    body: [
      "Sehr geehrte Frau Berger,",
      "",
      "anbei erhalten Sie die Abrechnung für den Zeitraum 01.07.2025 bis 30.06.2026. Ihr Verbrauch lag bei 2.418 kWh und damit 6 % über dem Vorjahr.",
      "",
      "Nach Verrechnung der geleisteten Abschläge ergibt sich eine Nachzahlung von 84,20 EUR.",
      "",
      `Bitte überweisen Sie den Betrag bis zum ${dmy(day(7))}.`,
      "",
      "Ihr neuer monatlicher Abschlag beträgt ab dem 01.10.2026 71,00 EUR.",
    ],
    sign: "Kundenservice", folder: "Wohnen"
  },
  {
    from: "Finanzamt", legal: "Finanzamt Musterstadt", addr: "Postfach 20 04 21 · 12340 Musterstadt", mark: "amt", tint: "#1B1B1F",
    ref: [["Steuernummer", "143/218/40917"], ["Datum", dmy(day(-7))]],
    subject: "Bescheid für 2025 über Einkommensteuer und Solidaritätszuschlag",
    body: [
      "Sehr geehrte Frau Berger,",
      "",
      "für den Veranlagungszeitraum 2025 ergibt sich nach Anrechnung der geleisteten Vorauszahlungen eine Nachzahlung in Höhe von 1.284,00 EUR.",
      "",
      `Der Betrag ist bis zum ${dmy(day(5))} auf das unten genannte Konto der Finanzkasse zu überweisen. Bitte geben Sie den Verwendungszweck vollständig an.`,
      "",
      "Gegen diesen Bescheid kann innerhalb eines Monats nach Bekanntgabe Einspruch eingelegt werden.",
    ],
    sign: "Ihr Finanzamt", folder: "Behörde"
  },
  {
    from: "Krankenkasse", legal: "Krankenkasse Musterstadt", addr: "Gesundheitsweg 28 · 12341 Musterstadt", mark: "kasse", tint: "#0E9F6E",
    ref: [["Mitgliedsnummer", "6841 552 903"], ["Datum", dmy(day(-4))]],
    subject: "Ihr Beitrag zur Kranken- und Pflegeversicherung",
    body: [
      "Sehr geehrte Frau Berger,",
      "",
      "zum 01.09.2026 ändert sich Ihr monatlicher Beitrag zur Kranken- und Pflegeversicherung. Der neue Gesamtbeitrag beträgt 412,60 EUR.",
      "",
      "Die Abbuchung erfolgt weiterhin zum Monatsende von dem uns vorliegenden SEPA-Lastschriftmandat.",
    ],
    sign: "Ihre Krankenkasse", folder: "Gesundheit"
  },
  {
    from: "Hausverwaltung", legal: "Lindner & Partner Hausverwaltung GmbH", addr: "Marktplatz 7 · 12345 Musterstadt", mark: "haus", tint: "#7A4B2A",
    ref: [["Objekt", "OBJ-2214-14"], ["Wohnung", "14"], ["Datum", dmy(day(-3))]],
    subject: "Betriebskostenabrechnung 2025",
    body: [
      "Sehr geehrte Frau Berger,",
      "",
      "mit diesem Schreiben erhalten Sie die Abrechnung der Betriebskosten für das Kalenderjahr 2025.",
      "",
      "Aus der Abrechnung ergibt sich eine Nachforderung von 312,45 EUR.",
      "",
      `Bitte überweisen Sie den Betrag bis zum ${dmy(day(25))} auf unser Konto.`,
    ],
    sign: "Lindner & Partner", folder: "Wohnen"
  },
  {
    from: "Kfz-Versicherung", legal: "Kfz-Versicherung AG", addr: "Ring 40 · 12342 Musterstadt", mark: "schild", tint: "#1E5CF0",
    ref: [["Vertrag", "KF 55 012 884"], ["Datum", dmy(day(-12))]],
    subject: "Beitragsrechnung 2027",
    body: [
      "Sehr geehrte Frau Berger,",
      "",
      "für Ihre Kfz-Haftpflicht- und Teilkaskoversicherung berechnen wir für das Jahr 2027 einen Beitrag von 486,90 EUR. Eine Kündigung ist bis zum 30.11.2026 möglich.",
      "",
      "Der Beitrag wird zum 01.01.2027 von Ihrem Konto abgebucht.",
    ],
    sign: "Ihre Kfz-Versicherung", folder: "Auto"
  },
  {
    from: "Hausbank", legal: "Hausbank eG", addr: "Bankplatz 1 · 12345 Musterstadt", mark: "bank", tint: "#16325C",
    ref: [["Kontonummer", "0123 4567 89"], ["Datum", dmy(day(-5))]],
    subject: "Änderung der Kontoführungsentgelte",
    body: [
      "Sehr geehrte Frau Berger,",
      "",
      "zum 01.10.2026 passen wir die Entgelte für die Kontoführung an. Die neue Übersicht finden Sie in der Anlage.",
      "",
      "Wenn Sie nicht einverstanden sind, können Sie bis zum Inkrafttreten widersprechen.",
    ],
    sign: "Ihre Hausbank", folder: "Bank"
  },
  {
    from: "Landratsamt", legal: "Landratsamt Musterstadt", addr: "Rathausplatz 2 · 12340 Musterstadt", mark: "amt", tint: "#2B3A55",
    ref: [["Aktenzeichen", "WG-2026-11873"], ["Datum", dmy(day(-3))]],
    subject: "Bescheid über Wohngeld",
    body: ["Sehr geehrte Frau Berger,", "", "über Ihren Antrag auf Wohngeld vom 12.08.2026 wird wie folgt entschieden: Der Antrag wird teilweise abgelehnt.", "", "Gegen diesen Bescheid kann innerhalb eines Monats nach Bekanntgabe Widerspruch erhoben werden."],
    sign: "Ihr Landratsamt", folder: "Behörde"
  },
  {
    from: "Mobilfunk", legal: "Mobilfunk GmbH", addr: "Postfach 11 22 · 12342 Musterstadt", mark: "werk", tint: "#6B2BD9",
    ref: [["Kundennummer", "5500 1234 77"], ["Datum", dmy(day(-14))]],
    subject: "Ihre Rechnung August 2026",
    body: ["Sehr geehrte Frau Berger,", "", "Ihre Rechnung für Juli 2026 beträgt 49,95 EUR. Der Betrag wird per Lastschrift von Ihrem Konto eingezogen.", "", "Sie müssen nichts weiter tun."],
    sign: "Ihr Kundenservice", folder: "Rechnungen"
  },
  {
    from: "Rentenversicherung", legal: "Rentenversicherung", addr: "Rentenweg 1 · 12340 Musterstadt", mark: "amt", tint: "#3C5078",
    ref: [["Versicherungsnummer", "12 150780 B 123"], ["Datum", dmy(day(-30))]],
    subject: "Ihre Renteninformation 2026",
    body: ["Sehr geehrte Frau Berger,", "", "mit dieser Renteninformation erhalten Sie einen Überblick über Ihre bisher erworbenen Anwartschaften.", "", "Diese Information ist kein Bescheid. Eine Reaktion Ihrerseits ist nicht erforderlich."],
    sign: "Ihre Rentenversicherung", folder: "Rente"
  }
];

/* ---------------------------------------------------------- Papier ---- */
function paper(ctx, w, h, base) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {                     /* Papierkorn */
    const n = (Math.random() - .5) * 7;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "rgba(255,255,255,.0)"); g.addColorStop(1, "rgba(120,110,95,.07)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(0,0,0,.10)"; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
}

function wrap(ctx, text, maxW) {
  const words = text.split(" "), lines = []; let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function logo(ctx, kind, x, y, s, tint) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = tint; ctx.strokeStyle = tint;
  ctx.lineWidth = s * .12; ctx.lineJoin = "round"; ctx.lineCap = "round";
  switch (kind) {
    case "werk": ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(s * .56, s * .14); ctx.lineTo(s * .3, s * .56); ctx.lineTo(s * .5, s * .56); ctx.lineTo(s * .42, s * .88); ctx.lineTo(s * .72, s * .42); ctx.lineTo(s * .52, s * .42); ctx.closePath(); ctx.fill(); break;
    case "amt": ctx.fillRect(0, 0, s * .12, s); ctx.fillRect(s * .2, 0, s * .12, s); ctx.fillRect(s * .4, 0, s * .12, s); break;
    case "kasse": ctx.beginPath(); ctx.roundRect(0, 0, s, s, s * .24); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillRect(s * .42, s * .2, s * .16, s * .6); ctx.fillRect(s * .2, s * .42, s * .6, s * .16); break;
    case "haus": ctx.beginPath(); ctx.moveTo(s * .08, s * .5); ctx.lineTo(s * .5, s * .1); ctx.lineTo(s * .92, s * .5); ctx.moveTo(s * .2, s * .42); ctx.lineTo(s * .2, s * .9); ctx.lineTo(s * .8, s * .9); ctx.lineTo(s * .8, s * .42); ctx.stroke(); break;
    case "schild": ctx.beginPath(); ctx.moveTo(s * .5, 0); ctx.lineTo(s * .92, s * .16); ctx.quadraticCurveTo(s * .9, s * .78, s * .5, s); ctx.quadraticCurveTo(s * .1, s * .78, s * .08, s * .16); ctx.closePath(); ctx.fill(); break;
    case "bank": ctx.beginPath(); ctx.roundRect(0, 0, s, s, s * .12); ctx.fill();
      ctx.fillStyle = "#fff"; for (let i = 0; i < 3; i++) ctx.fillRect(s * (.22 + i * .22), s * .3, s * .1, s * .45); ctx.fillRect(s * .16, s * .22, s * .68, s * .08); break;
  }
  ctx.restore();
}

function signature(ctx, x, y, w) {
  ctx.save(); ctx.strokeStyle = "rgba(24,40,110,.85)"; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.beginPath();
  let px = x; ctx.moveTo(px, y);
  for (let i = 0; i < 9; i++) {
    const nx = px + w / 9;
    ctx.bezierCurveTo(px + w * .03, y - 22 - (i % 3) * 6, nx - w * .05, y + 14, nx, y - 4 + (i % 2) * 6);
    px = nx;
  }
  ctx.stroke(); ctx.restore();
}

/* Ein DIN-A4-Brief, 840 × 1188 Pixel */
export function drawLetter(L) {
  const W = 210 * PX, H = 297 * PX, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  paper(x, W, H, "#FBFAF6");
  const mm = v => v * PX;

  /* Falz- und Lochmarken am linken Rand */
  x.fillStyle = "rgba(0,0,0,.35)";
  x.fillRect(mm(4), mm(105), mm(5), 1.5); x.fillRect(mm(4), mm(210), mm(5), 1.5); x.fillRect(mm(4), mm(148.5), mm(7), 1.5);

  /* Briefkopf */
  logo(x, L.mark, mm(166), mm(14), mm(12), L.tint);
  x.fillStyle = "#1a1a1c"; x.textAlign = "right";
  x.font = `700 ${mm(5)}px ${FONT}`; x.fillText(L.from, mm(162), mm(20));
  /* Wo die Angaben stehen, die PostSafe herausliest — in Pixeln dieses Blatts */
  const boxes = {}; const fw = x.measureText(L.from).width;
  boxes.sender = [mm(162) - fw - 6, mm(20) - mm(5) * .82, fw + 12, mm(5) * 1.12];
  x.font = `400 ${mm(2.6)}px ${FONT}`; x.fillStyle = "#666"; x.fillText(L.addr, mm(162), mm(25.5));
  x.textAlign = "left";

  /* Rücksendeangabe und Anschrift */
  x.font = `400 ${mm(2.3)}px ${FONT}`; x.fillStyle = "#555";
  const ret = L.legal + " · " + L.addr; x.fillText(ret, mm(25), mm(50));
  x.fillRect(mm(25), mm(51), x.measureText(ret).width, 1);
  x.font = `400 ${mm(3.9)}px ${FONT}`; x.fillStyle = "#1a1a1c";
  TO.forEach((t, i) => x.fillText(t, mm(25), mm(60 + i * 4.8)));

  /* Infoblock */
  x.font = `400 ${mm(2.7)}px ${FONT}`;
  L.ref.forEach(([k, v], i) => { x.fillStyle = "#777"; x.fillText(k, mm(125), mm(56 + i * 8)); x.fillStyle = "#1a1a1c"; x.font = `500 ${mm(3.1)}px ${FONT}`; x.fillText(v, mm(125), mm(60.2 + i * 8)); x.font = `400 ${mm(2.7)}px ${FONT}`; });

  /* Betreff und Text */
  x.font = `700 ${mm(3.9)}px ${FONT}`; x.fillStyle = "#111";
  let y = mm(102);
  const subj = wrap(x, L.subject, mm(160));
  boxes.subject = [mm(25) - 6, y - mm(3.9) * .82, Math.max(...subj.map(l => x.measureText(l).width)) + 12, mm(5) * (subj.length - 1) + mm(3.9) * 1.1];
  for (const line of subj) { x.fillText(line, mm(25), y); y += mm(5); }
  y += mm(5);
  x.font = `400 ${mm(3.7)}px ${FONT}`; x.fillStyle = "#1c1c1e";
  for (const para of L.body) {
    if (!para) { y += mm(3); continue; }
    for (const line of wrap(x, para, mm(160))) {
      x.fillText(line, mm(25), y);
      for (const [key, re] of [["amount", /\d{1,3}(?:\.\d{3})*,\d{2} EUR/], ["due", /bis zum \d{2}\.\d{2}\.\d{4}|innerhalb eines Monats/]]) {
        const m = line.match(re);
        if (m && !boxes[key]) { const x0 = mm(25) + x.measureText(line.slice(0, m.index)).width; boxes[key] = [x0 - 6, y - mm(3.7) * .82, x.measureText(m[0]).width + 12, mm(3.7) * 1.15]; }
      }
      y += mm(5.1);
    }
  }
  y += mm(8); x.fillText("Mit freundlichen Grüßen", mm(25), y);
  signature(x, mm(26), y + mm(13), mm(42));
  x.fillStyle = "#444"; x.fillText(L.sign, mm(25), y + mm(22));

  /* Fußzeile */
  x.fillStyle = "rgba(0,0,0,.14)"; x.fillRect(mm(25), mm(275), mm(160), 1);
  x.font = `400 ${mm(2.2)}px ${FONT}`; x.fillStyle = "#8a8a8a";
  const cols = [[L.legal, L.addr], ["Musterbank", "IBAN DE00 1234 5678 9012 3456 78"], ["Sitz: Musterstadt", "Amtsgericht Musterstadt"]];
  cols.forEach((col, i) => col.forEach((t, j) => x.fillText(t, mm(25 + i * 56), mm(280 + j * 3.4))));
  c.boxes = boxes;
  return c;
}

/* Die Rückseite: blankes Papier, durch das die Schrift spiegelverkehrt scheint */
export function drawBack(front) {
  /* In halber Auflösung: von hinten scheint die Schrift nur blass durch, schärfer sieht man sie nie */
  const c = document.createElement("canvas"); c.width = Math.round(front.width / 2); c.height = Math.round(front.height / 2);
  const x = c.getContext("2d");
  paper(x, c.width, c.height, "#F7F6F1");
  x.save(); x.globalAlpha = .07; x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(front, 0, 0, c.width, c.height); x.restore();
  return c;
}

/* Ein DIN-lang-Fensterkuvert, 880 × 440 Pixel */
export function drawEnvelope(sender, legal, addr) {
  const W = 220 * PX, H = 110 * PX, c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d"), mm = v => v * PX;
  paper(x, W, H, "#F3F2EC");
  /* Anschrift, durch das Fenster sichtbar */
  x.fillStyle = "#fbfbf8"; x.fillRect(mm(20), mm(45), mm(90), mm(45));
  x.font = `400 ${mm(2.3)}px ${FONT}`; x.fillStyle = "#555";
  const ret = legal + " · " + addr; x.fillText(ret, mm(25), mm(52)); x.fillRect(mm(25), mm(53), x.measureText(ret).width, 1);
  x.font = `400 ${mm(3.9)}px ${FONT}`; x.fillStyle = "#1a1a1c";
  TO.forEach((t, i) => x.fillText(t, mm(25), mm(61 + i * 4.8)));
  /* Folie des Fensters */
  x.fillStyle = "rgba(200,210,220,.22)"; x.fillRect(mm(20), mm(45), mm(90), mm(45));
  x.strokeStyle = "rgba(0,0,0,.12)"; x.lineWidth = 2; x.strokeRect(mm(20), mm(45), mm(90), mm(45));
  /* Absender oben links */
  x.font = `700 ${mm(3.6)}px ${FONT}`; x.fillStyle = "#222"; x.fillText(sender, mm(14), mm(16));
  x.font = `400 ${mm(2.5)}px ${FONT}`; x.fillStyle = "#666"; x.fillText(addr, mm(14), mm(21));
  /* Frankiervermerk oben rechts */
  x.strokeStyle = "#333"; x.lineWidth = 2.5; x.strokeRect(mm(160), mm(10), mm(48), mm(22));
  x.font = `700 ${mm(3)}px ${FONT}`; x.fillStyle = "#222"; x.fillText("Entgelt bezahlt", mm(164), mm(17));
  x.font = `400 ${mm(2.5)}px ${FONT}`; x.fillText("12340 Musterstadt", mm(164), mm(22)); x.fillText("DV · 2026", mm(164), mm(27));
  for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) if ((i * 7 + j * 13 + i * j) % 3 === 0 || i === 0 || j === 11) x.fillRect(mm(190) + i * 5.5, mm(13.5) + j * 5.5, 5, 5);
  return c;
}

export function drawEnvelopeBack() {
  const W = 220 * PX, H = 110 * PX, c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  paper(x, W, H, "#EFEEE8");
  x.fillStyle = "rgba(0,0,0,.05)";
  x.beginPath(); x.moveTo(0, 0); x.lineTo(W / 2, H * .58); x.lineTo(W, 0); x.closePath(); x.fill();
  x.strokeStyle = "rgba(0,0,0,.14)"; x.lineWidth = 2;
  x.beginPath(); x.moveTo(0, 0); x.lineTo(W / 2, H * .58); x.lineTo(W, 0); x.stroke();
  x.beginPath(); x.moveTo(0, H); x.lineTo(W * .36, H * .5); x.moveTo(W, H); x.lineTo(W * .64, H * .5); x.stroke();
  return c;
}
