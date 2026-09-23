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
  ft.colorSpace = bt.colorSpace = THREE.SRGBColorSpace; ft.anisotropy = bt.anisotropy = 8;
  const mf = new THREE.MeshStandardMaterial({ map: ft, roughness: .86, metalness: 0, side: THREE.FrontSide, envMapIntensity: .3, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: .16 });
  const mb = new THREE.MeshStandardMaterial({ map: bt, roughness: .9, metalness: 0, side: THREE.BackSide, envMapIntensity: .28, emissive: 0xffffff, emissiveMap: bt, emissiveIntensity: .14 });
  mf.toneMapped = mb.toneMapped = false;              /* Papier bleibt weiß */
  g.add(new THREE.Mesh(geo, mf), new THREE.Mesh(geo, mb));
  return { group: g, geo, w, h, kind, mats: [mf, mb] };
}

function studioScene() {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), new THREE.MeshBasicMaterial({ color: new THREE.Color(.62, .62, .63), side: THREE.BackSide })));
  const box = (w, h, x, y, z, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  box(60, 34, 0, 48, 8, 4.2); box(10, 80, -46, 4, 14, 6.5); box(10, 80, 46, 4, 8, 4.6); box(40, 26, -18, 10, 48, 2.2);
  return s;
}

export function createStage(canvasEl) {
  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(studioScene(), .02).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.05); key.position.set(-.6, .9, .8); scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd2d0ca, .7));
  const camera = new THREE.PerspectiveCamera(24, 1, 10, 4000); camera.position.set(0, 0, 620);

  const letters = [];
  const addLetter = (f, b, kind) => { const l = buildLetter(f, b, kind); scene.add(l.group); letters.push(l); return l; };
  function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  resize();
  const visH = () => 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  /* Bildschirmanteil (Mitte = 0) → Welt auf Tiefe z */
  const toWorld = (fx, fy, z = 0) => { const VH = visH() * (camera.position.z - z) / camera.position.z; return new THREE.Vector3(fx * VH * camera.aspect, -fy * VH, z); };
  /* Die vier Ecken eines Briefs auf dem Bildschirm, in Pixeln */
  const tmp = new THREE.Vector3();
  function corners(l) {
    l.group.updateMatrixWorld(true);
    return [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([sx, sy]) => {
      tmp.set(sx * l.w / 2, sy * l.h / 2, 0).applyMatrix4(l.group.matrixWorld).project(camera);
      return [(tmp.x + 1) / 2 * innerWidth, (1 - tmp.y) / 2 * innerHeight];
    });
  }
  /* Ein Punkt auf dem Papier (Pixel der Brief-Zeichnung) → Bildschirm */
  function project(l, px, py, texW = 1050, texH = 1485) {
    tmp.set((px / texW - .5) * l.w, (.5 - py / texH) * l.h, 0).applyMatrix4(l.group.matrixWorld).project(camera);
    return [(tmp.x + 1) / 2 * innerWidth, (1 - tmp.y) / 2 * innerHeight];
  }
  return { THREE, scene, camera, renderer, letters, addLetter, resize, toWorld, corners, project, bendSheet, render: () => renderer.render(scene, camera) };
}
