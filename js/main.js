/* ============================================================
   GTA 7 BR — GTA 7 BR
   Application shell: boot, menus, settings, saves and panels.
   ============================================================ */
import { Game, MISSIONS } from './game.js';
import { AudioSystem } from './audio.js';

const $ = (id) => document.getElementById(id);
const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

const SAVE_KEY = 'matteo5.save.v1';
const SETTINGS_KEY = 'matteo5.settings.v1';

const DEFAULT_SETTINGS = {
  quality: 'high', resScale: 100, fps: 60, shadows: true, distance: 80,
  tod: 'golden', water: 'medium', vignette: true, grain: true,
  sens: 100, invert: false, aimassist: 'high', vibration: true,
  touch: 'auto', touchScale: 100, touchLayout: 'gta', touchPositions: {},
  volMaster: 80, volMusic: 55, volSfx: 80, volEngine: 65, volVoice: 90, spatial: true,
  hudScale: 100, showFps: false, subtitles: true, minimap: 'normal',
  reduceMotion: false, contrast: false, language: 'pt', autoQuality: true
};

const QUALITY_PRESETS = {
  low:    { resScale: 65,  shadows: false, water: 'low',    distance: 55 },
  medium: { resScale: 80,  shadows: true,  water: 'medium', distance: 70 },
  high:   { resScale: 100, shadows: true,  water: 'medium', distance: 80 },
  ultra:  { resScale: 100, shadows: true,  water: 'high',   distance: 100 }
};

const MODALS = ['settings-modal', 'playstyle-modal', 'missions-modal', 'rp-modal', 'download-modal', 'credits-modal', 'char-select'];

let settings = loadJSON(SETTINGS_KEY, {});
settings = { ...DEFAULT_SETTINGS, ...settings };
let save = loadJSON(SAVE_KEY, null);
let game = null;
let audio = null;
let charSelectMode = 'story';
let bootDone = false;
let menuMode = 'story';

/* ---------- persistence ---------- */
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (_) { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}
function persistSettings() {
  saveJSON(SETTINGS_KEY, settings);
}
function persistSave(state) {
  if (!state) return;
  save = { ...(save || {}), ...state, updated: Date.now() };
  saveJSON(SAVE_KEY, save);
  updateContinueState();
}

/* ---------- boot ---------- */
function bootSequence() {
  const bar = $('boot-progress');
  const pct = $('boot-pct');
  const status = $('boot-status-text');
  const stages = [
    [12, 'INICIANDO NÚCLEO GRÁFICO'],
    [32, 'GERANDO SÃO PAULO'],
    [54, 'CARREGANDO DISTRITOS E ORLA'],
    [72, 'SINTETIZANDO TRILHA ORIGINAL'],
    [88, 'CALIBRANDO CONTROLES PS5'],
    [100, 'PRONTO']
  ];
  let i = 0;
  let p = 0;
  const tick = setInterval(() => {
    const target = stages[Math.min(i, stages.length - 1)][0];
    p = Math.min(target, p + Math.max(2.2, (target - p) * 0.3 + 1.2));
    if (p >= target - 0.5) {
      status.textContent = stages[Math.min(i, stages.length - 1)][1];
      i++;
    }
    if (bar) bar.style.width = p + '%';
    if (pct) pct.textContent = Math.round(p) + '%';
    if (p >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        bootDone = true;
        $('boot').classList.add('hidden');
        showMainMenu();
      }, 520);
    }
  }, 55);
}

/* ---------- game init ---------- */
function initGame() {
  audio = new AudioSystem(settings);
  try {
    game = new Game({
      canvas: $('game-canvas'),
      settings,
      save: save || {},
      audio,
      callbacks: {
        onSave: (state) => {
          persistSave(state);
          const note = $('pause-save-state');
          if (note) note.innerHTML = 'Salvo automaticamente • <span>agora mesmo</span>';
        },
        onOpenRP: () => openRPModal(),
        onOpenMissions: () => openMissionsModal(),
        onOpenSettings: () => openOverlay('settings-modal'),
        onSettingsChange: (s) => {
          if (s) {
            settings.touchPositions = s.touchPositions || settings.touchPositions;
            settings.touchLayout = s.touchLayout || settings.touchLayout;
          }
          persistSettings();
        }
      }
    });
    game.applySettings(settings);
    game.showMenu();
    window.__game = game;
    window.__matteo = { settings, get save() { return save; } };
  } catch (err) {
    console.error('[GTA 7 BR] Falha ao iniciar o mundo:', err);
    const boot = $('boot');
    if (boot) {
      boot.innerHTML = `<div class="boot-center"><div class="boot-brand">GTA 7 BR<span>5</span></div>
        <div class="boot-sub" style="max-width:520px;line-height:1.8">Não foi possível iniciar o WebGL 2 neste dispositivo.<br>
        Ative a aceleração de hardware ou abra em um navegador atualizado.<br><small style="opacity:.6">${String(err.message || err)}</small></div></div>`;
    }
    return;
  }
  syncSettingsUI();
  updateContinueState();
}

/* ---------- screens ---------- */
function showMainMenu() {
  if (!game) return;
  game.showMenu();
  game.uiModalOpen = false;
  MODALS.forEach((id) => $(id) && $(id).classList.add('hidden'));
  $('boot').classList.add('hidden');
  $('main-menu').classList.remove('hidden');
  $('char-select').classList.add('hidden');
  updateContinueState();
  document.exitPointerLock && document.exitPointerLock();
}

function hideMenu() {
  $('main-menu').classList.add('hidden');
  $('boot').classList.add('hidden');
  $('char-select').classList.add('hidden');
  MODALS.forEach((id) => $(id) && $(id).classList.add('hidden'));
  if (game) game.uiModalOpen = false;
}

function startExperience(mode, charId, state = null) {
  if (!game) return;
  hideMenu();
  audio && audio.init();
  if (mode === 'rp') game.startRP(charId || 'luiza', state);
  else game.startStory(charId || 'luiza', state);
  game.showHUD();
  game._last = performance.now();
  if (game._touchEnabled()) $('touch-controls').classList.remove('hidden');
}

function continueGame() {
  const s = loadJSON(SAVE_KEY, null);
  if (!s) {
    openCharSelect('story');
    return;
  }
  save = s;
  if (s.mode === 'rp') startExperience('rp', s.char || 'luiza', s);
  else startExperience('story', s.char || 'luiza', s);
}

function updateContinueState() {
  const btn = $('nav-continue');
  const sub = $('continue-sub');
  if (!btn || !sub) return;
  const s = loadJSON(SAVE_KEY, null);
  if (s) {
    const ch = s.char === 'carlos' ? 'Felipe' : 'Maria';
    const mode = s.mode === 'rp' ? 'Roleplay' : `${(s.completed || []).length}/10 missões`;
    sub.textContent = `${ch} • ${mode} • ${new Date(s.updated || Date.now()).toLocaleDateString('pt-BR')}`;
    btn.classList.remove('disabled');
  } else {
    sub.textContent = 'Nenhum jogo salvo';
    btn.classList.add('disabled');
  }
}

/* ---------- overlays ---------- */
function openOverlay(id) {
  const el = $(id);
  if (!el) return;
  el.classList.remove('hidden');
  if (MODALS.includes(id)) {
    if (game) game.uiModalOpen = true;
    document.exitPointerLock && document.exitPointerLock();
  }
}
function closeOverlay(id) {
  const el = $(id);
  if (!el) return;
  el.classList.add('hidden');
  // The full map lives inside the game runtime, so closing its DOM panel
  // must also release the gameplay lock.
  if (game && id === 'map-overlay') game.mapOpen = false;
  if (game && MODALS.includes(id)) {
    game.uiModalOpen = MODALS.some((m) => {
      const e = $(m);
      return e && !e.classList.contains('hidden');
    });
  }
  if (id === 'char-select') $('main-menu').classList.remove('hidden');
}
function closeTopModal() {
  for (const id of [...MODALS].reverse()) {
    const el = $(id);
    if (el && !el.classList.contains('hidden')) {
      closeOverlay(id);
      return true;
    }
  }
  return false;
}

function openCharSelect(mode) {
  charSelectMode = mode;
  const head = document.querySelector('#char-select .cs-head small');
  const title = document.querySelector('#char-select .cs-head h2');
  if (head) head.textContent = mode === 'rp' ? 'MODO LIVRE • SÃO PAULO ONLINE' : 'ESCOLHA SEU CAMINHO';
  if (title) title.textContent = mode === 'rp' ? 'QUEM VAI VIVER A CIDADE?' : 'QUEM VAI DESCOBRIR SÃO PAULO?';
  openOverlay('char-select');
}

/* ---------- missions ---------- */
function openMissionsModal() {
  const list = $('missions-list');
  if (!list || !game) return;
  if (game.mode !== 'attract' && !game.paused && !game.mapOpen && !game.dialogueActive) game.togglePause(true);
  list.innerHTML = '';
  const completed = new Set((save && save.completed) || []);
  MISSIONS.forEach((m, i) => {
    const done = completed.has(m.id);
    const prevDone = i === 0 || completed.has(MISSIONS[i - 1].id);
    const available = !done && prevDone;
    const locked = !done && !prevDone;
    const row = document.createElement('div');
    row.className = 'mission-row' + (done ? ' done' : available ? ' available' : locked ? ' locked' : '');
    row.innerHTML = `
      <div class="mission-num">${String(m.num).padStart(2, '0')}</div>
      <div class="mission-info">
        <b>${m.title}</b>
        <small>${m.char === 'luiza' ? 'MARIA' : 'FELIPE'} • ${m.location}</small>
        <div class="mission-tags"><span>CAP. ${m.num}</span><span>R$ ${m.reward.toLocaleString('pt-BR')}</span><span>${m.time}</span></div>
      </div>
      <div class="mission-state ${done ? 'done' : available ? 'available' : ''}">${done ? 'CONCLUÍDA' : available ? 'DISPONÍVEL' : 'BLOQUEADA'}</div>
      ${done || available ? `<button class="mission-play" data-mission="${m.id}">${done ? 'REJOGAR' : 'INICIAR'}</button>` : ''}
    `;
    list.appendChild(row);
  });
  list.querySelectorAll('[data-mission]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeOverlay('missions-modal');
      if (game.paused) game.togglePause(false);
      game.startMissionById(btn.dataset.mission);
    });
  });
  openOverlay('missions-modal');
}

/* ---------- RP ---------- */
function openRPModal() {
  if (!game) return;
  if (game.mode !== 'attract' && !game.paused && !game.mapOpen && !game.dialogueActive) game.togglePause(true);
  renderRPJobs();
  updateRPPanel();
  openOverlay('rp-modal');
}

function renderRPJobs() {
  const wrap = $('rp-jobs');
  if (!wrap || !game) return;
  const jobs = game.getRPJobs();
  wrap.innerHTML = '';
  jobs.forEach((job, i) => {
    const el = document.createElement('button');
    el.className = 'rp-job';
    el.innerHTML = `
      <span class="rj-type">${job.type.toUpperCase()} • SÃO PAULO</span>
      <b>${job.title}</b>
      <p>${job.pt}</p>
      <div class="rj-meta"><span>⏱ ${Math.round(job.time / 60)} min</span><em>R$ ${job.reward.toLocaleString('pt-BR')}</em></div>
      <span class="rj-accept">ACEITAR TRABALHO</span>
    `;
    el.addEventListener('click', () => {
      closeOverlay('rp-modal');
      game.startRPJob(i);
    });
    wrap.appendChild(el);
  });
}

function updateRPPanel() {
  if (!game || !game.player) return;
  const p = game.player;
  const isL = p.charId === 'luiza';
  const av = $('rp-avatar');
  if (av) av.innerHTML = `<svg><use href="#portrait-${isL ? 'luiza' : 'carlos'}"/></svg>`;
  const name = $('rp-name');
  if (name) name.textContent = isL ? 'MARIA ANDRADE' : 'FELIPE MENDES';
  const money = $('rp-money');
  if (money) money.textContent = 'R$ ' + Math.floor(p.money).toLocaleString('pt-BR');
  const rep = game.rp || { rep: 0, done: 0 };
  const label = rep.rep >= 80 ? 'Lenda da Orla' : rep.rep >= 50 ? 'Respeitado' : rep.rep >= 20 ? 'Conhecido' : 'Cidadão';
  const repEl = $('rp-rep'); if (repEl) repEl.textContent = label;
  const repBar = $('rp-rep-bar'); if (repBar) repBar.style.width = Math.max(4, rep.rep || 0) + '%';
}

/* ---------- settings ---------- */
function syncSettingsUI() {
  const set = (id, value, prop = 'value') => {
    const el = $(id);
    if (!el) return;
    if (prop === 'checked') el.checked = !!value;
    else el.value = value;
  };
  set('set-quality', settings.quality);
  set('set-res', settings.resScale);
  set('set-fps', settings.fps);
  set('set-shadows', settings.shadows, 'checked');
  set('set-distance', settings.distance);
  set('set-tod', settings.tod);
  set('set-water', settings.water);
  set('set-vignette', settings.vignette, 'checked');
  set('set-grain', settings.grain, 'checked');
  set('set-sens', settings.sens);
  set('set-invert', settings.invert, 'checked');
  set('set-aimassist', settings.aimassist);
  set('set-vibration', settings.vibration, 'checked');
  set('set-touch', settings.touch);
  set('set-touchscale', settings.touchScale);
  set('set-padscale', settings.touchScale);
  set('set-volmaster', settings.volMaster);
  set('set-volmusic', settings.volMusic);
  set('set-volsfx', settings.volSfx);
  set('set-volengine', settings.volEngine);
  set('set-volvoice', settings.volVoice);
  set('set-spatial', settings.spatial, 'checked');
  set('set-hudscale', settings.hudScale);
  set('set-showfps', settings.showFps, 'checked');
  set('set-subtitles', settings.subtitles, 'checked');
  set('set-minimap', settings.minimap);
  set('set-reducemotion', settings.reduceMotion, 'checked');
  set('set-contrast', settings.contrast, 'checked');
  const outs = {
    'out-res': settings.resScale + '%', 'out-distance': settings.distance + '%',
    'out-sens': settings.sens + '%', 'out-touchscale': settings.touchScale + '%',
    'out-padscale': settings.touchScale + '%',
    'out-volmaster': settings.volMaster + '%', 'out-volmusic': settings.volMusic + '%',
    'out-volsfx': settings.volSfx + '%', 'out-volengine': settings.volEngine + '%',
    'out-volvoice': settings.volVoice + '%', 'out-hudscale': settings.hudScale + '%'
  };
  Object.entries(outs).forEach(([id, v]) => { const el = $(id); if (el) el.textContent = v; });
  qsa('.lang-card').forEach((c) => c.classList.toggle('active', c.dataset.lang === settings.language));
  const res = $('perf-res');
  if (res) res.textContent = (settings.resScale || 100) + '%';
  const q = $('perf-quality');
  if (q) q.textContent = (settings.quality || 'high').toUpperCase();
  syncPlaystyleUI();
  applyUIFlags();
}

const PLAYSTYLE_NAMES = {
  gta: 'Modo Completo GTA',
  simple: 'Modo Simples / Tutorial',
  dualsense: 'Controle PS5 na tela'
};

function syncPlaystyleUI() {
  const layout = settings.touchLayout || 'gta';
  const current = $('playstyle-current');
  if (current) current.textContent = PLAYSTYLE_NAMES[layout] || PLAYSTYLE_NAMES.gta;
  qsa('.playstyle-card').forEach((card) => {
    card.classList.toggle('active', card.dataset.layout === layout);
  });
  const scale = $('set-padscale');
  if (scale) scale.value = settings.touchScale;
  const out = $('out-padscale');
  if (out) out.textContent = settings.touchScale + '%';
}

function applyUIFlags() {
  document.body.classList.toggle('no-vignette', settings.vignette === false);
  document.body.classList.toggle('no-grain', settings.grain === false);
  document.body.classList.toggle('high-contrast', !!settings.contrast);
  document.documentElement.style.setProperty('--hud-scale', (settings.hudScale ?? 100) / 100);
  document.documentElement.lang = settings.language === 'en' ? 'en' : 'pt-BR';
  const fc = $('fps-counter');
  if (fc) fc.classList.toggle('hidden', !settings.showFps);
}

function commitSettings(reapply = true) {
  persistSettings();
  syncPlaystyleUI();
  applyUIFlags();
  if (game && reapply) game.applySettings(settings);
  const note = $('settings-save-note');
  if (note) note.textContent = 'Alterações salvas automaticamente';
}

function bindSettings() {
  const bind = (id, key, type = 'value', extra = null) => {
    const el = $(id);
    if (!el) return;
    const evt = type === 'checked' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      settings[key] = type === 'checked' ? el.checked : el.type === 'range' ? Number(el.value) : el.value;
      if (extra) extra(el);
      if (id === 'set-res' || id === 'set-distance' || id === 'set-sens' || id === 'set-hudscale' ||
          id.startsWith('set-vol') || id === 'set-touchscale' || id === 'set-padscale') {
        const out = $('out-' + id.slice(4));
        if (out) out.textContent = el.value + '%';
      }
      if (id === 'set-touchscale' || id === 'set-padscale') {
        const twinId = id === 'set-touchscale' ? 'set-padscale' : 'set-touchscale';
        const twin = $(twinId);
        if (twin) twin.value = el.value;
        const twinOut = $('out-' + twinId.slice(4));
        if (twinOut) twinOut.textContent = el.value + '%';
      }
      if (settings.quality !== 'custom' && ['set-res', 'set-shadows', 'set-distance', 'set-water'].includes(id)) {
        settings.quality = 'custom';
        const q = $('set-quality'); if (q) q.value = 'custom';
      }
      commitSettings();
    });
  };

  bind('set-res', 'resScale');
  bind('set-fps', 'fps');
  bind('set-shadows', 'shadows', 'checked');
  bind('set-distance', 'distance');
  bind('set-tod', 'tod');
  bind('set-water', 'water');
  bind('set-vignette', 'vignette', 'checked');
  bind('set-grain', 'grain', 'checked');
  bind('set-sens', 'sens');
  bind('set-invert', 'invert', 'checked');
  bind('set-aimassist', 'aimassist');
  bind('set-vibration', 'vibration', 'checked');
  bind('set-touch', 'touch');
  bind('set-touchscale', 'touchScale');
  bind('set-padscale', 'touchScale');
  bind('set-volmaster', 'volMaster');
  bind('set-volmusic', 'volMusic');
  bind('set-volsfx', 'volSfx');
  bind('set-volengine', 'volEngine');
  bind('set-volvoice', 'volVoice');
  bind('set-spatial', 'spatial', 'checked');
  bind('set-hudscale', 'hudScale');
  bind('set-showfps', 'showFps', 'checked');
  bind('set-subtitles', 'subtitles', 'checked');
  bind('set-minimap', 'minimap');
  bind('set-reducemotion', 'reduceMotion', 'checked');
  bind('set-contrast', 'contrast', 'checked');

  const quality = $('set-quality');
  if (quality) quality.addEventListener('change', () => {
    settings.quality = quality.value;
    if (QUALITY_PRESETS[settings.quality]) {
      Object.assign(settings, QUALITY_PRESETS[settings.quality]);
      syncSettingsUI();
    }
    commitSettings();
  });

  qsa('.lang-card').forEach((card) => {
    card.addEventListener('click', () => {
      settings.language = card.dataset.lang;
      qsa('.lang-card').forEach((c) => c.classList.toggle('active', c === card));
      commitSettings();
      if (game) game.notify('IDIOMA', settings.language === 'en' ? 'Dialogue language: English first.' : 'Idioma dos diálogos: Português primeiro.', 'good');
    });
  });

  const reset = $('btn-reset-settings');
  if (reset) reset.addEventListener('click', () => {
    settings = { ...DEFAULT_SETTINGS, touchPositions: {} };
    syncSettingsUI();
    commitSettings();
  });

  qsa('#settings-tabs button').forEach((tab) => {
    tab.addEventListener('click', () => {
      qsa('#settings-tabs button').forEach((t) => t.classList.toggle('active', t === tab));
      qsa('.settings-page').forEach((p) => p.classList.toggle('active', p.dataset.page === tab.dataset.tab));
    });
  });
}

/* ---------- como você joga ---------- */
function bindPlaystyle() {
  const open = $('btn-open-playstyle');
  if (open) open.addEventListener('click', () => {
    syncPlaystyleUI();
    openOverlay('playstyle-modal');
  });

  qsa('.playstyle-card').forEach((card) => {
    card.addEventListener('click', () => {
      const layout = card.dataset.layout;
      settings.touchLayout = layout;
      if (game) game.setTouchLayout(layout);
      syncPlaystyleUI();
      commitSettings();
    });
  });

  const edit = $('btn-edit-touch');
  if (edit) edit.addEventListener('click', () => {
    closeOverlay('playstyle-modal');
    closeOverlay('settings-modal');
    if (!game) return;
    game.setTouchEdit(true);
    if (game.mode !== 'attract') {
      game.notify('MODO EDIÇÃO', 'Arraste os botões para reposicionar. Toque em CONCLUIR quando terminar.', 'good');
    }
  });

  const reset = $('btn-reset-touch');
  if (reset) reset.addEventListener('click', () => {
    if (game) game.resetTouchPositions();
  });

  const done = $('touch-edit-done');
  if (done) done.addEventListener('click', () => {
    if (game) game.setTouchEdit(false);
  });

  const close = $('btn-playstyle-close');
  if (close) close.addEventListener('click', () => {
    closeOverlay('playstyle-modal');
    closeOverlay('settings-modal');
    if (game && game.mode !== 'attract' && game.paused) game.togglePause(false);
  });

  const editReset = $('touch-edit-reset');
  if (editReset) editReset.addEventListener('click', () => {
    if (game) game.resetTouchPositions();
  });
}

/* ---------- download ---------- */
function bindDownload() {
  const start = $('btn-download-start');
  const play = $('btn-download-play');
  const bar = $('dl-bar');
  const status = $('dl-status');
  const pct = $('dl-pct');
  const detail = $('dl-detail');
  let running = false;

  qsa('.edition-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      qsa('.edition-option').forEach((o) => o.classList.toggle('selected', o === opt));
    });
  });

  if (start) start.addEventListener('click', () => {
    if (running) return;
    running = true;
    start.disabled = true;
    let p = 0;
    if (status) status.textContent = 'INSTALANDO…';
    const iv = setInterval(() => {
      p = Math.min(100, p + Math.random() * 7 + 2);
      if (bar) bar.style.width = p + '%';
      if (pct) pct.textContent = Math.round(p) + '%';
      if (detail) detail.textContent = p < 45 ? 'Baixando pacote da cidade…' :
        p < 75 ? 'Descompactando texturas originais…' : 'Registrando launcher e salvamento local…';
      if (p >= 100) {
        clearInterval(iv);
        running = false;
        if (status) status.textContent = 'INSTALADO • PRONTO PARA JOGAR';
        if (detail) detail.textContent = 'São Paulo está pronto neste navegador.';
        if (play) play.classList.remove('hidden');
        start.classList.add('hidden');
      }
    }, 180);
  });

  if (play) play.addEventListener('click', () => {
    closeOverlay('download-modal');
    openCharSelect('story');
  });
}

/* ---------- event wiring ---------- */
function bindMenu() {
  qsa('[data-menu]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.menu;
      if (audio) audio.init();
      if (action === 'play') openCharSelect('story');
      else if (action === 'rp') openCharSelect('rp');
      else if (action === 'continue') continueGame();
      else if (action === 'gta6') continueGame();
      else if (action === 'download') openOverlay('download-modal');
      else if (action === 'settings') openOverlay('settings-modal');
      else if (action === 'credits') openOverlay('credits-modal');
    });
  });

  qsa('.cs-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.char;
      closeOverlay('char-select');
      startExperience(charSelectMode, id, null);
    });
  });

  const sound = $('btn-menu-sound');
  if (sound) sound.addEventListener('click', () => {
    if (!audio) return;
    audio.init();
    const muted = audio.toggleMute();
    sound.classList.toggle('muted', muted);
    sound.style.opacity = muted ? '.45' : '1';
  });

  const menuSettings = $('btn-menu-settings');
  if (menuSettings) menuSettings.addEventListener('click', () => openOverlay('settings-modal'));

  qsa('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => closeOverlay(btn.dataset.close));
  });

  qsa('.pause-nav [data-pause]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!game) return;
      const action = btn.dataset.pause;
      if (action === 'resume') game.togglePause(false);
      else if (action === 'map') { game.togglePause(false); game.openMap(); }
      else if (action === 'missions') openMissionsModal();
      else if (action === 'rp') openRPModal();
      else if (action === 'characters') {
        game.togglePause(false);
        game.openSwitch();
      } else if (action === 'settings') openOverlay('settings-modal');
      else if (action === 'checkpoint') { game.togglePause(false); game.restartCheckpoint(); }
      else if (action === 'save') game.saveGame();
      else if (action === 'menu') { showMainMenu(); }
    });
  });

  const adminCompleteMission = $('btn-admin-complete-mission');
  if (adminCompleteMission) adminCompleteMission.addEventListener('click', () => {
    if (!game || !game.mission) return;
    game.togglePause(false);
    game._completeMission();
  });

  const resultNext = $('btn-result-next');
  if (resultNext) resultNext.addEventListener('click', () => {
    if (!game) return;
    if (game.mission && game.mission.failed) { game.restartCheckpoint(); return; }
    game._closeResult();
    const next = game.nextMission();
    if (next) game.notify('PRÓXIMA MISSÃO', next.title + ' disponível em ' + next.location + '.', 'good');
    else game.notify('HISTÓRIA COMPLETA', 'Você terminou as dez missões. A cidade é sua.', 'good');
  });
  const resultRetry = $('btn-result-retry');
  if (resultRetry) resultRetry.addEventListener('click', () => { if (game) game.restartCheckpoint(); });
  const resultMenu = $('btn-result-menu');
  if (resultMenu) resultMenu.addEventListener('click', () => { if (game) showMainMenu(); });

  const rpRefresh = $('btn-rp-refresh');
  if (rpRefresh) rpRefresh.addEventListener('click', () => {
    if (game) { game.rpJobs = null; renderRPJobs(); updateRPPanel(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    if (game && game.mode !== 'attract' && game.uiModalOpen) { e.preventDefault(); closeTopModal(); return; }
    if (game && game.mode === 'attract') {
      if (closeTopModal()) e.preventDefault();
    }
  }, true);

  window.addEventListener('beforeunload', () => {
    if (game && game.player && game.mode !== 'attract') persistSave(game.getSaveState());
  });
}

/* ---------- refresh panels while playing ---------- */
function bindLivePanels() {
  setInterval(() => {
    if (!game) return;
    const clock = Math.floor(game.clockMinutes / 60) % 24;
    const mins = Math.floor(game.clockMinutes % 60);
    const str = String(clock).padStart(2, '0') + ':' + String(mins).padStart(2, '0');
    const mc = $('menu-clock');
    if (mc) mc.textContent = str;
    if (game.mode !== 'attract' && game.player) {
      const paused = game.paused;
      if (paused) {
        const pm = $('pause-money');
        if (pm) pm.textContent = 'R$ ' + Math.floor(game.player.money).toLocaleString('pt-BR');
      }
      const pr = $('perf-res');
      if (pr) pr.textContent = (settings.resScale || 100) + '%';
    }
  }, 1000);
}

/* ---------- start ---------- */
function start() {
  bindSettings();
  bindPlaystyle();
  bindDownload();
  bindMenu();
  bindLivePanels();
  requestAnimationFrame(() => {
    setTimeout(() => {
      initGame();
      bootSequence();
    }, 60);
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
