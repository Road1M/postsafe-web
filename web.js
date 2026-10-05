/* ==========================================================================
   PostSafe Web — den Code in eine Adresse übersetzen.

   Diese Seite holt keine Daten vom iPhone. Sie darf es auch gar nicht: eine
   HTTPS-Seite kommt an eine Adresse im heimischen Netz nicht heran. Was sie
   darf, ist den Browser dorthin schicken — eine Weiterleitung ist erlaubt,
   ein Datenabruf wäre es nicht. Das ist der ganze Trick.

   Der Code ist deshalb kein Geheimnis, sondern die Adresse selbst: eine
   Ziffer sagt, in welchem Netz das iPhone steckt, drei sagen, welches Gerät
   darin. Wer hereindarf, entscheidet das iPhone anschliessend selbst — dort
   erscheint die Frage, und erst ein Fingertipp öffnet das Archiv.

   Die Liste unten steht wortgleich in der App (WebAddressCode.networks).
   Nichts darin darf verschoben oder entfernt werden: ein Eintrag, der seinen
   Platz wechselt, schickt jeden bereits vergebenen Code ein Netz zur Seite.
   ========================================================================== */

(function () {
  'use strict';

  var NETZE = [
    '192.168.178',
    '192.168.1',
    '192.168.2',
    '192.168.0',
    '192.168.100',
    '192.168.188',
    '192.168.10',
    '10.0.0',
    '10.0.1',
    '172.20.10'
  ];
  var PORT = 8724;

  /* Vier Ziffern zu einer Adresse, oder null. */
  function adresse(code) {
    if (!/^[0-9]{4}$/.test(code)) { return null; }
    var netz = NETZE[parseInt(code.charAt(0), 10)];
    var geraet = parseInt(code.slice(1), 10);
    if (!netz || geraet < 1 || geraet > 254) { return null; }
    return netz + '.' + geraet;
  }

  var formular = document.getElementById('verbinden');
  if (!formular) { return; }

  var feld = document.getElementById('code');
  var hinweis = document.getElementById('pair-hinweis');
  var kaestchen = formular.querySelectorAll('[data-cells] b');
  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var START = hinweis.textContent;
  var unterwegs = false, intern = false;

  /* Ein Ereignis, damit die Kästchen neu zeichnen, was im Feld steht. */
  function zeigen() { intern = true; feld.dispatchEvent(new Event('input', { bubbles: true })); intern = false; }

  /* Nur Ziffern, und höchstens vier. Ein Feld, das Buchstaben annimmt und
     danach meckert, ist eine Falle statt einer Hilfe. Die vierte Ziffer
     schickt ab — ein Knopf dazwischen wäre ein Schritt, der nichts entscheidet. */
  feld.addEventListener('input', function () {
    if (unterwegs) { return; }
    var sauber = feld.value.replace(/[^0-9]/g, '').slice(0, 4);
    if (sauber !== feld.value) { feld.value = sauber; }
    if (intern) { return; }
    formular.classList.remove('falsch');
    hinweis.textContent = START;
    if (sauber.length === 4) { formular.requestSubmit(); }
  });

  formular.addEventListener('submit', function (ereignis) {
    ereignis.preventDefault();
    if (unterwegs) { return; }

    var ziel = adresse(feld.value);
    if (!ziel) {
      hinweis.textContent = feld.value.length === 4
        ? 'Diesen Code gibt es nicht. Sieh am iPhone noch einmal nach.'
        : 'Der Code hat vier Ziffern.';
      formular.classList.remove('falsch');
      void formular.offsetWidth;
      formular.classList.add('falsch');
      /* Leeren erst nach dem Schütteln: man soll sehen, was nicht stimmte. */
      setTimeout(function () { feld.value = ''; zeigen(); feld.focus(); }, 450);
      return;
    }

    /* Sofort Bewegung, nicht erst Warten: die vier Kästchen fliegen zu
       einem zusammen, das so lange kreist, bis der Browser beim iPhone ist. */
    unterwegs = true;
    feld.blur();
    var code = formular.querySelector('[data-cells]').getBoundingClientRect();
    var mitte = code.left + code.width / 2;
    Array.prototype.forEach.call(kaestchen, function (k) {
      var r = k.getBoundingClientRect();
      k.style.setProperty('--dx', (mitte - (r.left + r.width / 2)) + 'px');
    });
    hinweis.textContent = 'Verbinde mit deinem iPhone …';
    formular.classList.add('blitz');
    setTimeout(function () { formular.classList.add('fliegt'); }, ruhig ? 0 : 240);

    /* replace statt href: kommt jemand mit „Zurück“ hierher, soll er wieder
       den Code eingeben und nicht auf einer toten Adresse landen. */
    setTimeout(function () {
      window.location.replace('http://' + ziel + ':' + PORT + '/');
    }, ruhig ? 150 : 1100);
  });

  /* Mit „Zurück“ aus dem Cache geholt: wieder ein leeres Feld statt eines
     Kästchens, das ewig kreist. */
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) { return; }
    unterwegs = false;
    formular.classList.remove('blitz', 'fliegt', 'falsch');
    feld.value = ''; zeigen(); hinweis.textContent = START;
  });
})();
