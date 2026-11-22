/* Sistema PlayStation 5 — boot, perfis, dashboard, loja, biblioteca, troféus */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const GAMES = [
  { id: 'gta', title: 'GTA 5 BR', sub: 'Edição Caio · Mundo aberto brasileiro', c1: '#ff7a18', c2: '#56118d', c3: '#ffc32b', hours: 248, progress: 87, rating: '18+', installed: true, owned: true, price: 349.9, story: 'Caio sobe no crime na Cidade Caio. 50 missões, 10 bairros, uma cidade pra dominar.', character: 'CAIO BR', city: 'São Paulo · RP', music: 'funk', control: 'GTA', missions: 50, mode: 'open' },
  { id: 'fifa', title: 'FIFA BR', sub: 'Campeonato da América · Seleção Brasileira', c1: '#ffd23c', c2: '#0a5c2e', c3: '#8dffb0', hours: 96, progress: 62, rating: 'L', installed: true, owned: true, price: 299.9, story: 'Brasileirões em campo. Vence o Hexacampeonato e faz a torcida explodir.', character: 'NEYMAR BR', city: 'Estádio · Rio de Janeiro', music: 'pagode', control: 'fifa', missions: 12, mode: 'futebol' },
  { id: 'gow', title: 'GOD OF WAR BR', sub: 'Guerra nórdica no Brasil', c1: '#e8e2d8', c2: '#101820', c3: '#c9b38a', hours: 42, progress: 35, rating: '18+', installed: true, owned: true, price: 349.9, story: 'Kratos brasil é o último guerreiro. A maré do titã chega à serra.', character: 'KRATOS BR', city: 'Serra · neve', music: 'rock', control: 'gow', missions: 18, mode: 'acao' },
  { id: 'sm', title: 'SPIDER-MAN BR', sub: 'Teia urbana em São Paulo', c1: '#ff3b30', c2: '#3d0a24', c3: '#ff9d5c', hours: 54, progress: 41, rating: 'L', installed: true, owned: true, price: 299.9, story: 'Peter Parker pula o Burj no coração da cidade e caça o vilão.', character: 'PETER BR', city: 'São Paulo · arranha-céu', music: 'hiphop', control: 'ar', missions: 15, mode: 'acao' },
  { id: 'ff', title: 'FREE FIRE BR', sub: 'Battle royale na ilha', c1: '#2dff8f', c2: '#062b1a', c3: '#b6ff5c', hours: 31, progress: 28, rating: '12+', installed: true, owned: true, price: 149.9, story: 'Soldado sobe na ilha. Ser o último em pé com 50 jogadores.', character: 'SOLDADO BR', city: 'Ilha · praia', music: 'funk', control: 'tiro', missions: 20, mode: 'tiro' },
  { id: 'mc', title: 'MINECRAFT BR', sub: 'Blocos · minerada · noite', c1: '#58c24a', c2: '#12331a', c3: '#a8e06b', hours: 88, progress: 47, rating: 'L', installed: true, owned: true, price: 249.9, story: 'Steve constrói a casa na serra. A noite chega e os zumbis atacam.', character: 'STEVE BR', city: 'Serra · bloco', music: 'samba', control: 'sandbox', missions: 16, mode: 'construcao' },
  { id: 'forza', title: 'FORZA BR', sub: '350 km/h nas ruas do Brasil', c1: '#28d17c', c2: '#062d36', c3: '#b6ff5c', hours: 19, progress: 28, rating: 'L', installed: true, owned: true, price: 179.9, story: 'Piloto brasileiro domina a pista de arrancar e o drift.', character: 'PILOTO BR', city: 'Pista · Contagem', music: 'rock', control: 'f1', missions: 10, mode: 'carrera' },
  { id: 'tlou', title: 'THE LAST OF US BR', sub: 'Sobrevivência com o Joel BR', c1: '#9aa5b1', c2: '#0c1218', c3: '#7d9cb8', hours: 64, progress: 52, rating: '18+', installed: true, owned: true, price: 349.9, story: 'Joel e a filha escapam da infecção no sertão.', character: 'JOEL BR', city: 'Sertão · caatinga', music: 'trilha', control: 'survival', missions: 22, mode: 'supervivencia' },
  { id: 'fn', title: 'FORTNITE BR', sub: 'Ilha colorida · dança e construção', c1: '#7a5cff', c2: '#1c0f4d', c3: '#4fd8ff', hours: 73, progress: 66, rating: '12+', installed: true, owned: true, price: 399.9, story: 'Dançarino brasileiro pega a ilha neon e levanta a vitória.', character: 'DANCANTE BR', city: 'Ilha colorida', music: 'funk', control: 'dança', missions: 25, mode: 'acao' },
  { id: 'cod', title: 'CALL OF DUTY BR', sub: 'Operação sul-americana', c1: '#8fa3b8', c2: '#101820', c3: '#d7e6f2', hours: 112, progress: 71, rating: '18+', installed: true, owned: true, price: 349.9, story: 'Soldado BR enfrenta a opressão em campo e nas ruas.', character: 'SOLDADO BR', city: 'Campo · Heliponto', music: 'rock', control: 'tps', missions: 30, mode: 'acao' },
];

const TROPHIES = [
  { tier: 'Bronze', color: '#d0834b', icon: '🥉', count: 46, desc: 'Primeiros passos na cidade' },
  { tier: 'Prata', color: '#bcc7d8', icon: '🥈', count: 28, desc: 'Missões e desafios concluídos' },
  { tier: 'Ouro', color: '#ffd34d', icon: '🥇', count: 18, desc: 'Feitos de respeito' },
  { tier: 'Platina', color: '#7be2ff', icon: '🏆', count: 7, desc: 'Domínio total do mundo aberto' },
  { tier: 'Diamante', color: '#c99bff', icon: '💎', count: 1, desc: 'Lenda do GTA 5 BR' },
];

const FRIENDS = [
  { name: 'LUCAS', status: 'Jogando GTA 5 BR', online: true, c1: '#ff9b3d', c2: '#a23cff' },
  { name: 'MARIA', status: 'Na festa da favela', online: true, c1: '#ff54c8', c2: '#6f2cff' },
  { name: 'PEDRINHO', status: 'Corrida BR — 1º lugar', online: true, c1: '#3ad7ff', c2: '#0758b8' },
  { name: 'JULIA', status: 'No cinema do shopping', online: true, c1: '#ffd44e', c2: '#e06b18' },
  { name: 'THIAGO', status: 'Online no PS5', online: true, c1: '#55ff9d', c2: '#087a48' },
  { name: 'ANA', status: 'Offline há 2 horas', online: false, c1: '#b8c6da', c2: '#5d6b82' },
  { name: 'GUSTAVO', status: 'Offline ontem', online: false, c1: '#ff7d7d', c2: '#8e1c2c' },
];

const PROFILE_DEFAULTS = {
  caio: { key: 'caio', name: 'CAIO BR', level: 50, trophies: 100, initial: 'C', color: 'linear-gradient(145deg,#ff9846,#8f34ff)', age: 20, team: 'Corinthians', city: 'São Paulo' },
  lucas: { key: 'lucas', name: 'LUCAS', level: 22, trophies: 34, initial: 'L', color: 'linear-gradient(145deg,#31c9ff,#0752b8)', age: 24, team: 'Flamengo', city: 'Rio de Janeiro' },
  maria: { key: 'maria', name: 'MARIA', level: 37, trophies: 71, initial: 'M', color: 'linear-gradient(145deg,#ff58ce,#7c2cff)', age: 22, team: 'Palmeiras', city: 'Santos' },
};

export class PS5System {
  constructor(audio, onPlay) {
    this.audio = audio;
    this.onPlay = onPlay;
    this.profile = PROFILE_DEFAULTS.caio;
    this.selectedGame = 0;
    this.owned = new Set(GAMES.filter(g => g.owned).map(g => g.id));
    this.downloads = {};
    this.downloadTimer = null;
    this.currentGameId = GAMES[0].id;
    this.currentGame = GAMES[0];
    this.scale = { gameId: GAMES[0].id, level: 1 };
    this.settings = {
      brightness: 100, volume: 65, language: 'Português (Brasil)', playstyle: 'Ação e aventura',
      buttonSize: 100, sensitivity: 100, vibration: true, quality: 'high', controlMode: 'gta',
      perfMode: 'auto', fpsCap: 60, resolution: 100, viewDist: 'far', showFps: true
    };
    this.stars = [];
    this.particles = [];
    this.booted = false;
    this.spaceAnim = 0;
    this.profiles = { ...PROFILE_DEFAULTS };
    this._loadLocal();
    if (!this.hasSavedSettings) {
      const touch = matchMedia('(pointer: coarse)').matches || innerWidth < 900;
      if (touch) {
        this.settings.quality = 'medium';
        this.settings.buttonSize = 105;
      }
    }
    this._initSpace();
    this._bind();
    this._renderCarousel();
    this._startLoop();
    this._updateClock();
    setInterval(() => this._updateClock(), 20000);
  }

  _loadLocal() {
    try {
      const raw = localStorage.getItem('gta5br_ps5');
      if (raw) {
        this.hasSavedSettings = true;
        const data = JSON.parse(raw);
        if (data.settings) this.settings = { ...this.settings, ...data.settings };
        if (data.profiles) this.profiles = { ...this.profiles, ...data.profiles };
        if (data.owned) this.owned = new Set(data.owned);
        if (data.scale) this.scale = { ...this.scale, ...data.scale };
      }
      const custom = localStorage.getItem('gta5br_custom_profile');
      if (custom) {
        const p = JSON.parse(custom);
        this.profiles[p.key] = p;
        this._appendCustomProfile(p);
      }
    } catch {}
  }

  _saveLocal() {
    try {
      localStorage.setItem('gta5br_ps5', JSON.stringify({ settings: this.settings, owned: [...this.owned], profiles: this.profiles, scale: this.scale }));
    } catch {}
  }

  _initSpace() {
    this.space = $('#space-bg');
    this.sctx = this.space.getContext('2d');
    for (let i = 0; i < 240; i++) {
      this.stars.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.5 + .3, a: Math.random(), s: Math.random() * .02 + .002 });
    }
    for (let i = 0; i < 55; i++) {
      this.particles.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + .5, vx: (Math.random() - .5) * .0004, vy: -Math.random() * .00025, a: Math.random() * .6 + .2 });
    }
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.animationDuration = (6 + Math.random() * 12) + 's';
      p.style.animationDelay = (-Math.random() * 15) + 's';
      p.style.width = p.style.height = (1 + Math.random() * 3) + 'px';
      $('#dashParticles')?.appendChild(p);
    }
  }

  _startLoop() {
    const draw = () => {
      this.spaceAnim++;
      const c = this.sctx;
      if (!c) return;
      const w = this.space.width = innerWidth;
      const h = this.space.height = innerHeight;
      c.clearRect(0, 0, w, h);
      const g = c.createRadialGradient(w * .7, h * .28, 0, w * .7, h * .28, Math.max(w, h) * .8);
      g.addColorStop(0, 'rgba(18,68,150,.24)');
      g.addColorStop(.42, 'rgba(9,25,66,.16)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      const g2 = c.createRadialGradient(w * .25, h * .72, 0, w * .25, h * .72, Math.max(w, h) * .6);
      g2.addColorStop(0, 'rgba(85,25,130,.14)');
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g2; c.fillRect(0, 0, w, h);
      for (const s of this.stars) {
        s.a += s.s;
        const alpha = .2 + Math.abs(Math.sin(s.a)) * .75;
        c.fillStyle = `rgba(200,225,255,${alpha})`;
        c.beginPath(); c.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2); c.fill();
      }
      for (const p of this.particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.x < -.02) p.x = 1.02; if (p.x > 1.02) p.x = -.02;
        c.fillStyle = `rgba(90,180,255,${p.a})`;
        c.shadowColor = '#3ba9ff'; c.shadowBlur = 8;
        c.beginPath(); c.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2); c.fill();
        c.shadowBlur = 0;
      }
      requestAnimationFrame(draw);
    };
    draw();
  }

  _bind() {
    $('#powerBtn')?.addEventListener('click', () => this.boot());
    $('#profilePower')?.addEventListener('click', () => { this.audio.powerOff(); this.shutdown(); });
    $$('.profile-card[data-profile]').forEach(card => {
      card.addEventListener('click', () => {
        const key = card.dataset.profile;
        this.audio.click();
        this.selectProfile(key);
      });
      card.addEventListener('mouseenter', () => this.audio.hover());
    });
    $('#createProfile')?.addEventListener('click', () => this.openCreateProfile());
    $('#playGame')?.addEventListener('click', () => this.launchGame());
    $$('#dashMenu button').forEach(btn => {
      btn.addEventListener('click', () => this.openMenu(btn.dataset.menu));
      btn.addEventListener('mouseenter', () => this.audio.hover());
    });
    $$('.sys-btn').forEach(btn => btn.addEventListener('click', () => this.openMenu(btn.dataset.open)));
    $('#modalClose')?.addEventListener('click', () => this.closeModal());
    $('#ps5-modal')?.addEventListener('click', (e) => { if (e.target.id === 'ps5-modal') this.closeModal(); });
    $('#wakeBtn')?.addEventListener('click', () => {
      this.audio.boot(); $('#sleep-screen').classList.remove('open');
    });
    addEventListener('keydown', (e) => this._key(e));
    addEventListener('resize', () => {});
    // carousel drag / swipe
    const car = $('#gameCarousel');
    if (car) {
      let sx = 0;
      car.addEventListener('pointerdown', e => { sx = e.clientX; });
      car.addEventListener('pointerup', e => {
        const dx = e.clientX - sx;
        if (Math.abs(dx) > 35) this.selectGame(this.selectedGame + (dx < 0 ? 1 : -1));
      });
    }
    $$('#gameScale [data-scale]').forEach(b => b.addEventListener('click', () => this.scaleGame(+b.dataset.scale)));
  }

  _key(e) {
    if (!$('#dashboard')?.classList.contains('active')) return;
    if ($('#ps5-modal')?.classList.contains('open')) { if (e.key === 'Escape') this.closeModal(); return; }
    if (e.key === 'ArrowRight') { this.selectGame(this.selectedGame + 1); this.audio.click(); }
    if (e.key === 'ArrowLeft') { this.selectGame(this.selectedGame - 1); this.audio.click(); }
    if (e.key === 'Enter') { this.audio.click(); this.launchGame(); }
  }

  boot() {
    if (this.booted) return;
    this.audio.init();
    this.audio.boot();
    if (navigator.vibrate) navigator.vibrate([40, 80, 120]);
    this.booted = true;
    $('#bootStatus').innerHTML = 'Ligando o PlayStation 5...';
    $('.boot-progress')?.classList.add('show');
    const bar = $('.boot-progress i');
    const messages = ['Verificando sistema...', 'Carregando perfil...', 'Conectando ao controle DualSense...', 'Tudo pronto.'];
    let p = 0, mi = 0;
    const timer = setInterval(() => {
      p += Math.random() * 14 + 6;
      if (bar) bar.style.width = Math.min(100, p) + '%';
      if (p > (mi + 1) * 24 && mi < messages.length - 1) {
        mi++;
        $('#bootStatus').textContent = messages[mi];
      }
      if (p >= 100) {
        clearInterval(timer);
        setTimeout(() => this.showProfiles(), 650);
      }
    }, 430);
  }

  showProfiles() {
    $$('.ps5-screen').forEach(s => s.classList.remove('active'));
    $('#profile-screen').classList.add('active');
    $('#bootStatus').textContent = 'Pressione X ou toque para ligar';
    $('.boot-progress')?.classList.remove('show');
    setTimeout(() => { const b = $('.boot-progress i'); if (b) b.style.width = '0'; }, 800);
    this.booted = false;
  }

  selectProfile(key) {
    this.profile = this.profiles[key] || PROFILE_DEFAULTS.caio;
    $('#dashName').textContent = this.profile.name;
    $('#dashLevel').textContent = this.profile.level || 50;
    $('#dashTrophies').textContent = this.profile.trophies || 100;
    const av = $('#dashAvatar');
    av.textContent = this.profile.initial || this.profile.name[0];
    av.style.background = this.profile.color || PROFILE_DEFAULTS.caio.color;
    $$('.ps5-screen').forEach(s => s.classList.remove('active'));
    $('#dashboard').classList.add('active');
    this._renderCarousel();
    this._updateGameInfo();
    this.audio.startMusic();
    this.audio.setGenre('funk');
  }

  _renderCarousel() {
    const car = $('#gameCarousel');
    if (!car) return;
    car.innerHTML = '';
    GAMES.forEach((g, i) => {
      const btn = document.createElement('button');
      btn.className = 'cover' + (i === this.selectedGame ? ' selected' : '');
      btn.dataset.index = i;
      btn.style.setProperty('--c1', g.c1);
      btn.style.setProperty('--c2', g.c2);
      btn.style.setProperty('--c3', g.c3);
      btn.innerHTML = `<div class="art"><div class="sun"></div><div class="skyline"></div></div>
        <span class="rating">${g.rating}</span>
        <span class="cover-txt">${g.title}</span><span class="cover-sub">${g.sub}</span>`;
      btn.addEventListener('click', () => { this.selectGame(i); this.audio.click(); });
      car.appendChild(btn);
    });
    this._layoutCarousel();
  }

  _layoutCarousel() {
    const covers = $$('.cover', $('#gameCarousel'));
    covers.forEach((c, i) => {
      let off = i - this.selectedGame;
      if (off > 3) off -= GAMES.length; if (off < -3) off += GAMES.length;
      const abs = Math.abs(off);
      c.style.transform = `translateX(${off * 118}px) translateZ(${-abs * 140}px) rotateY(${off * -26}deg) scale(${off === 0 ? 1.08 : .94})`;
      c.style.zIndex = 20 - abs;
      c.style.opacity = abs > 2 ? 0 : 1;
      c.style.pointerEvents = abs > 2 ? 'none' : 'auto';
      c.classList.toggle('selected', off === 0);
    });
  }

  selectGame(index) {
    this.selectedGame = (index + GAMES.length) % GAMES.length;
    this.currentGameId = GAMES[this.selectedGame].id;
    this.currentGame = GAMES[this.selectedGame];
    this._layoutCarousel();
    this._updateGameInfo();
  }

  _updateGameInfo() {
    const g = GAMES[this.selectedGame];
    if (!g) return;
    $('#infoTitle').textContent = g.title;
    $('#infoSub').textContent = g.sub;
    $('#infoHours').textContent = g.hours;
    $('#infoProgress').textContent = g.progress + '%';
    $('#playGame').innerHTML = g.id === 'gta' ? '<span class="play-tri">▶</span> JOGAR' : (this.owned.has(g.id) ? '<span class="play-tri">▶</span> JOGAR' : '<span class="play-tri">◈</span> COMPRAR');
    $('#playGame').dataset.mode = this.owned.has(g.id) ? 'play' : 'buy';
    const sv = $('#gsValue');
    if (sv) sv.textContent = `Nível ${this.scale.level} · ${['Pequeno', 'Médio', 'Gigantão'][this.scale.level - 1] || 'Pequeno'} · ${g.title}`;
  }

  scaleGame(level) {
    const g = this.currentGame;
    const target = Math.max(1, Math.min(3, Math.floor(level || 1)));
    const game = window.app?.game;
    const weakPhone = game ? (game.perfMode === 'weak' || game.perfMode === 'auto') : false;
    if (target > 2 && weakPhone) {
      this.toast('Não dá pra escalar para Gigantão no celular fraco, fica no Médio.');
      this.scale = { gameId: g.id, level: 2 };
      this._saveLocal();
      if (sv) sv.textContent = 'Nível 2 · Médio';
      return;
    }
    this.scale = { gameId: g.id, level: target };
    this._saveLocal();
    if (game?.applyScale) game.applyScale(target, g.id);
    const names = ['Pequeno', 'Médio', 'Gigantão'];
    if (window.app?.game?.ui?.toast) window.app.game.ui.toast(`📈 ${g.title} escalado: Nível ${target} · ${names[target - 1]}`);
    this.audio.click();
  }

  launchGame() {
    const g = GAMES[this.selectedGame];
    if (g.id !== 'gta' && !this.owned.has(g.id)) { this.openMenu('loja'); return; }
    this.currentGameId = g.id;
    this.currentGame = g;
    this._saveLocal();
    this.audio.init();
    this.audio.cash();
    this.audio.speak(`Bem-vindo ao ${g.title}, edição ${g.character}. A aventura é sua.`);
    $('#ps5-layer').classList.add('off');
    document.body.classList.add('in-game');
    $('#game-ui').classList.remove('hidden');
    setTimeout(() => this.onPlay(this.profile), 380);
  }

  returnToPS5() {
    $('#ps5-layer').classList.remove('off');
    document.body.classList.remove('in-game');
    $('#game-ui').classList.add('hidden');
    $$('.ps5-screen').forEach(s => s.classList.remove('active'));
    $('#dashboard').classList.add('active');
    this.audio.stopEngine();
    this.audio.sirenStop();
    this.audio.setGenre('funk');
    this.audio.startMusic();
    this._renderCarousel();
  }

  shutdown() {
    $('#ps5-layer').classList.remove('off');
    $$('.ps5-screen').forEach(s => s.classList.remove('active'));
    $('#boot-screen').classList.add('active');
    this.audio.stopMusic();
    this.booted = false;
    document.body.classList.remove('in-game');
    $('#game-ui').classList.add('hidden');
    const b = $('.boot-progress i'); if (b) b.style.width = '0';
    $('#bootStatus').innerHTML = 'Pressione <b>X</b> ou toque para ligar';
  }

  _updateClock() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const el = $('#dashClock'); if (el) el.textContent = `${hh}:${mm}`;
    const gc = $('#gameClock'); if (gc) gc.textContent = `${hh}:${mm}`;
  }

  toast(text) {
    let t = $('#ps5Toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'ps5Toast';
      t.style.cssText = 'position:absolute;left:50%;bottom:12%;transform:translateX(-50%);z-index:60;background:rgba(10,20,40,.95);border:1px solid rgba(100,180,255,.35);padding:10px 20px;border-radius:20px;font-size:11px;color:#e8f4ff;box-shadow:0 10px 30px rgba(0,0,0,.5);transition:.3s;opacity:0;pointer-events:none;';
      $('#ps5-layer').appendChild(t);
    }
    t.textContent = text; t.style.opacity = 1;
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.style.opacity = 0, 2800);
  }

  openModal(html) {
    $('#modalContent').innerHTML = html;
    $('#ps5-modal').classList.add('open');
    $('#modalPanel').scrollTop = 0;
    $$('.modal-panel button, .modal-panel input, .modal-panel select').forEach(b => {
      b.addEventListener('mouseenter', () => this.audio.hover());
    });
  }

  closeModal() {
    $('#ps5-modal').classList.remove('open');
    this.audio.click();
  }

  openMenu(menu) {
    this.audio.click();
    if (menu === 'desligar') { this.shutdown(); return; }
    if (menu === 'descanso') { $('#sleep-screen').classList.add('open'); return; }
    if (menu === 'config') { this.renderSettings(); return; }
    if (menu === 'loja') { this.renderStore(); return; }
    if (menu === 'biblioteca' || menu === 'jogos') { this.renderLibrary(menu); return; }
    if (menu === 'trofeus') { this.renderTrophies(); return; }
    if (menu === 'amigos') { this.renderFriends(); return; }
    if (menu === 'midia') { this.renderMedia(); return; }
    if (menu === 'comunidade') { this.renderCommunity(); return; }
    if (menu === 'search') { this.renderSearch(); return; }
  }

  _header(kicker, title, sub) {
    return `<div class="modal-heading">${kicker}</div><h2 class="modal-title">${title}</h2><p class="modal-sub">${sub}</p>`;
  }

  renderLibrary(menu = 'biblioteca') {
    const installed = GAMES.filter(g => this.owned.has(g.id));
    const cards = installed.map(g => `<button class="store-card" data-lib="${g.id}">
      <div class="store-cover" style="--c1:${g.c1};--c2:${g.c2}"><span>${g.rating}</span><b>${g.title}</b></div>
      <div class="store-body"><h4>${g.title}</h4><p>${g.sub}</p><span class="store-price">${g.hours} h jogadas · ${g.progress}%</span><button class="buy-btn ${g.id === 'gta' ? '' : 'done'}">${g.id === 'gta' ? 'JOGAR AGORA' : 'INSTALADO'}</button></div>
    </button>`).join('');
    this.openModal(`${this._header(menu === 'jogos' ? 'TODOS OS JOGOS' : 'SUA BIBLIOTECA', menu === 'jogos' ? 'Jogos' : 'Biblioteca', `${installed.length} jogos salvos · progresso sincronizado`)}
      <div class="library-grid">${cards}</div>`);
    $$('[data-lib]').forEach(card => card.addEventListener('click', (e) => {
      if (e.target.closest('.buy-btn') || card.dataset.lib === 'gta') {
        this.selectGame(GAMES.findIndex(g => g.id === card.dataset.lib));
        this.closeModal(); this.launchGame();
      }
    }));
  }

  renderStore() {
    const cards = GAMES.map(g => {
      const owned = this.owned.has(g.id);
      const dl = this.downloads[g.id];
      return `<div class="store-card">
        <div class="store-cover" style="--c1:${g.c1};--c2:${g.c2}"><span>${g.rating}</span><b>${g.title}</b></div>
        <div class="store-body"><h4>${g.title}</h4><p>${g.sub}</p><span class="store-price">${owned ? 'Adquirido' : 'R$ ' + g.price.toFixed(2).replace('.', ',')}</span>
        ${owned ? `<button class="buy-btn done">${dl !== undefined ? 'BAIXANDO...' : 'INSTALADO'}</button>` : `<button class="buy-btn" data-buy="${g.id}">COMPRAR</button>`}
        ${dl !== undefined ? `<div class="dl-bar"><i style="width:${dl}%"></i></div><div class="dl-txt" data-dltxt="${g.id}">${dl}% · baixando</div>` : ''}</div>
      </div>`;
    }).join('');
    this.openModal(`${this._header('PLAYSTATION STORE', 'Loja', 'Jogos em destaque · pagamento em R$ · download instantâneo')}
      <div class="store-grid">${cards}</div>`);
    $$('[data-buy]').forEach(b => b.addEventListener('click', () => this.buyGame(b.dataset.buy)));
  }

  buyGame(id) {
    if (this.owned.has(id)) return;
    const g = GAMES.find(x => x.id === id);
    this.owned.add(id);
    this.downloads[id] = 0;
    this.audio.cash();
    this.toast(`${g.title} comprado! Iniciando download...`);
    this._saveLocal();
    this.renderStore();
    if (!this.downloadTimer) {
      this.downloadTimer = setInterval(() => {
        let active = false;
        for (const gid of Object.keys(this.downloads)) {
          const d = this.downloads[gid];
          if (d < 100) {
            this.downloads[gid] = Math.min(100, d + 2 + Math.random() * 6);
            active = true;
            const bar = document.querySelector(`[data-dltxt="${gid}"]`);
            if (bar) {
              bar.textContent = `${Math.floor(this.downloads[gid])}% · baixando`;
              bar.previousElementSibling.firstElementChild.style.width = this.downloads[gid] + '%';
            }
          }
        }
        if (!active) { clearInterval(this.downloadTimer); this.downloadTimer = null; }
      }, 350);
    }
  }

  renderTrophies() {
    const cards = TROPHIES.map(t => `<div class="trophy-card"><div class="trophy-medal" style="color:${t.color};border-color:${t.color}">${t.icon}</div><h4>${t.tier}</h4><p>${t.count} conquistados</p><p>${t.desc}</p></div>`).join('');
    this.openModal(`${this._header('SEUS FEITOS', 'Troféus', 'Bronze · Prata · Ouro · Platina · Diamante')}
      <div class="trophy-grid">${cards}</div>
      <div style="margin-top:24px;padding:18px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.03)">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#91a9ca"><span>Nível do perfil</span><b style="color:#ffd34d">50</b></div>
        <div class="dl-bar" style="height:8px;margin-top:9px"><i style="width:87%"></i></div>
        <div style="font-size:9px;color:#6883a8;margin-top:5px">87% para o próximo nível</div>
      </div>`);
  }

  renderFriends() {
    const rows = FRIENDS.map(f => `<div class="friend-row"><div class="friend-avatar" style="--c1:${f.c1};--c2:${f.c2}">${f.name[0]}</div><div class="friend-info"><b>${f.name}</b><span>${f.status}</span></div><span class="friend-status ${f.online ? '' : 'off'}">${f.online ? '● ONLINE' : '○ OFFLINE'}</span>${f.online ? `<button class="invite-btn" data-invite="${f.name}">CONVIDAR</button>` : ''}</div>`).join('');
    this.openModal(`${this._header('REDE PLAYSTATION', 'Amigos', '5 amigos online agora · convide para jogar GTA 5 BR')}
      <div>${rows}</div>
      <div style="margin-top:16px;font-size:10px;color:#7e96b8">Sua sessão: <b style="color:#7dffab">GTA 5 BR · Mundo aberto</b> · Convite aberto</div>`);
    $$('[data-invite]').forEach(b => b.addEventListener('click', () => {
      b.textContent = 'CONVITE ENVIADO'; b.classList.add('done');
      this.audio.click(); this.toast(`Convite enviado para ${b.dataset.invite}!`);
    }));
  }

  renderSettings() {
    const s = this.settings;
    this.openModal(`${this._header('SISTEMA', 'Configurações', 'Ajustes do console e do jogo · Português (Brasil)')}
      <div class="settings-list">
        <label>Brilho <input type="range" min="50" max="130" value="${s.brightness}" data-set="brightness"></label>
        <label>Som do sistema <input type="range" min="0" max="100" value="${s.volume}" data-set="volume"></label>
        <label>Idioma <select data-set="language"><option>Português (Brasil)</option></select></label>
        <label>Como você joga <select data-set="playstyle"><option>Ação e aventura</option><option>Exploração</option><option>Corrida</option><option>História</option></select></label>
        <label>Tamanho dos botões <input type="range" min="70" max="140" value="${s.buttonSize}" data-set="buttonSize"></label>
        <label>Sensibilidade <input type="range" min="20" max="200" value="${s.sensitivity}" data-set="sensitivity"></label>
        <label>Vibração do controle <input type="checkbox" ${s.vibration ? 'checked' : ''} data-set="vibration"></label>
        <label>Qualidade gráfica <select data-set="quality"><option value="high" ${s.quality === 'high' ? 'selected' : ''}>Alta</option><option value="medium" ${s.quality === 'medium' ? 'selected' : ''}>Média</option><option value="low" ${s.quality === 'low' ? 'selected' : ''}>Baixa</option></select></label>
        <label>Modo de controle <select data-set="controlMode"><option value="gta" ${s.controlMode === 'gta' ? 'selected' : ''}>Completo GTA</option><option value="tutorial" ${s.controlMode === 'tutorial' ? 'selected' : ''}>Simples Tutorial</option><option value="dualsense" ${s.controlMode === 'dualsense' ? 'selected' : ''}>Controle PS5 na tela</option></select></label>
        <div class="perf-block">
          <div class="perf-title">DESEMPENHO · MÓDULO CELULAR</div>
          <div class="perf-modes">
            <button class="menu-btn" data-perf="weak">MODO CELULAR FRACO</button>
            <button class="menu-btn" data-perf="medium">MODO CELULAR MÉDIO</button>
            <button class="menu-btn" data-perf="good">MODO CELULAR BOM</button>
            <button class="menu-btn" data-perf="auto">MODO AUTOMÁTICO</button>
          </div>
          <label>Qualidade gráfica <select data-set="quality"><option value="high" ${s.quality === 'high' ? 'selected' : ''}>Alta</option><option value="medium" ${s.quality === 'medium' ? 'selected' : ''}>Média</option><option value="low" ${s.quality === 'low' ? 'selected' : ''}>Baixa</option><option value="ultra" ${s.quality === 'ultra' ? 'selected' : ''}>Ultra</option></select></label>
          <label>Placa FPS <select data-set="fpsCap"><option value="60" ${Number(s.fpsCap || 60) >= 60 ? 'selected' : ''}>60 FPS</option><option value="30" ${Number(s.fpsCap || 60) < 60 ? 'selected' : ''}>30 FPS</option></select></label>
          <label>Resolução <select data-set="resolution"><option value="100" ${Number(s.resolution ?? 100) >= 99 ? 'selected' : ''}>100%</option><option value="75" ${Number(s.resolution ?? 100) < 99 ? 'selected' : ''}>75%</option><option value="50" ${Number(s.resolution ?? 100) < 75 ? 'selected' : ''}>50%</option></select></label>
          <label>Distância de visão <select data-set="viewDist"><option value="far" ${s.viewDist === 'far' ? 'selected' : ''}>Longe</option><option value="mid" ${s.viewDist === 'mid' ? 'selected' : ''}>Médio</option><option value="near" ${s.viewDist === 'near' ? 'selected' : ''}>Perto</option></select></label>
        </div>
        </div>`);
    $$('#ps5-modal [data-perf]').forEach(b => b.addEventListener('click', () => { const g = window.app?.game; if (g?.applyPerformance) g.applyPerformance(b.dataset.perf); else if (this.applyPerformance) this.applyPerformance(b.dataset.perf); }));
    $$('[data-set]').forEach(input => {
      input.addEventListener('input', () => {
        const key = input.dataset.set;
        this.settings[key] = input.type === 'checkbox' ? input.checked : (input.type === 'range' ? +input.value : input.value);
        if (key === 'volume') this.audio.setVolume(this.settings.volume / 100);
        this.applySettings();
        this._saveLocal();
      });
    });
  }

  applySettings() {
    const s = this.settings;
    document.body.classList.toggle('brightness-low', s.brightness < 80);
    document.body.classList.toggle('brightness-high', s.brightness > 115);
    this.audio.setVolume(s.volume / 100);
    document.documentElement.style.setProperty('--ctrl-scale', s.buttonSize / 100);
    window.dispatchEvent(new CustomEvent('gta-settings', { detail: s }));
  }

  renderMedia() {
    const ownedCount = this.owned.size;
    const covers = GAMES.map((g, i) => {
      const owned = this.owned.has(g.id);
      return `<div class="phys ${owned ? 'owned' : 'locked'}" data-phys="${g.id}" data-idx="${i}">
        <div class="phys-front">
          <div class="phys-art" style="--c1:${g.c1};--c2:${g.c2}"><span class="phys-rating">${g.rating}</span><b>${g.title}</b><span class="phys-price">R$ ${g.price.toFixed(2).replace('.', ',')}</span></div>
          <div class="phys-barcode"></div>
          <div class="phys-name">${g.title}</div>
        </div>
        <div class="phys-back"><b>${g.title}</b><p>${g.story}</p></div>
      </div>`;
    }).join('');
    this.openModal(`${this._header('MÍDIA FÍSICA', 'Capinhas de PS5', `Capinhas físicas na sua coleção: ${ownedCount}/10`)}
      <div class="shelf" id="physShelf">
        ${covers}
      </div>
      <div class="phys-actions">
        <button class="menu-btn" id="physBuy">COMPRAR MÍDIA FÍSICA</button>
        <button class="menu-btn" id="physCollect">COLECIONAR</button>
      </div>
      <div class="phys-count" id="physCount">Coleção: <b>${ownedCount}/10</b> · ${GAMES.length} capinhas PS5 Blue</div>`);
    $$('#ps5-modal [data-phys]').forEach(card => card.addEventListener('click', (e) => {
      const g = GAMES[Number(card.dataset.idx)];
      if (!g || !this.owned.has(g.id)) { this.toast(`${g?.title || 'Jogo'} não está na sua coleção.`); return; }
      this.audio.click();
      this.slidePhysical(card, g);
    }));
    $('#physBuy')?.addEventListener('click', () => {
      const g = this.currentGame;
      this.buyGame(g.id);
      this.toast(`Capinha física de ${g.title} comprada!`);
    });
    $('#physCollect')?.addEventListener('click', () => this.renderCollection());
  }

  renderCollection() {
    const ownedCount = this.owned.size;
    const cards = GAMES.map((g, i) => {
      const owned = this.owned.has(g.id);
      const colors = [g.c1, g.c2];
      return `<div class="store-card ${owned ? '' : 'locked'}"><div class="store-cover" style="--c1:${g.c1};--c2:${g.c2}"><span>${g.rating}</span><b>${g.title}</b></div><div class="store-body"><h4>${g.title}</h4><p>${g.sub}</p><span class="store-price">${owned ? 'Capinha na coleção' : 'R$ ' + g.price.toFixed(2).replace('.', ',')} · falta comprar'}</span><button class="buy-btn ${owned ? 'done' : ''}">${owned ? 'TEM A CAPINHA' : 'COMPRAR'}</button></div></div>`;
    }).join('');
    this.openModal(`${this._header('COLEÇÃO', 'Capinhas Físicas PS5', `Você tem ${ownedCount} de ${GAMES.length} capinhas físicas`)}
      <div class="library-grid">${cards}</div>
      <div class="phys-count" style="margin-top:18px">Progresso da coleção: <b>${ownedCount}/${GAMES.length}</b></div>`);
  }

  slidePhysical(card, g) {
    card.classList.add('out');
    setTimeout(() => {
      const idx = GAMES.findIndex(x => x.id === g.id);
      this.closeModal();
      this.selectGame(idx);
      this.launchGame();
    }, 750);
  }

  renderCommunity() {
    this.openModal(`${this._header('COMUNIDADE', 'Comunidade', 'O que o Brasil está jogando')}
      <div class="store-grid">
        ${[['CAIO BR', 'Acabei de achar o segredo do morro!', '2 min'], ['LUCAS', 'Quem quer corrida na favela?', '12 min'], ['MARIA', 'Pôr do sol na praia tá surreal', '35 min'], ['PEDRINHO', '6 estrelas e vivo. Respeita.', '1 h']].map(p => `<div class="store-card"><div class="store-body"><h4>${p[0]}</h4><p style="color:#dbe8ff;font-size:11px">${p[1]}</p><span class="store-price" style="font-size:8px;color:#6f88ab">${p[2]} · GTA 5 BR</span></div></div>`).join('')}
      </div>`);
  }

  renderSearch() {
    this.openModal(`${this._header('PESQUISA', 'Pesquisar', 'Jogos, amigos e conteúdo')}
      <div class="search-box"><input id="psSearchInput" placeholder="Digite o que procura..." autofocus><button class="menu-btn" style="padding:10px 18px">BUSCAR</button></div>
      <div class="search-results" id="searchResults">Sugestões: GTA 5 BR · Favela Kings · Corrida BR · Amigos online · Troféus</div>`);
    const input = $('#psSearchInput');
    input?.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      const res = GAMES.filter(g => g.title.toLowerCase().includes(q) || g.sub.toLowerCase().includes(q));
      $('#searchResults').innerHTML = q ? (res.length ? res.map(g => `<b>${g.title}</b> — ${g.sub}`).join('<br>') : 'Nenhum resultado encontrado.') : 'Sugestões: GTA 5 BR · Favela Kings · Corrida BR · Amigos online · Troféus';
    });
    input?.focus();
  }

  openCreateProfile() {
    this.audio.click();
    this.openModal(`${this._header('NOVO PERFIL', 'Criar perfil', 'Monte seu jogador do jeito que quiser')}
      <div class="create-form" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:620px">
        <label style="grid-column:1/-1;font-size:10px;color:#9bb3d4">Escolha sua foto
          <div id="avatarChoices" style="display:flex;gap:10px;margin-top:8px">
            ${['C','L','M','J','A','R'].map((c,i) => `<button data-avatar="${c}" class="profile-avatar plus" style="width:54px;height:54px;font-size:22px;background:${['linear-gradient(145deg,#ff9846,#8f34ff)','linear-gradient(145deg,#3ad7ff,#0758b8)','linear-gradient(145deg,#ff58ce,#7c2cff)','linear-gradient(145deg,#55ff9d,#087a48)','linear-gradient(145deg,#ffd44e,#e06b18)','linear-gradient(145deg,#ff7d7d,#8e1c2c)'][i]}">${c}</button>`).join('')}
          </div>
        </label>
        <label style="font-size:10px;color:#9bb3d4">Nome <input id="newName" maxlength="14" placeholder="SEU NOME" style="width:100%;margin-top:6px;padding:9px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff"></label>
        <label style="font-size:10px;color:#9bb3d4">Idade <input id="newAge" type="number" min="8" max="99" value="20" style="width:100%;margin-top:6px;padding:9px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff"></label>
        <label style="font-size:10px;color:#9bb3d4">Time <select id="newTeam" style="width:100%;margin-top:6px;padding:9px;border-radius:8px;background:#132342;border:1px solid rgba(255,255,255,.15);color:#fff"><option>Corinthians</option><option>Flamengo</option><option>Palmeiras</option><option>São Paulo</option><option>Santos</option><option>Grêmio</option><option>Sem time</option></select></label>
        <label style="font-size:10px;color:#9bb3d4">Cidade <select id="newCity" style="width:100%;margin-top:6px;padding:9px;border-radius:8px;background:#132342;border:1px solid rgba(255,255,255,.15);color:#fff"><option>São Paulo</option><option>Rio de Janeiro</option><option>Santos</option><option>Salvador</option><option>Belo Horizonte</option><option>Curitiba</option><option>Recife</option><option>Fortaleza</option></select></label>
        <button id="createSubmit" class="play-btn" style="grid-column:1/-1;margin-top:8px;justify-content:center">CRIAR PERFIL E JOGAR</button>
      </div>`);
    let avatar = 'C';
    $$('[data-avatar]').forEach(b => b.addEventListener('click', () => {
      avatar = b.dataset.avatar;
      $$('[data-avatar]').forEach(x => x.style.outline = '');
      b.style.outline = '3px solid #7dd0ff';
      this.audio.click();
    }));
    $('#createSubmit')?.addEventListener('click', () => {
      const name = ($('#newName').value || 'JOGADOR').toUpperCase().slice(0, 14);
      const p = {
        key: 'custom', name, initial: avatar, level: 1, trophies: 0,
        age: +$('#newAge').value || 20, team: $('#newTeam').value, city: $('#newCity').value,
        color: 'linear-gradient(145deg,#3ad7ff,#7c2cff)'
      };
      this.profiles.custom = p;
      try { localStorage.setItem('gta5br_custom_profile', JSON.stringify(p)); } catch {}
      this._appendCustomProfile(p);
      this._saveLocal();
      this.closeModal();
      this.toast(`Perfil de ${name} criado!`);
      this.selectProfile('custom');
    });
  }

  _appendCustomProfile(p) {
    if (document.querySelector(`[data-profile="${p.key}"]`)) return;
    const btn = document.createElement('button');
    btn.className = 'profile-card';
    btn.dataset.profile = p.key;
    btn.innerHTML = `<span class="profile-avatar plus" style="background:${p.color};font-size:42px;border-style:solid">${p.initial}</span>
      <span class="profile-name">${p.name}</span><span class="profile-meta">Nível ${p.level} · ${p.trophies} troféus</span><span class="profile-tag">NOVO PERFIL</span>`;
    btn.addEventListener('click', () => { this.audio.click(); this.selectProfile(p.key); });
    const create = $('#createProfile');
    create?.parentElement?.insertBefore(btn, create);
  }
}
