import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createGameShell, createJoystick, bindLook, bindHold, isTouchDevice, clamp } from '../core/gameShell.js';
import { audio } from '../core/audio.js';

function starShape() {
  const shape = new THREE.Shape();
  const spikes = 5, outer = 1.15, inner = 0.48;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  return shape;
}

function makeTopTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8bf2a8'; ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = 'rgba(255,255,255,.16)';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2 === 0) ctx.fillRect(x * 32, y * 32, 32, 32);
  ctx.strokeStyle = 'rgba(10,60,40,.22)'; ctx.lineWidth = 3; ctx.strokeRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

export async function mount({ root, game, onExit }) {
  const shell = createGameShell({
    root, game, onExit,
    controls: '<b>WASD</b> mover · <b>Mouse arrastar</b> câmera · <b>Espaço</b> pular / duplo salto · <b>Shift</b> correr · <b>R</b> reiniciar · <b>Esc</b> pausar',
  });
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  shell.canvasWrap.appendChild(canvas);
  const hud = shell.hud;
  const touch = isTouchDevice();
  hud.innerHTML = `
    ${touch ? '<div class="look-zone"></div>' : ''}
    <div class="ad-quest">
      <span class="ad-kicker">MISSÃO ESPECIAL</span>
      <h3>Colete 10 estrelas</h3>
      <div class="ad-star-row" id="ad-stars"></div>
      <div class="ad-count"><b id="ad-count">0</b><span>/ 10 ESTRELAS</span></div>
    </div>
    <div class="ad-timer"><span>TEMPO</span><b id="ad-time">03:00</b><small>SETOR ASTRO-7</small></div>
    <div class="ad-radar"><canvas id="ad-radar" width="200" height="200"></canvas><span>RADAR</span></div>
    <div class="ad-toast" id="ad-toast">Use o duplo salto para alcançar as plataformas!</div>
    <div class="ad-jump" id="ad-jump">SALTO ×2</div>
    <div class="ad-win" id="ad-win"><div class="ad-win-card"><span>MISSÃO CUMPRIDA</span><h2>10 / 10<br />ESTRELAS</h2><p>Astro recuperou todas as estrelas perdidas. O espaço voltou a brilhar!</p><div class="ad-win-time"><b id="ad-win-time">00:00</b><small>TEMPO TOTAL</small></div><div class="ad-win-actions"><button id="ad-explore">EXPLORAR MAIS</button><button id="ad-exit">SAIR PARA O PS5</button></div></div></div>
    <div class="ad-fail" id="ad-fail"><div class="ad-win-card"><span>TEMPO ESGOTADO</span><h2>O ESPAÇO<br />ESPERA.</h2><p>As estrelas ainda estão lá. Tente novamente!</p><div class="ad-win-actions"><button id="ad-restart">TENTAR DE NOVO</button><button id="ad-fail-exit">SAIR</button></div></div></div>
    <div class="ad-touch touch-ui ${touch ? 'active' : ''}">
      <div class="joystick"><i></i></div>
      <div class="touch-right">
        <button class="touch-btn big b1" data-touch="jump">PULAR</button>
        <button class="touch-btn b3" data-touch="run">CORRER</button>
      </div>
    </div>`;

  function $(s, r = document) { return r.querySelector(s); }
  function $$(s, r = document) { return [...r.querySelectorAll(s)]; }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060a2c);
  scene.fog = new THREE.FogExp2(0x090c32, 0.006);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  // Sky
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(260, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { top: { value: new THREE.Color(0x050826) }, mid: { value: new THREE.Color(0x1b1468) }, low: { value: new THREE.Color(0x4a1470) } },
      vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vP; void main(){ float h=normalize(vP).y; vec3 c=mix(low,mid,smoothstep(-0.05,0.25,h)); c=mix(c,top,smoothstep(0.15,0.7,h)); gl_FragColor=vec4(c,1.0); }',
    })
  );
  scene.add(sky);
  const starsPos = [];
  for (let i = 0; i < 1100; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI;
    const r = 220;
    starsPos.push(Math.cos(th) * Math.sin(ph) * r, Math.cos(ph) * r, Math.sin(th) * Math.sin(ph) * r);
  }
  const starsGeo = new THREE.BufferGeometry(); starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsPos, 3));
  scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xdff4ff, size: 0.8, transparent: true, opacity: 0.85 })));

  // Planet + ring
  const planet = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 24), new THREE.MeshStandardMaterial({ color: 0x3f86ff, roughness: 0.6, metalness: 0.2, emissive: 0x1b2c9a, emissiveIntensity: 0.4 }));
  planet.position.set(-85, 58, -130);
  scene.add(planet);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(45, 2.5, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffb5f2, transparent: true, opacity: 0.55 }));
  ring.position.copy(planet.position); ring.rotation.set(1.1, 0.2, 0.4); scene.add(ring);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 20, 16), new THREE.MeshStandardMaterial({ color: 0x9b6bff, roughness: 0.8 }));
  moon.position.set(70, 75, -110); scene.add(moon);

  // Nebula glows
  const nebulaCanvas = document.createElement('canvas');
  nebulaCanvas.width = nebulaCanvas.height = 256;
  const nctx = nebulaCanvas.getContext('2d');
  const ng = nctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  ng.addColorStop(0, 'rgba(160,90,255,.55)'); ng.addColorStop(0.5, 'rgba(80,60,220,.18)'); ng.addColorStop(1, 'rgba(0,0,0,0)');
  nctx.fillStyle = ng; nctx.fillRect(0, 0, 256, 256);
  const nebulaTex = new THREE.CanvasTexture(nebulaCanvas);
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: nebulaTex, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.scale.setScalar(40 + Math.random() * 60);
    s.position.set((Math.random() - 0.5) * 240, 20 + Math.random() * 80, -80 - Math.random() * 100);
    scene.add(s);
  }

  scene.add(new THREE.HemisphereLight(0x9ed8ff, 0x2a1050, 1.35));
  const key = new THREE.DirectionalLight(0xfff0cf, 2.4);
  key.position.set(30, 70, 40);
  scene.add(key);
  const violet = new THREE.PointLight(0x9b6bff, 120, 160, 2); violet.position.set(-30, 25, -40); scene.add(violet);
  const cyan = new THREE.PointLight(0x5df3ff, 90, 150, 2); cyan.position.set(45, 30, 20); scene.add(cyan);

  // Platforms
  const topTex = makeTopTexture();
  const platformDefs = [
    { x: 0, z: 0, y: 0, w: 24, d: 24, color: 0x7ce6a0, big: true },
    { x: 0, z: -22, y: 1.5, w: 10, d: 10, color: 0x7ce6a0 },
    { x: 12, z: -38, y: 3.5, w: 9, d: 9, color: 0x8edcff },
    { x: 26, z: -52, y: 5.5, w: 12, d: 12, color: 0xffb5f2 },
    { x: 14, z: -68, y: 8, w: 8, d: 8, color: 0x8edcff },
    { x: -4, z: -78, y: 10.5, w: 14, d: 14, color: 0x7ce6a0, big: true },
    { x: -22, z: -64, y: 13, w: 8, d: 8, color: 0xffe08a },
    { x: -32, z: -46, y: 15.5, w: 11, d: 11, color: 0x8edcff },
    { x: -28, z: -24, y: 18, w: 9, d: 9, color: 0xffb5f2 },
    { x: -14, z: -8, y: 21, w: 13, d: 13, color: 0x7ce6a0, big: true },
    { x: 4, z: 8, y: 24, w: 9, d: 9, color: 0xffe08a },
    { x: 22, z: 20, y: 27, w: 12, d: 12, color: 0x8edcff },
    { x: 40, z: 10, y: 30, w: 18, d: 18, color: 0xffb5f2, big: true, goal: true },
  ];
  const platforms = [];
  const sideColors = [0x6b5cff, 0x2ccfb2, 0xff8ac4, 0xffc94a];
  platformDefs.forEach((p, i) => {
    const matTop = new THREE.MeshStandardMaterial({ map: topTex, color: p.color, roughness: 0.75, metalness: 0.05, emissive: p.color, emissiveIntensity: 0.08 });
    const matSide = new THREE.MeshStandardMaterial({ color: sideColors[i % sideColors.length], roughness: 0.65, metalness: 0.2 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(p.w, 2, p.d), [matSide, matSide, matTop, matSide, matSide, matSide]);
    mesh.position.set(p.x, p.y - 1, p.z);
    scene.add(mesh);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.5, 0.22, p.d + 0.5), new THREE.MeshBasicMaterial({ color: p.color }));
    rim.position.set(p.x, p.y + 0.06, p.z); scene.add(rim);
    const rock = new THREE.Mesh(new THREE.ConeGeometry(p.w * 0.42, p.w * 0.55, 6), new THREE.MeshStandardMaterial({ color: 0x2a1d4f, roughness: 0.95 }));
    rock.position.set(p.x, p.y - 2.4 - p.w * 0.2, p.z); rock.rotation.z = Math.PI; scene.add(rock);
    const platform = { ...p, mesh, top: p.y, standing: false, prevX: p.x, prevZ: p.z, moving: false };
    platforms.push(platform);

    // decorations
    if (p.big) {
      for (let j = 0; j < 5; j++) {
        const deco = new THREE.Mesh(
          j % 2 ? new THREE.ConeGeometry(0.55, 2.4, 5) : new THREE.DodecahedronGeometry(0.7, 0),
          new THREE.MeshStandardMaterial({ color: j % 2 ? 0x5df3ff : 0xffe08a, emissive: j % 2 ? 0x0e6a7a : 0x7a5a0e, emissiveIntensity: 0.4, roughness: 0.4 })
        );
        deco.position.set(p.x + (Math.random() - 0.5) * (p.w - 4), p.y + 1.2, p.z + (Math.random() - 0.5) * (p.d - 4));
        scene.add(deco);
      }
    }
  });

  // Moving platforms
  const moving = [
    { x: -18, z: -52, y: 12, w: 6, d: 6, axis: 'x', amp: 9, speed: 1.1, phase: 0 },
    { x: 34, z: -18, y: 24, w: 6, d: 6, axis: 'z', amp: 10, speed: 0.9, phase: 1.2 },
  ].map((m, i) => {
    const mat = new THREE.MeshStandardMaterial({ color: 0x5df3ff, roughness: 0.5, emissive: 0x0e6a7a, emissiveIntensity: 0.35 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(m.w, 1.2, m.d), mat);
    mesh.position.set(m.x, m.y - 0.6, m.z);
    scene.add(mesh);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(m.w + 0.3, 0.14, m.d + 0.3), new THREE.MeshBasicMaterial({ color: 0x5df3ff }));
    rim.position.set(m.x, m.y + 0.02, m.z); scene.add(rim);
    return { ...m, mesh, rim, top: m.y, baseX: m.x, baseZ: m.z, prevX: m.x, prevZ: m.z, moving: true };
  });
  platforms.push(...moving);

  // Stars
  const starGeo = new THREE.ExtrudeGeometry(starShape(), { depth: 0.25, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.1, bevelSegments: 2 });
  starGeo.center();
  const stars = [];
  const starPositions = [
    [0, 4.2, -22], [12, 6.2, -38], [26, 8.4, -52], [14, 10.8, -68], [-4, 13.4, -78],
    [-22, 16, -64], [-32, 18.5, -46], [-28, 21, -24], [-14, 24, -8], [4, 27, 8],
  ];
  starPositions.forEach(([x, y, z], i) => {
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(starGeo, new THREE.MeshStandardMaterial({ color: 0xffd84a, emissive: 0xff9d00, emissiveIntensity: 0.65, metalness: 0.4, roughness: 0.25 }));
    g.add(mesh);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const ctx = c.getContext('2d'); const gr = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(255,236,140,.9)'); gr.addColorStop(0.4, 'rgba(255,190,50,.3)'); gr.addColorStop(1, 'rgba(255,160,0,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.setScalar(5);
    g.add(glow);
    g.position.set(x, y, z);
    scene.add(g);
    stars.push({ group: g, x, y, z, taken: false, phase: i * 0.7 });
  });

  // Goal beacon
  const goal = platformDefs[platformDefs.length - 1];
  const beacon = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 40, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd84a, transparent: true, opacity: 0.1, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  beam.position.y = 20; beacon.add(beam);
  const beaconRing = new THREE.Mesh(new THREE.TorusGeometry(5, 0.4, 8, 40), new THREE.MeshBasicMaterial({ color: 0xffd84a }));
  beaconRing.rotation.x = Math.PI / 2; beaconRing.position.y = 1; beacon.add(beaconRing);
  beacon.position.set(goal.x, goal.y, goal.z); scene.add(beacon);

  // Asteroids
  const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x3a2a62, roughness: 0.95 });
  for (let i = 0; i < 30; i++) {
    const a = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + Math.random() * 4, 0), asteroidMat);
    a.position.set((Math.random() - 0.5) * 180, -10 + Math.random() * 55, (Math.random() - 0.5) * 180);
    a.rotation.set(Math.random(), Math.random(), Math.random());
    scene.add(a);
  }

  // Player
  const player = { x: 0, y: 0, z: 4, vy: 0, angle: Math.PI, onGround: true, jumps: 0, run: false, spawnX: 0, spawnY: 0, spawnZ: 4 };
  const pg = new THREE.Group();
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf1f8ff, roughness: 0.3, metalness: 0.15, clearcoat: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x12213d, roughness: 0.4, metalness: 0.5 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.2, 1.5, 0.9, 5, 0.25), white); body.position.y = 1.55; body.castShadow = true; pg.add(body);
  const head = new THREE.Mesh(new RoundedBoxGeometry(1.15, 0.95, 1, 5, 0.26), white); head.position.y = 2.8; head.castShadow = true; pg.add(head);
  const visor = new THREE.Mesh(new RoundedBoxGeometry(0.86, 0.42, 0.18, 4, 0.1), new THREE.MeshStandardMaterial({ color: 0x0c2245, emissive: 0x5df3ff, emissiveIntensity: 0.55, roughness: 0.2 })); visor.position.set(0, 2.84, 0.52); pg.add(visor);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0x8ffaff })); eyeL.position.set(-0.22, 2.86, 0.63); pg.add(eyeL);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.22; pg.add(eyeR);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 6), white); antenna.position.y = 3.65; pg.add(antenna);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), new THREE.MeshBasicMaterial({ color: 0x5df3ff })); tip.position.y = 4.02; pg.add(tip);
  const legL = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.85, 0.55, 4, 0.14), white); legL.position.set(-0.3, 0.5, 0); pg.add(legL);
  const legR = legL.clone(); legR.position.x = 0.3; pg.add(legR);
  const armL = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.95, 0.45, 4, 0.12), white); armL.position.set(-0.85, 1.65, 0); pg.add(armL);
  const armR = armL.clone(); armR.position.x = 0.85; pg.add(armR);
  const jet = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.3), dark); jet.position.set(0, 1.65, -0.55); pg.add(jet);
  const jetGlow = new THREE.PointLight(0x5df3ff, 1, 4, 2); jetGlow.position.set(0, 1.4, -0.9); pg.add(jetGlow);
  pg.position.set(player.x, player.y, player.z);
  pg.rotation.y = player.angle;
  scene.add(pg);

  const keys = new Set();
  const joystick = touch ? createJoystick($('.joystick', hud)) : { x: 0, y: 0 };
  const touchState = { jump: false, run: false };
  if (touch) {
    bindHold($('[data-touch="jump"]', hud), (v) => { if (v) jump(); });
    bindHold($('[data-touch="run"]', hud), (v) => { touchState.run = v; });
    bindLook($('.look-zone', hud), (dx, dy) => { camYaw -= dx * 0.004; camPitch = clamp(camPitch + dy * 0.0025, -0.25, 0.75); });
  }

  let camYaw = 0;
  let camPitch = 0.18;
  let elapsed = 0;
  let timeLeft = 180;
  let count = 0;
  let won = false;
  let failed = false;
  let toastTimer;
  let safe = { x: 0, y: 0, z: 4 };
  let standingPlatform = null;
  const radar = $('#ad-radar', hud);
  const rctx = radar.getContext('2d');

  function toast(text) {
    const el = $('#ad-toast', hud);
    el.textContent = text; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function jump() {
    if (won || failed) return;
    if (player.onGround) {
      player.vy = 11.5; player.onGround = false; player.jumps = 1; audio.jump();
    } else if (player.jumps < 2) {
      player.vy = 10.5; player.jumps = 2; audio.jump();
      for (let i = 0; i < 8; i++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x5df3ff }));
        p.position.set(player.x + (Math.random() - 0.5) * 1.5, player.y + 0.2, player.z + (Math.random() - 0.5) * 1.5);
        scene.add(p);
        particles.push({ m: p, vx: (Math.random() - 0.5) * 4, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 4, life: 0.4 });
      }
    }
    $('#ad-jump', hud).classList.add('used');
    setTimeout(() => $('#ad-jump', hud).classList.remove('used'), 180);
  }

  const particles = [];

  function respawn() {
    player.x = safe.x; player.y = safe.y; player.z = safe.z;
    player.vy = 0; player.onGround = true; player.jumps = 0;
    pg.position.set(player.x, player.y, player.z);
    toast('Você caiu no vazio. De volta ao último checkpoint.');
    audio.error();
  }

  function collectStar(star) {
    star.taken = true;
    star.group.visible = false;
    count++;
    audio.pickup();
    $('#ad-count', hud).textContent = count;
    const pips = $$('.ad-star-pip', hud);
    if (pips[count - 1]) pips[count - 1].classList.add('on');
    toast(`Estrela ${count}/10 coletada!`);
    if (count >= 10) {
      won = true;
      setTimeout(() => {
        $('#ad-win-time', hud).textContent = fmt(180 - timeLeft);
        $('#ad-win', hud).classList.add('open');
        audio.success();
      }, 500);
    }
  }

  function fmt(s) {
    const m = Math.floor(Math.max(0, s) / 60);
    const sec = Math.floor(Math.max(0, s) % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function restart() {
    timeLeft = 180; count = 0; won = false; failed = false;
    player.x = 0; player.y = 0; player.z = 4; player.vy = 0; player.onGround = true; player.jumps = 0;
    safe = { x: 0, y: 0, z: 4 };
    stars.forEach((s) => { s.taken = false; s.group.visible = true; });
    $$('.ad-star-pip', hud).forEach((p) => p.classList.remove('on'));
    $('#ad-count', hud).textContent = '0';
    $('#ad-win', hud).classList.remove('open');
    $('#ad-fail', hud).classList.remove('open');
    pg.position.set(player.x, player.y, player.z);
    audio.countdown(true);
  }

  function onKeyDown(e) {
    if (shell.paused) return;
    keys.add(e.code);
    if (e.code === 'Space') { jump(); e.preventDefault(); }
    if (e.code === 'KeyR') restart();
  }
  function onKeyUp(e) { keys.delete(e.code); }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  $('#ad-explore', hud).addEventListener('click', () => $('#ad-win', hud).classList.remove('open'));
  $('#ad-exit', hud).addEventListener('click', () => shell.exit());
  $('#ad-restart', hud).addEventListener('click', restart);
  $('#ad-fail-exit', hud).addEventListener('click', () => shell.exit());

  let dragging = false, lastX = 0, lastY = 0;
  function onPointerDown(e) { if (e.target.closest('button')) return; dragging = true; lastX = e.clientX; lastY = e.clientY; }
  function onPointerMove(e) {
    if (!dragging) return;
    camYaw -= (e.clientX - lastX) * 0.005;
    camPitch = clamp(camPitch + (e.clientY - lastY) * 0.003, -0.25, 0.75);
    lastX = e.clientX; lastY = e.clientY;
  }
  function onPointerUp() { dragging = false; }
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  function drawRadar() {
    const w = radar.width, h = radar.height;
    rctx.clearRect(0, 0, w, h);
    rctx.save();
    rctx.beginPath(); rctx.arc(w / 2, h / 2, w / 2 - 4, 0, Math.PI * 2); rctx.clip();
    rctx.fillStyle = 'rgba(8,10,40,.75)'; rctx.fillRect(0, 0, w, h);
    const scale = 1.25;
    const cx = w / 2, cz = h / 2;
    platforms.forEach((p) => {
      const x = cx + (p.x - player.x) * scale;
      const z = cz + (p.z - player.z) * scale;
      if (x < -30 || x > w + 30 || z < -30 || z > h + 30) return;
      rctx.fillStyle = p.goal ? '#ffd84a' : 'rgba(93,243,255,.55)';
      rctx.fillRect(x - p.w * scale / 2, z - p.d * scale / 2, p.w * scale, p.d * scale);
    });
    stars.forEach((s) => {
      if (s.taken) return;
      const x = cx + (s.x - player.x) * scale;
      const z = cz + (s.z - player.z) * scale;
      if (x < 0 || x > w || z < 0 || z > h) return;
      rctx.fillStyle = '#ffd84a'; rctx.beginPath(); rctx.arc(x, z, 3.2, 0, Math.PI * 2); rctx.fill();
    });
    rctx.fillStyle = '#fff'; rctx.shadowColor = '#5df3ff'; rctx.shadowBlur = 10;
    rctx.beginPath(); rctx.arc(cx, cz, 5, 0, Math.PI * 2); rctx.fill(); rctx.shadowBlur = 0;
    rctx.restore();
    rctx.strokeStyle = 'rgba(93,243,255,.45)'; rctx.lineWidth = 2;
    rctx.beginPath(); rctx.arc(w / 2, h / 2, w / 2 - 5, 0, Math.PI * 2); rctx.stroke();
  }

  function updatePlayer(dt) {
    if (won || failed) return;
    const ix = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0) + (joystick.x || 0);
    const iz = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0) + (-joystick.y || 0);
    const len = Math.hypot(ix, iz);
    const speed = (keys.has('ShiftLeft') || touchState.run ? 18 : 12) * dt;
    if (len > 0.05) {
      const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
      const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
      let mx = fx * iz + rx * ix, mz = fz * iz + rz * ix;
      const ml = Math.hypot(mx, mz); mx /= ml; mz /= ml;
      player.x += mx * speed; player.z += mz * speed;
      player.angle = THREE.MathUtils.lerp(player.angle, Math.atan2(mx, mz), dt * 12);
    }
    player.vy -= 29 * dt;
    const prevY = player.y;
    player.y += player.vy * dt;
    player.onGround = false;
    let onPlat = null;
    for (const p of platforms) {
      if (Math.abs(player.x - p.x) < p.w / 2 - 0.3 && Math.abs(player.z - p.z) < p.d / 2 - 0.3) {
        if (prevY >= p.top - 0.4 && player.y <= p.top && player.vy <= 0) {
          player.y = p.top; player.vy = 0; player.onGround = true; player.jumps = 0;
          onPlat = p;
          safe = { x: p.x, y: p.top, z: p.z };
          break;
        }
      }
    }
    if (onPlat && onPlat.moving) {
      player.x += onPlat.x - onPlat.prevX;
      player.z += onPlat.z - onPlat.prevZ;
    }
    standingPlatform = onPlat;
    if (player.y < -25) respawn();
    pg.position.set(player.x, player.y, player.z);
    pg.rotation.y = player.angle;
    const moving = len > 0.05 && player.onGround;
    legL.rotation.x = Math.sin(elapsed * 12) * (moving ? 0.55 : 0);
    legR.rotation.x = -Math.sin(elapsed * 12) * (moving ? 0.55 : 0);
    armL.rotation.x = -Math.sin(elapsed * 12) * (moving ? 0.4 : 0);
    armR.rotation.x = Math.sin(elapsed * 12) * (moving ? 0.4 : 0);
    if (!player.onGround) { armL.rotation.x = -0.7; armR.rotation.x = -0.7; }
    $('#ad-jump', hud).textContent = player.onGround ? 'SALTO ×2' : player.jumps >= 2 ? 'SEM SALTO' : 'DUPLO SALTO';
    stars.forEach((s) => {
      if (s.taken) return;
      const d = Math.hypot(s.x - player.x, (s.y - (player.y + 1.8)), s.z - player.z);
      if (d < 2.4) collectStar(s);
    });
  }

  function updateMoving(dt) {
    moving.forEach((m, i) => {
      m.prevX = m.x; m.prevZ = m.z;
      const off = Math.sin(elapsed * m.speed + m.phase) * m.amp;
      if (m.axis === 'x') m.x = m.baseX + off; else m.z = m.baseZ + off;
      m.mesh.position.set(m.x, m.y - 0.6, m.z);
      m.rim.position.set(m.x, m.y + 0.02, m.z);
    });
  }

  function updateCamera(dt) {
    const target = new THREE.Vector3(player.x, player.y + 1.9, player.z);
    const dist = 9.5;
    const desired = new THREE.Vector3(
      player.x + Math.sin(camYaw) * dist * Math.cos(camPitch),
      player.y + 4.2 + Math.sin(camPitch) * dist,
      player.z + Math.cos(camYaw) * dist * Math.cos(camPitch)
    );
    camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
    camera.lookAt(target);
  }

  function resize() {
    const w = shell.root.clientWidth || window.innerWidth;
    const h = shell.root.clientHeight || window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(devicePixelRatio, w < 760 ? 1.5 : 1.7));
  }
  window.addEventListener('resize', resize);
  resize();
  // star pips
  $('#ad-stars', hud).innerHTML = Array.from({ length: 10 }, () => '<i class="ad-star-pip">★</i>').join('');
  setTimeout(() => toast('Use o duplo salto para alcançar as plataformas!'), 900);

  let last = performance.now();
  let raf;
  function animate(now) {
    raf = requestAnimationFrame(animate);
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
    last = now;
    if (shell.paused) { renderer.render(scene, camera); return; }
    elapsed += dt;
    if (!won && !failed) {
      timeLeft -= dt;
      if (timeLeft <= 0) {
        failed = true;
        timeLeft = 0;
        $('#ad-fail', hud).classList.add('open');
        audio.error();
      }
    }
    updateMoving(dt);
    updatePlayer(dt);
    updateCamera(dt);
    stars.forEach((s) => {
      if (s.taken) return;
      s.group.rotation.y += dt * 1.8;
      s.group.position.y = s.y + Math.sin(elapsed * 2 + s.phase) * 0.25;
    });
    beaconRing.rotation.z += dt * 0.5;
    beam.material.opacity = 0.08 + Math.sin(elapsed * 2) * 0.03;
    particles.forEach((p, i) => {
      p.life -= dt; p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt; p.vy -= 8 * dt;
      p.m.material.opacity = p.life * 2;
      if (p.life <= 0) { scene.remove(p.m); p.m.material.dispose(); particles.splice(i, 1); }
    });
    $('#ad-time', hud).textContent = fmt(timeLeft);
    drawRadar();
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
      clearTimeout(toastTimer);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose?.(); if (o.material) { if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.()); else o.material.dispose?.(); } });
      renderer.dispose();
      shell.destroy();
    },
    pause() { shell.setPaused(true); },
    resume() { shell.setPaused(false); },
  };
}
