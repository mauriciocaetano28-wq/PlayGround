import { THREE, clamp, pick } from './world-utils.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const CLOTHES_NAMES = [
  'Camiseta Branca', 'Camisa do Brasil', 'Camisa do Corinthians', 'Camisa do Flamengo', 'Camisa do Palmeiras',
  'Camisa do São Paulo', 'Camisa do Santos', 'Boné Preto', 'Boné do Brasil', 'Bermuda Jeans', 'Calça Cargo',
  'Tênis Branco', 'Tênis Vermelho', 'Óculos Escuros', 'Corrente de Ouro', 'Relógio de Ouro', 'Jaqueta Jeans',
  'Moletom Preto', 'Regata Favela', 'Camisa Polo', 'Shorts Praia', 'Chinelo Havaianas', 'Meia alta', 'Luva de moto'
];
const CLOTH_COLORS = [0xf4f4f0, 0x111111, 0xffd32a, 0x1f8a3d, 0xd11f2b, 0x1b4f9e, 0xff7a1e, 0x7c2cff, 0xff58b0, 0x28c8c8, 0x8b5a2b, 0x5b5b63];
const PAINT_COLORS = [0xffffff, 0x111111, 0xb51f2b, 0x1b4f9e, 0xffc72c, 0x2d8f4e, 0xff7a1e, 0x6c2f8c, 0x2c8c9e, 0x7d7d7d, 0x8e2a20, 0xd8d4c8, 0x0d2f5a, 0x7a1d2a, 0x59d6c4, 0xc7c7c7, 0x3e3e46, 0xf2a7c3, 0x9bff4f, 0xffe1a3];

export class GameUI {
  constructor(game) {
    this.game = game;
    this.notifEl = $('#notifications');
    this.toastEl = $('#toast');
    this.shopType = null;
    this.lastHud = 0;
    this.lastMap = 0;
    this.pauseOpen = false;
    this.mapOpen = false;
    this.phoneOpen = false;
    this.settingsOpen = false;
    this.settingsFromPause = false;
    this.bind();
    this.buildWanted();
    this.drawMinimap();
  }

  bind() {
    const g = this.game;
    $('#btnMap')?.addEventListener('click', () => this.toggleMap());
    $('#btnPhone')?.addEventListener('click', () => this.togglePhone());
    $('#btnPause')?.addEventListener('click', () => g.togglePause());
    $('#btnQuality')?.addEventListener('click', () => g.cycleQuality());
    $('#btnCtrlMode')?.addEventListener('click', () => g.input.cycleMode());
    $$('[data-close]').forEach(btn => btn.addEventListener('click', () => {
      if (btn.dataset.close === 'map') this.toggleMap(false);
      if (btn.dataset.close === 'settings') this.closeSettings();
      if (btn.dataset.close === 'shop') this.closeShop();
    }));
    $$('[data-pause]').forEach(btn => btn.addEventListener('click', () => {
      const a = btn.dataset.pause;
      if (a === 'continue') g.togglePause(false);
      else if (a === 'restart') g.restart();
      else if (a === 'settings') { this.settingsFromPause = true; this.togglePause(false); this.openSettings(); }
      else if (a === 'save') { g.saveGame(true); }
      else if (a === 'controls') { g.input.cycleMode(); }
      else if (a === 'ps5') { g.exitToPS5(); }
    }));
    $$('[data-phone]').forEach(btn => btn.addEventListener('click', () => {
      const a = btn.dataset.phone;
      if (a === 'mapa') { this.togglePhone(false); this.toggleMap(true); }
      else if (a === 'missoes') { this.togglePhone(false); g.nextMission(); }
      else if (a === 'banco') { this.toast(`Saldo disponível: R$ ${g.player.money.toLocaleString('pt-BR')}`); }
      else if (a === 'contatos') { this.toast('5 amigos online: Lucas, Maria, Pedrinho, Julia e Thiago.'); }
      else if (a === 'radio') { this.togglePhone(false); g.cycleRadio(); }
      else if (a === 'casa') { this.togglePhone(false); g.openShop('house'); }
      else if (a === 'loja') { this.togglePhone(false); g.openShop('gun'); }
      else if (a === 'config') { this.togglePhone(false); this.openSettings(); }
    }));
    $('#respawnBtn')?.addEventListener('click', () => g.respawn());
    $('#deathPs5')?.addEventListener('click', () => g.exitToPS5());
    $('#prisonBtn')?.addEventListener('click', () => g.leavePrison());
    $('#qualitySelect')?.addEventListener('change', e => g.applyQuality(e.target.value));
    $('#controlSelect')?.addEventListener('change', e => g.input.setMode(e.target.value));
    $('#fpsSelect')?.addEventListener('change', e => g.setFpsCap(e.target.value));
    $('#fpsToggle')?.addEventListener('change', e => g.setShowFps(e.target.checked));
    $('#resSelect')?.addEventListener('change', e => g.applyResolution(+e.target.value));
    $('#viewDistSelect')?.addEventListener('change', e => g.setViewDist(e.target.value));
    $$('#settings-game [data-perf]').forEach(btn => btn.addEventListener('click', () => g.applyPerformance(btn.dataset.perf)));
    $('#clearCacheBtn')?.addEventListener('click', () => g.clearCache());
    $('#sensRange')?.addEventListener('input', e => { g.sensitivity = +e.target.value / 100; });
    $('#vibrationToggle')?.addEventListener('change', e => { g.settings.vibration = e.target.checked; });
    $('#buttonSizeRange')?.addEventListener('input', e => { g.input.ctrlScale = +e.target.value / 100; g.input.applySize(); });
    $('#brightnessRange')?.addEventListener('input', e => {
      document.body.classList.toggle('brightness-low', +e.target.value < 80);
      document.body.classList.toggle('brightness-high', +e.target.value > 115);
    });
    $('#volumeRange')?.addEventListener('input', e => g.audio.setVolume(+e.target.value / 100));
    $('#settingsDone')?.addEventListener('click', () => this.closeSettings());
    $('#interaction')?.addEventListener('pointerdown', e => { e.preventDefault(); g.interact(); });
    $('#minimap')?.addEventListener('pointerdown', () => this.toggleMap(true));
    $('#mission-hud')?.addEventListener('pointerdown', () => this.toggleMap(true));
    $('#virtual-controls')?.addEventListener('contextmenu', e => e.preventDefault());
  }

  buildWanted() {
    const el = $('#wantedStars');
    if (!el) return;
    el.innerHTML = Array.from({ length: 6 }, () => '<span>★</span>').join('');
    this.starEls = [...el.children];
  }

  notify(text) {
    if (!this.notifEl) return;
    const div = document.createElement('div');
    div.className = 'notif';
    div.textContent = text;
    this.notifEl.appendChild(div);
    setTimeout(() => div.remove(), 3600);
    while (this.notifEl.children.length > 4) this.notifEl.firstElementChild.remove();
  }

  toast(text) {
    if (!this.toastEl) return;
    this.toastEl.textContent = text;
    this.toastEl.style.display = 'block';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { this.toastEl.style.display = 'none'; }, 2400);
  }

  damageFlash() {
    let el = document.getElementById('damage-flash');
    if (!el) {
      el = document.createElement('div');
      el.id = 'damage-flash';
      el.style.cssText = 'position:fixed;inset:0;z-index:18;pointer-events:none;background:radial-gradient(circle,transparent 35%,rgba(255,20,30,.38));opacity:0;transition:opacity .18s;';
      document.getElementById('game-ui').appendChild(el);
    }
    el.style.opacity = 1;
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => el.style.opacity = 0, 130);
  }

  setMissionHUD(m) {
    if (!m) return;
    $('#missionLabel').textContent = `MISSÃO ${m.index + 1} · ${m.district?.name?.toUpperCase() || 'CIDADE'}`;
    $('#missionName').textContent = m.name;
    let obj = m.desc;
    if (m.type === 'delivery' || m.type === 'race' || m.type === 'collect') obj = `Vá até o ponto ${Math.min(m.step + 1, m.steps)} de ${m.steps} · ${m.desc}`;
    if (m.type === 'combat') {
      const alive = this.game.missions.enemies.filter(e => !e.dead).length;
      obj = `Elimine os inimigos · ${alive} restantes`;
    }
    if (m.type === 'chase') obj = 'Fuja e perca a perseguição da polícia';
    $('#missionObjective').textContent = obj;
    $('#missionReward').textContent = `Recompensa: R$ ${m.reward.toLocaleString('pt-BR')}`;
  }

  updateVehicleHUD(car) {
    const el = $('#vehicle-hud');
    if (!car) { el?.classList.add('hidden'); return; }
    el?.classList.remove('hidden');
    $('#carSpeed').textContent = car.speedKmh;
    $('#carGear').textContent = car.gearLabel;
    $('#rpmFill').style.width = clamp((car.rpm - 800) / 6200 * 100, 3, 100) + '%';
    $('#fuelFill').style.width = car.fuel + '%';
    $('#fuelPct').textContent = Math.round(car.fuel) + '%';
    $('#carName').textContent = car.name;
  }

  updateHUD(force = false) {
    const now = performance.now();
    if (!force && now - this.lastHud < 90) return;
    this.lastHud = now;
    const g = this.game, p = g.player, w = g.world;
    $('#healthBar').style.width = (p.health / p.maxHealth * 100) + '%';
    $('#hungerBar').style.width = p.hunger + '%';
    $('#thirstBar').style.width = p.thirst + '%';
    $('#hudMoney').textContent = 'R$ ' + Math.round(p.money).toLocaleString('pt-BR');
    const hh = Math.floor(w.hour).toString().padStart(2, '0');
    const mm = Math.floor((w.hour % 1) * 60).toString().padStart(2, '0');
    $('#gameClock').textContent = `${hh}:${mm}`;
    const weatherIcons = { sol: '☀', tarde: '🌇', noite: '🌙', chuva: '⛈', neblina: '🌫' };
    const weatherNames = { sol: 'SOL FORTE', tarde: 'PÔR DO SOL', noite: 'NOITE', chuva: 'CHUVA FORTE', neblina: 'NEBLINA' };
    $('#hudWeather').textContent = `${weatherIcons[w.weather] || '☀'} ${Math.round(32 - (w.night || 0) * 8)}°C · ${weatherNames[w.weather] || ''}`;
    this.starEls?.forEach((s, i) => s.classList.toggle('on', i < p.wanted));
    const d = w.getDistrict(p.position.x, p.position.z);
    $('#mmDistrict').textContent = d ? d.name : 'CIDADE CAIO';
    const target = g.missions.target;
    if (target) {
      const dist = Math.round(Math.hypot(target.x - p.position.x, target.z - p.position.z));
      $('#gpsDist').textContent = dist + ' m';
    }
    if (p.inCar) this.updateVehicleHUD(g.car);
    else this.updateVehicleHUD(null);
    if (now - this.lastMap > 220) { this.lastMap = now; this.drawMinimap(); }
    this.updateMarker();
    this.updatePerfHUD();
  }

  updatePerfHUD() {
    const g = this.game;
    const fpsEl = $('#fpsValue');
    const tempEl = $('#tempValue');
    const memEl = $('#memValue');
    const warnEl = $('#perf-warning');
    const hudEl = $('#perf-hud');
    if (fpsEl) fpsEl.textContent = String(Math.round(g.fpsEma || 0));
    if (tempEl) tempEl.textContent = (g.perfTemp ?? 36.5).toFixed(1);
    let memMb = 0;
    try { memMb = Math.round((performance.memory?.usedJSHeapSize || 0) / 1048576); } catch {}
    if (memEl) memEl.textContent = String(memMb);
    if (hudEl) hudEl.classList.toggle('hidden', !g.showFps);
    const low = (g.fpsEma || 0) < 20;
    if (warnEl) warnEl.classList.toggle('hidden', !low);
    if (low) {
      warnEl.textContent = '📱 Celular fraco, mudando para MODO CELULAR FRACO';
      if (g.perfMode === 'auto' || g.perfMode === 'good') {
        g.applyPerformance('weak');
        this.toast('📱 Celular fraco, mudando para MODO CELULAR FRACO');
      }
    }
  }

  updateMarker() {
    const g = this.game;
    const marker = $('#mission-marker');
    const target = g.missions.target;
    if (!target || !g.missions.active) { marker.classList.add('hidden'); return; }
    const v = new THREE.Vector3(target.x, 3.2, target.z);
    const cam = g.camera;
    const dist = v.distanceTo(cam.position);
    v.project(cam);
    if (v.z > 1 || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.2) { marker.classList.add('hidden'); return; }
    marker.classList.remove('hidden');
    const x = (v.x * .5 + .5) * innerWidth;
    const y = (-v.y * .5 + .5) * innerHeight;
    marker.style.left = x + 'px';
    marker.style.top = y + 'px';
    marker.querySelector('.marker-dist').textContent = Math.round(dist) + ' m';
  }

  drawMinimap() {
    const c = $('#minimap');
    if (!c) return;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    const g = this.game, p = g.player, w = g.world;
    const px = p.inCar ? g.car.position.x : p.position.x;
    const pz = p.inCar ? g.car.position.z : p.position.z;
    const scale = 1.35;
    const toX = x => W / 2 + (x - px) * scale;
    const toY = z => H / 2 + (z - pz) * scale;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#1d3028'; ctx.fillRect(0, 0, W, H);
    // distritos
    for (const d of w.districts) {
      const x = toX(d.x), y = toY(d.z), r = d.r * scale;
      if (x + r < 0 || x - r > W || y + r < 0 || y - r > H) continue;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, d.color + '55'); grad.addColorStop(1, d.color + '00');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    // mar
    ctx.fillStyle = '#0b3b5b';
    ctx.fillRect(toX(690), 0, W, H);
    // ruas
    ctx.strokeStyle = '#687276'; ctx.lineWidth = 4;
    for (const rc of w.roadCoords) {
      const x = toX(rc), y = toY(rc);
      if (x > -50 && x < W + 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      if (y > -50 && y < H + 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }
    ctx.strokeStyle = '#d8c14d'; ctx.lineWidth = 1;
    for (const rc of [0]) {
      const x = toX(rc), y = toY(rc);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // prédios
    ctx.fillStyle = 'rgba(15,22,25,.62)';
    for (const o of w.obstacles) {
      const x = toX((o.minX + o.maxX) / 2), y = toY((o.minZ + o.maxZ) / 2);
      if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
      const ww = Math.max(1, (o.maxX - o.minX) * scale), hh = Math.max(1, (o.maxZ - o.minZ) * scale);
      ctx.fillRect(x - ww / 2, y - hh / 2, ww, hh);
    }
    // POIs
    for (const poi of w.pois) {
      const x = toX(poi.x), y = toY(poi.z);
      if (x < 0 || x > W || y < 0 || y > H) continue;
      ctx.fillStyle = poi.type === 'gas' ? '#ff9a3d' : poi.type === 'hospital' ? '#fff' : '#54ff9d';
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
    }
    // GPS
    const target = g.missions.target;
    if (target) {
      ctx.strokeStyle = '#5dff8a'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(W / 2, H / 2); ctx.lineTo(toX(target.x), toY(target.z)); ctx.stroke();
      ctx.setLineDash([]);
      const tx = toX(target.x), ty = toY(target.z);
      if (tx > 5 && tx < W - 5 && ty > 5 && ty < H - 5) {
        ctx.fillStyle = '#ffd23c'; ctx.beginPath(); ctx.arc(tx, ty, 5, 0, Math.PI * 2); ctx.fill();
      } else {
        const ang = Math.atan2(ty - H / 2, tx - W / 2);
        const ex = W / 2 + Math.cos(ang) * (W / 2 - 10), ey = H / 2 + Math.sin(ang) * (H / 2 - 10);
        ctx.fillStyle = '#ffd23c'; ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    // polícia
    ctx.fillStyle = '#ff3045';
    for (const pc of g.police?.units || []) {
      const x = toX(pc.position.x), y = toY(pc.position.z);
      if (x > 0 && x < W && y > 0 && y < H) { ctx.beginPath(); ctx.arc(x, y, 3.4, 0, Math.PI * 2); ctx.fill(); }
    }
    // jogador
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(Math.PI - (p.inCar ? g.car.heading : p.yaw));
    ctx.fillStyle = '#61c9ff';
    ctx.shadowColor = '#39b7ff'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(0, 4); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();
    // anel
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2); ctx.stroke();
  }

  toggleMap(open = null) {
    this.mapOpen = open === null ? !this.mapOpen : open;
    $('#map-screen').classList.toggle('hidden', !this.mapOpen);
    if (this.mapOpen) { this.drawBigMap(); this.game.audio.click(); }
  }

  drawBigMap() {
    const c = $('#bigmap');
    if (!c) return;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    const g = this.game, w = g.world;
    const min = -700, max = 700;
    const toX = x => (x - min) / (max - min) * W;
    const toY = z => (z - min) / (max - min) * H;
    ctx.fillStyle = '#14251d'; ctx.fillRect(0, 0, W, H);
    // mar
    const seaGrad = ctx.createLinearGradient(toX(690), 0, W, 0);
    seaGrad.addColorStop(0, '#0a3d5e'); seaGrad.addColorStop(1, '#062537');
    ctx.fillStyle = seaGrad; ctx.fillRect(toX(690), 0, W - toX(690), H);
    ctx.fillStyle = 'rgba(80,170,200,.12)';
    for (let i = 0; i < 20; i++) ctx.fillRect(toX(690), i * 64, W, 2);
    // distritos
    for (const d of w.districts) {
      const x = toX(d.x), y = toY(d.z), r = d.r / 1400 * W;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.5);
      grad.addColorStop(0, d.color + '45'); grad.addColorStop(1, d.color + '00');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, r * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(240,248,255,.7)';
      ctx.font = 'bold 17px Arial'; ctx.textAlign = 'center';
      ctx.fillText(d.name, x, y - r - 6);
    }
    // ruas
    for (const rc of w.roadCoords) {
      ctx.strokeStyle = rc === 0 ? '#e8c94d' : '#70797c';
      ctx.lineWidth = rc === 0 ? 7 : 4;
      ctx.beginPath(); ctx.moveTo(toX(rc), 0); ctx.lineTo(toX(rc), H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, toY(rc)); ctx.lineTo(W, toY(rc)); ctx.stroke();
    }
    // prédios
    ctx.fillStyle = 'rgba(10,16,18,.55)';
    for (const o of w.obstacles) {
      const x = toX(o.minX), y = toY(o.minZ), ww = (o.maxX - o.minX) / 1400 * W, hh = (o.maxZ - o.minZ) / 1400 * H;
      ctx.fillRect(x, y, Math.max(2, ww), Math.max(2, hh));
    }
    // POIs
    for (const poi of w.pois) {
      const x = toX(poi.x), y = toY(poi.z);
      ctx.fillStyle = poi.type === 'gas' ? '#ff9a3d' : poi.type === 'hospital' ? '#ffffff' : '#54ff9d';
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '11px Arial'; ctx.textAlign = 'left';
      ctx.fillText(poi.name, x + 9, y + 4);
    }
    // polícia
    ctx.fillStyle = '#ff3045';
    for (const pc of g.police?.units || []) {
      ctx.beginPath(); ctx.arc(toX(pc.position.x), toY(pc.position.z), 6, 0, Math.PI * 2); ctx.fill();
    }
    // GPS
    const target = g.missions.target;
    if (target) {
      ctx.strokeStyle = '#5dff8a'; ctx.lineWidth = 5; ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(toX(g.player.position.x), toY(g.player.position.z));
      ctx.lineTo(toX(target.x), toY(target.z)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ffd23c'; ctx.beginPath(); ctx.arc(toX(target.x), toY(target.z), 9, 0, Math.PI * 2); ctx.fill();
    }
    // jogador
    ctx.save();
    ctx.translate(toX(g.player.inCar ? g.car.position.x : g.player.position.x), toY(g.player.inCar ? g.car.position.z : g.player.position.z));
    ctx.rotate(Math.PI - (g.player.inCar ? g.car.heading : g.player.yaw));
    ctx.fillStyle = '#61c9ff'; ctx.shadowColor = '#39b7ff'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(10, 12); ctx.lineTo(0, 7); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill();
    ctx.restore();
    // bússola
    ctx.fillStyle = 'rgba(4,10,20,.8)'; ctx.beginPath(); ctx.arc(W - 70, 70, 38, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.fillText('N', W - 70, 58);
    ctx.fillStyle = '#61c9ff'; ctx.beginPath(); ctx.moveTo(W - 70, 62); ctx.lineTo(W - 64, 82); ctx.lineTo(W - 76, 82); ctx.closePath(); ctx.fill();
  }

  togglePhone(open = null) {
    this.phoneOpen = open === null ? !this.phoneOpen : open;
    $('#phone-screen').classList.toggle('hidden', !this.phoneOpen);
    if (this.phoneOpen) this.game.audio.click();
  }

  togglePause(open = null) {
    this.game.togglePause(open);
  }

  openSettings() {
    this.settingsOpen = true;
    $('#settings-game').classList.remove('hidden');
    $('#qualitySelect').value = this.game.quality;
    $('#fpsSelect').value = 'show';
    $('#fpsToggle').checked = !!this.game.showFps;
    $('#resSelect').value = String(Math.round((this.game.resolution ?? 1) * 100));
    $('#viewDistSelect').value = this.game.viewDist || 'far';
    $('#controlSelect').value = this.game.input.mode;
    $('#sensRange').value = Math.round(this.game.sensitivity * 100);
    $('#buttonSizeRange').value = Math.round(this.game.input.ctrlScale * 100);
    $('#vibrationToggle').checked = !!this.game.settings.vibration;
  }

  closeSettings() {
    this.settingsOpen = false;
    $('#settings-game').classList.add('hidden');
    if (this.settingsFromPause) {
      this.settingsFromPause = false;
      this.game.togglePause(true);
    }
  }

  showMissionComplete(mission, reward) {
    const el = $('#mission-complete');
    $('#mcTitle').textContent = mission.name;
    $('#mcReward').textContent = '+ R$ ' + reward.toLocaleString('pt-BR');
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3300);
  }

  openShop(type) {
    const g = this.game;
    this.shopType = type;
    const config = {
      clothing: ['LOJA DE ROUPAS', 'MODA CAIO', '100 roupas · vista seu estilo'],
      barber: ['BARBEARIA', 'ESTILO DO CAIO', 'Corte, barba e atitude'],
      gym: ['ACADEMIA', 'ACADEMIA DO CAIO', 'Fique forte e mais rápido'],
      gun: ['AMMU-NATION', 'ARMAS E MUNIÇÃO', 'Proteja-se. A cidade é perigosa.'],
      mechanic: ['MECÂNICA', 'MECÂNICA DO ZÉ', 'Conserto, pintura, turbo e nitro'],
      gas: ['POSTO', 'POSTO BRASIL', 'Gasolina R$ 6,50 · etanol · diesel'],
      house: ['CASA DO CAIO', 'SUA CASA', 'Dormir, salvar, TV e videogame'],
      food: ['LANCHONETE', 'LANCHONETE BR', 'X-tudo, açaí e pastel'],
      jewelry: ['JOALHERIA', 'JOALHERIA OURO BR', 'Correntes, relógios e brilho'],
      hospital: ['HOSPITAL', 'HOSPITAL CENTRAL', 'Atendimento de emergência']
    }[type] || ['LOJA', 'LOJA', ''];
    $('#shopKicker').textContent = config[0];
    $('#shopTitle').textContent = config[1];
    $('#shopSub').textContent = config[2];
    this.renderShopItems(type);
    $('#shop-screen').classList.remove('hidden');
    g.audio.click();
  }

  closeShop() {
    this.shopType = null;
    $('#shop-screen').classList.add('hidden');
    this.game.audio.click();
  }

  renderShopItems(type) {
    const g = this.game;
    const grid = $('#shopGrid');
    const money = g.player.money;
    $('#shopMoney').textContent = 'R$ ' + Math.round(money).toLocaleString('pt-BR');
    let html = '';
    if (type === 'clothing') {
      const items = [];
      for (let i = 0; i < 100; i++) {
        const base = CLOTHES_NAMES[i % CLOTHES_NAMES.length];
        const suffix = i >= CLOTHES_NAMES.length ? ` ${Math.floor(i / CLOTHES_NAMES.length) + 1}` : '';
        const color = CLOTH_COLORS[(i * 7 + 3) % CLOTH_COLORS.length];
        const price = 60 + (i % 12) * 35;
        items.push(`<button class="shop-item" data-buy-cloth="${i}" data-color="${color}" data-name="${base}${suffix}" data-price="${price}">
          <div class="swatch" style="--sw:linear-gradient(145deg,#${color.toString(16).padStart(6, '0')},#${((color >> 1) & 0x7f7f7f).toString(16).padStart(6, '0')})"></div>
          <b>${base}${suffix}</b><span>R$ ${price}</span><small>${i < 24 ? 'Destaque' : 'Coleção BR'}</small></button>`);
      }
      html = items.join('');
    } else if (type === 'barber') {
      html = [['Corte Social', 80], ['Corte Black', 120], ['Barba feita', 60], ['Corte + barba', 160], ['Pintura platinada', 250]].map(([n, p]) => `<button class="shop-item" data-service="barber" data-name="${n}" data-price="${p}"><div class="swatch" style="--sw:linear-gradient(145deg,#1b1b1b,#8f5b36)"></div><b>${n}</b><span>R$ ${p}</span><small>Barbearia</small></button>`).join('');
    } else if (type === 'gym') {
      html = [['Treino de força', 500, '+10 vida máxima'], ['Treino de velocidade', 650, '+corrida'], ['Treino completo', 1200, '+vida e velocidade']].map(([n, p, d]) => `<button class="shop-item" data-service="gym" data-name="${n}" data-price="${p}" data-desc="${d}"><div class="swatch" style="--sw:linear-gradient(145deg,#2c3a48,#8dff5a)"></div><b>${n}</b><span>R$ ${p}</span><small>${d}</small></button>`).join('');
    } else if (type === 'gun') {
      const guns = [['Pistola', 'pistola', 900, 60], ['Metralhadora', 'metralhadora', 3200, 180], ['Escopeta', 'escopeta', 2400, 24], ['Sniper', 'sniper', 6500, 12], ['Bazuca', 'bazuca', 15000, 4], ['Minigun', 'minigun', 28000, 500], ['Colete balístico', 'colete', 1200, 0], ['Mira laser', 'mira', 800, 0], ['Silenciador', 'silenciador', 950, 0]];
      html = guns.map(([n, id, p, ammo]) => `<button class="shop-item" data-service="gun" data-gun="${id}" data-name="${n}" data-price="${p}"><div class="swatch" style="--sw:linear-gradient(145deg,#3a4148,#c7a13d)"></div><b>${n}</b><span>R$ ${p.toLocaleString('pt-BR')}</span><small>${ammo ? '+ ' + ammo + ' munições' : 'Equipamento'}</small></button>`).join('');
    } else if (type === 'mechanic') {
      html = `<button class="shop-item" data-service="repair" data-name="Consertar carro" data-price="300"><div class="swatch" style="--sw:linear-gradient(145deg,#3c4b56,#e7e2d3)"></div><b>Consertar carro</b><span>R$ 300</span><small>Repara toda a lataria</small></button>
        <button class="shop-item" data-service="turbo" data-name="Turbo + Nitro" data-price="1500"><div class="swatch" style="--sw:linear-gradient(145deg,#381010,#ff5a2d)"></div><b>Turbo + Nitro</b><span>R$ 1.500</span><small>+ velocidade máxima</small></button>` +
        PAINT_COLORS.map((c, i) => `<button class="shop-item" data-service="paint" data-color="${c}" data-name="Pintura ${i + 1}" data-price="250"><div class="swatch" style="--sw:#${c.toString(16).padStart(6, '0')}"></div><b>Pintura ${i + 1}</b><span>R$ 250</span><small>Oficina de pintura</small></button>`).join('');
    } else if (type === 'gas') {
      html = [[25, 'R$ 50'], [50, 'R$ 100'], [100, 'R$ 200']].map(([l, p]) => `<button class="shop-item" data-service="fuel" data-amount="${l}" data-name="Gasolina ${l}L" data-price="${parseInt(p.replace(/\D/g, ''))}"><div class="swatch" style="--sw:linear-gradient(145deg,#113a22,#59ff9d)"></div><b>Gasolina ${l} litros</b><span>${p}</span><small>R$ 6,50 / litro</small></button>`).join('');
    } else if (type === 'house') {
      if (!g.player.houseOwned) {
        html = `<button class="shop-item" data-service="buyhouse" data-name="Casa Pequena" data-price="15000"><div class="swatch" style="--sw:linear-gradient(145deg,#3a2c1e,#e3c08a)"></div><b>Comprar Casa Pequena</b><span>R$ 15.000</span><small>Salvar · dormir · garagem</small></button>`;
      } else {
        html = [['Dormir até amanhã', 'sleep', 0], ['Salvar jogo', 'save', 0], ['Assistir TV', 'tv', 0], ['Jogar videogame', 'game', 0], ['Guardar carro na garagem', 'garage', 0], ['Trocar de roupa', 'wardrobe', 0]].map(([n, s, p]) => `<button class="shop-item" data-service="${s}" data-name="${n}" data-price="${p}"><div class="swatch" style="--sw:linear-gradient(145deg,#203448,#9bc7ff)"></div><b>${n}</b><span>${p ? 'R$ ' + p : 'Grátis'}</span><small>Casa do Caio</small></button>`).join('');
      }
    } else if (type === 'food') {
      html = [['X-Tudo', 35, 30, 10], ['Pastel + caldo', 18, 15, 10], ['Açaí 500ml', 22, 18, 25], ['Marmita completa', 28, 45, 8], ['Água gelada', 5, 0, 40]].map(([n, p, h, t]) => `<button class="shop-item" data-service="food" data-name="${n}" data-price="${p}" data-hunger="${h}" data-thirst="${t}"><div class="swatch" style="--sw:linear-gradient(145deg,#4a2b0e,#ffd35c)"></div><b>${n}</b><span>R$ ${p}</span><small>+${h} fome · +${t} sede</small></button>`).join('');
    } else if (type === 'jewelry') {
      html = [['Corrente de Ouro', 2500], ['Relógio de Ouro', 4800], ['Anel de Diamante', 12000], ['Pulseira de Prata', 1500]].map(([n, p]) => `<button class="shop-item" data-service="jewelry" data-name="${n}" data-price="${p}"><div class="swatch" style="--sw:linear-gradient(145deg,#5a3b00,#ffe36b)"></div><b>${n}</b><span>R$ ${p.toLocaleString('pt-BR')}</span><small>Brilho de verdade</small></button>`).join('');
    } else if (type === 'hospital') {
      html = `<button class="shop-item" data-service="hospital" data-name="Atendimento médico" data-price="250"><div class="swatch" style="--sw:linear-gradient(145deg,#5c1b22,#fff)"></div><b>Atendimento médico</b><span>R$ 250</span><small>Recupera 100% da vida</small></button>`;
    }
    grid.innerHTML = html;
    $$('[data-buy-cloth]', grid).forEach(btn => btn.addEventListener('click', () => this.buyCloth(btn)));
    $$('[data-service]', grid).forEach(btn => btn.addEventListener('click', () => this.buyService(btn)));
  }

  buyCloth(btn) {
    const g = this.game;
    const price = +btn.dataset.price;
    if (g.player.money < price) { this.toast('Dinheiro insuficiente!'); g.audio.uiError(); return; }
    g.player.addMoney(-price);
    const color = +btn.dataset.color;
    g.player.applyOutfit({ name: btn.dataset.name, color, pants: pick([0x2b4266, 0x222222, 0x4b3a2a, 0x31445f]), cap: color });
    g.audio.cash();
    this.toast(`${btn.dataset.name} comprada!`);
    this.renderShopItems('clothing');
  }

  buyService(btn) {
    const g = this.game;
    const price = +(btn.dataset.price || 0);
    const service = btn.dataset.service;
    if (price && g.player.money < price) { this.toast('Dinheiro insuficiente!'); g.audio.uiError(); return; }
    if (price) g.player.addMoney(-price);
    if (service === 'barber') {
      g.player.barberLevel++;
      g.audio.cash(); this.toast(`${btn.dataset.name} feito! Estilo renovado.`);
    } else if (service === 'gym') {
      g.player.gymLevel++;
      g.player.maxHealth += 10; g.player.health = g.player.maxHealth;
      g.audio.cash(); this.toast('Treino concluído! Você ficou mais forte.');
    } else if (service === 'gun') {
      const gun = btn.dataset.gun;
      if (gun === 'colete') { g.player.health = g.player.maxHealth; this.toast('Colete equipado!'); }
      else if (gun === 'mira' || gun === 'silenciador') { g.hasLaser = true; this.toast(`${btn.dataset.name} equipado!`); }
      else { g.player.ammo[gun] = (g.player.ammo[gun] || 0) + (gun === 'metralhadora' ? 180 : gun === 'minigun' ? 500 : 60); g.player.setWeapon(gun); g.equipWeapon(gun); this.toast(`${btn.dataset.name} comprada!`); }
      g.audio.cash();
    } else if (service === 'repair') {
      g.car.repair(); g.audio.cash(); this.toast('Carro consertado!');
    } else if (service === 'paint') {
      g.car.paint(+btn.dataset.color); g.audio.cash(); this.toast('Carro pintado!');
    } else if (service === 'turbo') {
      g.car.maxSpeed += 20; g.car.nitro = 100; g.audio.cash(); this.toast('Turbo e nitro instalados!');
    } else if (service === 'fuel') {
      g.car.fuel = Math.min(100, g.car.fuel + +btn.dataset.amount); g.audio.cash(); this.toast('Abastecido!');
    } else if (service === 'buyhouse') {
      g.player.houseOwned = true; g.audio.cash(); this.toast('Casa comprada! Bem-vindo ao seu lar.'); this.renderShopItems('house');
    } else if (service === 'sleep') {
      g.world.hour = 7.2; g.player.health = g.player.maxHealth; g.player.hunger = 100; g.player.thirst = 100;
      g.saveGame(); this.closeShop(); g.notify('Você dormiu. Jogo salvo automaticamente.');
    } else if (service === 'save') {
      g.saveGame(true);
    } else if (service === 'tv') {
      this.toast('Você assistiu ao jogo do Corinthians: 2 a 1. Vai Corinthians!');
    } else if (service === 'game') {
      this.toast('Você jogou GTA 5 BR dentro do GTA 5 BR. Muito meta!');
    } else if (service === 'garage') {
      g.car.position.set(290, 0, 270); g.notify('Carro guardado na garagem da casa.');
    } else if (service === 'wardrobe') {
      g.player.applyOutfit({ name: 'Camisa do Brasil', color: 0xffd32a, cap: 0x1f8a3d }); this.toast('Você vestiu a camisa do Brasil!');
    } else if (service === 'food') {
      g.player.hunger = Math.min(100, g.player.hunger + +(btn.dataset.hunger || 0));
      g.player.thirst = Math.min(100, g.player.thirst + +(btn.dataset.thirst || 0));
      g.player.heal(10);
      g.audio.cash(); this.toast(`${btn.dataset.name} consumido!`);
    } else if (service === 'jewelry') {
      g.player.chain = btn.dataset.name; g.audio.cash(); this.toast(`${btn.dataset.name} comprada!`);
    } else if (service === 'hospital') {
      g.player.health = g.player.maxHealth; g.audio.cash(); this.toast('Atendimento concluído. Vida cheia!');
    }
    $('#shopMoney').textContent = 'R$ ' + Math.round(g.player.money).toLocaleString('pt-BR');
  }

  showDeath() { $('#death-screen').classList.remove('hidden'); }
  hideDeath() { $('#death-screen').classList.add('hidden'); }
  showPrison() { $('#prison-screen').classList.remove('hidden'); }
  hidePrison() { $('#prison-screen').classList.add('hidden'); }
}
