import * as THREE from 'three';

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (v - a) / (b - a);
export const smooth = (a, b, v) => { const t = clamp(invLerp(a, b, v), 0, 1); return t * t * (3 - 2 * t); };
export const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));
export const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const angleLerp = (a, b, t) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

export function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rand = mulberry32(62026);
export const pick = (arr) => arr[Math.floor(rand() * arr.length)];

export function makeCanvas(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

export function textureFromCanvas(canvas, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 4;
  return tex;
}

export function noiseTexture(size, base, spots, alpha = 0.15, repeatX = 1, repeatY = 1) {
  const c = makeCanvas(size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 5000; i++) {
    const x = rand() * size, y = rand() * size, r = rand() * 2.2;
    ctx.fillStyle = spots[Math.floor(rand() * spots.length)];
    ctx.globalAlpha = rand() * alpha;
    ctx.fillRect(x, y, r, r);
  }
  ctx.globalAlpha = 1;
  return textureFromCanvas(c, repeatX, repeatY);
}

export function makeRadialTexture(inner = '#fff7d6', outer = 'rgba(255,255,255,0)') {
  const c = makeCanvas(256);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, inner);
  g.addColorStop(.18, inner);
  g.addColorStop(.5, outer);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeSoftShadowTexture() {
  const c = makeCanvas(128);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,.55)');
  g.addColorStop(.55, 'rgba(0,0,0,.28)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function addShadowBlob(parent, size = 1.2) {
  const mat = new THREE.MeshBasicMaterial({ map: makeSoftShadowTexture(), transparent: true, depthWrite: false, opacity: .7 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  mesh.renderOrder = 1;
  parent.add(mesh);
  return mesh;
}

export function makeTextTexture(lines, opts = {}) {
  const {
    width = 1024, height = 512, bg = '#0a1a1c', color = '#f6c768',
    font = '700 100px "Barlow Condensed", sans-serif', sub = '', subFont = '500 34px Outfit, sans-serif',
    accent = '#ff7058', align = 'left', padding = 70, textureRepeat = false
  } = opts;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
  if (opts.gradient) {
    const g = ctx.createLinearGradient(0, 0, width, height);
    opts.gradient.forEach((col, i) => g.addColorStop(i / (opts.gradient.length - 1), col));
    ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = accent;
  ctx.fillRect(padding, padding, 72, 7);
  ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.fillStyle = color; ctx.font = font;
  const arr = Array.isArray(lines) ? lines : [lines];
  arr.forEach((line, i) => ctx.fillText(line, align === 'center' ? width / 2 : padding, padding + 50 + i * (parseInt(font.match(/(\d+)px/)?.[1] || 100) * 1.02)));
  if (sub) {
    ctx.font = subFont; ctx.fillStyle = opts.subColor || 'rgba(255,255,255,.62)';
    ctx.fillText(sub, align === 'center' ? width / 2 : padding, height - padding - 48);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = textureRepeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  return tex;
}

export function formatMoney(value) {
  return 'R$ ' + Math.round(value).toLocaleString('pt-BR');
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function makeBillboard(scene, texture, { x, y, z, w = 14, h = 7, rotY = 0, frameColor = 0x132326 }) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + .5, h + .5, .34), new THREE.MeshStandardMaterial({ color: frameColor, roughness: .7, metalness: .35 }));
  frame.castShadow = true;
  group.add(frame);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
  screen.position.z = .19;
  group.add(screen);
  const glow = new THREE.PointLight(0xffc06a, 1.2, 26, 2);
  glow.position.set(0, 0, 2.5);
  group.add(glow);
  scene.add(group);
  return group;
}

export function createInstanced(geometry, material, count) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return mesh;
}

export function setInstance(mesh, index, pos, scale, rot, color) {
  const d = new THREE.Object3D();
  d.position.set(pos.x, pos.y, pos.z);
  d.scale.set(scale.x, scale.y, scale.z);
  d.rotation.set(rot?.x || 0, rot?.y || 0, rot?.z || 0);
  d.updateMatrix();
  mesh.setMatrixAt(index, d.matrix);
  if (color) mesh.setColorAt(index, color);
}

export function createTracer(scene) {
  const mat = new THREE.LineBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false });
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const line = new THREE.Line(geo, mat);
  line.visible = false;
  line.frustumCulled = false;
  scene.add(line);
  return {
    line,
    fire(from, to, color = 0xffe2a0) {
      const positions = line.geometry.attributes.position;
      positions.setXYZ(0, from.x, from.y, from.z);
      positions.setXYZ(1, to.x, to.y, to.z);
      positions.needsUpdate = true;
      mat.color.setHex(color);
      mat.opacity = .9;
      line.visible = true;
    },
    update(dt) {
      if (!line.visible) return;
      mat.opacity -= dt * 11;
      if (mat.opacity <= 0) line.visible = false;
    }
  };
}

export function pointInRect(x, z, r) {
  return x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ;
}

export function rayToPointDistance(origin, dir, point) {
  const v = new THREE.Vector3().subVectors(point, origin);
  const t = v.dot(dir);
  if (t <= 0) return Infinity;
  const p = origin.clone().addScaledVector(dir, t);
  return p.distanceTo(point);
}
