import { THREE, COLORS, rand, pick, textTexture, addBox, mergeToMesh } from './world-utils.js';

export function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: opts.roughness ?? .82, metalness: opts.metalness ?? .04,
    envMapIntensity: opts.envMapIntensity ?? .65, ...opts
  });
}

const concreteMats = new Map();
function concrete(color) {
  if (!concreteMats.has(color)) concreteMats.set(color, mat(color, { roughness: .88 }));
  return concreteMats.get(color);
}

export function makeBuilding(w, x, z, width, depth, height, color, opts = {}) {
  const material = opts.glass
    ? new THREE.MeshStandardMaterial({ color, roughness: .22, metalness: .45, envMapIntensity: 1.1, transparent: !!opts.transparent, opacity: opts.opacity ?? .92 })
    : concrete(color);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, height / 2, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  w.scene.add(mesh);

  if (opts.roof !== false && height > 12) {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * .92, .9, depth * .92), mat(opts.roofColor || 0x5d5c58, { roughness: .9 }));
    roof.position.set(x, height + .45, z);
    roof.castShadow = true;
    w.scene.add(roof);
    if (opts.tank !== false && Math.random() < .55) {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.2, 8), mat(0x98a3a6, { roughness: .6 }));
      tank.position.set(x + rand(-width * .28, width * .28), height + 1.9, z + rand(-depth * .28, depth * .28));
      tank.castShadow = true;
      w.scene.add(tank);
    }
    if (height > 50 && Math.random() < .5) {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 8, 5), mat(0x9aa5b2, { metalness: .6, roughness: .35 }));
      ant.position.set(x, height + 4, z);
      w.scene.add(ant);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.16, 6, 5), new THREE.MeshBasicMaterial({ color: 0xff3030 }));
      bulb.position.set(x, height + 8, z);
      w.scene.add(bulb);
    }
  }

  if (opts.stripes) {
    for (let i = 0; i < opts.stripes; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(width * .02, height * .8, depth + .1), mat(opts.stripeColor || 0xdad7cb));
      s.position.set(x - width * .35 + i * width * .7 / Math.max(1, opts.stripes - 1), height * .5, z);
      s.castShadow = false;
      w.scene.add(s);
    }
  }

  if (opts.windows !== false) {
    const cols = Math.max(1, Math.floor(width / 3.2));
    const rows = Math.max(1, Math.floor((height - 3) / 3.4));
    const lit = opts.lit ?? .5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = x - width / 2 + (c + .5) * width / cols;
        const wy = 2.4 + r * 3.4;
        if (wy > height - 1.6) continue;
        if (depth > 8) {
          w.windowData.push({ x: wx, y: wy, z: z + depth / 2 + .04, ry: 0, lit });
          w.windowData.push({ x: wx, y: wy, z: z - depth / 2 - .04, ry: Math.PI, lit });
        }
        if (width > 8) {
          w.windowData.push({ x: x + width / 2 + .04, y: wy, z: z - depth / 2 + (r + .5) * depth / Math.max(1, rows), ry: Math.PI / 2, lit });
          w.windowData.push({ x: x - width / 2 - .04, y: wy, z: z - depth / 2 + (r + .5) * depth / Math.max(1, rows), ry: -Math.PI / 2, lit });
        }
      }
    }
  }

  w.addObstacle(x - width / 2, x + width / 2, z - depth / 2, z + depth / 2, height);
  return mesh;
}

export function addLabel(w, text, x, y, z, ry = 0, width = 12, height = 3, opts = {}) {
  return w.addSign(text, x, y, z, ry, width, height, opts);
}

export function addGlowSign(w, text, x, y, z, ry, width, height, color = '#ff4d5e') {
  return w.addSign(text, x, y, z, ry, width, height, {
    bg: 'rgba(4,6,12,.9)', color, font: 'bold 68px Arial', border: color, sub: 'ABERTO 24H', subColor: '#ffe2a8'
  });
}

export function makePalm(w, x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.26 * scale, .45 * scale, 7 * scale, 7), mat(0x7a5734, { roughness: .95 }));
  trunk.position.y = 3.5 * scale; trunk.castShadow = true;
  g.add(trunk);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2c8b42, roughness: .8, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(.9 * scale, 4.4 * scale, 3), leafMat);
    leaf.position.set(Math.cos(i / 7 * Math.PI * 2) * 1.6 * scale, 7.1 * scale, Math.sin(i / 7 * Math.PI * 2) * 1.6 * scale);
    leaf.rotation.z = 1.15; leaf.rotation.y = i / 7 * Math.PI * 2;
    leaf.castShadow = true;
    g.add(leaf);
  }
  g.position.set(x, 0, z);
  w.scene.add(g);
  w.addObstacle(x - .5, x + .5, z - .5, z + .5, 8);
  return g;
}

export function makeTreeInstances(w, count = 240) {
  const trunkGeo = new THREE.CylinderGeometry(.24, .36, 3.4, 5);
  const crownGeo = new THREE.IcosahedronGeometry(1.7, 0);
  const trunkMat = mat(0x5a4028, { roughness: 1 });
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x2d6a36, roughness: .9 });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, count);
  trunks.castShadow = true; crowns.castShadow = true;
  const d = new THREE.Object3D();
  const colors = [0x2d6a36, 0x387d3d, 0x255b30, 0x4b8b3e, 0x2c7a4c];
  const c = new THREE.Color();
  let n = 0;
  for (let tries = 0; tries < count * 12 && n < count; tries++) {
    let x = rand(-620, 620), z = rand(-620, 620);
    if (w.isOnRoad(x, z, 13)) continue;
    const dist = Math.hypot(x, z);
    if (dist < 160) continue;
    if (x > 560) continue;
    if (x > 260 && x < 430 && z > 250 && z < 410) continue;
    if (x > -620 && x < -360 && z > 210 && z < 500) continue;
    const s = rand(.7, 1.5);
    d.position.set(x, 1.7 * s, z); d.scale.set(s, s, s); d.rotation.y = rand(0, 6); d.updateMatrix();
    trunks.setMatrixAt(n, d.matrix);
    d.position.y = 4.3 * s; d.scale.set(s * rand(.8, 1.25), s * rand(.8, 1.2), s * rand(.8, 1.25)); d.updateMatrix();
    crowns.setMatrixAt(n, d.matrix);
    c.setHex(pick(colors)); crowns.setColorAt(n, c);
    n++;
  }
  trunks.count = n; crowns.count = n;
  trunks.instanceMatrix.needsUpdate = true; crowns.instanceMatrix.needsUpdate = true;
  if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
  w.scene.add(trunks, crowns);
  return { trunks, crowns };
}

export function makeTrafficLight(w, x, z, axis, ry = 0) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, 5.2, 6), mat(0x323a3d, { metalness: .5, roughness: .5 }));
  pole.position.y = 2.6; pole.castShadow = true; g.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(.14, .14, 3), mat(0x323a3d));
  arm.position.set(0, 5, 1.5); g.add(arm);
  const box = new THREE.Mesh(new THREE.BoxGeometry(.7, 2.1, .6), mat(0x151b1c, { roughness: .7 }));
  box.position.set(0, 4.2, 2.9); g.add(box);
  const greenMat = new THREE.MeshBasicMaterial({ color: 0x2dff7d });
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0x3a2e06 });
  const redMat = new THREE.MeshBasicMaterial({ color: 0x2a080c });
  const mk = (m, y) => { const s = new THREE.Mesh(new THREE.SphereGeometry(.17, 8, 6), m); s.position.set(0, y, 3.22); g.add(s); return s; };
  mk(redMat, 4.82); mk(yellowMat, 4.2); mk(greenMat, 3.58);
  const light = new THREE.PointLight(0x2dff7d, 1.8, 14, 2);
  light.position.set(0, 3.6, 3.4); g.add(light);
  g.position.set(x, 0, z); g.rotation.y = ry;
  w.scene.add(g);
  const tl = { axis, greenMat, yellowMat, redMat, light, group: g };
  w.trafficLights = w.trafficLights || [];
  w.trafficLights.push(tl);
  return g;
}

export function makeLamps(w) {
  const poles = [];
  const positions = [];
  for (const c of w.roadCoords) {
    for (let t = -540; t <= 540; t += 120) {
      if (Math.abs(t - c) < 14) continue;
      positions.push([t, c + 8.5], [c + 8.5, t]);
    }
  }
  positions.forEach(([x, z]) => {
    addBox(poles, .12, 6.4, .12, x, 3.2, z);
    addBox(poles, 1.2, .1, .1, x + .5, 6.4, z);
  });
  const poleMesh = mergeToMesh(poles, mat(0x353d40, { metalness: .45, roughness: .5 }), { castShadow: true });
  if (poleMesh) w.scene.add(poleMesh);

  const bulbGeo = new THREE.SphereGeometry(.22, 6, 5);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffe5a3, emissive: 0xffc35e, emissiveIntensity: 1, roughness: .5 });
  const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, positions.length);
  const d = new THREE.Object3D();
  positions.forEach(([x, z], i) => {
    d.position.set(x + 1.02, 6.32, z); d.updateMatrix(); bulbs.setMatrixAt(i, d.matrix);
  });
  bulbs.instanceMatrix.needsUpdate = true;
  w.scene.add(bulbs);
  w.lampMaterials.push(bulbMat);
}

export function makeStaticCar(w, x, z, ry, color, luxury = false) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: .75, roughness: .25, envMapIntensity: 1.2 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, .6, 4.2), bodyMat);
  body.position.y = .55; body.castShadow = true; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, .55, 1.9), new THREE.MeshStandardMaterial({ color: 0x1a2635, metalness: .4, roughness: .12, envMapIntensity: 1.4 }));
  cabin.position.set(0, 1.03, -.1); cabin.castShadow = true; g.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(.36, .36, .28, 10); wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = mat(0x111111, { roughness: .85 });
  [[-.92, 1.3], [.92, 1.3], [-.92, -1.3], [.92, -1.3]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat); wheel.position.set(wx, .36, wz); g.add(wheel);
  });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff0ba });
  [[-.62, 2.12], [.62, 2.12]].forEach(([lx, lz]) => {
    const lm = new THREE.Mesh(new THREE.BoxGeometry(.45, .16, .06), lightMat); lm.position.set(lx, .63, lz); g.add(lm);
  });
  g.position.set(x, 0, z); g.rotation.y = ry;
  w.scene.add(g);
  w.addObstacle(x - 1.2, x + 1.2, z - 2.2, z + 2.2, 1.6);
  return g;
}

export function makeDirtRoad(w, x, z, width, depth, rot = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat(0x735f45, { roughness: 1 }));
  m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.set(x, .06, z);
  m.receiveShadow = true; w.scene.add(m); return m;
}

export function makeWater(w, x, z, width, depth, color = 0x2a8fb5, y = .1) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, depth, 20, 20), new THREE.MeshStandardMaterial({
    color, metalness: .35, roughness: .12, transparent: true, opacity: .88, envMapIntensity: 1.3
  }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); w.scene.add(m); return m;
}
