// ============================================================
// MATTEO 5 · GTA 6 BR — COSTA DOURADA
// Original open-world engine for the browser, built with Three.js.
// Every asset in this project is generated procedurally.
// ============================================================
import * as THREE from 'three';
import { createWorld } from './world.js';
import { createLuiza, createCarlos, createRandomNPC } from './character.js';
import { createVehicle } from './vehicle.js';
import { AudioManager } from './audio.js';
import { UI } from './ui.js';
import { clamp, lerp, damp, angleLerp, formatMoney, createTracer } from './utils.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const frame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));
const at = (name) => (game) => game.world.locations[name];

const WANTED_PT = ['Limpo', 'Procurado', 'Alerta', 'Perseguição', 'Cerco', 'Bloqueio', 'Máxima'];
const WANTED_EN = ['Clean', 'Wanted', 'Alert', 'Pursuit', 'Dragnet', 'Lockdown', 'Maximum'];

const LINES = {
  carlosIntro: [
    { name: 'CARLOS', portrait: 'carlos', pt: 'Ei, Luiza. Demorou.', en: 'Hey, Luiza. You took your time.' },
    { name: 'LUIZA', pt: 'O trânsito da orla é um teste de fé.', en: 'Shore traffic is a test of faith.' },
    { name: 'CARLOS', portrait: 'carlos', pt: 'A marina quer o resto do dinheiro até a meia-noite. Pega o carro.', en: 'The marina wants the rest of the money by midnight. Grab the car.' },
    { name: 'LUIZA', pt: 'E se eles não quiserem conversar?', en: 'And if they do not want to talk?' },
    { name: 'CARLOS', portrait: 'carlos', pt: 'Aí a gente conversa mais alto.', en: 'Then we talk louder.' }
  ],
  marina: [
    { name: 'CAPITÃO RUI', pt: 'Vocês chegaram cedo. Isso é raro nessa cidade.', en: 'You arrived early. That is rare in this town.' },
    { name: 'LUIZA', pt: 'A conta também chegou. Quanto é?', en: 'So did the bill. How much?' },
    { name: 'CAPITÃO RUI', pt: 'O suficiente pra vocês dois sumirem por um mês. Ou pra alguém sumir pra sempre.', en: 'Enough for you two to disappear for a month. Or for someone to disappear forever.' },
    { name: 'CARLOS', portrait: 'carlos', pt: 'Guarda o drama. O dinheiro tá no carro.', en: 'Save the drama. The money is in the car.' }
  ],
  garage: [
    { name: 'CARLOS', portrait: 'carlos', pt: 'Motor novo, placa velha. A combinação perfeita pra cidade.', en: 'New engine, old plate. The perfect combination for this city.' },
    { name: 'LUIZA', pt: 'E a encomenda?', en: 'And the package?' },
    { name: 'CARLOS', portrait: 'carlos', pt: 'No porta-malas. Se a polícia perguntar, é equipamento de praia.', en: 'In the trunk. If the police ask, it is beach equipment.' }
  ],
  hospital: [
    { name: 'DRA. HELENA', pt: 'Você está sangrando no meu chão limpo.', en: 'You are bleeding on my clean floor.' },
    { name: 'LUIZA', pt: 'Então me diga que valeu a pena.', en: 'Then tell me it was worth it.' },
    { name: 'DRA. HELENA', pt: 'O arquivo prova o suficiente. A cidade vai fingir que não viu.', en: 'The file proves enough. The city will pretend it did not see.' }
  ],
  neide: [
    { name: 'DONA NEIDE', pt: 'Carlos. Ainda lembra o caminho de casa.', en: 'Carlos. You still remember the way home.' },
    { name: 'CARLOS', portrait: 'carlos', pt: 'Lembro de tudo, tia. Inclusive das dívidas que não eram minhas.', en: 'I remember everything, auntie. Including debts that were not mine.' },
    { name: 'DONA NEIDE', pt: 'Então resolve. E não traz a polícia pra minha porta.', en: 'Then settle it. And do not bring the police to my door.' }
  ],
  finale: [
    { name: 'CARLOS', portrait: 'carlos', pt: 'A torre tá limpa. O resto da cidade não.', en: 'The tower is clear. The rest of the city is not.' },
    { name: 'LUIZA', pt: 'A gente não veio limpar a cidade. Veio cobrar o que é nosso.', en: 'We did not come to clean the city. We came to collect what is ours.' },
    { name: 'CARLOS', portrait: 'carlos', pt: 'Então segura firme. A última maré é a mais alta.', en: 'Then hold on. The last tide is the highest.' },
    { name: 'LUIZA', pt: 'Costa Dourada, aguenta. A gente tá chegando.', en: 'Costa Dourada, hold on. We are coming.' }
  ],
  informant: [
    { name: 'VITÓRIA', pt: 'O nome que você procura assinou tudo. Até o incêndio do morro.', en: 'The name you are looking for signed everything. Even the hill fire.' },
    { name: 'LUIZA', pt: 'E onde eu encontro esse nome?', en: 'And where do I find that name?' },
    { name: 'VITÓRIA', pt: 'No topo da torre. Sempre no topo.', en: 'At the top of the tower. Always the top.' }
  ],
  chatterPT: [
    'Bem-vindo à Costa Dourada. Cuidado com o que promete.',
    'O sol queima, mas a conta no fim do mês queima mais.',
    'Já viu o pôr do sol no pier? Vale cada centavo do táxi.',
    'Aqui todo mundo tem um plano. Quase ninguém tem vergonha.',
    'Se o mar levar, o mar devolve. Só não do jeito que você quer.',
    'Tô esperando o ônibus há quarenta minutos. A cidade é linda, né?'
  ],
  chatterEN: [
    'Welcome to Costa Dourada. Be careful what you promise.',
    'The sun burns, but the bills burn harder.',
    'Have you seen the sunset at the pier? Worth every cent of the taxi.',
    'Everyone here has a plan. Almost nobody has shame.',
    'If the sea takes it, the sea gives it back. Just not how you want.',
    'I have been waiting for the bus for forty minutes. Beautiful city, right?'
  ]
};

const MISSIONS = [
  {
    index: 0,
    protag: 'Luiza',
    title: { pt: 'Maré de Mudança', en: 'Tide of Change' },
    descPt: 'O sol nasce sobre a orla. Luiza ainda não sabe que a cidade está prestes a cobrar suas dívidas.',
    descEn: 'The sun rises over the shore. Luiza does not know the city is about to collect.',
    reward: 2500,
    spawn: { x: -74, z: 94, heading: Math.PI / 2 },
    steps: [
      { type: 'goto', target: at('beachKiosk'), radius: 7, textPt: 'Encontre Carlos no quiosque da orla.', textEn: 'Meet Carlos at the beach kiosk.' },
      { type: 'talk', npc: { name: 'Carlos', kind: 'carlos' }, target: at('beachKiosk'), radius: 6, lines: LINES.carlosIntro, textPt: 'Converse com Carlos.', textEn: 'Talk to Carlos.' },
      { type: 'collect', target: () => ({ x: -76, y: 0, z: 70 }), radius: 4, textPt: 'Pegue o carro de Carlos na avenida.', textEn: 'Get Carlos\' car on the avenue.' },
      { type: 'goto', target: at('marina'), radius: 14, textPt: 'Dirija até a Marina Azul.', textEn: 'Drive to Blue Marina.' },
      { type: 'talk', npc: { name: 'Capitão Rui', kind: 'npc' }, target: at('marina'), radius: 8, lines: LINES.marina, textPt: 'Feche o acordo com o capitão.', textEn: 'Close the deal with the captain.' }
    ]
  },
  {
    index: 1,
    protag: 'Carlos',
    title: { pt: 'Motor de Sangue', en: 'Blood Engine' },
    descPt: 'Uma encomenda, uma garagem e uma cidade que nunca esquece uma placa.',
    descEn: 'One package, one garage, and a city that never forgets a plate.',
    reward: 3200,
    spawn: { x: 100, z: 4, heading: Math.PI / 2 },
    steps: [
      { type: 'goto', target: at('garage'), radius: 13, textPt: 'Vá até a garagem no Centro Maré.', textEn: 'Go to the garage in Maré Center.' },
      { type: 'talk', npc: { name: 'Zeca', kind: 'npc' }, target: at('garage'), radius: 8, lines: LINES.garage, textPt: 'Pegue a encomenda com Zeca.', textEn: 'Pick up the package from Zeca.' },
      { type: 'goto', target: at('delivery'), radius: 14, textPt: 'Leve a encomenda ao Morro do Som.', textEn: 'Deliver the package to Sound Hill.' },
      { type: 'fight', spawn: { kind: 'gang', count: 3, spread: 14 }, wanted: 1, textPt: 'Emboscada! Elimine os cobradores.', textEn: 'Ambush! Take out the collectors.' },
      { type: 'goto', target: at('hospital'), radius: 14, textPt: 'Leve a prova ao Hospital da Maré.', textEn: 'Take the evidence to Maré Hospital.' },
      { type: 'talk', npc: { name: 'Dra. Helena', kind: 'npc' }, target: at('hospital'), radius: 8, lines: LINES.hospital, textPt: 'Entregue a prova à médica.', textEn: 'Hand the evidence to the doctor.' }
    ]
  },
  {
    index: 2,
    protag: 'Luiza',
    title: { pt: 'O Preço do Silêncio', en: 'The Price of Silence' },
    descPt: 'Um clube, um arquivo e quatro pessoas que sabem demais.',
    descEn: 'One club, one file and four people who know too much.',
    reward: 4100,
    spawn: { x: 205, z: -26, heading: -Math.PI / 2 },
    steps: [
      { type: 'goto', target: at('club'), radius: 13, textPt: 'Vá ao clube Neon 88, na Marina.', textEn: 'Go to Neon 88 club at the Marina.' },
      { type: 'talk', npc: { name: 'Beto', kind: 'npc' }, target: at('club'), radius: 8, lines: [
        { name: 'BETO', pt: 'Luiza. Ainda com o mesmo carro?', en: 'Luiza. Still driving the same car?' },
        { name: 'LUIZA', pt: 'Ainda com os mesmos problemas?', en: 'Still got the same problems?' },
        { name: 'BETO', pt: 'O arquivo tá no escritório. Leva e some antes que eles voltem.', en: 'The file is in the office. Take it and vanish before they come back.' }
      ], textPt: 'Encontre Beto no clube.', textEn: 'Find Beto at the club.' },
      { type: 'fight', spawn: { kind: 'gang', count: 4, spread: 15 }, wanted: 2, textPt: 'Proteja Beto. Elimine os seguranças.', textEn: 'Protect Beto. Take out the security crew.' },
      { type: 'collect', target: at('club'), radius: 6, textPt: 'Recolha o arquivo no escritório.', textEn: 'Collect the file in the office.' },
      { type: 'goto', target: at('hospital'), radius: 14, textPt: 'Leve o arquivo ao hospital.', textEn: 'Take the file to the hospital.' },
      { type: 'talk', npc: { name: 'Dra. Helena', kind: 'npc' }, target: at('hospital'), radius: 8, lines: LINES.hospital, textPt: 'Entregue o arquivo.', textEn: 'Deliver the file.' }
    ]
  },
  {
    index: 3,
    protag: 'Carlos',
    title: { pt: 'Fé no Morro', en: 'Faith on the Hill' },
    descPt: 'O morro cobra lealdade em voz alta. Carlos tem uma última dívida para quitar.',
    descEn: 'The hill collects loyalty out loud. Carlos has one last debt to settle.',
    reward: 5200,
    spawn: { x: -340, z: -222, heading: Math.PI },
    steps: [
      { type: 'goto', target: at('favela'), radius: 15, textPt: 'Volte ao Morro do Som.', textEn: 'Return to Sound Hill.' },
      { type: 'talk', npc: { name: 'Dona Neide', kind: 'npc' }, target: at('favela'), radius: 8, lines: LINES.neide, textPt: 'Converse com Dona Neide.', textEn: 'Talk to Dona Neide.' },
      { type: 'fight', spawn: { kind: 'gang', count: 5, spread: 16 }, wanted: 2, textPt: 'Defenda o morro. Elimine os invasores.', textEn: 'Defend the hill. Take out the invaders.' },
      { type: 'goto', target: at('park'), radius: 15, textPt: 'Entregue o pacote no Parque das Salinas.', textEn: 'Deliver the package to Salt Park.' },
      { type: 'talk', npc: { name: 'Rafa', kind: 'npc' }, target: at('park'), radius: 9, lines: [
        { name: 'RAFA', pt: 'Tá quente. O que tem aí dentro?', en: 'It is hot. What is inside?' },
        { name: 'CARLOS', portrait: 'carlos', pt: 'A verdade. E ela queima mais que o sol.', en: 'The truth. And it burns hotter than the sun.' },
        { name: 'RAFA', pt: 'Então some daqui antes que ela te queime também.', en: 'Then get out of here before it burns you too.' }
      ], textPt: 'Entregue o pacote a Rafa.', textEn: 'Deliver the package to Rafa.' }
    ]
  },
  {
    index: 4,
    protag: 'Luiza',
    title: { pt: 'Última Maré', en: 'The Last Tide' },
    descPt: 'No topo da torre, a cidade mostra o rosto. Luiza e Carlos mostram o resto.',
    descEn: 'At the top of the tower, the city shows its face. Luiza and Carlos show the rest.',
    reward: 7500,
    spawn: { x: -10, z: -212, heading: 0 },
    steps: [
      { type: 'goto', target: at('matteoTower'), radius: 17, textPt: 'Vá à Torre Matteo, no Centro Maré.', textEn: 'Go to Matteo Tower in Maré Center.' },
      { type: 'talk', npc: { name: 'Carlos', kind: 'carlos' }, target: at('matteoTower'), radius: 9, lines: LINES.finale, textPt: 'Encontre Carlos na torre.', textEn: 'Meet Carlos at the tower.' },
      { type: 'fight', spawn: { kind: 'gang', count: 6, spread: 18 }, wanted: 4, textPt: 'Sobreviva ao cerco da torre.', textEn: 'Survive the tower siege.' },
      { type: 'goto', target: at('ferris'), radius: 18, textPt: 'Encontre a informante na roda-gigante.', textEn: 'Meet the informant at the Ferris wheel.' },
      { type: 'talk', npc: { name: 'Vitória', kind: 'npc' }, target: at('ferris'), radius: 12, lines: LINES.informant, textPt: 'Fale com Vitória.', textEn: 'Talk to Vitória.' },
      { type: 'escape', textPt: 'Despistou a polícia para fechar a história.', textEn: 'Lose the police to close the story.' }
    ]
  }
];

// ============================================================
// MISSION DIRECTOR
// ============================================================
class MissionManager {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.mission = null;
    this.missionIndex = -1;
    this.stepIndex = -1;
    this.step = null;
    this.stepHostiles = [];
    this.contact = null;
    this.markerPos = null;
    this.checkpoint = new THREE.Vector3(-74, 0, 86);
    this.stepTimer = 0;
    this.startedAt = 0;
    this.initialWanted = 0;
    this.talking = false;
    this.cleanupTimer = 0;
  }

  start(index) {
    this.active = true;
    this.missionIndex = index;
    this.mission = MISSIONS[index];
    this.stepIndex = -1;
    this.step = null;
    this.startedAt = this.game.sessionTime;
    this.initialWanted = this.game.wanted;
    this.talking = false;
    this.nextStep();
  }

  nextStep() {
    if (!this.active) return;
    this.stepIndex++;
    if (this.stepIndex >= this.mission.steps.length) { this.finish(); return; }
    this.enterStep();
  }

  enterStep() {
    const game = this.game;
    const step = this.mission.steps[this.stepIndex];
    this.step = step;
    this.stepTimer = step.time || 0;
    this.talking = false;
    step.progress = undefined;
    this.clearContact();
    this.stepHostiles = [];
    this.cleanupTimer = 0;

    if (step.checkpoint !== false) {
      this.checkpoint.copy(game.player.position);
    }

    if (step.npc) {
      const base = this.rawTarget();
      if (base) this.spawnContact(step.npc, base);
    }
    if (step.spawn) {
      const center = this.rawTarget() || game.player.position;
      this.stepHostiles = game.spawnHostiles(step.spawn.count || 3, center, step.spawn.kind || 'gang', step.spawn.spread || 12);
      if (step.wanted) game.crime(step.wanted);
    }
    this.refreshMarker();
    game.ui.hidePrompt();
    game.ui.hudToast(game.ui.language === 'pt' ? 'OBJETIVO ATUALIZADO' : 'OBJECTIVE UPDATED');
    game.save();
  }

  spawnContact(spec, base) {
    const game = this.game;
    const pos = game.freeSpot(base.x, base.z, 3);
    let char;
    if (spec.kind === 'carlos') {
      char = createCarlos();
      char.name = spec.name;
      char.isPlayer = false;
    } else {
      char = createRandomNPC(spec.name);
    }
    char.root.position.set(pos.x, game.world.getGroundHeight(pos.x, pos.z), pos.z);
    char.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
    game.scene.add(char.root);
    char.setWeapon('pistol');
    char.weapon.visible = false;
    char.smg.visible = false;
    this.contact = char;
  }

  clearContact() {
    if (!this.contact) return;
    this.contact.root.parent?.remove(this.contact.root);
    this.contact = null;
  }

  rawTarget() {
    const step = this.step;
    if (!step) return null;
    if (this.contact) return this.contact.root.position;
    if (!step.target) return null;
    const t = step.target(this.game);
    return t ? new THREE.Vector3(t.x || 0, t.y || 0, t.z || 0) : null;
  }

  refreshMarker() {
    const t = this.rawTarget();
    if (!t) { this.markerPos = null; return; }
    if (!this.markerPos) this.markerPos = new THREE.Vector3();
    this.markerPos.copy(t);
  }

  distanceToTarget() {
    const t = this.rawTarget();
    if (!t) return 0;
    const p = this.game.player.position;
    return Math.hypot(t.x - p.x, t.z - p.z);
  }

  update(dt) {
    if (!this.active || !this.step) return;
    const game = this.game;
    this.refreshMarker();
    const target = this.rawTarget();
    const dist = target ? Math.hypot(target.x - game.player.position.x, target.z - game.player.position.z) : 0;
    const step = this.step;

    if (step.type === 'follow') { game.hudHint = null; }

    if (step.type === 'goto' || step.type === 'collect') {
      const radius = step.radius || 8;
      if (game.state === 'playing' && dist <= radius) {
        if (step.type === 'collect') game.audio.pickup();
        this.advance();
      }
    } else if (step.type === 'talk') {
      if (!this.talking && dist <= (step.radius || 7) && !game.ui.dialogueActive) {
        this.talking = true;
        const lines = step.lines.map(l => ({
          ...l,
          name: l.name || (step.npc?.name || 'CONTATO').toUpperCase(),
          portrait: l.portrait
        }));
        game.ui.speak(lines, () => {
          this.talking = false;
          if (this.active && this.step === step) this.advance();
        });
      }
    } else if (step.type === 'fight') {
      const total = this.stepHostiles.length;
      const dead = this.stepHostiles.filter(h => !h.alive).length;
      if (total > 0) step.progress = (dead / total) * 100;
      if (total > 0 && dead >= total) this.advance();
    } else if (step.type === 'survive') {
      const full = step.time || 20;
      this.stepTimer = Math.max(0, this.stepTimer - dt);
      step.progress = (1 - this.stepTimer / full) * 100;
      if (this.stepTimer <= 0) this.advance();
    } else if (step.type === 'escape') {
      if (game.wanted === 0) {
        this.cleanupTimer += dt;
        step.progress = clamp(this.cleanupTimer * 50, 0, 100);
        if (this.cleanupTimer > 1.4) this.advance();
      } else {
        this.cleanupTimer = 0;
      }
    }
  }

  advance() {
    if (!this.active) return;
    this.step.progress = undefined;
    this.nextStep();
  }

  finish() {
    if (!this.active) return;
    this.active = false;
    this.clearContact();
    for (const h of this.stepHostiles) {
      if (h.alive) this.game.removeHostile(h);
    }
    this.stepHostiles = [];
    this.markerPos = null;
    this.game.onMissionComplete(this.mission, {
      time: this.game.sessionTime - this.startedAt,
      wanted: this.game.wanted,
      initialWanted: this.initialWanted
    });
  }

  abort() {
    this.active = false;
    this.clearContact();
    for (const h of this.stepHostiles) this.game.removeHostile(h);
    this.stepHostiles = [];
    this.markerPos = null;
    this.step = null;
  }
}

// ============================================================
// GAME
// ============================================================
class Game {
  constructor() {
    this.audio = new AudioManager();
    this.missions = MISSIONS;
    this.ui = new UI(this);
    this.settings = this.ui.settings;

    this.state = 'boot';
    this.cinematic = true;
    this.sessionTime = 0;
    this.timeOfDay = 19 * 60 + 20;
    this.last = 0;
    this.elapsed = 0;
    this.hudTimer = 0;
    this.mapTimer = 0;
    this.fpsAvg = 60;
    this.adaptiveScale = 1;
    this.adaptTimer = 0;
    this.starting = false;
    this.pauseReturn = null;
    this.mapReturn = null;
    this.pendingNextMission = null;
    this.job = null;
    this.jobTimer = 0;
    this.hostiles = [];
    this.npcs = [];
    this.vehicles = [];
    this.policeCars = [];
    this.traffic = [];
    this.inVehicle = false;
    this.activeVehicle = null;
    this.aiming = false;
    this.locked = false;
    this.fireCooldown = 0;
    this.reloadTimer = 0;
    this.footstepTimer = 0;
    this.grace = 0;
    this.camYaw = Math.PI * 1.5;
    this.camPitch = 0.16;
    this.camDistance = 5.4;
    this.keys = new Set();
    this.mouseDown = false;
    this.touchMove = { x: 0, y: 0 };
    this.jumpRequested = false;
    this.isTouch = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints > 0 && innerWidth < 1100);
    this.player = {
      position: new THREE.Vector3(-74, 0, 94),
      heading: Math.PI / 2,
      health: 100,
      armor: 60,
      stamina: 100,
      mag: 12,
      reserve: 48,
      weapon: 'pistol',
      vy: 0,
      onGround: true,
      dead: false
    };
    this.money = 2500;
    this.moneyDelta = 0;
    this.moneyDeltaTimer = null;
    this.wanted = 0;
    this.wantedHeat = 0;
    this.wantedLabel = 'Limpo';
    this.searchProgress = 0;
    this.policeSpawnTimer = 0;
    this.rp = { rep: 12, money: 2500 };
    this.completedMissions = [];
    this.playMode = 'story';

    this.setupRenderer();
    this.setupScene();
    this.loadProgress();
    this.bindInput();
    this.patchUI();
  }

  setupRenderer() {
    this.canvas = document.querySelector('#game-canvas');
    const perf = this.settings.qualityPreset === 'performance';
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !perf,
      powerPreference: 'high-performance',
      stencil: false
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = this.settings.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.basePixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
    this.renderer.setPixelRatio(this.basePixelRatio * this.settings.resolutionScale);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.ui?.toast('Contexto gráfico perdido. Recarregue a página.', 'warn');
    });
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.12, 1200);
    this.camera.position.set(120, 60, 160);
    this.camera.lookAt(0, 24, -80);
  }

  loadProgress() {
    const save = this.loadSave();
    if (!save) return;
    this.money = Number.isFinite(save.money) ? save.money : 2500;
    this.completedMissions = Array.isArray(save.completedMissions) ? [...new Set(save.completedMissions)] : [];
    this.rp = { rep: save.rp?.rep ?? 12, money: save.rp?.money ?? this.money };
    this.playMode = save.playMode || 'story';
    if (save.timeOfDay) this.timeOfDay = save.timeOfDay;
    if (save.position && Number.isFinite(save.position.x)) {
      this.player.position.set(save.position.x, 0, save.position.z);
    }
  }

  async boot() {
    const ui = this.ui;
    try {
      ui.bootProgress(5, 'Acordando o sistema…');
      await frame();
      await delay(260);
      ui.bootProgress(17, 'Verificando pacote de mundo…');
      await frame();
      await delay(220);
      ui.bootProgress(31, 'Construindo Costa Dourada…');
      await frame();
      await delay(80);
      this.world = createWorld(this.scene, this.renderer, this.settings);
      ui.bootProgress(56, 'Acendendo os letreiros…');
      await frame();
      await delay(260);
      this.initEntities();
      this.spawnNPCs();
      this.spawnVehicles();
      this.spawnTraffic();
      this.applySettings();
      this.snapCamera();
      ui.bootProgress(78, 'Sincronizando controles e rádio…');
      await delay(360);
      ui.bootProgress(92, 'Aquecendo os motores…');
      this.startLoop();
      await delay(300);
      ui.bootProgress(100, 'Bem-vindo a Costa Dourada.');
      await delay(620);
      this.state = 'menu';
      this.cinematic = true;
      ui.bootDone();
      ui.buildMissionList();
    } catch (err) {
      console.error('[Matteo 5] Falha ao iniciar:', err);
      ui.bootProgress(100, 'Falha ao iniciar o renderizador.');
      this.showFatal(err);
    }
  }

  showFatal(err) {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:0;z-index:120;display:grid;place-items:center;background:#041011;color:#f3efe7;text-align:center;padding:30px;font:14px Outfit,sans-serif';
    box.innerHTML = `<div><p style="font:700 12px Outfit;letter-spacing:.2em;color:#f6c768">MATTEO 5 · ERRO</p>
      <h1 style="font:800 46px "Barlow Condensed";letter-spacing:.04em;margin:10px 0">NÃO FOI POSSÍVEL ABRIR O MUNDO</h1>
      <p style="max-width:520px;color:#91a5a2;margin:auto">Seu navegador pode não oferecer WebGL 2. Ative a aceleração de hardware e recarregue.</p>
      <pre style="max-width:760px;overflow:auto;margin:18px auto 0;padding:12px;background:#07191b;border:1px solid #1c3a3a;color:#ff9f8b;text-align:left">${String(err && err.message || err)}</pre></div>`;
    document.body.appendChild(box);
  }

  initEntities() {
    const ground = (x, z) => this.world.getGroundHeight(x, z);
    this.luiza = createLuiza();
    this.carlos = createCarlos();
    for (const c of [this.luiza, this.carlos]) {
      c.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
      this.scene.add(c.root);
      c.root.visible = false;
    }
    this.luiza.root.position.set(this.player.position.x, ground(this.player.position.x, this.player.position.z), this.player.position.z);
    this.carlos.root.position.copy(this.luiza.root.position);
    this.activeChar = this.luiza;
    this.activeChar.root.visible = true;
    this.activeChar.setWeapon('pistol');
    this.missionManager = new MissionManager(this);
    this.tracer = createTracer(this.scene);
    this.weapons = { pistol: { mag: 12, reserve: 48 }, smg: { mag: 30, reserve: 90 } };
    this.reloading = false;
    this.characterCooldown = 0;
  }

  spawnNPCs() {
    const spawns = this.world.npcSpawns.slice(0, this.settings.qualityPreset === 'performance' ? 10 : 18);
    for (const s of spawns) {
      const char = createRandomNPC(s.name);
      const y = this.world.getGroundHeight(s.x, s.z);
      char.root.position.set(s.x, y, s.z);
      char.setAiming(false);
      char.weapon.visible = false;
      char.smg.visible = false;
      this.scene.add(char.root);
      this.npcs.push({
        char, root: char.root, position: char.root.position, name: s.name, walking: !!s.walking,
        axis: s.axis || 'x', dir: Math.random() > .5 ? 1 : -1,
        speed: .55 + Math.random() * .8,
        homeX: s.x, homeZ: s.z, dead: false, deadTimer: 0,
        chatter: Math.floor(Math.random() * LINES.chatterPT.length)
      });
    }
  }

  makeVehicle(spawn, options = {}) {
    const model = createVehicle(spawn.type || 'hatch', spawn.color || 0xf1eee3, options);
    const v = {
      model, root: model.root, position: model.root.position,
      heading: spawn.rotY || 0, speed: 0, steering: 0,
      type: spawn.type || 'hatch', color: spawn.color || 0xf1eee3,
      health: 100, occupied: false, ai: !!options.ai, patrol: false,
      lane: options.lane || null, wrap: options.wrap || null,
      hero: !!spawn.hero
    };
    v.root.position.set(spawn.x, 0, spawn.z);
    v.root.rotation.y = v.heading;
    this.scene.add(v.root);
    this.vehicles.push(v);
    return v;
  }

  spawnVehicles() {
    for (const s of this.world.vehicleSpawns) this.makeVehicle(s);
  }

  spawnTraffic() {
    const lanes = [
      { z: 82, dir: 1, x: -300 },
      { z: 82, dir: -1, x: 240 },
      { z: -10, dir: 1, x: -160 }
    ];
    for (const lane of lanes) {
      const v = this.makeVehicle({
        x: lane.x, z: lane.z, rotY: lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2,
        type: Math.random() > .5 ? 'hatch' : 'pickup',
        color: [0x2c8d8b, 0xd6594e, 0xefb94e, 0xf1eee3][Math.floor(Math.random() * 4)]
      }, { ai: true, lane });
      v.lane = lane;
      this.traffic.push(v);
    }
  }

  freeSpot(x, z, spread = 4) {
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = i === 0 ? 0 : Math.random() * spread;
      const px = x + Math.cos(a) * r;
      const pz = z + Math.sin(a) * r;
      let blocked = false;
      for (const c of this.world.colliders) {
        if (px > c.minX - 1.2 && px < c.maxX + 1.2 && pz > c.minZ - 1.2 && pz < c.maxZ + 1.2) { blocked = true; break; }
      }
      if (!blocked) return new THREE.Vector3(px, 0, pz);
    }
    return new THREE.Vector3(x, 0, z);
  }

  snapCamera() {
    const p = this.inVehicle && this.activeVehicle ? this.activeVehicle.root.position : this.player.position;
    const dist = this.inVehicle ? 8.6 : this.camDistance;
    const horiz = Math.cos(this.camPitch) * dist;
    this.camera.position.set(
      p.x + Math.sin(this.camYaw) * horiz,
      p.y + (this.inVehicle ? 3.2 : 2.1) + Math.sin(this.camPitch) * dist,
      p.z + Math.cos(this.camYaw) * horiz
    );
    this.camera.lookAt(p.x, p.y + (this.inVehicle ? 1.2 : 1.45), p.z);
  }

  applySettings() {
    const s = this.settings;
    const perf = s.qualityPreset === 'performance';
    this.renderer.shadowMap.enabled = !!s.shadows;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6) * s.resolutionScale * this.adaptiveScale);
    this.basePixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.world) {
      this.world.setQuality(s.qualityPreset);
      if (!s.shadows) this.world.sunLight.castShadow = false;
      const fog = s.drawDistance === 'low' ? .0026 : s.drawDistance === 'medium' ? .0018 : perf ? .0017 : .0012;
      this.scene.fog.density = fog;
      if (this.world.oceanUniforms) this.world.oceanUniforms.uTime.value = this.elapsed;
    }
    this.audio.setMusic(s.music);
    this.audio.setSfx(s.sfx);
    this.audio.setMuted(s.muted);
    document.body.classList.toggle('force-touch', !!s.forceTouch);
    this.ui.applyCSS();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6) * this.settings.resolutionScale * this.adaptiveScale);
    this.renderer.setSize(w, h);
  }

  patchUI() {
    const ui = this.ui;
    const closePause = ui.closePause.bind(ui);
    ui.closePause = () => {
      closePause();
      this.settingsFromMenu = false;
      if (this.pauseReturn === 'menu') {
        this.pauseReturn = null;
        ui.showGameMenu();
      }
    };
    const closeMap = ui.closeMap.bind(ui);
    ui.closeMap = () => {
      closeMap();
      if (this.mapReturn === 'menu') {
        this.mapReturn = null;
        ui.showGameMenu();
      }
    };
    window.addEventListener('resize', () => this.resize());
  }

  openSettings() {
    const ui = this.ui;
    if (!this.world) return;
    if (this.state === 'playing') {
      ui.openPause();
    } else {
      this.pauseReturn = 'menu';
      ui.showGameMenu();
      const previous = this.state;
      this.state = 'playing';
      ui.openPause();
      this.state = previous === 'menu' ? 'paused' : this.state;
    }
    this.selectPauseTab('settings');
  }

  selectPauseTab(name) {
    const ui = this.ui;
    ui.currentTab = name;
    document.querySelectorAll('.pause-tabs button').forEach(b => b.classList.toggle('active', b.dataset.pauseTab === name));
    document.querySelectorAll('.pause-panel').forEach(p => p.classList.toggle('active', p.dataset.pausePanel === name));
  }

  openMapPreview() {
    if (!this.world) return;
    this.mapReturn = 'menu';
    this.state = 'playing';
    this.ui.openMapPreview();
    this.mapReturn = 'menu';
  }

  // ---------------- INPUT ----------------
  bindInput() {
    const canvas = this.canvas;
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => { this.keys.delete(e.code); });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouseDown = false;
      this.aiming = false;
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
    });
    window.addEventListener('pointerdown', () => {
      this.audio.init();
      this.audio.resume();
    }, { passive: true });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        e.preventDefault();
        if (this.state === 'playing') this.aiming = true;
        return;
      }
      if (e.button !== 0) return;
      if (this.state !== 'playing') return;
      this.audio.init();
      this.audio.resume();
      if (!this.isTouch && !this.locked) this.captureInput();
      this.mouseDown = true;
      this.fire();
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDown = false;
      if (e.button === 2) this.aiming = false;
    });
    window.addEventListener('mousemove', (e) => {
      if (this.state !== 'playing') return;
      if (!this.locked && !(e.buttons & 1)) return;
      if (this.locked || (e.buttons & 1)) {
        const sens = this.settings.lookSensitivity * 0.0022;
        this.camYaw -= e.movementX * sens;
        const inv = this.settings.invertY ? -1 : 1;
        this.camPitch = clamp(this.camPitch + e.movementY * sens * 0.8 * inv, -0.55, 0.98);
      }
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('click', () => {
      if (this.state === 'playing' && !this.locked && !this.isTouch) this.captureInput();
    });
    this.bindTouch();
  }

  bindTouch() {
    const stick = document.querySelector('#stick-zone');
    const knob = document.querySelector('#stick-knob');
    const look = document.querySelector('#look-zone');
    if (stick) {
      let id = null, base = null;
      const start = (e) => {
        if (id !== null) return;
        id = e.pointerId;
        const r = stick.getBoundingClientRect();
        base = { x: r.left + r.width / 2, y: r.top + r.height / 2, size: r.width * .42 };
        stick.setPointerCapture?.(e.pointerId);
        move(e);
      };
      const move = (e) => {
        if (e.pointerId !== id || !base) return;
        let dx = (e.clientX - base.x) / base.size;
        let dy = (e.clientY - base.y) / base.size;
        const len = Math.hypot(dx, dy);
        if (len > 1) { dx /= len; dy /= len; }
        this.touchMove.x = dx;
        this.touchMove.y = -dy;
        if (knob) knob.style.transform = `translate(${dx * 26}px, ${dy * 26}px)`;
      };
      const end = (e) => {
        if (e.pointerId !== id) return;
        id = null; base = null;
        this.touchMove.x = 0; this.touchMove.y = 0;
        if (knob) knob.style.transform = 'translate(0,0)';
      };
      stick.addEventListener('pointerdown', start);
      stick.addEventListener('pointermove', move);
      stick.addEventListener('pointerup', end);
      stick.addEventListener('pointercancel', end);
    }
    if (look) {
      let id = null, last = null;
      look.addEventListener('pointerdown', (e) => {
        id = e.pointerId; last = { x: e.clientX, y: e.clientY };
        look.setPointerCapture?.(e.pointerId);
        this.audio.init();
      });
      look.addEventListener('pointermove', (e) => {
        if (e.pointerId !== id || !last || this.state !== 'playing') return;
        const sens = this.settings.lookSensitivity * 0.0045;
        this.camYaw -= (e.clientX - last.x) * sens;
        this.camPitch = clamp(this.camPitch + (e.clientY - last.y) * sens * .8 * (this.settings.invertY ? -1 : 1), -0.55, .98);
        last = { x: e.clientX, y: e.clientY };
      });
      const end = () => { id = null; last = null; };
      look.addEventListener('pointerup', end);
      look.addEventListener('pointercancel', end);
    }
    document.querySelectorAll('.ps-btn[data-action]').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.audio.init();
        if (this.state !== 'playing') return;
        switch (btn.dataset.action) {
          case 'interact': this.interact(); break;
          case 'fire': this.fire(); break;
          case 'jump': this.jumpRequested = true; break;
          case 'vehicle': this.toggleVehicle(); break;
          case 'switch': this.switchCharacter(); break;
          case 'reload': this.reload(); break;
        }
      });
    });
    const aim = document.querySelector('#mobile-aim');
    if (aim) aim.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.aiming = !this.aiming;
      aim.classList.toggle('on', this.aiming);
    });
  }

  onKeyDown(e) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    this.keys.add(e.code);
    if (e.repeat) return;
    if (this.state === 'menu' && (e.code === 'Enter' || e.code === 'NumpadEnter')) {
      this.startFromMenu('continue');
      return;
    }
    if (this.state !== 'playing') return;
    switch (e.code) {
      case 'KeyE': {
        if (this.ui.dialogueActive) this.ui.advanceDialogue();
        else this.interact();
        break;
      }
      case 'KeyF': this.toggleVehicle(); break;
      case 'Space': this.jumpRequested = true; break;
      case 'KeyP': this.switchCharacter(); break;
      case 'KeyM': this.ui.openMap(); break;
      case 'KeyJ': this.ui.openPhone(); break;
      case 'KeyR': this.reload(); break;
      case 'KeyQ': this.switchWeapon(); break;
    }
  }

  captureInput() {
    if (this.isTouch) return;
    try {
      if (this.canvas.requestPointerLock && !this.locked) {
        const res = this.canvas.requestPointerLock();
        if (res && res.catch) res.catch(() => {});
      }
    } catch { /* pointer lock can be denied */ }
  }

  releaseInput() {
    this.keys.clear();
    this.mouseDown = false;
    this.aiming = false;
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch { /* noop */ }
  }

  // ---------------- LOOP ----------------
  startLoop() {
    this.last = performance.now();
    const loop = (now) => {
      requestAnimationFrame(loop);
      const dt = clamp((now - this.last) / 1000, 0, 0.05);
      this.last = now;
      this.update(dt);
      try { this.renderer.render(this.scene, this.camera); } catch (err) { console.error('[Matteo 5] render:', err); }
    };
    requestAnimationFrame(loop);
  }

  update(dt) {
    if (!this.world) return;
    this.elapsed += dt;
    const playing = this.state === 'playing';
    if (playing) {
      this.sessionTime += dt;
      this.timeOfDay = (this.timeOfDay + dt / 3) % 1440;
      this.fpsAvg = lerp(this.fpsAvg, dt > 0 ? 1 / dt : 60, .05);
      this.adaptTimer += dt;
      if (this.adaptTimer > 2.2) {
        this.adaptTimer = 0;
        if (this.settings.adaptiveResolution) {
          if (this.fpsAvg < 46) this.adaptiveScale = clamp(this.adaptiveScale - .06, .58, 1);
          else if (this.fpsAvg > 57 && this.adaptiveScale < 1) this.adaptiveScale = clamp(this.adaptiveScale + .03, .58, 1);
          const target = this.basePixelRatio * this.settings.resolutionScale * this.adaptiveScale;
          if (Math.abs(this.renderer.getPixelRatio() - target) > .03) {
            this.renderer.setPixelRatio(target);
            this.renderer.setSize(window.innerWidth, window.innerHeight);
          }
        }
      }
    }
    this.world.update(dt, this.elapsed, this.player.position, this.camera);
    if (this.audio.started) this.audio.update(dt);

    if (playing) {
      this.updateGameplay(dt);
      this.updateCamera(dt, false);
      this.hudTimer += dt;
      if (this.hudTimer > .1) {
        this.hudTimer = 0;
        this.refreshHUD();
      }
    } else if (this.state === 'dead') {
      this.updateCamera(dt, false);
    } else if (this.state === 'menu') {
      this.updateCinematicCamera(dt);
    } else {
      this.updateCamera(dt, false);
    }
  }

  updateCinematicCamera(dt) {
    const a = this.elapsed * .035;
    const desired = this._cine || (this._cine = new THREE.Vector3());
    desired.set(Math.cos(a) * 430, 126 + Math.sin(a * .7) * 8, 24 + Math.sin(a) * 430);
    if (!this._cineInit) {
      this.camera.position.copy(desired);
      this._cineInit = true;
    } else {
      this.camera.position.lerp(desired, 1 - Math.exp(-1.4 * dt));
    }
    const look = this._cineLook || (this._cineLook = new THREE.Vector3());
    look.set(Math.sin(a * .5) * 26, 28, -70);
    this.camera.lookAt(look);
  }

  updateCamera(dt, snap) {
    if (!this._desired) {
      this._desired = new THREE.Vector3();
      this._look = new THREE.Vector3();
    }
    const driving = this.inVehicle && this.activeVehicle;
    const p = driving ? this.activeVehicle.root.position : this.player.position;
    let dist, height, lookY;
    if (driving) {
      const speed = Math.abs(this.activeVehicle.speed);
      dist = 8.6 + Math.min(2.6, speed * .075);
      height = 2.9 + Math.sin(this.camPitch) * dist * .85;
      lookY = 1.25;
      if (this.locked && speed > 2) {
        this.camYaw = angleLerp(this.camYaw, this.activeVehicle.heading + Math.PI, clamp(dt * .55, 0, 1));
      }
    } else {
      dist = this.aiming ? 3.15 : this.camDistance;
      height = 1.6 + Math.sin(this.camPitch) * dist;
      lookY = 1.45;
    }
    const horiz = Math.cos(this.camPitch) * dist;
    this._desired.set(
      p.x + Math.sin(this.camYaw) * horiz,
      p.y + height,
      p.z + Math.cos(this.camYaw) * horiz
    );
    if (!driving && this.aiming) {
      this._desired.x += Math.cos(this.camYaw) * .55;
      this._desired.z -= Math.sin(this.camYaw) * .55;
    }
    this._desired.y = Math.max(this._desired.y, 1.0);
    const t = snap ? 1 : 1 - Math.exp(-13 * dt);
    this.camera.position.lerp(this._desired, t);
    this._look.lerp(new THREE.Vector3(p.x, p.y + lookY, p.z), snap ? 1 : 1 - Math.exp(-16 * dt));
    this.camera.lookAt(this._look);
  }

  refreshHUD() {
    const ui = this.ui;
    ui.fps = this.fpsAvg;
    ui.updateHUD(this);
    ui.setSearchProgress(this.searchProgress);
    if (this.missionManager?.active && this.missionManager.step) {
      const step = this.missionManager.step;
      ui.updateObjective(this.missionManager.mission, step, this.missionManager.distanceToTarget());
    } else if (this.job) {
      const step = {
        textPt: this.job.textPt, textEn: this.job.textEn, checkpoint: false,
        progress: this.job.type === 'security' ? this.job.progress : undefined
      };
      ui.updateObjective({ index: 0, title: { pt: this.job.titlePt, en: this.job.titleEn } }, step, this.job.distance());
    } else {
      ui.hideObjective();
    }
    ui.drawMinimap();
  }

  // ---------------- SMALL HELPERS ----------------
  clockString() {
    const total = ((this.timeOfDay % 1440) + 1440) % 1440;
    const h = Math.floor(total / 60), m = Math.floor(total % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  dayString() {
    const pt = this.ui.language === 'pt';
    const days = pt ? ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'] : ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const h = Math.floor(this.timeOfDay / 60) % 24;
    const period = pt
      ? (h < 6 ? 'MADRUGADA' : h < 12 ? 'MANHÃ' : h < 18 ? 'TARDE' : 'NOITE')
      : (h < 6 ? 'LATE NIGHT' : h < 12 ? 'MORNING' : h < 18 ? 'AFTERNOON' : 'NIGHT');
    return `${days[new Date().getDay()]} · ${period}`;
  }

  addMoney(amount) {
    this.money = Math.max(0, this.money + amount);
    this.rp.money = this.money;
    this.moneyDelta = Math.max(0, amount);
    this.ui.setMoney(this.money);
    if (this.moneyDeltaTimer) clearTimeout(this.moneyDeltaTimer);
    this.moneyDeltaTimer = setTimeout(() => { this.moneyDelta = 0; }, 2400);
  }

  wantedLabelText() {
    const list = this.ui.language === 'pt' ? WANTED_PT : WANTED_EN;
    return list[clamp(this.wanted, 0, 6)] || list[0];
  }

  crime(amount) {
    if (this.state !== 'playing') return;
    const before = this.wanted;
    this.wantedHeat = clamp(this.wantedHeat + amount, 0, 6.65);
    this.wanted = clamp(Math.round(this.wantedHeat), 0, 6);
    this.wantedLabel = this.wantedLabelText();
    this.searchProgress = Math.max(0, this.searchProgress - 18);
    if (this.wanted > 0) this.audio.sirenStart();
    if (this.wanted > before) {
      this.ui.notify('★', this.ui.language === 'pt' ? `Nível de procurado ${this.wanted}` : `Wanted level ${this.wanted}`);
      this.ui.hudToast(this.wantedLabel.toUpperCase());
    }
  }

  clearWanted(silent = false) {
    this.wanted = 0;
    this.wantedHeat = 0;
    this.searchProgress = 0;
    this.wantedLabel = this.wantedLabelText();
    this.audio.sirenStop();
    for (const car of this.policeCars) {
      car.root.parent?.remove(car.root);
    }
    this.policeCars = [];
    this.ui.setSearchProgress(0);
    if (!silent) this.ui.notify('✓', this.ui.language === 'pt' ? 'Você despistou a polícia.' : 'You lost the police.');
  }

  damagePlayer(amount) {
    if (this.state !== 'playing' || this.player.dead || this.grace > 0) return;
    let dmg = amount;
    if (this.player.armor > 0) {
      const absorbed = Math.min(this.player.armor, dmg * .62);
      this.player.armor -= absorbed;
      dmg -= absorbed;
    }
    this.player.health = clamp(this.player.health - dmg, 0, 100);
    this.regenTimer = 8;
    const v = document.querySelector('#damage-vignette');
    if (v) {
      v.classList.add('show');
      setTimeout(() => v.classList.remove('show'), 190);
    }
    if (this.settings.haptics && navigator.vibrate) navigator.vibrate(24);
    if (this.player.health <= 0) this.die();
  }

  die() {
    if (this.player.dead) return;
    this.player.dead = true;
    this.player.health = 0;
    this.state = 'dead';
    this.aiming = false;
    this.mouseDown = false;
    this.releaseInput();
    this.audio.error();
    if (this.inVehicle) this.audio.engineOn(false);
    this.activeChar.update(0, { dead: true });
    this.ui.showWasted(this.ui.language === 'pt'
      ? 'A maré devolve tudo. Menos o orgulho.'
      : 'The tide gives everything back. Except pride.');
  }

  // ---------------- GAMEPLAY ----------------
  updateGameplay(dt) {
    this.grace = Math.max(0, this.grace - dt);
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.characterCooldown = Math.max(0, (this.characterCooldown || 0) - dt);
    this.regenTimer = Math.max(0, (this.regenTimer || 0) - dt);
    if (this.player.health > 0 && this.regenTimer <= 0) {
      this.player.health = Math.min(100, this.player.health + dt * 1.6);
    }
    if (this.reloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const max = this.player.weapon === 'smg' ? 30 : 12;
        const take = Math.min(max - this.player.mag, this.player.reserve);
        this.player.mag += take;
        this.player.reserve -= take;
        this.reloading = false;
      }
    }
    if (this.mouseDown && this.player.weapon === 'smg' && !this.inVehicle) this.fire();
    if (this.tracer) this.tracer.update(dt);

    if (this.inVehicle) this.updateVehicle(dt);
    else this.updateOnFoot(dt);

    this.updateNPCs(dt);
    this.updateHostiles(dt);
    this.updateTraffic(dt);
    this.updateWanted(dt);
    this.updatePolice(dt);
    this.updatePrompt();
    this.missionManager.update(dt);
    this.updateJob(dt);
    this.jumpRequested = false;
  }

  updateOnFoot(dt) {
    const p = this.player;
    if (p.dead) return;
    const fwd = (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) - (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
    const side = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
    let ix = side + this.touchMove.x;
    let iz = fwd + this.touchMove.y;
    const mag = Math.hypot(ix, iz);
    if (mag > 1) { ix /= mag; iz /= mag; }
    const moving = mag > .08;

    const sprinting = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) && p.stamina > 2 && moving;
    const targetSpeed = moving ? (this.aiming ? 2.5 : sprinting ? 7.4 : 4.2) : 0;
    if (sprinting) p.stamina = clamp(p.stamina - dt * 16, 0, 100);
    else p.stamina = clamp(p.stamina + dt * 11, 0, 100);

    const fx = -Math.sin(this.camYaw), fz = -Math.cos(this.camYaw);
    const rx = Math.cos(this.camYaw), rz = -Math.sin(this.camYaw);
    const mx = fx * iz + rx * ix;
    const mz = fz * iz + rz * ix;
    const len = Math.hypot(mx, mz) || 1;
    this.moveSpeed = damp(this.moveSpeed || 0, targetSpeed, 10, dt);

    if (moving) {
      p.heading = Math.atan2(mx / len, mz / len);
      this.footstepTimer -= dt;
      if (this.footstepTimer <= 0 && p.onGround) {
        this.audio.footstep();
        this.footstepTimer = sprinting ? .29 : .44;
      }
    }

    const next = this._next || (this._next = new THREE.Vector3());
    next.set(p.position.x + (mx / len) * this.moveSpeed * dt, p.position.y, p.position.z + (mz / len) * this.moveSpeed * dt);
    this.resolveCollision(next, .42);
    p.position.x = next.x;
    p.position.z = next.z;

    if (this.jumpRequested && p.onGround) {
      p.vy = 5.9;
      p.onGround = false;
      this.audio.footstep();
    }
    const ground = this.world.getGroundHeight(p.position.x, p.position.z);
    p.vy -= 19 * dt;
    p.position.y += p.vy * dt;
    if (p.position.y <= ground) {
      p.position.y = ground;
      p.vy = 0;
      p.onGround = true;
    }

    this.activeChar.root.position.copy(p.position);
    this.activeChar.root.visible = true;
    this.activeChar.update(dt, {
      speed: moving ? this.moveSpeed : 0,
      rotationY: p.heading,
      aiming: this.aiming,
      lookPitch: this.camPitch * .35
    });
    this.activeChar.setWeapon(p.weapon);
  }

  updateVehicle(dt) {
    const v = this.activeVehicle;
    if (!v) { this.inVehicle = false; return; }
    const fwd = (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) - (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
    const side = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
    const throttle = clamp(fwd + this.touchMove.y, -1, 1);
    const steer = clamp(side - this.touchMove.x, -1, 1);
    const handbrake = this.keys.has('Space') || this.jumpRequested;

    if (throttle > 0) v.speed += 10.5 * throttle * dt;
    else if (throttle < 0) v.speed -= (v.speed > .6 ? 23 : 7) * dt;
    else v.speed *= Math.exp(-1.15 * dt);
    if (handbrake) v.speed *= Math.exp(-4.8 * dt);
    v.speed = clamp(v.speed, -9, 28);

    if (Math.abs(v.speed) > .25) {
      const grip = handbrake ? .45 : 1;
      v.heading += steer * clamp(Math.abs(v.speed) / 6, 0, 1) * 1.25 * dt * grip * (v.speed < 0 ? -1 : 1);
    }

    const next = this._next || (this._next = new THREE.Vector3());
    next.copy(v.root.position);
    next.x += Math.sin(v.heading) * v.speed * dt;
    next.z += Math.cos(v.heading) * v.speed * dt;
    const bx = next.x, bz = next.z;
    this.resolveCollision(next, 1.45);
    if (Math.abs(next.x - bx) > .015 || Math.abs(next.z - bz) > .015) {
      v.speed *= -.18;
      this.audio.noise(.12, .12, 240);
    }
    v.root.position.x = next.x;
    v.root.position.z = next.z;
    v.root.position.y = 0;
    v.root.rotation.y = v.heading;
    v.model.update(dt, { speed: v.speed, steering: steer * .55, siren: false });
    this.player.position.copy(v.root.position);
    this.player.heading = v.heading;
    this.player.weapon = this.player.weapon;
    this.audio.updateEngine(Math.abs(v.speed), 28, Math.max(0, throttle));
    this.moveSpeed = Math.abs(v.speed);
  }

  resolveCollision(pos, radius) {
    const b = this.world.bounds;
    pos.x = clamp(pos.x, b.minX + radius, b.maxX - radius);
    pos.z = clamp(pos.z, b.minZ + radius, 148 - radius);
    for (const c of this.world.colliders) {
      if (pos.x > c.minX - radius && pos.x < c.maxX + radius && pos.z > c.minZ - radius && pos.z < c.maxZ + radius) {
        const dl = pos.x - (c.minX - radius);
        const dr = (c.maxX + radius) - pos.x;
        const dt = pos.z - (c.minZ - radius);
        const db = (c.maxZ + radius) - pos.z;
        const m = Math.min(dl, dr, dt, db);
        if (m === dl) pos.x = c.minX - radius;
        else if (m === dr) pos.x = c.maxX + radius;
        else if (m === dt) pos.z = c.minZ - radius;
        else pos.z = c.maxZ + radius;
      }
    }
  }

  updateNPCs(dt) {
    for (const npc of this.npcs) {
      if (npc.dead) {
        npc.deadTimer += dt;
        npc.char.update(dt, { dead: true });
        if (npc.deadTimer > 18) {
          npc.root.parent?.remove(npc.root);
          npc.removed = true;
        }
        continue;
      }
      if (!npc.walking) {
        npc.char.update(dt, { speed: 0 });
        continue;
      }
      let vx = 0, vz = 0, speed = npc.speed;
      if (npc.axis === 'x') {
        vx = npc.dir * speed * dt;
        if (npc.root.position.x < -395 || npc.root.position.x > 395) npc.dir *= -1;
      } else {
        vz = npc.dir * speed * dt;
        if (npc.root.position.z < 91 || npc.root.position.z > 105) npc.dir *= -1;
      }
      npc.root.position.x = clamp(npc.root.position.x + vx, -395, 395);
      npc.root.position.z = clamp(npc.root.position.z + vz, 91, 105);
      npc.root.position.y = this.world.getGroundHeight(npc.root.position.x, npc.root.position.z);
      const heading = npc.axis === 'x' ? (npc.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (npc.dir > 0 ? 0 : Math.PI);
      npc.char.update(dt, { speed, rotationY: heading });
    }
    this.npcs = this.npcs.filter(n => !n.removed);
  }

  updateHostiles(dt) {
    const p = this.player.position;
    for (const h of this.hostiles) {
      if (!h.alive) {
        h.deadTimer += dt;
        h.char.update(dt, { dead: true });
        continue;
      }
      const dx = p.x - h.root.position.x;
      const dz = p.z - h.root.position.z;
      const dist = Math.hypot(dx, dz);
      let speed = 0;
      if (dist > 9.5 && dist < 70) {
        const len = Math.hypot(dx, dz) || 1;
        const next = this._next || (this._next = new THREE.Vector3());
        next.set(h.root.position.x + (dx / len) * 2.7 * dt, 0, h.root.position.z + (dz / len) * 2.7 * dt);
        this.resolveCollision(next, .38);
        h.root.position.x = next.x;
        h.root.position.z = next.z;
        speed = 2.7;
      }
      h.root.position.y = this.world.getGroundHeight(h.root.position.x, h.root.position.z);
      const heading = Math.atan2(dx, dz);
      h.char.update(dt, { speed, rotationY: heading, aiming: true });
      h.fireTimer -= dt;
      if (dist < 36 && h.fireTimer <= 0 && this.grace <= 0) {
        h.fireTimer = (h.kind === 'police' ? 1.35 : 1.55) + Math.random() * .7;
        const from = new THREE.Vector3(h.root.position.x, h.root.position.y + 1.25, h.root.position.z);
        const to = new THREE.Vector3(p.x, p.y + 1.15, p.z);
        if (dist < 55) this.tracer?.fire(from, to, 0xffd28a);
        this.audio.shoot('pistol');
        const chance = h.kind === 'police' ? .4 : .33;
        if (Math.random() < chance) {
          this.damagePlayer(3 + Math.random() * 4);
          this.showHitmarker(false);
        }
      }
    }
    this.hostiles = this.hostiles.filter(h => h.alive || h.deadTimer < 16);
  }

  updateTraffic(dt) {
    for (const v of this.traffic) {
      if (v.occupied) continue;
      const lane = v.lane;
      if (!lane) continue;
      v.speed = damp(v.speed, 8, 1.2, dt);
      if (lane.z !== undefined) {
        v.root.position.x += lane.dir * v.speed * dt;
        if (v.root.position.x > 390) v.root.position.x = -390;
        if (v.root.position.x < -390) v.root.position.x = 390;
        v.heading = lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      v.root.rotation.y = v.heading;
      v.model.update(dt, { speed: v.speed, steering: 0 });
    }
  }

  updateWanted(dt) {
    this.wantedLabel = this.wantedLabelText();
    if (this.wanted <= 0) {
      this.searchProgress = 0;
      return;
    }
    this.policeSpawnTimer -= dt;
    const maxCars = Math.min(3, Math.ceil(this.wanted / 2) + (this.wanted >= 4 ? 1 : 0));
    if (this.policeCars.length < maxCars && this.policeSpawnTimer <= 0) {
      this.spawnPolice();
      this.policeSpawnTimer = Math.max(2.4, 5.2 - this.wanted * .35);
    }
    let near = false;
    for (const car of this.policeCars) {
      const d = Math.hypot(car.root.position.x - this.player.position.x, car.root.position.z - this.player.position.z);
      if (d < 130) { near = true; break; }
    }
    if (near) this.searchProgress = clamp(this.searchProgress - dt * 5, 0, 100);
    else this.searchProgress = clamp(this.searchProgress + dt * (9 + this.wanted * 1.6), 0, 100);
    if (this.searchProgress >= 100) this.clearWanted();
  }

  updatePolice(dt) {
    const p = this.player.position;
    for (const car of [...this.policeCars]) {
      const dx = p.x - car.root.position.x;
      const dz = p.z - car.root.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 260 && car.health > 0) {
        car.heading = angleLerp(car.heading, Math.atan2(dx, dz), clamp(dt * 2.2, 0, 1));
        const target = dist > 16 ? 17 : Math.max(0, dist - 12) * .4;
        car.speed = damp(car.speed, target, 1.6, dt);
        const next = this._next || (this._next = new THREE.Vector3());
        next.copy(car.root.position);
        next.x += Math.sin(car.heading) * car.speed * dt;
        next.z += Math.cos(car.heading) * car.speed * dt;
        this.resolveCollision(next, 1.4);
        car.root.position.x = next.x;
        car.root.position.z = next.z;
      }
      car.root.rotation.y = car.heading;
      car.model.update(dt, { speed: car.speed, steering: 0, siren: true });
      car.fireTimer -= dt;
      if (dist < 34 && car.fireTimer <= 0 && this.grace <= 0) {
        car.fireTimer = 1.4 + Math.random() * .8;
        const from = new THREE.Vector3(car.root.position.x, 1.3, car.root.position.z);
        const to = new THREE.Vector3(p.x, p.y + 1.1, p.z);
        this.tracer?.fire(from, to, 0x9ec1ff);
        this.audio.shoot('pistol');
        if (Math.random() < .38) this.damagePlayer(3 + Math.random() * 4);
      }
      if (car.health <= 0 || dist > 320) {
        if (car.health <= 0) {
          this.audio.noise(.5, .3, 180);
          this.ui.notify('✹', this.ui.language === 'pt' ? 'Viatura neutralizada.' : 'Police car down.');
        }
        car.root.parent?.remove(car.root);
        const i = this.policeCars.indexOf(car);
        if (i >= 0) this.policeCars.splice(i, 1);
      }
    }
  }

  updatePrompt() {
    const ui = this.ui;
    if (ui.dialogueActive || this.state !== 'playing') { ui.hidePrompt(); return; }
    if (this.inVehicle) { ui.hidePrompt(); return; }
    const npc = this.nearestNPC(3.0);
    const vehicle = this.nearestVehicle(5.2);
    if (npc && (!vehicle || this.distanceTo(npc.root.position) < this.distanceTo(vehicle.root.position) + .5)) {
      ui.showPrompt(ui.t('talk'), npc.name);
    } else if (vehicle) {
      const labels = { hatch: 'HATCH', muscle: 'MUSCLE', pickup: 'PICAPE', suv: 'SUV', van: 'VAN', police: 'VIATURA' };
      ui.showPrompt(ui.t('enter'), labels[vehicle.type] || 'VEÍCULO');
    } else {
      ui.hidePrompt();
    }
  }

  distanceTo(pos) {
    return Math.hypot(pos.x - this.player.position.x, pos.z - this.player.position.z);
  }

  nearestNPC(radius) {
    let best = null, bestD = radius;
    for (const npc of this.npcs) {
      if (npc.dead) continue;
      const d = this.distanceTo(npc.root.position);
      if (d < bestD) { bestD = d; best = npc; }
    }
    return best;
  }

  nearestVehicle(radius) {
    let best = null, bestD = radius;
    for (const v of this.vehicles) {
      if (v === this.activeVehicle) continue;
      const d = this.distanceTo(v.root.position);
      if (d < bestD) { bestD = d; best = v; }
    }
    return best;
  }

  enterVehicle(v) {
    if (!v || this.inVehicle) return;
    this.activeVehicle = v;
    v.occupied = true;
    v.ai = false;
    v.lane = null;
    this.traffic = this.traffic.filter(t => t !== v);
    this.inVehicle = true;
    this.player.position.copy(v.root.position);
    this.player.heading = v.heading;
    this.camYaw = v.heading + Math.PI;
    this.camPitch = .14;
    this.activeChar.root.visible = false;
    this.audio.engineOn(true);
    this.ui.hudToast(this.ui.language === 'pt' ? 'VEÍCULO ADQUIRIDO' : 'VEHICLE ACQUIRED');
    this.ui.hidePrompt();
    this.audio.pickup();
  }

  exitVehicle() {
    const v = this.activeVehicle;
    if (!v) return;
    let placed = false;
    for (const side of [1, -1]) {
      const rx = Math.cos(v.heading) * 2.35 * side;
      const rz = -Math.sin(v.heading) * 2.35 * side;
      const next = new THREE.Vector3(v.root.position.x + rx, 0, v.root.position.z + rz);
      const bx = next.x, bz = next.z;
      this.resolveCollision(next, .45);
      if (Math.abs(next.x - bx) < .05 && Math.abs(next.z - bz) < .05) {
        this.player.position.set(next.x, this.world.getGroundHeight(next.x, next.z), next.z);
        placed = true;
        break;
      }
    }
    if (!placed) this.player.position.copy(v.root.position);
    this.player.heading = v.heading;
    v.occupied = false;
    v.speed = 0;
    this.inVehicle = false;
    this.activeVehicle = null;
    this.camYaw = this.player.heading + Math.PI;
    this.activeChar.root.visible = true;
    this.activeChar.root.position.copy(this.player.position);
    this.audio.engineOn(false);
    this.snapCamera();
  }

  toggleVehicle() {
    if (this.state !== 'playing') return;
    if (this.inVehicle) { this.exitVehicle(); return; }
    const v = this.nearestVehicle(5.5);
    if (v) this.enterVehicle(v);
    else this.ui.toast(this.ui.t('noVehicle'), 'warn');
  }

  switchCharacter() {
    if (this.state !== 'playing' || this.player.dead) return;
    if (this.characterCooldown > 0) return;
    this.characterCooldown = .6;
    this.setActiveCharacter(this.activeChar.name === 'Luiza' ? 'Carlos' : 'Luiza');
    this.ui.hudToast(this.ui.t('switchTo'));
    this.audio.click();
  }

  setActiveCharacter(name) {
    const next = name === 'Carlos' ? this.carlos : this.luiza;
    if (!next) return;
    if (this.activeChar) this.activeChar.root.visible = false;
    this.activeChar = next;
    next.root.position.copy(this.player.position);
    next.root.visible = !this.inVehicle;
    next.setWeapon(this.player.weapon);
    if (!this.inVehicle) this.activeChar.root.position.y = this.player.position.y;
  }

  teleport(x, z, heading) {
    if (this.inVehicle) {
      if (this.activeVehicle) this.activeVehicle.occupied = false;
      this.activeVehicle = null;
      this.inVehicle = false;
      this.audio.engineOn(false);
    }
    const y = this.world.getGroundHeight(x, z);
    this.player.position.set(x, y, z);
    this.player.vy = 0;
    this.player.onGround = true;
    if (heading !== undefined) this.player.heading = heading;
    this.player.dead = false;
    if (this.activeChar) {
      this.activeChar.root.position.copy(this.player.position);
      this.activeChar.root.visible = true;
    }
    this.camYaw = this.player.heading + Math.PI;
    this.camPitch = .16;
    this.snapCamera();
  }

  positionBlocked(x, z, radius = .7) {
    if (!this.world) return false;
    return this.world.colliders.some(c =>
      x > c.minX - radius && x < c.maxX + radius && z > c.minZ - radius && z < c.maxZ + radius
    );
  }

  safeSavedPosition(pos) {
    if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.z)) return null;
    const b = this.world?.bounds;
    if (!b || pos.x < b.minX + 1 || pos.x > b.maxX - 1 || pos.z < b.minZ + 1 || pos.z > 146) return null;
    return this.positionBlocked(pos.x, pos.z) ? null : { x: pos.x, z: pos.z };
  }

  // ---------------- COMBAT ----------------
  fire() {
    if (this.state !== 'playing' || this.player.dead || this.inVehicle) return;
    if (this.fireCooldown > 0 || this.reloading) return;
    if (this.player.mag <= 0) { this.reload(); return; }
    const p = this.player;
    p.mag--;
    this.fireCooldown = p.weapon === 'smg' ? .085 : .24;
    this.audio.shoot(p.weapon);
    this.camPitch = clamp(this.camPitch + .012, -.55, .98);

    const dir = this._dir || (this._dir = new THREE.Vector3());
    this.camera.getWorldDirection(dir);
    const muzzle = new THREE.Vector3(p.position.x, p.position.y + 1.32, p.position.z).addScaledVector(dir, .75);
    const threshold = this.aiming ? .978 : .942;
    let best = null, bestScore = threshold, bestPoint = null;
    const point = new THREE.Vector3();

    const consider = (target, score) => {
      point.set(target.x, target.y, target.z);
      const to = point.clone().sub(this.camera.position);
      const d = to.length();
      if (d > 105 || d < 1) return;
      const dot = to.normalize().dot(dir);
      if (dot > score) { bestScore = dot; best = target.apply; bestPoint = point.clone(); }
    };

    for (const h of this.hostiles) {
      if (!h.alive) continue;
      consider({ x: h.root.position.x, y: h.root.position.y + 1.15, z: h.root.position.z, apply: { kind: 'hostile', entity: h } }, threshold);
    }
    for (const npc of this.npcs) {
      if (npc.dead) continue;
      consider({ x: npc.root.position.x, y: npc.root.position.y + 1.1, z: npc.root.position.z, apply: { kind: 'npc', entity: npc } }, threshold);
    }
    for (const car of this.policeCars) {
      consider({ x: car.root.position.x, y: 1.15, z: car.root.position.z, apply: { kind: 'police', entity: car } }, threshold);
    }

    const damage = p.weapon === 'smg' ? 23 : 42;
    if (best) {
      this.tracer?.fire(muzzle, bestPoint, 0xffe2a0);
      if (best.kind === 'hostile') {
        best.entity.health -= damage;
        if (best.entity.health <= 0) this.killHostile(best.entity);
        else { this.audio.hit(); this.showHitmarker(true); }
      } else if (best.kind === 'npc') {
        this.killNPC(best.entity);
      } else if (best.kind === 'police') {
        best.entity.health -= damage;
        this.audio.hit();
        this.showHitmarker(true);
        this.crime(.22);
      }
    } else {
      const far = muzzle.clone().addScaledVector(dir, 48);
      this.tracer?.fire(muzzle, far, 0xffd28a);
      this.crime(.045);
    }
    if (!this.aiming) this.activeChar.setAiming(false);
  }

  showHitmarker(kill = true) {
    const el = document.querySelector('#hitmarker');
    if (!el) return;
    el.classList.remove('show');
    void el.offsetWidth;
    el.style.color = kill ? '#fff' : '#ffb49f';
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 260);
    if (this.settings.haptics && navigator.vibrate) navigator.vibrate(kill ? 18 : 8);
  }

  killHostile(h) {
    if (!h.alive) return;
    h.alive = false;
    h.dead = true;
    h.health = 0;
    h.deadTimer = 0;
    h.char.setAiming(false);
    this.audio.hit();
    this.showHitmarker(true);
    if (!h.silent) this.crime(h.kind === 'police' ? 1.1 : .38);
    this.addMoney(h.kind === 'police' ? 95 : 65);
    this.ui.notify('◈', this.ui.language === 'pt' ? `Alvo neutralizado · +R$ ${h.kind === 'police' ? 95 : 65}` : `Target down · +R$ ${h.kind === 'police' ? 95 : 65}`);
  }

  killNPC(npc) {
    if (npc.dead) return;
    npc.dead = true;
    npc.deadTimer = 0;
    this.crime(1.8);
    this.audio.hit();
    this.showHitmarker(true);
    this.ui.notify('!', this.ui.language === 'pt' ? 'Testemunhas chamaram a polícia.' : 'Witnesses called the police.');
  }

  reload() {
    if (this.state !== 'playing' || this.inVehicle || this.reloading) return;
    const max = this.player.weapon === 'smg' ? 30 : 12;
    if (this.player.mag >= max || this.player.reserve <= 0) return;
    this.reloading = true;
    this.reloadTimer = 1.15;
    this.audio.click();
    this.ui.hudToast(this.ui.language === 'pt' ? 'RECARREGANDO' : 'RELOADING');
  }

  switchWeapon() {
    if (this.state !== 'playing') return;
    if (!this.weapons) this.weapons = { pistol: { mag: 12, reserve: 48 }, smg: { mag: 30, reserve: 90 } };
    this.weapons[this.player.weapon].mag = this.player.mag;
    this.weapons[this.player.weapon].reserve = this.player.reserve;
    this.player.weapon = this.player.weapon === 'pistol' ? 'smg' : 'pistol';
    const w = this.weapons[this.player.weapon];
    this.player.mag = w.mag;
    this.player.reserve = w.reserve;
    this.activeChar.setWeapon(this.player.weapon);
    this.reloading = false;
    this.audio.click();
    this.ui.hudToast(this.player.weapon === 'smg' ? 'SUBMETRALHADORA' : 'PISTOLA');
  }

  interact() {
    if (this.state !== 'playing') return;
    if (this.ui.dialogueActive) { this.ui.advanceDialogue(); return; }
    if (this.inVehicle) return;
    const npc = this.nearestNPC(3.4);
    if (npc) {
      const i = npc.chatter % LINES.chatterPT.length;
      this.audio.click();
      this.ui.speak([{
        name: npc.name.toUpperCase(),
        pt: LINES.chatterPT[i],
        en: LINES.chatterEN[i]
      }]);
      this.ui.hidePrompt();
    }
  }

  spawnHostiles(count, center, kind = 'gang', spread = 12, opts = {}) {
    const names = ['Vini', 'Igor', 'Nina', 'Léo', 'Rui', 'Bia', 'Duda', 'Caio'];
    const list = [];
    for (let i = 0; i < count; i++) {
      const pos = this.freeSpot(center.x, center.z, spread);
      const char = createRandomNPC(kind === 'police' ? 'Agente' : names[Math.floor(Math.random() * names.length)]);
      char.root.position.set(pos.x, this.world.getGroundHeight(pos.x, pos.z), pos.z);
      char.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
      char.setAiming(true);
      this.scene.add(char.root);
      const h = {
        char, root: char.root, position: char.root.position,
        health: kind === 'police' ? 95 : 60,
        maxHealth: kind === 'police' ? 95 : 60,
        alive: true, dead: false, deadTimer: 0,
        fireTimer: 1.1 + Math.random() * 1.4,
        kind, silent: !!opts.silent
      };
      this.hostiles.push(h);
      list.push(h);
    }
    return list;
  }

  removeHostile(h) {
    h.alive = false;
    h.root.parent?.remove(h.root);
    const i = this.hostiles.indexOf(h);
    if (i >= 0) this.hostiles.splice(i, 1);
  }

  spawnPolice() {
    const p = this.player.position;
    const a = Math.random() * Math.PI * 2;
    let x = clamp(p.x + Math.cos(a) * 135, -380, 380);
    let z = clamp(p.z + Math.sin(a) * 135, -380, 118);
    const spot = this.freeSpot(x, z, 22);
    const model = createVehicle('police', 0x172326);
    const car = {
      model, root: model.root, heading: Math.random() * Math.PI * 2,
      speed: 0, health: 220, fireTimer: 1.6, position: model.root.position
    };
    car.root.position.set(spot.x, 0, spot.z);
    car.root.rotation.y = car.heading;
    this.scene.add(car.root);
    this.policeCars.push(car);
  }

  // ---------------- JOBS / RP ----------------
  jobInfo(type) {
    const pt = this.ui.language === 'pt';
    return {
      taxi: { title: pt ? 'Rota Costa' : 'Costa Ride', titlePt: 'Rota Costa', titleEn: 'Costa Ride' },
      delivery: { title: pt ? 'Leva Já' : 'Dash Drop', titlePt: 'Leva Já', titleEn: 'Dash Drop' },
      security: { title: pt ? 'Olho Vivo' : 'Watchdog', titlePt: 'Olho Vivo', titleEn: 'Watchdog' },
      tour: { title: pt ? 'Costa Tour' : 'Costa Tour', titlePt: 'Costa Tour', titleEn: 'Costa Tour' }
    }[type] || { title: 'Costa RP', titlePt: 'Costa RP', titleEn: 'Costa RP' };
  }

  startJob(type) {
    if (this.state !== 'playing') return;
    const info = this.jobInfo(type);
    const pt = this.ui.language === 'pt';
    if (type === 'security') {
      const center = this.world.locations.beachKiosk;
      const hostiles = this.spawnHostiles(3, center, 'gang', 10, { silent: true });
      this.job = {
        type, ...info,
        textPt: 'Proteja o quiosque da orla. Elimine os invasores.',
        textEn: 'Protect the beach kiosk. Take out the intruders.',
        target: center, radius: 30, reward: 1400, hostiles, progress: 0, elapsed: 0,
        distance: () => this.distanceTo(center)
      };
    } else {
      if (!this.inVehicle) {
        this.ui.toast(this.ui.t('noVehicle'), 'warn');
        this.ui.hudToast(this.ui.t('noVehicle').toUpperCase());
        return;
      }
      const pools = {
        taxi: ['marina', 'ferris', 'pier'],
        delivery: ['hospital', 'delivery', 'park'],
        tour: ['ferris', 'lighthouse', 'pier']
      };
      const names = pools[type] || ['marina'];
      const key = names[Math.floor(Math.random() * names.length)];
      const target = this.world.locations[key].clone();
      const labels = {
        marina: [['Marina Azul', 'Blue Marina']], ferris: [['Roda-Gigante', 'Ferris Wheel']], pier: [['Pier de Costa', 'Costa Pier']],
        hospital: [['Hospital da Maré', 'Maré Hospital']], delivery: [['Morro do Som', 'Sound Hill']], park: [['Parque das Salinas', 'Salt Park']],
        lighthouse: [['Farol Velho', 'Old Lighthouse']]
      }[key][0];
      const radius = ['ferris', 'lighthouse'].includes(key) ? 22 : 12;
      this.job = {
        type, ...info,
        textPt: `${pt ? 'Vá até' : 'Go to'} ${labels[0]}.`,
        textEn: `Go to ${labels[1]}.`,
        target, radius, reward: type === 'tour' ? 1700 : type === 'delivery' ? 1200 : 950,
        elapsed: 0, requiresVehicle: true,
        distance: () => this.distanceTo(target)
      };
    }
    this.jobTimer = 0;
    this.ui.setStoryMode('rp');
    this.ui.toast(this.ui.t('jobAccepted'), 'ok');
    this.ui.hudToast(info.title.toUpperCase());
    this.audio.pickup();
    this.save();
  }

  updateJob(dt) {
    const job = this.job;
    if (!job) return;
    job.elapsed += dt;
    if (job.elapsed > 300) {
      this.ui.toast(this.ui.language === 'pt' ? 'Trabalho expirado.' : 'Job expired.', 'warn');
      this.job = null;
      return;
    }
    if (job.type === 'security') {
      const total = job.hostiles.length;
      const dead = job.hostiles.filter(h => !h.alive).length;
      job.progress = total ? (dead / total) * 100 : 100;
      if (total && dead >= total) this.completeJob(job);
      return;
    }
    if (job.distance() <= job.radius) {
      if (!job.requiresVehicle || this.inVehicle) this.completeJob(job);
    }
  }

  completeJob(job) {
    const pt = this.ui.language === 'pt';
    const tip = Math.max(0, Math.round((1 - job.elapsed / 180) * 380));
    const total = job.reward + tip;
    this.addMoney(total);
    this.rp.rep += 2;
    this.rp.money = this.money;
    this.ui.notify('◈', pt ? `${job.titlePt} concluído · +R$ ${total}` : `${job.titleEn} complete · +R$ ${total}`);
    this.ui.toast(pt ? `Trabalho concluído · +R$ ${total}` : `Job complete · +R$ ${total}`, 'ok');
    this.ui.setStoryMode('rp');
    this.audio.cash();
    this.job = null;
    this.save();
    this.ui.updateDashboard();
  }

  // ---------------- MISSIONS ----------------
  onMissionComplete(mission, stats) {
    if (!this.completedMissions.includes(mission.index)) this.completedMissions.push(mission.index);
    this.completedMissions.sort((a, b) => a - b);
    this.addMoney(mission.reward);
    const stars = Math.max(2, 5 - Math.min(3, stats.wanted || 0));
    const starString = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    this.pendingNextMission = this.completedMissions.length < MISSIONS.length
      ? MISSIONS.findIndex(m => !this.completedMissions.includes(m.index))
      : null;
    this.ui.showMissionComplete({
      title: mission.title,
      reward: mission.reward,
      time: stats.time,
      stars: starString,
      wanted: this.wantedLabelText()
    });
    this.audio.cash();
    this.save();
    this.ui.buildMissionList();
    this.ui.updateDashboard();
  }

  onMissionCompleteContinue() {
    this.ui.hideMissionComplete();
    if (this.pendingNextMission !== null && this.pendingNextMission >= 0) {
      const next = this.pendingNextMission;
      this.pendingNextMission = null;
      this.startMission(next, { auto: true });
      return;
    }
    this.pendingNextMission = null;
    this.setPlayMode('free');
    this.clearWanted(true);
    this.ui.toast(this.ui.language === 'pt' ? 'História concluída. Costa Dourada é sua.' : 'Story complete. Costa Dourada is yours.', 'ok');
    this.ui.notify('★', this.ui.language === 'pt' ? 'Final lendário desbloqueado.' : 'Legendary ending unlocked.');
    this.save();
    this.captureInput();
  }

  setPlayMode(mode) {
    this.playMode = mode;
    this.ui.setStoryMode(mode);
  }

  resetRun() {
    this.missionManager?.abort();
    for (const h of [...this.hostiles]) h.root.parent?.remove(h.root);
    this.hostiles = [];
    this.clearWanted(true);
    this.job = null;
    this.player.dead = false;
    this.player.health = 100;
    this.player.armor = 50;
    this.player.stamina = 100;
    this.player.vy = 0;
    this.player.onGround = true;
    this.player.weapon = 'pistol';
    this.player.mag = 12;
    this.player.reserve = 48;
    this.weapons = { pistol: { mag: 12, reserve: 48 }, smg: { mag: 30, reserve: 90 } };
    this.reloading = false;
    this.reloadTimer = 0;
    this.fireCooldown = 0;
    this.characterCooldown = 0;
    this.grace = 0;
    this.aiming = false;
    this.ui.hidePrompt();
    if (this.activeChar) this.activeChar.setWeapon('pistol');
  }

  async startFromMenu(action) {
    if (this.starting) return;
    this.starting = true;
    try {
      this.audio.init();
      this.audio.resume();
      this.ui.hideMissionComplete();
      this.ui.hideWasted();
      this.closeAllOverlays();
      const save = this.loadSave();
      if (action === 'continue' && save) {
        this.money = Number.isFinite(save.money) ? save.money : this.money;
        this.completedMissions = Array.isArray(save.completedMissions) ? [...new Set(save.completedMissions)] : this.completedMissions;
        this.rp = { rep: save.rp?.rep ?? 12, money: save.rp?.money ?? this.money };
        const mode = save.playMode || 'story';
        if (mode === 'rp') { await this.startRP(true); return; }
        if (mode === 'free') { await this.startFreeRoam(true); return; }
        action = 'story';
      }
      if (action === 'story' || action === 'continue') {
        const next = MISSIONS.findIndex(m => !this.completedMissions.includes(m.index));
        if (next === -1) await this.startFreeRoam(false);
        else await this.startMission(next);
      } else if (action === 'rp') {
        await this.startRP(false);
      } else {
        await this.startFreeRoam(false);
      }
    } catch (err) {
      console.error('[Matteo 5] startFromMenu:', err);
      this.ui.toast('Não foi possível iniciar. Tente novamente.', 'warn');
    } finally {
      this.starting = false;
    }
  }

  async startMission(index, opts = {}) {
    if (index < 0 || index >= MISSIONS.length) return;
    if (index > this.completedMissions.length) {
      this.ui.toast(this.ui.language === 'pt' ? 'Conclua a missão anterior primeiro.' : 'Finish the previous mission first.', 'warn');
      return;
    }
    const mission = MISSIONS[index];
    const pt = this.ui.language === 'pt';
    this.ui.showLoading(
      pt ? mission.title.pt : mission.title.en,
      pt ? mission.descPt : mission.descEn,
      pt ? 'Dica: pressione F para entrar ou sair de qualquer veículo.' : 'Tip: press F to enter or exit any vehicle.'
    );
    this.state = 'loading';
    this.ui.hideObjective();
    this.resetRun();
    this.setPlayMode('story');
    this.setActiveCharacter(mission.protag);
    this.teleport(mission.spawn.x, mission.spawn.z, mission.spawn.heading);
    await delay(1500);
    this.ui.startHUD();
    this.state = 'playing';
    this.snapCamera();
    await this.ui.showMissionCard(mission, mission.protag);
    this.state = 'playing';
    this.missionManager.start(index);
    this.grace = 1.6;
    this.captureInput();
    this.save();
  }

  async startFreeRoam(continuePosition = false) {
    const pt = this.ui.language === 'pt';
    this.ui.showLoading('COSTA DOURADA', pt ? 'Explore sem limites.' : 'Explore without limits.', pt ? 'Dica: o mapa completo abre com M.' : 'Tip: open the full map with M.');
    this.state = 'loading';
    this.ui.hideObjective();
    this.resetRun();
    this.setPlayMode('free');
    this.setActiveCharacter('Luiza');
    const pos = (continuePosition && this.safeSavedPosition(this.loadSave()?.position)) || { x: -88, z: 94 };
    this.teleport(pos.x, pos.z, Math.PI / 2);
    await delay(1250);
    this.ui.startHUD();
    this.state = 'playing';
    this.snapCamera();
    this.ui.hideObjective();
    this.ui.toast(this.ui.t('welcome'), 'ok');
    this.captureInput();
    this.save();
  }

  async startRP(continueData = false) {
    const pt = this.ui.language === 'pt';
    this.ui.showLoading('COSTA RP', pt ? 'Trabalho, reputação e noites longas.' : 'Jobs, reputation and long nights.', pt ? 'Dica: abra o celular com J para aceitar trabalhos.' : 'Tip: open the phone with J to accept jobs.');
    this.state = 'loading';
    this.ui.hideObjective();
    this.resetRun();
    this.setPlayMode('rp');
    this.setActiveCharacter('Luiza');
    const pos = continueData ? this.safeSavedPosition(this.loadSave()?.position) : null;
    this.teleport(pos?.x ?? -50, pos?.z ?? 90, Math.PI / 2);
    await delay(1300);
    this.ui.startHUD();
    this.state = 'playing';
    this.snapCamera();
    this.ui.toast(pt ? 'Costa RP conectado · 128 jogadores' : 'Costa RP connected · 128 players', 'ok');
    this.ui.notify('◉', pt ? 'Trabalhos disponíveis no celular (J).' : 'Jobs available on your phone (J).');
    this.ui.setStoryMode('rp');
    this.ui.hudToast('COSTA RP · 24/7');
    this.captureInput();
    this.save();
  }

  respawn() {
    this.ui.hideWasted();
    this.player.dead = false;
    this.player.health = 100;
    this.player.armor = 40;
    this.player.stamina = 100;
    this.player.vy = 0;
    this.player.onGround = true;
    this.reloading = false;
    this.clearWanted(true);
    this.grace = 2.4;
    if (this.missionManager?.active) {
      const cp = this.missionManager.checkpoint;
      this.teleport(cp.x, cp.z, this.player.heading);
    } else {
      const h = this.world.locations.hospital;
      this.teleport(h.x + 14, h.z + 14, Math.PI);
    }
    this.setActiveCharacter(this.activeChar.name);
    this.state = 'playing';
    this.ui.startHUD();
    this.ui.hideWasted();
    this.captureInput();
    this.ui.hudToast(this.ui.language === 'pt' ? 'DE VOLTA À ATIVA' : 'BACK IN ACTION');
  }

  quitToMenu() {
    this.save();
    this.missionManager?.abort();
    this.job = null;
    this.releaseInput();
    this.audio.sirenStop();
    this.audio.engineOn(false);
    this.closeAllOverlays();
    this.ui.hideAllScreens();
    this.ui.showGameMenu();
    this.state = 'menu';
    this.cinematic = true;
    this.ui.buildMissionList();
    this.ui.updateDashboard();
  }

  closeAllOverlays() {
    for (const sel of ['#pause-menu', '#map-overlay', '#phone-overlay', '#mission-complete', '#wasted-screen']) {
      document.querySelector(sel)?.classList.remove('on');
    }
    this.ui.pauseOpen = false;
    this.ui.mapOpen = false;
    this.ui.phoneOpen = false;
    this.ui.dialogueActive = false;
    document.querySelector('#dialogue')?.classList.remove('on');
  }

  // ---------------- MAP + SAVE ----------------
  mapMarkers() {
    const list = [];
    const push = (namePt, nameEn, color, target) => {
      if (!target) return;
      list.push({ namePt, nameEn, color, dist: this.distanceTo(target) });
    };
    if (this.missionManager?.active && this.missionManager.markerPos) {
      push(this.ui.language === 'pt' ? 'Objetivo da missão' : 'Mission objective', this.ui.language === 'pt' ? 'Objetivo da missão' : 'Mission objective', '#f6c768', this.missionManager.markerPos);
    }
    if (this.job) push(this.job.titlePt, this.job.titleEn, '#43ddbe', this.job.target);
    const locs = [
      ['hospital', 'Hospital da Maré', 'Maré Hospital', '#ff7058'],
      ['garage', 'Garagem Central', 'Central Garage', '#71c7ff'],
      ['marina', 'Marina Azul', 'Blue Marina', '#43ddbe'],
      ['pier', 'Pier de Costa', 'Costa Pier', '#e6ddc8'],
      ['ferris', 'Roda-Gigante', 'Ferris Wheel', '#ff8bc1'],
      ['lighthouse', 'Farol Velho', 'Old Lighthouse', '#f6c768'],
      ['park', 'Parque das Salinas', 'Salt Park', '#89c67a'],
      ['club', 'Neon 88', 'Neon 88', '#b48cff'],
      ['delivery', 'Morro do Som', 'Sound Hill', '#ffb457']
    ];
    for (const [key, namePt, nameEn, color] of locs) push(namePt, nameEn, color, this.world.locations[key]);
    return list.sort((a, b) => a.dist - b.dist);
  }

  save() {
    try {
      const data = {
        version: 1,
        money: Math.round(this.money),
        completedMissions: this.completedMissions,
        playMode: this.playMode,
        rp: this.rp,
        position: { x: this.player.position.x, z: this.player.position.z },
        timeOfDay: this.timeOfDay,
        wanted: 0,
        savedAt: Date.now()
      };
      localStorage.setItem('matteo5.save.v1', JSON.stringify(data));
      localStorage.setItem('matteo5.installed.v1', '1');
    } catch { /* storage may be blocked */ }
  }

  loadSave() {
    try {
      const raw = localStorage.getItem('matteo5.save.v1');
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.version !== 1) return null;
      return data;
    } catch { return null; }
  }
}

// ============================================================
// BOOTSTRAP
// ============================================================
const game = new Game();
window.__game = game;
window.game = game;
game.boot();

