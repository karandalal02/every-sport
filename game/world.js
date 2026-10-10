// Shared 3D setup: renderer, camera, lights, toon helpers and the scrolling street.
import * as THREE from 'three';

const SKY = 0x9fd8f5;

function makeGradient(steps = 4) {
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) data[i] = Math.round(70 + (185 * i) / (steps - 1));
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}
export const GRADIENT = makeGradient(4);
export const toon = (color) => new THREE.MeshToonMaterial({ color, gradientMap: GRADIENT });

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
export function addOutline(root, thickness = 0.02) {
  const mat = outlineMaterial(thickness);
  const targets = [];
  root.traverse((o) => { if (o.isMesh && !o.userData.isOutline) targets.push(o); });
  for (const mesh of targets) {
    const line = new THREE.Mesh(mesh.geometry, mat);
    line.userData.isOutline = true;
    mesh.add(line);
  }
}
export function shadows(root) {
  root.traverse((o) => { if (o.isMesh && !o.userData.isOutline) o.castShadow = true; });
}

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

function makeHouse(color, roofColor, w, h) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.2), toon(color));
  body.position.y = h / 2;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.78, 1.1, 4), toon(roofColor));
  roof.position.y = h + 0.55; roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 2.2 / w);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.1), toon(0x7a4a2b));
  door.position.set(0, 0.55, 1.13);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.1), toon(0xbfe6f7));
  win.position.set(w * 0.28, h * 0.62, 1.13);
  g.add(body, roof, door, win);
  addOutline(g, 0.03); shadows(g);
  return g;
}

export function createWorld(mount) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 28, 70);

  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 120);
  const baseCam = new THREE.Vector3(3.4, 3.1, 11);
  const lookAt = new THREE.Vector3(3.6, 1.1, 0);
  camera.position.copy(baseCam);
  camera.lookAt(lookAt);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9bb58c, 1.1));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sun.position.set(-5, 10, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -14, right: 22, top: 10, bottom: -6, near: 1, far: 40 });
  sun.target.position.set(4, 0, 0);
  scene.add(sun, sun.target);

  // Ground
  const roadTex = stripeTexture();
  roadTex.repeat.set(10, 1);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(80, 5), new THREE.MeshToonMaterial({ map: roadTex, gradientMap: GRADIENT }));
  road.rotation.x = -Math.PI / 2; road.position.set(10, 0, 0.6); road.receiveShadow = true;
  const front = new THREE.Mesh(new THREE.BoxGeometry(90, 0.05, 20), toon(0x5a6672));
  front.position.set(10, -0.02, 13.1); front.receiveShadow = true;
  const curb = new THREE.Mesh(new THREE.BoxGeometry(80, 0.18, 0.5), toon(0xd9d2c0));
  curb.position.set(10, 0.09, -1.95); curb.castShadow = true; curb.receiveShadow = true;
  const walk = new THREE.Mesh(new THREE.BoxGeometry(80, 0.1, 3.4), toon(0xe8dfc8));
  walk.position.set(10, 0.05, -3.9); walk.receiveShadow = true;
  const grass = new THREE.Mesh(new THREE.BoxGeometry(80, 0.06, 14), toon(0x8fc46b));
  grass.position.set(10, 0, -12); grass.receiveShadow = true;
  scene.add(road, front, curb, walk, grass);
  addOutline(curb, 0.012);

  // Parallax scenery, recycled.
  const palette = [[0xf2b880, 0xc4553a], [0xf6e7a1, 0x5f8f6b], [0xd8a7d8, 0x6b5b95], [0x9fc9e8, 0x3f6e8c], [0xf29e9e, 0x8a3b3b]];
  const rows = [
    { z: -6.5, speed: 0.9, scale: 1.0, count: 9, gap: 5.2 },
    { z: -15, speed: 0.55, scale: 1.7, count: 8, gap: 7.4 },
  ];
  const houses = [];
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
  const hills = [];
  for (let i = 0; i < 6; i++) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(6 + (i % 3) * 2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(i % 2 ? 0x7fb98a : 0x95c9a0));
    hill.position.set(-8 + i * 11, 0, -32);
    hill.userData = { base: -8 + i * 11 };
    hills.push(hill); scene.add(hill);
  }
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

  function update(scroll) {
    roadTex.offset.x = scroll / 8;
    for (const h of houses) {
      const r = h.userData.row, span = r.count * r.gap;
      h.position.x = ((h.userData.base - scroll * r.speed + 12) % span + span) % span - 12;
    }
    for (const h of hills) h.position.x = (((h.userData.base - scroll * 0.18 + 20) % 66) + 66) % 66 - 20;
    for (const t of trees) t.position.x = (((t.userData.base - scroll + 8) % 45.5) + 45.5) % 45.5 - 8;
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);

  return { renderer, scene, camera, baseCam, update };
}
