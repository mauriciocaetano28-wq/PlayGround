import * as THREE from 'three';
import { createGameShell, createJoystick, bindHold, isTouchDevice, clamp } from '../core/gameShell.js';
import { audio } from '../core/audio.js';

function makeSunTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 60, 0, 420);
  g.addColorStop(0, '#fff6ad');
  g.addColorStop(0.45, '#ffb14a');
  g.addColorStop(1, '#ff2d8e');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(256, 256, 200, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 7; i++) {
    ctx.fillRect(0, 300 + i * 22, 512, 5 + i * 1.3);
  }
  ctx.globalCompositeOperation = 'source-over';
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCar(color, accent) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.28, emissive: color, emissiveIntensity: 0.06 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x090b14, roughness: 0.3, metalness: 0.7 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x112244, roughness: 0.1, metalness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.6, 5.4), bodyMat); body.position.y = 0.75; body.castShadow = true; g.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 1.2), bodyMat); nose.position.set(0, 0.55, 3.1); g.add(nose);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.62, 2.2), glass); cabin.position.set(0, 1.25, -0.2); g.add(cabin);
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.5), darkMat); spoiler.position.set(0, 1.18, -2.65); g.add(spoiler);
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.12), darkMat); wingL.position.set(-1, 0.9, -2.65); g.add(wingL);
  const wingR = wingL.clone(); wingR.position.x = 1; g.add(wingR);
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 12);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x07080c, roughness: 0.8 });
  for (const sx of [-1.35, 1.35]) for (const sz of [-1.8, 1.8]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat); w.rotation.z = Math.PI / 2; w.position.set(sx, 0.42, sz); g.add(w);
  }
  const strip = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: accent })); strip.position.set(0, 0.45, 3.7); g.add(strip);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.06), new THREE.MeshBasicMaterial({ color: 0xff2d6a })); tail.position.set(0, 0.85, -2.72); g.add(tail);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 7.2), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }));
  under.rotation.x = -Math.PI / 2; under.position.y = 0.03; g.add(under);
  const head = new THREE.PointLight(accent, 2, 22, 2); head.position.set(0, 0.8, 3.4); g.add(head);
  return g;
}

export async function mount({ root, game, onExit }) {
  const shell = createGameShell({
    root, game, onExit,
    controls: '<b>W</b> acelerar · <b>S</b> frear · <b>A/D</b> virar · <b>Espaço</b> drift · <b>Shift</b> boost · <b>R</b> reiniciar · <b>Esc</b> pausar',
  });
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  shell.canvasWrap.appendChild(canvas);
  const hud = shell.hud;
  const touch = isTouchDevice();
  hud.innerHTML = `
    <div class="nd-top">
      <div class="nd-lap"><span>VOLTA</span><b id="nd-lap">1</b><small>/ 3</small></div>
      <div class="nd-time"><span>TEMPO</span><b id="nd-time">00:00.00</b><small id="nd-best">MELHOR: --:--</small></div>
      <div class="nd-pos"><span>POSIÇÃO</span><b id="nd-pos">1º</b><small>/ 3</small></div>
    </div>
    <div class="nd-minimap"><canvas id="nd-map" width="260" height="200"></canvas><span>NEON BAY · 3 VOLTAS</span></div>
    <div class="nd-speedo" id="nd-speedo"><span id="nd-gear">N</span><b id="nd-speed">000</b><small>KM/H</small><div class="nd-speedbar"><i id="nd-speed-fill"></i></div></div>
    <div class="nd-boost"><span>BOOST</span><div><i id="nd-boost-fill"></i></div><small>SHIFT</small></div>
    <div class="nd-countdown" id="nd-countdown">3</div>
    <div class="nd-toast" id="nd-toast"></div>
    <div class="nd-drift" id="nd-drift">DRIFT</div>
    <div class="nd-results" id="nd-results"><div class="nd-results-card"><span>CORRIDA FINALIZADA</span><h2 id="nd-result-pos">1º LUGAR</h2><div class="nd-result-grid"><div><span>TEMPO TOTAL</span><b id="nd-result-time">00:00.00</b></div><div><span>MELHOR VOLTA</span><b id="nd-result-best">00:00.00</b></div><div><span>DRIFTS</span><b id="nd-result-drifts">0</b></div></div><div class="nd-result-actions"><button id="nd-again">CORRER DE NOVO</button><button id="nd-exit">SAIR PARA O PS5</button></div></div></div>
    <div class="nd-touch touch-ui ${touch ? 'active' : ''}">
      <div class="joystick"><i></i></div>
      <div class="touch-right">
        <button class="touch-btn big b1" data-touch="boost">BOOST</button>
        <button class="touch-btn b3" data-touch="drift">DRIFT</button>
      </div>
    </div>`;

  function $(s, r = document) { return r.querySelector(s); }
  function $$(s, r = document) { return [...r.querySelectorAll(s)]; }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080418);
  scene.fog = new THREE.FogExp2(0x1b0835, 0.0032);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 1400);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // Sky / sun / stars
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(700, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { top: { value: new THREE.Color(0x07031a) }, mid: { value: new THREE.Color(0x35104f) }, low: { value: new THREE.Color(0x9c1f63) } },
      vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vP; void main(){ float h=normalize(vP).y; vec3 c=mix(low,mid,smoothstep(-0.08,0.22,h)); c=mix(c,top,smoothstep(0.12,0.65,h)); gl_FragColor=vec4(c,1.0); }',
    })
  );
  scene.add(sky);
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshBasicMaterial({ map: makeSunTexture(), transparent: true, fog: false, depthWrite: false }));
  sun.position.set(0, 110, -560);
  sun.lookAt(0, 110, 0);
  scene.add(sun);
  const stars = [];
  for (let i = 0; i < 650; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.4;
    stars.push(Math.cos(th) * Math.sin(ph) * 500, Math.cos(ph) * 500, Math.sin(th) * Math.sin(ph) * 500);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffd4f4, size: 1.5, transparent: true, opacity: 0.8, fog: false })));

  // Grid floor
  const grid = new THREE.GridHelper(1400, 70, 0x8c2e9e, 0x30124d);
  grid.position.y = -0.02;
  grid.material.opacity = 0.38; grid.material.transparent = true;
  scene.add(grid);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshStandardMaterial({ color: 0x0a0515, roughness: 0.72, metalness: 0.35 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.06; scene.add(floor);

  // Mountains / skyline
  const mountainMat = new THREE.MeshStandardMaterial({ color: 0x120820, roughness: 0.95 });
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2;
    const r = 500 + Math.random() * 90;
    const m = new THREE.Mesh(new THREE.ConeGeometry(40 + Math.random() * 50, 80 + Math.random() * 140, 4), mountainMat);
    m.position.set(Math.cos(ang) * r, 20, Math.sin(ang) * r);
    m.rotation.y = Math.random() * Math.PI;
    scene.add(m);
  }
  const cityMat = new THREE.MeshStandardMaterial({ color: 0x0a0715, emissive: 0x2a0f4a, emissiveIntensity: 0.4 });
  for (let i = 0; i < 40; i++) {
    const x = (Math.random() - 0.5) * 700;
    const z = -250 - Math.random() * 250;
    const h = 20 + Math.random() * 70;
    const m = new THREE.Mesh(new THREE.BoxGeometry(10 + Math.random() * 18, h, 10 + Math.random() * 18), cityMat);
    m.position.set(x, h / 2, z); scene.add(m);
  }

  scene.add(new THREE.HemisphereLight(0x8b7bff, 0x180726, 1.1));
  const key = new THREE.DirectionalLight(0xff9edb, 1.8);
  key.position.set(-80, 120, -100);
  scene.add(key);
  const cyanLight = new THREE.PointLight(0x3fe8ff, 70, 300, 2); cyanLight.position.set(150, 25, 100); scene.add(cyanLight);
  const pinkLight = new THREE.PointLight(0xff3fa0, 90, 320, 2); pinkLight.position.set(-150, 22, -120); scene.add(pinkLight);

  // Track curve
  const points = [
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(160, 0, -30), new THREE.Vector3(260, 0, -140),
    new THREE.Vector3(240, 0, -290), new THREE.Vector3(100, 0, -370), new THREE.Vector3(-70, 0, -340),
    new THREE.Vector3(-210, 0, -260), new THREE.Vector3(-300, 0, -120), new THREE.Vector3(-260, 0, 40),
    new THREE.Vector3(-140, 0, 140), new THREE.Vector3(10, 0, 130), new THREE.Vector3(100, 0, 60),
  ];
  const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.4);
  const curveLength = curve.getLength();
  const ROAD_W = 28;
  const N = 420;
  const roadPos = [];
  const roadUv = [];
  const roadIdx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPointAt(t % 1);
    const tan = curve.getTangentAt(t % 1);
    const nx = -tan.z, nz = tan.x;
    roadPos.push(p.x + nx * ROAD_W / 2, 0.01, p.z + nz * ROAD_W / 2);
    roadPos.push(p.x - nx * ROAD_W / 2, 0.01, p.z - nz * ROAD_W / 2);
    roadUv.push(0, t * 30, 1, t * 30);
    if (i < N) {
      const a = i * 2;
      roadIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPos, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUv, 2));
  roadGeo.setIndex(roadIdx);
  roadGeo.computeVertexNormals();
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x160d24, roughness: 0.6, metalness: 0.4, emissive: 0x100520, emissiveIntensity: 0.4 });
  const road = new THREE.Mesh(roadGeo, roadMat); scene.add(road);

  // Edge neon ribbons
  function edgeRibbon(offset, color) {
    const pos = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const p = curve.getPointAt(t % 1);
      const tan = curve.getTangentAt(t % 1);
      const nx = -tan.z, nz = tan.x;
      const w = 0.5;
      const base = offset * ROAD_W / 2;
      pos.push(p.x + nx * (base - w), 0.08, p.z + nz * (base - w));
      pos.push(p.x + nx * (base + w), 0.08, p.z + nz * (base + w));
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    scene.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color })));
  }
  edgeRibbon(1, 0xff4fa3);
  edgeRibbon(-1, 0x5df3ff);

  // Center dashes
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffd56a });
  for (let i = 0; i < 90; i++) {
    const t = i / 90;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 4.5), dashMat);
    m.position.set(p.x, 0.06, p.z);
    m.rotation.y = Math.atan2(tan.x, tan.z);
    scene.add(m);
  }

  // Barriers
  const postGeo = new THREE.BoxGeometry(0.35, 2.1, 0.35);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x251136, roughness: 0.5, metalness: 0.5 });
  const postCount = 150;
  const posts = new THREE.InstancedMesh(postGeo, postMat, postCount);
  const postGlow = new THREE.InstancedMesh(new THREE.BoxGeometry(0.45, 0.2, 0.45), new THREE.MeshBasicMaterial({ color: 0x5df3ff }), postCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < postCount; i++) {
    const t = i / postCount;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const nx = -tan.z, nz = tan.x;
    const side = i % 2 ? 1 : -1;
    dummy.position.set(p.x + nx * (ROAD_W / 2 + 2) * side, 1.05, p.z + nz * (ROAD_W / 2 + 2) * side);
    dummy.updateMatrix(); posts.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 2.15; dummy.updateMatrix(); postGlow.setMatrixAt(i, dummy.matrix);
  }
  scene.add(posts, postGlow);

  // Palms
  for (let i = 0; i < 26; i++) {
    const t = (i / 26 + 0.013) % 1;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const nx = -tan.z, nz = tan.x;
    const side = i % 2 ? 1 : -1;
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.5, 12, 6), new THREE.MeshStandardMaterial({ color: 0x1a0d28 }));
    trunk.position.y = 6; g.add(trunk);
    for (let j = 0; j < 6; j++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(5, 0.12, 1.2), new THREE.MeshStandardMaterial({ color: 0x0d4a55, emissive: 0x0b6f7d, emissiveIntensity: 0.3 }));
      leaf.position.y = 12; leaf.rotation.y = (j / 6) * Math.PI * 2; leaf.rotation.z = -0.35; leaf.position.x = Math.cos(leaf.rotation.y) * 2; leaf.position.z = Math.sin(leaf.rotation.y) * 2; g.add(leaf);
    }
    g.position.set(p.x + nx * (ROAD_W / 2 + 8) * side, 0, p.z + nz * (ROAD_W / 2 + 8) * side);
    scene.add(g);
  }

  // Start gate
  const gateGroup = new THREE.Group();
  const gateMat = new THREE.MeshStandardMaterial({ color: 0x2a1142, emissive: 0xff3fa0, emissiveIntensity: 0.3 });
  const gp1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 9, 0.8), gateMat); gp1.position.set(-ROAD_W / 2 - 2, 4.5, 0); gateGroup.add(gp1);
  const gp2 = gp1.clone(); gp2.position.x = ROAD_W / 2 + 2; gateGroup.add(gp2);
  const gtop = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W + 5.6, 1, 0.8), gateMat); gtop.position.set(0, 9, 0); gateGroup.add(gtop);
  const start = curve.getPointAt(0);
  const startTan = curve.getTangentAt(0);
  gateGroup.position.copy(start);
  gateGroup.rotation.y = Math.atan2(startTan.x, startTan.z);
  scene.add(gateGroup);
  const gateLight = new THREE.PointLight(0xff3fa0, 4, 40, 2); gateLight.position.set(0, 7, 0); gateGroup.add(gateLight);

  // Checkpoint gates
  const checkpoints = [0.25, 0.5, 0.75].map((t, i) => {
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0x5df3ff, transparent: true, opacity: 0.55 });
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 0.5), mat); left.position.set(-ROAD_W / 2 - 1, 3.5, 0); g.add(left);
    const right = left.clone(); right.position.x = ROAD_W / 2 + 1; g.add(right);
    const top = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W + 2.5, 0.4, 0.5), mat); top.position.y = 7; g.add(top);
    g.position.copy(p); g.rotation.y = Math.atan2(tan.x, tan.z);
    scene.add(g);
    return { t, group: g, mat, index: i };
  });

  // Player car
  const car = { x: 0, z: 0, angle: 0, speed: 0, t: 0, lap: 1, cp: 0, drift: 0, boost: 55, off: false, finished: false };
  const startPoint = curve.getPointAt(0);
  const startT = curve.getTangentAt(0);
  car.x = startPoint.x; car.z = startPoint.z; car.angle = Math.atan2(startT.x, startT.z);
  const playerCar = makeCar(0x16e0ff, 0x5df3ff);
  scene.add(playerCar);
  playerCar.position.set(car.x, 0, car.z);
  playerCar.rotation.y = car.angle;

  // AI cars
  const aiSpecs = [
    { name: 'VEX', color: 0xff3fa0, accent: 0xff3fa0, lane: -5, speed: 96 },
    { name: 'KIRA', color: 0xffc23f, accent: 0xffc23f, lane: 5, speed: 90 },
  ];
  const ais = aiSpecs.map((s, i) => {
    const mesh = makeCar(s.color, s.accent);
    scene.add(mesh);
    return { ...s, mesh, t: (0.985 - i * 0.006 + 1) % 1, lap: 0, speed: s.speed, offset: 0 };
  });

  // Particles
  const particles = [];
  const particleGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);

  const keys = new Set();
  const joystick = touch ? createJoystick($('.joystick', hud)) : { x: 0, y: 0 };
  const touchState = { boost: false, drift: false };
  if (touch) {
    bindHold($('[data-touch="boost"]', hud), (v) => { touchState.boost = v; });
    bindHold($('[data-touch="drift"]', hud), (v) => { touchState.drift = v; });
  }

  let elapsed = 0;
  let countdown = 3.4;
  let raceTime = 0;
  let lapTime = 0;
  let bestLap = Infinity;
  let lastT = 0;
  let drifts = 0;
  let finished = false;
  let toastTimer;
  const mapCanvas = $('#nd-map', hud);
  const mctx = mapCanvas.getContext('2d');
  const mapPoints = [];
  for (let i = 0; i < 100; i++) mapPoints.push(curve.getPointAt(i / 100));

  function toast(text, cls = '') {
    const el = $('#nd-toast', hud);
    el.textContent = text;
    el.className = `nd-toast show ${cls}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  function nearestTrack(x, z) {
    let best = 0, bd = Infinity;
    for (let i = 0; i < 240; i++) {
      const p = curve.getPointAt(i / 240);
      const d = (p.x - x) ** 2 + (p.z - z) ** 2;
      if (d < bd) { bd = d; best = i / 240; }
    }
    return { t: best, dist: Math.sqrt(bd) };
  }

  function spawnParticles(x, z, color, count = 3) {
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(particleGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }));
      m.position.set(x + (Math.random() - 0.5) * 2, 0.3 + Math.random() * 0.6, z + (Math.random() - 0.5) * 2);
      scene.add(m);
      particles.push({ m, vx: (Math.random() - 0.5) * 5, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 5, life: 0.5 });
    }
  }

  function updateCar(dt) {
    if (countdown > 0 || finished) {
      if (countdown > 0) {
        car.speed *= 0.96;
      }
      playerCar.position.set(car.x, 0, car.z);
      playerCar.rotation.y = car.angle;
      return;
    }
    const throttle = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0) + (-joystick.y || 0);
    const steer = (keys.has('KeyA') ? 1 : 0) - (keys.has('KeyD') ? 1 : 0) + (-joystick.x || 0);
    const drift = keys.has('Space') || touchState.drift;
    const boosting = (keys.has('ShiftLeft') || touchState.boost) && car.boost > 1;
    if (throttle > 0.1) car.speed += (boosting ? 100 : 58) * dt * throttle;
    else if (throttle < -0.1) car.speed += 50 * dt * throttle;
    else car.speed *= 1 - dt * 0.7;
    car.speed = clamp(car.speed, -35, boosting ? 220 : 165);
    if (drift && Math.abs(steer) > 0.2) {
      car.drift += dt * 2.5;
      car.speed *= 1 - dt * 0.35;
      car.boost = Math.min(100, car.boost + dt * 18);
      if (car.drift > 0.6 && Math.random() < 0.3) spawnParticles(car.x, car.z, 0xff3fa0, 2);
    } else car.drift = Math.max(0, car.drift - dt * 3);
    if (boosting) car.boost = Math.max(0, car.boost - dt * 24);
    const steerFactor = (0.7 + Math.min(1.1, Math.abs(car.speed) / 130)) * (drift ? 1.5 : 1);
    if (Math.abs(car.speed) > 0.5) car.angle += steer * dt * steerFactor * Math.sign(car.speed);
    const nx = car.x + Math.sin(car.angle) * car.speed * dt;
    const nz = car.z + Math.cos(car.angle) * car.speed * dt;
    car.x = nx; car.z = nz;
    const near = nearestTrack(car.x, car.z);
    car.t = near.t;
    car.off = near.dist > ROAD_W / 2 + 1;
    if (car.off) {
      car.speed *= 1 - dt * 0.9;
      if (Math.random() < 0.08) spawnParticles(car.x, car.z, 0x8b6bff, 1);
    }
    playerCar.position.set(car.x, 0, car.z);
    playerCar.rotation.y = car.angle;
    playerCar.rotation.z = car.drift * 0.02 * steer;
    playerCar.rotation.x = -car.drift * 0.012;

    // Checkpoints
    if (car.cp < 3) {
      const cp = checkpoints[car.cp];
      const cpPos = curve.getPointAt(cp.t);
      if (Math.hypot(car.x - cpPos.x, car.z - cpPos.z) < 28) {
        car.cp++;
        cp.mat.color.setHex(0x4dffa6);
        cp.mat.opacity = 0.9;
        car.boost = Math.min(100, car.boost + 12);
        audio.pickup();
        toast(`CHECKPOINT ${car.cp}/3`, 'good');
      }
    }
    if (lastT > 0.82 && car.t < 0.16 && car.cp >= 3) {
      if (car.lap >= 3) {
        finishRace();
      } else {
        car.lap++;
        car.cp = 0;
        checkpoints.forEach((c) => { c.mat.color.setHex(0x5df3ff); c.mat.opacity = 0.55; });
        bestLap = Math.min(bestLap, lapTime);
        toast(`VOLTA ${car.lap} · ${fmt(lapTime)}`, 'lap');
        lapTime = 0;
        audio.success();
      }
    }
    lastT = car.t;

    // AI update
    ais.forEach((ai) => {
      const gap = (car.lap + car.t) - (ai.lap + ai.t);
      const rubber = gap > 0.22 ? 1.12 : gap < -0.18 ? 0.92 : 1;
      ai.t += (ai.speed * rubber * dt) / curveLength;
      if (ai.t >= 1) { ai.t -= 1; ai.lap++; }
      const p = curve.getPointAt(ai.t);
      const tan = curve.getTangentAt(ai.t);
      const nx = -tan.z, nz = tan.x;
      ai.offset += ((Math.sin(elapsed * 0.5 + ai.speed) * 3) - ai.offset) * dt;
      ai.mesh.position.set(p.x + nx * (ai.lane + ai.offset), 0, p.z + nz * (ai.lane + ai.offset));
      ai.mesh.rotation.y = Math.atan2(tan.x, tan.z);
    });

    lapTime += dt;
    raceTime += dt;
    if (car.off) $('#nd-speedo', hud).classList.add('off'); else $('#nd-speedo', hud).classList.remove('off');
    if (car.drift > 0.4) $('#nd-drift', hud).classList.add('show'); else $('#nd-drift', hud).classList.remove('show');
  }

  function finishRace() {
    if (finished) return;
    finished = true;
    car.speed = 0;
    const rank = getPosition();
    $('#nd-results', hud).classList.add('open');
    $('#nd-result-pos', hud).textContent = `${rank}º LUGAR`;
    $('#nd-result-time', hud).textContent = fmt(raceTime);
    $('#nd-result-best', hud).textContent = bestLap < Infinity ? fmt(bestLap) : '--:--';
    $('#nd-result-drifts', hud).textContent = drifts;
    audio.success();
  }

  function getPosition() {
    const playerProgress = car.lap + car.t;
    let pos = 1;
    ais.forEach((ai) => { if (ai.lap + ai.t > playerProgress) pos++; });
    return pos;
  }

  function fmt(s) {
    if (!isFinite(s)) return '--:--.--';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const cs = Math.floor((s % 1) * 100);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  function updateHud() {
    $('#nd-lap', hud).textContent = String(Math.min(3, car.lap));
    $('#nd-time', hud).textContent = fmt(raceTime);
    $('#nd-best', hud).textContent = `MELHOR: ${bestLap < Infinity ? fmt(bestLap) : '--:--'}`;
    const pos = getPosition();
    $('#nd-pos', hud).textContent = `${pos}º`;
    $('#nd-speed', hud).textContent = String(Math.round(Math.abs(car.speed) * 1.7)).padStart(3, '0');
    $('#nd-gear', hud).textContent = car.speed < -1 ? 'R' : car.speed > 1 ? 'D' : 'N';
    $('#nd-speed-fill', hud).style.width = `${clamp(Math.abs(car.speed) / 220 * 100, 0, 100)}%`;
    $('#nd-boost-fill', hud).style.width = `${clamp(car.boost, 0, 100)}%`;
    if (car.drift > 0.6 && !car.drifting) { car.drifting = true; drifts++; }
    if (car.drift < 0.2) car.drifting = false;
  }

  function drawMap() {
    const w = mapCanvas.width, h = mapCanvas.height;
    mctx.clearRect(0, 0, w, h);
    mctx.fillStyle = 'rgba(8,4,22,.7)'; mctx.fillRect(0, 0, w, h);
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    mapPoints.forEach((p) => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); });
    const pad = 22;
    const sx = (w - pad * 2) / (maxX - minX), sz = (h - pad * 2) / (maxZ - minZ);
    const sc = Math.min(sx, sz);
    const toX = (x) => pad + (x - minX) * sc + ((w - pad * 2) - (maxX - minX) * sc) / 2;
    const toY = (z) => pad + (z - minZ) * sc + ((h - pad * 2) - (maxZ - minZ) * sc) / 2;
    mctx.strokeStyle = '#5df3ff'; mctx.lineWidth = 3; mctx.shadowColor = '#5df3ff'; mctx.shadowBlur = 10;
    mctx.beginPath();
    mapPoints.forEach((p, i) => { if (i === 0) mctx.moveTo(toX(p.x), toY(p.z)); else mctx.lineTo(toX(p.x), toY(p.z)); });
    mctx.closePath(); mctx.stroke(); mctx.shadowBlur = 0;
    ais.forEach((ai) => { mctx.fillStyle = `#${new THREE.Color(ai.color).getHexString()}`; mctx.beginPath(); mctx.arc(toX(ai.mesh.position.x), toY(ai.mesh.position.z), 3, 0, Math.PI * 2); mctx.fill(); });
    mctx.fillStyle = '#fff'; mctx.shadowColor = '#fff'; mctx.shadowBlur = 8;
    mctx.beginPath(); mctx.arc(toX(car.x), toY(car.z), 4.5, 0, Math.PI * 2); mctx.fill(); mctx.shadowBlur = 0;
    checkpoints.forEach((cp) => { const p = curve.getPointAt(cp.t); mctx.strokeStyle = '#ffd56a'; mctx.lineWidth = 2; mctx.beginPath(); mctx.arc(toX(p.x), toY(p.z), 4, 0, Math.PI * 2); mctx.stroke(); });
  }

  function restart() {
    car.x = startPoint.x; car.z = startPoint.z; car.angle = Math.atan2(startT.x, startT.z);
    car.speed = 0; car.lap = 1; car.cp = 0; car.boost = 55; car.t = 0; car.off = false; car.drift = 0; car.finished = false;
    ais.forEach((ai, i) => { ai.t = (0.985 - i * 0.006 + 1) % 1; ai.lap = 0; });
    raceTime = 0; lapTime = 0; bestLap = Infinity; lastT = 0; drifts = 0; finished = false; countdown = 3.4;
    checkpoints.forEach((c) => { c.mat.color.setHex(0x5df3ff); c.mat.opacity = 0.55; });
    $('#nd-results', hud).classList.remove('open');
    audio.countdown();
  }

  function onKeyDown(e) {
    if (shell.paused) return;
    keys.add(e.code);
    if (e.code === 'KeyR') restart();
    if (e.code === 'Space') e.preventDefault();
  }
  function onKeyUp(e) { keys.delete(e.code); }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  $('#nd-again', hud).addEventListener('click', restart);
  $('#nd-exit', hud).addEventListener('click', () => shell.exit());

  function resize() {
    const w = shell.root.clientWidth || window.innerWidth;
    const h = shell.root.clientHeight || window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(devicePixelRatio, w < 760 ? 1.5 : 1.7));
  }
  window.addEventListener('resize', resize);
  resize();
  audio.countdown();

  let last = performance.now();
  let raf;
  function animate(now) {
    raf = requestAnimationFrame(animate);
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
    last = now;
    if (shell.paused) { renderer.render(scene, camera); return; }
    elapsed += dt;
    if (countdown > 0) {
      countdown -= dt;
      const n = Math.ceil(countdown);
      $('#nd-countdown', hud).classList.add('show');
      $('#nd-countdown', hud).textContent = n > 0 ? n : 'GO!';
      if (n === 2 || n === 1) audio.countdown();
      if (countdown <= 0) {
        setTimeout(() => $('#nd-countdown', hud).classList.remove('show'), 550);
        audio.countdown(true);
      }
    }
    if (!finished) updateCar(dt);
    updateHud();
    drawMap();

    // Camera
    const forward = new THREE.Vector3(Math.sin(car.angle), 0, Math.cos(car.angle));
    const desired = new THREE.Vector3(car.x - forward.x * 11, 5.4, car.z - forward.z * 11);
    if (car.drift > 0.5) desired.x += (Math.random() - 0.5) * 0.25;
    camera.position.lerp(desired, 1 - Math.pow(0.0008, dt));
    const look = new THREE.Vector3(car.x + forward.x * 12, 1.8, car.z + forward.z * 12);
    camera.lookAt(look);
    camera.fov += ((62 + Math.abs(car.speed) * 0.08) - camera.fov) * 0.05;
    camera.updateProjectionMatrix();

    sun.lookAt(camera.position.x, 110, camera.position.z);
    if (sun.material) sun.material.opacity = 1;
    particles.forEach((p, i) => {
      p.life -= dt; p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt; p.vy -= 4 * dt;
      p.m.material.opacity = p.life * 1.6;
      if (p.life <= 0) { scene.remove(p.m); p.m.material.dispose(); particles.splice(i, 1); }
    });
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(animate);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      clearTimeout(toastTimer);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose?.(); if (o.material) { if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.()); else o.material.dispose?.(); } });
      renderer.dispose();
      shell.destroy();
    },
    pause() { shell.setPaused(true); },
    resume() { shell.setPaused(false); },
  };
}
