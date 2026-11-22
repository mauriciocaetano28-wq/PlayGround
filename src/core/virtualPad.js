import { virtualLook } from './gameShell.js';

const STORAGE_KEY = 'ps5lab.virtualpad.v2';

const DEFAULT_STATE = {
  layout: 'gta',
  enabled: true,
  tutorialSeen: false,
  layouts: {
    gta: { x: 0, y: 0, scale: 1 },
    tutorial: { x: 0, y: 0, scale: 1 },
    dualsense: { x: 0, y: 0, scale: 1 },
  },
};

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!raw) return structuredClone(DEFAULT_STATE);
    return {
      ...structuredClone(DEFAULT_STATE),
      ...raw,
      layouts: { ...structuredClone(DEFAULT_STATE.layouts), ...(raw.layouts || {}) },
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

const state = loadState();

let root = null;
let stage = null;
let active = false;
let paused = false;
let realPad = false;
let currentGameId = null;
let startedAt = 0;
let lastStatus = 0;
let lastFrame = 0;
let raf = 0;
let toastTimer = 0;

const pressedSems = new Set();
const keySources = new Map();
const mouseSources = new Map();
const realPrev = Object.create(null);

const LAYOUT_ORDER = ['gta', 'tutorial', 'dualsense'];
const LAYOUT_NAMES = { gta: 'MODO COMPLETO GTA', tutorial: 'MODO SIMPLES / TUTORIAL', dualsense: 'CONTROLE PS5 NA TELA' };

const KEY_VALUES = {
  Space: ' ', ShiftLeft: 'Shift', Escape: 'Escape',
  KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyE: 'e', KeyF: 'f',
  KeyM: 'm', KeyR: 'r', KeyC: 'c', KeyQ: 'q',
};

/* Per-game mapping from the virtual controller to real game input. */
const GAME_BINDINGS = {
  minicraft: {
    cross: { keys: ['Space'] }, circle: { keys: ['KeyC'] },
    square: { mouse: 0 }, triangle: { mouse: 2 },
    l1: { keys: ['ShiftLeft'] }, l2: { keys: ['ShiftLeft'] },
    r1: { mouse: 0 }, r2: { mouse: 2 },
    l3: { keys: ['ShiftLeft'] }, r3: { mouse: 0 },
    up: { keys: ['KeyW'] }, down: { keys: ['KeyS'] }, left: { keys: ['KeyA'] }, right: { keys: ['KeyD'] },
    run: { keys: ['ShiftLeft'] }, brake: { keys: ['ShiftLeft'] }, cut: { mouse: 0 }, map: { keys: ['KeyM'] },
    menu: { keys: ['Escape'] }, options: { keys: ['KeyC'] }, ps: { keys: ['Escape'] },
    touchpad: { keys: ['KeyC'] }, mute: { special: 'sound' },
  },
  gta: {
    cross: { keys: ['Space'] }, circle: { keys: ['KeyC'] },
    square: { keys: ['KeyF'] }, triangle: { keys: ['KeyE'] },
    l1: { keys: ['KeyM'] }, l2: { keys: ['Space'] },
    r1: { keys: ['ShiftLeft'] }, r2: { keys: ['KeyW'] },
    l3: { keys: ['ShiftLeft'] }, r3: { keys: ['KeyF'] },
    up: { keys: ['KeyW'] }, down: { keys: ['KeyS'] }, left: { keys: ['KeyA'] }, right: { keys: ['KeyD'] },
    run: { keys: ['ShiftLeft'] }, brake: { keys: ['Space'] }, cut: { keys: ['KeyF'] }, map: { keys: ['KeyM'] },
    menu: { keys: ['Escape'] }, options: { keys: ['Escape'] }, ps: { keys: ['Escape'] },
    touchpad: { keys: ['KeyM'] }, mute: { special: 'sound' },
  },
  bloxtity: {
    cross: { keys: ['Space'] }, circle: { keys: ['KeyR'] },
    square: { mouse: 0 }, triangle: { keys: ['ShiftLeft'] },
    l1: { keys: ['ShiftLeft'] }, l2: { mouse: 0 },
    r1: { keys: ['ShiftLeft'] }, r2: { mouse: 0 },
    l3: { keys: ['ShiftLeft'] }, r3: { mouse: 0 },
    up: { keys: ['KeyW'] }, down: { keys: ['KeyS'] }, left: { keys: ['KeyA'] }, right: { keys: ['KeyD'] },
    run: { keys: ['ShiftLeft'] }, brake: { keys: ['KeyS'] }, cut: { mouse: 0 }, map: { keys: ['KeyM'] },
    menu: { keys: ['Escape'] }, options: { keys: ['KeyR'] }, ps: { keys: ['Escape'] },
    touchpad: { keys: ['KeyR'] }, mute: { special: 'sound' },
  },
  neon: {
    cross: { keys: ['Space'] }, circle: { keys: ['KeyR'] },
    square: { keys: ['ShiftLeft'] }, triangle: { keys: ['KeyR'] },
    l1: { keys: ['ShiftLeft'] }, l2: { keys: ['Space'] },
    r1: { keys: ['Space'] }, r2: { keys: ['KeyW'] },
    l3: { keys: ['ShiftLeft'] }, r3: { keys: ['Space'] },
    up: { keys: ['KeyW'] }, down: { keys: ['KeyS'] }, left: { keys: ['KeyA'] }, right: { keys: ['KeyD'] },
    run: { keys: ['ShiftLeft'] }, brake: { keys: ['KeyS'] }, cut: { keys: ['Space'] }, map: { keys: ['KeyM'] },
    menu: { keys: ['Escape'] }, options: { keys: ['KeyR'] }, ps: { keys: ['Escape'] },
    touchpad: { keys: ['KeyR'] }, mute: { special: 'sound' },
  },
  astro: {
    cross: { keys: ['Space'] }, circle: { keys: ['KeyR'] },
    square: { keys: ['Space'] }, triangle: { keys: ['ShiftLeft'] },
    l1: { keys: ['ShiftLeft'] }, l2: { keys: ['Space'] },
    r1: { keys: ['ShiftLeft'] }, r2: { keys: ['Space'] },
    l3: { keys: ['ShiftLeft'] }, r3: { keys: ['Space'] },
    up: { keys: ['KeyW'] }, down: { keys: ['KeyS'] }, left: { keys: ['KeyA'] }, right: { keys: ['KeyD'] },
    run: { keys: ['ShiftLeft'] }, brake: { keys: ['KeyS'] }, cut: { keys: ['Space'] }, map: { keys: ['KeyM'] },
    menu: { keys: ['Escape'] }, options: { keys: ['KeyR'] }, ps: { keys: ['Escape'] },
    touchpad: { keys: ['KeyR'] }, mute: { special: 'sound' },
  },
};

function bindingFor(sem) {
  const map = GAME_BINDINGS[currentGameId] || GAME_BINDINGS.gta;
  return map[sem] || null;
}

/* ------------------------------- input core ------------------------------- */

function pressKey(code, source) {
  let set = keySources.get(code);
  if (!set) { set = new Set(); keySources.set(code, set); }
  if (set.has(source)) return;
  const first = set.size === 0;
  set.add(source);
  if (!first) return;
  window.dispatchEvent(new KeyboardEvent('keydown', {
    code, key: KEY_VALUES[code] || '', bubbles: true, cancelable: true,
  }));
}

function releaseKey(code, source) {
  const set = keySources.get(code);
  if (!set) return;
  set.delete(source);
  if (set.size) return;
  keySources.delete(code);
  window.dispatchEvent(new KeyboardEvent('keyup', {
    code, key: KEY_VALUES[code] || '', bubbles: true, cancelable: true,
  }));
}

function gameCanvas() {
  return document.querySelector('#game-root canvas') || document.querySelector('#game-root .game-canvas');
}

function pressMouse(button, source) {
  let set = mouseSources.get(button);
  if (!set) { set = new Set(); mouseSources.set(button, set); }
  if (set.has(source)) return;
  const first = set.size === 0;
  set.add(source);
  if (!first) return;
  window.__ps5VirtualInput = true;
  if (button === 0) window.__ps5VirtualFire = true;
  gameCanvas()?.dispatchEvent(new MouseEvent('mousedown', {
    button, buttons: button === 2 ? 2 : 1, bubbles: true, cancelable: true,
  }));
  window.__ps5VirtualInput = false;
}

function releaseMouse(button, source) {
  const set = mouseSources.get(button);
  if (!set) return;
  set.delete(source);
  if (set.size) return;
  mouseSources.delete(button);
  window.__ps5VirtualInput = true;
  if (button === 0) window.__ps5VirtualFire = false;
  window.dispatchEvent(new MouseEvent('mouseup', {
    button, buttons: 0, bubbles: true, cancelable: true,
  }));
  window.__ps5VirtualInput = false;
}

function pressSem(sem) {
  if (pressedSems.has(sem)) return;
  pressedSems.add(sem);
  const b = bindingFor(sem);
  if (!b) return;
  if (b.special) { handleSpecial(b.special); return; }
  b.keys?.forEach((k) => pressKey(k, sem));
  if (b.mouse != null) pressMouse(b.mouse, sem);
}

function releaseSem(sem) {
  if (!pressedSems.has(sem)) return;
  pressedSems.delete(sem);
  const b = bindingFor(sem);
  if (!b || b.special) return;
  b.keys?.forEach((k) => releaseKey(k, sem));
  if (b.mouse != null) releaseMouse(b.mouse, sem);
}

function releaseAll() {
  [...pressedSems].forEach(releaseSem);
  [...keySources.keys()].forEach((code) => {
    keySources.delete(code);
    window.dispatchEvent(new KeyboardEvent('keyup', { code, key: KEY_VALUES[code] || '', bubbles: true }));
  });
  [...mouseSources.keys()].forEach((button) => {
    mouseSources.delete(button);
    window.__ps5VirtualFire = false;
    window.dispatchEvent(new MouseEvent('mouseup', { button, bubbles: true }));
  });
  state.stickL = { x: 0, y: 0 };
  state.stickR = { x: 0, y: 0 };
}

function applyMove(x, y) {
  const dead = 0.2;
  setMoveKey('KeyW', y < -dead);
  setMoveKey('KeyS', y > dead);
  setMoveKey('KeyA', x < -dead);
  setMoveKey('KeyD', x > dead);
  setMoveKey('ShiftLeft', Math.hypot(x, y) > 0.86);
}

function setMoveKey(code, on) {
  if (on) pressKey(code, 'stickL');
  else releaseKey(code, 'stickL');
}

function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  } catch {}
}

function handleSpecial(name) {
  if (name === 'sound') document.querySelector('#btn-sound')?.click();
  else if (name === 'fullscreen') toggleFullscreen();
  else if (name === 'mic') padToast('Microfone', 'Entrada de voz indisponível nesta demonstração.');
  else if (name === 'health') padToast('Vida', `Integridade atual: ${Math.round(window.__ps5Vital ?? 100)}%.`);
  else if (name === 'settings') openPadSettings();
}

/* --------------------------------- chrome --------------------------------- */

function chrome() {
  const idx = LAYOUT_ORDER.indexOf(state.layout) + 1;
  return `
    <div class="vpad-chrome">
      <div class="vpad-grip" data-vpad-grip title="Arraste para mover o controle"><span>⠿</span></div>
      <div class="vpad-tools">
        <button type="button" data-vpad-layout title="Trocar layout do controle">LAYOUT ${idx}</button>
        <button type="button" data-vpad-smaller title="Diminuir controle">−</button>
        <button type="button" data-vpad-bigger title="Aumentar controle">+</button>
        <button type="button" data-vpad-settings title="Como você joga">⚙</button>
      </div>
    </div>`;
}

function face(sem, sym, label, extra = '') {
  return `<button type="button" class="vpad-key vpad-face ${extra}" data-pad="${sem}" aria-label="${label}">
    <b>${sym}</b><small>${label}</small></button>`;
}

function dpad(cls = '') {
  return `<div class="vpad-dpad ${cls}">
    <button type="button" class="vpad-key dpad-up" data-pad="up" aria-label="Cima">▲</button>
    <button type="button" class="vpad-key dpad-left" data-pad="left" aria-label="Esquerda">◀</button>
    <button type="button" class="vpad-key dpad-right" data-pad="right" aria-label="Direita">▶</button>
    <button type="button" class="vpad-key dpad-down" data-pad="down" aria-label="Baixo">▼</button>
    <i class="dpad-hub"></i>
  </div>`;
}

function statusStrip() {
  return `<div class="vpad-status">
    <div><span>TEMPO</span><b data-vpad-time>00:00</b></div>
    <div><span>DINHEIRO</span><b data-vpad-money>R$ 0</b></div>
    <div class="vpad-vital"><span>VIDA</span><i><em data-vpad-vital></em></i></div>
  </div>`;
}

/* ------------------------------- layouts ---------------------------------- */

function layoutGta() {
  return `
    <div class="vpad-stage-inner l1">
      ${chrome()}
      ${statusStrip()}
      <div class="vpad-cluster vpad-left">
        <div class="vpad-shoulders">
          <button type="button" class="vpad-key vpad-shoulder" data-pad="l1">L1</button>
          <button type="button" class="vpad-key vpad-trigger" data-pad="l2"><b>L2</b><small>MIRA · FREIA</small></button>
        </div>
        ${dpad()}
        <div class="vpad-stick-wrap">
          <div class="vpad-stick" data-stick="l"><i class="vpad-knob"></i></div>
          <span class="vpad-stick-label">ANDAR</span>
        </div>
        <div class="vpad-minirow">
          <button type="button" class="vpad-mini" data-pad="health" title="Vida">❤</button>
          <button type="button" class="vpad-mini" data-pad="map" title="Mapa">▣</button>
          <button type="button" class="vpad-mini" data-pad="mic" title="Microfone">🎙</button>
          <button type="button" class="vpad-mini" data-pad="sound" title="Som">♪</button>
          <button type="button" class="vpad-mini" data-pad="fullscreen" title="Tela cheia">⛶</button>
        </div>
      </div>
      <div class="vpad-cluster vpad-right">
        <div class="vpad-shoulders">
          <button type="button" class="vpad-key vpad-shoulder" data-pad="r1">R1</button>
          <button type="button" class="vpad-key vpad-trigger" data-pad="r2"><b>R2</b><small>ACELERA · ATIRA</small></button>
        </div>
        <div class="vpad-actions">
          ${face('triangle', '△', 'ENTRAR', 'act-tri')}
          ${face('square', '□', 'BATER', 'act-sq')}
          ${face('circle', '○', 'AGACHAR', 'act-ci')}
          ${face('cross', '✕', 'PULAR', 'act-x')}
        </div>
        <div class="vpad-stick-wrap">
          <div class="vpad-stick" data-stick="r"><i class="vpad-knob"></i></div>
          <span class="vpad-stick-label">CÂMERA</span>
        </div>
      </div>
      <div class="vpad-center-bottom">
        <button type="button" class="vpad-key pill" data-pad="l3">L3</button>
        <button type="button" class="vpad-key pill" data-pad="menu">MENU</button>
        <button type="button" class="vpad-key pill" data-pad="r3">R3</button>
        <button type="button" class="vpad-key pill wide" data-pad="brake">RÉ / FREIO</button>
        <button type="button" class="vpad-key pill" data-pad="run">CORRER</button>
        <button type="button" class="vpad-key pill" data-pad="cut">CORTE</button>
      </div>
    </div>`;
}

function tutorialHints() {
  if (state.tutorialSeen) return '';
  return `<div class="vpad-hints-card">
    <span class="vpad-hints-kicker">PRIMEIRA VEZ</span>
    <h3>Como usar o controle</h3>
    <ol>
      <li><b>1</b> Caixa verde: encoste no analógico esquerdo e arraste para andar. Empurre até o fim para correr.</li>
      <li><b>2</b> Caixa roxa: arraste o analógico direito para girar a câmera.</li>
      <li><b>3</b> Botões de ação: triângulo, quadrado, círculo e X executam as ações do jogo.</li>
      <li><b>4</b> Barra do topo: L1, L2, R1, R2, D-Pad, L3, Menu, R3 e o timer.</li>
    </ol>
    <button type="button" data-vpad-hints-ok>ENTENDI</button>
  </div>`;
}

function layoutTutorial() {
  return `
    <div class="vpad-stage-inner l2">
      ${chrome()}
      <div class="l2-top">
        <div class="l2-top-left">
          <button type="button" class="vpad-key vpad-shoulder" data-pad="l1">L1</button>
          <button type="button" class="vpad-key vpad-trigger" data-pad="l2"><b>L2</b></button>
        </div>
        <div class="l2-top-center">
          <button type="button" class="vpad-key pill" data-pad="l3">L3</button>
          <button type="button" class="vpad-key pill" data-pad="menu">MENU</button>
          <button type="button" class="vpad-key pill" data-pad="r3">R3</button>
          ${dpad('small')}
          <div class="l2-timer"><span>TEMPO</span><b data-vpad-time>00:00</b></div>
        </div>
        <div class="l2-top-right">
          <button type="button" class="vpad-key vpad-shoulder" data-pad="r1">R1</button>
          <button type="button" class="vpad-key vpad-trigger" data-pad="brake"><b>RÉ</b></button>
          <button type="button" class="vpad-key vpad-trigger" data-pad="r2"><b>R2</b></button>
        </div>
      </div>
      <div class="l2-box l2-walk">
        <span class="l2-num">1</span>
        <b>ANDAR</b><small>encoste e arraste</small>
        <div class="vpad-stick big" data-stick="l"><i class="vpad-knob"></i><span class="l2-hand">☝</span></div>
      </div>
      <div class="l2-box l2-cam">
        <span class="l2-num">2</span>
        <b>CÂMERA</b><small>arraste</small>
        <div class="vpad-stick big" data-stick="r"><i class="vpad-knob"></i></div>
        <button type="button" class="vpad-key pill run" data-pad="run">CORRER</button>
      </div>
      <div class="l2-actions">
        <span class="l2-num">3</span>
        ${face('triangle', '△', 'ENTRAR', 'act-tri')}
        ${face('square', '□', 'BATER', 'act-sq')}
        ${face('circle', '○', 'AGACHAR', 'act-ci')}
        ${face('cross', '✕', 'PULAR', 'act-x')}
      </div>
      ${tutorialHints()}
    </div>`;
}

function dsButton(sem, label, cls, num, inner = '') {
  return `<button type="button" class="ds-key ${cls}" data-pad="${sem}" aria-label="${label}">
    ${inner || label}<span class="ds-num">${num}</span></button>`;
}

function layoutDualsense() {
  return `
    <div class="vpad-stage-inner l3">
      ${chrome()}
      <div class="vpad-ds">
        <svg class="ds-svg" viewBox="0 0 560 330" aria-hidden="true">
          <defs>
            <linearGradient id="dsShell" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#ffffff"/>
              <stop offset=".45" stop-color="#f2f5f9"/>
              <stop offset=".78" stop-color="#dde3ec"/>
              <stop offset="1" stop-color="#b7c0cf"/>
            </linearGradient>
            <linearGradient id="dsShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#20262f"/>
              <stop offset="1" stop-color="#090c12"/>
            </linearGradient>
            <radialGradient id="dsLight" cx=".5" cy=".5" r=".5">
              <stop offset="0" stop-color="#54c8ff" stop-opacity=".9"/>
              <stop offset="1" stop-color="#2b7fff" stop-opacity="0"/>
            </radialGradient>
            <filter id="dsSoft"><feGaussianBlur stdDeviation="7"/></filter>
          </defs>
          <ellipse cx="280" cy="258" rx="212" ry="54" fill="#000" opacity=".4" filter="url(#dsSoft)"/>
          <path d="M150 58 C 192 32, 368 32, 410 58 C 452 84, 478 158, 498 236 C 512 292, 472 316, 440 294 C 408 272, 398 224, 358 208 L 202 208 C 162 224, 152 272, 120 294 C 88 316, 48 292, 62 236 C 82 158, 108 84, 150 58 Z" fill="url(#dsShell)" stroke="#a9b2c1" stroke-width="2"/>
          <path d="M150 58 C 192 32, 368 32, 410 58 L 398 92 C 360 74, 200 74, 162 92 Z" fill="#f8fafd" opacity=".9"/>
          <path d="M202 208 L 358 208 C 380 214, 392 238, 404 258 C 380 240, 340 224, 280 224 C 220 224, 180 240, 156 258 C 168 238, 180 214, 202 208 Z" fill="#c9d1dc" opacity=".6"/>
          <rect x="196" y="66" width="168" height="104" rx="26" fill="url(#dsShade)"/>
          <rect x="212" y="76" width="136" height="82" rx="18" fill="#1d2634" stroke="#33445e" stroke-width="1.5"/>
          <g fill="#3b475c">
            <circle cx="266" cy="190" r="2"/><circle cx="276" cy="190" r="2"/><circle cx="286" cy="190" r="2"/><circle cx="296" cy="190" r="2"/>
          </g>
          <rect x="206" y="60" width="148" height="116" rx="30" fill="url(#dsLight)" opacity=".4" filter="url(#dsSoft)"/>
        </svg>
        <div class="ds-layer">
          ${dsButton('l2', 'L2', 'ds-l2', 2)}
          ${dsButton('r2', 'R2', 'ds-r2', 9)}
          ${dsButton('l1', 'L1', 'ds-l1', 1)}
          ${dsButton('r1', 'R1', 'ds-r1', 8)}
          <button type="button" class="ds-key ds-share" data-pad="mic" aria-label="Criar / microfone">⌁</button>
          ${dsButton('options', 'Options', 'ds-options', 16)}
          <button type="button" class="ds-key ds-touchpad" data-pad="touchpad" aria-label="Touchpad">
            <span class="ds-touch-glow"></span><span class="ds-touch-line"></span><span class="ds-num">7</span>
          </button>
          <div class="ds-dpad">
            <button type="button" class="ds-key ds-dpad-up" data-pad="up" aria-label="D-Pad cima">▲<span class="ds-num">3</span></button>
            <button type="button" class="ds-key ds-dpad-left" data-pad="left" aria-label="Seta esquerda">◀<span class="ds-num">4</span></button>
            <button type="button" class="ds-key ds-dpad-right" data-pad="right" aria-label="Seta direita">▶</button>
            <button type="button" class="ds-key ds-dpad-down" data-pad="down" aria-label="Seta baixo">▼</button>
            <i class="ds-dpad-hub"></i>
          </div>
          <button type="button" class="ds-key ds-stick ds-stick-l" data-stick="l" aria-label="Analógico esquerdo"><i class="vpad-knob"></i><span class="ds-num">5</span></button>
          <button type="button" class="ds-key ds-stick ds-stick-r" data-stick="r" aria-label="Analógico direito"><i class="vpad-knob"></i><span class="ds-num">15</span></button>
          <button type="button" class="ds-key ds-ps" data-pad="ps" aria-label="Botão PS / Menu"><b>PS</b><span class="ds-num">6</span></button>
          <button type="button" class="ds-key ds-mute" data-pad="mute" aria-label="Mudo">▭<span class="ds-num">14</span></button>
          ${dsButton('triangle', '△', 'ds-face ds-tri', 10, '△')}
          ${dsButton('square', '□', 'ds-face ds-sq', 11, '□')}
          ${dsButton('circle', '○', 'ds-face ds-ci', 12, '○')}
          ${dsButton('cross', '✕', 'ds-face ds-cr', 13, '✕')}
        </div>
      </div>
    </div>`;
}

const LAYOUT_BUILDERS = { gta: layoutGta, tutorial: layoutTutorial, dualsense: layoutDualsense };

/* -------------------------------- rendering -------------------------------- */

function render() {
  if (!stage) return;
  if (root) root.dataset.layout = state.layout;
  stage.dataset.layout = state.layout;
  stage.innerHTML = LAYOUT_BUILDERS[state.layout]();
  bindStage();
  applyTransform();
  updateStatus();
}

function applyTransform() {
  if (!stage) return;
  const cfg = state.layouts[state.layout] || { x: 0, y: 0, scale: 1 };
  stage.style.setProperty('--vpad-x', `${cfg.x}px`);
  stage.style.setProperty('--vpad-y', `${cfg.y}px`);
  stage.style.setProperty('--vpad-scale', cfg.scale);
}

function bindStage() {
  stage.querySelectorAll('[data-pad]').forEach((el) => {
    const sem = el.dataset.pad;
    const down = (e) => {
      e.preventDefault();
      e.stopPropagation();
      try { el.setPointerCapture(e.pointerId); } catch {}
      el.classList.add('pressed');
      pressSem(sem);
      if (navigator.vibrate) navigator.vibrate(8);
    };
    const up = (e) => {
      if (e) e.preventDefault();
      el.classList.remove('pressed');
      releaseSem(sem);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  stage.querySelectorAll('[data-stick]').forEach((el) => {
    const side = el.dataset.stick;
    const knob = el.querySelector('.vpad-knob');
    let id = null;
    const set = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const max = r.width * 0.33;
      const len = Math.hypot(dx, dy);
      if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
      const nx = dx / max;
      const ny = dy / max;
      if (side === 'l') { state.stickL = { x: nx, y: ny }; applyMove(nx, ny); }
      else { state.stickR = { x: nx, y: ny }; }
      if (knob) knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    };
    const end = () => {
      id = null;
      el.classList.remove('active');
      if (knob) knob.style.transform = 'translate(-50%,-50%)';
      if (side === 'l') { state.stickL = { x: 0, y: 0 }; applyMove(0, 0); }
      else state.stickR = { x: 0, y: 0 };
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      id = e.pointerId;
      try { el.setPointerCapture(id); } catch {}
      el.classList.add('active');
      set(e);
    });
    el.addEventListener('pointermove', (e) => { if (id === e.pointerId) set(e); });
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  const grip = stage.querySelector('[data-vpad-grip]');
  if (grip) {
    let gid = null;
    let gx = 0;
    let gy = 0;
    grip.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      gid = e.pointerId;
      gx = e.clientX;
      gy = e.clientY;
      try { grip.setPointerCapture(gid); } catch {}
      grip.classList.add('dragging');
    });
    grip.addEventListener('pointermove', (e) => {
      if (gid !== e.pointerId) return;
      const cfg = state.layouts[state.layout];
      cfg.x += e.clientX - gx;
      cfg.y += e.clientY - gy;
      gx = e.clientX;
      gy = e.clientY;
      applyTransform();
    });
    const endDrag = () => {
      if (gid == null) return;
      gid = null;
      grip.classList.remove('dragging');
      saveState();
    };
    grip.addEventListener('pointerup', endDrag);
    grip.addEventListener('pointercancel', endDrag);
    grip.addEventListener('lostpointercapture', endDrag);
  }

  stage.querySelector('[data-vpad-layout]')?.addEventListener('click', (e) => {
    e.preventDefault();
    cycleLayout();
  });
  stage.querySelector('[data-vpad-smaller]')?.addEventListener('click', (e) => {
    e.preventDefault();
    nudgeScale(-0.1);
  });
  stage.querySelector('[data-vpad-bigger]')?.addEventListener('click', (e) => {
    e.preventDefault();
    nudgeScale(0.1);
  });
  stage.querySelector('[data-vpad-settings]')?.addEventListener('click', (e) => {
    e.preventDefault();
    openPadSettings();
  });
  stage.querySelector('[data-vpad-hints-ok]')?.addEventListener('click', (e) => {
    e.preventDefault();
    state.tutorialSeen = true;
    saveState();
    render();
  });
}

/* ------------------------------- status loop ------------------------------- */

function updateStatus() {
  if (!stage) return;
  const elapsed = active ? Math.floor((Date.now() - startedAt) / 1000) : 0;
  const time = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  stage.querySelectorAll('[data-vpad-time]').forEach((el) => { el.textContent = time; });
  const money = window.__ps5?.store?.wallet?.() ?? 0;
  stage.querySelectorAll('[data-vpad-money]').forEach((el) => {
    el.textContent = `R$ ${money.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  });
  const vital = Math.max(0, Math.min(100, window.__ps5Vital ?? 100));
  stage.querySelectorAll('[data-vpad-vital]').forEach((el) => {
    el.style.width = `${vital}%`;
    el.style.background = vital > 55 ? 'linear-gradient(90deg,#4dffa6,#9dffca)' : vital > 25 ? 'linear-gradient(90deg,#ffbd4a,#ffe08a)' : 'linear-gradient(90deg,#ff4d6d,#ff8fa3)';
  });
}

/* ------------------------------- real pad ---------------------------------- */

const STD_BUTTONS = ['cross', 'circle', 'square', 'triangle', 'l1', 'r1', 'l2', 'r2', 'mic', 'options', 'l3', 'r3', 'up', 'down', 'left', 'right', 'ps', 'touchpad'];

function deadzone(v) {
  const t = 0.16;
  if (Math.abs(v) < t) return 0;
  return Math.sign(v) * ((Math.abs(v) - t) / (1 - t));
}

function isPlaystationPad(id) {
  return /dualsense|dualshock|wireless controller|054c|playstation|ps5|sony/i.test(id || '');
}

function pollRealPad() {
  if (!navigator.getGamepads) return;
  let gp = null;
  try {
    for (const p of navigator.getGamepads()) {
      if (p && p.connected && isPlaystationPad(p.id)) { gp = p; break; }
    }
  } catch {}
  if (!gp) {
    if (realPad) {
      realPad = false;
      realPrev && Object.keys(realPrev).forEach((k) => delete realPrev[k]);
      updateVisibility();
      padToast('Controle desconectado', 'Controle virtual reativado.');
    }
    return;
  }
  if (!realPad) {
    realPad = true;
    updateVisibility();
    padToast('DualSense conectado', 'O controle virtual foi ocultado automaticamente.');
  }
  STD_BUTTONS.forEach((sem, i) => {
    const b = gp.buttons[i];
    const on = !!b && (b.pressed || b.value > 0.4);
    if (on && !realPrev[sem]) pressSem(sem);
    if (!on && realPrev[sem]) releaseSem(sem);
    realPrev[sem] = on;
  });
  const axes = gp.axes || [];
  const lx = deadzone(axes[0] || 0);
  const ly = deadzone(axes[1] || 0);
  const rx = deadzone(axes[2] || 0);
  const ry = deadzone(axes[3] || 0);
  state.stickL = { x: lx, y: ly };
  state.stickR = { x: rx, y: ry };
  applyMove(lx, ly);
}

/* --------------------------------- loop ------------------------------------ */

function loop(now) {
  raf = requestAnimationFrame(loop);
  const dt = Math.max(0, Math.min((now - lastFrame) / 1000, 0.05));
  lastFrame = now;
  pollRealPad();
  if (!active || paused) return;
  if (Math.hypot(state.stickR.x, state.stickR.y) > 0.14) {
    virtualLook(state.stickR.x * 640 * dt, state.stickR.y * 640 * dt);
  }
  if (now - lastStatus > 400) {
    lastStatus = now;
    updateStatus();
  }
}

/* -------------------------------- visibility ------------------------------- */

function updateVisibility() {
  if (!root) return;
  const show = active && state.enabled && !realPad && !paused;
  root.classList.toggle('visible', show);
  root.setAttribute('aria-hidden', show ? 'false' : 'true');
  if (!show) releaseAll();
  syncGameClass();
}

function syncGameClass() {
  const gameRoot = document.querySelector('#game-root');
  if (!gameRoot) return;
  const dsMode = active && state.enabled && !realPad && !paused && state.layout === 'dualsense';
  gameRoot.classList.toggle('vpad-layout-dualsense', dsMode);
}

/* -------------------------------- settings --------------------------------- */

function padCard(id, num, title, desc) {
  return `<button type="button" class="pad-card${state.layout === id ? ' active' : ''}" data-pad-layout="${id}">
    <span class="pad-card-check">✓</span>
    <span class="pad-card-art art-${id}">
      ${id === 'gta' ? '<i class="a-stick l"></i><i class="a-stick r"></i><i class="a-dpad"></i><i class="a-face"></i>' : ''}
      ${id === 'tutorial' ? '<i class="a-box l"></i><i class="a-box r"></i><i class="a-stick l"></i><i class="a-stick r"></i>' : ''}
      ${id === 'dualsense' ? '<i class="a-ds"></i><i class="a-pad"></i>' : ''}
    </span>
    <b>${num} · ${title}</b>
    <small>${desc}</small>
  </button>`;
}

export function openPadSettings() {
  window.dispatchEvent(new CustomEvent('ps5:pause-game'));
  const modal = document.querySelector('#modal-root');
  if (!modal) return;
  const cfg = state.layouts[state.layout];
  modal.innerHTML = `
    <div class="pad-settings">
      <div class="pad-settings-head">
        <div>
          <span class="eyebrow-mini">CONFIGURAÇÕES · CONTROLE</span>
          <h2>COMO VOCÊ JOGA</h2>
          <p>Escolha um dos três layouts. A troca é instantânea e pode ser feita no meio do jogo.</p>
        </div>
        <button type="button" class="close-btn" data-pad-close aria-label="Fechar">✕</button>
      </div>
      <div class="pad-card-grid">
        ${padCard('gta', '1', 'MODO COMPLETO GTA', 'Analógicos grandes, D-Pad, botões de ação e atalhos de vida, mapa, som e tela cheia.')}
        ${padCard('tutorial', '2', 'MODO SIMPLES / TUTORIAL', 'Layout limpo com caixas guiadas, mãozinha no analógico e explicação numerada.')}
        ${padCard('dualsense', '3', 'CONTROLE PS5 NA TELA', 'Um DualSense completo, branco e preto, com os 16 botões clicáveis e luz azul no touchpad.')}
      </div>
      <div class="pad-settings-grid">
        <label class="pad-toggle">
          <input type="checkbox" id="pad-enabled" ${state.enabled ? 'checked' : ''}>
          <span class="pad-toggle-track"><i></i></span>
          <span><b>Mostrar controle virtual</b><small>Desligue para jogar só com teclado e mouse.</small></span>
        </label>
        <label class="pad-scale">
          <span><b>Tamanho do controle</b><small>Arraste o ⠿ no controle para mover.</small></span>
          <input type="range" id="pad-scale" min="55" max="170" value="${Math.round(cfg.scale * 100)}">
          <em id="pad-scale-value">${Math.round(cfg.scale * 100)}%</em>
        </label>
      </div>
      <div class="pad-settings-actions">
        <button type="button" class="pill-ghost" data-pad-reset>Redefinir posição</button>
        <button type="button" class="pill-ghost" data-pad-tutorial>Ver tutorial novamente</button>
        <button type="button" class="pill-primary" data-pad-close>Pronto</button>
      </div>
      <div class="pad-settings-note">
        <span class="pad-note-dot"></span>
        Conecte um controle DualSense de verdade via Bluetooth/USB: o controle virtual desaparece automaticamente e o controle físico assume os mesmos comandos.
      </div>
    </div>`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');

  modal.querySelectorAll('[data-pad-layout]').forEach((card) => {
    card.addEventListener('click', () => {
      setLayout(card.dataset.padLayout);
      modal.querySelectorAll('[data-pad-layout]').forEach((c) => c.classList.toggle('active', c === card));
      const c = state.layouts[state.layout];
      const slider = modal.querySelector('#pad-scale');
      if (slider) slider.value = Math.round(c.scale * 100);
      const val = modal.querySelector('#pad-scale-value');
      if (val) val.textContent = `${Math.round(c.scale * 100)}%`;
    });
  });

  modal.querySelector('#pad-enabled')?.addEventListener('change', (e) => {
    state.enabled = e.target.checked;
    saveState();
    updateVisibility();
  });

  modal.querySelector('#pad-scale')?.addEventListener('input', (e) => {
    const cfgNow = state.layouts[state.layout];
    cfgNow.scale = Math.max(0.55, Math.min(1.7, Number(e.target.value) / 100));
    applyTransform();
    const val = modal.querySelector('#pad-scale-value');
    if (val) val.textContent = `${Math.round(cfgNow.scale * 100)}%`;
  });
  modal.querySelector('#pad-scale')?.addEventListener('change', saveState);

  modal.querySelector('[data-pad-reset]')?.addEventListener('click', () => {
    const cfgNow = state.layouts[state.layout];
    cfgNow.x = 0;
    cfgNow.y = 0;
    cfgNow.scale = 1;
    applyTransform();
    saveState();
    const slider = modal.querySelector('#pad-scale');
    if (slider) slider.value = 100;
    const val = modal.querySelector('#pad-scale-value');
    if (val) val.textContent = '100%';
    padToast('Posição redefinida', 'O controle voltou ao lugar original.');
  });

  modal.querySelector('[data-pad-tutorial]')?.addEventListener('click', () => {
    state.tutorialSeen = false;
    state.layout = 'tutorial';
    saveState();
    render();
    closePadSettings();
    padToast('Tutorial ativado', 'Feche a pausa para ver as instruções numeradas.');
  });

  modal.querySelectorAll('[data-pad-close]').forEach((b) => b.addEventListener('click', closePadSettings));
}

function closePadSettings() {
  const modal = document.querySelector('#modal-root');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  saveState();
}

/* ------------------------------- public API -------------------------------- */

export function setLayout(layout) {
  if (!LAYOUT_BUILDERS[layout] || state.layout === layout) return;
  state.layout = layout;
  saveState();
  render();
  updateVisibility();
  padToast(`Layout ${LAYOUT_ORDER.indexOf(layout) + 1}`, LAYOUT_NAMES[layout]);
}

export function cycleLayout() {
  const next = LAYOUT_ORDER[(LAYOUT_ORDER.indexOf(state.layout) + 1) % LAYOUT_ORDER.length];
  setLayout(next);
}

function nudgeScale(delta) {
  const cfg = state.layouts[state.layout];
  cfg.scale = Math.max(0.55, Math.min(1.7, Math.round((cfg.scale + delta) * 100) / 100));
  applyTransform();
  saveState();
  padToast('Tamanho do controle', `${Math.round(cfg.scale * 100)}%`);
}

export function attachVirtualPad(gameId) {
  currentGameId = gameId;
  active = true;
  paused = false;
  startedAt = Date.now();
  window.__ps5Vital = 100;
  releaseAll();
  if (root) {
    root.dataset.layout = state.layout;
    render();
    updateVisibility();
  }
  document.querySelector('#game-root')?.classList.add('vpad-active');
}

export function detachVirtualPad() {
  active = false;
  paused = false;
  currentGameId = null;
  releaseAll();
  window.__ps5Vital = 100;
  updateVisibility();
  document.querySelector('#game-root')?.classList.remove('vpad-active');
}

export function initVirtualPad() {
  if (root) return root;
  root = document.createElement('div');
  root.id = 'vpad-root';
  root.className = 'vpad-root';
  root.setAttribute('aria-hidden', 'true');
  root.dataset.layout = state.layout;
  root.innerHTML = '<div class="vpad-stage"></div>';
  document.body.appendChild(root);
  stage = root.querySelector('.vpad-stage');
  render();
  updateVisibility();

  window.addEventListener('ps5:pause', (e) => {
    paused = !!e.detail?.paused;
    if (paused) releaseAll();
    updateVisibility();
  });
  window.addEventListener('ps5:open-pad-settings', openPadSettings);
  window.addEventListener('resize', () => {
    applyTransform();
    updateStatus();
  });
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });

  lastFrame = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
  return root;
}

export const virtualPad = {
  get state() { return state; },
  get layout() { return state.layout; },
  get visible() { return !!root?.classList.contains('visible'); },
  get realPad() { return realPad; },
  get pressed() { return [...pressedSems]; },
  setLayout,
  cycleLayout,
  openSettings: openPadSettings,
  press: pressSem,
  release: releaseSem,
  nudgeScale,
  attach: attachVirtualPad,
  detach: detachVirtualPad,
};

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      layout: state.layout,
      enabled: state.enabled,
      tutorialSeen: state.tutorialSeen,
      layouts: state.layouts,
    }));
  } catch {}
}

function padToast(title, detail = '') {
  if (!root) return;
  let el = document.querySelector('.vpad-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'vpad-toast';
    document.body.appendChild(el);
  }
  el.innerHTML = `<b>${title}</b>${detail ? `<small>${detail}</small>` : ''}`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
