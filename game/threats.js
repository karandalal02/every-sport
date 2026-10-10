// Threats, passable objects and goals for the football/street zone (v1 skeleton).
// Every object: { kind, name, x, mesh, done, update(dt, scrollDt, time), hitbox() }
// x is the screen-space position along the track; the hero stands at x = 0.
import * as THREE from 'three';
import { toon, addOutline, shadows } from './world.js';

const LANE_Z = 0.4;
const basic = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });

function done(group) { addOutline(group, 0.02); shadows(group); return group; }

// ---------- chargers: wind up in view, then rush the hero ----------
class Charger {
  constructor(parts, name, o) {
    this.kind = 'threat'; this.shape = 'low';
    this.name = name; this.tip = o.tip; this.p = parts; this.o = o;
    this.mesh = parts.group; this.mesh.position.z = LANE_Z;
    this.x = 18; this.state = 'approach'; this.t = 0; this.done = false;
  }
  update(dt, scrollDt, time) {
    this.t += dt;
    const { p, o } = this;
    if (this.state === 'approach') {
      this.x -= scrollDt;
      o.approachPose(p, time);
      if (this.x <= o.stopX) { this.state = 'windup'; this.t = 0; }
    } else if (this.state === 'windup') {
      o.windupPose(p, this.t);
      if (this.t >= o.windup) { this.state = 'charge'; this.t = 0; }
    } else {
      this.x -= o.speed * dt;
      o.chargePose(p, this.t);
      if (this.x < -6) this.done = true;
    }
    this.mesh.position.x = this.x;
  }
  hitbox() {
    return this.state === 'charge' ? [this.x + this.o.hx0, this.x + this.o.hx1, 0, this.o.h] : null;
  }
}

function buildDog() {
  const group = new THREE.Group();
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
    l.position.y = -0.2; pivot.add(l); pivot.position.set(x, 0.42, z); legs.push(pivot); group.add(pivot);
  }
  group.add(body, chest, head, tail);
  done(group);
  const wrap = new THREE.Group();
  group.rotation.y = Math.PI; // faces -x, toward the hero
  wrap.add(group);
  return { group: wrap, dog: group, head, tail, legs };
}

export function makeDog() {
  const parts = buildDog();
  return new Charger(parts, 'the zoomie dog', {
    tip: 'The dog rushes in low. Jump (Up) just as it charges.',
    stopX: 7.2, windup: 0.9, speed: 13, hx0: -0.8, hx1: 0.9, h: 0.8,
    approachPose(p, t) {
      p.dog.scale.set(1, 1, 1); p.dog.position.y = Math.abs(Math.sin(t * 14)) * 0.06;
      p.legs.forEach((l, i) => (l.rotation.z = Math.sin(t * 14 + (i % 2 ? Math.PI : 0)) * 0.7));
      p.tail.rotation.y = Math.sin(t * 20) * 0.5;
    },
    windupPose(p, t) {
      p.dog.scale.set(1, 0.86, 1); p.dog.position.y = 0;
      p.head.position.y = 0.72 + Math.sin(t * 30) * 0.03;
      p.tail.rotation.y = Math.sin(t * 40) * 0.9;
      p.legs.forEach((l) => (l.rotation.z = 0));
    },
    chargePose(p, t) {
      p.dog.scale.set(1, 1, 1); p.head.position.y = 0.85;
      const run = t * 22;
      p.legs.forEach((l, i) => (l.rotation.z = Math.sin(run + (i % 2 ? Math.PI : 0)) * 0.9));
      p.dog.position.y = Math.abs(Math.sin(run)) * 0.07;
      p.tail.rotation.y = Math.sin(t * 30) * 0.7;
    },
  });
}

function buildGrandma() {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const dress = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 14), toon(0xb48bd6));
  dress.position.y = 0.65;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), toon(0xf1c9a0));
  head.position.y = 1.4;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), toon(0xf4f4f4));
  hair.position.y = 1.44;
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), toon(0xf4f4f4));
  bun.position.set(-0.12, 1.72, 0);
  const eye = (z) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), toon(0x111111)); e.position.set(0.23, 1.43, z); return e; };
  const brow = (z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.12), toon(0x555555)); b.position.set(0.24, 1.52, z); b.rotation.x = z > 0 ? 0.5 : -0.5; return b; };
  const arm = new THREE.Group();
  arm.position.set(0, 1.05, 0.3);
  const armM = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.4, 4, 6), toon(0xf1c9a0));
  armM.position.y = -0.3;
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.14), toon(0x8a4b2b));
  bag.position.y = -0.7;
  arm.add(armM, bag);
  const legA = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.18, 4, 6), toon(0xf1c9a0));
  legA.position.set(0.05, 0.12, 0.13);
  const legB = legA.clone(); legB.position.z = -0.13;
  body.add(dress, head, hair, bun, eye(0.1), eye(-0.1), brow(0.1), brow(-0.1), arm, legA, legB);
  done(group);
  const wrap = new THREE.Group();
  group.rotation.y = Math.PI; // faces -x
  wrap.add(group);
  return { group: wrap, body, arm, legs: [legA, legB] };
}

export function makeGrandma() {
  const parts = buildGrandma();
  return new Charger(parts, 'a very fast grandma', {
    tip: 'Grandma slides in low. Jump (Up) when she starts sliding.',
    stopX: 7.4, windup: 1.0, speed: 9.5, hx0: -0.6, hx1: 1.8, h: 0.7,
    approachPose(p, t) {
      p.body.rotation.z = 0; p.body.position.y = Math.abs(Math.sin(t * 9)) * 0.05; p.body.scale.set(1, 1, 1);
      p.arm.rotation.z = Math.sin(t * 9) * 0.3;
    },
    windupPose(p, t) {
      p.body.scale.set(1, 0.9, 1); p.body.rotation.z = Math.sin(t * 40) * 0.04; p.body.position.y = 0;
      p.arm.rotation.z = 2.4 + Math.sin(t * 22) * 0.25; // handbag raised overhead
    },
    chargePose(p) {
      p.body.scale.set(1, 1, 1); p.body.rotation.z = 1.25; p.body.position.y = 0.4;
      p.arm.rotation.z = 2.4;
    },
  });
}

// ---------- pigeon swarm: high threat, duck under it ----------
export function makePigeons() {
  const group = new THREE.Group();
  const birds = [];
  const offsets = [[-0.95, 1.7], [-0.5, 2.0], [-0.1, 1.45], [0.3, 1.85], [0.7, 1.35], [0.95, 2.05], [0.1, 1.2]];
  for (const [ox, oy] of offsets) {
    const b = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), toon(0x9aa3ad));
    body.scale.set(1.3, 1, 1);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), toon(0x7d8793));
    head.position.set(0.25, 0.1, 0);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 6), toon(0xf2a33a));
    beak.rotation.z = -Math.PI / 2; beak.position.set(0.38, 0.09, 0);
    const mk = (z) => {
      const w = new THREE.Group(); w.position.set(-0.02, 0.08, z);
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.34), toon(0xb8c0c9));
      m.position.z = z > 0 ? 0.17 : -0.17; w.add(m); return w;
    };
    const wl = mk(0.1), wr = mk(-0.1);
    b.add(body, head, beak, wl, wr);
    addOutline(b, 0.015);
    b.rotation.y = Math.PI; // facing -x
    b.position.set(ox, oy, (ox % 0.5) * 0.4);
    b.userData = { oy, wl, wr, ph: ox * 3 };
    birds.push(b); group.add(b);
  }
  shadows(group);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 24), basic(0x000000, 0.25));
  shadow.rotation.x = -Math.PI / 2; shadow.scale.set(1.5, 0.55, 1); shadow.position.set(0, 0.03, 0);
  const wrap = new THREE.Group(); wrap.add(group, shadow);
  wrap.position.z = LANE_Z;

  return {
    kind: 'threat', shape: 'high', name: 'a flock of pigeons', x: 18, mesh: wrap, done: false,
    tip: 'Pigeons fly high. Slide (Down) under them.',
    update(dt, scrollDt, time) {
      this.x -= scrollDt;
      wrap.position.x = this.x;
      birds.forEach((b) => {
        const f = Math.sin(time * 18 + b.userData.ph);
        b.userData.wl.rotation.x = f * 0.8; b.userData.wr.rotation.x = -f * 0.8;
        b.position.y = b.userData.oy + Math.sin(time * 5 + b.userData.ph) * 0.05;
      });
      if (this.x < -8) this.done = true;
    },
    hitbox() { return [this.x - 1.0, this.x + 1.0, 1.05, 2.4]; },
  };
}

// ---------- sprinkler: wide threat, pass off the lamp post behind it ----------
export function makeSprinkler(x = 18) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.2, 12), toon(0x4a5560));
  base.position.y = 0.1;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), toon(0x7a8794));
  pole.position.y = 0.45;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), toon(0xe05a47));
  head.position.y = 0.75;
  group.add(base, pole, head); addOutline(group, 0.02); shadows(group);
  const drops = [];
  const dropMat = basic(0x58c4f5, 0.85);
  for (let i = 0; i < 26; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), dropMat);
    d.userData = { ph: i / 26, dir: i % 2 ? 1 : -1 };
    drops.push(d); group.add(d);
  }
  group.position.z = LANE_Z;

  return {
    kind: 'threat', shape: 'wide', name: 'a surprise sprinkler', x, mesh: group, done: false,
    tip: 'You cannot jump or duck a sprinkler. Press Space to pass off the blue lamp post behind it.',
    state: 'dormant', t: 0,
    update(dt, scrollDt, time) {
      this.x -= scrollDt;
      group.position.x = this.x;
      this.t += dt;
      if (this.state === 'dormant' && this.x <= 9.5) { this.state = 'trickle'; this.t = 0; }
      else if (this.state === 'trickle' && this.t >= 0.7) { this.state = 'spray'; this.t = 0; }
      const amp = this.state === 'spray' ? 1 : this.state === 'trickle' ? 0.3 : 0;
      head.position.y = 0.75 + (this.state === 'trickle' ? Math.sin(this.t * 50) * 0.02 : 0);
      drops.forEach((d) => {
        const ph = (time * 1.6 + d.userData.ph) % 1;
        d.visible = amp > 0;
        d.position.set(d.userData.dir * ph * 1.25 * amp, 0.8 + 7.2 * amp * ph * (1 - ph), 0);
      });
      if (this.x < -4) this.done = true;
    },
    hitbox() { return this.state === 'spray' ? [this.x - 1.0, this.x + 1.0, 0, 2.5] : null; },
  };
}

// ---------- lamp post: blue = a pass bounces off it ----------
export function makeLampPost(x = 22) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3, 8), toon(0x56606b));
  pole.position.y = 1.5;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), toon(0xfff1a8));
  lamp.position.y = 3.1;
  group.add(pole, lamp); addOutline(group, 0.02); shadows(group);
  const halo = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 3.1, 14, 1, true), basic(0x40c4ff, 0.35));
  halo.position.y = 1.55;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 24), basic(0x7fdcff));
  ring.rotation.x = Math.PI / 2; ring.position.y = 1.2;
  group.add(halo, ring);
  group.position.z = LANE_Z;
  return {
    kind: 'passable', name: 'lamp post', x, mesh: group, done: false, targetY: 1.2,
    update(dt, scrollDt, time) {
      this.x -= scrollDt; group.position.x = this.x;
      const p = 0.3 + 0.12 * Math.sin(time * 6);
      halo.material.opacity = p; ring.scale.setScalar(1 + 0.08 * Math.sin(time * 6));
      if (this.x < -8) this.done = true;
    },
    hitbox() { return null; },
  };
}

// ---------- goal: glowing gold, open toward the hero, seen in profile. Shoot with F ----------
// The mouth faces -x (toward the runner) and the goal sits a little behind the running lane,
// so the hero passes in front of it instead of through it.
export function makeGoal(x = 18) {
  const group = new THREE.Group();
  const gold = basic(0xffc93c);
  const ZC = -1.2, HALF = 1.3, DEPTH = 1.6, H = 2.1, BACK_H = 1.6;
  const box = (w, h, d, px, py, pz, rz = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), gold);
    m.position.set(px, py, pz); m.rotation.z = rz; return m;
  };
  const slope = Math.atan2(H - BACK_H, DEPTH), railLen = Math.hypot(DEPTH, H - BACK_H);
  group.add(
    box(0.12, H, 0.12, 0, H / 2, ZC - HALF), box(0.12, H, 0.12, 0, H / 2, ZC + HALF),       // front posts
    box(0.12, 0.12, HALF * 2 + 0.12, 0, H, ZC),                                              // crossbar
    box(0.1, BACK_H, 0.1, DEPTH, BACK_H / 2, ZC - HALF), box(0.1, BACK_H, 0.1, DEPTH, BACK_H / 2, ZC + HALF),
    box(0.1, 0.1, HALF * 2, DEPTH, BACK_H, ZC),                                              // back bar
    box(railLen, 0.08, 0.08, DEPTH / 2, (H + BACK_H) / 2, ZC - HALF, -slope),               // top rails
    box(railLen, 0.08, 0.08, DEPTH / 2, (H + BACK_H) / 2, ZC + HALF, -slope),
  );
  const netMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.4 });
  const plane = (w, h, sx, sy) => new THREE.Mesh(new THREE.PlaneGeometry(w, h, sx, sy), netMat);
  const back = plane(HALF * 2, BACK_H, 10, 7); back.rotation.y = -Math.PI / 2; back.position.set(DEPTH, BACK_H / 2, ZC);
  const sideA = plane(DEPTH, (H + BACK_H) / 2, 6, 7); sideA.position.set(DEPTH / 2, (H + BACK_H) / 4, ZC - HALF);
  const sideB = sideA.clone(); sideB.position.z = ZC + HALF;
  const top = plane(railLen, HALF * 2, 6, 10); top.rotation.x = -Math.PI / 2;
  const topTilt = new THREE.Group(); topTilt.rotation.z = -slope; topTilt.position.set(DEPTH / 2, (H + BACK_H) / 2, ZC);
  topTilt.add(top);
  group.add(back, sideA, sideB, topTilt);
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, H), basic(0xffe27a, 0.3));
  mouth.rotation.y = -Math.PI / 2; mouth.position.set(0, H / 2, ZC);
  const glowBox = new THREE.Mesh(new THREE.BoxGeometry(DEPTH, H, HALF * 2), basic(0xffd84d, 0.1));
  glowBox.position.set(DEPTH / 2, H / 2, ZC);
  group.add(mouth, glowBox);
  return {
    kind: 'goal', name: 'goal', x, mesh: group, done: false,
    targetY: 1.0, targetZ: ZC, targetDX: 0.9, // the ball flies into the open mouth
    update(dt, scrollDt, time) {
      this.x -= scrollDt; group.position.x = this.x;
      const p = 0.5 + 0.5 * Math.sin(time * 6);
      mouth.material.opacity = 0.2 + 0.16 * p; glowBox.material.opacity = 0.06 + 0.07 * p;
      if (this.x < -8) this.done = true;
    },
    hitbox() { return null; },
  };
}
