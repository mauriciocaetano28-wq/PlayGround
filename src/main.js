import * as THREE from 'three';
import './styles.css';
import { loadSettings, saveSettings, dispatchSettings, applyPreset } from './game/settings.js';
import { createSettingsUI } from './settingsUi.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---------- Shell ----------
const boot = $('#bootOverlay');
setTimeout(() => boot?.classList.add('hidden'), 900);

const state = {
  installed: localStorage.getItem('matteo5.installed') === '1',
  mode: 'story',
  character: 'Luiza',
  mission: 0,
  wanted: 0,
  inGame: false,
};

function toast(text, warn = false) {
  const el = document.createElement('div');
  el.className = `toast${warn ? ' warn' : ''}`;
  el.innerHTML = `<i></i><span>${text}</span>`;
  $('#toastLayer')?.append(el);
  setTimeout(() => el.remove(), 2600);
}

function openModal(id) {
  const el = document.getElementById(id);
  el?.classList.remove('hidden');
}
function closeModal(id) {
  const el = document.getElementById(id);
  el?.classList.add('hidden');
}

document.addEventListener('click', (e) => {
  const close = e.target.closest('[data-close]');
  if (close) closeModal(close.dataset.close);
  const open = e.target.closest('[data-open]');
  if (open) openModal(open.dataset.open + 'Modal');
  const action = e.target.closest('[data-action]');
  if (!action) return;
  const key = action.dataset.action;
  if (key === 'play' || key === 'mode') {
    if (key === 'mode') state.mode = action.dataset.mode;
    if (state.installed) startGame();
    else openModal('installModal');
  }
  if (key === 'howto') openModal('howModal');
  if (key === 'favorite') toast('GTA 6 BR marcado como favorito');
  if (key === 'install-cancel') closeModal('installModal');
  if (key === 'install-start') simulateInstall();
  if (key === 'settings-reset') {
    applyPreset(loadSettings().quality || 'high');
    dispatchSettings();
  }
});

function simulateInstall() {
  const bar = $('#installBar'), pct = $('#installPct'), status = $('#installStatus'), speed = $('#installSpeed'), eta = $('#installEta');
  const start = $('#installStart'), cancel = $('#installCancel');
  if (!bar) return;
  start.disabled = true; cancel.disabled = true;
  status.textContent = 'Preparando mídia fictícia…';
  let p = 0;
  const timer = setInterval(() => {
    p = Math.min(100, p + 4 + Math.random() * 9);
    bar.style.width = p + '%'; pct.textContent = Math.floor(p) + '%';
    speed.textContent = `${Math.max(0, 8.4 * (1 - p / 100)).toFixed(1).replace('.', ',')} GB restantes`;
    eta.textContent = p > 1 ? `${Math.max(1, Math.ceil((100 - p) / 14))} min` : '—';
    if (p >= 100) {
      clearInterval(timer); status.textContent = 'Instalação fictícia concluída';
      state.installed = true; localStorage.setItem('matteo5.installed', '1');
      $('#heroInstallState').textContent = 'INSTALADO';
      $('#btnPlayLabel').textContent = 'JOGAR';
      $('#btnPlaySub').textContent = 'Abrir Baía Dourada';
      $('#heroProgress').classList.add('hidden');
      setTimeout(() => { closeModal('installModal'); startGame(); }, 500);
    }
  }, 110);
}

createSettingsUI($('#settingsBody'));

// ---------- Game ----------
let renderer, scene, camera, clock, player, vehicle, inCar = false;
let missionTarget, missionComplete = false, paused = false, mapOpen = false;
let yaw = 0, pitch = 0.42, keys = {}, particles;
const NPCs = [], stars = [];

function startGame() {
  if (state.inGame) return;
  state.inGame = true;
  $('#shell').classList.add('hidden');
  $('#gameRoot').classList.remove('hidden');
  $('#gameRoot').setAttribute('aria-hidden', 'false');
  showLoading();
  setTimeout(initGame, 700);
}

function showLoading() {
  const layer = $('#loadingLayer');
  layer.classList.remove('hidden');
  let p = 0;
  const it = setInterval(() => {
    p = Math.min(100, p + 7 + Math.random() * 8);
    $('#loadBar').style.width = p + '%'; $('#loadPct').textContent = Math.floor(p) + '%';
    if (p >= 100) { clearInterval(it); setTimeout(() => layer.classList.add('hidden'), 350); }
  }, 90);
}

function mat(color, roughness = 0.75) { return new THREE.MeshStandardMaterial({ color, roughness }); }

function box(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
  scene.add(m); return m;
}

function initGame() {
  const canvas = $('#gameCanvas');
  const settings = loadSettings();
  renderer = new THREE.WebGLRenderer({ canvas, antialias: settings.quality !== 'low', powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.pixelRatioCap || 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = settings.shadows !== 'off';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x85b5c8);
  scene.fog = new THREE.Fog(0x85b5c8, 70, 260);
  camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 500);
  clock = new THREE.Clock();

  scene.add(new THREE.HemisphereLight(0xffd6ad, 0x1a3540, 2.2));
  const sun = new THREE.DirectionalLight(0xffe1a3, 3.2);
  sun.position.set(-60, 90, 30); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -100; sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100; sun.shadow.camera.bottom = -100; scene.add(sun);

  // Ocean and shore
  const seaGeo = new THREE.PlaneGeometry(380, 380, 48, 48);
  const seaMat = new THREE.MeshPhysicalMaterial({ color: 0x167c91, roughness: 0.22, metalness: 0.12, transparent: true, opacity: 0.92 });
  const sea = new THREE.Mesh(seaGeo, seaMat); sea.rotation.x = -Math.PI / 2; sea.position.set(-140, -0.12, 0); scene.add(sea);
  box(280, 0.15, 280, 0xd5c8a6, 20, -0.02, 20);
  box(280, 0.08, 9, 0xeee2bd, 20, 0.06, 34);

  // Roads and districts
  box(6, 0.09, 260, 0x303640, 0, 0.08, 20);
  box(220, 0.09, 6, 0x303640, 20, 0.09, 0);
  for (let i = -100; i <= 120; i += 20) {
    box(0.12, 0.11, 4, 0xe8d58b, 0, 0.12, i);
    box(4, 0.11, 0.12, 0xe8d58b, i, 0.12, 0);
  }

  // Buildings
  for (let i = 0; i < 34; i++) {
    const side = i % 2 ? 1 : -1;
    const x = -95 + (i % 17) * 12 + (side > 0 ? 28 : -28);
    const z = -85 + Math.floor(i / 17) * 95;
    const h = 5 + (i * 7 % 18);
    box(7, h, 7, [0xe66d57, 0x5ba3a5, 0xe7c77d, 0x6c7ca4][i % 4], x, h / 2, z);
  }
  // Hill houses
  for (let i = 0; i < 12; i++) {
    const x = -75 + i * 7, z = -55 - (i % 3) * 7;
    box(5, 4, 5, i % 2 ? 0xb55e55 : 0x6e91a3, x, 2, z);
  }

  // Player and vehicle
  player = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 1.1, 5, 8), mat(state.character === 'Luiza' ? 0xffb15f : 0x4c7894));
  body.position.y = 1.35; body.castShadow = true; player.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 8), mat(0x9a6345));
  head.position.y = 2.45; player.add(head); scene.add(player); player.position.set(0, 0, 8);

  vehicle = new THREE.Group();
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.65, 4.2), mat(0xe95c51)); chassis.position.y = 0.75; vehicle.add(chassis);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 2), mat(0x26384a)); cabin.position.set(0, 1.35, -0.2); vehicle.add(cabin);
  for (const x of [-1.1, 1.1]) for (const z of [-1.3, 1.3]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.25, 10), mat(0x11151a)); wheel.rotation.z = Math.PI / 2; wheel.position.set(x, 0.38, z); vehicle.add(wheel);
  }
  scene.add(vehicle); vehicle.position.set(8, 0, 8);

  missionTarget = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.7, 32), new THREE.MeshBasicMaterial({ color: 0xffcb65, side: THREE.DoubleSide }));
  missionTarget.rotation.x = -Math.PI / 2; missionTarget.position.set(42, 0.18, 34); scene.add(missionTarget);

  for (let i = 0; i < 14; i++) {
    const npc = new THREE.Group();
    const nm = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.9, 4, 7), mat([0x24a78b, 0xd58b43, 0x7a62a4][i % 3]));
    nm.position.y = 1.05; npc.add(nm); npc.position.set(-40 + i * 10, 0, 14 + (i % 3) * 8); scene.add(npc); NPCs.push(npc);
  }

  buildHUD(); bindGameControls(); animate();
}

function buildHUD() {
  $('#hudLayer').innerHTML = `
    <div class="game-hud" style="position:absolute;inset:0">
      <div class="top-left"><div class="wanted" id="wantedStars"></div><b id="charName">Luiza</b></div>
      <div class="minimap" id="minimap" title="Mapa"></div>
      <div class="objective" id="objective"><small>OBJETIVO</small><b>Chegue à marca dourada</b></div>
      <div class="meters"><span>VIDA <i><b id="healthBar" style="width:92%"></b></i></span><span>FÔLEGO <i><b id="staminaBar" style="width:100%"></b></i></span></div>
      <div class="weapon"><b id="ammo">12 / 60</b><small>PISTOLA ORLA</small></div>
      <div class="fps" id="fps"></div>
    </div>`;
  const style = document.createElement('style'); style.textContent = `
    .game-hud{color:#fff;font-family:var(--font-h);text-shadow:0 1px 4px #000}.top-left{position:absolute;left:22px;top:18px}.wanted{letter-spacing:5px;color:#ffcf70;height:18px}.top-left b{font-size:15px}.minimap{position:absolute;left:22px;bottom:22px;width:190px;height:190px;border:3px solid rgba(255,255,255,.8);border-radius:50%;background:radial-gradient(circle at 65% 35%,#d7c99e 0 18%,#4b8f84 19% 28%,#303640 29% 33%,#dfb96d 34% 38%,#6aa1a3 39%);box-shadow:0 0 0 2px rgba(0,0,0,.5);cursor:pointer}.objective{position:absolute;top:22px;left:50%;transform:translateX(-50%);text-align:center}.objective small{display:block;font-size:8px;color:#ffcf70}.objective b{font-size:13px}.meters{position:absolute;right:22px;bottom:28px;width:190px;text-align:right;font-size:9px}.meters span{display:block;margin-top:6px}.meters i{display:inline-block;width:130px;height:7px;background:rgba(0,0,0,.5);vertical-align:middle;margin-left:6px}.meters i b{display:block;height:100%;background:#5fd5ae}.weapon{position:absolute;right:22px;bottom:82px;text-align:right}.weapon b{display:block;font-size:24px}.weapon small{font-size:8px}.fps{position:absolute;right:8px;top:8px;font-size:9px;color:#d7fff4}`;
  document.head.append(style);
  $('#minimap').onclick = () => toggleMap();
  updateHUD();
}

function updateHUD() {
  $('#charName').textContent = state.character;
  $('#wantedStars').textContent = '★'.repeat(state.wanted) + '☆'.repeat(6 - state.wanted);
}

function bindGameControls() {
  addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'Escape') togglePause(); if (e.code === 'Tab') { e.preventDefault(); switchChar(); } if (e.code === 'KeyM') toggleMap(); if (e.code === 'KeyE') toggleVehicle(); if (e.code === 'KeyF') interact(); });
  addEventListener('keyup', e => keys[e.code] = false);
  canvasPointer();
  addEventListener('resize', onResize);
}

function canvasPointer() {
  const c = $('#gameCanvas');
  c.addEventListener('mousemove', e => {
    if (e.buttons === 2) { yaw -= e.movementX * 0.0025; pitch = THREE.MathUtils.clamp(pitch - e.movementY * 0.002, 0.05, 1.05); }
  });
  c.addEventListener('contextmenu', e => e.preventDefault());
  c.addEventListener('mousedown', e => { if (e.button === 0) shoot(); });
}

function switchChar() {
  state.character = state.character === 'Luiza' ? 'Carlos' : 'Luiza';
  player.children[0].material.color.set(state.character === 'Luiza' ? 0xffb15f : 0x4c7894);
  updateHUD(); toast(`${state.character} entrou em cena`);
}

function toggleVehicle() {
  const pos = inCar ? player.position : vehicle.position;
  if (player.position.distanceTo(vehicle.position) > 5) { toast('Aproxime-se do carro'); return; }
  inCar = !inCar; player.visible = !inCar; toast(inCar ? 'Veículo ligado — use WASD' : 'Você saiu do veículo');
}

function interact() {
  state.wanted = Math.min(6, state.wanted + 1); updateHUD(); toast('Interação registrada', true);
}

function shoot() {
  if (paused) return;
  const ammo = $('#ammo'); let [a, b] = ammo.textContent.split('/').map(s => parseInt(s));
  if (a > 0) ammo.textContent = `${a - 1} / ${b}`;
  else toast('Sem munição', true);
}

function togglePause() {
  paused = !paused;
  if (paused) {
    $('#menuLayer').innerHTML = `<div class="pause-card"><small>MATTEO 5</small><h2>Pausa</h2><button id="resumeBtn">Continuar</button><button id="settingsBtn">Definições</button><button id="exitBtn">Sair para Matteo 5</button></div>`;
    const cs = `#menuLayer{pointer-events:auto}.pause-card{position:absolute;right:3vw;top:10vh;width:min(310px,88vw);padding:28px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(5,9,18,.92);backdrop-filter:blur(12px);color:white;font-family:var(--font-h)}.pause-card small{color:#ffcf70}.pause-card button{display:block;width:100%;margin-top:8px;padding:13px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:#172036;color:white;text-align:left}`;
    const s = document.createElement('style'); s.id='pauseStyle'; s.textContent=cs; document.head.append(s);
    $('#resumeBtn').onclick = togglePause;
    $('#settingsBtn').onclick = () => { createSettingsUI($('#menuLayer'), { tab: 'graphics' }); };
    $('#exitBtn').onclick = exitGame;
  } else {
    $('#menuLayer').innerHTML = ''; $('#pauseStyle')?.remove();
  }
}

function toggleMap() {
  mapOpen = !mapOpen;
  if (mapOpen) $('#uiLayer').innerHTML = `<div class="fullmap"><div class="map-grid"></div><h2>Baía Dourada</h2><button id="closeMap">×</button><div class="map-place orla">ORLA</div><div class="map-place centro">CENTRO</div><div class="map-place morro">MORRO DO VIGIA</div></div>`;
  else $('#uiLayer').innerHTML = '';
  if (mapOpen) { $('#closeMap').onclick = toggleMap; $('#uiLayer').style.pointerEvents='auto'; }
  else $('#uiLayer').style.pointerEvents='none';
  const s = document.createElement('style'); s.id='mapStyle'; s.textContent=`.fullmap{position:absolute;inset:7vh 10vw;border:1px solid rgba(255,255,255,.18);border-radius:18px;background:linear-gradient(135deg,#1a4651,#d5bd85 48%,#303640 49%);overflow:hidden;color:white;font-family:var(--font-h)}.fullmap h2{position:absolute;left:24px;top:18px}.fullmap button{position:absolute;right:18px;top:18px;width:36px;height:36px;border:0;border-radius:50%;background:#fff;color:#111}.map-place{position:absolute;font-size:11px}.orla{right:12%;bottom:20%}.centro{left:48%;top:48%}.morro{left:15%;top:20%}`; if (!$('#mapStyle')) document.head.append(s);
}

function exitGame() {
  state.inGame=false; paused=false;
  $('#gameRoot').classList.add('hidden'); $('#shell').classList.remove('hidden'); $('#menuLayer').innerHTML='';
  if (renderer) { renderer.dispose(); renderer.domElement.width=0; }
}

function onResize() {
  if (!renderer) return;
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  if (!renderer || paused) return;
  const dt = Math.min(clock.getDelta(), 0.04);
  const actor = inCar ? vehicle : player;
  let dx = 0, dz = 0;
  if (keys.KeyW) dz -= 1; if (keys.KeyS) dz += 1; if (keys.KeyA) dx -= 1; if (keys.KeyD) dx += 1;
  if (dx || dz) {
    const len = Math.hypot(dx,dz); dx/=len; dz/=len;
    const sp = (inCar ? 14 : (keys.ShiftLeft ? 9 : 5));
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const mx = (dx * cos - dz * sin) * sp * dt, mz = (dx * sin + dz * cos) * sp * dt;
    actor.position.x += mx; actor.position.z += mz;
    actor.position.x = THREE.MathUtils.clamp(actor.position.x,-115,115); actor.position.z = THREE.MathUtils.clamp(actor.position.z,-115,115);
    actor.rotation.y = yaw + Math.atan2(dx,dz);
    if (inCar) player.position.copy(vehicle.position);
  }
  // Ocean ripple approximation
  scene.children.forEach(o => { if (o.geometry?.type === 'PlaneGeometry' && o.position.x === -140) {
    const pos=o.geometry.attributes.position; for(let i=0;i<pos.count;i++){ const x=pos.getX(i),y=pos.getY(i); pos.setZ(i,Math.sin(x*0.08+clock.elapsedTime)*0.15+Math.sin(y*0.12+clock.elapsedTime*1.2)*0.08); } pos.needsUpdate=true;
  }});

  NPCs.forEach((n,i)=>{ n.position.x += Math.sin(clock.elapsedTime*.3+i)*dt*.12; });
  missionTarget.rotation.z += dt * 0.8;
  missionTarget.visible = !missionComplete;
  if (!missionComplete && actor.position.distanceTo(missionTarget.position) < 3) {
    missionComplete=true; state.wanted=0; updateHUD(); $('#objective').innerHTML='<small>MISSÃO CONCLUÍDA</small><b>Encontro na Orla</b>'; toast('Capítulo 1 concluído: Orla Nova');
  }
  const dist = inCar ? 10 : 8;
  camera.position.set(actor.position.x - Math.sin(yaw)*dist, actor.position.y + 5 + pitch*4, actor.position.z - Math.cos(yaw)*dist);
  camera.lookAt(actor.position.x, actor.position.y + 1.2, actor.position.z);
  renderer.render(scene,camera);
  $('#fps').textContent = `${Math.round(1/dt)} FPS`;
}

// Install state UI
if (state.installed) {
  $('#heroInstallState').textContent='INSTALADO'; $('#btnPlayLabel').textContent='JOGAR'; $('#btnPlaySub').textContent='Abrir Baía Dourada';
}
