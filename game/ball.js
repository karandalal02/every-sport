// A proper football: white sphere with dark pentagons and seams, drawn procedurally.
import * as THREE from 'three';
import { GRADIENT, addOutline } from './world.js';

const PHI = (1 + Math.sqrt(5)) / 2;

function norm(v) { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// Pentagon centres are the 12 icosahedron vertices; hexagon centres are its 20 face centres.
function patchCentres() {
  const verts = [];
  for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) {
    verts.push(norm([0, s1, s2 * PHI]), norm([s1, s2 * PHI, 0]), norm([s2 * PHI, 0, s1]));
  }
  const edge = 1 / Math.sqrt(5);
  const hexes = [];
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++) {
    const a = verts[i], b = verts[j], c = verts[k];
    if ([dot(a, b), dot(b, c), dot(a, c)].every((d) => Math.abs(d - edge) < 0.01)) {
      hexes.push(norm([a[0] + b[0] + c[0], a[1] + b[1] + c[1], a[2] + b[2] + c[2]]));
    }
  }
  return { pent: verts, hex: hexes };
}

function ballTexture() {
  const W = 512, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const { pent, hex } = patchCentres();
  for (let y = 0; y < H; y++) {
    const theta = ((y + 0.5) / H) * Math.PI, st = Math.sin(theta), ct = Math.cos(theta);
    for (let x = 0; x < W; x++) {
      const phi = ((x + 0.5) / W) * Math.PI * 2;
      const d = [-Math.cos(phi) * st, ct, Math.sin(phi) * st];
      let bp = -2, bh = -2, bh2 = -2;
      for (const p of pent) bp = Math.max(bp, dot(d, p));
      for (const h of hex) { const v = dot(d, h); if (v > bh) { bh2 = bh; bh = v; } else if (v > bh2) bh2 = v; }
      let r = 250, g = 250, b = 246;
      if (bp > bh) { r = 30; g = 38; b = 48; }
      else if (bp > bh - 0.014 || bh - bh2 < 0.012) { r = 120; g = 128; b = 138; }
      const i = (y * W + x) * 4;
      img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBall(radius = 0.2) {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 20),
    new THREE.MeshToonMaterial({ map: ballTexture(), gradientMap: GRADIENT }),
  );
  mesh.castShadow = true;
  group.add(mesh);
  addOutline(group, 0.014);
  return group;
}
