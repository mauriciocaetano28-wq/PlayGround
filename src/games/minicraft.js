import * as THREE from 'three';
import { createGameShell, createJoystick, bindLook, bindHold, isTouchDevice, clamp } from '../core/gameShell.js';
import { audio } from '../core/audio.js';

const WORLD = 54;
const HALF = WORLD / 2;
const SEA = 2.7;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const BLOCKS = {
  grass: { top: 0x62c957, side: 0x7a5836, icon: 'linear-gradient(#65d45b 0 30%,#855c38 30%)', label: 'Grama' },
  dirt: { color: 0x8a5c38, icon: 'linear-gradient(145deg,#a8764c,#6c4528)', label: 'Terra' },
  wood: { color: 0x7b4c2a, icon: 'repeating-linear-gradient(90deg,#8d5b32 0 4px,#6b3f22 4px 7px)', label: 'Madeira' },
  stone: { color: 0x8c96a3, icon: 'linear-gradient(145deg,#aeb7c2,#66717e)', label: 'Pedra' },
  leaves: { color: 0x2f9e52, icon: 'linear-gradient(145deg,#44c46b,#247442)', label: 'Folhas' },
};

export async function mount({ root, game, onExit }) {
  const shell = createGameShell({
    root, game, onExit,
    controls: '<b>WASD</b> mover · <b>Mouse</b> olhar · <b>Clique esq.</b> minerar · <b>Clique dir.</b> colocar · <b>Espaço</b> pular · <b>1-5</b> hotbar · <b>C</b> criar',
  });
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  shell.canvasWrap.appendChild(canvas);
  const hud = shell.hud;
  const touch = isTouchDevice();
  hud.innerHTML = `
    ${touch ? '<div class="look-zone"></div>' : ''}
    <div class="mc-quest">
      <span class="mc-kicker">MISSÃO PRINCIPAL</span>
      <h3>Construa o Portal</h3>
      <p>Colete recursos e abra a bancada de criação para voltar para casa.</p>
      <div class="mc-req"><span class="mc-req-icon wood"></span><b id="mc-wood">0</b><small>/ 8 madeira</small></div>
      <div class="mc-req"><span class="mc-req-icon stone"></span><b id="mc-stone">0</b><small>/ 12 pedra</small></div>
      <div class="mc-quest-bar"><i id="mc-quest-fill"></i></div>
    </div>
    <div class="mc-clock"><span id="mc-day">DIA 01</span><b id="mc-time">08:24</b><small>FLORESTA DOS BLOCOS</small></div>
    <div class="mc-crosshair"><i id="mc-crosshair-ring"></i><span></span></div>
    <div class="mc-hotbar" id="mc-hotbar"></div>
    <div class="mc-tools">
      <button class="mc-craft-btn" id="mc-craft-btn"><span>⚒</span> CRIAR <kbd>C</kbd></button>
      <span class="mc-hint desktop-only">Clique para capturar o mouse · ESC libera</span>
    </div>
    <div class="mc-mission-toast" id="mc-mission-toast"></div>
    <div class="mc-craft-panel" id="mc-craft-panel">
      <div class="mc-craft-head"><span>BANCADA DE CRIAÇÃO</span><button id="mc-craft-close">✕</button></div>
      <div class="mc-recipe" data-recipe="pickaxe">
        <span class="mc-recipe-icon">⛏</span>
        <div><b>Picareta de pedra</b><small>Minera 2× mais rápido</small><em>3 madeira + 2 pedra</em></div>
        <button id="mc-craft-pickaxe">CRIAR</button>
      </div>
      <div class="mc-recipe" data-recipe="portal">
        <span class="mc-recipe-icon portal">◈</span>
        <div><b>Portal dimensional</b><small>Objetivo final da ilha</small><em>8 madeira + 12 pedra</em></div>
        <button id="mc-craft-portal">CRIAR</button>
      </div>
      <div class="mc-inv-line"><span>Inventário</span><b id="mc-inv-wood">0 madeira</b><b id="mc-inv-stone">0 pedra</b></div>
    </div>
    <div class="mc-win" id="mc-win">
      <div class="mc-win-card"><span>OBJETIVO CONCLUÍDO</span><h2>PORTAL<br />CONSTRUÍDO</h2><p>Você dominou a ilha de blocos. O portal está brilhando — e a aventura só está começando.</p><div><button id="mc-win-continue">Continuar explorando</button><button id="mc-win-exit">Sair para o PS5</button></div></div>
    </div>
    <div class="mc-touch touch-ui ${touch ? 'active' : ''}">
      <div class="joystick"><i></i></div>
      <div class="touch-right">
        <button class="touch-btn big b1" data-touch="jump">PULAR</button>
        <button class="touch-btn b2" data-touch="mine">MINERAR</button>
        <button class="touch-btn b3" data-touch="place">POR</button>
      </div>
    </div>`;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7dcfff);
  scene.fog = new THREE.Fog(0x9edcff, 26, 64);
  const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 160);
  camera.rotation.order = 'YXZ';
  scene.add(camera);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const rng = mulberry32(20261122);
  const blocks = [];
  const columns = new Map();
  const raycastTargets = [];
  const materials = {
    grass: new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: false }),
    dirt: new THREE.MeshLambertMaterial({ color: BLOCKS.dirt.color }),
    wood: new THREE.MeshLambertMaterial({ color: BLOCKS.wood.color }),
    stone: new THREE.MeshLambertMaterial({ color: BLOCKS.stone.color }),
    leaves: new THREE.MeshLambertMaterial({ color: BLOCKS.leaves.color }),
  };
  const blockGeo = new THREE.BoxGeometry(1, 1, 1);
  const keyOf = (x, z) => `${Math.round(x)},${Math.round(z)}`;
  const addToColumn = (b) => {
    const k = keyOf(b.x, b.z);
    if (!columns.has(k)) columns.set(k, []);
    columns.get(k).push(b);
  };
  const addBlock = (x, y, z, type, opts = {}) => {
    const b = { x: Math.round(x), y: Math.round(y), z: Math.round(z), type, broken: false, instance: null, mesh: null, placed: false };
    blocks.push(b);
    addToColumn(b);
    return b;
  };

  const heights = new Map();
  const heightAt = (x, z) => {
    const k = keyOf(x, z);
    if (!heights.has(k)) {
      const arr = columns.get(k);
      let h = 0;
      if (arr) for (const b of arr) if (!b.broken && b.y + 0.5 > h) h = b.y + 0.5;
      heights.set(k, h);
      return h;
    }
    return heights.get(k);
  };
  const invalidate = (x, z) => heights.delete(keyOf(x, z));

  // Generate height map with a lake basin.
  const hmap = new Map();
  for (let x = -HALF; x < HALF; x++) {
    for (let z = -HALF; z < HALF; z++) {
      const nx = x / HALF, nz = z / HALF;
      let h = 3.2 + Math.sin(x * 0.19) * 1.15 + Math.cos(z * 0.17) * 1.05 + Math.sin((x + z) * 0.1) * 0.85 + (rng() - 0.5) * 0.55;
      const lake = Math.hypot(x + 12, z - 9);
      if (lake < 8.5) h = Math.min(h, 1.6 + lake * 0.16);
      hmap.set(keyOf(x, z), clamp(Math.round(h), 1, 7));
    }
  }
  for (let x = -HALF; x < HALF; x++) {
    for (let z = -HALF; z < HALF; z++) {
      const h = hmap.get(keyOf(x, z));
      addBlock(x, h, z, 'grass');
      addBlock(x, h - 1, z, 'dirt');
      if (h > 2) addBlock(x, h - 2, z, 'dirt');
    }
  }

  // Trees, boulders, flowers.
  const treeSpots = [];
  for (let i = 0; i < 34; i++) {
    const x = Math.round((rng() - 0.5) * (WORLD - 10));
    const z = Math.round((rng() - 0.5) * (WORLD - 10));
    if (Math.hypot(x + 12, z - 9) < 11 || Math.hypot(x, z) < 4) continue;
    const base = hmap.get(keyOf(x, z));
    if (!base) continue;
    const trunkH = 2 + Math.floor(rng() * 3);
    for (let y = 1; y <= trunkH; y++) addBlock(x, base + y, z, 'wood');
    const top = base + trunkH;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 0; dy <= 2; dy++) {
          if (Math.abs(dx) + Math.abs(dz) + dy > 4) continue;
          if (dx === 0 && dz === 0 && dy < 2) continue;
          addBlock(x + dx, top + dy, z + dz, 'leaves');
        }
      }
    }
    treeSpots.push({ x, z });
  }
  for (let i = 0; i < 26; i++) {
    const x = Math.round((rng() - 0.5) * (WORLD - 8));
    const z = Math.round((rng() - 0.5) * (WORLD - 8));
    if (Math.hypot(x + 12, z - 9) < 10) continue;
    const base = hmap.get(keyOf(x, z));
    if (!base) continue;
    const w = rng() > 0.6 ? 2 : 1;
    for (let dx = 0; dx < w; dx++) for (let dz = 0; dz < w; dz++) addBlock(x + dx, base + 1, z + dz, 'stone');
  }

  // Build instanced meshes by type.
  const byType = {};
  blocks.forEach((b) => { (byType[b.type] ||= []).push(b); });
  const instanced = {};
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  Object.entries(byType).forEach(([type, arr]) => {
    const mesh = new THREE.InstancedMesh(blockGeo, materials[type], arr.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    arr.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (type === 'grass') {
        const v = 0.82 + rng() * 0.3;
        color.setRGB(0.4 * v, 0.85 * v, 0.36 * v);
        mesh.setColorAt(i, color);
      } else if (type === 'leaves') {
        const v = 0.72 + rng() * 0.4;
        color.setRGB(0.18 * v, 0.72 * v, 0.31 * v);
        mesh.setColorAt(i, color);
      } else if (type === 'stone') {
        const v = 0.75 + rng() * 0.35;
        color.setRGB(0.54 * v, 0.58 * v, 0.63 * v);
        mesh.setColorAt(i, color);
      }
      b.instance = { mesh, index: i };
      mesh.userData.blocks = arr;
    });
    instanced[type] = mesh;
    scene.add(mesh);
    raycastTargets.push(mesh);
  });

  // Decorative flowers / grass tufts.
  const flowerGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  const flowerCount = 150;
  const flowers = new THREE.InstancedMesh(flowerGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), flowerCount);
  let fi = 0;
  const flowerColors = [0xffd84a, 0xff5f9c, 0xffffff, 0xff8a4a];
  while (fi < flowerCount) {
    const x = Math.round((rng() - 0.5) * (WORLD - 6));
    const z = Math.round((rng() - 0.5) * (WORLD - 6));
    const base = hmap.get(keyOf(x, z));
    if (!base) continue;
    dummy.position.set(x + (rng() - 0.5) * 0.7, base + 0.58, z + (rng() - 0.5) * 0.7);
    dummy.scale.setScalar(0.8 + rng() * 0.5);
    dummy.updateMatrix();
    flowers.setMatrixAt(fi, dummy.matrix);
    flowers.setColorAt(fi, new THREE.Color(flowerColors[Math.floor(rng() * flowerColors.length)]));
    fi++;
  }
  scene.add(flowers);

  // Water.
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD + 8, WORLD + 8, 1, 1),
    new THREE.MeshPhongMaterial({ color: 0x2a9bd0, transparent: true, opacity: 0.68, shininess: 120, specular: 0x9fe8ff })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = SEA;
  scene.add(water);

  // Clouds.
  const clouds = new THREE.Group();
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.78 });
  for (let i = 0; i < 16; i++) {
    const g = new THREE.Group();
    const n = 3 + Math.floor(rng() * 4);
    for (let j = 0; j < n; j++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(2 + rng() * 4, 1 + rng() * 1.2, 2 + rng() * 3), cloudMat);
      m.position.set((rng() - 0.5) * 8, (rng() - 0.5) * 1.2, (rng() - 0.5) * 5);
      g.add(m);
    }
    g.position.set((rng() - 0.5) * 80, 21 + rng() * 8, (rng() - 0.5) * 80);
    clouds.add(g);
  }
  scene.add(clouds);

  // Sky dome + sun.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { top: { value: new THREE.Color(0x3fa9f5) }, bottom: { value: new THREE.Color(0xd6f4ff) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = normalize(vP).y; gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.05,0.65,h)),1.0); }',
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(90, 24, 16), skyMat));
  const sun = new THREE.Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshBasicMaterial({ color: 0xfff4b8, fog: false }));
  sun.position.set(-45, 38, -55);
  sun.lookAt(0, 0, 0);
  scene.add(sun);
  const sunGlow = new THREE.Mesh(new THREE.CircleGeometry(9, 32), new THREE.MeshBasicMaterial({ color: 0xfff1a0, transparent: true, opacity: 0.18, fog: false, blending: THREE.AdditiveBlending }));
  sunGlow.position.copy(sun.position).multiplyScalar(0.995);
  sunGlow.lookAt(0, 0, 0);
  scene.add(sunGlow);

  // Lights.
  scene.add(new THREE.HemisphereLight(0xbfe9ff, 0x4e6637, 1.25));
  const sunLight = new THREE.DirectionalLight(0xfff2cf, 2.3);
  sunLight.position.set(-28, 38, -30);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1536, 1536);
  sunLight.shadow.camera.left = -30; sunLight.shadow.camera.right = 30;
  sunLight.shadow.camera.top = 30; sunLight.shadow.camera.bottom = -30;
  sunLight.shadow.camera.far = 100;
  sunLight.shadow.bias = -0.0006;
  scene.add(sunLight);
  const fill = new THREE.DirectionalLight(0x6cb8ff, 0.6);
  fill.position.set(30, 18, 24);
  scene.add(fill);

  // Player and hand.
  const player = { x: 0, z: 5, y: 8, vy: 0, onGround: false, yaw: Math.PI, pitch: -0.08, bob: 0 };
  player.y = heightAt(player.x, player.z) + 1.4;
  const hand = new THREE.Group();
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.5), new THREE.MeshLambertMaterial({ color: 0xd7a276 }));
  arm.position.set(0, 0, -0.18);
  hand.add(arm);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.6, 0.045), new THREE.MeshLambertMaterial({ color: 0x7d4b27 }));
  handle.position.set(0, -0.14, -0.33);
  handle.rotation.x = 0.7;
  hand.add(handle);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.11, 0.12), new THREE.MeshLambertMaterial({ color: 0xb8c4cf }));
  head.position.set(0, 0.14, -0.53);
  head.rotation.x = 0.7;
  hand.add(head);
  hand.position.set(0.43, -0.42, -0.65);
  hand.rotation.set(-0.15, -0.18, 0.12);
  camera.add(hand);

  // Target outline.
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01)),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
  );
  outline.visible = false;
  scene.add(outline);

  const inventory = { dirt: 10, grass: 4, wood: 0, stone: 0, leaves: 0 };
  const hotbarTypes = ['dirt', 'grass', 'wood', 'stone', 'leaves'];
  let selectedSlot = 0;
  let pickaxe = false;
  let craftOpen = false;
  let won = false;
  let mining = false;
  let mineProgress = 0;
  let targetBlock = null;
  let lastBreak = 0;
  let elapsed = 0;
  let placeCooldown = 0;

  const raycaster = new THREE.Raycaster();
  raycaster.far = 5.8;
  const center = new THREE.Vector2(0, 0);
  const keys = new Set();
  const joystick = touch ? createJoystick($('.joystick', hud)) : { x: 0, y: 0 };
  const touchState = { jump: false, mine: false, place: false };
  if (touch) {
    bindHold($('[data-touch="jump"]', hud), (v) => { touchState.jump = v; });
    bindHold($('[data-touch="mine"]', hud), (v) => { touchState.mine = v; mining = v; if (v) mineProgress = 0; });
    bindHold($('[data-touch="place"]', hud), (v) => { touchState.place = v; if (v) placeBlock(); });
  }
  bindLook($('.look-zone', hud), (dx, dy) => {
    if (craftOpen || shell.paused) return;
    player.yaw -= dx * 0.004;
    player.pitch = clamp(player.pitch - dy * 0.003, -1.35, 1.35);
  });

  function renderHotbar() {
    const el = $('#mc-hotbar', hud);
    el.innerHTML = hotbarTypes.map((type, i) => `
      <button class="mc-slot${i === selectedSlot ? ' active' : ''}" data-slot="${i}" title="${BLOCKS[type].label}">
        <span class="mc-block-icon" style="background:${BLOCKS[type].icon}"></span>
        <b>${inventory[type]}</b><small>${i + 1}</small>
      </button>`).join('');
    $$('.mc-slot', el).forEach((b) => b.addEventListener('click', () => {
      selectedSlot = Number(b.dataset.slot);
      renderHotbar();
      audio.click();
    }));
  }
  function $(s, r = document) { return r.querySelector(s); }
  function $$(s, r = document) { return [...r.querySelectorAll(s)]; }

  function updateQuest() {
    $('#mc-wood', hud).textContent = inventory.wood;
    $('#mc-stone', hud).textContent = inventory.stone;
    const pct = clamp((Math.min(inventory.wood, 8) / 8 * 0.5 + Math.min(inventory.stone, 12) / 12 * 0.5) * 100, 0, 100);
    $('#mc-quest-fill', hud).style.width = `${pct}%`;
    $('#mc-inv-wood', hud).textContent = `${inventory.wood} madeira`;
    $('#mc-inv-stone', hud).textContent = `${inventory.stone} pedra`;
    $('#mc-craft-pickaxe', hud).disabled = pickaxe || inventory.wood < 3 || inventory.stone < 2;
    $('#mc-craft-portal', hud).disabled = inventory.wood < 8 || inventory.stone < 12;
    if (inventory.wood >= 8 && inventory.stone >= 12 && !won) {
      $('#mc-craft-btn', hud).classList.add('ready');
    }
  }

  function setTarget(block) {
    targetBlock = block;
    if (block) {
      outline.visible = true;
      outline.position.set(block.x, block.y, block.z);
    } else outline.visible = false;
  }

  function breakBlock(block) {
    if (!block || block.broken) return;
    block.broken = true;
    if (block.instance) {
      dummy.position.set(0, -100, 0);
      dummy.scale.setScalar(0.001);
      dummy.updateMatrix();
      block.instance.mesh.setMatrixAt(block.instance.index, dummy.matrix);
      block.instance.mesh.instanceMatrix.needsUpdate = true;
    }
    if (block.mesh) {
      scene.remove(block.mesh);
      raycastTargets.splice(raycastTargets.indexOf(block.mesh), 1);
    }
    invalidate(block.x, block.z);
    const gain = block.type === 'grass' ? 'dirt' : block.type;
    inventory[gain] = (inventory[gain] || 0) + 1;
    if (block.type === 'leaves' && Math.random() < 0.3) inventory.wood += 1;
    audio.pickup();
    spawnParticles(block.x, block.y, block.z, block.type);
    renderHotbar();
    updateQuest();
    setTarget(null);
    mineProgress = 0;
    $('#mc-crosshair-ring', hud).style.background = 'transparent';
    if (inventory.wood >= 8 && inventory.stone >= 12 && !won) showMission('Recursos completos! Abra a bancada e crie o portal.');
    else if ((inventory.wood === 3 || inventory.stone === 2) && !pickaxe) showMission('Você já pode criar uma picareta. Pressione C.');
  }

  function placeBlock() {
    if (!targetBlock || craftOpen || shell.paused || placeCooldown > 0) return;
    const type = hotbarTypes[selectedSlot];
    if (inventory[type] <= 0) { audio.error(); showMission(`Sem ${BLOCKS[type].label.toLowerCase()} no inventário.`); return; }
    const hit = rayTarget;
    if (!hit) return;
    const n = hit.face.normal;
    const nx = targetBlock.x + Math.round(n.x);
    const ny = targetBlock.y + Math.round(n.y);
    const nz = targetBlock.z + Math.round(n.z);
    if (ny < 0 || Math.abs(nx) > HALF || Math.abs(nz) > HALF) return;
    if (Math.abs(nx - player.x) < 0.8 && Math.abs(nz - player.z) < 0.8 && ny > player.y - 0.2 && ny < player.y + 1.9) return;
    const mesh = new THREE.Mesh(blockGeo, materials[type]);
    mesh.position.set(nx, ny, nz);
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh);
    const b = addBlock(nx, ny, nz, type);
    b.placed = true;
    b.mesh = mesh;
    mesh.userData.block = b;
    raycastTargets.push(mesh);
    invalidate(nx, nz);
    inventory[type] -= 1;
    placeCooldown = 0.18;
    audio.install();
    renderHotbar();
    updateQuest();
    spawnParticles(nx, ny, nz, type, 5);
  }

  const particles = [];
  const particleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  function spawnParticles(x, y, z, type, count = 10) {
    const mat = new THREE.MeshLambertMaterial({ color: BLOCKS[type]?.color || 0xffffff });
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(particleGeo, mat);
      m.position.set(x + (Math.random() - 0.5) * 0.8, y + (Math.random() - 0.5) * 0.8, z + (Math.random() - 0.5) * 0.8);
      scene.add(m);
      particles.push({ m, vx: (Math.random() - 0.5) * 2.4, vy: 2 + Math.random() * 2.4, vz: (Math.random() - 0.5) * 2.4, life: 0.7 });
    }
  }

  let missionTimer;
  function showMission(text) {
    const el = $('#mc-mission-toast', hud);
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(missionTimer);
    missionTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function toggleCraft(force) {
    craftOpen = force ?? !craftOpen;
    $('#mc-craft-panel', hud).classList.toggle('open', craftOpen);
    if (craftOpen) { mining = false; updateQuest(); }
    audio.click();
  }

  function craft(type) {
    if (type === 'pickaxe') {
      if (pickaxe || inventory.wood < 3 || inventory.stone < 2) { audio.error(); return; }
      inventory.wood -= 3; inventory.stone -= 2; pickaxe = true;
      audio.success(); showMission('Picareta criada! Mineração 2× mais rápida.');
    } else if (type === 'portal') {
      if (inventory.wood < 8 || inventory.stone < 12) { audio.error(); return; }
      inventory.wood -= 8; inventory.stone -= 12;
      buildPortal();
      won = true;
      $('#mc-win', hud).classList.add('open');
      audio.success();
    }
    renderHotbar(); updateQuest();
  }

  function buildPortal() {
    const px = Math.round(player.x + Math.sin(player.yaw) * 4);
    const pz = Math.round(player.z + Math.cos(player.yaw) * 4);
    const base = heightAt(px, pz);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x241535, roughness: 0.5, metalness: 0.5, emissive: 0x2a0b52, emissiveIntensity: 0.3 });
    const portalMat = new THREE.MeshBasicMaterial({ color: 0x9b6bff, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 4 || j === 0 || j === 6) {
          if (j === 0 && (i === 1 || i === 2 || i === 3)) continue;
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), frameMat);
          m.position.set(px + (i - 2) * 0.92, base + 0.45 + j * 0.92, pz);
          m.castShadow = true; scene.add(m);
        }
      }
    }
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 4.6), portalMat);
    plane.position.set(px, base + 3.1, pz + 0.01);
    scene.add(plane);
    const light = new THREE.PointLight(0x9b6bff, 4, 10, 2);
    light.position.set(px, base + 3, pz + 1.5);
    scene.add(light);
    portalPlane = plane;
  }
  let portalPlane = null;

  const raycaster2 = new THREE.Raycaster();
  let rayTarget = null;

  function updateTargeting() {
    raycaster.setFromCamera(center, camera);
    const hits = raycaster.intersectObjects(raycastTargets, false);
    if (hits.length) {
      const hit = hits[0];
      let b = null;
      if (hit.object.isInstancedMesh) b = hit.object.userData.blocks?.[hit.instanceId];
      else b = hit.object.userData.block;
      if (b && !b.broken) { setTarget(b); rayTarget = hit; return; }
    }
    setTarget(null); rayTarget = null;
  }

  function onKeyDown(e) {
    if (shell.paused) return;
    keys.add(e.code);
    if (e.code === 'KeyC') { toggleCraft(); e.preventDefault(); }
    if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3' || e.code === 'Digit4' || e.code === 'Digit5') {
      selectedSlot = Number(e.code.slice(-1)) - 1; renderHotbar();
    }
    if (e.code === 'Space') e.preventDefault();
  }
  function onKeyUp(e) { keys.delete(e.code); }
  function onMouseDown(e) {
    if (craftOpen || shell.paused) return;
    if (!window.__ps5VirtualInput && !touch && !document.pointerLockElement) {
      canvas.requestPointerLock?.();
    }
    if (e.button === 0) { mining = true; mineProgress = 0; }
    if (e.button === 2) placeBlock();
  }
  function onMouseUp(e) { if (e.button === 0) mining = false; }
  function onMouseMove(e) {
    if (document.pointerLockElement === canvas) {
      player.yaw -= e.movementX * 0.0022;
      player.pitch = clamp(player.pitch - e.movementY * 0.0022, -1.35, 1.35);
    }
  }
  function onContext(e) { e.preventDefault(); }
  function onTouchStart(e) { if (!touch && e.target === canvas) canvas.requestPointerLock?.(); }
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  document.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('contextmenu', onContext);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });

  $('#mc-craft-btn', hud).addEventListener('click', () => toggleCraft());
  $('#mc-craft-close', hud).addEventListener('click', () => toggleCraft(false));
  $('#mc-craft-pickaxe', hud).addEventListener('click', () => craft('pickaxe'));
  $('#mc-craft-portal', hud).addEventListener('click', () => craft('portal'));
  $('#mc-win-continue', hud).addEventListener('click', () => { $('#mc-win', hud).classList.remove('open'); });
  $('#mc-win-exit', hud).addEventListener('click', () => shell.exit());

  function resize() {
    const w = shell.root.clientWidth || window.innerWidth;
    const h = shell.root.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(devicePixelRatio, w < 760 ? 1.5 : 1.7));
  }
  window.addEventListener('resize', resize);
  resize();
  renderHotbar();
  updateQuest();
  setTimeout(() => showMission('Bem-vindo à ilha. Colete 8 madeiras e 12 pedras para construir o portal.'), 900);

  let last = performance.now();
  let raf;
  function animate(now) {
    raf = requestAnimationFrame(animate);
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
    last = now;
    if (shell.paused) { renderer.render(scene, camera); return; }
    elapsed += dt;
    placeCooldown = Math.max(0, placeCooldown - dt);

    const moveX = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0) + (joystick.x || 0);
    const moveZ = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0) + (-(joystick.y || 0));
    const len = Math.hypot(moveX, moveZ);
    const speed = (keys.has('ShiftLeft') ? 6.4 : 4.4) * dt;
    if (len > 0.05 && !craftOpen) {
      const nx = clamp(player.x + (moveX / len) * speed * Math.cos(player.yaw) + (moveZ / len) * speed * Math.sin(player.yaw), -HALF + 1.2, HALF - 1.2);
      const nz = clamp(player.z - (moveX / len) * speed * Math.sin(player.yaw) + (moveZ / len) * speed * Math.cos(player.yaw), -HALF + 1.2, HALF - 1.2);
      const currentGround = heightAt(Math.round(player.x), Math.round(player.z));
      const nextGround = Math.max(
        heightAt(Math.round(nx), Math.round(nz)),
        heightAt(Math.round(nx + 0.28), Math.round(nz)),
        heightAt(Math.round(nx - 0.28), Math.round(nz)),
        heightAt(Math.round(nx), Math.round(nz + 0.28)),
        heightAt(Math.round(nx), Math.round(nz - 0.28))
      );
      if (nextGround - currentGround <= 1.05 || player.y > nextGround + 0.05) {
        player.x = nx; player.z = nz;
      }
      player.bob += dt * (keys.has('ShiftLeft') ? 13 : 9);
      if (player.onGround && player.y < nextGround) player.y = nextGround;
    }

    const ground = heightAt(Math.round(player.x), Math.round(player.z));
    if ((keys.has('Space') || touchState.jump) && player.onGround && !craftOpen) {
      player.vy = 8.1; player.onGround = false; audio.jump();
      if (touch) touchState.jump = false;
    }
    player.vy -= 24 * dt;
    player.y += player.vy * dt;
    if (player.y <= ground) { player.y = ground; player.vy = 0; player.onGround = true; }

    const bob = player.onGround && len > 0.05 ? Math.sin(player.bob) * 0.035 : 0;
    camera.position.set(player.x, player.y + 1.58 + bob, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0);

    updateTargeting();
    if (mining && targetBlock && !craftOpen) {
      mineProgress += dt * (pickaxe ? 2.1 : 1);
      const pct = clamp(mineProgress, 0, 1) * 100;
      $('#mc-crosshair-ring', hud).style.background = `conic-gradient(#fff ${pct}%, transparent ${pct}%)`;
      hand.rotation.z = 0.12 + Math.sin(elapsed * 22) * 0.22;
      if (mineProgress >= 1) { breakBlock(targetBlock); mineProgress = 0; }
    } else {
      $('#mc-crosshair-ring', hud).style.background = 'transparent';
      hand.rotation.z += (0.12 - hand.rotation.z) * 0.2;
    }
    hand.position.y = -0.42 + bob * 1.5 + (mining ? Math.sin(elapsed * 22) * 0.02 : 0);

    if (water.material) water.position.y = SEA + Math.sin(elapsed * 0.8) * 0.015;
    clouds.children.forEach((c, i) => { c.position.x += dt * (0.35 + i * 0.015); if (c.position.x > 50) c.position.x = -50; });
    if (portalPlane) {
      portalPlane.material.opacity = 0.55 + Math.sin(elapsed * 2) * 0.15;
      portalPlane.rotation.z = Math.sin(elapsed * 0.6) * 0.02;
    }
    particles.forEach((p, i) => {
      p.life -= dt; p.vy -= 12 * dt;
      p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
      p.m.rotation.x += dt * 4; p.m.rotation.z += dt * 3;
      if (p.life <= 0) { scene.remove(p.m); particles.splice(i, 1); }
    });

    const dayMinutes = 8 * 60 + 24 + elapsed * 1.4;
    $('#mc-time', hud).textContent = `${String(Math.floor(dayMinutes / 60) % 24).padStart(2, '0')}:${String(Math.floor(dayMinutes % 60)).padStart(2, '0')}`;
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(animate);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('contextmenu', onContext);
      canvas.removeEventListener('touchstart', onTouchStart);
      clearTimeout(missionTimer);
      try { document.exitPointerLock?.(); } catch {}
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose?.(); if (o.material) { if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.()); else o.material.dispose?.(); } });
      renderer.dispose();
      shell.destroy();
    },
    pause() { shell.setPaused(true); },
    resume() { shell.setPaused(false); },
  };
}
