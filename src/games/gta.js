import * as THREE from 'three';
import { createGameShell, createJoystick, bindLook, bindHold, isTouchDevice, clamp } from '../core/gameShell.js';
import { audio } from '../core/audio.js';

const WORLD = 2000;
const ROAD = 200;
const MAP_SIZE = 2048;

function makeWindowTexture(base, lit, cols = 8, rows = 16) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, 128, 256);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const on = Math.random() < 0.32;
      ctx.fillStyle = on ? lit : '#0b0e15';
      ctx.globalAlpha = on ? 0.7 + Math.random() * 0.3 : 1;
      ctx.fillRect(5 + x * 15.2, 5 + y * 15.2, 8.5, 8);
    }
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeCityTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = MAP_SIZE;
  const ctx = c.getContext('2d');
  const s = MAP_SIZE / (WORLD * 2);
  const px = (v) => (v + WORLD) * s;
  ctx.fillStyle = '#0c0f17'; ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
  // city blocks
  const parks = new Set(['-3,2', '4,-3', '2,4', '-5,-4', '6,5', '-7,6']);
  for (let bx = -10; bx < 10; bx++) {
    for (let bz = -10; bz < 10; bz++) {
      const x0 = bx * ROAD + 32;
      const z0 = bz * ROAD + 32;
      const w = ROAD - 64;
      const isPark = parks.has(`${bx},${bz}`);
      ctx.fillStyle = isPark ? '#102419' : '#171b25';
      ctx.fillRect(px(x0), px(z0), w * s, w * s);
      ctx.strokeStyle = isPark ? '#1d3b28' : '#242a38';
      ctx.lineWidth = 2;
      ctx.strokeRect(px(x0), px(z0), w * s, w * s);
      if (isPark) {
        ctx.fillStyle = '#1d3b28';
        for (let i = 0; i < 9; i++) {
          const tx = x0 + 10 + Math.random() * (w - 20);
          const tz = z0 + 10 + Math.random() * (w - 20);
          ctx.beginPath(); ctx.arc(px(tx), px(tz), 3 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        // lot seams
        ctx.strokeStyle = 'rgba(255,255,255,.035)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px(x0 + w / 2), px(z0)); ctx.lineTo(px(x0 + w / 2), px(z0 + w));
        ctx.moveTo(px(x0), px(z0 + w / 2)); ctx.lineTo(px(x0 + w), px(z0 + w / 2));
        ctx.stroke();
      }
    }
  }
  // roads
  for (let k = -10; k <= 10; k++) {
    const p = px(k * ROAD);
    ctx.fillStyle = '#080a0f';
    ctx.fillRect(p - 32 * s, 0, 64 * s, MAP_SIZE);
    ctx.fillRect(0, p - 32 * s, MAP_SIZE, 64 * s);
    ctx.strokeStyle = '#222735';
    ctx.lineWidth = 1;
    ctx.strokeRect(p - 32 * s, 0, 64 * s, MAP_SIZE);
    ctx.strokeRect(0, p - 32 * s, MAP_SIZE, 64 * s);
    // center dashes
    ctx.strokeStyle = '#b59a46';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([9, 15]);
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, MAP_SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(MAP_SIZE, p); ctx.stroke();
    ctx.setLineDash([]);
    // crosswalks at intersections
    ctx.strokeStyle = 'rgba(220,225,240,.18)';
    ctx.lineWidth = 1;
    for (let q = -10; q <= 10; q++) {
      const ip = px(q * ROAD);
      for (let z = 0; z < 4; z++) {
        ctx.beginPath(); ctx.moveTo(p - 22 * s + z * 12 * s, ip - 35 * s); ctx.lineTo(p - 22 * s + z * 12 * s, ip - 25 * s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ip - 22 * s + z * 12 * s, p - 35 * s); ctx.lineTo(ip - 22 * s + z * 12 * s, p - 25 * s); ctx.stroke();
      }
    }
  }
  // road wear
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.02})`;
    ctx.fillRect(Math.random() * MAP_SIZE, Math.random() * MAP_SIZE, 1, 1);
  }
  // water / river
  ctx.strokeStyle = '#0b2740';
  ctx.lineWidth = 60 * s;
  ctx.beginPath();
  ctx.moveTo(0, px(1300));
  ctx.bezierCurveTo(px(-500), px(900), px(500), px(-1200), MAP_SIZE, px(-1500));
  ctx.stroke();
  ctx.strokeStyle = 'rgba(70,170,220,.16)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // big map label
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#d9e6ff';
  ctx.font = '900 90px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('LIBERTY CITY', MAP_SIZE / 2, MAP_SIZE / 2 + 25);
  ctx.font = '700 24px Arial';
  ctx.fillText('16 KM²', MAP_SIZE / 2, MAP_SIZE / 2 + 65);
  ctx.restore();
  return c;
}

function makeSignTexture(text, color = '#ff5fa2') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 160;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#07070b'; ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.strokeRect(8, 8, 496, 144);
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 26;
  ctx.font = '900 82px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 86);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return a + d * t;
}

export async function mount({ root, game, onExit }) {
  const shell = createGameShell({
    root, game, onExit,
    controls: '<b>WASD</b> mover · <b>Mouse arrastar</b> câmera · <b>E</b> entrar/sair do carro · <b>Shift</b> correr · <b>F</b> socar · <b>M</b> mapa · <b>Esc</b> pausar',
  });
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  shell.canvasWrap.appendChild(canvas);
  const hud = shell.hud;
  const touch = isTouchDevice();
  hud.innerHTML = `
    ${touch ? '<div class="look-zone"></div>' : ''}
    <div class="gta-mission">
      <div class="gta-mission-top"><span id="gta-mission-num">MISSÃO 01</span><span class="gta-city">LIBERTY CITY</span></div>
      <h3 id="gta-mission-title">Entrega Expressa</h3>
      <p id="gta-mission-desc">Vá até o ponto amarelo no minimapa.</p>
      <div class="gta-mission-foot"><span id="gta-mission-dist">— m</span><span id="gta-mission-timer"></span></div>
    </div>
    <div class="gta-status">
      <div class="gta-wanted" id="gta-wanted"><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div>
      <div class="gta-money" id="gta-money">$ 00000500</div>
      <div class="gta-health"><span>VIDA</span><div><i id="gta-health-fill"></i></div><b id="gta-health-num">100</b></div>
      <div class="gta-area">LIBERTY CITY · 16 KM²</div>
    </div>
    <div class="gta-minimap-wrap">
      <canvas id="gta-minimap" width="220" height="220"></canvas>
      <span class="gta-north">N</span>
      <div class="gta-map-label">LIBERTY CITY<small>16 KM²</small></div>
    </div>
    <div class="gta-speedo" id="gta-speedo"><span id="gta-gear">A PÉ</span><b id="gta-speed">0</b><small id="gta-speed-unit">KM/H</small><div><i id="gta-speed-bar"></i></div></div>
    <div class="gta-notify" id="gta-notify"></div>
    <div class="gta-damage" id="gta-damage"></div>
    <div class="gta-hint desktop-only"><kbd>E</kbd> Roubar carro <kbd>M</kbd> Mapa <kbd>F</kbd> Soco</div>
    <div class="gta-fullmap" id="gta-fullmap">
      <div class="gta-fullmap-head"><div><span>MAPA DA CIDADE</span><h2>LIBERTY CITY</h2></div><div><b>16 KM²</b><small>4000 × 4000 METROS</small></div><button id="gta-fullmap-close">✕</button></div>
      <div class="gta-fullmap-body"><canvas id="gta-map-canvas" width="900" height="900"></canvas><div class="gta-legend"><span><i class="you"></i> Você</span><span><i class="mission"></i> Missão</span><span><i class="police"></i> Polícia</span><span><i class="road"></i> Ruas</span></div></div>
    </div>
    <div class="gta-wasted" id="gta-wasted"><span>WASTED</span><small>Você foi nocauteado. Voltando ao hospital...</small></div>
    <div class="gta-touch touch-ui ${touch ? 'active' : ''}">
      <div class="joystick"><i></i></div>
      <div class="touch-right">
        <button class="touch-btn big b1" data-touch="enter">CARRO</button>
        <button class="touch-btn b4" data-touch="run">CORRER</button>
        <button class="touch-btn b2" data-touch="map">MAPA</button>
        <button class="touch-btn b3" data-touch="punch">SOCO</button>
      </div>
    </div>`;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080b16);
  scene.fog = new THREE.FogExp2(0x0a1020, 0.00115);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 5000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const cityCanvas = makeCityTexture();
  const cityTex = new THREE.CanvasTexture(cityCanvas);
  cityTex.colorSpace = THREE.SRGBColorSpace;
  cityTex.anisotropy = 8;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD * 2, WORLD * 2), new THREE.MeshStandardMaterial({ map: cityTex, roughness: 0.93, metalness: 0.05 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Sky
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { top: { value: new THREE.Color(0x05071a) }, horizon: { value: new THREE.Color(0x3d1e45) }, bottom: { value: new THREE.Color(0x0b0d18) } },
    vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; varying vec3 vP; void main(){ float h=normalize(vP).y; vec3 c=mix(horizon,top,smoothstep(0.0,0.55,h)); c=mix(bottom,c,smoothstep(-0.25,0.05,h)); gl_FragColor=vec4(c,1.0); }',
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(3500, 24, 16), skyMat));
  const moon = new THREE.Mesh(new THREE.CircleGeometry(90, 32), new THREE.MeshBasicMaterial({ color: 0xdfe8ff, fog: false }));
  moon.position.set(-1200, 900, -1800);
  moon.lookAt(0, 0, 0);
  scene.add(moon);
  const starsGeo = new THREE.BufferGeometry();
  const starPos = [];
  for (let i = 0; i < 900; i++) {
    const r = 3000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.42;
    starPos.push(Math.cos(theta) * Math.sin(phi) * r, Math.cos(phi) * r, Math.sin(theta) * Math.sin(phi) * r);
  }
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xbcd4ff, size: 3, transparent: true, opacity: 0.7, fog: false })));

  scene.add(new THREE.HemisphereLight(0x9db8e8, 0x1d1822, 1.35));
  const moonLight = new THREE.DirectionalLight(0xa9c1ff, 1.85);
  moonLight.position.set(-600, 800, -300);
  scene.add(moonLight);
  const cityFill = new THREE.DirectionalLight(0x9fb8e8, 1.05);
  cityFill.position.set(0, 240, 120);
  scene.add(cityFill);
  const warmAmbient = new THREE.PointLight(0xff9d58, 1.1, 900, 2);
  warmAmbient.position.set(0, 80, 0);
  scene.add(warmAmbient);
  const playerFill = new THREE.PointLight(0xc6d8ff, 22, 90, 1.5);
  playerFill.position.set(0, 7, 8);
  scene.add(playerFill);

  // Buildings
  const buildings = [];
  const variants = [
    { tex: makeWindowTexture('#141824', '#ffd58f') },
    { tex: makeWindowTexture('#171521', '#9fd7ff') },
    { tex: makeWindowTexture('#11151d', '#ffae72') },
    { tex: makeWindowTexture('#1b1822', '#d4c2ff') },
  ];
  const buildingGroups = variants.map((v) => ({
    list: [],
    mat: new THREE.MeshStandardMaterial({ map: v.tex, emissiveMap: v.tex, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.82, metalness: 0.12 }),
  }));
  const rng = (() => { let a = 1337; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();
  const parks = new Set(['-3,2', '4,-3', '2,4', '-5,-4', '6,5', '-7,6']);
  const lotOffsets = [-36, 36];
  for (let bx = -10; bx < 10; bx++) {
    for (let bz = -10; bz < 10; bz++) {
      if (parks.has(`${bx},${bz}`)) continue;
      const cx = bx * ROAD + 100;
      const cz = bz * ROAD + 100;
      lotOffsets.forEach((ox) => {
        lotOffsets.forEach((oz) => {
          if (rng() < 0.12) return;
          const w = 40 + rng() * 16;
          const d = 40 + rng() * 16;
          const h = 22 + Math.pow(rng(), 1.7) * 125;
          const x = cx + ox + (rng() - 0.5) * 4;
          const z = cz + oz + (rng() - 0.5) * 4;
          const b = { x, z, w, d, h };
          buildings.push(b);
          const vi = Math.floor(rng() * variants.length);
          buildingGroups[vi].list.push(b);
        });
      });
    }
  }
  const dummy = new THREE.Object3D();
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0c0f16, roughness: 0.9 });
  const roofs = [];
  buildingGroups.forEach((group) => {
    if (!group.list.length) return;
    const mesh = new THREE.InstancedMesh(boxGeo, group.mat, group.list.length);
    group.list.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      roofs.push(b);
    });
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
  });
  const roofMesh = new THREE.InstancedMesh(boxGeo, roofMat, roofs.length);
  roofs.forEach((b, i) => {
    dummy.position.set(b.x, b.h + 0.8, b.z);
    dummy.scale.set(b.w + 1.5, 1.6, b.d + 1.5);
    dummy.updateMatrix();
    roofMesh.setMatrixAt(i, dummy.matrix);
  });
  scene.add(roofMesh);

  // Roof details / antennas
  const antennaMat = new THREE.MeshBasicMaterial({ color: 0x2b3447 });
  const antennaGeo = new THREE.CylinderGeometry(0.4, 0.4, 14, 4);
  const antennaMesh = new THREE.InstancedMesh(antennaGeo, antennaMat, Math.min(120, roofs.length));
  for (let i = 0; i < antennaMesh.count; i++) {
    const b = roofs[Math.floor(rng() * roofs.length)];
    dummy.position.set(b.x + (rng() - 0.5) * b.w * 0.5, b.h + 8, b.z + (rng() - 0.5) * b.d * 0.5);
    dummy.scale.set(1, 1 + rng() * 1.5, 1);
    dummy.updateMatrix();
    antennaMesh.setMatrixAt(i, dummy.matrix);
  }
  scene.add(antennaMesh);

  // Neon signs
  const signWords = ['HOTEL', '24H', 'LIBERTY', 'BAR', 'CLUB', 'PIZZA', 'PAWN', 'MOTEL', 'TACOS', 'GARAGE', 'LIQUOR', 'DINER'];
  const signColors = ['#ff5fa2', '#5de8ff', '#ffd84f', '#9b6bff', '#4dffa6'];
  const nearBuildings = buildings.filter((b) => Math.abs(b.x) < 1200 && Math.abs(b.z) < 1200).slice(0, 120);
  signWords.forEach((word, i) => {
    if (!nearBuildings.length) return;
    const b = nearBuildings[Math.floor(rng() * nearBuildings.length)];
    const color = signColors[i % signColors.length];
    const tex = makeSignTexture(word, color);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.8), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
    sign.position.set(b.x, Math.min(b.h - 5, 10 + rng() * 20), b.z + b.d / 2 + 0.15);
    scene.add(sign);
    const light = new THREE.PointLight(new THREE.Color(color), 1.5, 60, 2);
    light.position.set(b.x, sign.position.y, b.z + b.d / 2 + 5);
    scene.add(light);
  });

  // Streetlight poles and warm glow points
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x151a24, roughness: 0.8 });
  const poleGeo = new THREE.CylinderGeometry(0.22, 0.3, 9, 6);
  const poles = [];
  for (let x = -1900; x <= 1900; x += 400) for (let z = -1900; z <= 1900; z += 400) poles.push([x + 38, z + 38]);
  const poleMesh = new THREE.InstancedMesh(poleGeo, poleMat, poles.length);
  poles.forEach((p, i) => { dummy.position.set(p[0], 4.5, p[1]); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); poleMesh.setMatrixAt(i, dummy.matrix); });
  scene.add(poleMesh);
  const bulbGeo = new THREE.SphereGeometry(0.55, 8, 6);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd99b });
  const bulbMesh = new THREE.InstancedMesh(bulbGeo, bulbMat, poles.length);
  poles.forEach((p, i) => { dummy.position.set(p[0], 9.2, p[1]); dummy.updateMatrix(); bulbMesh.setMatrixAt(i, dummy.matrix); });
  scene.add(bulbMesh);
  const glowPositions = new Float32Array(poles.length * 3);
  poles.forEach((p, i) => { glowPositions[i * 3] = p[0]; glowPositions[i * 3 + 1] = 9.2; glowPositions[i * 3 + 2] = p[1]; });
  const glowGeo = new THREE.BufferGeometry();
  glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));
  scene.add(new THREE.Points(glowGeo, new THREE.PointsMaterial({ color: 0xffc77a, size: 12, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending })));

  // Cars
  const carBodyGeo = new THREE.BoxGeometry(4.2, 0.9, 8.2);
  const carCabinGeo = new THREE.BoxGeometry(3.4, 0.85, 3.8);
  const wheelGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.5, 12);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x090a0e, roughness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x14243a, roughness: 0.15, metalness: 0.8 });
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff1bd });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2b3d });
  const policeLightBlue = new THREE.MeshBasicMaterial({ color: 0x2f7bff });
  const policeLightRed = new THREE.MeshBasicMaterial({ color: 0xff2c4f });

  function createCar(color, police = false) {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.72 });
    const body = new THREE.Mesh(carBodyGeo, bodyMat); body.position.y = 0.9; body.castShadow = true; g.add(body);
    const cabin = new THREE.Mesh(carCabinGeo, glassMat); cabin.position.set(0, 1.65, -0.3); cabin.castShadow = true; g.add(cabin);
    if (police) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.24, 0.28, 3.6), new THREE.MeshStandardMaterial({ color: 0x0a0d13, roughness: 0.5 }));
      stripe.position.set(0, 0.98, 0.3); g.add(stripe);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.45), new THREE.MeshBasicMaterial({ color: 0x1a1d26 }));
      bar.position.set(0, 2.15, -0.3); g.add(bar);
      const blue = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 0.5), policeLightBlue); blue.position.set(-0.65, 2.25, -0.3); g.add(blue);
      const red = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 0.5), policeLightRed); red.position.set(0.65, 2.25, -0.3); g.add(red);
      g.userData.siren = { blue, red };
    }
    for (const sx of [-1.45, 1.45]) for (const sz of [-2.65, 2.65]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(sx, 0.58, sz);
      g.add(wheel);
    }
    const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.28, 0.12), headMat); h1.position.set(-1.3, 0.9, 4.12); g.add(h1);
    const h2 = h1.clone(); h2.position.x = 1.3; g.add(h2);
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.24, 0.1), tailMat); t1.position.set(-1.35, 0.95, -4.12); g.add(t1);
    const t2 = t1.clone(); t2.position.x = 1.35; g.add(t2);
    return g;
  }

  const parked = [];
  const parkedSpecs = [
    [0, 16, 0, 0xcf3e4b], [70, 0, Math.PI / 2, 0x3b73d1], [-70, 0, Math.PI / 2, 0xd8c44a],
    [200, 150, Math.PI / 2, 0x8a52c4], [-400, 100, 0, 0x2f9e6b], [600, -40, Math.PI / 2, 0xc98a3b],
    [0, -600, 0, 0x445c74], [-800, 600, Math.PI / 2, 0xb53a6a], [400, 0, 0, 0x2f8f9e],
    [-200, -400, 0, 0x7b3d3d], [900, 600, Math.PI / 2, 0x4c6f39], [-1000, -800, 0, 0x8c8f9e],
    [1400, 200, Math.PI / 2, 0x3d5a8c], [-600, 1000, 0, 0x9c4a2d],
  ];
  parkedSpecs.forEach(([x, z, a, color]) => {
    const g = createCar(color);
    g.position.set(x, 0, z);
    g.rotation.y = a;
    scene.add(g);
    parked.push({ group: g, x, z, angle: a, speed: 0, isPolice: false, color });
  });

  // Traffic
  const traffic = [];
  for (let i = 0; i < 9; i++) {
    const axis = i % 2 ? 'x' : 'z';
    const dir = i % 4 < 2 ? 1 : -1;
    const lane = (Math.floor(rng() * 9) - 4) * ROAD;
    const color = [0xb8c2d6, 0x5a6a85, 0x87443d, 0x3b6b5a][i % 4];
    const g = createCar(color);
    scene.add(g);
    traffic.push({ group: g, axis, dir, lane, pos: (rng() - 0.5) * 3000, speed: 22 + rng() * 28 });
  }

  const playerHeadlight = new THREE.SpotLight(0xffe6b0, 12, 130, 0.46, 0.55, 1.4);
  playerHeadlight.visible = false;
  scene.add(playerHeadlight, playerHeadlight.target);

  // Police
  const policeCars = [];
  for (let i = 0; i < 6; i++) {
    const g = createCar(0xe9eef7, true);
    g.visible = false;
    scene.add(g);
    policeCars.push({ group: g, x: 0, z: 0, angle: 0, active: false, shoot: 0 });
  }

  // Pedestrians
  const peds = [];
  const pedColors = [0xd45b6a, 0x5b8fd4, 0xd4b65b, 0x6b5bd4, 0x5bd49a, 0xd47a5b];
  function createPed(x, z) {
    const g = new THREE.Group();
    const shirt = new THREE.MeshStandardMaterial({ color: pedColors[Math.floor(rng() * pedColors.length)], roughness: 0.8 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xb9825e, roughness: 0.9 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.7, 0.7), shirt); body.position.y = 1.75; body.castShadow = true; g.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), skin); head.position.y = 2.95; head.castShadow = true; g.add(head);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.2, 0.5), new THREE.MeshStandardMaterial({ color: 0x22283a })); legL.position.set(-0.35, 0.6, 0); g.add(legL);
    const legR = legL.clone(); legR.position.x = 0.35; g.add(legR);
    g.position.set(x, 0, z);
    scene.add(g);
    return { group: g, legL, legR, x, z, angle: rng() * Math.PI * 2, phase: rng() * 10, alive: true, respawn: 0, homeX: x, homeZ: z };
  }
  for (let i = 0; i < 34; i++) {
    const bx = (Math.floor(rng() * 18) - 9) * ROAD + 100;
    const bz = (Math.floor(rng() * 18) - 9) * ROAD + 100;
    const x = bx + (rng() < 0.5 ? -72 : 72);
    const z = bz + (rng() - 0.5) * 90;
    peds.push(createPed(x, z));
  }

  // Player
  const player = { x: 0, z: 8, y: 0, angle: 0, speed: 0, health: 100, money: 500, inCar: null, punch: 0, damageFlash: 0 };
  let crouching = false;
  const playerGroup = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xb9825e, roughness: 0.8 });
  const jacketMat = new THREE.MeshStandardMaterial({ color: 0x243c5f, roughness: 0.7 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1a1f2c, roughness: 0.8 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.8, 0.8), jacketMat); torso.position.y = 1.8; torso.castShadow = true; playerGroup.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), skinMat); head.position.y = 3.05; head.castShadow = true; playerGroup.add(head);
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.9), new THREE.MeshStandardMaterial({ color: 0x17120f })); hair.position.y = 3.5; playerGroup.add(hair);
  const legLP = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.25, 0.55), pantsMat); legLP.position.set(-0.4, 0.65, 0); playerGroup.add(legLP);
  const legRP = legLP.clone(); legRP.position.x = 0.4; playerGroup.add(legRP);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.45, 0.45), jacketMat); armL.position.set(-0.98, 1.85, 0); playerGroup.add(armL);
  const armR = armL.clone(); armR.position.x = 0.98; playerGroup.add(armR);
  scene.add(playerGroup);
  playerGroup.position.set(player.x, 0, player.z);

  // Mission marker
  const marker = new THREE.Group();
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xffd84a, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 70, 32, 1, true), beamMat);
  beam.position.y = 35;
  marker.add(beam);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(19, 1.2, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffd84a }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.6; marker.add(ring);
  const markerLight = new THREE.PointLight(0xffcf4a, 3, 120, 2); markerLight.position.y = 12; marker.add(markerLight);
  marker.visible = false;
  scene.add(marker);

  // HUD refs
  const el = {
    missionNum: $('#gta-mission-num', hud), missionTitle: $('#gta-mission-title', hud), missionDesc: $('#gta-mission-desc', hud),
    missionDist: $('#gta-mission-dist', hud), missionTimer: $('#gta-mission-timer', hud),
    wanted: $$('#gta-wanted span', hud), wantedBox: $('#gta-wanted', hud), money: $('#gta-money', hud), healthFill: $('#gta-health-fill', hud), healthNum: $('#gta-health-num', hud),
    speed: $('#gta-speed', hud), gear: $('#gta-gear', hud), speedBar: $('#gta-speed-bar', hud), notify: $('#gta-notify', hud),
    damage: $('#gta-damage', hud), wasted: $('#gta-wasted', hud), fullmap: $('#gta-fullmap', hud),
  };
  const minimap = $('#gta-minimap', hud);
  const mctx = minimap.getContext('2d');
  const mapCanvas = $('#gta-map-canvas', hud);
  const mapCtx = mapCanvas.getContext('2d');

  const keys = new Set();
  const joystick = touch ? createJoystick($('.joystick', hud)) : { x: 0, y: 0 };
  const touchState = { run: false, map: false, enter: false, punch: false };
  if (touch) {
    bindHold($('[data-touch="run"]', hud), (v) => { touchState.run = v; });
    bindHold($('[data-touch="enter"]', hud), (v) => { if (v) toggleCar(); });
    bindHold($('[data-touch="punch"]', hud), (v) => { if (v) punch(); });
    bindHold($('[data-touch="map"]', hud), (v) => { if (v) toggleMap(); });
  }
  bindLook($('.look-zone', hud), (dx, dy) => { camYaw -= dx * 0.004; camPitch = clamp(camPitch + dy * 0.002, -0.25, 0.85); camManual = performance.now(); });

  let camYaw = Math.PI;
  let camPitch = 0.14;
  let camManual = 0;
  let elapsed = 0;
  let mapOpen = false;
  let wanted = 0;
  let wantedCool = 0;
  let missionIndex = 0;
  let missionActive = false;
  let missionStage = 0;
  let missionTimer = 0;
  let missionCooldown = 2.4;
  let completedMissions = 0;
  let suppressDecay = false;
  let wastedTimer = 0;
  let dead = false;
  let shake = 0;
  let punchTimer = 0;
  let noteTimer;

  const missions = [
    { title: 'Entrega Expressa', desc: 'Pegue o pacote e chegue ao ponto amarelo. O carro estacionado ao lado ajuda.', target: { x: 400, z: 0 }, reward: 500, type: 'reach' },
    { title: 'Calor da Polícia', desc: 'Você chamou atenção. Chegue ao esconderijo com a polícia atrás de você.', target: { x: -800, z: 600 }, reward: 1500, type: 'wanted', wanted: 3 },
    { title: 'Corrida do Cais', desc: 'Passe pelos 4 checkpoints antes do cronômetro zerar. Mostre que dirige.', checkpoints: [{ x: 800, z: 0 }, { x: 800, z: -800 }, { x: 0, z: -800 }, { x: -800, z: 0 }], reward: 3000, type: 'race', time: 110 },
  ];

  function $(s, r = document) { return r.querySelector(s); }
  function $$(s, r = document) { return [...r.querySelectorAll(s)]; }

  function updateMoney() { el.money.textContent = `$ ${String(Math.floor(player.money)).padStart(8, '0')}`; }
  function updateWanted() {
    el.wanted.forEach((s, i) => s.classList.toggle('on', i < wanted));
    el.wantedBox.classList.toggle('flash', wanted > 0);
  }
  function updateHealth() {
    el.healthFill.style.width = `${clamp(player.health, 0, 100)}%`;
    el.healthFill.style.background = player.health > 55 ? 'linear-gradient(90deg,#4dffa6,#9dffca)' : player.health > 25 ? 'linear-gradient(90deg,#ffbd4a,#ffe08a)' : 'linear-gradient(90deg,#ff4d6d,#ff8fa3)';
    el.healthNum.textContent = Math.ceil(player.health);
  }

  function note(text, type = '') {
    el.notify.textContent = text;
    el.notify.className = `gta-notify show ${type}`;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => el.notify.classList.remove('show'), 3200);
  }

  function setWanted(n, reason = '') {
    const old = wanted;
    wanted = clamp(n, 0, 5);
    if (wanted > old) {
      wantedCool = 0;
      spawnPolice();
      audio.siren();
      if (reason) note(reason, 'bad');
    }
    if (wanted === 0) policeCars.forEach((p) => { p.active = false; p.group.visible = false; });
    updateWanted();
  }
  function addWanted(n = 1, reason = '') { setWanted(wanted + n, reason); }

  function damage(amount, reason = '') {
    if (dead) return;
    player.health = Math.max(0, player.health - amount);
    el.damage.classList.add('hit');
    setTimeout(() => el.damage.classList.remove('hit'), 120);
    updateHealth();
    if (player.health <= 0) die();
  }

  function die() {
    dead = true;
    wastedTimer = 2.6;
    el.wasted.classList.add('open');
    audio.crash();
    if (player.inCar) { player.inCar.group.visible = true; player.inCar = null; }
    setWanted(0);
  }

  function respawn() {
    dead = false;
    wastedTimer = 0;
    player.health = 100;
    player.money = Math.max(0, player.money - 150);
    player.x = 0; player.z = 8; player.angle = 0;
    playerGroup.visible = true;
    playerGroup.position.set(0, 0, 8);
    el.wasted.classList.remove('open');
    updateHealth(); updateMoney();
    note('Você acordou no hospital. US$ 150 perdidos.', 'bad');
  }

  function spawnPolice() {
    const px = player.inCar ? player.inCar.x : player.x;
    const pz = player.inCar ? player.inCar.z : player.z;
    const count = Math.min(policeCars.length, Math.ceil(wanted * 1.5));
    for (let i = 0; i < count; i++) {
      const p = policeCars[i];
      const ang = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      const dist = 320 + Math.random() * 260;
      p.x = px + Math.cos(ang) * dist;
      p.z = pz + Math.sin(ang) * dist;
      p.angle = Math.atan2(px - p.x, pz - p.z);
      p.active = true;
      p.group.visible = true;
      p.group.position.set(p.x, 0, p.z);
      p.group.rotation.y = p.angle;
    }
  }

  function startMission(index) {
    missionIndex = index;
    missionActive = true;
    missionStage = 0;
    suppressDecay = index === 1;
    const m = missions[index];
    if (m.type === 'wanted') {
      setWanted(m.wanted, 'A polícia está atrás de você!');
      note('3 estrelas de procurado. Vá para o esconderijo.', 'bad');
    }
    if (m.type === 'race') missionTimer = m.time;
    const target = m.type === 'race' ? m.checkpoints[0] : m.target;
    marker.position.set(target.x, 0, target.z);
    marker.visible = true;
    el.missionNum.textContent = `MISSÃO 0${index + 1}`;
    el.missionTitle.textContent = m.title;
    el.missionDesc.textContent = m.desc;
    el.missionTimer.textContent = '';
    note(`Nova missão: ${m.title}`, 'mission');
  }

  function completeMission() {
    const m = missions[missionIndex];
    player.money += m.reward;
    completedMissions++;
    updateMoney();
    missionActive = false;
    marker.visible = false;
    suppressDecay = false;
    missionCooldown = 5;
    audio.success();
    note(`Missão concluída! + $${m.reward}`, 'good');
    if (completedMissions >= missions.length) {
      setTimeout(() => note('LIBERTY CITY É SUA. Missões concluídas!', 'mission'), 1800);
    } else {
      setTimeout(() => note(`Próxima missão em 5 segundos...`, 'mission'), 1600);
    }
    if (missionIndex === 1) { wantedCool = 20; setWanted(0); }
  }

  function failMission() {
    if (missionIndex === 2) {
      missionStage = 0;
      missionTimer = missions[2].time;
      marker.position.set(missions[2].checkpoints[0].x, 0, missions[2].checkpoints[0].z);
      note('Tempo esgotado! Corrida reiniciada.', 'bad');
    }
  }

  function toggleCar() {
    if (dead) return;
    if (player.inCar) {
      const c = player.inCar;
      const side = new THREE.Vector3(Math.cos(c.angle), 0, -Math.sin(c.angle));
      let x = c.x + side.x * 4.2;
      let z = c.z + side.z * 4.2;
      if (blocked(x, z, 1.2)) { x = c.x - side.x * 4.2; z = c.z - side.z * 4.2; }
      player.x = x; player.z = z; player.angle = c.angle;
      playerGroup.position.set(x, 0, z);
      playerGroup.visible = true;
      player.inCar = null;
      note('Você saiu do veículo.');
      audio.click();
      return;
    }
    let best = null, bestD = 13;
    for (const c of parked) {
      const d = Math.hypot(c.x - player.x, c.z - player.z);
      if (d < bestD) { best = c; bestD = d; }
    }
    if (best) {
      player.inCar = best;
      playerGroup.visible = false;
      camYaw = best.angle + Math.PI;
      note('Veículo adquirido. Acelere com W.');
      audio.success();
    } else {
      note('Nenhum carro por perto.', 'bad');
    }
  }

  function toggleCrouch() {
    if (dead || player.inCar) return;
    crouching = !crouching;
    playerGroup.scale.y = crouching ? 0.66 : 1;
    note(crouching ? 'Agachado. Menos visível para a polícia.' : 'Em pé. Cuidado com as estrelas.');
    audio.click();
  }

  function punch() {
    if (dead || player.inCar) return;
    punchTimer = 0.3;
    let hitAny = false;
    for (const p of peds) {
      if (!p.alive) continue;
      if (Math.hypot(p.x - player.x, p.z - player.z) < 3.4) {
        p.alive = false; p.respawn = 12; p.group.rotation.z = Math.PI / 2; p.group.position.y = 0.35; hitAny = true;
        addWanted(1, 'Agressão em público! +1 estrela');
      }
    }
    if (hitAny) { audio.hit(); note('Pedestre nocauteado. A polícia foi avisada.', 'bad'); }
    else audio.click();
  }

  function blocked(x, z, r = 1) {
    if (Math.abs(x) > WORLD - 10 || Math.abs(z) > WORLD - 10) return true;
    for (const b of buildings) {
      if (x > b.x - b.w / 2 - r && x < b.x + b.w / 2 + r && z > b.z - b.d / 2 - r && z < b.z + b.d / 2 + r) return true;
    }
    return false;
  }

  function drawMinimap() {
    const w = minimap.width, h = minimap.height;
    mctx.clearRect(0, 0, w, h);
    mctx.save();
    mctx.beginPath(); mctx.arc(w / 2, h / 2, w / 2 - 4, 0, Math.PI * 2); mctx.clip();
    mctx.fillStyle = '#0a0f18'; mctx.fillRect(0, 0, w, h);
    const px = player.inCar ? player.inCar.x : player.x;
    const pz = player.inCar ? player.inCar.z : player.z;
    const scale = 0.085;
    const cx = w / 2, cz = h / 2;
    // roads
    mctx.strokeStyle = '#262e3d'; mctx.lineWidth = 13;
    for (let k = -10; k <= 10; k++) {
      const rx = cx + (k * ROAD - px) * scale;
      const rz = cz + (k * ROAD - pz) * scale;
      mctx.beginPath(); mctx.moveTo(rx, 0); mctx.lineTo(rx, h); mctx.stroke();
      mctx.beginPath(); mctx.moveTo(0, rz); mctx.lineTo(w, rz); mctx.stroke();
    }
    mctx.strokeStyle = '#4d4323'; mctx.lineWidth = 1;
    for (let k = -10; k <= 10; k++) {
      const rx = cx + (k * ROAD - px) * scale;
      const rz = cz + (k * ROAD - pz) * scale;
      mctx.setLineDash([4, 6]);
      mctx.beginPath(); mctx.moveTo(rx, 0); mctx.lineTo(rx, h); mctx.stroke();
      mctx.beginPath(); mctx.moveTo(0, rz); mctx.lineTo(w, rz); mctx.stroke();
      mctx.setLineDash([]);
    }
    // buildings
    mctx.fillStyle = '#1b2230';
    for (const b of buildings) {
      const bx = cx + (b.x - px) * scale;
      const bz = cz + (b.z - pz) * scale;
      if (bx < -40 || bx > w + 40 || bz < -40 || bz > h + 40) continue;
      mctx.fillRect(bx - b.w * scale / 2, bz - b.d * scale / 2, b.w * scale, b.d * scale);
    }
    // police
    policeCars.forEach((p) => {
      if (!p.active) return;
      const x = cx + (p.x - px) * scale, z = cz + (p.z - pz) * scale;
      if (Math.hypot(x - cx, z - cz) > w / 2) return;
      mctx.fillStyle = '#4da3ff'; mctx.beginPath(); mctx.arc(x, z, 4, 0, Math.PI * 2); mctx.fill();
    });
    // marker
    if (marker.visible) {
      const x = cx + (marker.position.x - px) * scale, z = cz + (marker.position.z - pz) * scale;
      mctx.fillStyle = '#ffd84a'; mctx.shadowColor = '#ffd84a'; mctx.shadowBlur = 12;
      mctx.beginPath(); mctx.arc(clamp(x, 8, w - 8), clamp(z, 8, h - 8), 6, 0, Math.PI * 2); mctx.fill();
      mctx.shadowBlur = 0;
    }
    // player
    mctx.save();
    mctx.translate(cx, cz);
    mctx.rotate(-(player.inCar ? player.inCar.angle : player.angle));
    mctx.fillStyle = '#ffffff'; mctx.shadowColor = '#69e5ff'; mctx.shadowBlur = 10;
    mctx.beginPath(); mctx.moveTo(0, -9); mctx.lineTo(6, 7); mctx.lineTo(0, 4); mctx.lineTo(-6, 7); mctx.closePath(); mctx.fill();
    mctx.restore();
    mctx.restore();
    // ring
    mctx.strokeStyle = 'rgba(255,255,255,.35)'; mctx.lineWidth = 2;
    mctx.beginPath(); mctx.arc(w / 2, h / 2, w / 2 - 5, 0, Math.PI * 2); mctx.stroke();
    mctx.strokeStyle = 'rgba(105,229,255,.4)'; mctx.lineWidth = 1;
    mctx.beginPath(); mctx.arc(w / 2, h / 2, w / 2 - 12, 0, Math.PI * 2); mctx.stroke();
  }

  function drawFullMap() {
    mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    mapCtx.drawImage(cityCanvas, 0, 0, mapCanvas.width, mapCanvas.height);
    const px = player.inCar ? player.inCar.x : player.x;
    const pz = player.inCar ? player.inCar.z : player.z;
    const toX = (x) => (x + WORLD) / (WORLD * 2) * mapCanvas.width;
    const toY = (z) => (z + WORLD) / (WORLD * 2) * mapCanvas.height;
    policeCars.forEach((p) => {
      if (!p.active) return;
      mapCtx.fillStyle = '#4da3ff'; mapCtx.beginPath(); mapCtx.arc(toX(p.x), toY(p.z), 5, 0, Math.PI * 2); mapCtx.fill();
    });
    if (marker.visible) {
      mapCtx.fillStyle = '#ffd84a'; mapCtx.shadowColor = '#ffd84a'; mapCtx.shadowBlur = 18;
      mapCtx.beginPath(); mapCtx.arc(toX(marker.position.x), toY(marker.position.z), 9, 0, Math.PI * 2); mapCtx.fill();
      mapCtx.shadowBlur = 0;
    }
    mapCtx.save();
    mapCtx.translate(toX(px), toY(pz));
    mapCtx.rotate(-(player.inCar ? player.inCar.angle : player.angle));
    mapCtx.fillStyle = '#fff'; mapCtx.beginPath(); mapCtx.moveTo(0, -13); mapCtx.lineTo(8, 10); mapCtx.lineTo(0, 6); mapCtx.lineTo(-8, 10); mapCtx.closePath(); mapCtx.fill();
    mapCtx.restore();
  }

  function toggleMap(force) {
    mapOpen = force ?? !mapOpen;
    el.fullmap.classList.toggle('open', mapOpen);
    if (mapOpen) drawFullMap();
  }

  function updateTraffic(dt) {
    traffic.forEach((t) => {
      t.pos += t.speed * t.dir * dt;
      if (t.pos > 1950) t.pos = -1950;
      if (t.pos < -1950) t.pos = 1950;
      if (t.axis === 'x') {
        t.group.position.set(t.pos, 0, t.lane + 18 * t.dir);
        t.group.rotation.y = t.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        t.group.position.set(t.lane + 18 * t.dir, 0, t.pos);
        t.group.rotation.y = t.dir > 0 ? 0 : Math.PI;
      }
    });
  }

  function updatePeds(dt) {
    peds.forEach((p) => {
      if (!p.alive) {
        p.respawn -= dt;
        if (p.respawn <= 0) {
          p.alive = true; p.x = p.homeX; p.z = p.homeZ; p.group.position.set(p.x, 0, p.z); p.group.rotation.z = 0; p.group.position.y = 0;
        }
        return;
      }
      p.phase += dt * 2.4;
      p.angle += Math.sin(p.phase * 0.3) * dt * 0.4;
      const nx = p.x + Math.sin(p.angle) * dt * 2.2;
      const nz = p.z + Math.cos(p.angle) * dt * 2.2;
      if (!blocked(nx, nz, 0.7)) { p.x = nx; p.z = nz; }
      else p.angle += Math.PI;
      p.group.position.set(p.x, 0, p.z);
      p.group.rotation.y = p.angle;
      p.legL.rotation.x = Math.sin(p.phase) * 0.55;
      p.legR.rotation.x = -Math.sin(p.phase) * 0.55;
      if (player.inCar && Math.abs(player.inCar.speed) > 18) {
        const d = Math.hypot(p.x - player.inCar.x, p.z - player.inCar.z);
        if (d < 5.2) {
          p.alive = false; p.respawn = 15; p.group.rotation.z = Math.PI / 2; p.group.position.y = 0.4;
          addWanted(1, 'Atropelamento! +1 estrela');
          audio.hit();
          shake = 0.4;
        }
      }
    });
  }

  function updatePolice(dt) {
    if (wanted === 0) return;
    const px = player.inCar ? player.inCar.x : player.x;
    const pz = player.inCar ? player.inCar.z : player.z;
    policeCars.forEach((p) => {
      if (!p.active) return;
      const dx = px - p.x, dz = pz - p.z;
      const d = Math.hypot(dx, dz);
      if (d > 1400) {
        p.x = px + (Math.random() - 0.5) * 600;
        p.z = pz + (Math.random() - 0.5) * 600;
        p.angle = Math.atan2(px - p.x, pz - p.z);
        return;
      }
      const targetAngle = Math.atan2(dx, dz);
      p.angle = lerpAngle(p.angle, targetAngle, dt * (1.2 + wanted * 0.22));
      const speed = 38 + wanted * 16;
      p.x += Math.sin(p.angle) * speed * dt;
      p.z += Math.cos(p.angle) * speed * dt;
      p.group.position.set(p.x, 0, p.z);
      p.group.rotation.y = p.angle;
      const siren = p.group.userData.siren;
      if (siren) {
        const flash = Math.sin(elapsed * 12 + p.x) > 0;
        siren.blue.material.color.setHex(flash ? 0x2f7bff : 0x101a33);
        siren.red.material.color.setHex(flash ? 0x101a33 : 0xff2c4f);
      }
      if (d < 55) {
        p.shoot -= dt;
        if (p.shoot <= 0) { p.shoot = 0.7; damage(4.5); audio.shoot(); }
      }
    });
    if (Math.floor(elapsed * 2) !== Math.floor((elapsed - dt) * 2)) audio.siren();
  }

  function updateCar(dt) {
    const c = player.inCar;
    if (!c) return;
    const throttle = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0) + (-joystick.y || 0);
    const steer = (keys.has('KeyA') ? 1 : 0) - (keys.has('KeyD') ? 1 : 0) + (-joystick.x || 0);
    const handbrake = keys.has('Space');
    if (throttle > 0.1) c.speed += 58 * dt * throttle;
    else if (throttle < -0.1) c.speed += 42 * dt * throttle;
    else c.speed *= 1 - dt * 1.15;
    if (handbrake) c.speed *= 1 - dt * 2.6;
    c.speed = clamp(c.speed, -36, 145);
    if (Math.abs(c.speed) > 1) c.angle += steer * dt * (0.45 + Math.abs(c.speed) / 150) * Math.sign(c.speed);
    const nx = c.x + Math.sin(c.angle) * c.speed * dt;
    const nz = c.z + Math.cos(c.angle) * c.speed * dt;
    if (blocked(nx, nz, 2.6)) {
      if (Math.abs(c.speed) > 35) { audio.crash(); shake = 0.5; damage(Math.abs(c.speed) * 0.13); }
      c.speed *= -0.22;
    } else {
      c.x = nx; c.z = nz;
    }
    c.group.position.set(c.x, 0, c.z);
    c.group.rotation.y = c.angle;
    playerHeadlight.visible = true;
    playerHeadlight.position.set(c.x + Math.sin(c.angle) * 4.5, 1.1, c.z + Math.cos(c.angle) * 4.5);
    playerHeadlight.target.position.set(c.x + Math.sin(c.angle) * 70, 0, c.z + Math.cos(c.angle) * 70);
    playerGroup.position.set(c.x, 0, c.z);
    el.speed.textContent = String(Math.round(Math.abs(c.speed) * 0.82));
    el.gear.textContent = 'VEÍCULO';
    el.speedBar.style.width = `${clamp(Math.abs(c.speed) / 145 * 100, 0, 100)}%`;
  }

  function updatePlayer(dt) {
    if (player.inCar || dead) return;
    const ix = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0) + (joystick.x || 0);
    const iz = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0) + (-joystick.y || 0);
    const len = Math.hypot(ix, iz);
    if (len > 0.08) {
      const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
      const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
      let mx = fx * iz + rx * ix;
      let mz = fz * iz + rz * ix;
      const ml = Math.hypot(mx, mz);
      mx /= ml; mz /= ml;
      const run = keys.has('ShiftLeft') || touchState.run;
      const speed = (run ? 24 : 12) * (crouching ? 0.55 : 1) * dt;
      const nx = player.x + mx * speed;
      const nz = player.z + mz * speed;
      if (!blocked(nx, player.z, 1.1)) player.x = nx;
      if (!blocked(player.x, nz, 1.1)) player.z = nz;
      player.angle = lerpAngle(player.angle, Math.atan2(mx, mz), dt * 14);
      player.speed = speed / dt;
    } else player.speed = 0;
    playerGroup.position.set(player.x, 0, player.z);
    playerGroup.rotation.y = player.angle;
    const walk = elapsed * (player.speed > 16 ? 14 : 8);
    legLP.rotation.x = Math.sin(walk) * (player.speed > 0.1 ? 0.6 : 0);
    legRP.rotation.x = -Math.sin(walk) * (player.speed > 0.1 ? 0.6 : 0);
    armL.rotation.x = -Math.sin(walk) * (player.speed > 0.1 ? 0.45 : 0);
    armR.rotation.x = Math.sin(walk) * (player.speed > 0.1 ? 0.45 : 0);
    if (punchTimer > 0) { punchTimer -= dt; armR.rotation.x = -1.8; }
    el.speed.textContent = player.speed > 0.1 ? 'A PÉ' : '0';
    el.gear.textContent = 'A PÉ';
    el.speedBar.style.width = '0%';
  }

  function updateMission(dt) {
    if (dead) return;
    if (!missionActive) {
      if (missionCooldown > 0) missionCooldown -= dt;
      else if (completedMissions < missions.length) startMission(completedMissions);
      return;
    }
    const m = missions[missionIndex];
    const px = player.inCar ? player.inCar.x : player.x;
    const pz = player.inCar ? player.inCar.z : player.z;
    const target = m.type === 'race' ? m.checkpoints[missionStage] : m.target;
    const d = Math.hypot(target.x - px, target.z - pz);
    el.missionDist.textContent = `${Math.round(d)} m`;
    if (m.type === 'race') {
      missionTimer -= dt;
      el.missionTimer.textContent = `${Math.ceil(missionTimer)}s · CP ${missionStage + 1}/4`;
      if (missionTimer <= 0) failMission();
    } else {
      el.missionTimer.textContent = m.type === 'wanted' ? `${wanted} ★` : '';
    }
    if (d < 24) {
      if (m.type === 'race') {
        missionStage++;
        if (missionStage >= m.checkpoints.length) completeMission();
        else {
          const next = m.checkpoints[missionStage];
          marker.position.set(next.x, 0, next.z);
          note(`Checkpoint ${missionStage + 1}/4`, 'mission');
          audio.pickup();
        }
      } else {
        completeMission();
      }
    }
    if (m.type === 'wanted' && wanted < 1) setWanted(3);
  }

  function updateCamera(dt) {
    if (dead) return;
    const driving = !!player.inCar;
    const target = driving ? player.inCar : player;
    if (driving && performance.now() - camManual > 1400) camYaw = lerpAngle(camYaw, player.inCar.angle + Math.PI, dt * 1.8);
    const dist = driving ? 20 : 10;
    const height = driving ? 9.5 : 4.4;
    const desired = new THREE.Vector3(
      target.x + Math.sin(camYaw) * dist * Math.cos(camPitch),
      height + Math.sin(camPitch) * 6,
      target.z + Math.cos(camYaw) * dist * Math.cos(camPitch)
    );
    if (shake > 0) { desired.x += (Math.random() - 0.5) * shake * 2; desired.z += (Math.random() - 0.5) * shake * 2; shake -= dt; }
    camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
    camera.lookAt(target.x, driving ? 1.6 : 2.8, target.z);
    playerFill.position.set(target.x, 7, target.z);
  }

  function updateHud() {
    window.__ps5Vital = player.health;
    el.wanted.forEach((s, i) => s.classList.toggle('on', i < wanted));
    el.healthFill.style.width = `${clamp(player.health, 0, 100)}%`;
    el.healthNum.textContent = Math.ceil(player.health);
  }

  function onKeyDown(e) {
    if (shell.paused) return;
    keys.add(e.code);
    if (e.code === 'KeyE') { toggleCar(); e.preventDefault(); }
    if (e.code === 'KeyM') { toggleMap(); e.preventDefault(); }
    if (e.code === 'KeyF') { punch(); e.preventDefault(); }
    if (e.code === 'KeyC') { toggleCrouch(); e.preventDefault(); }
    if (e.code === 'Escape' && mapOpen) { toggleMap(false); }
  }
  function onKeyUp(e) { keys.delete(e.code); }
  let dragging = false, lastX = 0, lastY = 0;
  function onPointerDown(e) {
    if (e.target.closest('button') || e.target.closest('.gta-fullmap')) return;
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!dragging) return;
    camYaw -= (e.clientX - lastX) * 0.005;
    camPitch = clamp(camPitch + (e.clientY - lastY) * 0.003, -0.25, 0.85);
    lastX = e.clientX; lastY = e.clientY; camManual = performance.now();
  }
  function onPointerUp() { dragging = false; }
  function onWheel(e) { e.preventDefault(); }
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  $('#gta-fullmap-close', hud).addEventListener('click', () => toggleMap(false));

  function resize() {
    const w = shell.root.clientWidth || window.innerWidth;
    const h = shell.root.clientHeight || window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(devicePixelRatio, w < 760 ? 1.5 : 1.7));
  }
  window.addEventListener('resize', resize);
  resize();
  updateMoney(); updateHealth(); updateWanted();
  note('Bem-vindo a Liberty City. Missão 1 começando...', 'mission');
  setTimeout(() => { if (!missionActive && completedMissions === 0) startMission(0); }, 1800);

  let last = performance.now();
  let raf;
  function animate(now) {
    raf = requestAnimationFrame(animate);
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
    last = now;
    if (shell.paused) { renderer.render(scene, camera); return; }
    if (mapOpen) { renderer.render(scene, camera); drawFullMap(); return; }
    elapsed += dt;

    if (dead) {
      wastedTimer -= dt;
      if (wastedTimer <= 0) respawn();
    } else {
      updatePlayer(dt);
      updateCar(dt);
      updatePolice(dt);
      updateMission(dt);
      if (wanted > 0 && !suppressDecay) {
        wantedCool += dt;
        if (wantedCool > 28) { wantedCool = 10; setWanted(wanted - 1); note('Procurado reduzido.', 'good'); }
      }
      if (player.health < 100) player.health = Math.min(100, player.health + dt * 0.7);
      updateHud();
    }
    updateTraffic(dt);
    updatePeds(dt);
    updateCamera(dt);
    drawMinimap();

    if (marker.visible) {
      marker.rotation.y += dt * 0.5;
      ring.scale.setScalar(1 + Math.sin(elapsed * 2.4) * 0.08);
      beam.material.opacity = 0.1 + Math.sin(elapsed * 2) * 0.04;
      markerLight.intensity = 2.5 + Math.sin(elapsed * 3) * 0.7;
    }
    if (!player.inCar) playerHeadlight.visible = false;
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(animate);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('wheel', onWheel);
      clearTimeout(noteTimer);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose?.(); if (o.material) { if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.()); else o.material.dispose?.(); } });
      renderer.dispose();
      shell.destroy();
    },
    pause() { shell.setPaused(true); },
    resume() { shell.setPaused(false); },
  };
}
