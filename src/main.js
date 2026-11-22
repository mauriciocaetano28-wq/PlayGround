import './styles.css';
import { GAMES, GAME_BY_ID, formatBRL } from './data/games.js';
import { store } from './core/store.js';
import { audio } from './core/audio.js';
import { RoomScene } from './core/room.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const app = $('#app');
const room = new RoomScene($('#room-canvas'), { onPower: () => bootConsole() });

const gameLoaders = {
  minicraft: () => import('./games/minicraft.js'),
  gta: () => import('./games/gta.js'),
  bloxtity: () => import('./games/bloxtity.js'),
  neon: () => import('./games/neon.js'),
  astro: () => import('./games/astro.js'),
};

let selectedId = GAMES[0].id;
let booted = false;
let booting = false;
let currentGame = null;
let currentGameId = null;
let sessionStart = 0;
let gameStart = 0;
let activeOverlay = null;
let discBusy = false;
const installs = new Map();
const timers = new Set();

function toast(title, detail = '', icon = '✓') {
  const stack = $('#toast-stack');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="toast-icon">${icon}</span><div><b>${title}</b>${detail ? `<small>${detail}</small>` : ''}</div>`;
  stack.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 3200);
}

function setOverlay(name, open) {
  const el = name === 'store' ? $('#store-overlay') : name === 'disc' ? $('#disc-overlay') : null;
  if (!el) return;
  el.classList.toggle('open', open);
  el.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (open) { activeOverlay = name; } else if (activeOverlay === name) activeOverlay = null;
}

function closeOverlays() {
  setOverlay('store', false);
  setOverlay('disc', false);
  closeModal();
  activeOverlay = null;
}

function clockNow() {
  const d = new Date();
  $('#dash-time').textContent = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  $('#dash-date').textContent = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '').toUpperCase();
  if (booted && sessionStart) {
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    $('#session-clock').textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  }
}
setInterval(clockNow, 1000);
clockNow();

function selectedGame() { return GAME_BY_ID[selectedId] || GAMES[0]; }

function heroState(game) {
  if (store.isInstalled(game.id)) return { label: 'JOGAR', badge: store.hasDisc(game.id) ? 'DISC INSERIDO' : 'INSTALADO', kicker: 'CONTINUE JOGANDO' };
  if (store.isOwned(game.id)) return { label: 'INSTALAR', badge: 'NA BIBLIOTECA', kicker: 'PRONTO PARA INSTALAR' };
  return { label: game.price === 0 ? 'OBTER GRÁTIS' : 'COMPRAR', badge: 'PS STORE', kicker: 'DESTAQUE NA PS STORE' };
}

function renderDashboard() {
  const game = selectedGame();
  const hs = heroState(game);
  $('#wallet-value').textContent = store.wallet().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  $('#store-wallet-value').textContent = formatBRL(store.wallet()).replace('R$', 'R$ ');
  $('#hero-art').style.backgroundImage = `url("${game.hero}")`;
  $('#hero-title').textContent = game.title;
  $('#hero-desc').textContent = game.description;
  $('#hero-kicker').textContent = hs.kicker;
  $('#hero-badge').textContent = hs.badge;
  $('#hero-badge').classList.toggle('disc', store.hasDisc(game.id) && store.isInstalled(game.id));
  $('#hero-meta').innerHTML = `<span>${game.genre.split('/')[0].trim().toUpperCase()}</span><span>${game.players.toUpperCase()}</span><span>${game.size}</span><span>★ ${game.rating.toFixed(1)}</span>`;
  const play = $('#hero-play');
  play.textContent = hs.label;
  const idx = GAMES.findIndex((g) => g.id === game.id);
  $('#hero-index').textContent = `${String(idx + 1).padStart(2, '0')} / 05`;

  const installedCount = store.installedGames.length;
  $('#library-count').textContent = `${installedCount} de 5 instalados`;
  $('#storage-value').textContent = `${38 + installedCount * 6}%`;
  $('#storage-bar-fill').style.width = `${38 + installedCount * 6}%`;

  const rail = $('#game-rail');
  rail.innerHTML = '';
  GAMES.forEach((g) => {
    const installed = store.isInstalled(g.id);
    const btn = document.createElement('button');
    btn.className = `game-card${installed ? '' : ' locked'}${g.id === selectedId ? ' active' : ''}`;
    btn.innerHTML = `
      <div class="cover" style="background-image:url('${g.cover}')"></div>
      <div class="cover-shade"></div>
      ${store.hasDisc(g.id) ? '<span class="disc-chip">DISC</span>' : ''}
      <div class="card-meta"><div><b>${g.shortTitle}</b><small>${installed ? g.genre : 'Não instalado'}</small></div><span class="card-state">${installed ? 'JOGAR' : 'INSTALAR'}</span></div>`;
    btn.addEventListener('click', () => {
      selectedId = g.id;
      audio.click();
      if (installed) launchGame(g.id);
      else { renderDashboard(); openGameDetail(g.id); }
    });
    rail.appendChild(btn);
  });
}

function openStore(focusId = null) {
  renderStore();
  setOverlay('store', true);
  if (focusId) setTimeout(() => openGameDetail(focusId), 180);
}

function renderStore() {
  $('#store-wallet-value').textContent = formatBRL(store.wallet()).replace('R$', 'R$ ');
  const grid = $('#store-grid');
  grid.innerHTML = '';
  GAMES.forEach((g) => {
    const installed = store.isInstalled(g.id);
    const owned = store.isOwned(g.id);
    const installing = installs.has(g.id);
    const item = document.createElement('article');
    item.className = 'store-item';
    item.dataset.game = g.id;
    let action = 'Comprar';
    let cls = '';
    if (installed) { action = 'Jogar'; cls = 'owned'; }
    else if (installing) { action = `${Math.round(installs.get(g.id))}%`; cls = 'install'; }
    else if (owned) { action = 'Instalar'; cls = 'install'; }
    else if (g.price === 0) { action = 'Obter'; }
    item.innerHTML = `
      <div class="store-cover" style="background-image:url('${g.cover}')">
        ${store.hasDisc(g.id) ? '<span class="disc-chip">MÍDIA FÍSICA</span>' : `<span class="disc-chip">${g.tag}</span>`}
        <span class="rating">★ ${g.rating.toFixed(1)}</span>
      </div>
      <div class="store-body">
        <span class="tag">${g.genre.toUpperCase()}</span>
        <h4>${g.title}</h4>
        <p>${g.description.slice(0, 74)}${g.description.length > 74 ? '…' : ''}</p>
        <div class="store-buy-row">
          <span class="store-price">${g.price > 0 ? `<s>${formatBRL(g.price * 1.25)}</s>` : ''}<b>${formatBRL(g.price)}</b></span>
          <button class="store-buy ${cls}" data-buy="${g.id}" ${installing ? 'disabled' : ''}>${action}</button>
        </div>
        <div class="progress"><i data-install-progress="${g.id}" style="width:${installing ? installs.get(g.id) : installed ? 100 : 0}%"></i></div>
      </div>`;
    grid.appendChild(item);
    item.querySelector('.store-cover').addEventListener('click', () => openGameDetail(g.id));
    item.querySelector('h4').addEventListener('click', () => openGameDetail(g.id));
    item.querySelector('[data-buy]').addEventListener('click', (e) => {
      e.stopPropagation();
      if (installed) { closeOverlays(); launchGame(g.id); return; }
      purchaseOrInstall(g.id);
    });
  });
}

async function purchaseOrInstall(id) {
  const g = GAME_BY_ID[id];
  if (!g) return;
  if (!store.isOwned(id)) {
    const res = store.buy(id);
    if (!res.ok) {
      audio.error();
      toast('Saldo insuficiente', 'Adicione créditos à sua carteira para continuar.', '!');
      return;
    }
    audio.success();
    toast('Compra concluída', `${g.title} foi adicionado à sua biblioteca.`, '✓');
  }
  await startInstall(id, 'store');
}

async function startInstall(id, via = 'store', alreadyOwned = false) {
  if (installs.has(id) || store.isInstalled(id)) {
    if (store.isInstalled(id)) toast('Jogo já instalado', 'Abra a biblioteca para jogar.', 'i');
    return;
  }
  const g = GAME_BY_ID[id];
  if (!alreadyOwned && !store.isOwned(id)) {
    const res = store.buy(id);
    if (!res.ok) { audio.error(); toast('Saldo insuficiente', 'Adicione créditos à sua carteira.', '!'); return; }
  }
  installs.set(id, 0);
  renderStore();
  const total = 2200 + Math.random() * 700;
  const started = performance.now();
  const timer = setInterval(() => {
    const pct = Math.min(100, ((performance.now() - started) / total) * 100);
    installs.set(id, pct);
    $$(`[data-install-progress="${id}"]`).forEach((bar) => { bar.style.width = `${pct}%`; });
    $$(`[data-buy="${id}"]`).forEach((btn) => { if (btn.textContent.endsWith('%')) btn.textContent = `${Math.round(pct)}%`; });
    if (pct >= 100) {
      clearInterval(timer); timers.delete(timer);
      installs.delete(id);
      store.install(id, via);
      audio.success();
      toast(via === 'disc' ? 'Disco instalado' : 'Instalação concluída', `${g.title} já está pronto para jogar.`, via === 'disc' ? '◉' : '↓');
      renderDashboard();
      renderStore();
      renderDiscs();
    }
  }, 90);
  timers.add(timer);
  audio.install();
  toast('Instalando...', `${g.title} · ${g.size}`, '↓');
}

function renderDiscs() {
  const list = $('#disc-list');
  if (!list) return;
  list.innerHTML = '';
  GAMES.forEach((g) => {
    const installed = store.isInstalled(g.id);
    const item = document.createElement('button');
    item.className = `disc-item${installed ? ' installed' : ''}`;
    item.innerHTML = `
      <span class="disc-thumb" style="background-image:url('${g.cover}')"></span>
      <span class="disc-info"><b>${g.title}</b><small>${g.genre} · ${g.size}</small><em>${installed ? 'JÁ INSTALADO' : 'INSERIR DISCO'}</em></span>
      <span class="disc-action">${installed ? '▶' : '+'}</span>`;
    item.addEventListener('click', () => insertDisc(g.id));
    list.appendChild(item);
  });
  $('#disc-count').textContent = `${GAMES.length} DISPONÍVEIS`;
}

async function openDisc() {
  renderDiscs();
  setOverlay('disc', true);
  $('#disc-status').textContent = 'BANDEJA FECHADA';
}

async function insertDisc(id) {
  if (discBusy) return;
  const g = GAME_BY_ID[id];
  if (!g) return;
  discBusy = true;
  audio.click();
  $('#disc-status').textContent = 'INSERINDO DISCO...';
  $('.disc-console-mini').classList.add('inserting');
  $('#mini-disc').classList.add('visible');
  await sleep(850);
  $('#disc-status').textContent = 'LENDO MÍDIA...';
  await sleep(650);
  if (store.isInstalled(id)) {
    audio.success();
    toast('Disco reconhecido', `${g.title} já está instalado. Iniciando...`, '◉');
    $('#disc-status').textContent = 'DISC INSERIDO';
    await sleep(500);
    setOverlay('disc', false);
    discBusy = false;
    launchGame(id);
    return;
  }
  await startInstall(id, 'disc', true);
  store.insertDisc(id);
  $('#disc-status').textContent = 'DISC INSERIDO';
  $('#disc-count').textContent = `${GAMES.length} DISPONÍVEIS`;
  await sleep(400);
  $('.disc-console-mini').classList.remove('inserting');
  $('#mini-disc').classList.remove('visible');
  discBusy = false;
  renderDashboard();
  renderDiscs();
}

function openGameDetail(id) {
  const g = GAME_BY_ID[id];
  if (!g) return;
  const installed = store.isInstalled(g.id);
  const owned = store.isOwned(g.id);
  const root = $('#modal-root');
  let action = `<button class="pill-primary" data-modal-buy>${g.price === 0 ? 'Obter grátis' : `Comprar · ${formatBRL(g.price)}`}</button>`;
  if (installed) action = `<button class="pill-primary" data-modal-play>Jogar agora</button>`;
  else if (owned) action = `<button class="pill-primary" data-modal-install>Instalar · ${g.size}</button>`;
  root.innerHTML = `
    <div class="modal-card">
      <div class="modal-hero" style="background-image:url('${g.hero}')">
        <button class="close-btn modal-close" data-modal-close>✕</button>
      </div>
      <div class="modal-body">
        <span class="modal-tag">${g.kicker}</span>
        <h2>${g.title}</h2>
        <p>${g.long}</p>
        <div class="modal-meta">
          <div>GÊNERO<b>${g.genre}</b></div>
          <div>JOGADORES<b>${g.players}</b></div>
          <div>TAMANHO<b>${g.size}</b></div>
          <div>NOTA<b>★ ${g.rating.toFixed(1)} / 5</b></div>
        </div>
        <div class="modal-actions">${action}<button class="pill-ghost" data-modal-close>Voltar</button></div>
      </div>
    </div>`;
  root.classList.add('open');
  root.setAttribute('aria-hidden', 'false');
  root.querySelectorAll('[data-modal-close]').forEach((b) => b.addEventListener('click', closeModal));
  root.querySelector('[data-modal-play]')?.addEventListener('click', () => { closeModal(); launchGame(g.id); });
  root.querySelector('[data-modal-install]')?.addEventListener('click', () => { closeModal(); startInstall(g.id, 'store', true); });
  root.querySelector('[data-modal-buy]')?.addEventListener('click', () => {
    closeModal();
    purchaseOrInstall(g.id);
    setOverlay('store', true);
    renderStore();
  });
}

function closeModal() {
  const root = $('#modal-root');
  root.classList.remove('open');
  root.setAttribute('aria-hidden', 'true');
}

async function bootConsole(openDiscAfter = false) {
  if (booting) return;
  if (booted) {
    if (openDiscAfter) openDisc();
    return;
  }
  booting = true;
  audio.init();
  audio.boot();
  room.setBooted(true);
  app.classList.add('room-off');
  const overlay = $('#boot-overlay');
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  $('#boot-text').textContent = 'INICIANDO O SISTEMA';
  await sleep(1500);
  $('#boot-text').textContent = 'CARREGANDO PERFIL · PLAYER_01';
  await sleep(900);
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  booted = true;
  booting = false;
  sessionStart = Date.now();
  $('#dashboard').classList.add('active');
  $('#dashboard').setAttribute('aria-hidden', 'false');
  room.setActive(false);
  renderDashboard();
  toast('Bem-vindo, Player_01', 'Console online. Escolha um jogo para começar.', 'PS');
  if (openDiscAfter) setTimeout(() => openDisc(), 500);
}

function powerOff() {
  closeOverlays();
  $('#dashboard').classList.remove('active');
  $('#dashboard').setAttribute('aria-hidden', 'true');
  app.classList.remove('room-off');
  room.setActive(true);
  room.setBooted(false);
  booted = false;
  sessionStart = 0;
  audio.back();
  toast('Console em repouso', 'O PS5 Emulator Lab está no modo standby.', '⏻');
}

async function launchGame(id) {
  const g = GAME_BY_ID[id];
  if (!g) return;
  if (!store.isInstalled(id)) {
    openGameDetail(id);
    return;
  }
  closeOverlays();
  audio.launch();
  const overlay = $('#launch-overlay');
  $('#launch-art').style.backgroundImage = `url("${g.hero}")`;
  $('#launch-title').textContent = g.shortTitle;
  $('#launch-kicker').textContent = g.genre.toUpperCase();
  $('#launch-status').textContent = 'CARREGANDO JOGO...';
  $('#launch-bar-fill').style.width = '0%';
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  room.setActive(false);

  const loader = gameLoaders[id];
  let mod;
  try {
    mod = await loader();
  } catch (err) {
    console.error(err);
    overlay.classList.remove('active');
    toast('Falha ao iniciar', 'Não foi possível carregar o jogo.', '!');
    return;
  }
  for (let i = 0; i <= 100; i += 4) {
    $('#launch-bar-fill').style.width = `${i}%`;
    await sleep(28);
  }
  await sleep(220);
  $('#launch-status').textContent = 'PRONTO';
  await sleep(180);
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');

  const gameRoot = $('#game-root');
  gameRoot.classList.add('active');
  gameRoot.setAttribute('aria-hidden', 'false');
  gameStart = Date.now();
  currentGameId = id;
  try {
    currentGame = await mod.mount({
      root: gameRoot,
      game: g,
      onExit: () => exitGame(),
    });
  } catch (err) {
    console.error(err);
    gameRoot.classList.remove('active');
    toast('Erro no jogo', 'O jogo encontrou um erro inesperado.', '!');
    return;
  }
  $('#dashboard').classList.remove('active');
  $('#dashboard').setAttribute('aria-hidden', 'true');
}

function exitGame() {
  const seconds = gameStart ? Math.round((Date.now() - gameStart) / 1000) : 0;
  if (currentGameId) store.markPlayed(currentGameId, seconds);
  try { currentGame?.destroy?.(); } catch (err) { console.error(err); }
  currentGame = null;
  currentGameId = null;
  $('#game-root').classList.remove('active');
  $('#game-root').setAttribute('aria-hidden', 'true');
  $('#game-root').innerHTML = '';
  $('#dashboard').classList.add('active');
  $('#dashboard').setAttribute('aria-hidden', 'false');
  room.setActive(false);
  renderDashboard();
  if (seconds > 3) toast('Sessão encerrada', `Você jogou por ${Math.floor(seconds / 60)}m ${seconds % 60}s.`, '✓');
}

$('#btn-power').addEventListener('click', () => bootConsole(false));
$('#btn-disc-room').addEventListener('click', () => bootConsole(true));
$('#dash-power').addEventListener('click', powerOff);
$('#btn-sound').addEventListener('click', () => {
  const muted = audio.toggle();
  $('#btn-sound').classList.toggle('muted', muted);
  toast(muted ? 'Som desativado' : 'Som ativado', muted ? 'O console está silencioso.' : 'Áudio do sistema ativado.', muted ? '♪' : '♫');
});
$('#btn-fullscreen').addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch {}
});
$('#brand-home').addEventListener('click', (e) => {
  e.preventDefault();
  if (currentGame) return;
  if (booted) powerOff(); else bootConsole(false);
});
$('#dash-store-tab').addEventListener('click', () => openStore());
$('#dash-disc-tab').addEventListener('click', () => openDisc());
$('#side-store').addEventListener('click', () => openStore());
$('#library-store').addEventListener('click', () => openStore());
$('#dash-wallet').addEventListener('click', () => openStore());
$('#hero-play').addEventListener('click', () => {
  const g = selectedGame();
  if (store.isInstalled(g.id)) launchGame(g.id);
  else if (store.isOwned(g.id)) startInstall(g.id, 'store', true);
  else openStore(g.id);
});
$('#hero-details').addEventListener('click', () => openGameDetail(selectedId));
$('#store-add-funds').addEventListener('click', () => {
  store.addFunds(500);
  audio.success();
  toast('Créditos adicionados', 'R$ 500,00 foram adicionados à sua carteira.', '+');
  renderDashboard();
  renderStore();
});
$$('.store-tab').forEach((tab) => tab.addEventListener('click', () => {
  $$('.store-tab').forEach((t) => t.classList.remove('active'));
  tab.classList.add('active');
  const grid = $('#store-grid');
  grid.style.opacity = '.25';
  setTimeout(() => { grid.style.opacity = '1'; }, 180);
}));
$$('[data-close]').forEach((b) => b.addEventListener('click', () => {
  setOverlay(b.dataset.close, false);
  audio.back();
}));
$('#store-overlay').addEventListener('click', (e) => { if (e.target.id === 'store-overlay') setOverlay('store', false); });
$('#disc-overlay').addEventListener('click', (e) => { if (e.target.id === 'disc-overlay') setOverlay('disc', false); });
$('#modal-root').addEventListener('click', (e) => { if (e.target.id === 'modal-root') closeModal(); });

window.addEventListener('keydown', (e) => {
  if (currentGame) return;
  if (e.code === 'Escape') {
    if ($('#modal-root').classList.contains('open')) closeModal();
    else if (activeOverlay) { setOverlay(activeOverlay, false); audio.back(); }
  }
  if (e.code === 'Enter' && !booted && !booting) bootConsole(false);
});

document.addEventListener('click', (e) => {
  if (e.target.closest('button') && !e.target.closest('.touch-btn')) audio.click();
});
document.addEventListener('pointerover', (e) => {
  if (e.target.closest('button')) audio.hover();
});

store.subscribe(() => {
  if (booted) { renderDashboard(); renderStore(); }
});

renderDashboard();
renderDiscs();
setTimeout(() => {
  if (!booted) toast('PS5 Emulator Lab', 'Ligue o console ou insira um disco para começar.', 'PS');
}, 1600);

window.__ps5 = { store, bootConsole, powerOff, launchGame, openStore, openDisc, openGameDetail, room };
