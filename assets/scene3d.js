/* =========================================================
   SCENE 3D – real three.js view of every traffic scene.
   The 2D engine (scenes.js) keeps doing the logic and timing;
   this file mirrors its state (positions, lights, brakes,
   indicators, crashes, quiz) into a lit 3D world.
   Units: 1 scene unit = 10 cm (a car is ~46 long).
   ========================================================= */
import * as THREE from './vendor/three/three.module.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { RoundedBoxGeometry } from './vendor/three/RoundedBoxGeometry.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';

const DEG = Math.PI / 180;
const MAX_LIVE = 4;            // max WebGL views alive at once
const live = new Set();
const pending = [];
const mats = {};               // shared materials
let envTex = null;

/* ---------- shared materials ---------- */
const MOB = Math.min(innerWidth, innerHeight) < 700;
const TEXW = MOB ? 1024 : 2048;
function M(key, make) { return mats[key] || (mats[key] = make()); }
const paint = c => M('paint' + c, () => new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.08, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.06 }));
const glass = () => M('glass', () => new THREE.MeshPhysicalMaterial({ color: 0x0d1620, metalness: 0.2, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6 }));
const chrome = () => M('chrome', () => new THREE.MeshStandardMaterial({ color: 0xd9dde2, metalness: 1, roughness: 0.18 }));
const rubber = () => M('rubber', () => new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.92 }));
const rim = () => M('rim', () => new THREE.MeshStandardMaterial({ color: 0xb9bec6, metalness: 0.9, roughness: 0.28 }));
const darkTrim = () => M('trim', () => new THREE.MeshStandardMaterial({ color: 0x1b1e22, roughness: 0.55, metalness: 0.3 }));
const plastic = c => M('pl' + c, () => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
const skin = () => M('skin', () => new THREE.MeshStandardMaterial({ color: 0xe0b394, roughness: 0.7 }));
const lampMat = (c, i = 0) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.3 });

/* ---------- vehicles ---------- */
// side profile of a premium saloon (x along length, y up), extruded across the width
function sedanProfile(L, wb, wr) {
  // modern premium saloon: short overhangs, long bonnet, high belt line, wheel arches cut out
  const s = new THREE.Shape(), h = L / 2, ar = wr + 0.9, cy = wr;
  s.moveTo(-h + 1.2, 3.0);
  s.quadraticCurveTo(-h, 3.2, -h, 5.2);                                   // rear bumper
  s.lineTo(-h + 0.2, 8.0); s.quadraticCurveTo(-h + 0.6, 9.5, -h + 3.0, 9.8); // boot lip
  s.lineTo(-h + 9.5, 10.2);                                                // boot lid
  s.lineTo(h - 15.5, 10.0);                                                // belt line
  s.quadraticCurveTo(h - 5.5, 9.7, h - 1.6, 8.3);                          // long bonnet
  s.quadraticCurveTo(h + 0.3, 7.2, h, 5.0);
  s.quadraticCurveTo(h - 0.2, 3.2, h - 1.6, 3.0);                          // front bumper
  s.lineTo(wb + ar, 3.0); s.absarc(wb, cy, ar, 0, Math.PI, false);         // front arch
  s.lineTo(-wb + ar, 3.0); s.absarc(-wb, cy, ar, 0, Math.PI, false);       // rear arch
  s.lineTo(-h + 1.2, 3.0);
  return s;
}
function cabinProfile(L) {
  const s = new THREE.Shape(), h = L / 2;
  s.moveTo(-h + 7.8, 9.9);
  s.quadraticCurveTo(-h + 11.5, 14.4, -h + 17.5, 14.9);                    // fastback rear screen
  s.lineTo(h - 21.5, 15.0);
  s.quadraticCurveTo(h - 17, 14.7, h - 14.2, 9.9);                         // raked windscreen
  s.lineTo(-h + 7.8, 9.9);
  return s;
}
function extrudeAcross(shape, W, bevel = 0.6) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: W - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 14 });
  g.translate(0, 0, -(W - bevel * 2) / 2);
  g.rotateY(Math.PI / 2);         // length now along -z/+z
  return g;
}
function wheel(r = 3.4, w = 2.3) {
  const g = new THREE.Group();
  const tyre = new THREE.Mesh(new THREE.TorusGeometry(r - 0.75, 0.85, 12, 28), rubber());
  tyre.scale.set(1, 1, w / 1.7); tyre.rotation.y = Math.PI / 2; g.add(tyre);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(r - 1.1, r - 1.1, w * 0.7, 24), rim()); disc.rotation.z = Math.PI / 2; g.add(disc);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, w * 0.8, 10), darkTrim()); hub.rotation.z = Math.PI / 2; g.add(hub);
  for (let i = 0; i < 5; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 0.5, r * 1.15), darkTrim()); sp.rotation.x = i * 72 * DEG; g.add(sp); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function lightsFor(g, L, W, y, front, back, opts = {}) {
  const tail = lampMat(0xff1a1a, 0.35), head = lampMat(0xffffff, 1.2), amber = lampMat(0xffa000, 0);
  const amberR = amber.clone();
  const hw = W / 2 - 1.6;
  // head lights: slim LED strips
  [-1, 1].forEach(s => { const m = new THREE.Mesh(new RoundedBoxGeometry(4.6, 1.3, 2.4, 2, 0.5), head); m.position.set(s * (hw - 0.6), y + front, -L / 2 + 1.0); g.add(m); });
  // full-width rear light bar
  const bar = new THREE.Mesh(new RoundedBoxGeometry(W - 2.2, 0.8, 0.5, 2, 0.2), tail); bar.position.set(0, y + back, L / 2 - 0.15); g.add(bar);
  [-1, 1].forEach(s => { const m = new THREE.Mesh(new RoundedBoxGeometry(2.8, 1.3, 0.5, 2, 0.3), tail); m.position.set(s * (hw + 0.2), y + back, L / 2 - 0.1); g.add(m); });
  // indicators front + rear, left/right
  const ind = { L: [], R: [] };
  [-1, 1].forEach(s => [[-L / 2 + 0.3, front - 0.1], [L / 2 - 0.05, back + 1.1]].forEach(([z, dy]) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.55, 0.45, 2, 0.15), s < 0 ? amber : amberR); m.position.set(s * (W / 2 - 0.9), y + dy, z); g.add(m);
  }));
  ind.L = amber; ind.R = amberR;
  return { tail, head, ind };
}
function sedan(color, opts = {}) {
  const L = opts.L || 47, W = opts.W || 19.8;
  const g = new THREE.Group();
  const wb = L * 0.315, wr = 3.55;
  const body = new THREE.Mesh(extrudeAcross(sedanProfile(L, wb, wr), W, 1.0), paint(color)); body.castShadow = true; body.receiveShadow = true; g.add(body);
  const cab = new THREE.Mesh(extrudeAcross(cabinProfile(L), W - 3.2, 0.9), glass()); cab.castShadow = true; g.add(cab);
  // body-colour roof panel and pillars over the glass
  const roof = new THREE.Mesh(new RoundedBoxGeometry(W - 4.8, 0.6, L - 39.5, 3, 0.3), paint(color)); roof.position.set(0, 15.0, 2.0); roof.castShadow = true; g.add(roof);
  // dark lower trim / sills
  const sill = new THREE.Mesh(new RoundedBoxGeometry(W + 0.12, 1.2, 2 * wb - 9.4, 2, 0.5), darkTrim()); sill.position.set(0, 3.7, 0); g.add(sill);
  const diff = new THREE.Mesh(new RoundedBoxGeometry(W * 0.62, 1.3, 1.2, 2, 0.4), darkTrim()); diff.position.set(0, 4.0, L / 2 - 0.4); g.add(diff);
  // grille + mirrors + door lines
  const grille = new THREE.Mesh(new RoundedBoxGeometry(W * 0.42, 2.6, 0.7, 2, 0.5), darkTrim()); grille.position.set(0, 6.0, -L / 2 + 0.15); g.add(grille);
  const intake = new THREE.Mesh(new RoundedBoxGeometry(W * 0.7, 1.1, 0.6, 2, 0.3), darkTrim()); intake.position.set(0, 3.9, -L / 2 + 0.6); g.add(intake);
  [0.7, 0, -0.7].forEach(dy => { const gb = new THREE.Mesh(new THREE.BoxGeometry(W * 0.4, 0.16, 0.2), chrome()); gb.position.set(0, 6.0 + dy, -L / 2 - 0.25); g.add(gb); });
  [-1, 1].forEach(s => { const m = new THREE.Mesh(new RoundedBoxGeometry(2.4, 1.3, 1.6, 2, 0.4), paint(color)); m.position.set(s * (W / 2 + 0.7), 10.1, -L / 2 + 13.5); m.castShadow = true; g.add(m); });
  [-1, 1].forEach(s => { const h = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 2.2), chrome()); h.position.set(s * (W / 2 + 0.02), 8.4, -1); g.add(h); const h2 = h.clone(); h2.position.z = 9; g.add(h2); });
  // wheels
  [[-1, -wb], [1, -wb], [-1, wb], [1, wb]].forEach(([sx, z]) => { const w = wheel(wr, 2.5); w.position.set(sx * (W / 2 - 1.35), wr, z); g.add(w); });
  const lamps = lightsFor(g, L, W, 0, 7.6, 8.6);
  if (opts.amb) addAmbulance(g, L, W, lamps);
  return { g, lamps, L, W };
}
function addAmbulance(g, L, W, lamps) {
  // high-roof box body in Dutch ambulance yellow with blue/yellow checks
  const tex = checksTexture();
  const box = new THREE.Mesh(new RoundedBoxGeometry(W, 11, L * 0.62, 3, 1.2), [M('ambside', () => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45 })), M('ambside', null), paint(0xf5e000), paint(0xf5e000), paint(0xf5e000), paint(0xf5e000)]);
  box.position.set(0, 15.5, L * 0.17); box.castShadow = true; g.add(box);
  const barM = lampMat(0x2f6bff, 0);
  [-1, 1].forEach(s => { const b = new THREE.Mesh(new RoundedBoxGeometry(5, 1.2, 1.8, 2, 0.4), barM); b.position.set(s * 3.2, 21.6, -L * 0.12); g.add(b); });
  lamps.blue = barM;
}
let _checks = null;
function checksTexture() {
  if (_checks) return _checks;
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#f5e000'; x.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) { x.fillStyle = '#1e46c8'; x.fillRect(i * 16, 70 + j * 16, 16, 16); }
  x.fillStyle = '#1e46c8'; x.font = 'bold 28px Arial'; x.fillText('AMBULANCE', 48, 46);
  _checks = new THREE.CanvasTexture(c); _checks.colorSpace = THREE.SRGBColorSpace; return _checks;
}
function longVehicle(kind) {
  const tram = kind === 'tram';
  const L = 120, W = tram ? 24 : 25, g = new THREE.Group();
  const bodyM = paint(tram ? 0xf2efe7 : 0xf4f6f8);
  const band = plastic(tram ? 0xc8102e : 0x1f4fa8);
  const segs = tram ? [[-60, -20.5], [-19.5, 19.5], [20.5, 60]] : [[-60, 60]];
  segs.forEach(([a, b]) => {
    const len = b - a, cz = (a + b) / 2;
    const body = new THREE.Mesh(new RoundedBoxGeometry(W, 26, len, 4, tram ? 3.2 : 2.4), bodyM); body.position.set(0, 17.5, cz); body.castShadow = true; body.receiveShadow = true; g.add(body);
    const win = new THREE.Mesh(new RoundedBoxGeometry(W + 0.3, 9, len - 5, 2, 1.2), glass()); win.position.set(0, 22, cz); g.add(win);
    const stripe = new THREE.Mesh(new RoundedBoxGeometry(W + 0.35, 2.6, len - 2, 2, 0.6), band); stripe.position.set(0, 11.5, cz); g.add(stripe);
    const skirt = new THREE.Mesh(new RoundedBoxGeometry(W + 0.2, 3, len - 1, 2, 0.8), darkTrim()); skirt.position.set(0, 5.6, cz); g.add(skirt);
    if (tram) { const roofBox = new THREE.Mesh(new RoundedBoxGeometry(W * 0.56, 2.2, len * 0.5, 2, 0.8), plastic(0xc9c5bc)); roofBox.position.set(0, 31.4, cz); roofBox.castShadow = true; g.add(roofBox); }
    // doors: dark glazed double doors on both sides
    const nDoors = tram ? 1 : 2, doorM = M('door', () => new THREE.MeshPhysicalMaterial({ color: 0x2a3036, metalness: 0.3, roughness: 0.2, clearcoat: 1 }));
    for (let k = 0; k < nDoors; k++) { const dz = nDoors === 1 ? cz : cz + (k ? 26 : -34); [-1, 1].forEach(sd => { const dr = new THREE.Mesh(new RoundedBoxGeometry(0.6, 19, 9, 2, 0.25), doorM); dr.position.set(sd * (W / 2 + 0.05), 15.2, dz); g.add(dr); const ln = new THREE.Mesh(new THREE.BoxGeometry(0.7, 18, 0.25), darkTrim()); ln.position.set(sd * (W / 2 + 0.1), 15.2, dz); g.add(ln); }); }
  });
  if (tram) {
    // articulation bellows + pantograph
    [-20, 20].forEach(z => { const j = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 9.5, 1.8, 18), darkTrim()); j.rotation.x = Math.PI / 2; j.scale.set(1.15, 1, 1.3); j.position.set(0, 17.5, z); g.add(j); });
    const pm = darkTrim();
    const a1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 16), pm); a1.position.set(0, 37, 0); a1.rotation.x = 0.45; g.add(a1);
    const a2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 16), pm); a2.position.set(0, 37, 0); a2.rotation.x = -0.45; g.add(a2);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 1.2), chrome()); shoe.position.set(0, 40.5, 0); g.add(shoe);
    [-1, 1].forEach(s => { const cab = new THREE.Mesh(new RoundedBoxGeometry(W - 1.2, 15, 5, 3, 2.4), glass()); cab.position.set(0, 20.5, s * 58.6); cab.rotation.x = s * -0.16; g.add(cab);
      const nose = new THREE.Mesh(new RoundedBoxGeometry(W - 0.6, 8, 3, 3, 1.4), bodyM); nose.position.set(0, 9.5, s * 59.4); g.add(nose);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(W - 8, 2.2, 0.4), lampMat(0xffb300, 0.9)); sign.position.set(0, 28.8, s * 60.2); g.add(sign); });
  } else {
    const ws = new THREE.Mesh(new RoundedBoxGeometry(W - 1.5, 16, 1.2, 2, 0.5), glass()); ws.position.set(0, 20, -59.6); g.add(ws);
    const dest = new THREE.Mesh(new THREE.BoxGeometry(W - 6, 2.4, 0.4), lampMat(0xffb300, 0.9)); dest.position.set(0, 28.6, -60.1); g.add(dest);
  }
  const wheelZ = tram ? [-46, -2, 2, 46] : [-40, 36];
  wheelZ.forEach(z => [-1, 1].forEach(s => { const w = wheel(tram ? 3.6 : 4.6, tram ? 1.6 : 3); w.position.set(s * (W / 2 - (tram ? 2.5 : 2.8)), tram ? 3.6 : 4.6, z); g.add(w); }));
  const lamps = lightsFor(g, L, W, 0, 9, 9);
  return { g, lamps, L, W };
}
function person(opts = {}) {
  const g = new THREE.Group();
  const top = plastic(opts.top || 0x6fb7e6), bottom = plastic(opts.bottom || 0xcfc6b4), hair = plastic(opts.hair || 0xd9c08a);
  const legL = new THREE.Group(), legR = new THREE.Group(), armL = new THREE.Group(), armR = new THREE.Group();
  const leg = () => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 7, 4, 10), bottom); m.position.y = -4.2; m.castShadow = true; return m; };
  const shoe = () => { const m = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.8, 2.6, 2, 0.35), plastic(0xf2f2f2)); m.position.set(0, -8.4, -0.5); return m; };
  legL.add(leg(), shoe()); legR.add(leg(), shoe()); legL.position.set(-0.95, 8.6, 0); legR.position.set(0.95, 8.6, 0);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(1.75, 4.6, 6, 14), top); torso.position.y = 11.9; torso.scale.z = 0.72; torso.castShadow = true;
  const arm = () => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 5.2, 4, 10), top); m.position.y = -3; m.castShadow = true; const h = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), skin()); h.position.y = -6.2; return [m, h]; };
  armL.add(...arm()); armR.add(...arm()); armL.position.set(-2.4, 14.6, 0); armR.position.set(2.4, 14.6, 0);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 1, 10), skin()); neck.position.y = 16.2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.45, 18, 14), skin()); head.position.y = 17.9; head.scale.set(0.92, 1.08, 1); head.castShadow = true;
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(1.55, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58), hair); hairM.position.set(0, 18.15, 0.12); hairM.scale.set(0.95, 1.08, 1.04);
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 2, 4, 8), hair); tail.position.set(0, 16.9, 1.5); tail.rotation.x = 0.35;
  g.add(legL, legR, torso, armL, armR, neck, head, hairM, tail);
  g.userData.walk = { legL, legR, armL, armR };
  return { g };
}
function cyclist() {
  const g = new THREE.Group();
  const frameM = paint(0x1c3d7a);
  const wheelB = z => { const w = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.32, 8, 28), rubber()); w.rotation.y = Math.PI / 2; w.position.set(0, 3.7, z); w.castShadow = true; return w; };
  g.add(wheelB(-5.6), wheelB(5.6));
  const tube = (a, b) => { const v = new THREE.Vector3().subVectors(b, a); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, v.length(), 8), frameM); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize()); m.castShadow = true; return m; };
  const P = (y, z) => new THREE.Vector3(0, y, -z);
  [[P(3.7, 5.6), P(8.6, 3.4)], [P(8.6, 3.4), P(8.9, -1.6)], [P(8.9, -1.6), P(4.2, 0)], [P(4.2, 0), P(8.6, 3.4)], [P(4.2, 0), P(3.7, -5.6)], [P(8.9, -1.6), P(3.7, -5.6)], [P(8.6, 3.4), P(10.6, 3.0)]]
    .forEach(([a, b]) => g.add(tube(a, b)));
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 5, 8), darkTrim()); bar.rotation.z = Math.PI / 2; bar.position.set(0, 10.6, -3.0); g.add(bar);
  const saddle = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.6, 2.8, 2, 0.3), darkTrim()); saddle.position.set(0, 9.4, 1.8); g.add(saddle);
  // rider (seated, leaning forward)
  const r = person({ top: 0xe5533d, bottom: 0x2a3140, hair: 0x3b2a1e });
  const w = r.g.userData.walk;
  r.g.position.set(0, 1.6, 2.2); r.g.rotation.x = -0.32;
  w.armL.rotation.x = w.armR.rotation.x = 1.05; w.armL.position.z = w.armR.position.z = 0.4;
  w.legL.rotation.x = 0.9; w.legR.rotation.x = 0.5; g.userData.seated = true;
  g.add(r.g);
  g.userData.pedal = w;
  return { g };
}
function ball() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 16), new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 }));
  m.position.y = 3; m.castShadow = true; g.add(m); g.userData.roll = m; return { g };
}
function tree(s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.9 * s, 1.3 * s, 14 * s, 8), plastic(0x6b4b31)); trunk.position.y = 7 * s; trunk.castShadow = true; g.add(trunk);
  const leaf = M('leaf', () => new THREE.MeshStandardMaterial({ color: 0x4f8a3a, roughness: 0.9, flatShading: true }));
  [[0, 18, 0, 7.5], [3.5, 15.5, 1.5, 5.5], [-3.2, 16, -1.8, 5.8], [1, 21.5, -1, 5]].forEach(([x, y, z, r]) => { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), leaf); b.position.set(x * s, y * s, z * s); b.castShadow = true; g.add(b); });
  return g;
}

/* ---------- ground: the exact 2D road drawing as a high-res texture ---------- */
let _noise = {};
function noiseURL(kind) {
  if (_noise[kind]) return _noise[kind];
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const img = x.createImageData(256, 256); const d = img.data;
  const base = kind === 'asph' ? [52, 56, 61] : kind === 'grass' ? [118, 168, 82] : kind === 'bike' ? [178, 78, 64] : [196, 199, 204];
  const amp = kind === 'asph' || kind === 'bike' ? 22 : kind === 'grass' ? 30 : 10;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amp, big = 0;
    const speck = (kind === 'asph' || kind === 'bike') && Math.random() < 0.035 ? 26 : 0;
    d[i] = base[0] + n + big + speck; d[i + 1] = base[1] + n + big * 1.2 + speck; d[i + 2] = base[2] + n * 0.8 + speck; d[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  if (kind === 'grass') { x.globalAlpha = 0.18; for (let i = 0; i < 900; i++) { x.strokeStyle = Math.random() < 0.5 ? '#4e7f36' : '#9fcf7a'; x.beginPath(); const px = Math.random() * 256, py = Math.random() * 256; x.moveTo(px, py); x.lineTo(px + (Math.random() - 0.5) * 3, py - 2 - Math.random() * 4); x.stroke(); } }
  return (_noise[kind] = c.toDataURL('image/png'));
}
function realDefs(defs) {
  const n = defs.cloneNode(true);
  const swap = (id, kind, size) => { const p = n.querySelector('#' + id); if (!p) return; p.setAttribute('width', size); p.setAttribute('height', size); p.innerHTML = `<image href="${noiseURL(kind)}" width="${size}" height="${size}"/>`; };
  swap('asph2', 'asph', 40); swap('asph', 'asph', 40); swap('grass', 'grass', 48); swap('bikep', 'bike', 40);
  return n.outerHTML;
}
async function groundTexture(S, markup) {
  const defs = document.querySelector('svg[aria-hidden="true"] defs, svg defs');
  const H = S.H;
  const routes = '';
  const marker = '';
  const src = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 ${H}" width="${TEXW}" height="${Math.round(TEXW * H / 320)}">${defs ? realDefs(defs) : ''}${markup}<g opacity=".9">${routes}</g>${marker}</svg>`;
  const img = new Image();
  const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }));
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0); URL.revokeObjectURL(url);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return { tex: t, canvas: c };
}
function isGrass(ctx, x, y, sx) { const p = ctx.getImageData(Math.round(x * sx), Math.round(y * sx), 1, 1).data; return p[1] > 150 && p[0] < 170 && p[2] < 130; }

let _signCache = {};
async function signTexture(k) {
  if (_signCache[k]) return _signCache[k];
  const inner = (window.SG && SG[k]) ? SG[k][1] : '';
  const src = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="256" height="256">${inner}</svg>`;
  const img = new Image(); const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }));
  await new Promise(r => { img.onload = r; img.onerror = r; img.src = url; });
  const c = document.createElement('canvas'); c.width = c.height = 256; c.getContext('2d').drawImage(img, 0, 0); URL.revokeObjectURL(url);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (_signCache[k] = t);
}

/* ---------- one 3D view per scene ---------- */
class View3D {
  constructor(S) { this.S = S; this.alive = true; }
  async build() {
    const S = this.S, stage = S.stage, H = S.H;
    this.wrap = document.createElement('div'); this.wrap.className = 'r3wrap';
    stage.insertBefore(this.wrap, stage.firstChild);
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.outputColorSpace = THREE.SRGBColorSpace;
    this.wrap.appendChild(r.domElement); r.domElement.setAttribute('role', 'img'); r.domElement.setAttribute('aria-label', '3D-weergave. ' + (S.opt && S.opt.label || S.svg.getAttribute('aria-label') || 'Verkeerssituatie') + ' Sleep om te draaien.');
    const scene = this.scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcfe3f2);
    scene.fog = new THREE.Fog(0xcfe3f2, 900, 1900);
    if (!envTex) { const pm = new THREE.PMREMGenerator(r); envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); }
    scene.environment = envTex; scene.environmentIntensity = 0.55;
    scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x5e7a45, 1.15));
    const sun = this.sun = new THREE.DirectionalLight(0xfff3df, 2.6);
    sun.position.set(-160, 340, 220); sun.target.position.set(160, 0, H / 2);
    sun.castShadow = true; sun.shadow.mapSize.set(MOB ? 1024 : 2048, MOB ? 1024 : 2048);
    const sc = sun.shadow.camera; sc.left = -260; sc.right = 260; sc.top = 260; sc.bottom = -260; sc.near = 50; sc.far = 900;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.4; sun.shadow.radius = 4;
    scene.add(sun, sun.target);

    // ground: road drawing without posts/lights (they become 3D)
    const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${S.d.scene()}</svg>`, 'image/svg+xml');
    const posts = [...doc.querySelectorAll('.post')].map(p => ({ x: +p.dataset.x, y: +p.dataset.y, k: p.dataset.k }));
    const tls = [...doc.querySelectorAll('.tlight')].map(t => ({ x: +t.dataset.x, y: +t.dataset.y, r: +t.dataset.r || 0, id: t.dataset.l }));
    doc.querySelectorAll('.post,.tlight').forEach(n => n.remove());
    const markup = new XMLSerializer().serializeToString(doc.documentElement).replace(/^<svg[^>]*>|<\/svg>$/g, '');
    const { tex, canvas } = await groundTexture(S, markup);
    if (!this.alive) return;
    if (!this.alive) return;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(320, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.93 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(160, 0, H / 2); ground.receiveShadow = true; scene.add(ground);
    const gt = new THREE.TextureLoader().load(noiseURL('grass')); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(4000 / 48, 4000 / 48); gt.colorSpace = THREE.SRGBColorSpace;
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ map: gt, roughness: 1 }));
    outer.rotation.x = -Math.PI / 2; outer.position.set(160, -0.05, H / 2); outer.receiveShadow = true; scene.add(outer);

    // a few trees on grass near the edges (deterministic per scene)
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); const k = canvas.width / 320;
    let seed = (S.key || 'x').split('').reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7);
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const spots = []; for (let t = 0; t < 60 && spots.length < 5; t++) {
      const x = 12 + rnd() * 296, y = 12 + rnd() * (H - 24);
      if (![[0, 0], [9, 0], [-9, 0], [0, 9], [0, -9]].every(([dx, dy]) => isGrass(ctx, x + dx, y + dy, k))) continue;
      if (spots.some(s => Math.hypot(s[0] - x, s[1] - y) < 50)) continue;
      if (S.d.a.some((a, i) => { const p = S.pos[i]; return p && Math.hypot(p.x - x, p.y - y) < 30; })) continue;
      spots.push([x, y]);
    }
    spots.forEach(([x, y], i) => { const t = tree(0.85 + (i % 3) * 0.12); t.position.set(x, 0, y); t.rotation.y = i; scene.add(t); });

    // sign posts and traffic lights
    for (const p of posts) {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 24, 10), plastic(0x9aa3ad)); pole.position.y = 12; pole.castShadow = true; g.add(pole);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), new THREE.MeshStandardMaterial({ map: await signTexture(p.k), transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.5 }));
      plate.position.y = 27; plate.castShadow = true; g.add(plate);
      g.position.set(p.x, 0, p.y + 10); g.userData.billboard = true; scene.add(g);
    }
    this.tl = {};
    for (const t of tls) {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 26, 10), plastic(0x3b4048)); pole.position.y = 13; pole.castShadow = true; g.add(pole);
      const box = new THREE.Mesh(new RoundedBoxGeometry(4, 11, 3, 2, 0.6), plastic(0x15181c)); box.position.y = 30; box.castShadow = true; g.add(box);
      const L = { r: lampMat(0xff2a2a, 0), y: lampMat(0xffb020, 0), g: lampMat(0x22e07a, 0) };
      [['r', 3.4], ['y', 0], ['g', -3.4]].forEach(([c, dy]) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1.3, 18), L[c]); m.position.set(0, 30 + dy, 1.55); g.add(m); });
      g.position.set(t.x, 0, t.y); g.userData.billboard = true; scene.add(g);
      this.tl[t.id] = L;
    }

    // road users
    this.actors = S.d.a.map((a, i) => {
      let o;
      if (a.k === 'tram' || a.k === 'bus') o = longVehicle(a.k);
      else if (a.k === 'bike') o = cyclist();
      else if (a.k === 'walk') o = person({ top: [0x6fb7e6, 0x9b5de5, 0x3d9970][i % 3], hair: [0xd9c08a, 0x3b2a1e, 0x8a5a2b][i % 3] });
      else if (a.k === 'ball') o = ball();
      else o = sedan(new THREE.Color(a.k === 'amb' ? 0xf5e000 : (a.c || '#8b95a3')).getHex(), { amb: a.k === 'amb' });
      o.g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.userData.actor = i; } });
      if (a.me) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(27, 30, 48), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.2; ring.scale.set(0.62, 1, 1); o.g.add(ring); o.halo = ring;
      }
      const quiz = new THREE.Mesh(new THREE.RingGeometry(a.k === 'tram' || a.k === 'bus' ? 64 : 30, (a.k === 'tram' || a.k === 'bus' ? 64 : 30) + 3.5, 48), new THREE.MeshBasicMaterial({ color: 0xffc21a, transparent: true, opacity: 0.9, depthWrite: false }));
      quiz.rotation.x = -Math.PI / 2; quiz.position.y = 0.25; quiz.visible = false; o.g.add(quiz); o.quiz = quiz;
      scene.add(o.g); return o;
    });
    this.fx = new THREE.Group(); scene.add(this.fx);
    // route arrows: floating 3D ribbons that follow the planned path
    S.svg.querySelectorAll('path.route').forEach(p => {
      const L = p.getTotalLength(); if (L < 12) return;
      const col = new THREE.Color(p.getAttribute('stroke') || '#2563eb');
      const pts = []; for (let i = 0; i <= 40; i++) { const q = p.getPointAtLength((L - 9) * i / 40); pts.push(new THREE.Vector3(q.x, 1.2 + Math.sin(Math.PI * i / 40) * 3, q.y)); }
      const curve = new THREE.CatmullRomCurve3(pts);
      const m = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.35, roughness: 0.35 });
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 1.0, 10, false), m); tube.castShadow = true; scene.add(tube);
      const end = p.getPointAtLength(L), pre = p.getPointAtLength(L - 9);
      const head = new THREE.Mesh(new THREE.ConeGeometry(3.4, 9, 18), m);
      head.position.set((end.x + pre.x) / 2, 1.2, (end.y + pre.y) / 2);
      head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(end.x - pre.x, 0, end.y - pre.y).normalize());
      head.castShadow = true; scene.add(head);
    });

    // camera: three-quarter view like a drone shot, fitted to the scene
    const cam = this.camera = new THREE.PerspectiveCamera(36, 1, 1, 4000);
    const ctrl = this.controls = new OrbitControls(cam, r.domElement);
    ctrl.target.set(160, 0, H / 2 + 8);
    ctrl.enableDamping = true; ctrl.dampingFactor = 0.08; ctrl.enablePan = false;
    ctrl.minPolarAngle = 8 * DEG; ctrl.maxPolarAngle = 72 * DEG; ctrl.minDistance = 160; ctrl.maxDistance = 900;
    ctrl.rotateSpeed = 0.6; ctrl.zoomSpeed = 0.8;
    r.domElement.style.touchAction = 'pan-y';
    ctrl.addEventListener('change', () => { this.dirty = true; this.userMoved = true; });
    this.home();

    // overlays: order badges in HTML on top of the canvas
    this.badgeEls = S.d.a.map((a, i) => { if (!a.b) return null; const b = document.createElement('span'); b.className = 'r3badge'; b.textContent = a.o; this.wrap.appendChild(b); return b; });
    const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'r3home'; reset.title = 'Terug naar beginbeeld'; reset.setAttribute('aria-label', 'Terug naar beginbeeld'); reset.innerHTML = '⟲'; reset.onclick = () => this.home(true); this.wrap.appendChild(reset);
    const wm = document.createElement('span'); wm.className = 'wm'; wm.textContent = 'said'; wm.setAttribute('aria-hidden', 'true'); this.wrap.appendChild(wm);
    const hint = document.createElement('span'); hint.className = 'r3hint'; hint.textContent = 'Sleep om te draaien · اسحب لتلفّ'; this.wrap.appendChild(hint);
    setTimeout(() => hint.classList.add('gone'), 3500);

    // picking: tap a road user = click it in the 2D engine
    let down = null;
    r.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    r.domElement.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8) return;
      const rect = r.domElement.getBoundingClientRect();
      const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), cam);
      const hit = ray.intersectObjects(this.actors.map(o => o.g), true).find(h => h.object.userData.actor !== undefined && h.object.visible);
      if (hit) S.acts[hit.object.userData.actor].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.wrap);
    this.resize();
    stage.classList.add('r3ready');
    this.t0 = performance.now(); this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
  }
  home(anim) {
    const H = this.S.H, t = this.controls.target;
    const dist = 365 * Math.max(1, H / 320), pol = 44 * DEG, az = -8 * DEG;
    const p = new THREE.Vector3(t.x + dist * Math.sin(pol) * Math.sin(az), dist * Math.cos(pol), t.z + dist * Math.sin(pol) * Math.cos(az));
    if (!anim) { this.camera.position.copy(p); this.camera.lookAt(t); this.controls.update(); this.dirty = true; return; }
    const from = this.camera.position.clone(), s = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - s) / 600), e = k * k * (3 - 2 * k); this.camera.position.lerpVectors(from, p, e); this.controls.update(); this.dirty = true; if (k < 1) requestAnimationFrame(step); };
    step(); this.userMoved = false;
  }
  resize() {
    const w = this.wrap.clientWidth, h = this.wrap.clientHeight; if (!w || !h) return;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.85 ? 44 : 38; this.camera.updateProjectionMatrix(); this.dirty = true;
  }
  sync(now) {
    const S = this.S; let moving = false;
    const blink = Math.floor(now / 330) % 2 === 0;
    const quiz = S.svg.classList.contains('quiz');
    this.actors.forEach((o, i) => {
      const p = S.pos[i]; if (!p) return;
      const prev = o.last || { x: p.x, y: p.y };
      const dx = p.x - prev.x, dy = p.y - prev.y; const v = Math.hypot(dx, dy);
      if (v > 0.001) moving = true;
      o.g.position.set(p.x, 0, p.y); o.g.rotation.y = -(S.ang[i] || 0) * DEG;
      o.last = { x: p.x, y: p.y };
      const el = S.acts[i];
      if (o.lamps) {
        const brk = el.classList.contains('braking'), crashed = el.classList.contains('crashed');
        o.lamps.tail.emissiveIntensity = brk ? 2.6 : 0.35;
        const L = el.classList.contains('turnL') || crashed, R = el.classList.contains('turnR') || crashed;
        o.lamps.ind.L.emissiveIntensity = L && blink ? 3 : 0; o.lamps.ind.R.emissiveIntensity = R && blink ? 3 : 0;
        if (o.lamps.blue) o.lamps.blue.emissiveIntensity = blink ? 4 : 0.4;
      }
      const pd = o.g.userData.pedal; if (pd) { const ph = (o.dist = (o.dist || 0) + v) * 0.35; pd.legL.rotation.x = 0.7 + Math.sin(ph) * 0.35; pd.legR.rotation.x = 0.7 - Math.sin(ph) * 0.35; }
      const w = o.g.userData.walk; if (w) { const ph = (o.dist = (o.dist || 0) + v) * 0.45; const a = v > 0.001 || S.svg.classList.contains('moving') ? Math.sin(ph) * 0.55 : 0; w.legL.rotation.x = a; w.legR.rotation.x = -a; w.armL.rotation.x = -a * 0.8; w.armR.rotation.x = a * 0.8; }
      if (o.g.userData.roll) o.g.userData.roll.rotation.x += v * 0.33;
      if (o.halo) o.halo.material.opacity = 0.45 + 0.3 * Math.sin(now / 400);
      o.quiz.visible = quiz && !el.classList.contains('gone');
      if (o.quiz.visible) o.quiz.material.opacity = 0.6 + 0.35 * Math.sin(now / 250);
    });
    // traffic lights
    S.svg.querySelectorAll('.tlight').forEach(t => { const L = this.tl[t.dataset.l]; if (!L) return; const s = t.dataset.s; L.r.emissiveIntensity = s === 'r' ? 3.2 : 0.05; L.y.emissiveIntensity = s === 'y' ? 3.2 : 0.05; L.g.emissiveIntensity = s === 'g' ? 3.2 : 0.05; });
    // crash: glass shards + dust in 3D
    const imp = S.svg.querySelector('.fxl .impact');
    if (imp && !this.crash) {
      const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(imp.getAttribute('transform') || ''); if (m) this.spawnCrash(+m[1], +m[2], now);
    } else if (!imp && this.crash) { this.fx.clear(); this.crash = null; }
    if (this.crash) this.stepCrash(now);
    // badges
    const rect = this.wrap.getBoundingClientRect();
    this.badgeEls.forEach((b, i) => {
      if (!b) return; const a = S.d.a[i], p = S.pos[i]; if (!p) return;
      const v = new THREE.Vector3(p.x + a.b[0] * 0.6, 26, p.y + a.b[1] * 0.6).project(this.camera);
      b.style.transform = `translate(${(v.x + 1) / 2 * rect.width}px, ${(1 - v.y) / 2 * rect.height}px) translate(-50%,-50%)`;
      b.hidden = quiz || S.svg.classList.contains('playing');
    });
    return moving || quiz || this.crash || this.actors.some(o => o.lamps && (o.lamps.blue || S.acts[this.actors.indexOf(o)].matches('.turnL,.turnR,.crashed'))) || this.actors.some(o => o.halo);
  }
  spawnCrash(x, y, now) {
    const parts = [];
    const shardM = new THREE.MeshPhysicalMaterial({ color: 0xcfe9f5, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 40; i++) {
      const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.35 + Math.random() * 0.5), i % 4 ? shardM : darkTrim());
      m.position.set(x, 8 + Math.random() * 4, y); m.castShadow = true;
      const a = Math.random() * Math.PI * 2, s = 18 + Math.random() * 40;
      m.userData.v = new THREE.Vector3(Math.cos(a) * s, 20 + Math.random() * 30, Math.sin(a) * s);
      m.userData.r = new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8);
      this.fx.add(m); parts.push(m);
    }
    const dust = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshStandardMaterial({ color: 0xbdb6aa, transparent: true, opacity: 0.45, roughness: 1, depthWrite: false }));
    dust.position.set(x, 5, y); this.fx.add(dust);
    this.crash = { parts, dust, t: now, last: now };
  }
  stepCrash(now) {
    const c = this.crash, dt = Math.min(0.05, (now - c.last) / 1000); c.last = now;
    c.parts.forEach(m => { const v = m.userData.v; if (m.position.y > 0.3) { v.y -= 98 * dt; m.position.addScaledVector(v, dt); m.rotation.x += m.userData.r.x * dt; m.rotation.z += m.userData.r.z * dt; if (m.position.y < 0.3) { m.position.y = 0.3; v.multiplyScalar(0.2); } } });
    const age = (now - c.t) / 1000; c.dust.scale.setScalar(1 + age * 3.2); c.dust.material.opacity = Math.max(0, 0.45 - age * 0.3);
  }
  wake() { if (this.sleeping && this.alive) { this.sleeping = false; this.dirty = true; requestAnimationFrame(this.loop); } }
  loop(now) {
    if (!this.alive) return;
    if (!this.visible || document.hidden) { this.sleeping = true; return; }
    const animate = this.sync(now);
    this.controls.update();
    // billboards: signs and lights always face the camera (around the vertical axis)
    if (this.dirty || animate) {
      const cp = this.camera.position;
      this.scene.traverse(o => { if (o.userData.billboard) o.rotation.y = Math.atan2(cp.x - o.position.x, cp.z - o.position.z); });
      this.renderer.render(this.scene, this.camera); this.dirty = false;
    }
    requestAnimationFrame(this.loop);
  }
  destroy() {
    this.alive = false; live.delete(this);
    this.ro && this.ro.disconnect();
    if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); }
    this.scene && this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    this.wrap && this.wrap.remove();
    this.S.stage.classList.remove('r3ready');
    this.S.view3d = null;
    const n = pending.shift(); if (n) start(n);
  }
}

function start(S) {
  if (S.view3d || !S.stage.isConnected || !S.stage.classList.contains('r3d')) return;
  if (live.size >= MAX_LIVE) {
    // free the view that is furthest off screen
    const far = [...live].filter(v => !v.visible);
    if (far.length) far[0].destroy(); else { if (!pending.includes(S)) pending.push(S); return; }
  }
  const v = new View3D(S); S.view3d = v; v.visible = true; live.add(v);
  v.build().catch(e => { console.warn('3D', e); v.destroy(); S.stage.classList.remove('r3d'); });
}

const io = new IntersectionObserver(es => es.forEach(e => {
  const S = e.target.__scene; if (!S) return;
  if (S.view3d) { S.view3d.visible = e.isIntersecting; if (e.isIntersecting) S.view3d.wake(); }
  if (e.isIntersecting) start(S);
}), { rootMargin: '200px 0px' });

document.addEventListener('visibilitychange', () => { if (!document.hidden) live.forEach(v => v.wake()); });
export function attach(S) {
  S.stage.__scene = S;
  io.observe(S.stage);
  const r = S.stage.getBoundingClientRect();
  if (r.bottom > -200 && r.top < innerHeight + 200 && r.width) start(S);
}
