/* PostSafe — die Briefe im Raum, in WebGL.
   Das iPhone ist hier bewusst nicht: es ist Apples Produktbild und liegt als
   Bild über dieser Ebene. Briefe fliegen nie über oder in das Gerät.         */

import * as THREE from "./three.module.js";   /* liegt auf postsafe.eu selbst, kein fremder Server */

/* Ein Blatt mit Knickfalten (Drittel, wie für ein DIN-lang-Kuvert) und leichter Wölbung */
export function bendSheet(geo, w, h, foldTop, foldBottom, curl) {
  const p = geo.attributes.position, c = h / 6;
  if (!geo.userData.base) geo.userData.base = Float32Array.from(p.array);
  const b = geo.userData.base;
  for (let i = 0; i < p.count; i++) {
    let x = b[i * 3], y = b[i * 3 + 1], z = 0;
    if (y > c) { const d = y - c; y = c + d * Math.cos(foldTop); z = -d * Math.sin(foldTop); }
    else if (y < -c) { const d = -c - y; y = -c - d * Math.cos(foldBottom); z = -d * Math.sin(foldBottom); }
    z += curl * (x / w) * (x / w) * w;
    p.setXYZ(i, x, y, z);
  }
  p.needsUpdate = true; geo.computeVertexNormals();
}

function buildLetter(frontCanvas, backCanvas, kind) {
  const g = new THREE.Group();
  const w = kind === "env" ? 110 : 105, h = kind === "env" ? 55 : 148.5;
  const geo = new THREE.PlaneGeometry(w, h, 12, kind === "env" ? 6 : 36);
  const ft = new THREE.CanvasTexture(frontCanvas), bt = new THREE.CanvasTexture(backCanvas);
  ft.colorSpace = bt.colorSpace = THREE.SRGBColorSpace; ft.anisotropy = bt.anisotropy = 4;
  /* Ist das Bild einmal auf der Grafikkarte, braucht der Arbeitsspeicher keine zweite Kopie:
     das Zeichenblatt wird danach auf 1 × 1 Pixel geschrumpft. */
  const release = t => { t.onUpdate = () => { const c = t.image; if (c && c.width > 1) { c.width = c.height = 1; } t.onUpdate = null; }; };
  release(ft); release(bt);
  const texW = frontCanvas.width, texH = frontCanvas.height;
  const mf = new THREE.MeshStandardMaterial({ map: ft, roughness: .86, metalness: 0, side: THREE.FrontSide, envMapIntensity: .3, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: .16 });
  const mb = new THREE.MeshStandardMaterial({ map: bt, roughness: .9, metalness: 0, side: THREE.BackSide, envMapIntensity: .28, emissive: 0xffffff, emissiveMap: bt, emissiveIntensity: .14 });
  mf.toneMapped = mb.toneMapped = false;              /* Papier bleibt weiß */
  g.add(new THREE.Mesh(geo, mf), new THREE.Mesh(geo, mb));
  return { group: g, geo, w, h, kind, mats: [mf, mb], texW, texH };
}

function studioScene() {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), new THREE.MeshBasicMaterial({ color: new THREE.Color(.62, .62, .63), side: THREE.BackSide })));
  const box = (w, h, x, y, z, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  box(60, 34, 0, 48, 8, 4.2); box(10, 80, -46, 4, 14, 6.5); box(10, 80, 46, 4, 8, 4.6); box(40, 26, -18, 10, 48, 2.2);
  return s;
}

/* follow: Die Zeichenfläche ist Teil der Seite statt fest über ihr, und das Skript führt sie
   beim Scrollen mit. Safari (iOS 26) schneidet alles, was beim Scrollen feststeht, an seinen
   Leisten oben und unten ab; die Seite selbst läuft darunter weiter. Damit die Briefe das auch
   tun, ist die Fläche um m Pixel über und unter dem Fenster größer und wandert mit. */
export function createStage(canvasEl, { follow = false } = {}) {
  /* Sparsam mit dem Speicher: kein Griff nach der starken Grafikkarte, und Kantenglättung nur
     dort, wo die Pixel groß sind — auf einem Retina-Bildschirm glättet die doppelte Auflösung
     schon selbst, und die vierfache Glättung kostete dort über 100 MB.
     Kommt keine 3D-Grafik zustande (alter Rechner, wenig Speicher, abgeschaltet), läuft die
     Seite ohne die fliegenden Briefe weiter: Rechnen geht ohne Grafik, nur das Zeichnen nicht. */
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let renderer = null, lost = false;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: dpr < 1.5, powerPreference: "default" });
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
  } catch (e) {
    renderer = null;
  }
  const off = () => { lost = true; canvasEl.style.display = "none"; };
  if (!renderer) off();
  /* Nimmt der Browser die Grafik später zurück (Speicher knapp), verschwinden nur die Briefe. */
  canvasEl.addEventListener("webglcontextlost", e => { e.preventDefault(); off(); });
  const scene = new THREE.Scene();
  if (renderer) scene.environment = new THREE.PMREMGenerator(renderer).fromScene(studioScene(), .02).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.05); key.position.set(-.6, .9, .8); scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd2d0ca, .7));
  const FOV = 24, camera = new THREE.PerspectiveCamera(FOV, 1, 10, 4000); camera.position.set(0, 0, 620);
  let m = 0;

  const letters = [];
  const addLetter = (f, b, kind) => { const l = buildLetter(f, b, kind); scene.add(l.group); letters.push(l); return l; };
  /* Die Zeichenfläche bekommt genau die sichtbare Fenstergröße, nicht 100vh: auf dem iPhone ist
     100vh die Höhe ohne Safaris Leiste, das Fenster aber kleiner, solange sie zu sehen ist — die
     Briefe wären gestreckt gemalt und die Scan-Ecken (in Fensterpunkten gerechnet) säßen zu hoch. */
  function resize() {
    m = follow ? Math.max(0, Math.min(200, screen.height - innerHeight)) : 0;
    const H = innerHeight + 2 * m;
    if (renderer) renderer.setSize(innerWidth, H);
    /* Der Blickwinkel wächst mit der Fläche — das Fenster selbst zeigt genau dasselbe wie ohne Rand */
    camera.aspect = innerWidth / H;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * H / innerHeight));
    camera.updateProjectionMatrix();
  }
  resize();
  const visH = () => 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));   /* Höhe des Fensters, ohne Rand */
  /* Bildschirmanteil (Mitte = 0) → Welt auf Tiefe z */
  const toWorld = (fx, fy, z = 0) => { const VH = visH() * (camera.position.z - z) / camera.position.z; return new THREE.Vector3(fx * VH * innerWidth / innerHeight, -fy * VH, z); };
  /* Die vier Ecken eines Briefs auf dem Bildschirm, in Pixeln */
  const tmp = new THREE.Vector3();
  function corners(l) {
    l.group.updateMatrixWorld(true);
    return [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([sx, sy]) => {
      tmp.set(sx * l.w / 2, sy * l.h / 2, 0).applyMatrix4(l.group.matrixWorld).project(camera);
      return [(tmp.x + 1) / 2 * innerWidth, (1 - tmp.y) / 2 * (innerHeight + 2 * m) - m];
    });
  }
  /* Ein Punkt auf dem Papier (Pixel der Brief-Zeichnung) → Bildschirm */
  function project(l, px, py, texW = l.texW, texH = l.texH) {
    tmp.set((px / texW - .5) * l.w, (.5 - py / texH) * l.h, 0).applyMatrix4(l.group.matrixWorld).project(camera);
    return [(tmp.x + 1) / 2 * innerWidth, (1 - tmp.y) / 2 * (innerHeight + 2 * m) - m];
  }
  return { THREE, scene, camera, renderer, letters, addLetter, resize, toWorld, corners, project, bendSheet, render: () => {
    if (!renderer || lost) return;
    if (follow) canvasEl.style.transform = `translate3d(0, ${scrollY - m}px, 0)`;
    renderer.render(scene, camera);
  } };
}
