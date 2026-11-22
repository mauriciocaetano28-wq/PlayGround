import * as THREE from 'three';
import { createGameShell, createJoystick, bindLook, bindHold, isTouchDevice, clamp } from '../core/gameShell.js';
import { audio } from '../core/audio.js';

const BOT_NAMES = ['NovaKid', 'PixelFury', 'xX_Blok_Xx', 'Mika', 'Kai.exe', 'Luna_77', 'ZeroCube', 'Vortex', 'Bibi', 'Rush'];
const BOT_COLORS = [0xff5fa2, 0xffd84f, 0x9b6bff, 0x4dffa6, 0xff8a4a, 0x5de8ff, 0xff6b6b, 0xc38bff];

export async function mount({ root, game, onExit }) {
  const shell = createGameShell({
    root, game, onExit,
    controls: '<b>WASD</b> mover · <b>Mouse</b> mirar · <b>Clique</b> atirar · <b>Espaço</b> pular · <b>Shift</b> dash · <b>R</b> recarregar',
  });
  const hud = shell.hud;
  const touch = isTouchDevice();
  shell.root.classList.add('site-mode');
  hud.innerHTML = `
    ${touch ? '<div class="look-zone"></div>' : ''}
    <div class="blox-site" id="blox-site">
      <div class="blox-browser">
        <div class="blox-browser-top">
          <div class="blox-dots"><i></i><i></i><i></i></div>
          <div class="blox-tabs"><div class="blox-tab active"><span class="blox-fav">B</span> Bloxtity.io <b>×</b></div><div class="blox-tab new">+</div></div>
          <div class="blox-browser-actions"><span>—</span><span>□</span><span>×</span></div>
        </div>
        <div class="blox-urlbar"><span class="lock">◆</span><span class="url">https://<b>bloxtity.io</b>/play</span><span class="blox-url-right">⌂ ⟳ ☆</span></div>
      </div>
      <div class="blox-page">
        <nav class="blox-nav">
          <a class="blox-logo" href="#">BLOXTITY<span>.IO</span></a>
          <div class="blox-links"><a href="#" class="active">Início</a><a href="#">Jogar</a><a href="#">Ranking</a><a href="#">Loja</a><a href="#">Discord</a></div>
          <div class="blox-nav-right"><span class="blox-online"><i></i>12.482 online</span><button class="blox-login" id="blox-exit-site">SAIR</button></div>
        </nav>
        <section class="blox-hero">
          <div class="blox-hero-bg" style="background-image:url('${game.hero}')"></div>
          <div class="blox-hero-grad"></div>
          <div class="blox-hero-copy">
            <span class="blox-live"><i></i> SERVIDOR BRASIL · ONLINE</span>
            <h1>ENTRE NA<br /><em>ARENA.</em></h1>
            <p>O site de arena blocky mais rápido da internet. Partidas de 2 minutos, avatares personalizados e zero download.</p>
            <div class="blox-hero-actions"><button class="blox-play" id="blox-play"><span>▶</span> JOGAR AGORA</button><button class="blox-how" id="blox-how">COMO JOGAR</button></div>
            <div class="blox-stats"><div><b>12.482</b><small>JOGADORES ONLINE</small></div><div><b>2:00</b><small>PARTIDAS RÁPIDAS</small></div><div><b>100%</b><small>GRÁTIS NO NAVEGADOR</small></div></div>
          </div>
          <div class="blox-hero-side">
            <div class="blox-live-card"><span>AO VIVO</span><b>ARENA #04</b><div class="blox-live-line"><i></i><i></i><i></i><i></i><i></i></div><small>8 jogadores · 1:42 restante</small></div>
            <div class="blox-chat"><span><b>NovaKid:</b> gg</span><span><b>xX_Blok_Xx:</b> alguém 1v1?</span><span><b>Mika:</b> entrando na arena 🔥</span></div>
          </div>
        </section>
        <section class="blox-lower">
          <div class="blox-modes">
            <div class="blox-section-title"><span>MODOS DE JOGO</span><a href="#">VER TODOS →</a></div>
            <div class="blox-mode-grid">
              <article class="blox-mode m1"><span class="mode-tag">2 MIN</span><h3>ARENA</h3><p>Elimine bots e lidere o placar.</p><button data-play>JOGAR</button></article>
              <article class="blox-mode m2"><span class="mode-tag">EM BREVE</span><h3>PARKOUR</h3><p>Corra por ilhas flutuantes.</p><button disabled>EM BREVE</button></article>
              <article class="blox-mode m3"><span class="mode-tag">EM BREVE</span><h3>DUELO</h3><p>1 contra 1, melhor de cinco.</p><button disabled>EM BREVE</button></article>
            </div>
          </div>
          <aside class="blox-rank">
            <div class="blox-section-title"><span>RANKING GLOBAL</span><a href="#">SEMANA →</a></div>
            <div class="blox-rank-list">
              <div><b>01</b><span class="rk a">V</span><strong>Vortex</strong><em>2.940</em></div>
              <div><b>02</b><span class="rk b">L</span><strong>Luna_77</strong><em>2.711</em></div>
              <div><b>03</b><span class="rk c">N</span><strong>NovaKid</strong><em>2.488</em></div>
              <div><b>04</b><span class="rk d">K</span><strong>Kai.exe</strong><em>2.103</em></div>
              <div><b>05</b><span class="rk e">M</span><strong>Mika</strong><em>1.987</em></div>
            </div>
          </aside>
        </section>
        <footer class="blox-footer"><span>BLOXTITY.IO © 2026</span><span>Feito de blocos. Jogado no mundo inteiro.</span><span>Termos · Privacidade · Suporte</span></footer>
      </div>
      <div class="blox-howto" id="blox-howto"><div><span>COMO JOGAR</span><h3>WASD + MOUSE</h3><p>Mova, mire e atire. Use o espaço para pular, shift para dar um dash e R para recarregar. Partidas de 2 minutos. Cada eliminação vale 100 pontos.</p><button id="blox-howto-close">ENTENDI</button></div></div>
    </div>
    <div class="blox-hud" id="blox-hud">
      <div class="blox-top">
        <div class="blox-score"><span>PONTOS</span><b id="blox-score">0000</b></div>
        <div class="blox-match"><span>ARENA #04</span><b id="blox-timer">2:00</b></div>
        <div class="blox-online-live"><i></i><span id="blox-alive">8</span> NA ARENA</div>
      </div>
      <div class="blox-leaderboard"><span>PLACAR</span><div id="blox-board"></div></div>
      <div class="blox-crosshair" id="blox-crosshair"><i></i><i></i><i></i><i></i><span></span></div>
      <div class="blox-bottom">
        <div class="blox-health"><span>VIDA</span><div><i id="blox-health-fill"></i></div><b id="blox-health-num">100</b></div>
        <div class="blox-ammo"><b id="blox-ammo">30</b><span>/ ∞</span><small>BLASTER</small><div class="blox-reload" id="blox-reload"></div></div>
      </div>
      <div class="blox-feed" id="blox-feed"></div>
      <div class="blox-killmark" id="blox-killmark">+100</div>
      <div class="blox-countdown" id="blox-countdown">3</div>
      <div class="blox-eliminated" id="blox-eliminated"><span>ELIMINADO</span><small>Voltando em <b id="blox-respawn">3</b>...</small></div>
      <div class="blox-results" id="blox-results"><div class="blox-results-card"><span>PARTIDA FINALIZADA</span><h2>FIM DE JOGO</h2><div id="blox-final-board"></div><div class="blox-results-actions"><button id="blox-again">JOGAR NOVAMENTE</button><button id="blox-site-btn">VOLTAR AO SITE</button><button id="blox-exit-btn">SAIR</button></div></div></div>
      <div class="blox-touch touch-ui ${touch ? 'active' : ''}">
        <div class="joystick"><i></i></div>
        <div class="touch-right">
          <button class="touch-btn big b1" data-touch="fire">ATIRAR</button>
          <button class="touch-btn b4" data-touch="jump">PULAR</button>
          <button class="touch-btn b2" data-touch="dash">DASH</button>
          <button class="touch-btn b3" data-touch="reload">RECARGA</button>
        </div>
      </div>
    </div>`;

  let started = false;
  let destroyed = false;
  let arena = null;
  const startArena = () => {
    if (started) return;
    started = true;
    audio.success();
    const site = $('#blox-site', hud);
    site.classList.add('leaving');
    setTimeout(() => {
      site.style.display = 'none';
      shell.root.classList.remove('site-mode');
      $('#blox-hud', hud).classList.add('active');
      arena = createArena();
    }, 380);
  };

  $('#blox-play', hud).addEventListener('click', startArena);
  $$('[data-play]', hud).forEach((b) => b.addEventListener('click', startArena));
  $('#blox-exit-site', hud).addEventListener('click', () => shell.exit());
  $('#blox-how', hud).addEventListener('click', () => $('#blox-howto', hud).classList.add('open'));
  $('#blox-howto-close', hud).addEventListener('click', () => $('#blox-howto', hud).classList.remove('open'));

  function $(s, r = document) { return r.querySelector(s); }
  function $$(s, r = document) { return [...r.querySelectorAll(s)]; }

  function createArena() {
    const canvas = document.createElement('canvas');
    canvas.className = 'game-canvas';
    shell.canvasWrap.appendChild(canvas);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0820);
    scene.fog = new THREE.FogExp2(0x120a2c, 0.006);
    const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 400);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    // Sky
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { top: { value: new THREE.Color(0x100628) }, bottom: { value: new THREE.Color(0x2c135c) }, accent: { value: new THREE.Color(0x0a7f99) } },
      vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bottom; uniform vec3 accent; varying vec3 vP; void main(){ float h=normalize(vP).y; vec3 c=mix(bottom,top,smoothstep(-0.05,0.6,h)); c=mix(c,accent,smoothstep(0.0,0.12,abs(h))*0.12); gl_FragColor=vec4(c,1.0); }',
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(260, 24, 16), skyMat));
    const stars = [];
    for (let i = 0; i < 700; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.55;
      const r = 200;
      stars.push(Math.cos(th) * Math.sin(ph) * r, Math.cos(ph) * r, Math.sin(th) * Math.sin(ph) * r);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xaeeaff, size: 0.6, transparent: true, opacity: 0.8 })));

    scene.add(new THREE.HemisphereLight(0x8ad8ff, 0x1b0f33, 1.1));
    const key = new THREE.DirectionalLight(0xcfe7ff, 2.1);
    key.position.set(30, 50, 20);
    scene.add(key);
    const pink = new THREE.PointLight(0xff3fa0, 220, 120, 2);
    pink.position.set(-55, 18, -50);
    scene.add(pink);
    const cyan = new THREE.PointLight(0x3fe8ff, 180, 120, 2);
    cyan.position.set(60, 16, 40);
    scene.add(cyan);

    // Platform top texture
    const topCanvas = document.createElement('canvas');
    topCanvas.width = topCanvas.height = 512;
    const tctx = topCanvas.getContext('2d');
    tctx.fillStyle = '#14223d'; tctx.fillRect(0, 0, 512, 512);
    tctx.strokeStyle = 'rgba(93,232,255,.17)'; tctx.lineWidth = 1;
    for (let i = 0; i <= 16; i++) {
      tctx.beginPath(); tctx.moveTo(i * 32, 0); tctx.lineTo(i * 32, 512); tctx.stroke();
      tctx.beginPath(); tctx.moveTo(0, i * 32); tctx.lineTo(512, i * 32); tctx.stroke();
    }
    for (let i = 0; i < 40; i++) {
      tctx.fillStyle = `rgba(93,232,255,${0.02 + Math.random() * 0.05})`;
      tctx.fillRect(Math.floor(Math.random() * 16) * 32, Math.floor(Math.random() * 16) * 32, 32, 32);
    }
    const topTex = new THREE.CanvasTexture(topCanvas);
    topTex.colorSpace = THREE.SRGBColorSpace;
    topTex.anisotropy = 8;
    const platMat = new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.7, metalness: 0.25, emissive: 0x081426, emissiveIntensity: 0.5 });
    const sideMat = new THREE.MeshStandardMaterial({ color: 0x0b1324, roughness: 0.8, metalness: 0.3 });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(180, 9, 180), [sideMat, sideMat, platMat, sideMat, sideMat, sideMat]);
    platform.position.y = -4.5;
    scene.add(platform);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x5de8ff });
    const edges = [
      [0, 0.06, 90, 180, 0.1, 0.7], [0, 0.06, -90, 180, 0.1, 0.7],
      [90, 0.06, 0, 0.7, 0.1, 180], [-90, 0.06, 0, 0.7, 0.1, 180],
    ];
    edges.forEach(([x, y, z, w, h, d]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), edgeMat); m.position.set(x, y, z); scene.add(m); });
    // Floating chunks
    for (let i = 0; i < 26; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(4 + Math.random() * 12, 3 + Math.random() * 8, 4 + Math.random() * 12), new THREE.MeshStandardMaterial({ color: i % 3 ? 0x1a2a4a : 0x2b1a4f, roughness: 0.8 }));
      m.position.set((Math.random() - 0.5) * 250, -15 - Math.random() * 30, (Math.random() - 0.5) * 250);
      m.rotation.set(Math.random(), Math.random(), Math.random());
      scene.add(m);
    }

    const obstacles = [];
    const obstacleMats = [0xff5fa2, 0x5de8ff, 0xffd84f, 0x9b6bff, 0x4dffa6].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.4, emissive: c, emissiveIntensity: 0.12 }));
    const obstacleSpecs = [
      [-38, -24, 20, 5, 12], [30, -38, 8, 5, 28], [48, 18, 20, 4, 10], [-24, 42, 26, 4, 8],
      [4, -8, 12, 7, 12], [-58, 8, 10, 4, 10], [58, -10, 14, 6, 14], [-8, 58, 22, 4, 8],
      [20, 48, 8, 4, 22], [-52, -52, 12, 5, 12], [66, 54, 16, 5, 16], [-70, 38, 8, 4, 18],
      [12, 22, 8, 3, 8], [-16, -56, 16, 3, 8],
    ];
    obstacleSpecs.forEach(([x, z, w, h, d], i) => {
      const mat = obstacleMats[i % obstacleMats.length];
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, h / 2, z);
      m.castShadow = true;
      scene.add(m);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.25, d + 0.3), new THREE.MeshBasicMaterial({ color: mat.color }));
      trim.position.set(x, h + 0.15, z);
      scene.add(trim);
      obstacles.push({ x, z, w: w / 2, d: d / 2, h });
    });

    // Spawn pads
    const pads = [[0, 30], [40, -50], [-55, -20], [60, 45], [-30, 65], [20, -10]];
    pads.forEach(([x, z], i) => {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.2, 24), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x5de8ff : 0xff5fa2, transparent: true, opacity: 0.45 }));
      pad.position.set(x, 0.12, z);
      scene.add(pad);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(4, 0.08, 6, 32), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x5de8ff : 0xff5fa2 }));
      ring.rotation.x = Math.PI / 2; ring.position.set(x, 0.18, z); scene.add(ring);
    });

    // Health packs
    const packs = [];
    const packMat = new THREE.MeshStandardMaterial({ color: 0x4dffa6, emissive: 0x1cff8a, emissiveIntensity: 0.5, roughness: 0.3 });
    [[-25, 25], [35, 35], [45, -25], [-45, -40]].forEach(([x, z]) => {
      const g = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), packMat);
      g.add(box);
      const cross1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.08), new THREE.MeshBasicMaterial({ color: 0x052515 }));
      cross1.position.z = 1.13; g.add(cross1);
      const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.4, 0.08), new THREE.MeshBasicMaterial({ color: 0x052515 }));
      cross2.position.z = 1.13; g.add(cross2);
      g.position.set(x, 1.4, z);
      scene.add(g);
      packs.push({ group: g, x, z, active: true, respawn: 0 });
    });

    function makeNameSprite(name, color) {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 128;
      const ctx = c.getContext('2d');
      ctx.font = '700 52px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(4,8,18,.6)'; ctx.fillRect(80, 24, 352, 80);
      ctx.fillStyle = color; ctx.fillText(name, 256, 66);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      sp.scale.set(7, 1.75, 1);
      sp.position.y = 5.4;
      return sp;
    }

    function makeAvatar(color, name) {
      const g = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.35 });
      const dark = new THREE.MeshStandardMaterial({ color: 0x10182b, roughness: 0.7 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 1), bodyMat); body.position.y = 1.9; g.add(body);
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.1, 1.1), bodyMat); head.position.y = 3.55; g.add(head);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.35, 0.12), new THREE.MeshBasicMaterial({ color: 0x0b1020 })); visor.position.set(0, 3.62, 0.57); g.add(visor);
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.3, 0.7), dark); legL.position.set(-0.45, 0.65, 0); g.add(legL);
      const legR = legL.clone(); legR.position.x = 0.45; g.add(legR);
      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.7, 0.55), bodyMat); armL.position.set(-1.2, 2, 0); g.add(armL);
      const armR = armL.clone(); armR.position.x = 1.2; g.add(armR);
      const gun = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 1.5), new THREE.MeshStandardMaterial({ color: 0x232c40, roughness: 0.3, metalness: 0.7 })); gun.position.set(1.25, 2, 0.55); g.add(gun);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), new THREE.MeshBasicMaterial({ color })); glow.position.set(1.25, 2, 1.32); g.add(glow);
      if (name) g.add(makeNameSprite(name, `#${new THREE.Color(color).getHexString()}`));
      return { group: g, legL, legR, armL, armR };
    }

    const player = { x: 0, z: 30, y: 0, vy: 0, angle: Math.PI, health: 100, alive: true, respawn: 0, score: 0, kills: 0, deaths: 0, ammo: 30, reload: 0, fire: 0, dash: 0, dashTime: 0 };
    const playerAvatar = makeAvatar(0x5de8ff, 'VOCÊ');
    scene.add(playerAvatar.group);
    playerAvatar.group.position.set(player.x, 0, player.z);

    const bots = [];
    BOT_NAMES.slice(0, 7).forEach((name, i) => {
      const color = BOT_COLORS[i % BOT_COLORS.length];
      const av = makeAvatar(color, name);
      scene.add(av.group);
      const spawn = pads[(i + 1) % pads.length];
      bots.push({ name, color, av, x: spawn[0], z: spawn[1], y: 0, vy: 0, angle: 0, health: 100, alive: true, respawn: 0, score: 0, kills: 0, deaths: 0, shoot: 1 + Math.random() * 1.5, wander: Math.random() * Math.PI * 2, phase: Math.random() * 10 });
    });

    const keys = new Set();
    const joystick = touch ? createJoystick($('.joystick', hud)) : { x: 0, y: 0 };
    const touchState = { fire: false, jump: false, dash: false };
    if (touch) {
      bindHold($('[data-touch="fire"]', hud), (v) => { touchState.fire = v; });
      bindHold($('[data-touch="jump"]', hud), (v) => { touchState.jump = v; });
      bindHold($('[data-touch="dash"]', hud), (v) => { if (v) dash(); });
      bindHold($('[data-touch="reload"]', hud), (v) => { if (v) reload(); });
    }
    bindLook($('.look-zone', hud), (dx, dy) => {
      if (!started || shell.paused) return;
      yaw -= dx * 0.004;
      pitch = clamp(pitch - dy * 0.003, -0.5, 0.8);
    });

    let yaw = 0;
    let pitch = 0.16;
    let elapsed = 0;
    let countdown = 3.2;
    let matchTime = 120;
    let ended = false;
    let projectiles = [];
    let feedTimer;
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);

    function showFeed(text, color = '#fff') {
      const el = $('#blox-feed', hud);
      const row = document.createElement('div');
      row.innerHTML = text;
      row.style.borderLeftColor = color;
      el.prepend(row);
      setTimeout(() => row.remove(), 4000);
    }

    function updateHud() {
      $('#blox-score', hud).textContent = String(player.score).padStart(4, '0');
      $('#blox-timer', hud).textContent = `${Math.floor(Math.max(0, matchTime) / 60)}:${String(Math.max(0, Math.floor(matchTime % 60))).padStart(2, '0')}`;
      $('#blox-health-fill', hud).style.width = `${clamp(player.health, 0, 100)}%`;
      $('#blox-health-num', hud).textContent = Math.ceil(player.health);
      $('#blox-ammo', hud).textContent = player.reload > 0 ? '···' : player.ammo;
      $('#blox-reload', hud).style.width = player.reload > 0 ? `${(1 - player.reload / 1.5) * 100}%` : '0%';
      const board = [...bots.map((b) => ({ name: b.name, score: b.score, color: b.color })), { name: 'VOCÊ', score: player.score, color: 0x5de8ff }]
        .sort((a, b) => b.score - a.score).slice(0, 6);
      $('#blox-board', hud).innerHTML = board.map((b, i) => `<div class="${b.name === 'VOCÊ' ? 'me' : ''}"><b>${i + 1}</b><span style="background:#${new THREE.Color(b.color).getHexString()}"></span><strong>${b.name}</strong><em>${b.score}</em></div>`).join('');
      $('#blox-alive', hud).textContent = 1 + bots.filter((b) => b.alive).length;
    }

    function reload() {
      if (player.reload > 0 || player.ammo === 30) return;
      player.reload = 1.5;
      audio.install();
    }

    function shoot() {
      if (!player.alive || ended || countdown > 0 || player.fire > 0 || player.reload > 0) return;
      if (player.ammo <= 0) { reload(); return; }
      player.ammo--;
      player.fire = 0.16;
      audio.shoot();
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
      const origin = new THREE.Vector3(player.x, 2.1, player.z).add(dir.clone().multiplyScalar(1.4));
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), new THREE.MeshBasicMaterial({ color: 0x7df8ff }));
      mesh.position.copy(origin);
      scene.add(mesh);
      projectiles.push({ mesh, vel: dir.multiplyScalar(90), owner: 'player', life: 2.2, damage: 34 });
      $('#blox-crosshair', hud).classList.add('shoot');
      setTimeout(() => $('#blox-crosshair', hud).classList.remove('shoot'), 70);
    }

    function dash() {
      if (!player.alive || player.dash > 0 || countdown > 0) return;
      player.dash = 2.2; player.dashTime = 0.18;
      audio.jump();
    }

    function blocked(x, z, r = 0.9) {
      if (Math.abs(x) > 87 || Math.abs(z) > 87) return true;
      for (const o of obstacles) {
        if (x > o.x - o.w - r && x < o.x + o.w + r && z > o.z - o.d - r && z < o.z + o.d + r) return true;
      }
      return false;
    }

    function damagePlayer(amount) {
      if (!player.alive) return;
      player.health -= amount;
      $('#blox-crosshair', hud).classList.add('hit');
      setTimeout(() => $('#blox-crosshair', hud).classList.remove('hit'), 120);
      if (player.health <= 0) {
        player.alive = false; player.deaths++; player.respawn = 3;
        playerAvatar.group.visible = false;
        $('#blox-eliminated', hud).classList.add('open');
        audio.hit();
      }
      updateHud();
    }

    function killBot(bot) {
      bot.alive = false; bot.health = 0; bot.deaths++; bot.respawn = 3;
      bot.av.group.visible = false;
      player.kills++; player.score += 100;
      $('#blox-killmark', hud).classList.add('show');
      setTimeout(() => $('#blox-killmark', hud).classList.remove('show'), 700);
      showFeed(`<b>VOCÊ</b> eliminou <b>${bot.name}</b>`, '#5de8ff');
      audio.pickup();
      updateHud();
    }

    function updatePlayer(dt) {
      if (!player.alive) {
        player.respawn -= dt;
        $('#blox-respawn', hud).textContent = Math.max(0, Math.ceil(player.respawn));
        if (player.respawn <= 0) {
          player.alive = true; player.health = 100; player.ammo = 30;
          const pad = pads[Math.floor(Math.random() * pads.length)];
          player.x = pad[0]; player.z = pad[1]; player.y = 0; player.vy = 0;
          playerAvatar.group.visible = true;
          $('#blox-eliminated', hud).classList.remove('open');
          updateHud();
        }
        return;
      }
      const ix = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0) + (joystick.x || 0);
      const iz = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0) + (-joystick.y || 0);
      const len = Math.hypot(ix, iz);
      let speed = keys.has('ShiftLeft') ? 24 : 16;
      if (player.dashTime > 0) { speed = 58; player.dashTime -= dt; }
      if (len > 0.05 && countdown <= 0) {
        const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
        const rx = Math.cos(yaw), rz = -Math.sin(yaw);
        let mx = fx * iz + rx * ix, mz = fz * iz + rz * ix;
        const ml = Math.hypot(mx, mz); mx /= ml; mz /= ml;
        const nx = player.x + mx * speed * dt;
        const nz = player.z + mz * speed * dt;
        if (!blocked(nx, player.z)) player.x = nx;
        if (!blocked(player.x, nz)) player.z = nz;
        player.angle = Math.atan2(mx, mz);
      }
      if ((keys.has('Space') || touchState.jump) && player.y === 0 && countdown <= 0) { player.vy = 10; audio.jump(); touchState.jump = false; }
      player.vy -= 30 * dt;
      player.y += player.vy * dt;
      if (player.y < 0) { player.y = 0; player.vy = 0; }
      player.fire = Math.max(0, player.fire - dt);
      player.dash = Math.max(0, player.dash - dt);
      if (player.reload > 0) { player.reload -= dt; if (player.reload <= 0) { player.reload = 0; player.ammo = 30; } }
      if ((keys.has('KeyR'))) reload();
      if (touchState.fire || window.__ps5VirtualFire || (mouseDown && document.pointerLockElement === canvas)) shoot();
      playerAvatar.group.position.set(player.x, player.y, player.z);
      playerAvatar.group.rotation.y = player.angle;
      playerAvatar.legL.rotation.x = Math.sin(elapsed * 14) * (len > 0.1 ? 0.7 : 0);
      playerAvatar.legR.rotation.x = -Math.sin(elapsed * 14) * (len > 0.1 ? 0.7 : 0);
      playerAvatar.armR.rotation.x = -0.9 + Math.sin(elapsed * 16) * 0.04;
      updateHud();
    }

    function updateBots(dt) {
      bots.forEach((b) => {
        if (!b.alive) {
          b.respawn -= dt;
          if (b.respawn <= 0) {
            b.alive = true; b.health = 100;
            const pad = pads[Math.floor(Math.random() * pads.length)];
            b.x = pad[0]; b.z = pad[1]; b.y = 0;
            b.av.group.visible = true;
            updateHud();
          }
          return;
        }
        const dx = player.x - b.x, dz = player.z - b.z;
        const d = Math.hypot(dx, dz);
        if (player.alive && d < 75) {
          const ang = Math.atan2(dx, dz);
          b.angle = THREE.MathUtils.lerp(b.angle, ang, dt * 3);
          const strafe = Math.sin(elapsed * 1.3 + b.phase) * 0.6;
          const nx = b.x + Math.sin(b.angle) * dt * 9 + Math.cos(b.angle) * strafe * dt * 5;
          const nz = b.z + Math.cos(b.angle) * dt * 9 - Math.sin(b.angle) * strafe * dt * 5;
          if (!blocked(nx, b.z, 0.8)) b.x = nx;
          if (!blocked(b.x, nz, 0.8)) b.z = nz;
          b.shoot -= dt;
          if (b.shoot <= 0 && d < 65) {
            b.shoot = 1.1 + Math.random() * 1.5;
            const dir = new THREE.Vector3(dx, 1.6, dz).normalize();
            dir.x += (Math.random() - 0.5) * 0.06; dir.z += (Math.random() - 0.5) * 0.06;
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff5fa2 }));
            mesh.position.set(b.x + dir.x * 2, 2.1, b.z + dir.z * 2);
            scene.add(mesh);
            projectiles.push({ mesh, vel: dir.multiplyScalar(52), owner: b, life: 2.2, damage: 11 });
          }
        } else {
          b.wander += (Math.random() - 0.5) * dt;
          const nx = b.x + Math.sin(b.wander) * dt * 4;
          const nz = b.z + Math.cos(b.wander) * dt * 4;
          if (!blocked(nx, b.z, 0.8)) b.x = nx;
          if (!blocked(b.x, nz, 0.8)) b.z = nz;
          b.angle = b.wander;
        }
        b.av.group.position.set(b.x, 0, b.z);
        b.av.group.rotation.y = b.angle;
        b.av.legL.rotation.x = Math.sin(elapsed * 10 + b.phase) * 0.6;
        b.av.legR.rotation.x = -Math.sin(elapsed * 10 + b.phase) * 0.6;
      });
    }

    function updateProjectiles(dt) {
      projectiles.forEach((p, i) => {
        p.life -= dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        let hit = false;
        if (p.owner === 'player') {
          for (const b of bots) {
            if (!b.alive) continue;
            if (p.mesh.position.distanceTo(new THREE.Vector3(b.x, 2, b.z)) < 2) {
              b.health -= p.damage;
              audio.hit();
              if (b.health <= 0) killBot(b);
              else { b.av.group.scale.setScalar(1.1); setTimeout(() => b.av.group.scale.setScalar(1), 80); }
              hit = true; break;
            }
          }
        } else if (player.alive) {
          if (p.mesh.position.distanceTo(new THREE.Vector3(player.x, 2, player.z)) < 1.7) {
            damagePlayer(p.damage);
            if (!player.alive) { p.owner.kills++; p.owner.score += 100; showFeed(`<b>${p.owner.name}</b> eliminou <b>VOCÊ</b>`, '#ff5fa2'); updateHud(); }
            hit = true;
          }
        }
        if (p.mesh.position.y < 0.2 || Math.abs(p.mesh.position.x) > 90 || Math.abs(p.mesh.position.z) > 90) hit = true;
        for (const o of obstacles) {
          if (Math.abs(p.mesh.position.x - o.x) < o.w && Math.abs(p.mesh.position.z - o.z) < o.d && p.mesh.position.y < o.h) { hit = true; break; }
        }
        if (hit || p.life <= 0) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          p.mesh.material.dispose();
          projectiles.splice(i, 1);
        }
      });
    }

    function updatePacks(dt) {
      packs.forEach((p) => {
        if (!p.active) {
          p.respawn -= dt;
          if (p.respawn <= 0) { p.active = true; p.group.visible = true; }
          return;
        }
        p.group.rotation.y += dt * 2;
        p.group.position.y = 1.4 + Math.sin(elapsed * 2 + p.x) * 0.2;
        if (player.alive && Math.hypot(p.x - player.x, p.z - player.z) < 3) {
          p.active = false; p.group.visible = false; p.respawn = 15;
          player.health = Math.min(100, player.health + 45);
          audio.pickup(); updateHud();
          showFeed('<b>VOCÊ</b> coletou <b>+45 vida</b>', '#4dffa6');
        }
      });
    }

    function updateCamera(dt) {
      const target = new THREE.Vector3(player.x, player.y + 2.8, player.z);
      const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
      const desired = target.clone().add(dir.multiplyScalar(12));
      camera.position.lerp(desired, 1 - Math.pow(0.0005, dt));
      camera.lookAt(target.x, target.y + 0.4, target.z);
    }

    function endMatch() {
      ended = true;
      $('#blox-results', hud).classList.add('open');
      const board = [...bots.map((b) => ({ name: b.name, score: b.score, color: b.color })), { name: 'VOCÊ', score: player.score, color: 0x5de8ff }]
        .sort((a, b) => b.score - a.score);
      $('#blox-final-board', hud).innerHTML = board.map((b, i) => `<div class="${b.name === 'VOCÊ' ? 'me' : ''}"><b>${i + 1}</b><span style="background:#${new THREE.Color(b.color).getHexString()}"></span><strong>${b.name}</strong><em>${b.score}</em></div>`).join('');
      audio.success();
    }

    function resetMatch() {
      ended = false; matchTime = 120; countdown = 3.2;
      player.score = 0; player.kills = 0; player.deaths = 0; player.health = 100; player.ammo = 30; player.alive = true;
      player.x = 0; player.z = 30; player.y = 0; playerAvatar.group.visible = true;
      bots.forEach((b, i) => { b.alive = true; b.health = 100; b.score = 0; b.kills = 0; b.deaths = 0; b.av.group.visible = true; const p = pads[(i + 1) % pads.length]; b.x = p[0]; b.z = p[1]; });
      $('#blox-results', hud).classList.remove('open');
      $('#blox-eliminated', hud).classList.remove('open');
      updateHud();
    }

    function onKeyDown(e) {
      if (shell.paused) return;
      keys.add(e.code);
      if (e.code === 'KeyR') reload();
      if (e.code === 'ShiftLeft') dash();
      if (e.code === 'Space') e.preventDefault();
    }
    function onKeyUp(e) { keys.delete(e.code); }
    let mouseDown = false;
    function onMouseDown(e) {
      if (e.target.closest('button')) return;
      if (!window.__ps5VirtualInput && !touch && !document.pointerLockElement) canvas.requestPointerLock?.();
      if (e.button === 0) { mouseDown = true; shoot(); }
    }
    function onMouseUp() { mouseDown = false; }
    function onMouseMove(e) {
      if (document.pointerLockElement === canvas) {
        yaw -= e.movementX * 0.0024;
        pitch = clamp(pitch - e.movementY * 0.0022, -0.5, 0.8);
      }
    }
    let dragging = false, lastX = 0, lastY = 0;
    function onPointerDown(e) { if (e.target.closest('button')) return; dragging = true; lastX = e.clientX; lastY = e.clientY; }
    function onPointerMove(e) {
      if (document.pointerLockElement === canvas) return;
      if (!dragging) return;
      yaw -= (e.clientX - lastX) * 0.004;
      pitch = clamp(pitch - (e.clientY - lastY) * 0.003, -0.5, 0.8);
      lastX = e.clientX; lastY = e.clientY;
    }
    function onPointerUp() { dragging = false; }
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    $('#blox-again', hud).addEventListener('click', resetMatch);
    $('#blox-site-btn', hud).addEventListener('click', () => {
      $('#blox-results', hud).classList.remove('open');
      $('#blox-hud', hud).classList.remove('active');
      $('#blox-site', hud).style.display = '';
      $('#blox-site', hud).classList.remove('leaving');
      shell.root.classList.add('site-mode');
      started = false;
      arena?.destroy();
      arena = null;
      shell.canvasWrap.innerHTML = '';
      $('#blox-site', hud).style.display = '';
      // Reattach site to the top of HUD (it is still there).
    });
    $('#blox-exit-btn', hud).addEventListener('click', () => shell.exit());

    function resize() {
      const w = shell.root.clientWidth || window.innerWidth;
      const h = shell.root.clientHeight || window.innerHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(devicePixelRatio, w < 760 ? 1.5 : 1.7));
    }
    window.addEventListener('resize', resize);
    resize();
    updateHud();

    let last = performance.now();
    let raf;
    function animate(now) {
      raf = requestAnimationFrame(animate);
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      if (shell.paused || destroyed) { renderer.render(scene, camera); return; }
      elapsed += dt;
      if (countdown > 0) {
        countdown -= dt;
        const n = Math.ceil(countdown);
        $('#blox-countdown', hud).textContent = n > 0 ? n : 'VAI!';
        $('#blox-countdown', hud).classList.toggle('go', n <= 0);
        if (countdown <= 0) setTimeout(() => $('#blox-countdown', hud).classList.remove('show'), 500);
        $('#blox-countdown', hud).classList.add('show');
      } else if (!ended) {
        matchTime -= dt;
        if (matchTime <= 0) { matchTime = 0; endMatch(); }
        updatePlayer(dt);
        updateBots(dt);
        updateProjectiles(dt);
        updatePacks(dt);
        updateCamera(dt);
        updateHud();
      } else {
        updateCamera(dt);
      }
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(animate);

    return {
      destroy() {
        destroyed = true;
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('pointerdown', onPointerDown);
        clearTimeout(feedTimer);
        try { document.exitPointerLock?.(); } catch {}
        scene.traverse((o) => { if (o.geometry) o.geometry.dispose?.(); if (o.material) { if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.()); else o.material.dispose?.(); } });
        renderer.dispose();
      },
      pause() { shell.setPaused(true); },
      resume() { shell.setPaused(false); },
    };
  }

  return {
    destroy() {
      arena?.destroy?.();
      shell.destroy();
    },
    pause() { shell.setPaused(true); arena?.pause?.(); },
    resume() { shell.setPaused(false); arena?.resume?.(); },
  };
}
