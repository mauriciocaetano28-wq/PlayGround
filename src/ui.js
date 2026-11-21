import { formatMoney, formatTime, clamp, makeCanvas } from './utils.js';

const DEFAULT_SETTINGS = {
  language: 'pt',
  qualityPreset: 'balanced',
  resolutionScale: 1,
  adaptiveResolution: true,
  shadows: true,
  drawDistance: 'high',
  waterQuality: 'high',
  motionBlur: true,
  fpsCounter: false,
  subtitles: true,
  hints: true,
  hudSize: 1,
  hudOpacity: 1,
  hudLayout: 'right',
  forceTouch: false,
  lookSensitivity: 1,
  invertY: false,
  haptics: true,
  music: .45,
  sfx: .72,
  muted: false
};

const L = {
  pt: {
    library: 'Biblioteca', store: 'Loja', gallery: 'Galeria', settings: 'Ajustes', system: 'Sistema',
    install: 'Baixar e instalar', installShort: 'Instalar', play: 'Jogar', installed: 'Instalado',
    continue: 'Continuar história', story: 'Modo história', rp: 'Roleplay', free: 'Mundo livre',
    missions: 'Missões', save: 'Salvar', controls: 'Controles', resume: 'Continuar jogo', quit: 'Sair para o menu',
    interact: 'INTERAGIR', talk: 'CONVERSAR', enter: 'ENTRAR', exit: 'SAIR', steal: 'DIRIGIR',
    wanted: 'PROCURADO', clean: 'Limpo', checkpoint: 'CHECKPOINT', objective: 'OBJETIVO',
    pause: 'JOGO PAUSADO', map: 'Mapa da cidade', back: 'Voltar ao jogo', saved: 'Salvo automaticamente',
    missionComplete: 'MISSÃO CONCLUÍDA', reward: 'RECOMPENSA', respawn: 'Voltar ao checkpoint',
    menu: 'Menu principal', missionsComplete: 'missões', hudSaved: 'Configurações salvas',
    jobAccepted: 'Trabalho aceito', jobDone: 'Trabalho concluído', noVehicle: 'Pegue um veículo',
    switchTo: 'Trocando personagem', language: 'Idioma', quality: 'Qualidade gráfica', resolution: 'Escala de resolução',
    shadows: 'Sombras', draw: 'Distância de visão', water: 'Qualidade da água', adaptive: 'Resolução adaptativa', fps: 'Mostrar FPS',
    subtitles: 'Legendas', hints: 'Dicas de controle', sensitivity: 'Sensibilidade', invert: 'Inverter eixo Y', haptics: 'Vibração',
    music: 'Música', sfx: 'Efeitos', muted: 'Mudo', hudSize: 'Tamanho do HUD', hudOpacity: 'Opacidade do HUD',
    hudLayout: 'Layout do HUD', forceTouch: 'Mostrar controles de toque', lefty: 'Canhoto', righty: 'Destro',
    low: 'Baixa', medium: 'Média', high: 'Alta', ultra: 'Ultra', performance: 'Desempenho', balanced: 'Equilibrado',
    today: 'Hoje', missionsCount: 'missões concluídas', rpSession: 'SESSÃO RP', freeSession: 'MUNDO LIVRE',
    cinema: 'MODO HISTÓRIA', time: 'TEMPO', progress: 'PROGRESSO', money: 'DINHEIRO', wantedLabel: 'PROCURADO',
    downloadDone: 'Instalação concluída', welcome: 'Bem-vindo a Costa Dourada',
    characters: 'PERSONAGENS', change: 'TROCAR', mapExpand: 'Mapa', phone: 'Celular', pauseBtn: 'Pausar'
  },
  en: {
    library: 'Library', store: 'Store', gallery: 'Gallery', settings: 'Settings', system: 'System',
    install: 'Download & install', installShort: 'Install', play: 'Play', installed: 'Installed',
    continue: 'Continue story', story: 'Story mode', rp: 'Roleplay', free: 'Free roam',
    missions: 'Missions', save: 'Save', controls: 'Controls', resume: 'Resume game', quit: 'Quit to menu',
    interact: 'INTERACT', talk: 'TALK', enter: 'ENTER', exit: 'EXIT', steal: 'DRIVE',
    wanted: 'WANTED', clean: 'Clean', checkpoint: 'CHECKPOINT', objective: 'OBJECTIVE',
    pause: 'GAME PAUSED', map: 'City map', back: 'Back to game', saved: 'Auto-saved',
    missionComplete: 'MISSION COMPLETE', reward: 'REWARD', respawn: 'Back to checkpoint',
    menu: 'Main menu', missionsComplete: 'missions', hudSaved: 'Settings saved',
    jobAccepted: 'Job accepted', jobDone: 'Job complete', noVehicle: 'Get a vehicle',
    switchTo: 'Switching character', language: 'Language', quality: 'Graphics quality', resolution: 'Resolution scale',
    shadows: 'Shadows', draw: 'View distance', water: 'Water quality', adaptive: 'Adaptive resolution', fps: 'Show FPS',
    subtitles: 'Subtitles', hints: 'Control hints', sensitivity: 'Sensitivity', invert: 'Invert Y axis', haptics: 'Haptics',
    music: 'Music', sfx: 'Effects', muted: 'Mute', hudSize: 'HUD size', hudOpacity: 'HUD opacity',
    hudLayout: 'HUD layout', forceTouch: 'Show touch controls', lefty: 'Left-handed', righty: 'Right-handed',
    low: 'Low', medium: 'Medium', high: 'High', ultra: 'Ultra', performance: 'Performance', balanced: 'Balanced',
    today: 'Today', missionsCount: 'missions completed', rpSession: 'RP SESSION', freeSession: 'FREE ROAM',
    cinema: 'STORY MODE', time: 'TIME', progress: 'PROGRESS', money: 'MONEY', wantedLabel: 'WANTED',
    downloadDone: 'Installation complete', welcome: 'Welcome to Costa Dourada',
    characters: 'CHARACTERS', change: 'SWITCH', mapExpand: 'Map', phone: 'Phone', pauseBtn: 'Pause'
  }
};

export class UI {
  constructor(game) {
    this.game = game;
    this.settings = this.loadSettings();
    this.language = this.settings.language;
    this.$ = (sel) => document.querySelector(sel);
    this.$$ = (sel) => [...document.querySelectorAll(sel)];
    this.dialogueQueue = [];
    this.dialogueDone = null;
    this.dialogueActive = false;
    this.currentTab = 'main';
    this.mapOpen = false;
    this.pauseOpen = false;
    this.phoneOpen = false;
    this.installTimer = null;
    this.lastHud = 0;
    this.fps = 60;
    this.currentJob = 'taxi';
    this.missionCardTimer = null;
    this.storyMode = 'story';
    this.applyCSS();
    this.bindStaticEvents();
    this.buildSettings();
    this.buildMissionList();
  }

  t(key) { return (L[this.language] || L.pt)[key] ?? key; }

  loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem('matteo5.settings.v1') || '{}');
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch { return { ...DEFAULT_SETTINGS }; }
  }

  saveSettings() {
    try { localStorage.setItem('matteo5.settings.v1', JSON.stringify(this.settings)); } catch {}
  }

  applyCSS() {
    const s = this.settings;
    document.body.style.setProperty('--hud-scale', s.hudSize);
    document.body.style.setProperty('--hud-opacity', s.hudOpacity);
    document.body.classList.toggle('force-touch', !!s.forceTouch);
    document.body.classList.toggle('touch', matchMedia('(pointer: coarse)').matches || ((navigator.maxTouchPoints || 0) > 0 && innerWidth < 1100));
    document.body.classList.toggle('lefty', s.hudLayout === 'left');
    const fps = document.querySelector('#fps-badge');
    if (fps) fps.style.display = s.fpsCounter ? 'block' : 'none';
  }

  updateSettings(patch, notify = true) {
    Object.assign(this.settings, patch);
    this.language = this.settings.language;
    this.saveSettings();
    this.applyCSS();
    this.buildSettings();
    this.buildMissionList();
    this.applyLanguage();
    if (this.game.applySettings) this.game.applySettings();
    if (notify) this.toast(this.t('hudSaved'), 'ok');
  }

  bindStaticEvents() {
    const $ = this.$;
    // Emulator
    $('#btn-game-menu').addEventListener('click', () => {
      if (!this.isInstalled) {
        this.installGame();
      } else {
        this.showGameMenu();
      }
    });
    $('#btn-install').addEventListener('click', () => this.installGame());
    $('#btn-continue').addEventListener('click', () => this.showGameMenu(true));
    $('#emu-settings').addEventListener('click', () => this.game.openSettings());
    $('#quick-settings').addEventListener('click', () => this.game.openSettings());
    $('#quick-map').addEventListener('click', () => this.game.openMapPreview());
    this.$$('.side-item').forEach(btn => btn.addEventListener('click', () => {
      if (btn.dataset.emuTab && btn.dataset.emuTab !== 'library') {
        this.toast(this.language === 'pt' ? 'Módulo indisponível na demo.' : 'Module unavailable in this demo.', 'warn');
      }
    }));
    // Game menu
    $('#menu-settings').addEventListener('click', () => this.game.openSettings());
    $('#menu-lang').addEventListener('click', () => this.updateSettings({ language: this.language === 'pt' ? 'en' : 'pt' }));
    $('#menu-back-emu').addEventListener('click', () => this.showDashboard());
    this.$$('.menu-item').forEach(btn => btn.addEventListener('click', () => {
      const action = btn.dataset.start;
      this.game.startFromMenu(action);
    }));
    // HUD
    $('#minimap-expand').addEventListener('click', () => this.openMap());
    $('#map-close').addEventListener('click', () => this.closeMap());
    $('#map-close-2').addEventListener('click', () => this.closeMap());
    $('#mobile-map').addEventListener('click', () => this.openMap());
    $('#mobile-phone').addEventListener('click', () => this.openPhone());
    $('#mobile-pause').addEventListener('click', () => this.openPause());
    $('#pause-button').addEventListener('click', () => this.openPause());
    $('#pause-close').addEventListener('click', () => this.closePause());
    $('#resume-btn').addEventListener('click', () => this.closePause());
    $('#save-btn').addEventListener('click', () => { this.game.save(); this.$('#last-save').textContent = this.language === 'pt' ? 'agora mesmo' : 'just now'; this.toast(this.language === 'pt' ? 'Jogo salvo.' : 'Game saved.', 'ok'); });
    $('#quit-to-menu').addEventListener('click', () => this.game.quitToMenu());
    $('#respawn-btn').addEventListener('click', () => this.game.respawn());
    $('#wasted-menu').addEventListener('click', () => this.game.quitToMenu());
    $('#complete-continue').addEventListener('click', () => this.game.onMissionCompleteContinue());
    $('#phone-close').addEventListener('click', () => this.closePhone());
    $('#phone-start').addEventListener('click', () => this.acceptJob());
    $('#radio-btn').addEventListener('click', () => this.game.toggleRadio());
    $('#radio-next').addEventListener('click', () => this.game.nextRadio());
    $('#reload-btn').addEventListener('click', () => this.game.reload());
    $('#switch-character').addEventListener('click', () => this.game.switchCharacter());
    $('#dialogue').addEventListener('click', () => this.advanceDialogue());
    this.$$('.pause-tabs button').forEach(btn => btn.addEventListener('click', () => {
      this.currentTab = btn.dataset.pauseTab;
      this.$$('.pause-tabs button').forEach(b => b.classList.toggle('active', b === btn));
      this.$$('.pause-panel').forEach(p => p.classList.toggle('active', p.dataset.pausePanel === this.currentTab));
    }));
    this.$$('.app-card').forEach(btn => btn.addEventListener('click', () => {
      this.$$('.app-card').forEach(b => b.classList.toggle('active', b === btn));
      this.currentJob = btn.dataset.job;
      const info = this.jobInfo(this.currentJob);
      this.$('#phone-job-title').textContent = info.title;
      this.$('#phone-job-desc').textContent = info.desc;
    }));
    // Map zoom
    let zoom = 1;
    $('#map-zoom-in').addEventListener('click', () => { zoom = clamp(zoom + .18, 1, 2.2); this.mapZoom = zoom; this.drawBigMap(); });
    $('#map-zoom-out').addEventListener('click', () => { zoom = clamp(zoom - .18, 1, 2.2); this.mapZoom = zoom; this.drawBigMap(); });
    window.addEventListener('resize', () => { this.drawMinimap(); if (this.mapOpen) this.drawBigMap(); });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.dialogueActive) { this.advanceDialogue(); return; }
        if (this.phoneOpen) { this.closePhone(); return; }
        if (this.mapOpen) { this.closeMap(); return; }
        if (this.pauseOpen) { this.closePause(); return; }
        if (this.game.state === 'playing') this.openPause();
      }
    });
    document.addEventListener('click', (e) => {
      if (e.target.closest('button')) this.game.audio?.click();
    }, true);
  }

  // ---------------- SYSTEM ----------------
  bootProgress(progress, text) {
    this.$('#boot-bar').style.width = `${clamp(progress, 0, 100)}%`;
    if (text) this.$('#boot-status').textContent = text;
  }

  bootDone() {
    this.isInstalled = localStorage.getItem('matteo5.installed.v1') === '1';
    setTimeout(() => {
      this.$('#boot-screen').classList.remove('visible');
      this.showDashboard();
    }, 500);
  }

  showDashboard() {
    this.hideAllScreens();
    this.$('#emulator').classList.add('visible');
    this.isInstalled = localStorage.getItem('matteo5.installed.v1') === '1';
    this.refreshInstallUI();
    this.updateDashboard();
    this.game.state = 'menu';
    this.game.cinematic = true;
  }

  hideAllScreens() {
    ['#boot-screen', '#emulator', '#game-menu', '#loading-screen'].forEach(s => this.$(s)?.classList.remove('visible'));
    this.$('#hud')?.classList.add('hidden');
  }

  refreshInstallUI() {
    const installed = this.isInstalled;
    const installBtn = this.$('#btn-install');
    const playBtn = this.$('#btn-game-menu');
    if (installed) {
      installBtn.querySelector('.btn-label').textContent = this.language === 'pt' ? 'Instalado' : 'Installed';
      installBtn.querySelector('.btn-icon').textContent = '✓';
      installBtn.querySelector('small').textContent = this.language === 'pt' ? 'pronto para jogar' : 'ready to play';
      installBtn.classList.add('installed');
      playBtn.style.display = 'inline-flex';
      this.$('#install-progress').hidden = true;
      this.$('#hero-installed-bar').style.width = '100%';
    } else {
      installBtn.querySelector('.btn-label').textContent = this.t('install');
      installBtn.querySelector('.btn-icon').textContent = '↓';
      installBtn.querySelector('small').textContent = '6,8 GB · grátis';
      installBtn.classList.remove('installed');
      playBtn.style.display = 'none';
      this.$('#hero-installed-bar').style.width = '0%';
    }
  }

  installGame() {
    if (this.installTimer) return;
    const progress = this.$('#install-progress');
    progress.hidden = false;
    this.$('#btn-install').disabled = true;
    const fill = this.$('#install-fill');
    const pct = this.$('#install-pct');
    const label = this.$('#install-label');
    const speed = this.$('#install-speed');
    const labels = this.language === 'pt'
      ? ['Verificando integridade…', 'Baixando Costa Dourada…', 'Instalando texturas…', 'Compilando shaders…', 'Finalizando…']
      : ['Verifying package…', 'Downloading Costa Dourada…', 'Installing textures…', 'Compiling shaders…', 'Finishing…'];
    let p = 0;
    this.installTimer = setInterval(() => {
      p += 4 + Math.random() * 9;
      if (p > 100) p = 100;
      fill.style.width = `${p}%`; pct.textContent = `${Math.floor(p)}%`;
      label.textContent = labels[Math.min(labels.length - 1, Math.floor(p / 21))];
      speed.textContent = p < 100 ? `${(8.4 + Math.random() * 5).toFixed(1)} MB/s` : '100%';
      if (p >= 100) {
        clearInterval(this.installTimer); this.installTimer = null;
        localStorage.setItem('matteo5.installed.v1', '1');
        this.isInstalled = true;
        this.$('#btn-install').disabled = false;
        this.refreshInstallUI();
        this.toast(this.t('downloadDone'), 'ok');
        setTimeout(() => this.showGameMenu(true), 500);
      }
    }, 170);
  }

  updateDashboard() {
    const save = this.game.loadSave();
    const completed = save?.completedMissions?.length || 0;
    this.$('#story-progress-bar').style.width = `${(completed / 5) * 100}%`;
    this.$('#continue-progress').textContent = this.language === 'pt' ? `${completed} de 5 missões` : `${completed} of 5 missions`;
    this.$('#menu-progress').textContent = `${completed} / 5`;
    this.$('#menu-money').textContent = formatMoney(save?.money ?? 2500);
    if (save && completed > 0) {
      const m = this.game.missions[Math.min(completed, 4)];
      this.$('#continue-title').textContent = this.language === 'pt' ? `Capítulo ${completed + 1} · ${m.title.pt}` : `Chapter ${completed + 1} · ${m.title.en}`;
      this.$('#menu-continue-label').textContent = this.language === 'pt' ? 'Continuar história' : 'Continue story';
      this.$('#menu-continue-sub').textContent = this.language === 'pt' ? `Capítulo ${completed + 1} · ${m.title.pt}` : `Chapter ${completed + 1} · ${m.title.en}`;
    }
    if (save?.rp) {
      this.$('#phone-rep').textContent = `REP ${save.rp.rep || 12}`;
      this.$('#phone-money').textContent = formatMoney(save.rp.money ?? save.money ?? 2500);
    }
  }

  showGameMenu(continueOnly = false) {
    this.hideAllScreens();
    this.$('#game-menu').classList.add('visible');
    this.game.state = 'menu';
    this.game.cinematic = true;
    this.updateDashboard();
    this.applyLanguage();
    if (continueOnly && !this.game.loadSave()) this.toast(this.language === 'pt' ? 'Nenhum save encontrado. Comece uma nova história.' : 'No save found. Start a new story.', 'warn');
  }

  showLoading(title, subtitle, hint) {
    this.hideAllScreens();
    this.$('#loading-screen').classList.add('visible');
    this.$('#loading-title').textContent = title || 'COSTA DOURADA';
    this.$('#loading-subtitle').textContent = subtitle || (this.language === 'pt' ? 'Onde o mar encontra a ambição.' : 'Where the sea meets ambition.');
    this.$('#loading-hint').textContent = hint || (this.language === 'pt' ? 'Dica: use F para entrar no carro mais próximo.' : 'Tip: press F to enter the nearest car.');
    this.$('#loading-bar').style.width = '0%';
    let p = 0;
    this.loadingTimer = setInterval(() => {
      p += 7 + Math.random() * 10;
      this.$('#loading-bar').style.width = `${Math.min(100, p)}%`;
      if (p > 100) clearInterval(this.loadingTimer);
    }, 80);
  }

  startHUD() {
    clearInterval(this.loadingTimer);
    this.hideAllScreens();
    this.$('#hud').classList.remove('hidden');
    this.$('#loading-screen').classList.remove('visible');
    this.$('#mission-card').classList.remove('on');
    this.$('#mission-complete').classList.remove('on');
    this.$('#wasted-screen').classList.remove('on');
    this.game.state = 'playing';
    this.game.cinematic = false;
    this.applyLanguage();
    this.setStoryMode(this.game.playMode);
  }

  setStoryMode(mode) {
    this.storyMode = mode;
    const map = {
      story: this.language === 'pt' ? 'MODO HISTÓRIA' : 'STORY MODE',
      rp: 'COSTA RP',
      free: this.language === 'pt' ? 'MUNDO LIVRE' : 'FREE ROAM'
    };
    const label = this.$('#objective-mode');
    if (label) label.textContent = map[mode] || map.story;
    this.$('#pause-mode-label').textContent = map[mode] || map.story;
    const chips = this.$('#activity-chips');
    if (chips) {
      chips.innerHTML = mode === 'rp'
        ? `<span><i></i> COSTA RP</span><span>REP ${this.game.rp?.rep || 12}</span>`
        : mode === 'free'
          ? `<span><i></i> ${this.language === 'pt' ? 'SEM LIMITES' : 'NO LIMITS'}</span><span>60 FPS</span>`
          : `<span><i></i> ${this.language === 'pt' ? 'HISTÓRIA' : 'STORY'}</span><span id="activity-mission">01 / 05</span>`;
    }
  }

  applyLanguage() {
    const pt = this.language === 'pt';
    document.documentElement.lang = pt ? 'pt-BR' : 'en';
    // Menu actions
    const menu = this.$$('.menu-item');
    const labels = [
      [this.t('continue'), pt ? 'Capítulo atual · modo história' : 'Current chapter · story mode'],
      [this.t('story'), pt ? '5 missões · Luiza & Carlos' : '5 missions · Luiza & Carlos'],
      [this.t('rp'), pt ? 'Costa RP · trabalhos e reputação' : 'Costa RP · jobs and reputation'],
      [this.t('free'), pt ? 'Explore sem limites' : 'Explore without limits']
    ];
    menu.forEach((m, i) => {
      if (!labels[i]) return;
      m.querySelector('b').textContent = labels[i][0];
      m.querySelector('small').textContent = labels[i][1];
    });
    this.$('#btn-game-menu').querySelector('.btn-label').textContent = this.t('play');
    this.$('#resume-btn').innerHTML = `${this.t('resume')} <span>▶</span>`;
    this.$('#pause-close')?.setAttribute('aria-label', pt ? 'Fechar' : 'Close');
    this.$('#map-close-2').textContent = this.t('back');
    this.$('#menu-lang').innerHTML = pt ? 'PT <span>/ EN</span>' : 'EN <span>/ PT</span>';
    this.$('#respawn-btn').textContent = this.t('respawn');
    this.$('#wasted-menu').textContent = this.t('menu');
    const pauseTabs = ['main', 'missions', 'settings', 'controls', 'save'];
    const tabLabels = pt ? ['Continuar', 'Missões', 'Configurações', 'Controles', 'Salvar'] : ['Resume', 'Missions', 'Settings', 'Controls', 'Save'];
    this.$$('.pause-tabs button').forEach((b, i) => b.textContent = tabLabels[i] || pauseTabs[i]);
    this.$('#complete-continue').innerHTML = pt ? 'Continuar <span>→</span>' : 'Continue <span>→</span>';
    this.refreshInstallUI();
    this.buildMissionList();
    this.buildSettings();
    this.drawMinimap();
  }

  toast(text, type = '') {
    const layer = this.$('#toast-layer');
    const el = document.createElement('div');
    el.className = `system-toast ${type}`;
    el.textContent = text;
    layer.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, 2600);
  }

  notify(icon, text) {
    const box = this.$('#notifications');
    const el = document.createElement('div');
    el.className = 'notification';
    el.innerHTML = `<i>${icon}</i><span>${text}</span>`;
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, 3200);
    while (box.children.length > 4) box.firstChild.remove();
  }

  hudToast(text) {
    const el = this.$('#hud-toast');
    el.textContent = text;
    el.classList.remove('on');
    void el.offsetWidth;
    el.classList.add('on');
    setTimeout(() => el.classList.remove('on'), 2500);
  }

  // ---------------- HUD ----------------
  updateHUD(game) {
    const p = game.player;
    this.setMoney(game.money, false);
    const health = clamp(p.health, 0, 100);
    this.$('#health-fill').style.width = `${health}%`;
    this.$('#health-value').textContent = Math.round(health);
    this.$('#health-fill').parentElement.classList.toggle('low', health < 30);
    this.$('#low-health').classList.toggle('on', health < 28 && health > 0);
    this.$('#armor-fill').style.width = `${clamp(p.armor, 0, 100)}%`;
    this.$('#stamina-fill').style.width = `${clamp(p.stamina, 0, 100)}%`;
    const char = game.activeChar;
    this.$('#player-name').textContent = char.name.toUpperCase();
    this.$('#player-avatar').textContent = char.name[0];
    this.$('#player-avatar').classList.toggle('carlos', char.name === 'Carlos');
    this.$('#player-tag').textContent = char.name === 'Luiza' ? 'ESTRADA' : 'MOTOR';
    this.$('#switch-name').textContent = (char.name === 'Luiza' ? 'CARLOS' : 'LUIZA');
    this.$('#switch-avatar').textContent = (char.name === 'Luiza' ? 'C' : 'L');
    this.$('#switch-avatar').style.background = char.name === 'Luiza' ? 'linear-gradient(135deg,#234f48,#0c1d21)' : 'linear-gradient(135deg,#5a2d35,#1e1820)';
    this.$('#switch-avatar').style.color = char.name === 'Luiza' ? '#baffef' : '#ffd0c2';
    this.$('#ammo').textContent = p.mag;
    this.$('#weapon-name').textContent = p.weapon === 'pistol' ? 'PISTOLA' : 'SUBMETRALHADORA';
    this.$('#weapon-card').querySelector('small').textContent = `/ ${p.reserve}`;
    this.$('#weapon-icon').textContent = p.weapon === 'pistol' ? '◐' : '▬';
    this.$('#radio-station').textContent = game.audio.stations[game.audio.radioStation];
    this.updateWanted(game.wanted, game.wantedLabel);
    this.$('#money-delta').style.opacity = game.moneyDelta > 0 ? '1' : '0';
    this.$('#money-delta').textContent = game.moneyDelta > 0 ? `+${game.moneyDelta}` : '';
    this.$('#clock-time').textContent = game.clockString();
    this.$('#minimap-time').textContent = game.clockString();
    this.$('#clock-day').textContent = game.dayString();
    this.$('#fps-badge').textContent = `${Math.round(this.fps)} FPS`;
    const d = game.world.districtAt(p.position.x, p.position.z);
    this.$('#district-name').textContent = this.language === 'pt' ? d.namePt : d.nameEn;
    this.$('#minimap-district').textContent = (this.language === 'pt' ? d.namePt : d.nameEn).toUpperCase();
    this.$('#map-district').textContent = this.language === 'pt' ? d.namePt : d.nameEn;
    this.$('#map-district-desc').textContent = this.language === 'pt' ? d.descPt : d.descEn;
    this.$('#weapon-card').style.display = game.inVehicle ? 'none' : 'flex';
    this.$('#stamina-row') && (this.$('#stamina-row').style.opacity = game.inVehicle ? '.4' : '1');
    if (game.missionManager?.active && game.missionManager.currentStep) {
      const step = game.missionManager.currentStep;
      const dist = Math.round(game.missionManager.distanceToTarget());
      this.$('#objective-distance').textContent = `${dist} m`;
      this.$('#objective-extra').textContent = step.checkpoint === false ? '' : this.t('checkpoint');
    }
  }

  setMoney(amount, animate = true) {
    this.$('#money').textContent = formatMoney(amount);
    this.$('#menu-money').textContent = formatMoney(amount);
    this.$('#pause-money').textContent = formatMoney(amount);
    this.$('#phone-money').textContent = formatMoney(amount);
  }

  updateWanted(level, label) {
    const stars = this.$('#wanted-stars');
    let html = '';
    for (let i = 0; i < 6; i++) html += `<span class="star-icon ${i < level ? 'on' : ''} ${level === 6 ? 'active-six' : ''}">${level === 6 && i < level ? '✦' : '★'}</span>`;
    stars.innerHTML = html;
    this.$('#wanted-shell').classList.toggle('hot', level >= 3);
    this.$('#wanted-label').textContent = level > 0 ? (label || this.t('wanted')) : this.t('clean');
    this.$('#pause-wanted').textContent = level > 0 ? label : this.t('clean');
    this.$('#wanted-shell').style.opacity = level > 0 ? '1' : '.55';
  }

  setSearchProgress(progress) {
    const el = this.$('#search-progress');
    el.classList.toggle('on', progress > 0);
    el.querySelector('i').style.width = `${clamp(progress, 0, 100)}%`;
  }

  updateObjective(mission, step, distance) {
    if (!mission || !step) { this.$('#objective-panel').style.display = 'none'; return; }
    this.$('#objective-panel').style.display = 'block';
    this.$('#objective-mode').textContent = this.storyMode === 'story' ? (this.language === 'pt' ? `MISSÃO 0${mission.index + 1}` : `MISSION 0${mission.index + 1}`) : (this.storyMode === 'rp' ? 'COSTA RP' : (this.language === 'pt' ? 'MUNDO LIVRE' : 'FREE ROAM'));
    this.$('#objective-title').textContent = this.language === 'pt' ? mission.title.pt : mission.title.en;
    this.$('#objective-text').textContent = this.language === 'pt' ? step.textPt : step.textEn;
    this.$('#objective-distance').textContent = distance >= 0 ? `${Math.round(distance)} m` : '';
    this.$('#objective-extra').textContent = step.checkpoint === false ? '' : this.t('checkpoint');
    const prog = this.$('#objective-progress');
    if (step.progress !== undefined) {
      prog.classList.add('on');
      prog.querySelector('i').style.width = `${clamp(step.progress, 0, 100)}%`;
    } else prog.classList.remove('on');
  }

  setObjectiveProgress(pct) {
    const prog = this.$('#objective-progress');
    prog.classList.add('on');
    prog.querySelector('i').style.width = `${clamp(pct, 0, 100)}%`;
  }

  hideObjective() { this.$('#objective-panel').style.display = 'none'; }

  showPrompt(title, sub) {
    const el = this.$('#interaction-prompt');
    this.$('#interact-title').textContent = title;
    this.$('#interact-sub').textContent = sub || '';
    el.classList.add('on');
  }
  hidePrompt() { this.$('#interaction-prompt').classList.remove('on'); }

  // ---------------- DIALOGUE ----------------
  speak(lines, onDone) {
    if (!lines?.length) { onDone?.(); return; }
    this.dialogueQueue = lines.slice();
    this.dialogueDone = onDone;
    this.dialogueActive = true;
    this.showNextDialogue();
  }

  showNextDialogue() {
    if (!this.dialogueQueue.length) {
      this.dialogueActive = false;
      this.$('#dialogue').classList.remove('on');
      const cb = this.dialogueDone; this.dialogueDone = null;
      cb?.();
      return;
    }
    const line = this.dialogueQueue[0];
    const d = this.$('#dialogue');
    d.classList.add('on');
    this.$('#dialogue-name').textContent = line.name;
    this.$('#dialogue-portrait').textContent = line.name.charAt(0);
    this.$('#dialogue-portrait').classList.toggle('carlos', line.portrait === 'carlos');
    this.$('#dialogue-text').textContent = this.language === 'pt' ? line.pt : line.en;
    this.$('#dialogue-lang').textContent = this.language === 'pt' ? 'PT-BR' : 'EN-US';
    this.$('#dialogue-hint').innerHTML = `<kbd>E</kbd> ${this.language === 'pt' ? 'continuar' : 'continue'} <i>${this.dialogueQueue.length}</i>`;
  }

  advanceDialogue() {
    if (!this.dialogueActive || !this.dialogueQueue.length) return;
    this.dialogueQueue.shift();
    this.showNextDialogue();
  }

  // ---------------- MISSION UI ----------------
  showMissionCard(mission, protagonist) {
    return new Promise(resolve => {
      const pt = this.language === 'pt';
      const card = this.$('#mission-card');
      this.$('#mission-card-num').textContent = `0${mission.index + 1}`;
      this.$('#mission-card-kicker').textContent = `${pt ? 'MODO HISTÓRIA' : 'STORY MODE'} · ${protagonist.toUpperCase()}`;
      this.$('#mission-card-title').textContent = pt ? mission.title.pt.toUpperCase() : mission.title.en.toUpperCase();
      this.$('#mission-card-desc').textContent = pt ? mission.descPt : mission.descEn;
      card.classList.remove('on');
      void card.offsetWidth;
      card.classList.add('on');
      document.body.classList.add('cinematic');
      this.game.audio?.mission();
      setTimeout(() => { resolve(); }, 3200);
      setTimeout(() => {
        card.classList.remove('on');
        document.body.classList.remove('cinematic');
      }, 4700);
    });
  }

  showMissionComplete(data, callback) {
    const pt = this.language === 'pt';
    this.$('#complete-title').textContent = pt ? data.title.pt.toUpperCase() : data.title.en.toUpperCase();
    this.$('#complete-reward').textContent = formatMoney(data.reward);
    this.$('#complete-stats').innerHTML = `
      <div><span>${pt ? 'TEMPO' : 'TIME'}</span><b>${formatTime(data.time)}</b></div>
      <div><span>${pt ? 'ESTRELAS' : 'STARS'}</span><b>${data.stars}</b></div>
      <div><span>${pt ? 'PROCURADO' : 'WANTED'}</span><b>${data.wanted}</b></div>`;
    this.$('#mission-complete').classList.add('on');
    this.game.audio?.complete();
    this.completeCallback = callback;
  }

  hideMissionComplete() { this.$('#mission-complete').classList.remove('on'); }

  showWasted(subtitle) {
    this.$('#wasted-sub').textContent = subtitle || (this.language === 'pt' ? 'A maré devolve tudo. Menos o orgulho.' : 'The tide gives everything back. Except pride.');
    this.$('#wasted-screen').classList.add('on');
    this.game.audio?.error();
  }
  hideWasted() { this.$('#wasted-screen').classList.remove('on'); }

  buildMissionList() {
    const list = this.$('#mission-list');
    if (!list || !this.game.missions) return;
    const save = this.game.loadSave();
    const completed = save?.completedMissions || [];
    list.innerHTML = this.game.missions.map((m, i) => {
      const done = completed.includes(m.index);
      const active = this.game.missionManager?.missionIndex === i && this.game.missionManager?.active;
      const locked = i > completed.length;
      return `<div class="mission-row ${done ? 'completed' : ''} ${active ? 'active' : ''} ${locked ? 'locked' : ''}">
        <div class="mission-num">${done ? '✓' : `0${i + 1}`}</div>
        <div><h4>${this.language === 'pt' ? m.title.pt : m.title.en}</h4><p>${this.language === 'pt' ? m.descPt : m.descEn}</p></div>
        <span class="m-protag">${m.protag.toUpperCase()}</span>
        <button data-mission="${i}" ${locked ? 'disabled' : ''}>${done ? (this.language === 'pt' ? 'REJOGAR' : 'REPLAY') : (this.language === 'pt' ? 'INICIAR' : 'START')}</button>
      </div>`;
    }).join('');
    list.querySelectorAll('button[data-mission]').forEach(btn => btn.addEventListener('click', () => {
      this.game.startMission(Number(btn.dataset.mission), { fromMenu: true });
      this.closePause();
    }));
    const count = completed.length;
    this.$('#mission-count-badge').textContent = `${Math.min(count + 1, 5)} / 5`;
    this.$('#pause-progress').textContent = `${count}/5`;
  }

  // ---------------- SETTINGS ----------------
  buildSettings() {
    const box = this.$('#settings-container');
    if (!box) return;
    const s = this.settings;
    const pt = this.language === 'pt';
    const seg = (key, options, value) => `<div class="seg">${options.map(([v, label]) => `<button class="${value === v ? 'active' : ''}" data-set="${key}" data-val="${v}">${label}</button>`).join('')}</div>`;
    const toggle = (key, val) => `<button class="toggle ${val ? 'on' : ''}" data-toggle="${key}" aria-label="${key}"></button>`;
    const qualityOptions = [[ 'performance', pt ? 'Desempenho' : 'Performance'], ['balanced', pt ? 'Equilibrado' : 'Balanced'], ['ultra', 'Ultra']];
    const distOptions = [['low', pt ? 'Baixa' : 'Low'], ['medium', pt ? 'Média' : 'Medium'], ['high', pt ? 'Alta' : 'High']];
    box.innerHTML = `
      <div class="settings-section">
        <div class="settings-section-head"><h4>${pt ? 'SISTEMA · MATTEO 5' : 'SYSTEM · MATTEO 5'}</h4><span>${this.t('saved')}</span></div>
        <div class="settings-grid">
          <div class="setting-row"><div class="setting-label"><b>${this.t('language')}</b><small>PT-BR / English</small></div><div class="setting-control">${seg('language', [['pt','PT'],['en','EN']], s.language)}</div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('quality')}</b><small>60 FPS target</small></div><div class="setting-control">${seg('qualityPreset', qualityOptions, s.qualityPreset)}</div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('resolution')}</b><small>${Math.round(s.resolutionScale * 100)}%</small></div><div class="setting-control"><input type="range" min="55" max="100" step="5" value="${s.resolutionScale * 100}" data-range="resolutionScale"><span class="range-val">${Math.round(s.resolutionScale * 100)}%</span></div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('adaptive')}</b><small>${pt ? 'Protege os 60 FPS' : 'Protects 60 FPS'}</small></div><div class="setting-control">${toggle('adaptiveResolution', s.adaptiveResolution)}</div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('shadows')}</b><small>${pt ? 'Sombras dinâmicas' : 'Dynamic shadows'}</small></div><div class="setting-control">${toggle('shadows', s.shadows)}</div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('draw')}</b><small>${pt ? 'Névoa e detalhes' : 'Fog & details'}</small></div><div class="setting-control">${seg('drawDistance', distOptions, s.drawDistance)}</div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('water')}</b><small>${pt ? 'Ondas e brilho' : 'Waves & glint'}</small></div><div class="setting-control">${seg('waterQuality', [['medium',pt?'Média':'Medium'],['high','Alta/High']], s.waterQuality === 'high' ? 'high' : 'medium')}</div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('fps')}</b><small>${pt ? 'Contador no HUD' : 'HUD counter'}</small></div><div class="setting-control">${toggle('fpsCounter', s.fpsCounter)}</div></div>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-head"><h4>${pt ? 'HUD MOBILE · CONTROLES' : 'MOBILE HUD · CONTROLS'}</h4><span>PS5 STYLE</span></div>
        <div class="settings-grid">
          <div class="setting-row"><div class="setting-label"><b>${this.t('hudSize')}</b><small>${Math.round(s.hudSize * 100)}%</small></div><div class="setting-control"><input type="range" min="80" max="125" step="5" value="${s.hudSize * 100}" data-range="hudSize"><span class="range-val">${Math.round(s.hudSize * 100)}%</span></div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('hudOpacity')}</b><small>${Math.round(s.hudOpacity * 100)}%</small></div><div class="setting-control"><input type="range" min="35" max="100" step="5" value="${s.hudOpacity * 100}" data-range="hudOpacity"><span class="range-val">${Math.round(s.hudOpacity * 100)}%</span></div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('hudLayout')}</b><small>${pt ? 'Mão dominante' : 'Dominant hand'}</small></div><div class="setting-control">${seg('hudLayout', [['right', pt?'Destro':'Right'],['left', pt?'Canhoto':'Left']], s.hudLayout)}</div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('forceTouch')}</b><small>${pt ? 'Útil em tablets' : 'Useful on tablets'}</small></div><div class="setting-control">${toggle('forceTouch', s.forceTouch)}</div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('sensitivity')}</b><small>${s.lookSensitivity.toFixed(1)}x</small></div><div class="setting-control"><input type="range" min="50" max="180" step="5" value="${s.lookSensitivity * 100}" data-range="lookSensitivity"><span class="range-val">${s.lookSensitivity.toFixed(1)}x</span></div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('invert')}</b><small>${pt ? 'Câmera vertical' : 'Vertical camera'}</small></div><div class="setting-control">${toggle('invertY', s.invertY)}</div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('haptics')}</b><small>${pt ? 'Vibração do dispositivo' : 'Device vibration'}</small></div><div class="setting-control">${toggle('haptics', s.haptics)}</div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('subtitles')}</b><small>${pt ? 'Diálogos e dicas' : 'Dialogue and tips'}</small></div><div class="setting-control">${toggle('subtitles', s.subtitles)}</div></div>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-head"><h4>${pt ? 'ÁUDIO · RÁDIO COSTA' : 'AUDIO · COSTA RADIO'}</h4><span>${pt ? 'ORIGINAL' : 'ORIGINAL'}</span></div>
        <div class="settings-grid">
          <div class="setting-row"><div class="setting-label"><b>${this.t('music')}</b><small>${Math.round(s.music * 100)}%</small></div><div class="setting-control"><input type="range" min="0" max="100" step="5" value="${s.music * 100}" data-range="music"><span class="range-val">${Math.round(s.music * 100)}%</span></div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('sfx')}</b><small>${Math.round(s.sfx * 100)}%</small></div><div class="setting-control"><input type="range" min="0" max="100" step="5" value="${s.sfx * 100}" data-range="sfx"><span class="range-val">${Math.round(s.sfx * 100)}%</span></div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('muted')}</b><small>${pt ? 'Silenciar tudo' : 'Mute all'}</small></div><div class="setting-control">${toggle('muted', s.muted)}</div></div>
          <div class="setting-row"><div class="setting-label"><b>${this.t('hints')}</b><small>${pt ? 'Atalhos na tela' : 'On-screen shortcuts'}</small></div><div class="setting-control">${toggle('hints', s.hints)}</div></div>
        </div>
        <div class="settings-note"><b>MATTEO 5</b> · ${pt ? 'As alterações são aplicadas em tempo real e salvas neste navegador.' : 'Changes apply in real time and are saved in this browser.'}</div>
      </div>`;
    box.querySelectorAll('[data-set]').forEach(btn => btn.addEventListener('click', () => {
      const key = btn.dataset.set; let val = btn.dataset.val;
      if (['resolutionScale','hudSize','hudOpacity','lookSensitivity','music','sfx'].includes(key)) val = Number(val);
      this.updateSettings({ [key]: val });
    }));
    box.querySelectorAll('[data-toggle]').forEach(btn => btn.addEventListener('click', () => {
      this.updateSettings({ [btn.dataset.toggle]: !this.settings[btn.dataset.toggle] });
    }));
    box.querySelectorAll('[data-range]').forEach(input => {
      input.addEventListener('input', () => {
        const key = input.dataset.range;
        let val = Number(input.value);
        if (['hudSize', 'hudOpacity', 'lookSensitivity', 'music', 'sfx'].includes(key)) val /= 100;
        if (key === 'resolutionScale') val /= 100;
        this.settings[key] = val;
        const label = input.parentElement.querySelector('.range-val');
        if (label) label.textContent = key === 'resolutionScale' || key === 'hudSize' || key === 'hudOpacity' ? `${Math.round(val * 100)}%` : key === 'lookSensitivity' ? `${val.toFixed(1)}x` : `${Math.round(val * 100)}%`;
        this.applyCSS();
        if (this.game.applySettings) this.game.applySettings(true);
        this.saveSettings();
      });
      input.addEventListener('change', () => { this.updateSettings({}, false); });
    });
    this.renderControls();
  }

  renderControls() {
    const box = this.$('#controls-grid');
    if (!box) return;
    const pt = this.language === 'pt';
    const rows = [
      ['WASD', pt ? 'Mover a pé / dirigir' : 'Move / drive'],
      ['SHIFT', pt ? 'Correr' : 'Sprint'],
      ['ESPAÇO', pt ? 'Saltar / freio de mão' : 'Jump / handbrake'],
      ['F', pt ? 'Entrar / sair do veículo' : 'Enter / exit vehicle'],
      ['E', pt ? 'Interagir / conversar' : 'Interact / talk'],
      ['CLIQUE', pt ? 'Atirar' : 'Shoot'],
      ['BOTÃO DIREITO', pt ? 'Mirar' : 'Aim'],
      ['R', pt ? 'Recarregar' : 'Reload'],
      ['Q', pt ? 'Trocar arma' : 'Switch weapon'],
      ['P', pt ? 'Trocar personagem' : 'Switch character'],
      ['M', pt ? 'Mapa' : 'Map'],
      ['J', pt ? 'Celular / trabalhos' : 'Phone / jobs'],
      ['ESC', pt ? 'Pausar' : 'Pause'],
      ['TOQUE', pt ? 'Joystick + botões PS5' : 'Joystick + PS5 buttons']
    ];
    box.innerHTML = rows.map(([key, label]) => `<div class="control-row"><b>${label}</b><span class="keys"><kbd>${key}</kbd></span></div>`).join('');
  }

  // ---------------- PAUSE / MAP / PHONE ----------------
  openPause() {
    if (this.game.state !== 'playing') return;
    this.pauseOpen = true;
    this.game.state = 'paused';
    this.$('#pause-menu').classList.add('on');
    this.$('#pause-session').textContent = `${this.storyMode === 'story' ? (this.language === 'pt' ? 'Sessão história' : 'Story session') : this.storyMode === 'rp' ? 'Costa RP' : (this.language === 'pt' ? 'Mundo livre' : 'Free roam')} · ${formatTime(this.game.sessionTime)}`;
    this.$('#pause-time').textContent = formatTime(this.game.sessionTime);
    this.$('#last-save').textContent = this.language === 'pt' ? 'agora' : 'now';
    this.$('#pause-clock').textContent = this.game.clockString();
    this.buildMissionList();
    if (this.game.inVehicle) {
      this.$('#pause-wanted').textContent = this.game.wanted > 0 ? this.game.wantedLabel : this.t('clean');
    }
    this.game.releaseInput();
  }

  closePause() {
    this.pauseOpen = false;
    this.$('#pause-menu').classList.remove('on');
    this.game.state = 'playing';
    this.game.captureInput();
  }

  openMap() {
    if (this.game.state === 'menu' || this.game.state === 'paused') return;
    this.mapOpen = true;
    this.game.state = 'map';
    this.$('#map-overlay').classList.add('on');
    this.drawBigMap();
    this.game.releaseInput();
  }
  closeMap() {
    this.mapOpen = false;
    this.$('#map-overlay').classList.remove('on');
    this.game.state = 'playing';
    this.game.captureInput();
  }

  openPhone() {
    if (this.game.state !== 'playing') return;
    this.phoneOpen = true;
    this.game.state = 'phone';
    this.$('#phone-overlay').classList.add('on');
    this.$('#phone-name').textContent = this.game.activeChar.name.toUpperCase();
    this.$('#phone-money').textContent = formatMoney(this.game.money);
    this.$('#phone-rep').textContent = `REP ${this.game.rp?.rep || 12}`;
    this.game.releaseInput();
  }
  closePhone() {
    this.phoneOpen = false;
    this.$('#phone-overlay').classList.remove('on');
    this.game.state = 'playing';
    this.game.captureInput();
  }

  jobInfo(type) {
    const pt = this.language === 'pt';
    return {
      taxi: { title: pt ? 'Rota Costa' : 'Costa Ride', desc: pt ? 'Leve um passageiro até o destino. Quanto mais rápido, maior a gorjeta.' : 'Take a passenger to their destination. Faster rides earn bigger tips.' },
      delivery: { title: pt ? 'Leva Já' : 'Dash Drop', desc: pt ? 'Retire uma encomenda no centro e entregue antes que esfrie.' : 'Pick up a package downtown and deliver it while it is still hot.' },
      security: { title: pt ? 'Olho Vivo' : 'Watchdog', desc: pt ? 'Proteja o quiosque de uma visita indesejada. Segurança honesta paga bem.' : 'Protect the kiosk from unwelcome visitors. Honest security pays well.' },
      tour: { title: pt ? 'Costa Tour' : 'Costa Tour', desc: pt ? 'Leve turistas ao mirante do Farol. A vista é o pagamento extra.' : 'Drive tourists to the lighthouse viewpoint. The view is the bonus.' }
    }[type];
  }

  acceptJob() {
    this.closePhone();
    this.game.startJob(this.currentJob);
  }

  // ---------------- MAP DRAWING ----------------
  drawMinimap() {
    const canvas = this.$('#minimap');
    if (!canvas || !this.game?.world) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const p = this.game.player.position;
    const yaw = this.game.player.heading;
    this.drawMapCanvas(ctx, size, size, p.x, p.z, 260, yaw, false);
  }

  drawBigMap() {
    const canvas = this.$('#big-map');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    this.drawMapCanvas(ctx, canvas.width, canvas.height, 0, -85, 520, 0, true);
    if (this.game.missionManager?.active) {
      this.$('#map-objective').textContent = this.game.missionManager.mission.title ? (this.language === 'pt' ? this.game.missionManager.mission.title.pt : this.game.missionManager.mission.title.en) : '—';
      this.$('#map-objective-dist').textContent = `${Math.round(this.game.missionManager.distanceToTarget())} m`;
    }
    const list = this.$('#map-markers');
    if (list) {
      const markers = this.game.mapMarkers();
      list.innerHTML = markers.slice(0, 9).map(m => `<div class="map-marker-row"><i style="background:${m.color || 'var(--gold)'}"></i><b>${this.language === 'pt' ? m.namePt : m.nameEn}</b><span>${Math.round(m.dist)} m</span></div>`).join('');
    }
  }

  drawMapCanvas(ctx, W, H, cx, cz, range, yaw, big) {
    const world = this.game.world;
    const game = this.game;
    const scale = Math.min(W, H) / range;
    const toX = (x) => W / 2 + (x - cx) * scale;
    const toY = (z) => H / 2 + (z - cz) * scale;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = big ? '#071c20' : '#09282d';
    ctx.fillRect(0, 0, W, H);
    // ocean
    ctx.fillStyle = big ? '#0d3d48' : '#0c353d';
    ctx.fillRect(0, 0, W, H);
    // city land
    ctx.fillStyle = big ? '#263b39' : '#203835';
    ctx.beginPath();
    ctx.rect(toX(-450), toY(-440), 900 * scale, 586 * scale);
    ctx.fill();
    // beach
    ctx.fillStyle = big ? '#c0a777' : '#a68f68';
    ctx.fillRect(toX(-450), toY(108), 900 * scale, 38 * scale);
    // promenade
    ctx.fillStyle = big ? '#6b7166' : '#596456';
    ctx.fillRect(toX(-450), toY(89), 900 * scale, 19 * scale);
    // blocks
    ctx.fillStyle = big ? '#334a47' : '#2b403d';
    for (const b of world.blocks) {
      const x = toX(b.minX), y = toY(b.minZ), w = (b.maxX - b.minX) * scale, h = (b.maxZ - b.minZ) * scale;
      if (x + w < 0 || x > W || y + h < 0 || y > H) continue;
      ctx.fillRect(x, y, w, h);
    }
    // park
    ctx.fillStyle = '#3e6249';
    ctx.fillRect(toX(-233), toY(-16), 108 * scale, 92 * scale);
    // roads
    ctx.strokeStyle = big ? '#7a8279' : '#69746c';
    ctx.lineWidth = Math.max(big ? 7 : 3, 14 * scale * .52);
    for (const r of world.roads) {
      ctx.beginPath();
      if (r.type === 'v') { ctx.moveTo(toX(r.x), toY(-385)); ctx.lineTo(toX(r.x), toY(89)); }
      else { ctx.moveTo(toX(-385), toY(r.z)); ctx.lineTo(toX(385), toY(r.z)); }
      ctx.stroke();
    }
    // beach avenue accent
    ctx.strokeStyle = 'rgba(246,199,104,.45)';
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.beginPath(); ctx.moveTo(toX(-420), toY(82)); ctx.lineTo(toX(420), toY(82)); ctx.stroke();
    // coastline outline
    ctx.strokeStyle = 'rgba(177,238,226,.33)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(toX(-450), toY(146)); ctx.lineTo(toX(450), toY(146)); ctx.stroke();
    // water waves
    ctx.strokeStyle = 'rgba(130,220,217,.06)';
    ctx.lineWidth = 1;
    for (let z = 180; z < 400; z += 24) { ctx.beginPath(); ctx.moveTo(toX(-450), toY(z)); ctx.lineTo(toX(450), toY(z)); ctx.stroke(); }
    // landmarks
    const locs = [
      { x: -352, z: 50, icon: '◉', color: '#f6c768', label: 'FAROL' },
      { x: 350, z: 30, icon: '⊙', color: '#ff7058', label: 'RODA' },
      { x: 17, z: -244, icon: '▲', color: '#43ddbe', label: 'TORRE' },
      { x: 108, z: 200, icon: '═', color: '#e6ddc8', label: 'PIER' },
      { x: -178, z: 30, icon: '✦', color: '#89c67a', label: 'PARK' }
    ];
    for (const l of locs) {
      const x = toX(l.x), y = toY(l.z);
      if (x < 0 || x > W || y < 0 || y > H) continue;
      ctx.fillStyle = l.color;
      ctx.beginPath(); ctx.arc(x, y, big ? 8 : 3, 0, Math.PI * 2); ctx.fill();
      if (big) { ctx.font = '600 15px Outfit'; ctx.fillStyle = 'rgba(248,246,236,.8)'; ctx.fillText(l.label, x + 14, y + 5); }
    }
    // district labels big
    if (big) {
      ctx.font = '700 20px "Barlow Condensed"'; ctx.fillStyle = 'rgba(238,244,238,.32)'; ctx.textAlign = 'center';
      const labels = [[-190, 55, 'ORLA CENTRAL'], [0, -60, 'CENTRO MARÉ'], [280, -90, 'PORTO MARÉ'], [-285, -210, 'MORRO DO SOM'], [295, 36, 'MARINA AZUL'], [-240, 10, 'JARDINS']];
      labels.forEach(([x, z, text]) => ctx.fillText(text, toX(x), toY(z)));
      ctx.textAlign = 'left';
    }
    // mission marker
    const marker = game.missionManager?.markerPos;
    if (marker) {
      const x = toX(marker.x), y = toY(marker.z);
      const pulse = 1 + Math.sin(performance.now() * .005) * .24;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = '#f6c768'; ctx.lineWidth = big ? 4 : 2;
      ctx.strokeRect(-7 * pulse, -7 * pulse, 14 * pulse, 14 * pulse);
      ctx.fillStyle = 'rgba(246,199,104,.35)'; ctx.fillRect(-5, -5, 10, 10);
      ctx.restore();
    }
    // service markers if big
    if (big) {
      const services = [[-62, 95, '#ff7058'], [48, 95, '#43ddbe'], [168, 95, '#f6c768'], [126, -6, '#71c7ff']];
      services.forEach(([x, z, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(toX(x), toY(z), 4, 0, 7); ctx.fill(); });
    }
    // NPCs / hostiles / police
    for (const npc of game.npcs || []) {
      if (npc.dead) continue;
      const x = toX(npc.position.x), y = toY(npc.position.z);
      if (x < 0 || x > W || y < 0 || y > H) continue;
      ctx.fillStyle = 'rgba(220,235,228,.48)';
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
    for (const h of game.hostiles || []) {
      if (!h.alive) continue;
      const x = toX(h.position.x), y = toY(h.position.z);
      if (x < 0 || x > W || y < 0 || y > H) continue;
      ctx.fillStyle = h.kind === 'police' ? '#5b8cff' : '#ff554d';
      ctx.beginPath(); ctx.arc(x, y, big ? 4 : 2.4, 0, 7); ctx.fill();
    }
    for (const c of game.policeCars || []) {
      const x = toX(c.root.position.x), y = toY(c.root.position.z);
      if (x < 0 || x > W || y < 0 || y > H) continue;
      ctx.fillStyle = '#77a2ff'; ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
    }
    // cars
    for (const v of game.vehicles || []) {
      if (v === game.activeVehicle || v.police) continue;
      const x = toX(v.root.position.x), y = toY(v.root.position.z);
      if (x < 0 || x > W || y < 0 || y > H) continue;
      ctx.fillStyle = 'rgba(235,232,220,.42)';
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    // player arrow
    const px = toX(game.player.position.x), py = toY(game.player.position.z);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-yaw);
    ctx.fillStyle = '#fff9e8';
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -(big ? 13 : 10)); ctx.lineTo(big ? 8 : 6, big ? 9 : 7); ctx.lineTo(0, big ? 4 : 3.5); ctx.lineTo(big ? -8 : -6, big ? 9 : 7); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    if (big) {
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1;
      for (let x = -400; x <= 400; x += 100) { ctx.beginPath(); ctx.moveTo(toX(x), 0); ctx.lineTo(toX(x), H); ctx.stroke(); }
    }
    // vignette minimap
    if (!big) {
      const grad = ctx.createRadialGradient(W / 2, H / 2, W * .33, W / 2, H / 2, W * .5);
      grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,.38)');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    }
  }

  openMapPreview() {
    if (!this.game.world) return;
    this.game.cinematic = true;
    this.game.state = 'map-preview';
    this.showMapPreview = true;
    this.$('#map-overlay').classList.add('on');
    this.drawBigMap();
    this.$('#map-close-2').textContent = this.language === 'pt' ? 'Fechar' : 'Close';
  }
}
