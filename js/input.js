import { clamp } from './world-utils.js';

export class InputController {
  constructor(game) {
    this.game = game;
    this.keys = {};
    this.moveX = 0; this.moveY = 0; this.moveMag = 0;
    this.lookVelX = 0; this.lookVelY = 0;
    this.lookDeltaX = 0; this.lookDeltaY = 0;
    this.run = false; this.jump = false; this.roll = false;
    this.accelerate = false; this.brake = false; this.steer = 0; this.handbrake = false; this.nitro = false;
    this.virtualAccelerate = false; this.virtualBrake = false;
    this.aim = false; this.fire = false; this.sprintKey = false; this.virtualRun = false;
    this.mode = game.settings.controlMode || 'gta';
    this.ctrlScale = (game.settings.buttonSize || 100) / 100;
    this.editMode = false;
    this.dragging = null; this.dragStart = null;
    this.mouseDown = false; this.mouseX = 0; this.mouseY = 0;
    this.gamepad = null; this.prevButtons = [];
    this.gamepadNotified = false;
    this.stickMove = { x: 0, y: 0 };
    this.stickLook = { x: 0, y: 0 };
    this.setup();
  }

  setup() {
    this.vc = document.getElementById('virtual-controls');
    this.setMode(this.mode, true);
    this.setupKeyboard();
    this.setupMouse();
    this.setupVirtual();
    this.setupGamepad();
    this.setupEditPanel();
    window.addEventListener('blur', () => { this.keys = {}; this.moveX = this.moveY = 0; });
  }

  setMode(mode, silent = false) {
    this.mode = mode;
    if (this.vc) this.vc.className = 'mode-' + mode;
    const ui = document.getElementById('game-ui');
    if (ui) {
      ui.classList.remove('mode-gta', 'mode-tutorial', 'mode-dualsense');
      ui.classList.add('mode-' + mode);
    }
    const sel = document.getElementById('controlSelect');
    if (sel) sel.value = mode;
    this.game.settings.controlMode = mode;
    const tut = document.getElementById('tutorial-overlay');
    if (tut) tut.classList.toggle('learned', localStorage.getItem('gta5br_tutorial_seen') === '1' && mode === 'tutorial');
    if (!silent) this.game.notify(mode === 'gta' ? 'Controle completo GTA ativado' : mode === 'tutorial' ? 'Modo tutorial simples ativado' : 'Controle PS5 na tela ativado');
    this.applySize();
  }

  cycleMode() {
    const order = ['gta', 'tutorial', 'dualsense'];
    this.setMode(order[(order.indexOf(this.mode) + 1) % order.length]);
  }

  applySize() {
    const scale = this.ctrlScale;
    const label = document.getElementById('ctrlSizeLabel');
    if (label) label.textContent = Math.round(scale * 100) + '%';
    const left = document.querySelector('.vc-gta-left');
    const right = document.querySelector('.vc-gta-right');
    const ds = document.getElementById('dualsense-wrap');
    [left, right, ds].forEach(el => {
      if (!el) return;
      el.style.zoom = scale;
    });
    document.documentElement.style.setProperty('--ctrl-scale', scale);
  }

  setupKeyboard() {
    addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (this.keys[e.code]) return;
      this.keys[e.code] = true;
      const g = this.game;
      if (e.code === 'Escape') g.togglePause();
      else if (e.code === 'KeyM') g.ui.toggleMap();
      else if (e.code === 'KeyP') g.ui.togglePhone();
      else if (e.code === 'KeyE') g.interact();
      else if (e.code === 'Space') this.jump = true;
      else if (e.code === 'KeyC') this.roll = true;
      else if (e.code === 'KeyF' || e.code === 'KeyJ') g.attack();
      else if (e.code === 'KeyR') g.reloadWeapon();
      else if (e.code === 'KeyG') g.player.startDance();
      else if (e.code === 'KeyH') g.player.greet();
      else if (e.code === 'KeyV') g.cycleRadio();
      else if (e.code === 'KeyB') g.horn();
      else if (e.code === 'KeyN') g.nextMission();
      else if (e.code === 'KeyT') g.cycleWeather();
      else if (e.code === 'KeyQ') g.switchWeapon();
      else if (e.code === 'KeyK') g.ui.openSettings();
      else if (e.code === 'F2') g.cycleQuality();
      else if (e.code === 'F3') this.cycleMode();
      else if (e.code === 'Digit1') g.equipWeapon('soco');
      else if (e.code === 'Digit2') g.equipWeapon('pistola');
      else if (e.code === 'Digit3') g.equipWeapon('metralhadora');
      else if (e.code === 'Digit4') g.equipWeapon('escopeta');
      else if (e.code === 'Digit5') g.equipWeapon('sniper');
      else if (e.code === 'Digit6') g.equipWeapon('bazuca');
      else if (e.code === 'Digit7') g.equipWeapon('minigun');
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.sprintKey = true;
      if (e.code === 'KeyW') this.moveY = 1;
      if (e.code === 'KeyS') this.moveY = -1;
      if (e.code === 'KeyA') this.moveX = -1;
      if (e.code === 'KeyD') this.moveX = 1;
    });
    addEventListener('keyup', e => {
      this.keys[e.code] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.sprintKey = false;
      if (e.code === 'KeyW' && !this.keys.KeyS) this.moveY = this.stickMove.y > .05 ? this.stickMove.y : (this.keys.KeyS ? -1 : 0);
      if (e.code === 'KeyS' && !this.keys.KeyW) this.moveY = this.stickMove.y < -.05 ? this.stickMove.y : 0;
      if (e.code === 'KeyA' && !this.keys.KeyD) this.moveX = this.stickMove.x < -.05 ? this.stickMove.x : 0;
      if (e.code === 'KeyD' && !this.keys.KeyA) this.moveX = this.stickMove.x > .05 ? this.stickMove.x : 0;
    });
  }

  setupMouse() {
    const canvas = document.getElementById('game-canvas');
    let lastX = 0, lastY = 0;
    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button === 2) { this.aim = true; return; }
      if (e.pointerType === 'mouse' && e.button === 0) {
        this.mouseDown = true; lastX = e.clientX; lastY = e.clientY;
        if (!this.game.player.inCar) this.game.attack();
      } else {
        this.mouseDown = true; lastX = e.clientX; lastY = e.clientY;
      }
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (!this.mouseDown) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      this.lookDeltaX += dx;
      this.lookDeltaY += dy;
    });
    canvas.addEventListener('pointerup', e => {
      this.mouseDown = false;
      if (e.pointerType === 'mouse' && e.button === 2) this.aim = false;
    });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('wheel', e => { this.game.camDist = clamp(this.game.camDist + e.deltaY * .005, 2.8, 11); }, { passive: true });
    addEventListener('pointerup', () => { this.mouseDown = false; });
  }

  setupVirtual() {
    const sticks = [...document.querySelectorAll('.stick-zone, .ds-stick')];
    sticks.forEach(zone => {
      const knob = zone.querySelector('.stick-knob, .ds-stick-knob');
      const isLook = zone.id === 'cameraStick' || zone.dataset.stick === 'camera';
      let active = false, id = null;
      const move = e => {
        if (!active) return;
        const r = zone.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        let dx = (e.clientX - cx) / (r.width * .35);
        let dy = (e.clientY - cy) / (r.height * .35);
        const len = Math.hypot(dx, dy);
        if (len > 1) { dx /= len; dy /= len; }
        if (knob) knob.style.transform = `translate(calc(-50% + ${dx * r.width * .19}px), calc(-50% + ${dy * r.height * .19}px))`;
        if (isLook) { this.stickLook.x = dx; this.stickLook.y = dy; }
        else { this.stickMove.x = dx; this.stickMove.y = -dy; }
      };
      zone.addEventListener('pointerdown', e => {
        if (this.editMode) return;
        active = true; id = e.pointerId; zone.setPointerCapture?.(e.pointerId); move(e); e.preventDefault(); e.stopPropagation();
      });
      zone.addEventListener('pointermove', e => { if (active && e.pointerId === id) { move(e); e.preventDefault(); } });
      const end = e => {
        if (!active) return;
        active = false;
        if (knob) knob.style.transform = 'translate(-50%,-50%)';
        if (isLook) { this.stickLook.x = 0; this.stickLook.y = 0; }
        else { this.stickMove.x = 0; this.stickMove.y = 0; }
      };
      zone.addEventListener('pointerup', end);
      zone.addEventListener('pointercancel', end);
      zone.addEventListener('lostpointercapture', end);
    });

    const btns = [...document.querySelectorAll('#virtual-controls [data-action]')];
    btns.forEach(btn => {
      const action = btn.dataset.action;
      const down = e => {
        if (this.editMode) return;
        e.preventDefault(); e.stopPropagation();
        btn.classList.add('active');
        this.pressAction(action, true);
        if (navigator.vibrate && this.game.settings.vibration) navigator.vibrate(12);
      };
      const up = e => {
        if (this.editMode) return;
        btn.classList.remove('active');
        this.pressAction(action, false);
      };
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', e => { if (e.buttons) up(e); });
    });

    document.getElementById('tutorialClose')?.addEventListener('click', () => {
      document.getElementById('tutorial-overlay')?.classList.add('learned');
      localStorage.setItem('gta5br_tutorial_seen', '1');
      this.game.audio.click();
    });

  }

  pressAction(action, down) {
    const g = this.game;
    switch (action) {
      case 'triangle': if (down) g.toggleCar(); break;
      case 'square': if (down) g.attack(); break;
      case 'circle': if (down) { if (g.player.crouch) { this.roll = true; g.player.crouch = false; } else g.player.crouch = !g.player.crouch; } break;
      case 'cross': if (down) this.jump = true; break;
      case 'L2': this.aim = down; break;
      case 'R2': if (g.player.inCar) this.virtualAccelerate = down; else { this.fire = down; if (down) g.attack(); } break;
      case 'R1': if (down) { if (g.player.inCar) this.handbrake = true; else g.switchWeapon(); } if (!down) this.handbrake = false; break;
      case 'L1': if (down) g.switchWeapon(); break;
      case 'up': if (down) g.ui.togglePhone(); break;
      case 'down': if (down) g.ui.toggleMap(); break;
      case 'left': if (down) g.switchWeapon(-1); break;
      case 'right': if (down) g.switchWeapon(1); break;
      case 'brake': this.virtualBrake = down; break;
      case 'run': this.virtualRun = down; break;
      case 'L3': if (down) this.virtualRun = !this.virtualRun; break;
      case 'R3': if (down) g.resetCamera(); break;
      case 'menu': case 'options': if (down) g.togglePause(); break;
      case 'cut': if (down) g.player.startDance(); break;
      case 'power': if (down) g.togglePause(); break;
      case 'health': if (down) g.eatFood(); break;
      case 'map': if (down) g.ui.toggleMap(); break;
      case 'mic': if (down) g.toggleMute(); break;
      case 'sound': if (down) g.toggleMusic(); break;
      case 'full': if (down) g.toggleFullscreen(); break;
      case 'touchpad': if (down) g.ui.toggleMap(); break;
      case 'create': if (down) g.ui.togglePhone(); break;
      case 'ps': if (down) g.togglePause(); break;
      case 'mute': if (down) g.toggleMute(); break;
      default: break;
    }
  }

  setupGamepad() {
    addEventListener('gamepadconnected', e => {
      this.gamepad = e.gamepad;
      document.body.classList.add('gamepad-connected');
      this.game.notify('Controle DualSense conectado! Controle virtual ocultado.');
      this.game.audio.click();
      if (this.game.settings.vibration && navigator.vibrate) navigator.vibrate([30, 60, 30]);
    });
    addEventListener('gamepaddisconnected', () => {
      this.gamepad = null;
      document.body.classList.remove('gamepad-connected');
      this.game.notify('Controle desconectado. Controle virtual reativado.');
    });
  }

  updateGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let pad = this.gamepad;
    for (const p of pads) if (p?.connected) { pad = p; break; }
    if (!pad) { this.gamepad = null; return; }
    this.gamepad = pad;
    const ax = pad.axes;
    if (Math.hypot(ax[0] || 0, ax[1] || 0) > .16) {
      this.stickMove.x = ax[0]; this.stickMove.y = -ax[1];
    } else if (!this.keys.KeyW && !this.keys.KeyS && !this.keys.KeyA && !this.keys.KeyD) {
      this.stickMove.x = 0; this.stickMove.y = 0;
    }
    if (Math.hypot(ax[2] || 0, ax[3] || 0) > .15) {
      this.stickLook.x = ax[2]; this.stickLook.y = ax[3];
    } else if (!this.mouseDown) {
      this.stickLook.x = 0; this.stickLook.y = 0;
    }
    const map = { 0: 'cross', 1: 'circle', 2: 'square', 3: 'triangle', 4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2', 10: 'L3', 11: 'R3', 12: 'up', 13: 'down', 14: 'left', 15: 'right', 16: 'ps', 9: 'options' };
    pad.buttons.forEach((b, i) => {
      const prev = !!this.prevButtons[i];
      if (b.pressed !== prev) {
        const act = map[i];
        if (act) {
          if (act === 'L2' || act === 'R2' || act === 'L1' || act === 'R1') {
            if (act === 'L2') this.aim = b.pressed;
            else if (act === 'R2') { if (this.game.player.inCar) this.virtualAccelerate = b.pressed; else { this.fire = b.pressed; if (b.pressed) this.game.attack(); } }
            else if (act === 'R1') { if (b.pressed) { if (this.game.player.inCar) this.handbrake = true; else this.game.switchWeapon(); } else this.handbrake = false; }
            else if (act === 'L1' && b.pressed) this.game.switchWeapon();
          } else this.pressAction(act, b.pressed);
        }
        this.prevButtons[i] = b.pressed;
      }
    });
    if (pad.buttons[7]?.pressed && !this.game.player.inCar) this.fire = true;
    if (pad.buttons[6]?.value > .2) this.aim = true;
    if (pad.buttons[7]?.value > .2 && this.game.player.inCar) this.virtualAccelerate = true;
  }

  setupEditPanel() {
    document.getElementById('ctrlGrow')?.addEventListener('click', () => { this.ctrlScale = clamp(this.ctrlScale + .1, .6, 1.6); this.applySize(); });
    document.getElementById('ctrlShrink')?.addEventListener('click', () => { this.ctrlScale = clamp(this.ctrlScale - .1, .6, 1.6); this.applySize(); });
    document.getElementById('ctrlReset')?.addEventListener('click', () => {
      this.ctrlScale = 1; this.applySize();
      document.querySelectorAll('.stick-zone,.action-cluster,.dpad,.mini-actions,.shoulder-row,#dualsense').forEach(el => {
        el.style.left = ''; el.style.right = ''; el.style.top = ''; el.style.bottom = ''; el.style.transform = '';
      });
    });
    document.getElementById('ctrlEditDone')?.addEventListener('click', () => this.setEditMode(false));
    this.makeDraggable();
  }

  setEditMode(on) {
    this.editMode = on;
    document.body.classList.toggle('ctrl-editing', on);
    document.getElementById('edit-controls-panel')?.classList.toggle('hidden', !on);
    if (on) this.game.notify('Modo edição: arraste os controles e ajuste o tamanho.');
  }

  makeDraggable() {
    const els = document.querySelectorAll('.stick-zone,.action-cluster,.dpad,.mini-actions,.shoulder-row,#dualsense');
    els.forEach(el => {
      let start = null;
      el.addEventListener('pointerdown', e => {
        if (!this.editMode) return;
        e.preventDefault(); e.stopPropagation();
        const r = el.getBoundingClientRect();
        start = { x: e.clientX, y: e.clientY, left: r.left, top: r.top };
        el.setPointerCapture?.(e.pointerId);
        el.style.right = 'auto'; el.style.bottom = 'auto'; el.style.left = r.left + 'px'; el.style.top = r.top + 'px';
        el.style.position = 'fixed';
      });
      el.addEventListener('pointermove', e => {
        if (!this.editMode || !start) return;
        el.style.left = (start.left + e.clientX - start.x) + 'px';
        el.style.top = (start.top + e.clientY - start.y) + 'px';
      });
      const end = () => { start = null; };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
    });
  }

  update(dt) {
    this.updateGamepad();
    const kx = (this.keys.KeyD ? 1 : 0) - (this.keys.KeyA ? 1 : 0);
    const ky = (this.keys.KeyW ? 1 : 0) - (this.keys.KeyS ? 1 : 0);
    let mx = clamp(kx + this.stickMove.x, -1, 1);
    let my = clamp(ky + this.stickMove.y, -1, 1);
    const mag = Math.min(1, Math.hypot(mx, my));
    if (mag > 0) { const n = Math.max(1, Math.hypot(mx, my)); mx /= n; my /= n; }
    this.moveX = mx; this.moveY = my; this.moveMag = mag;
    this.run = this.virtualRun || this.sprintKey || mag > .94;

    if (this.lookDeltaX || this.lookDeltaY) {
      this.game.camYaw -= this.lookDeltaX * .0045;
      this.game.camPitch = clamp(this.game.camPitch + this.lookDeltaY * .003, -.35, .9);
      this.lookDeltaX = 0; this.lookDeltaY = 0;
    }
    if (this.stickLook.x || this.stickLook.y) {
      this.game.camYaw -= this.stickLook.x * dt * 2.4;
      this.game.camPitch = clamp(this.game.camPitch + this.stickLook.y * dt * 1.7, -.35, .9);
    }

    if (this.game.player.inCar) {
      this.steer = mx;
      this.handbrake = this.handbrake || !!this.keys.Space;
      this.nitro = this.keys.ShiftLeft || this.keys.ShiftRight;
      this.accelerate = this.virtualAccelerate || ky > 0;
      this.brake = this.virtualBrake || ky < 0;
    }
  }

  consume() {
    this.jump = false;
    this.roll = false;
    this.fire = false;
  }
}
