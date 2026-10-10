// Art spike: does toon 3D look right in the browser?
// Placeholder hero (procedural) until Mixamo files exist in /assets/hero/.
import * as THREE from 'three';
import { FBXLoader } from '/vendor/three/addons/loaders/FBXLoader.js';

const statusEl = document.getElementById('status');
const setStatus = (t) => { statusEl.textContent = t; };

// ---------- renderer, scene, camera ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const SKY = 0x9fd8f5;
const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 28, 70);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(3.4, 3.1, 11);
camera.lookAt(3.6, 1.1, 0);

scene.add(new THREE.HemisphereLight(0xffffff, 0x9bb58c, 1.1));
const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
sun.position.set(-5, 10, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -14, right: 22, top: 10, bottom: -6, near: 1, far: 40 });
sun.target.position.set(4, 0, 0);
scene.add(sun, sun.target);

// ---------- toon helpers ----------
function makeGradient(steps = 4) {
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) data[i] = Math.round(70 + (185 * i) / (steps - 1));
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}
const GRADIENT = makeGradient(4);
const toon = (color) => new THREE.MeshToonMaterial({ color, gradientMap: GRADIENT });

// Inverted-hull outline: a back-face copy pushed out along the normals.
function outlineMaterial(thickness) {
  const m = new THREE.MeshBasicMaterial({ color: 0x1b2a38, side: THREE.BackSide });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `vec3 transformed = vec3(position) + normalize(normal) * ${thickness.toFixed(4)};`
    );
  };
  return m;
}
function addOutline(root, thickness = 0.02) {
  const mat = outlineMaterial(thickness);
  const targets = [];
  root.traverse((o) => { if (o.isMesh && !o.userData.isOutline) targets.push(o); });
  for (const mesh of targets) {
    let line;
    if (mesh.isSkinnedMesh) {
      line = new THREE.SkinnedMesh(mesh.geometry, mat);
      line.bind(mesh.skeleton, mesh.bindMatrix);
    } else {
      line = new THREE.Mesh(mesh.geometry, mat);
    }
    line.userData.isOutline = true;
    line.frustumCulled = false;
    mesh.add(line);
  }
}
function shadows(root) {
  root.traverse((o) => { if (o.isMesh && !o.userData.isOutline) { o.castShadow = true; } });
}

// ---------- ground and scenery ----------
const WORLD_SPEED = 6; // units per second at normal pace
let scroll = 0;

function stripeTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#5a6672'; g.fillRect(0, 0, 512, 128);
  g.fillStyle = '#f4f1e0';
  g.fillRect(40, 60, 180, 8); g.fillRect(296, 60, 180, 8);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const roadTex = stripeTexture();
roadTex.repeat.set(10, 1);
const road = new THREE.Mesh(new THREE.PlaneGeometry(80, 5), new THREE.MeshToonMaterial({ map: roadTex, gradientMap: GRADIENT }));
road.rotation.x = -Math.PI / 2;
road.position.set(10, 0, 0.6);
road.receiveShadow = true;
scene.add(road);

const curb = new THREE.Mesh(new THREE.BoxGeometry(80, 0.18, 0.5), toon(0xd9d2c0));
curb.position.set(10, 0.09, -1.95); curb.castShadow = true; curb.receiveShadow = true;
const walk = new THREE.Mesh(new THREE.BoxGeometry(80, 0.1, 3.4), toon(0xe8dfc8));
walk.position.set(10, 0.05, -3.9); walk.receiveShadow = true;
const grass = new THREE.Mesh(new THREE.BoxGeometry(80, 0.06, 14), toon(0x8fc46b));
grass.position.set(10, 0.0, -12); grass.receiveShadow = true;
scene.add(curb, walk, grass);
addOutline(curb, 0.012);

// Recycled houses, three parallax rows.
const houses = [];
function makeHouse(color, roofColor, w, h) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.2), toon(color));
  body.position.y = h / 2;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.78, 1.1, 4), toon(roofColor));
  roof.position.y = h + 0.55; roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 2.2 / w * 1.0);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.1), toon(0x7a4a2b));
  door.position.set(0, 0.55, 1.13);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.1), toon(0xbfe6f7));
  win.position.set(w * 0.28, h * 0.62, 1.13);
  g.add(body, roof, door, win);
  addOutline(g, 0.03); shadows(g);
  return g;
}
const palette = [[0xf2b880, 0xc4553a], [0xf6e7a1, 0x5f8f6b], [0xd8a7d8, 0x6b5b95], [0x9fc9e8, 0x3f6e8c], [0xf29e9e, 0x8a3b3b]];
const rows = [
  { z: -6.5, speed: 0.9, scale: 1.0, count: 9, gap: 5.2 },
  { z: -15, speed: 0.55, scale: 1.7, count: 8, gap: 7.4 },
];
for (const row of rows) {
  for (let i = 0; i < row.count; i++) {
    const [c, r] = palette[(i + (row.z < -10 ? 2 : 0)) % palette.length];
    const h = makeHouse(c, r, 2.4 + (i % 3) * 0.5, 1.8 + (i % 2) * 0.6);
    h.scale.setScalar(row.scale);
    h.position.set(-6 + i * row.gap, 0, row.z);
    h.userData = { row, base: -6 + i * row.gap };
    houses.push(h); scene.add(h);
  }
}
// Far hills: flat, slow.
const hills = [];
for (let i = 0; i < 6; i++) {
  const hill = new THREE.Mesh(new THREE.SphereGeometry(6 + (i % 3) * 2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(i % 2 ? 0x7fb98a : 0x95c9a0));
  hill.position.set(-8 + i * 11, 0, -32);
  hill.userData = { base: -8 + i * 11 };
  hills.push(hill); scene.add(hill);
}
// Trees on the sidewalk edge.
const trees = [];
for (let i = 0; i < 7; i++) {
  const t = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 1.2, 8), toon(0x8a5a3a));
  trunk.position.y = 0.6;
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 10), toon(0x58a85a));
  crown.position.y = 1.7;
  t.add(trunk, crown); addOutline(t, 0.025); shadows(t);
  t.position.set(i * 6.5, 0.1, -3.2);
  t.userData = { base: i * 6.5 };
  trees.push(t); scene.add(t);
}

// ---------- hero ----------
const hero = new THREE.Group();
hero.position.set(0, 0, 0.4);
scene.add(hero);

let heroState = 'run'; // run | jump | slide
let stateTime = 0;
let procedural = null;
let mixer = null;
const actions = {};

function buildProceduralHero() {
  const g = new THREE.Group();
  const skin = 0xf1c27d, jersey = 0xe94f37, shorts = 0x2c3e6b;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.5, 6, 12), toon(jersey));
  torso.position.y = 1.15;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), toon(skin));
  head.position.y = 1.85;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.355, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), toon(0x3b2a20));
  hair.position.y = 1.88;
  const limb = (color, len, r) => {
    const pivot = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 8), toon(color));
    m.position.y = -(len / 2 + r);
    pivot.add(m); return pivot;
  };
  const legL = limb(shorts, 0.5, 0.12), legR = limb(shorts, 0.5, 0.12);
  legL.position.set(-0.13, 0.82, 0); legR.position.set(0.13, 0.82, 0);
  const armL = limb(skin, 0.4, 0.09), armR = limb(skin, 0.4, 0.09);
  armL.position.set(-0.36, 1.4, 0); armR.position.set(0.36, 1.4, 0);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), toon(0xffffff));
  ball.position.set(0.55, 0.2, 0.1);
  g.add(torso, head, hair, legL, legR, armL, armR, ball);
  g.rotation.y = Math.PI / 2; // face +x (running right)
  addOutline(g, 0.022); shadows(g);
  return { group: g, torso, head, legL, legR, armL, armR, ball };
}

function animateProcedural(t, dt) {
  const p = procedural; if (!p) return;
  const k = (heroState === 'run' ? 1 : 0);
  const swing = Math.sin(t * 11) * 0.9 * k;
  p.legL.rotation.x = swing; p.legR.rotation.x = -swing;
  p.armL.rotation.x = -swing * 0.8; p.armR.rotation.x = swing * 0.8;
  p.torso.rotation.z = Math.sin(t * 11) * 0.05 * k;
  p.ball.position.z = 0.1 + Math.abs(Math.sin(t * 11)) * 0.18 * k;
  let y = Math.abs(Math.sin(t * 11)) * 0.06 * k;
  p.group.scale.set(1, 1, 1);
  p.group.rotation.x = 0;
  if (heroState === 'jump') {
    const u = Math.min(stateTime / 0.7, 1);
    y = Math.sin(u * Math.PI) * 1.5;
    p.legL.rotation.x = -0.8; p.legR.rotation.x = 0.5;
    p.armL.rotation.x = -2.4; p.armR.rotation.x = -2.4;
    const sq = 1 + Math.sin(u * Math.PI) * 0.08; p.group.scale.set(1 / sq, sq, 1 / sq);
    if (u >= 1) setHeroState('run');
  } else if (heroState === 'slide') {
    const u = Math.min(stateTime / 0.6, 1);
    p.group.rotation.x = -1.2 * Math.sin(u * Math.PI) ; // lean back, feet forward
    y = -0.35 * Math.sin(u * Math.PI);
    p.legL.rotation.x = -1.4; p.legR.rotation.x = -1.4;
    if (u >= 1) setHeroState('run');
  }
  p.group.position.y = y;
}

function setHeroState(s) {
  if (heroState === s) return;
  heroState = s; stateTime = 0;
  if (mixer) {
    const a = actions[s] || actions.run;
    const prev = Object.values(actions).find((x) => x.isRunning() && x !== a);
    a.reset().fadeIn(0.12).play();
    if (prev) prev.fadeOut(0.12);
  }
}

async function exists(url) {
  try { const r = await fetch(url, { method: 'HEAD' }); return r.ok; } catch { return false; }
}

async function loadHero() {
  const base = '/assets/hero/';
  if (await exists(base + 'hero.fbx')) {
    try {
      const loader = new FBXLoader();
      const model = await loader.loadAsync(base + 'hero.fbx');
      model.scale.setScalar(0.011);
      model.rotation.y = Math.PI / 2;
      mixer = new THREE.AnimationMixer(model);
      for (const name of ['run', 'jump', 'slide', 'kick', 'fall']) {
        if (await exists(`${base}${name}.fbx`)) {
          const a = await loader.loadAsync(`${base}${name}.fbx`);
          const clip = a.animations[0];
          if (clip) {
            clip.name = name;
            // Drop root position tracks so the hero stays in place.
            clip.tracks = clip.tracks.filter((tr) => !/Hips\.position$/.test(tr.name));
            const action = mixer.clipAction(clip);
            if (name === 'jump' || name === 'slide' || name === 'kick' || name === 'fall') {
              action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true;
            }
            actions[name] = action;
          }
        }
      }
      mixer.addEventListener('finished', () => setHeroState('run'));
      hero.add(model);
      model.traverse((o) => { if (o.isMesh) { o.material = toon(o.material.color || 0xdddddd); } });
      addOutline(model, 1.6);
      shadows(model);
      (actions.run || Object.values(actions)[0])?.play();
      setStatus(`Mixamo hero loaded (${Object.keys(actions).join(', ') || 'no animations'})`);
      return;
    } catch (e) {
      console.warn('Mixamo load failed, using placeholder', e);
    }
  }
  procedural = buildProceduralHero();
  hero.add(procedural.group);
  setStatus('placeholder hero (no Mixamo files in /assets/hero/ yet)');
}

// ---------- zoomie dog (procedural) ----------
const dog = new THREE.Group();
const dogParts = {};
(function buildDog() {
  const fur = 0xd99a4e, dark = 0x7a4a2b, white = 0xfff4e0;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 6, 12), toon(fur));
  body.rotation.z = Math.PI / 2; body.position.y = 0.55;
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), toon(white));
  chest.position.set(0.32, 0.5, 0);
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12), toon(fur));
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.2), toon(white));
  snout.position.set(0.24, -0.06, 0);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), toon(0x222222));
  nose.position.set(0.4, -0.02, 0);
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 6), toon(dark));
  earL.position.set(-0.05, 0.25, 0.16); earL.rotation.z = 0.5;
  const earR = earL.clone(); earR.position.z = -0.16;
  const eye = (z) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), toon(0x111111)); e.position.set(0.17, 0.08, z); return e; };
  head.add(skull, snout, nose, earL, earR, eye(0.12), eye(-0.12));
  head.position.set(0.7, 0.85, 0);
  const tail = new THREE.Group();
  const tailM = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.35, 4, 6), toon(dark));
  tailM.position.set(-0.18, 0.18, 0); tailM.rotation.z = 0.8; tail.add(tailM);
  tail.position.set(-0.55, 0.65, 0);
  const legs = [];
  for (const [x, z] of [[0.4, 0.15], [0.4, -0.15], [-0.4, 0.15], [-0.4, -0.15]]) {
    const pivot = new THREE.Group();
    const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.25, 4, 6), toon(fur));
    l.position.y = -0.2; pivot.add(l); pivot.position.set(x, 0.42, z); legs.push(pivot); dog.add(pivot);
  }
  dog.add(body, chest, head, tail);
  addOutline(dog, 0.02); shadows(dog);
  Object.assign(dogParts, { head, tail, legs, body });
  dog.rotation.y = Math.PI; // faces -x, charging at the hero
  scene.add(dog);
})();

const DOG = { phase: 'wait', t: 0, x: 22, speed: 13 };
function updateDog(dt, worldDt) {
  DOG.t += dt;
  const { head, tail, legs } = dogParts;
  dog.position.z = 0.4;
  if (DOG.phase === 'wait') {
    dog.position.x = 22; dog.visible = false;
    if (DOG.t > 2.2) { DOG.phase = 'windup'; DOG.t = 0; DOG.x = 12; dog.visible = true; }
  } else if (DOG.phase === 'windup') {
    // Wind-up tell: crouch, ears back, tail blur, bark bounce.
    dog.position.x = DOG.x - worldDt * 0;
    dog.scale.set(1, 1 - 0.14, 1);
    dog.position.y = 0;
    head.position.y = 0.72 + Math.sin(DOG.t * 30) * 0.03;
    tail.rotation.y = Math.sin(DOG.t * 40) * 0.9;
    legs.forEach((l) => (l.rotation.z = 0));
    if (DOG.t > 0.9) { DOG.phase = 'zoom'; DOG.t = 0; dog.scale.set(1, 1, 1); head.position.y = 0.85; }
  } else if (DOG.phase === 'zoom') {
    DOG.x -= (DOG.speed + worldDt * 0) * dt;
    dog.position.x = DOG.x;
    const run = DOG.t * 22;
    legs.forEach((l, i) => (l.rotation.z = Math.sin(run + (i % 2 ? Math.PI : 0)) * 0.9));
    dog.position.y = Math.abs(Math.sin(run)) * 0.07;
    tail.rotation.y = Math.sin(DOG.t * 30) * 0.7;
    if (DOG.x < -8) { DOG.phase = 'wait'; DOG.t = 0; dog.visible = false; }
  }
}

// ---------- input ----------
const keys = new Set();
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.code === 'ArrowUp' && heroState === 'run') setHeroState('jump');
  if (e.code === 'ArrowDown' && heroState === 'run') setHeroState('slide');
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- loop ----------
const clock = new THREE.Clock();
let elapsed = 0, fpsAcc = 0, fpsN = 0, fps = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt; stateTime += dt;
  const pace = (keys.has('ShiftLeft') || keys.has('ShiftRight')) ? 1.5 : 1;
  const worldDt = WORLD_SPEED * pace * dt;
  scroll += worldDt;

  roadTex.offset.x = scroll / 8; // 80 wide / 10 repeats = 8 units per tile
  for (const h of houses) {
    const r = h.userData.row, span = r.count * r.gap;
    h.position.x = ((h.userData.base - scroll * r.speed + 12) % span + span) % span - 12;
  }
  for (const h of hills) h.position.x = (((h.userData.base - scroll * 0.18 + 20) % 66) + 66) % 66 - 20;
  for (const t of trees) t.position.x = (((t.userData.base - scroll + 8) % 45.5) + 45.5) % 45.5 - 8;

  mixer?.update(dt);
  animateProcedural(elapsed, dt);
  updateDog(dt, worldDt);

  fpsAcc += dt; fpsN++;
  if (fpsAcc > 0.5) { fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; fpsEl.textContent = ` | ${fps} fps`; }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
const fpsEl = document.createElement('span');
statusEl.after(fpsEl);

loadHero().then(() => requestAnimationFrame(frame));
