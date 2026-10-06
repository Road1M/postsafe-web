/* Ist der dunkle Fuß im Bild, tragen html und body seine Farbe (Klasse "fuss", siehe seite.css): Safari füllt
   am Seitenende die Fläche hinter seiner Leiste unten mit der Grundfarbe der Seite, und hellem Papier
   unter dem dunklen Fuß sähe man als Balken. Sonst bleibt die Grundfarbe Papier — oben am Anfang
   nimmt Safari sie für den Bereich hinter der Uhrzeit. */
export function footBase() {
  /* Der Fuß klebt unten und liegt hinter main — er ist zu sehen, sobald main vor dem Fensterende aufhört */
  const main = document.querySelector("main");
  if (!main || !document.querySelector(".site-foot")) return;
  const check = () => document.documentElement.classList.toggle("fuss", main.getBoundingClientRect().bottom < innerHeight);
  addEventListener("scroll", check, { passive: true });
  addEventListener("resize", check);
  check();
}
