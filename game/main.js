// Every Sport: playable skeleton (football / street zone only).
// Game flow: ready -> intro (ball drops) -> running -> over. Pause with P or Esc.
import * as THREE from 'three';
import { createWorld, toon, addOutline } from './world.js';
import { createHero } from './hero.js';
import { makeDog, makeGrandma, makePigeons, makeSprinkler, makeLampPost, makeGoal } from './threats.js';

const SPAWN_X = 18;
const BASE_SPEED = 6;
const PASS_RANGE = 8.5, SHOT_RANGE = 9.5;

const world = createWorld(document.getElementById('stage'));
const { scene, camera, renderer, baseCam } = world;

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const ui = {
  score: $('score'), best: $('best'), pace: $('pace'), toast: $('toast'),
  overlay: $('overlay'), title: $('ov-title'), body: $('ov-body'), hint: $('ov-hint'),
};
let best = 0;
try { best = Number(localStorage.getItem('everysport.best')) || 0; } catch { /* storage unavailable */ }
const saveBest = () => { try { localStorage.setItem('everysport.best', String(Math.floor(best))); } catch { /* ignore */ } };

function showOverlay(title, body, hint) {
  ui.title.textContent = title; ui.body.innerHTML = body; ui.hint.textContent = hint;
  ui.overlay.classList.add('show');
}
const hideOverlay = () => ui.overlay.classList.remove('show');
function toast(msg) {
  ui.toast.textContent = msg;
  ui.toast.classList.remove('show'); void ui.toast.offsetWidth; ui.toast.classList.add('show');
}

// ---------- actors ----------
const hero = createHero();
hero.group.position.set(0, 0, 0.4);
scene.add(hero.group);

const ball = new THREE.Group();
const ballCore = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), toon(0xffffff));
for (let i = 0; i < 5; i++) {
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), toon(0x222222));
  const a = (i / 5) * Math.PI * 2;
  p.position.set(Math.cos(a) * 0.16, Math.sin(a * 2) * 0.1, Math.sin(a) * 0.16);
  ballCore.add(p);
}
ball.add(ballCore);
addOutline(ball, 0.015);
ball.traverse((o) => { if (o.isMesh && !o.userData.isOutline) o.castShadow = true; });
scene.add(ball);

const safeRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.62, 0.05, 8, 32),
  new THREE.MeshBasicMaterial({ color: 0x7fdcff, transparent: true, opacity: 0.85 }),
);
safeRing.rotation.x = Math.PI / 2; safeRing.position.set(0, 0.05, 0.4); safeRing.visible = false;
scene.add(safeRing);

// ---------- confetti ----------
const bits = [];
const bitGeo = new THREE.BoxGeometry(0.1, 0.1, 0.02);
function burst(x, y, colors) {
  for (let i = 0; i < 28; i++) {
    const m = new THREE.Mesh(bitGeo, new THREE.MeshBasicMaterial({ color: colors[i % colors.length] }));
    m.position.set(x, y, 0.8);
    m.userData = { vx: (Math.random() - 0.5) * 6, vy: 2 + Math.random() * 4, vr: (Math.random() - 0.5) * 12, life: 1.2 };
    scene.add(m); bits.push(m);
  }
}
function updateBits(dt) {
  for (let i = bits.length - 1; i >= 0; i--) {
    const m = bits[i], u = m.userData;
    u.vy -= 12 * dt; m.position.x += u.vx * dt; m.position.y += u.vy * dt; m.rotation.z += u.vr * dt;
    u.life -= dt;
    if (u.life <= 0 || m.position.y < 0) { scene.remove(m); m.material.dispose(); bits.splice(i, 1); }
  }
}

// ---------- game state ----------
const G = {
  mode: 'ready', clock: 0, scroll: 0, distance: 0, introT: 0, overT: 0,
  objects: [], last: null, bag: [], rng: Math.random, lastType: '',
  safeUntil: -1, ballMode: 'attached', flight: null, ballVel: 0,
  shake: 0, cause: '', newBest: false, queued: null,
};
const anchor = new THREE.Vector3();
const keys = new Set();

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shuffled bag: about 4 threats to 3 goals, never the same type twice in a row.
function nextType() {
  if (!G.bag.length) {
    G.bag = ['dog', 'grandma', 'pigeons', 'sprinkler', 'goal', 'goal', 'goal'];
    for (let i = G.bag.length - 1; i > 0; i--) {
      const j = Math.floor(G.rng() * (i + 1));
      [G.bag[i], G.bag[j]] = [G.bag[j], G.bag[i]];
    }
  }
  let t = G.bag.pop();
  for (let n = G.bag.length; t === G.lastType && n > 0; n--) { G.bag.unshift(t); t = G.bag.pop(); }
  G.lastType = t;
  return t;
}

function spawn(type) {
  const objs = [];
  if (type === 'dog') objs.push(makeDog());
  else if (type === 'grandma') objs.push(makeGrandma());
  else if (type === 'pigeons') objs.push(makePigeons());
  else if (type === 'sprinkler') objs.push(makeSprinkler(SPAWN_X), makeLampPost(SPAWN_X + 4.6));
  else if (type === 'goal') objs.push(makeGoal(SPAWN_X));
  for (const o of objs) { o.mesh.position.x = o.x; scene.add(o.mesh); G.objects.push(o); }
  G.last = objs[0];
}

function clearObjects() {
  for (const o of G.objects) scene.remove(o.mesh);
  G.objects = []; G.last = null;
}

function start() {
  clearObjects();
  Object.assign(G, {
    mode: 'intro', scroll: 0, distance: 0, introT: 0, overT: 0, bag: [], lastType: '',
    safeUntil: -1, ballMode: 'attached', flight: null, ballVel: 0, shake: 0, newBest: false, queued: null,
    rng: mulberry32((Math.random() * 2 ** 31) | 0),
  });
  hero.setState('idle');
  hideOverlay();
}

function die(o) {
  G.mode = 'over'; G.overT = 0; G.shake = 0.4; G.cause = o.name;
  G.ballMode = 'free'; G.ballVel = 4; G.flight = null;
  hero.setState('fall');
  if (G.distance > best) { best = G.distance; G.newBest = true; saveBest(); }
}

function togglePause() {
  if (G.mode === 'running') { G.mode = 'paused'; showOverlay('Paused', 'Your run is on hold.', 'Press P, Esc or Space to resume'); }
  else if (G.mode === 'paused') { G.mode = 'running'; hideOverlay(); }
}

// ---------- pass / shot ----------
function ballAction(kind) {
  if (G.mode !== 'running' || G.ballMode !== 'attached') return;
  const want = kind === 'shot' ? 'goal' : 'passable';
  const range = kind === 'shot' ? SHOT_RANGE : PASS_RANGE;
  let target = null;
  for (const o of G.objects) {
    if (o.kind === want && o.x > 0.8 && o.x < range && (!target || o.x < target.x)) target = o;
  }
  G.ballMode = 'flight';
  G.flight = { t: 0, out: 0.4, back: 0.4, target, kind, hit: false };
  // The ball must reach something to count. Then nothing can tackle the hero while it is away.
  if (target) G.safeUntil = G.clock + 0.9;
}

const easeOut = (u) => 1 - (1 - u) * (1 - u);
const easeIn = (u) => u * u;
const tmp = new THREE.Vector3();

function updateBall(dt) {
  hero.anchor(anchor);
  if (G.ballMode === 'attached') {
    ball.position.copy(anchor);
    ball.rotation.z -= dt * 6;
  } else if (G.ballMode === 'flight') {
    const f = G.flight;
    f.t += dt;
    const tp = f.target ? tmp.set(f.target.x, f.target.targetY, 0.4) : tmp.set(anchor.x + 4, 0.5, 0.4);
    if (f.t < f.out) {
      const u = f.t / f.out;
      ball.position.copy(anchor).lerp(tp, easeOut(u));
      ball.position.y += Math.sin(Math.PI * u) * 0.6;
    } else {
      if (!f.hit) {
        f.hit = true;
        if (f.target && f.kind === 'shot') { burst(f.target.x, 1.2, [0xffc93c, 0xffffff, 0xff7b54]); toast('GOAL!'); }
        else if (f.target) { burst(f.target.x, 1.2, [0x40c4ff, 0xffffff]); toast('One-two!'); }
      }
      const v = Math.min((f.t - f.out) / f.back, 1);
      ball.position.copy(tp).lerp(anchor, easeIn(v));
      ball.position.y += Math.sin(Math.PI * v) * 0.3;
      if (v >= 1) { G.ballMode = 'attached'; G.flight = null; }
    }
    ball.rotation.z -= dt * 14;
  } else if (G.ballMode === 'free') {
    ball.position.x += G.ballVel * dt; ball.position.y = 0.2;
    G.ballVel *= 0.96; ball.rotation.z -= G.ballVel * dt * 5;
  }
}

// ---------- main step ----------
function runStep(dt) {
  const pace = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 1.5 : 1;
  const speed = (BASE_SPEED + Math.min(G.distance / 150, 3.5)) * pace;
  const scrollDt = speed * dt;
  G.scroll += scrollDt; G.distance += scrollDt;

  // Apply a buffered jump/slide once the hero is running again.
  if (G.queued && hero.state === 'run') {
    if (G.clock - G.queued.t < 0.15) hero.setState(G.queued.state);
    G.queued = null;
  }
  hero.update(dt, pace);

  for (const o of G.objects) o.update(dt, scrollDt, G.clock);
  for (let i = G.objects.length - 1; i >= 0; i--) {
    if (G.objects[i].done) { scene.remove(G.objects[i].mesh); G.objects.splice(i, 1); }
  }

  // Spawn the next encounter once the last one has moved far enough in.
  const sep = Math.max(10, 16 - G.distance / 80);
  if (!G.last || G.last.done || G.last.x <= SPAWN_X - sep) spawn(nextType());

  updateBall(dt);

  const safe = G.clock < G.safeUntil;
  safeRing.visible = safe;
  if (safe) safeRing.scale.setScalar(1 + 0.1 * Math.sin(G.clock * 20));
  if (!safe) {
    const hb = hero.hb;
    for (const o of G.objects) {
      const b = o.hitbox();
      if (b && b[1] > hb.x0 && b[0] < hb.x1 && b[3] > hb.y0 && b[2] < hb.y1) { die(o); break; }
    }
  }
  ui.pace.textContent = pace > 1 ? 'PACE x1.5' : '';
}

function step(dt) {
  if (G.mode === 'paused') { renderer.render(scene, camera); return; }
  G.clock += dt;

  if (G.mode === 'ready') {
    hero.update(dt, 1); updateBall(dt);
  } else if (G.mode === 'intro') {
    G.introT += dt;
    hero.update(dt, 1); hero.anchor(anchor);
    const u = Math.min(G.introT / 0.9, 1);
    ball.position.set(anchor.x, anchor.y + (1 - u * u) * 7, anchor.z);
    ball.rotation.z -= dt * 8;
    if (u >= 1) { G.mode = 'running'; hero.setState('run'); G.ballMode = 'attached'; }
  } else if (G.mode === 'running') {
    runStep(dt);
  } else if (G.mode === 'over') {
    G.overT += dt;
    hero.update(dt, 1); updateBall(dt);
    safeRing.visible = false; ui.pace.textContent = '';
    if (G.overT > 0.8 && !ui.overlay.classList.contains('show')) {
      const d = Math.floor(G.distance);
      showOverlay(
        'Tackled!',
        `Taken out by <b>${G.cause}</b>.<br>Distance: <b>${d} m</b>${G.newBest ? ' &nbsp;(new best!)' : ''}<br>Best: <b>${Math.floor(best)} m</b>`,
        'Press Space to retry',
      );
    }
  }

  world.update(G.scroll);
  updateBits(dt);

  if (G.shake > 0) {
    camera.position.set(baseCam.x + (Math.random() - 0.5) * G.shake, baseCam.y + (Math.random() - 0.5) * G.shake, baseCam.z);
    G.shake = Math.max(0, G.shake - dt * 1.2);
  } else camera.position.copy(baseCam);

  ui.score.textContent = `${Math.floor(G.distance)} m`;
  ui.best.textContent = `Best ${Math.floor(best)} m`;
  renderer.render(scene, camera);
}

// ---------- input ----------
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.repeat) return;
  const m = G.mode;
  if (e.code === 'KeyP' || e.code === 'Escape') { togglePause(); return; }
  if (m === 'ready' || m === 'over') {
    if ((e.code === 'Space' || e.code === 'Enter') && !(m === 'over' && G.overT < 0.6)) start();
    return;
  }
  if (m === 'paused') { if (e.code === 'Space' || e.code === 'Enter') togglePause(); return; }
  if (m !== 'running') return;
  const up = e.code === 'ArrowUp' || e.code === 'KeyW', down = e.code === 'ArrowDown' || e.code === 'KeyS';
  if (up || down) {
    const s = up ? 'jump' : 'slide';
    if (hero.state === 'run') hero.setState(s); else G.queued = { state: s, t: G.clock };
  } else if (e.code === 'Space') ballAction('pass');
  else if (e.code === 'KeyF') ballAction('shot');
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode === 'running') togglePause(); });
window.addEventListener('blur', () => keys.clear());

// ---------- boot ----------
showOverlay(
  'Every Sport',
  'You are always running. Read the threat, answer it, go as far as you can.<br>' +
  '<span class="k">&uarr;</span> jump &nbsp; <span class="k">&darr;</span> slide &nbsp; <span class="k">Shift</span> pace &nbsp; ' +
  '<span class="k">Space</span> pass &nbsp; <span class="k">F</span> shoot &nbsp; <span class="k">P</span> pause',
  'Press Space to start',
);

// Test hook: lets a script advance the game without real time.
window.__game = { step, G, spawn, start, hero, ballAction, keys };

const clock = new THREE.Clock();
function frame() {
  step(Math.min(clock.getDelta(), 0.05));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
