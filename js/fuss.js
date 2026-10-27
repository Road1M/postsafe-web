/* Ist das Ende der Karte im Bild, bekommt html die Klasse "fuss" (siehe seite.css): Erst dann klebt der
   dunkle Fuß unten, und die Seite federt dort nicht mehr nach. Klebte er die ganze Zeit, machte Safari
   am iPhone daraus einen dunklen Balken unter der ganzen Seite. */
export function footBase() {
  /* Der Fuß klebt unten und liegt hinter main — er ist zu sehen, sobald main vor dem Fensterende aufhört */
  const main = document.querySelector("main");
  if (!main || !document.querySelector(".site-foot")) return;
  const check = () => document.documentElement.classList.toggle("fuss", main.getBoundingClientRect().bottom < innerHeight);
  addEventListener("scroll", check, { passive: true });
  addEventListener("resize", check);
  check();
}
