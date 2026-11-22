export function createGameShell({ root, game, controls, onExit, onPauseChange, subtitle = 'PS5 EMULATOR' }) {
  root.innerHTML = `
    <div class="game-canvas-wrap"></div>
    <div class="game-hud"></div>
    <div class="game-topbar">
      <span class="game-title-chip">${game.shortTitle || game.title}</span>
      <button class="game-icon-btn" data-game-pause title="Pausar" aria-label="Pausar">
        <svg viewBox="0 0 24 24"><path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z"/></svg>
      </button>
      <button class="game-icon-btn" data-game-home title="Sair para o PS5" aria-label="Sair">
        <svg viewBox="0 0 24 24"><path d="M12 3 2 11h3v9h5v-6h4v6h5v-9h3L12 3Z"/></svg>
      </button>
    </div>
    <div class="game-pause">
      <div class="pause-card">
        <span class="eyebrow-mini">${subtitle}</span>
        <h2>${game.title}</h2>
        <p>O jogo está pausado. Continue de onde parou ou volte para a biblioteca do console.</p>
        <div class="pause-actions">
          <button class="pause-btn primary" data-game-resume>Continuar jogando</button>
          <button class="pause-btn" data-game-home>Salvar e sair para o PS5</button>
        </div>
        <div class="pause-controls">${controls || ''}</div>
      </div>
    </div>`;

  const pauseEl = root.querySelector('.game-pause');
  const hud = root.querySelector('.game-hud');
  const canvasWrap = root.querySelector('.game-canvas-wrap');
  let paused = false;
  let destroyed = false;

  const setPaused = (value, silent = false) => {
    paused = value;
    pauseEl.classList.toggle('open', paused);
    if (!silent) onPauseChange?.(paused);
  };

  const exit = () => {
    if (destroyed) return;
    destroyed = true;
    try { document.exitPointerLock?.(); } catch {}
    onExit?.();
  };

  root.querySelectorAll('[data-game-pause]').forEach((b) => b.addEventListener('click', () => setPaused(!paused)));
  root.querySelectorAll('[data-game-resume]').forEach((b) => b.addEventListener('click', () => setPaused(false)));
  root.querySelectorAll('[data-game-home]').forEach((b) => b.addEventListener('click', exit));

  const onKey = (e) => {
    if (e.code === 'Escape') {
      if (document.pointerLockElement) return;
      e.preventDefault();
      setPaused(!paused);
    }
  };
  window.addEventListener('keydown', onKey);

  return {
    root,
    hud,
    canvasWrap,
    pauseEl,
    get paused() { return paused; },
    setPaused,
    exit,
    destroy() {
      destroyed = true;
      window.removeEventListener('keydown', onKey);
      root.innerHTML = '';
    },
  };
}

export function fmtTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}

export function createJoystick(el) {
  const state = { x: 0, y: 0, active: false };
  const knob = el.querySelector('i');
  let id = null;
  const set = (e) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const max = rect.width * 0.35;
    const len = Math.hypot(dx, dy);
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    state.x = dx / max;
    state.y = dy / max;
    if (knob) knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  };
  const end = () => {
    id = null; state.active = false; state.x = 0; state.y = 0;
    if (knob) knob.style.transform = 'translate(-50%,-50%)';
  };
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault(); id = e.pointerId; state.active = true; el.setPointerCapture(id); set(e);
  });
  el.addEventListener('pointermove', (e) => { if (id === e.pointerId) set(e); });
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  return state;
}

export function bindHold(el, onChange) {
  let active = false;
  const down = (e) => { e.preventDefault(); active = true; onChange(true); };
  const up = (e) => { if (!active) return; e.preventDefault(); active = false; onChange(false); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', (e) => { if (e.buttons) up(e); });
  return { get active() { return active; } };
}

export function touchMarkup({ left = true, right = [], look = true } = {}) {
  return `
    ${look ? '<div class="look-zone"></div>' : ''}
    <div class="touch-ui">
      ${left ? '<div class="joystick"><i></i></div>' : ''}
      <div class="touch-right">${right.map((b, i) => `<button class="touch-btn ${b.cls || ''}" data-touch="${b.id}" aria-label="${b.label}">${b.label}</button>`).join('')}</div>
    </div>`;
}

export function bindLook(el, onDelta) {
  if (!el) return;
  let id = null;
  let lx = 0, ly = 0;
  el.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    id = e.pointerId; lx = e.clientX; ly = e.clientY;
    el.setPointerCapture?.(id);
  });
  el.addEventListener('pointermove', (e) => {
    if (id !== e.pointerId) return;
    const dx = e.clientX - lx;
    const dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY;
    onDelta(dx, dy);
  });
  const end = () => { id = null; };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
