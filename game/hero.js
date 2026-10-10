// Placeholder hero with football skill moves.
// Jump = Marseille roulette (360 spin, ball circles the feet).
// Slide = knee slide with the ball rolling under the front foot.
import * as THREE from 'three';
import { toon, addOutline, shadows } from './world.js';

export const JUMP_T = 0.75;
export const SLIDE_T = 0.9;
const STAND_H = 2.1;
const SLIDE_H = 0.85;

export function createHero() {
  const group = new THREE.Group();
  group.rotation.y = Math.PI / 2; // local +z (front) points along world +x
  const rig = new THREE.Group();
  group.add(rig);

  const skin = 0xf1c27d, shorts = 0x2c3e6b;
  const jerseyMat = toon(0xe94f37);

  const upper = new THREE.Group();
  upper.position.y = 0.85;
  rig.add(upper);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.5, 6, 12), jerseyMat);
  torso.position.y = 0.3;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), toon(skin));
  head.position.y = 1.0;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.355, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), toon(0x3b2a20));
  hair.position.y = 1.03;
  upper.add(torso, head, hair);

  const limb = (color, len, r) => {
    const pivot = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 8), toon(color));
    m.position.y = -(len / 2 + r);
    pivot.add(m);
    return pivot;
  };
  const armL = limb(skin, 0.4, 0.09), armR = limb(skin, 0.4, 0.09);
  armL.position.set(-0.36, 0.55, 0); armR.position.set(0.36, 0.55, 0);
  upper.add(armL, armR);
  const legL = limb(shorts, 0.5, 0.12), legR = limb(shorts, 0.5, 0.12);
  legL.position.set(-0.13, 0.85, 0); legR.position.set(0.13, 0.85, 0);
  rig.add(legL, legR);

  addOutline(rig, 0.022);
  shadows(rig);

  const hero = {
    group, rig, jerseyMat,
    state: 'idle', st: 0, phase: 0,
    ballLocal: new THREE.Vector3(0, 0.2, 0.6),
    hb: { x0: -0.32, x1: 0.32, y0: 0, y1: STAND_H },

    setState(s) {
      if (hero.state === s) return;
      hero.state = s; hero.st = 0;
    },
    setKit(hex) { jerseyMat.color.set(hex); },

    // World position of the ball when it is at the hero's feet.
    anchor(out) {
      group.updateMatrixWorld(true);
      return rig.localToWorld(out.copy(hero.ballLocal));
    },

    update(dt, pace = 1) {
      hero.st += dt;
      const s = hero.state;
      for (const o of [upper, rig, armL, armR, legL, legR]) o.rotation.set(0, 0, 0);
      rig.scale.set(1, 1, 1);
      const bl = hero.ballLocal;
      let y = 0, feet = 0, top = STAND_H;

      if (s === 'run') {
        hero.phase += dt * 11 * (pace > 1 ? 1.3 : 1);
        const w = hero.phase, sw = Math.sin(w);
        legL.rotation.x = sw * 0.9; legR.rotation.x = -sw * 0.9;
        armL.rotation.x = -sw * 0.8; armR.rotation.x = sw * 0.8;
        upper.rotation.z = sw * 0.05;
        y = Math.abs(sw) * 0.06; feet = y; top = STAND_H + y;
        bl.set(0, 0.2 + Math.abs(sw) * 0.16, 0.62 + sw * 0.12);
      } else if (s === 'idle') {
        bl.set(0, 0.2, 0.6);
        armL.rotation.z = -0.1; armR.rotation.z = 0.1;
      } else if (s === 'jump') {
        const u = Math.min(hero.st / JUMP_T, 1), arc = Math.sin(Math.PI * u);
        y = arc * 1.5; feet = y; top = y + STAND_H;
        rig.rotation.y = u * Math.PI * 2; // roulette spin, the ball orbits the feet
        legL.rotation.x = -0.9; legR.rotation.x = 0.4;
        armL.rotation.z = -1.1; armR.rotation.z = 1.1;
        upper.rotation.x = 0.12;
        const sq = 1 + arc * 0.06; rig.scale.set(1 / sq, sq, 1 / sq);
        bl.set(0, 0.25 + arc * 0.35, 0.62);
        if (u >= 1) hero.setState('run');
      } else if (s === 'slide') {
        const u = Math.min(hero.st / SLIDE_T, 1);
        const e = Math.max(0, Math.min(1, u / 0.12, (1 - u) / 0.12));
        y = -0.5 * e; feet = 0;
        top = STAND_H - (STAND_H - SLIDE_H) * e;
        upper.rotation.x = -0.95 * e;
        legL.rotation.x = -1.5 * e; legR.rotation.x = -1.35 * e;
        armL.rotation.x = -1.2 * e; armR.rotation.x = -1.2 * e;
        bl.set(0, 0.2, 0.95 + Math.sin(u * Math.PI * 2) * 0.25 * e);
        if (u >= 1) hero.setState('run');
      } else if (s === 'fall') {
        const u = Math.min(hero.st / 0.9, 1);
        rig.rotation.x = -Math.min(u / 0.35, 1) * 1.45;
        const fl = Math.sin(hero.st * 20) * 0.8 * (1 - u);
        armL.rotation.x = fl; armR.rotation.x = -fl;
        legL.rotation.x = -fl * 0.5; legR.rotation.x = fl * 0.5;
        feet = 0; top = 0.5;
        bl.set(0, 0.2, 0.9);
      }

      rig.position.y = y;
      hero.hb.y0 = feet; hero.hb.y1 = top;
    },
  };
  return hero;
}
