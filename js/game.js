import * as THREE from 'three';
import { World } from './world.js';
import { Player, WEAPONS } from './player.js';
import { Vehicle } from './vehicle.js';
import { MissionSystem } from './missions.js';
import { InputController } from './input.js';
import { GameUI } from './ui.js';
import { PoliceSystem } from './police.js';
import { clamp } from './world-utils.js';

export class Game {
  constructor(audio, ps5, settings) {
    this.audio = audio;
    this.ps5 = ps5;
    this.settings = settings || {};
    this.quality = this.settings.quality || 'high';
    this.sensitivity = (this.settings.sensitivity || 100) / 100;
    this.dead = false;
    this.paused = true;
    this.active = false;
    this.inPrison = false;
    this.camYaw = Math.PI;
    this.camPitch = .2;
    this.camDist = 6.8;
    this.cameraTarget = new THREE.Vector3();
    this.cameraPos = new THREE.Vector3();
    this.shake = 0;
    this.effects = [];
    this.interactTimer = 0;
    this.hudTimer = 0;
    this.autosaveTimer = 0;
    this.lastInteract = '';
    this.hasLaser = false;
    this.currentTrafficIndex = null;
    this.musicGenres = ['funk', 'rap', 'sertanejo', 'pagode'];
    this.musicIndex = 0;
    this.currentGameId = 'gta';
    this.scaleLevel = 1;
    this.scaleGameId = 'gta';
    this.perfMode = 'auto';
    this.fpsCap = 60;
    this.resolution = 1;
    this.viewDist = 'far';
    this.showFps = true;
    this.fpsEma = 60;
    this.lowFpsAt = 0;
    this._lastFrameAt = 0;

    const canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.quality !== 'low', powerPreference: 'high-performance', alpha: false });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = this.quality !== 'low';
    this.renderer.shadowMap.type = this.quality === 'low' ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, .12, 2500);
    this.camera.position.set(10, 5, 12);
    this.scene.add(this.camera);

    this.world = new World(this.scene, this.renderer, audio, this.quality);
    this.player = new Player(this);
    this.car = new Vehicle(this, { x: 4, z: 36, heading: 0, name: 'GOL QUADRADO', color: 0xd9d3c1, type: 'popular' });
    this.police = new PoliceSystem(this);
    this.missions = new MissionSystem(this);
    this.input = new InputController(this);
    this.ui = new GameUI(this);

    this.camYaw = Math.PI;
    this.camPitch = .2;
    this.camera.position.set(this.player.position.x, 4.4, this.player.position.z - 7);
    this.camera.lookAt(this.player.position.x, 1.3, this.player.position.z);

    this.bindExtra();
    this.loadGame();
    this.applyQuality(this.quality, true);
    this.applyPerformance(this.perfMode);
    this.setupResize();
    this.animate = this.animate.bind(this);
    this.clock = new THREE.Clock();
    this.last = performance.now();
    this._rafId = requestAnimationFrame(this.animate);
  }

  bindExtra() {
    const onResize = () => this.resize();
    const onGS = e => this.applySettings(e.detail);
    const onVis = () => { if (document.hidden) this.saveGame(); };
    this._disposeFns = [];
    const add = (t, ty, fn) => { t.addEventListener(ty, fn); this._disposeFns.push(() => { try { t.removeEventListener(ty, fn); } catch {} }); };
    add(window, 'resize', onResize);
    add(window, 'gta-settings', onGS);
    add(document, 'visibilitychange', onVis);
    this.autosaveInterval = setInterval(() => { if (this.active && !this.dead) this.saveGame(); }, 60000);
    this._cleanTimer = setInterval(() => { if (this.active) this.cleanupMemory(); }, 60000);
  }

  dispose() {
    try { cancelAnimationFrame(this._rafId); } catch {}
    clearInterval(this.autosaveInterval);
    clearInterval(this._cleanTimer);
    const fns = this._disposeFns || [];
    for (const f of fns.splice(0)) { try { f(); } catch {} }
  }

  setupResize() { this.resize(); }
  resize() {
    const w = innerWidth, h = innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  applySettings(s) {
    if (!s) return;
    this.settings = s;
    this.audio.setVolume((s.volume ?? 65) / 100);
    this.sensitivity = (s.sensitivity ?? 100) / 100;
    if (this.input && s.controlMode && s.controlMode !== this.input.mode) this.input.setMode(s.controlMode, true);
    if (s.quality && s.quality !== this.quality) this.applyQuality(s.quality, true);
    if (s.perfMode) this.applyPerformance(s.perfMode);
    if (s.fpsCap) this.setFpsCap(String(s.fpsCap));
    if (s.resolution) this.applyResolution(Number(s.resolution));
    if (s.viewDist) this.setViewDist(s.viewDist);
    if (typeof s.showFps === 'boolean') this.setShowFps(s.showFps);
    if (this.input) {
      this.input.ctrlScale = (s.buttonSize ?? 100) / 100;
      this.input.applySize();
    }
  }

  enter() {
    this.active = true;
    this.paused = false;
    this.dead = false;
    const gDef = this.ps5?.currentGame;
    this.currentGameId = gDef?.id || this.currentGameId;
    this.scaleGameId = this.currentGameId;
    this.loadGame();
    this.audio.init();
    this.audio.setVolume((this.settings.volume ?? 65) / 100);
    this.audio.startMusic();
    this.audio.setGenre(gDef?.music || 'funk');
    this.ui.hideDeath();
    this.ui.hidePrison();
    this.ui.toggleMap(false);
    this.ui.togglePhone(false);
    document.getElementById('pause-screen')?.classList.add('hidden');
    document.getElementById('settings-game')?.classList.add('hidden');
    document.getElementById('shop-screen')?.classList.add('hidden');
    this.camYaw = Math.PI;
    this.camPitch = .2;
    this.updateHUD(true);
    this.notify('Bem-vindo ao GTA 5 BR — Edição Caio!');
    this.ui.toast('Mundo aberto · sem tela de loading');
    if (this.missions.index < 0) {
      setTimeout(() => { if (this.active && !this.dead) this.missions.start(0); }, 1600);
    } else {
      setTimeout(() => { if (this.active && !this.dead && !this.missions.active) this.missions.start(this.missions.index); }, 1000);
    }
    this.audio.speak('Bem-vindo à Cidade Caio. Explore os dez bairros, cumpra missões e domine as ruas do Brasil.');
  }

  exitToPS5() {
    this.active = false;
    this.paused = true;
    this.saveGame();
    this.audio.stopEngine();
    this.audio.sirenStop();
    this.ui.toggleMap(false);
    this.ui.togglePhone(false);
    document.getElementById('pause-screen')?.classList.add('hidden');
    document.getElementById('death-screen')?.classList.add('hidden');
    document.getElementById('prison-screen')?.classList.add('hidden');
    document.getElementById('shop-screen')?.classList.add('hidden');
    document.getElementById('settings-game')?.classList.add('hidden');
    this.ps5.returnToPS5();
  }

  togglePause(open = null) {
    if (this.dead || this.inPrison) return;
    this.paused = open === null ? !this.paused : open;
    document.getElementById('pause-screen').classList.toggle('hidden', !this.paused);
    if (this.paused) {
      this.audio.click();
      this.ui.toggleMap(false);
      this.ui.togglePhone(false);
    } else {
      document.getElementById('settings-game')?.classList.add('hidden');
    }
  }

  restart() {
    this.player.respawnAt(8, 30);
    this.player.money = 2500;
    this.player.ammo = { pistola: 60, metralhadora: 180, escopeta: 24, sniper: 12, bazuca: 4, granada: 6, molotov: 6, rpg: 4, minigun: 500 };
    this.player.weapon = 'soco';
    this.player.setWeapon('soco');
    this.car.position.set(4, 0, 36);
    this.car.heading = 0;
    this.car.repair(); this.car.refuel();
    this.police.setWanted(0);
    this.missions.index = -1;
    this.missions.active = null;
    this.missions.marker.visible = false;
    this.dead = false;
    this.inPrison = false;
    this.ui.hideDeath(); this.ui.hidePrison();
    this.togglePause(false);
    this.saveGame();
    this.missions.start(0);
    this.notify('Jogo reiniciado!');
  }

  updateHUD(force = false) { this.ui.updateHUD(force); }
  setMissionHUD(m) { this.ui.setMissionHUD(m); }
  notify(t) { this.ui.notify(t); }
  toast(t) { this.ui.toast(t); }
  damageFlash() { this.ui.damageFlash(); }

  cycleQuality() {
    const order = ['high', 'medium', 'low'];
    const next = order[(order.indexOf(this.quality) + 1) % order.length];
    this.applyQuality(next);
  }

  applyQuality(q, silent = false) {
    const quality = q === 'ultra' ? 'high' : q;
    this.quality = quality;
    const pr = quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pr * (this.resolution || 1)));
    this.renderer.shadowMap.enabled = quality !== 'low';
    this.renderer.shadowMap.type = quality === 'low' ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    this.renderer.toneMappingExposure = quality === 'high' ? (q === 'ultra' ? 1.12 : 1.04) : 0.95;
    this.world.setQuality(quality);
    this.settings.quality = q;
    if (!silent) {
      const label = quality === 'high' ? 'Alta' : quality === 'medium' ? 'Média' : 'Baixa';
      this.notify(`Qualidade gráfica: ${label}`);
      this.ui.toast(`Qualidade ${label}`);
    }
  }

  detectPerformance() {
    const touch = matchMedia('(pointer: coarse)').matches || innerWidth < 900;
    if (!touch) return 'good';
    const mem = navigator.deviceMemory ? navigator.deviceMemory * 1024 * 1024 : 6 * 1024 * 1024 * 1024;
    const total = mem > 0 ? mem * 2 : 8 * 1024 * 1024 * 1024;
    const frac = Math.min(1, mem / total);
    if (frac > 0.55) return 'good';
    if (frac > 0.3) return 'medium';
    return 'weak';
  }

  applyPerformance(mode = 'auto') {
    const perf = mode === 'auto' ? this.detectPerformance() : mode;
    this.perfMode = perf;
    const q = perf === 'good' ? 'high' : perf === 'medium' ? 'medium' : 'low';
    this.applyQuality(q, true);
    this.fpsCap = perf === 'good' ? 60 : 30;
    this.renderer.shadowMap.enabled = perf !== 'weak';
    this.renderer.shadowMap.type = perf === 'weak' ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    this.world.setQuality(perf === 'weak' ? 'low' : perf);
    this.world.reflections = perf !== 'weak';
    const density = perf === 'good' ? 1 : perf === 'medium' ? 0.45 : 0.16;
    this.world.peds.setDensity(density);
    this.world.traffic.setDensity(perf === 'good' ? 1 : perf === 'medium' ? 0.3 : 0.15);
    if (this.perfMode !== 'auto') {
      const label = perf === 'good' ? 'DESEMPENHO BOM' : perf === 'medium' ? 'DESEMPENHO MÉDIO' : 'DESEMPENHO FRACO';
      this.notify(`Módulo de desempenho: ${label}`);
    }
    return perf;
  }

  applyScale(level, gameId) {
    this.scaleLevel = level;
    this.scaleGameId = gameId || this.currentGameId;
    const mult = [1, 1.5, 2.4][level - 1] || 1;
    if (this.world?.traffic?.setDensity) this.world.traffic.setDensity(Math.min(1, (this.world.traffic.density || 1) * mult));
    if (this.world?.peds?.setDensity) this.world.peds.setDensity(Math.min(1, (this.world.peds.density || 1) * mult));
    const total = [10, 30, 100][level - 1] || 10;
    if (this.missions) this.missions.missionLimit = total;
    if (this.ui?.toast) this.ui.toast(`📈 Missões escaladas para o Nível ${level} · ${total} missões disponíveis.`);
    return level;
  }

  applyResolution(r = 100) {
    this.resolution = Math.max(.5, Math.min(1, (r || 100) / 100));
    const pr = this.quality === 'high' ? 2 : this.quality === 'medium' ? 1.5 : 1;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pr * this.resolution));
  }

  setFpsCap(v) {
    const val = String(v);
    if (val === 'show') { this.showFps = true; return; }
    this.showFps = true;
    this.fpsCap = Math.max(15, Math.min(60, parseInt(val, 10) || 30));
    this.applyPerformance(this.fpsCap >= 60 ? 'good' : 'weak');
  }

  setShowFps(v) { this.showFps = !!v; }

  setViewDist(v) { this.viewDist = v; }

  cleanupMemory() {
    if (this.effects && this.effects.length) {
      for (let i = this.effects.length - 1; i >= 0; i--) {
        const e = this.effects[i];
        try { this.scene.remove(e.group); this.scene.remove(e.light); } catch {}
        if (e.particles) e.particles.forEach(p => { try { p.geo?.dispose?.(); p.mat?.dispose?.(); } catch {} });
        this.effects.splice(i, 1);
      }
    }
    try {
      const keep = ['gta5br_save', 'gta5br_custom_profile', 'gta5br_ps5'];
      Object.keys(localStorage).filter(k => !keep.includes(k)).forEach(k => { try { localStorage.removeItem(k); } catch {} });
    } catch {}
  }

  clearCache() {
    this.cleanupMemory();
    try { this.renderer.info?.reset?.(); } catch {}
    this._lastFrameAt = 0;
    this.notify('Cache limpo e jogo destravado.');
    this.ui.toast('🧹 Cache limpo e jogo destravado.');
  }

  get perfTemp() {
    const over = Math.max(0, 60 - (this.fpsEma || 60));
    return Math.min(42, 36.5 + over * 0.09);
  }

  cycleWeather() {
    const w = this.world.cycleWeather();
    this.notify(`Clima alterado: ${w.toUpperCase()}`);
  }

  cycleRadio() {
    this.musicIndex = (this.musicIndex + 1) % this.musicGenres.length;
    const genre = this.musicGenres[this.musicIndex];
    this.audio.setGenre(genre);
    const names = { funk: 'FUNK BR', rap: 'RAP NACIONAL', sertanejo: 'SERTANEJO', pagode: 'PAGODE' };
    this.notify(`Rádio: ${names[genre]}`);
  }

  toggleMusic() {
    this.audio.toggleMusic(!this.audio.musicOn);
    this.notify(this.audio.musicOn ? 'Som ligado' : 'Som desligado');
  }
  toggleMute() {
    this.audio.setVolume(this.audio.volume > 0 ? 0 : (this.settings.volume ?? 65) / 100);
    this.notify(this.audio.volume > 0 ? 'Som ativado' : 'Microfone/som silenciado');
  }
  toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }
  resetCamera() { this.camYaw = this.player.inCar ? this.car.heading + Math.PI : Math.PI; this.camPitch = .2; this.camDist = 6.8; }

  equipWeapon(name) {
    if (!WEAPONS[name]) return;
    if (name !== 'soco' && !this.player.ammo[name] && !['taco', 'faca'].includes(name)) { this.notify('Sem munição para essa arma.'); return; }
    this.player.setWeapon(name);
  }

  switchWeapon(dir = 1) {
    const list = ['soco', 'pistola', 'metralhadora', 'escopeta', 'sniper', 'bazuca', 'minigun'];
    let i = list.indexOf(this.player.weapon);
    for (let k = 0; k < list.length; k++) {
      i = (i + dir + list.length) % list.length;
      if (i === 0 || this.player.ammo[list[i]] > 0) { this.equipWeapon(list[i]); return; }
    }
  }

  reloadWeapon() {
    if (this.player.inCar) return;
    this.audio.reload();
    this.notify(`Recarregando ${WEAPONS[this.player.weapon].name}...`);
    this.player.shootCooldown = Math.max(this.player.shootCooldown, .6);
  }

  eatFood() {
    if (this.player.money < 10) { this.notify('Sem dinheiro para comprar comida.'); return; }
    this.player.addMoney(-10);
    this.player.hunger = Math.min(100, this.player.hunger + 24);
    this.player.thirst = Math.min(100, this.player.thirst + 16);
    this.player.heal(6);
    this.audio.cash();
    this.notify('Você comeu um pastel e bebeu uma água. +fome +sede');
  }

  horn() {
    if (!this.player.inCar) { this.player.greet(); return; }
    this.audio.horn();
    const near = this.world.peds.nearby(this.car.position.x, this.car.position.z, 12);
    if (near.length && Math.random() < .4) this.notify('O pedestre levou um susto com a buzina!');
  }

  toggleCar() {
    if (this.player.inCar) this.exitCar();
    else this.enterNearestCar();
  }

  enterNearestCar() {
    const p = this.player;
    const traffic = this.world.traffic.nearest(p.position.x, p.position.z, 7);
    const ownDist = Math.hypot(this.car.position.x - p.position.x, this.car.position.z - p.position.z);
    if (traffic && traffic.dist < (ownDist < 7 ? ownDist : 999)) {
      this.world.traffic.hide(traffic.index);
      this.currentTrafficIndex = traffic.index;
      this.car.position.set(traffic.x, 0, traffic.z);
      this.car.heading = traffic.axis === 'x' ? (traffic.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (traffic.dir > 0 ? 0 : Math.PI);
      this.car.setColor(traffic.color);
      this.car.name = 'CARRO DE RUA';
      this.car.fuel = Math.max(30, Math.random() * 90);
      this.car.repair();
    } else if (ownDist < 7.5) {
      this.car.group.visible = true;
    } else {
      this.notify('Nenhum carro por perto. Aproxime-se de um veículo.');
      return;
    }
    p.inCar = true;
    p.root.visible = false;
    this.car.enter();
    this.car.group.visible = true;
    this.audio.carDoor();
    this.notify(`Entrou no ${this.car.name}. R2 acelera · E sai.`);
    this.camYaw = this.car.heading + Math.PI;
    this.ui.updateVehicleHUD(this.car);
  }

  exitCar(force = false) {
    if (!this.player.inCar) return;
    this.player.inCar = false;
    this.car.exit();
    const side = new THREE.Vector3(Math.cos(this.car.heading) * 2.6, 0, -Math.sin(this.car.heading) * 2.6);
    this.player.position.set(this.car.position.x + side.x, 0, this.car.position.z + side.z);
    this.player.root.visible = true;
    this.player.root.position.copy(this.player.position);
    this.player.vy = 0;
    this.audio.carDoor();
    this.ui.updateVehicleHUD(null);
    this.notify('Você saiu do carro.');
  }

  interact() {
    if (this.dead || this.paused) return;
    if (this.player.inCar) {
      const gas = this.world.nearestPOI(this.car.position.x, this.car.position.z, 'gas');
      const mech = this.world.nearestPOI(this.car.position.x, this.car.position.z, 'mechanic');
      if (gas) { this.openShop('gas'); return; }
      if (mech) { this.openShop('mechanic'); return; }
      this.exitCar();
      return;
    }
    const poi = this.world.nearestPOI(this.player.position.x, this.player.position.z);
    const ownDist = Math.hypot(this.car.position.x - this.player.position.x, this.car.position.z - this.player.position.z);
    const traffic = this.world.traffic.nearest(this.player.position.x, this.player.position.z, 7);
    if (poi) { this.openShop(poi.type === 'food' ? 'food' : poi.type); return; }
    if (traffic) { this.enterNearestCar(); return; }
    if (ownDist < 7.5) { this.enterNearestCar(); return; }
    this.notify('Nada para interagir por aqui.');
  }

  openShop(type) {
    if (!type) return;
    const map = { hospital: 'hospital', gas: 'gas', clothing: 'clothing', barber: 'barber', gym: 'gym', gun: 'gun', mechanic: 'mechanic', house: 'house', food: 'food', jewelry: 'jewelry' };
    this.ui.openShop(map[type] || type);
    this.audio.click();
  }

  updateInteraction() {
    const p = this.player;
    let text = '', action = null;
    if (p.inCar) {
      if (this.world.nearestPOI(this.car.position.x, this.car.position.z, 'gas')) text = 'Abastecer no Posto Brasil';
      else if (this.world.nearestPOI(this.car.position.x, this.car.position.z, 'mechanic')) text = 'Consertar na Mecânica do Zé';
      else text = 'Sair do carro';
    } else {
      const poi = this.world.nearestPOI(p.position.x, p.position.z);
      const traffic = this.world.traffic.nearest(p.position.x, p.position.z, 7);
      const ownDist = Math.hypot(this.car.position.x - p.position.x, this.car.position.z - p.position.z);
      if (poi) {
        const names = { clothing: 'Entrar na Loja de Roupas', barber: 'Entrar na Barbearia', gym: 'Entrar na Academia', gun: 'Entrar na Ammu-Nation', mechanic: 'Entrar na Mecânica', gas: 'Abastecer', house: 'Entrar em Casa', food: 'Comprar na Lanchonete', jewelry: 'Entrar na Joalheria', hospital: 'Atendimento no Hospital' };
        text = names[poi.type] || 'Interagir';
      } else if (traffic) text = 'Entrar no carro';
      else if (ownDist < 7.5) text = `Entrar no ${this.car.name}`;
    }
    const el = document.getElementById('interaction');
    if (text) {
      if (this.lastInteract !== text) {
        document.getElementById('interactionText').textContent = text;
        this.lastInteract = text;
      }
      el.classList.remove('hidden');
    } else { el.classList.add('hidden'); this.lastInteract = ''; }
  }

  attack() {
    if (this.dead || this.paused) return;
    const p = this.player;
    if (p.inCar) { this.horn(); return; }
    if (p.shootCooldown > 0) return;
    const w = WEAPONS[p.weapon];
    p.shootCooldown = w.rate;
    if (w.ammo !== Infinity) {
      if (!p.ammo[p.weapon]) { this.audio.uiError(); this.notify('Munição acabou! Compre na Ammu-Nation.'); return; }
      p.ammo[p.weapon]--;
    }
    if (['soco', 'taco', 'faca'].includes(p.weapon)) this.melee(w);
    else this.fireWeapon(w);
  }

  melee(w) {
    const p = this.player;
    this.audio.punch();
    if (navigator.vibrate && this.settings.vibration) navigator.vibrate(25);
    const dir = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
    const targetPoint = p.position.clone().add(dir.multiplyScalar(1.4));
    const enemies = this.missions.enemies.filter(e => !e.dead && e.position.distanceTo(targetPoint) < w.range);
    if (enemies.length) { enemies[0].hit(w.damage); this.notify('Acertou o inimigo!'); this.police.setWanted(p.wanted + .5); return; }
    const peds = this.world.peds.nearby(targetPoint.x, targetPoint.z, w.range);
    if (peds.length) { this.onPedHit(peds[0]); this.notify('Você acertou um pedestre!'); return; }
    this.spawnHitEffect(targetPoint, 0xffe0a0);
  }

  fireWeapon(w) {
    const p = this.player;
    this.audio[w.sound === 'explosion' ? 'explosion' : 'gunshot']();
    if (navigator.vibrate && this.settings.vibration) navigator.vibrate(w.auto ? 12 : 35);
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    if (!p.aiming && !p.inCar) {
      dir.set(Math.sin(p.yaw), 0, Math.cos(p.yaw));
      if (this.camPitch) dir.y = -.02;
      dir.normalize();
    }
    const origin = p.position.clone().add(new THREE.Vector3(0, 1.45, 0));
    this.muzzleFlash(origin.clone().add(dir.clone().multiplyScalar(.8)), dir);
    this.shake = Math.max(this.shake, .08);
    this.police.setWanted(p.wanted + .5);

    let best = null, bestDist = w.range;
    for (const e of this.missions.enemies) {
      if (e.dead) continue;
      const to = e.position.clone().add(new THREE.Vector3(0, 1.1, 0)).sub(origin);
      const proj = to.dot(dir);
      if (proj < 0 || proj > w.range) continue;
      const perp = to.clone().sub(dir.clone().multiplyScalar(proj)).length();
      if (perp < 1.1 && proj < bestDist) { best = e; bestDist = proj; }
    }
    if (!best) {
      const peds = this.world.peds.nearby(p.position.x, p.position.z, Math.min(w.range, 60));
      let pedBest = null, pedDist = bestDist;
      for (const ped of peds) {
        const to = new THREE.Vector3(ped.x, .9, ped.z).sub(origin);
        const proj = to.dot(dir);
        if (proj < 0 || proj > w.range) continue;
        const perp = to.clone().sub(dir.clone().multiplyScalar(proj)).length();
        if (perp < .8 && proj < pedDist) { pedBest = ped; pedDist = proj; }
      }
      if (pedBest) {
        this.onPedHit(pedBest);
        this.spawnHitEffect(new THREE.Vector3(pedBest.x, 1, pedBest.z), 0xff4455);
        return;
      }
    }
    if (best) {
      best.hit(w.damage);
      this.spawnHitEffect(best.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xff3344);
      this.notify('Alvo atingido!');
      this.police.setWanted(p.wanted + .5);
    } else {
      const end = origin.clone().add(dir.clone().multiplyScalar(Math.min(w.range, 60)));
      this.tracer(origin, end);
      this.spawnHitEffect(end, 0xffcf7a);
    }
    if (['bazuca', 'rpg', 'granada', 'molotov'].includes(p.weapon)) {
      const end = origin.clone().add(dir.clone().multiplyScalar(18));
      this.spawnExplosion(end, 1.4);
      this.police.setWanted(p.wanted + 1);
    }
  }

  spawnHitEffect(pos, color) {
    const geo = new THREE.SphereGeometry(.11, 5, 4);
    const mat = new THREE.MeshBasicMaterial({ color });
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(pos); this.scene.add(m);
    setTimeout(() => { this.scene.remove(m); geo.dispose(); mat.dispose(); }, 130);
  }

  tracer(a, b) {
    const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    const mat = new THREE.LineBasicMaterial({ color: 0xffe29a, transparent: true, opacity: .8 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    setTimeout(() => { this.scene.remove(line); geo.dispose(); mat.dispose(); }, 55);
  }

  muzzleFlash(pos, dir) {
    const light = new THREE.PointLight(0xffd06a, 9, 9, 2);
    light.position.copy(pos); this.scene.add(light);
    const s = new THREE.Mesh(new THREE.SphereGeometry(.13, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffe8a0 }));
    s.position.copy(pos); this.scene.add(s);
    const end = pos.clone().add(dir.clone().multiplyScalar(8));
    this.tracer(pos, end);
    setTimeout(() => { this.scene.remove(light); this.scene.remove(s); }, 55);
  }

  spawnExplosion(pos, scale = 1, small = false) {
    this.audio.explosion();
    this.shake = Math.max(this.shake, small ? .25 : .9);
    const light = new THREE.PointLight(0xff8a2e, 90 * scale, 45 * scale, 2);
    light.position.copy(pos).add(new THREE.Vector3(0, 1.5, 0));
    this.scene.add(light);
    const group = new THREE.Group();
    const particles = [];
    const colors = [0xffca4a, 0xff7a1e, 0xff3b1f, 0x7a4a3a];
    const weak = this.perfMode === 'weak';
    for (let i = 0; i < (small || weak ? 9 : 22); i++) {
      const geo = new THREE.SphereGeometry(rand(.18, .6) * scale, 5, 4);
      const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length], transparent: true, opacity: .95 });
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(pos);
      const vel = new THREE.Vector3(rand(-7, 7) * scale, rand(2, 12) * scale, rand(-7, 7) * scale);
      particles.push({ m, vel, geo, mat });
      group.add(m);
    }
    this.scene.add(group);
    this.effects.push({ group, particles, light, life: 1.25, max: 1.25 });
    if (!small) {
      this.notify('💥 Explosão!');
      const d = this.player.position.distanceTo(pos);
      if (d < 16) this.player.takeDamage(35 * (1 - d / 16), 'explosão');
    }
  }

  updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.life -= dt;
      e.light.intensity = Math.max(0, e.light.intensity - dt * 160);
      e.particles.forEach(p => {
        p.vel.y -= 12 * dt;
        p.m.position.addScaledVector(p.vel, dt);
        p.m.scale.multiplyScalar(1 + dt * .4);
        p.mat.opacity = Math.max(0, e.life / e.max);
      });
      if (e.life <= 0) {
        this.scene.remove(e.group); this.scene.remove(e.light);
        e.particles.forEach(p => { p.geo.dispose(); p.mat.dispose(); });
        this.effects.splice(i, 1);
      }
    }
  }

  onPedHit(ped) {
    if (ped.dead) return;
    ped.dead = true;
    this.police.setWanted(this.player.wanted + 1);
    this.audio.hit();
    this.notify('Pedestre atingido! A polícia foi acionada.');
    if (navigator.vibrate && this.settings.vibration) navigator.vibrate([40, 40, 60]);
  }

  onPlayerDeath(reason = '') {
    if (this.dead) return;
    this.dead = true;
    this.paused = true;
    this.player.health = 0;
    this.player.addMoney(-500);
    this.audio.stopEngine();
    this.audio.sirenStop();
    this.audio.speak('Você morreu. O hospital cobrou quinhentos reais.');
    this.ui.showDeath();
    this.notify('Você morreu. Perdeu R$ 500.');
  }

  respawn() {
    this.dead = false;
    this.paused = false;
    this.player.respawnAt(120, 88);
    this.player.hunger = Math.max(35, this.player.hunger);
    this.player.thirst = Math.max(35, this.player.thirst);
    this.player.weapon = 'soco';
    this.player.setWeapon('soco');
    this.police.setWanted(0);
    this.ui.hideDeath();
    this.camYaw = Math.PI;
    this.camPitch = .2;
    this.updateHUD(true);
    this.notify('Você acordou no Hospital Central.');
    this.audio.speak('Você acordou no hospital. Tente de novo, jogador.');
  }

  onArrested() {
    if (this.inPrison || this.dead) return;
    this.inPrison = true;
    this.paused = true;
    this.player.ammo = { pistola: 0, metralhadora: 0, escopeta: 0, sniper: 0, bazuca: 0, granada: 0, molotov: 0, rpg: 0, minigun: 0 };
    this.player.setWeapon('soco');
    this.player.weapon = 'soco';
    this.police.setWanted(0);
    this.world.hour = 7.4;
    this.audio.speak('Você foi preso. As armas foram apreendidas.');
    this.ui.showPrison();
  }

  leavePrison() {
    this.inPrison = false;
    this.paused = false;
    this.player.respawnAt(42, -104);
    this.player.health = this.player.maxHealth;
    this.player.hunger = 65; this.player.thirst = 65;
    this.ui.hidePrison();
    this.updateHUD(true);
    this.notify('Você saiu da cadeia. As ruas esperam por você.');
  }

  onMissionComplete(mission, reward) {
    this.ui.showMissionComplete(mission, reward);
    this.saveGame();
  }

  nextMission() {
    if (this.missions.active && !this.missions.active.completed) {
      this.notify(`Conclua a missão atual: ${this.missions.active.name}`);
      return;
    }
    this.missions.start();
  }

  get saveKey() { return 'gta5br_save_' + (this.currentGameId || 'gta'); }

  saveGame(toast = false) {
    if (!this.player) return;
    try {
      const data = {
        money: this.player.money, health: this.player.health, hunger: this.player.hunger, thirst: this.player.thirst,
        houseOwned: this.player.houseOwned, ammo: this.player.ammo, weapon: this.player.weapon,
        missionIndex: this.missions.index, hour: this.world.hour, barberLevel: this.player.barberLevel, gymLevel: this.player.gymLevel,
        clothes: this.player.clothes
      };
      localStorage.setItem(this.saveKey, JSON.stringify(data));
      if (toast) { this.notify('Jogo salvo com sucesso!'); this.ui.toast('💾 Jogo salvo'); this.audio.cash(); }
    } catch {}
  }

  loadGame() {
    try {
      let raw = localStorage.getItem(this.saveKey);
      if (!raw) {
        const legacy = localStorage.getItem('gta5br_save');
        if (legacy) { localStorage.setItem(this.saveKey, legacy); raw = legacy; }
      }
      if (!raw) return;
      const d = JSON.parse(raw);
      if (typeof d.money === 'number') this.player.money = d.money;
      if (d.health) this.player.health = d.health;
      if (d.hunger) this.player.hunger = d.hunger;
      if (d.thirst) this.player.thirst = d.thirst;
      this.player.houseOwned = !!d.houseOwned;
      if (d.ammo) this.player.ammo = { ...this.player.ammo, ...d.ammo };
      if (d.weapon) this.player.setWeapon(d.weapon);
      if (typeof d.missionIndex === 'number') this.missions.index = d.missionIndex;
      if (d.hour) this.world.hour = d.hour;
      if (d.barberLevel) this.player.barberLevel = d.barberLevel;
      if (d.gymLevel) { this.player.gymLevel = d.gymLevel; this.player.maxHealth = 100 + d.gymLevel * 10; }
      this.ui?.updateHUD(true);
    } catch {}
  }

  updateCamera(dt) {
    const p = this.player;
    const inCar = p.inCar;
    const car = this.car;
    const lookInput = this.input.stickLook.x || this.input.stickLook.y || this.input.mouseDown;
    if (inCar && !lookInput) {
      let target = car.heading + Math.PI;
      let diff = target - this.camYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.camYaw += diff * Math.min(1, dt * 1.4);
    }
    const aiming = p.aiming && !inCar;
    const dist = aiming ? 3.4 : inCar ? 9.5 + Math.min(3, Math.abs(car.speed) * .035) : this.camDist;
    const targetY = inCar ? 1.45 : 1.3;
    const target = inCar ? car.position.clone().add(new THREE.Vector3(0, targetY, 0)) : p.position.clone().add(new THREE.Vector3(0, targetY, 0));
    const pitch = aiming ? .08 : this.camPitch;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const desired = new THREE.Vector3(
      target.x + Math.sin(this.camYaw) * dist * cp,
      target.y + 1.2 + sp * dist,
      target.z + Math.cos(this.camYaw) * dist * cp
    );
    if (aiming) {
      desired.x += Math.cos(this.camYaw) * .7;
      desired.z -= Math.sin(this.camYaw) * .7;
    }
    if (this.shake > 0) {
      desired.x += (Math.random() - .5) * this.shake;
      desired.y += (Math.random() - .5) * this.shake;
      this.shake *= Math.pow(.03, dt);
      if (this.shake < .005) this.shake = 0;
    }
    this.camera.position.lerp(desired, Math.min(1, dt * (inCar ? 7 : 9)));
    const look = target.clone().add(new THREE.Vector3(0, aiming ? .2 : .25, 0));
    this.camera.lookAt(look);
    this.camera.fov += ((aiming ? 50 : inCar ? 68 + Math.min(8, Math.abs(car.speed) * .1) : 62) - this.camera.fov) * Math.min(1, dt * 4);
    this.camera.updateProjectionMatrix();
    if (inCar) this.camera.position.y = Math.max(this.camera.position.y, 1.2);
  }

  update(dt) {
    const p = this.player;
    this.input.update(dt);
    const inp = this.input;
    p.shootCooldown = Math.max(0, p.shootCooldown - dt);
    this.hudTimer += dt;
    this.interactTimer += dt;
    this.autosaveTimer += dt;

    if (p.inCar) {
      p.position.set(this.car.position.x, 0, this.car.position.z);
      this.car.update(dt, {
        accelerate: inp.accelerate, brake: inp.brake, steer: inp.steer,
        handbrake: inp.handbrake, nitro: inp.nitro
      });
      if (inp.aim && !p.inCar) p.aiming = true;
    } else {
      p.aiming = inp.aim;
      p.update(dt, {
        moveX: inp.moveX, moveY: inp.moveY, moveMag: inp.moveMag, run: inp.run,
        jump: inp.jump, roll: inp.roll, sprintKey: inp.sprintKey, keyboard: true
      }, this.camYaw);
    }

    if (inp.fire && WEAPONS[p.weapon].auto && !p.inCar) this.attack();

    this.world.update(dt, p.position);
    this.missions.update(dt);
    this.police.update(dt);
    this.updateEffects(dt);
    this.updateCamera(dt);
    if (this.interactTimer > .18) { this.interactTimer = 0; this.updateInteraction(); }
    this.ui.updateHUD();
    if (this.autosaveTimer > 60) { this.autosaveTimer = 0; this.saveGame(); }

    inp.jump = false;
    inp.roll = false;
  }

  animate() {
    this._rafId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const minFrame = 1000 / (this.fpsCap || 60);
    if (now - this._lastFrameAt < minFrame - 0.4) { this._lastFrameAt = now; return; }
    this._lastFrameAt = now;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > .08) dt = .08;
    if (!this.active) return;
    const inst = 1 / Math.max(dt, 1 / 240);
    this.fpsEma = this.fpsEma * .85 + inst * .15;
    this.lowFpsAt += dt;
    if (this.fpsEma < 20 && this.lowFpsAt > 3) {
      this.lowFpsAt = 0;
      if (this.perfMode === 'auto' || this.perfMode === 'good') {
        const p = this.applyPerformance('weak');
        this.notify('📱 Celular fraco, mudando para MODO CELULAR FRACO');
        if (this.ui?.toast) this.ui.toast('📱 MODO CELULAR FRACO ativado automaticamente.');
      }
    } else { this.lowFpsAt = 0; }

    if (!this.paused && !this.dead) {
      this.update(dt);
    } else {
      this.updateCamera(dt * .2);
      this.ui.updateHUD();
    }
    this.renderer.render(this.scene, this.camera);
  }
}
