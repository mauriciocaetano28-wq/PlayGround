// ============================================================
// MATTEO 5 · GTA 6 BR — COSTA DOURADA
// Original open-world engine for the browser, built with Three.js.
// Every asset in this project is generated procedurally.
// ============================================================
import * as THREE from 'three';
import { createWorld } from './world.js';
import { createLuiza, createCarlos, createCaio, createRandomNPC } from './character.js';
import { buildGta7Missions } from './missions-gta7.js';
import { createVehicle, VEHICLE_SPECS } from './vehicle.js';
import { AudioManager } from './audio.js';
import { VoiceDirector } from './voice.js';
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

const PROLOGUE_MISSIONS = [
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

// Campanha GTA 7 BR (91 missões) somada às 5 missões originais.
const MISSIONS = [...PROLOGUE_MISSIONS, ...buildGta7Missions(PROLOGUE_MISSIONS.length)];

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

  get currentStep() { return this.step; }

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
    this.voice = new VoiceDirector(this.audio);
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
    this.touchSprint = false;
    this.touchBrake = false;
    this.touchFireHeld = false;
    this.radioEnabled = true;
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
    this.hunger = 100;
    this.gta7Complete = false;
    this.kingUnlocked = false;
    this.mansionOwned = false;
    this.goldenCarSpawned = false;
    this.pickups = [];
    this.facilityCooldowns = {};
    this.contextAction = null;
    this.contextTarget = null;
    this.contextTick = 0;
    this.crouching = false;
    this.swimming = false;
    this.waypoint = null;
    this.waypointMeta = null;
    this.hungerTimer = 0;
    this.bank = 1500;
    this.outfits = [];
    this.ownedVehicles = [];
    this.interactables = [];
    this.specialNPCs = [];
    this.policeHeli = null;
    this.armySpawned = false;
    this.lastContextKey = '';

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
    this.hunger = Number.isFinite(save.hunger) ? save.hunger : 100;
    this.gta7Complete = !!save.gta7Complete;
    this.kingUnlocked = !!save.kingUnlocked;
    this.mansionOwned = !!save.mansionOwned;
    this.bank = Number.isFinite(save.bank) ? save.bank : 1500;
    this.outfits = Array.isArray(save.outfits) ? save.outfits : [];
    this.ownedVehicles = Array.isArray(save.ownedVehicles) ? save.ownedVehicles : [];
    if (save.waypoint && Number.isFinite(save.waypoint.x)) {
      this.waypoint = new THREE.Vector3(save.waypoint.x, 0, save.waypoint.z);
      this.waypointMeta = save.waypointMeta || null;
    }
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
      this.spawnExtraVehicles();
      this.initInteractables();
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
    this.caio = createCaio();
    this.luiza = createLuiza();
    this.carlos = createCarlos();
    for (const c of [this.caio, this.luiza, this.carlos]) {
      c.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
      this.scene.add(c.root);
      c.root.visible = false;
    }
    this.caio.root.position.set(this.player.position.x, ground(this.player.position.x, this.player.position.z), this.player.position.z);
    this.luiza.root.position.copy(this.caio.root.position);
    this.carlos.root.position.copy(this.caio.root.position);
    this.activeChar = this.caio;
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
    // Elenco fixo do GTA 7 BR: amigo, namorada, vendedor, policial, rival e moradores.
    this.spawnSpecialNPC('Zeca', 'friend', 'favela', 10, 12, true);
    this.spawnSpecialNPC('Bia', 'girlfriend', 'beachKiosk', 10, 10, true);
    this.spawnSpecialNPC('Vendedor', 'vendor', 'shop', -8, 6, false);
    this.spawnSpecialNPC('Policial', 'cop', 'police', -8, 6, true);
    this.spawnSpecialNPC('Rival', 'rival', 'port', -10, 10, true);
    this.spawnSpecialNPC('Morador', 'resident', 'park', 8, 8, true);
    this.spawnSpecialNPC('Dona Neide', 'mother', 'home', -10, 10, false);
  }

  makeVehicle(spawn, options = {}) {
    const type = spawn.type || 'hatch';
    const model = createVehicle(type, spawn.color || 0xf1eee3, options);
    const spec = VEHICLE_SPECS[type] || VEHICLE_SPECS.hatch;
    const v = {
      model, root: model.root, position: model.root.position,
      heading: spawn.rotY || 0, speed: 0, steering: 0,
      type, color: spawn.color || 0xf1eee3, spec,
      health: 100, maxHealth: options.hero ? 180 : 100, fuel: 100, occupied: false,
      ai: !!options.ai, patrol: false, lane: options.lane || null, wrap: options.wrap || null,
      hero: !!spawn.hero, isAir: !!spec.air, isWater: !!spec.water,
      altitude: 0, vertical: 0, golden: false, smoke: 0,
      label: spec.label || VEHICLE_SPECS.hatch.label
    };
    v.root.position.set(spawn.x, this.world?.getGroundHeight?.(spawn.x, spawn.z) || 0, spawn.z);
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
        type: ['hatch', 'pickup', 'taxi', 'suv', 'van', 'truck'][Math.floor(Math.random() * 6)],
        color: [0x2c8d8b, 0xd6594e, 0xefb94e, 0xf1eee3][Math.floor(Math.random() * 4)]
      }, { ai: true, lane });
      v.lane = lane;
      this.traffic.push(v);
    }
  }

  spawnSpecialNPC(name, role, key, offX, offZ, walking = false) {
    const base = this.world.locations[key] || this.world.locations.beachKiosk;
    const spot = this.freeSpot(base.x + offX, base.z + offZ, 4);
    const char = createRandomNPC(name);
    char.root.position.set(spot.x, this.world.getGroundHeight(spot.x, spot.z), spot.z);
    char.setAiming(false);
    char.weapon.visible = false;
    char.smg.visible = false;
    char.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.scene.add(char.root);
    const npc = {
      char, root: char.root, position: char.root.position, name, role, walking,
      axis: 'x', dir: Math.random() > .5 ? 1 : -1, speed: .4 + Math.random() * .35,
      homeX: spot.x, homeZ: spot.z, dead: false, deadTimer: 0,
      chatter: Math.floor(Math.random() * LINES.chatterPT.length)
    };
    this.npcs.push(npc);
    this.specialNPCs.push(npc);
    return npc;
  }

  spawnExtraVehicles() {
    const add = (type, color, key, dx, dz, rotY = 0, options = {}) => {
      const base = this.world.locations[key] || this.world.locations.beachKiosk;
      const spot = this.freeSpot(base.x + dx, base.z + dz, 9);
      const v = this.makeVehicle({ x: spot.x, z: spot.z, rotY, type, color }, options);
      v.parkingKey = key;
      return v;
    };
    // Motos, carros de luxo, viaturas e utilitários espalhados pela cidade.
    add('motorcycle', 0xd6594e, 'favela', 16, 20, .6);
    add('motorcycle', 0xefb94e, 'garage', -12, -8, Math.PI / 2);
    add('motorcycle', 0x2c8d8b, 'beachKiosk', 22, 8, Math.PI / 2);
    add('super', 0xffc93c, 'mansion', 9, 12, Math.PI / 2);
    add('super', 0xd21f3c, 'matteoTower', 22, 24, Math.PI);
    add('taxi', 0xf2c14e, 'beachKiosk', -18, 4, Math.PI / 2, { taxi: true });
    add('ambulance', 0xf1eee3, 'hospital', 12, 8, Math.PI / 2);
    add('truck', 0x8c9aa2, 'port', -14, 18, 0);
    add('bus', 0xf0b23c, 'matteoTower', -24, 22, Math.PI / 2);
    add('police', 0x172326, 'police', 10, 8, Math.PI / 2);
    add('tank', 0x4a5940, 'airport', 28, -24, 0);
    add('helicopter', 0x1f3a4a, 'airport', -30, -34, .4);
    add('plane', 0xe9e5d8, 'airport', 30, -48, Math.PI);
    add('boat', 0xe8e2d2, 'pier', 4, 18, Math.PI);
    add('jetski', 0xefb94e, 'pier', 24, 22, Math.PI / 2);
    add('yacht', 0xf1eee3, 'pier', 48, 30, Math.PI);
    add('boat', 0x2c8d8b, 'marina', 60, 120, Math.PI);
  }

  makeBeacon(color, icon) {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(.55, .78, 20),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = .06;
    group.add(ring);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = 'rgba(4,14,16,.78)';
    ctx.beginPath(); ctx.arc(64, 64, 48, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 7; ctx.stroke();
    ctx.fillStyle = '#f8f4e7';
    ctx.font = '700 54px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(icon, 64, 68);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sprite.scale.set(1.15, 1.15, 1);
    sprite.position.y = 1.55;
    group.add(sprite);
    group.userData.sprite = sprite;
    this.scene.add(group);
    if (!this.beacons) this.beacons = [];
    this.beacons.push(group);
    return group;
  }

  initInteractables() {
    const loc = (key) => this.world.locations[key] || this.world.locations.beachKiosk;
    const push = (kind, key, dx, dz, icon, symbol, labelPt, labelEn, subPt, subEn, extra = {}) => {
      const base = loc(key);
      const spot = this.freeSpot(base.x + dx, base.z + dz, 5);
      const item = {
        id: `${kind}-${key}-${this.interactables.length}`,
        kind, key, x: spot.x, z: spot.z, y: this.world.getGroundHeight(spot.x, spot.z),
        radius: extra.radius || 4.4, icon, symbol, labelPt, labelEn, subPt, subEn, ...extra
      };
      item.beacon = this.makeBeacon(extra.color || 0xf6c768, symbol);
      item.beacon.position.set(item.x, item.y, item.z);
      this.interactables.push(item);
      return item;
    };

    push('bed', 'home', 5, 5, 'square', '▣', 'DORMIR / SALVAR', 'SLEEP / SAVE', 'Barraco do Caio', "Caio's place", { color: 0x43ddbe });
    push('door', 'home', -6, 6, 'square', '▣', 'ABRIR PORTA / ENTRAR', 'OPEN DOOR / ENTER', 'Barraco do Caio', "Caio's place", { color: 0x43ddbe });
    push('shop', 'shop', 3, 3, 'circle', '○', 'COMPRAR ROUPA', 'BUY CLOTHES', 'Loja da Orla', 'Shore Shop', { color: 0xff7058, cost: 300 });
    push('weapon', 'shop', -3, 3, 'square', '□', 'PEGAR ARMA', 'PICK UP WEAPON', 'Balcão da loja', 'Shop counter', { color: 0xff8bc1, weapon: 'smg' });
    push('food', 'lanchonete', 2, 3, 'circle', '○', 'COMPRAR LANCHE', 'BUY SNACK', 'Lanchonete da Praia', 'Beach Diner', { color: 0xff7058, cost: 25 });
    push('heal', 'hospital', 3, 3, 'cross', '✕', 'TRATAR / CURAR', 'TREAT / HEAL', 'Hospital da Maré', 'Maré Hospital', { color: 0x71c7ff, cost: 200 });
    push('repair', 'garage', 3, 3, 'triangle', '△', 'REPARAR VEÍCULO', 'REPAIR VEHICLE', 'Oficina do Zeca', "Zeca's Garage", { color: 0x43ddbe, cost: 150 });
    push('buycar', 'garage', -8, -6, 'triangle', '△', 'COMPRAR CARRO', 'BUY CAR', 'Oficina do Zeca', "Zeca's Garage", { color: 0x43ddbe, cost: 5000 });
    push('atm', 'bank', 2, 2, 'cross', '✕', 'SACAR DINHEIRO', 'WITHDRAW CASH', 'Banco Maré', 'Maré Bank', { color: 0x71c7ff, amount: 500 });
    push('door', 'bank', -4, 2, 'square', '□', 'ABRIR PORTA / ENTRAR', 'OPEN DOOR / ENTER', 'Banco Maré', 'Maré Bank', { color: 0x71c7ff });
    push('door', 'police', 3, 3, 'square', '□', 'ABRIR PORTA / ENTRAR', 'OPEN DOOR / ENTER', 'Delegacia Central', 'Central Precinct', { color: 0x71c7ff });
    push('item', 'port', 4, 4, 'triangle', '△', 'PEGAR ITEM', 'PICK UP ITEM', 'Porto Maré', 'Maré Harbor', { color: 0x43ddbe, reward: 350 });
    push('item', 'park', 3, 3, 'triangle', '△', 'PEGAR ITEM', 'PICK UP ITEM', 'Parque das Salinas', 'Salt Park', { color: 0x89c67a, reward: 180 });
    push('item', 'pier', 4, -4, 'triangle', '△', 'PEGAR ITEM', 'PICK UP ITEM', 'Pier de Costa', 'Costa Pier', { color: 0xe6ddc8, reward: 240 });
    push('weapon', 'favela', 6, 7, 'square', '□', 'PEGAR ARMA', 'PICK UP WEAPON', 'Morro do Som', 'Sound Hill', { color: 0xff8bc1, weapon: 'smg' });
    push('drink', 'club', 3, 3, 'circle', '○', 'COMPRAR BEBIDA', 'BUY DRINK', 'Clube Neon 88', 'Neon 88 Club', { color: 0xff8bc1, cost: 40 });
    push('mansion', 'mansion', 4, 4, 'square', '□', 'COMPRAR MANSÃO', 'BUY MANSION', 'Mansão da Serra', 'Hill Mansion', { color: 0xf6c768, cost: 25000 });
    push('door', 'airport', 5, 5, 'square', '□', 'ABRIR PORTA / ENTRAR', 'OPEN DOOR / ENTER', 'Aeroporto de Costa', 'Costa Airport', { color: 0x71c7ff });
    push('door', 'mansion', -5, 5, 'square', '□', 'ABRIR PORTA / ENTRAR', 'OPEN DOOR / ENTER', 'Mansão da Serra', 'Hill Mansion', { color: 0xf6c768 });
    push('food', 'beachKiosk', 4, 8, 'circle', '○', 'COMPRAR LANCHE', 'BUY SNACK', 'Quiosque da Orla', 'Shore Kiosk', { color: 0xff7058, cost: 20 });
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
    this.audio.setVoiceVolume(s.voiceVolume);
    this.voice.configure(s);
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
      this.touchFireHeld = false;
      this.touchBrake = false;
      this.setAiming(false);
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
        if (this.state === 'playing') this.setAiming(true);
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
      if (e.button === 2) this.setAiming(false);
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
    this.bindContext();
  }

  haptic(ms = 10) {
    if (this.settings?.haptics && navigator.vibrate) navigator.vibrate(ms);
  }

  setAiming(on) {
    this.aiming = !!on;
    const crosshair = document.querySelector('#crosshair');
    if (crosshair) crosshair.classList.toggle('aiming', this.aiming);
    const aimBtn = document.querySelector('#touch-l2');
    if (aimBtn) aimBtn.classList.toggle('on', this.aiming && !this.inVehicle);
  }

  centerCamera() {
    const base = this.inVehicle && this.activeVehicle ? this.activeVehicle.heading : this.player.heading;
    this.camYaw = base + Math.PI;
    this.camPitch = this.inVehicle ? .14 : .16;
    this.snapCamera();
    this.haptic(8);
  }

  toggleCrouch() {
    this.crouching = !this.crouching;
    const pt = this.ui?.language !== 'en';
    if (this.activeChar) this.activeChar.root.scale.y = this.crouching ? .8 : 1;
    this.ui?.hudToast?.(this.crouching ? (pt ? 'AGACHADO · ESCONDIDO' : 'CROUCHED · HIDDEN') : (pt ? 'EM PÉ' : 'STANDING'));
    this.haptic(8);
    this.audio?.click?.();
  }

  toggleSprint() {
    this.touchSprint = !this.touchSprint;
    document.querySelector('#touch-l3')?.classList.toggle('on', this.touchSprint);
    document.querySelector('#stick-zone')?.classList.toggle('sprint', this.touchSprint);
    this.haptic(this.touchSprint ? 16 : 8);
    const pt = this.ui?.language !== 'en';
    this.ui?.hudToast?.(this.touchSprint ? (pt ? 'CORRENDO' : 'SPRINT ON') : (pt ? 'CAMINHADA' : 'SPRINT OFF'));
  }

  updateTouchContext() {
    const pt = this.ui?.language !== 'en';
    const v = this.inVehicle;
    const set = (sel, text) => {
      const el = document.querySelector(sel);
      const small = el?.querySelector('small');
      if (small) small.textContent = text;
    };
    set('#touch-l2', v ? (pt ? 'FREIO' : 'BRAKE') : (pt ? 'MIRA' : 'AIM'));
    set('#touch-r2', v ? (pt ? 'ACELERAR' : 'THROTTLE') : (pt ? 'ATIRAR' : 'FIRE'));
    set('#touch-l3', v ? (pt ? 'BUZINA' : 'HORN') : (pt ? 'CORRER' : 'SPRINT'));
    set('.ps-shoulder.l1', pt ? 'ARMA' : 'WEAPON');
    set('.ps-shoulder.r1', v ? (pt ? 'RÁDIO' : 'RADIO') : (pt ? 'RECARGA' : 'RELOAD'));
    set('.touch-r3', 'CAM');
    set('.ps-btn.triangle', v ? (pt ? 'SAIR' : 'EXIT') : (pt ? 'VEÍCULO' : 'VEHICLE'));
    set('.ps-btn.square', v ? (pt ? 'FREIO MÃO' : 'HANDBRAKE') : (pt ? 'SALTAR' : 'JUMP'));
    set('.ps-btn.circle', v ? (pt ? 'BUZINA' : 'HORN') : (pt ? 'AGACHAR' : 'CROUCH'));
    set('.ps-btn.cross', v ? (pt ? 'SAIR' : 'EXIT') : (pt ? 'INTERAGIR' : 'INTERACT'));
  }

  bindTouch() {
    const stick = document.querySelector('#stick-zone');
    const stickPad = stick?.querySelector('.stick-base');
    const knob = document.querySelector('#stick-knob');
    const look = document.querySelector('#look-zone');

    if (stick && stickPad) {
      let id = null, base = null;
      const start = (e) => {
        if (id !== null || e.target.closest?.('.touch-l3')) return;
        id = e.pointerId;
        const r = stickPad.getBoundingClientRect();
        base = { x: r.left + r.width / 2, y: r.top + r.height / 2, size: Math.min(r.width, r.height) * .42 };
        try { stick.setPointerCapture?.(e.pointerId); } catch { /* synthetic pointer */ }
        this.audio.init();
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
        if (knob) knob.style.transform = `translate(calc(-50% + ${dx * 26}px), calc(-50% + ${dy * 26}px))`;
      };
      const end = (e) => {
        if (e.pointerId !== id) return;
        id = null; base = null;
        this.touchMove.x = 0; this.touchMove.y = 0;
        if (knob) knob.style.transform = 'translate(-50%, -50%)';
      };
      stick.addEventListener('pointerdown', start);
      stick.addEventListener('pointermove', move);
      stick.addEventListener('pointerup', end);
      stick.addEventListener('pointercancel', end);
      stick.addEventListener('lostpointercapture', end);
    }

    if (look) {
      let id = null, last = null;
      look.addEventListener('pointerdown', (e) => {
        id = e.pointerId; last = { x: e.clientX, y: e.clientY };
        try { look.setPointerCapture?.(e.pointerId); } catch { /* synthetic pointer */ }
        this.audio.init();
        this.audio.resume?.();
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
      look.addEventListener('lostpointercapture', end);
    }

    document.querySelectorAll('[data-action]').forEach(btn => {
      if (!btn.closest('.mobile-controls')) return;
      const action = btn.dataset.action;
      const hold = btn.dataset.hold === 'true';
      let pressed = false, longTimer = null, longFired = false;
      const stopHold = () => {
        btn.classList.remove('held');
        if (action === 'fire') this.touchFireHeld = false;
        if (action === 'aim') this.touchBrake = false;
        if (action === 'jump') this.jumpHeld = false;
        if (longTimer) { clearTimeout(longTimer); longTimer = null; }
      };
      const release = () => {
        if (!pressed) return;
        pressed = false;
        const wasLong = longFired;
        longFired = false;
        stopHold();
        if (action === 'radio' && !wasLong) this.nextRadio();
      };
      const cancel = () => {
        if (!pressed) return;
        pressed = false;
        longFired = false;
        stopHold();
      };
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.audio.init();
        this.audio.resume?.();
        if (this.state !== 'playing') return;
        pressed = true;
        try { btn.setPointerCapture?.(e.pointerId); } catch { /* synthetic pointer */ }
        btn.classList.add('held');
        this.haptic(8);
        switch (action) {
          case 'interact':
            this.interact();
            break;
          case 'fire':
            if (this.inVehicle) this.audio.horn?.();
            else if (hold) { this.touchFireHeld = true; this.fire(); }
            else this.fire();
            break;
          case 'jump':
            this.jumpRequested = true;
            this.jumpHeld = true;
            break;
          case 'crouch':
            if (this.inVehicle) this.audio.horn?.();
            else this.toggleCrouch();
            break;
          case 'vehicle':
            this.toggleVehicle();
            break;
          case 'switch':
            this.switchCharacter();
            break;
          case 'reload':
            if (this.inVehicle) this.nextRadio();
            else this.reload();
            break;
          case 'weapon':
            this.switchWeapon();
            break;
          case 'aim':
            if (this.inVehicle) this.touchBrake = true;
            else this.setAiming(!this.aiming);
            break;
          case 'camera':
            this.centerCamera();
            break;
          case 'phone':
            this.ui.openPhone();
            break;
          case 'map':
            this.ui.openMap();
            break;
          case 'radio':
            longFired = false;
            longTimer = setTimeout(() => {
              longFired = true;
              btn.classList.remove('held');
              this.toggleRadio();
            }, 550);
            break;
        }
      });
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', cancel);
      btn.addEventListener('lostpointercapture', cancel);
    });

    const l3 = document.querySelector('#touch-l3');
    if (l3) l3.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.audio.init();
      if (this.state !== 'playing') return;
      this.haptic(12);
      if (this.inVehicle) this.audio.horn?.();
      else this.toggleSprint();
    });
  }

  toggleRadio() {
    if (this.state !== 'playing') return;
    this.radioEnabled = !this.radioEnabled;
    if (this.audio) this.audio.radioEnabled = this.radioEnabled;
    const pt = this.ui?.language !== 'en';
    if (this.radioEnabled) {
      this.audio?.playRadio();
      const station = this.audio?.stations?.[this.audio.radioStation] || '';
      this.ui?.hudToast?.(`RÁDIO · ${station}`);
    } else {
      this.ui?.hudToast?.(pt ? 'RÁDIO DESLIGADO' : 'RADIO OFF');
    }
  }

  nextRadio() {
    if (this.state !== 'playing') return;
    this.radioEnabled = true;
    if (this.audio) this.audio.radioEnabled = true;
    const station = this.audio?.nextStation?.() || '';
    const label = document.querySelector('#radio-station');
    if (label && station) label.textContent = station;
    this.ui?.hudToast?.(`RÁDIO · ${station}`);
    this.haptic(8);
  }

  captureScreenshot() {
    try {
      this.renderer.render(this.scene, this.camera);
      const url = this.canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `costa-dourada-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      this.haptic(14);
      this.ui?.hudToast?.(this.ui.language === 'pt' ? 'CAPTURA SALVA' : 'SCREENSHOT SAVED');
    } catch {
      this.ui?.toast?.(this.ui.language === 'pt' ? 'Captura indisponível neste navegador.' : 'Screenshot unavailable in this browser.', 'warn');
    }
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
    this.touchFireHeld = false;
    this.touchBrake = false;
    this.setAiming(false);
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
      this.updateContextAction();
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
    if (this.policeHeli) {
      this.policeHeli.root.parent?.remove(this.policeHeli.root);
      this.policeHeli = null;
    }
    if (this.armyHostiles) {
      for (const h of this.armyHostiles) this.removeHostile(h);
      this.armyHostiles = null;
    }
    this.armySpawned = false;
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
  updateHunger(dt) {
    this.hungerTimer += dt;
    const decay = this.inVehicle ? .045 : .075;
    this.hunger = clamp((this.hunger ?? 100) - dt * decay, 0, 100);
    if (this.hunger <= 0) {
      this.player.health = clamp(this.player.health - dt * .65, 0, 100);
      if (!this.hungerWarned || this.sessionTime - this.hungerWarned > 26) {
        this.hungerWarned = this.sessionTime;
        this.ui.notify('!', this.ui.language === 'pt' ? 'Você está com fome. Compre um lanche.' : 'You are hungry. Buy a snack.');
      }
    }
    if (this.hunger < 20 && !this.hungerLowWarned) {
      this.hungerLowWarned = true;
      this.ui.hudToast(this.ui.language === 'pt' ? 'FOME CRÍTICA' : 'CRITICAL HUNGER');
    } else if (this.hunger > 30) this.hungerLowWarned = false;
  }

  updateInteractables(dt) {
    for (const item of this.interactables) {
      if (item.used && (item.respawnAt || 0) <= this.sessionTime) {
        item.used = false;
        if (item.beacon) item.beacon.visible = true;
      }
    }
    if (!this.beacons) return;
    for (let i = 0; i < this.beacons.length; i++) {
      const b = this.beacons[i];
      const sprite = b.userData.sprite;
      if (sprite) sprite.position.y = 1.5 + Math.sin(this.elapsed * 2.1 + i) * .12;
    }
  }

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
    if ((this.mouseDown || this.touchFireHeld) && this.player.weapon === 'smg' && !this.inVehicle) this.fire();
    if (this.touchFireHeld && this.player.weapon === 'pistol' && !this.inVehicle) this.fire();
    if (this.tracer) this.tracer.update(dt);

    if (this.inVehicle) this.updateVehicle(dt);
    else this.updateOnFoot(dt);

    this.updateHunger(dt);
    this.updateInteractables(dt);
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
    const stickPush = Math.hypot(this.touchMove.x, this.touchMove.y);

    const sprinting = !this.crouching && (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchSprint || stickPush > .96) && p.stamina > 2 && moving;
    const targetSpeed = moving ? (this.crouching ? 2.1 : this.aiming ? 2.5 : sprinting ? 7.4 : 4.2) : 0;
    if (sprinting) p.stamina = clamp(p.stamina - dt * 16, 0, 100);
    else p.stamina = clamp(p.stamina + dt * 11, 0, 100);

    const fx = -Math.sin(this.camYaw), fz = -Math.cos(this.camYaw);
    const rx = Math.cos(this.camYaw), rz = -Math.sin(this.camYaw);
    const mx = fx * iz + rx * ix;
    const mz = fz * iz + rz * ix;
    const len = Math.hypot(mx, mz) || 1;
    this.moveSpeed = damp(this.moveSpeed || 0, targetSpeed, 10, dt);

    if (moving || this.aiming) {
      p.heading = this.aiming ? Math.atan2(fx, fz) : Math.atan2(mx / len, mz / len);
    }
    if (moving) {
      this.footstepTimer -= dt;
      if (this.footstepTimer <= 0 && p.onGround) {
        this.audio.footstep();
        this.footstepTimer = sprinting ? .29 : .44;
      }
    }

    const next = this._next || (this._next = new THREE.Vector3());
    next.set(p.position.x + (mx / len) * this.moveSpeed * dt, p.position.y, p.position.z + (mz / len) * this.moveSpeed * dt);
    this.resolveCollision(next, .42, 300);
    p.position.x = next.x;
    p.position.z = next.z;

    if (this.jumpRequested && p.onGround) {
      p.vy = 5.9;
      p.onGround = false;
      this.audio.footstep();
    }
    const ground = this.world.getGroundHeight(p.position.x, p.position.z);
    const inWater = p.position.z > 146;
    this.swimming = inWater;
    if (inWater) {
      this.swimTime = (this.swimTime || 0) + dt;
      p.vy = 0;
      p.position.y = .18 + Math.sin(this.elapsed * 2.5) * .05;
      p.onGround = false;
      if (this.swimTime > 18) {
        this.swimTime = 18.5;
        this.damagePlayer(dt * 9);
      } else if (this.swimTime > 12 && !this.swimWarned) {
        this.swimWarned = true;
        this.ui.notify('!', this.ui.language === 'pt' ? 'Você está se afogando. Volte para a areia.' : 'You are drowning. Get back to the sand.');
      }
    } else {
      this.swimTime = 0;
      this.swimWarned = false;
      p.vy -= 19 * dt;
      p.position.y += p.vy * dt;
      if (p.position.y <= ground) {
        p.position.y = ground;
        p.vy = 0;
        p.onGround = true;
      }
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
    const spec = v.spec || VEHICLE_SPECS.hatch;
    const fwd = (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) - (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
    const side = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
    const throttle = clamp(fwd + this.touchMove.y + (this.touchFireHeld ? 1 : 0) - (this.touchBrake ? 1 : 0), -1, 1);
    const steer = clamp(side - this.touchMove.x, -1, 1);
    const handbrake = this.keys.has('Space') || this.jumpRequested;
    const noFuel = (v.fuel ?? 100) <= 0;

    if (!noFuel) {
      if (v.isAir) {
        if (throttle > 0) v.speed += spec.accel * .42 * throttle * dt;
        else if (throttle < 0) v.speed -= spec.brake * .5 * dt;
        else v.speed *= Math.exp(-.35 * dt);
        v.speed = clamp(v.speed, -spec.max * .25, spec.max);
        const climbing = (this.jumpRequested || this.jumpHeld || this.keys.has('Space')) && !this.touchBrake;
        const descending = this.touchBrake || throttle < -.2;
        const lift = climbing ? 9 : descending ? -9 : 0;
        v.vertical = damp(v.vertical || 0, lift, 2.4, dt);
        v.altitude = clamp((v.altitude || 0) + v.vertical * dt, 5.5, 78);
        v.fuel = clamp((v.fuel ?? 100) - Math.abs(v.speed) * dt * .010, 0, 100);
      } else {
        if (throttle > 0) v.speed += spec.accel * throttle * dt * (v.isWater ? .8 : 1);
        else if (throttle < 0) v.speed -= (v.speed > .6 ? spec.brake : spec.brake * .3) * dt;
        else v.speed *= Math.exp(-(v.isWater ? .8 : 1.15) * dt);
        if (handbrake) v.speed *= Math.exp(-4.8 * dt);
        v.speed = clamp(v.speed, -spec.max * .3, spec.max);
        v.fuel = clamp((v.fuel ?? 100) - Math.abs(v.speed) * dt * .008, 0, 100);
      }
    } else {
      v.speed *= Math.exp(-2.2 * dt);
      if (v.isAir) v.altitude = Math.max(0, (v.altitude || 0) - 4 * dt);
    }

    if (Math.abs(v.speed) > .25) {
      const grip = v.isAir ? .8 : handbrake ? .45 : v.isWater ? .72 : 1;
      v.heading += steer * clamp(Math.abs(v.speed) / 6, 0, 1) * (spec.turn || 1.2) * dt * grip * (v.speed < 0 ? -1 : 1);
    }

    const next = this._next || (this._next = new THREE.Vector3());
    next.copy(v.root.position);
    next.x += Math.sin(v.heading) * v.speed * dt;
    next.z += Math.cos(v.heading) * v.speed * dt;
    const bx = next.x, bz = next.z;
    const highAir = v.isAir && (v.altitude || 0) > 4.5;
    if (!highAir) this.resolveCollision(next, v.isAir ? 1.1 : 1.45, v.isWater ? 360 : 148);
    const hit = Math.abs(next.x - bx) > .015 || Math.abs(next.z - bz) > .015;
    if (hit) {
      const impact = Math.abs(v.speed);
      v.speed *= -.18;
      this.audio.noise(.12, .12, 240);
      if (impact > 7) this.damageVehicle(v, clamp(impact * .55, 1, 26));
    }
    v.root.position.x = next.x;
    v.root.position.z = next.z;
    if (v.isAir) {
      v.root.position.y = v.altitude || 5.5;
      v.root.rotation.z = clamp(-steer * .18 - (v.speed / (spec.max || 1)) * .04, -.3, .3);
    } else {
      v.root.position.y = v.isWater ? 0 : this.world.getGroundHeight(next.x, next.z);
      v.root.position.y += v.isWater ? Math.sin(this.elapsed * 2.1) * .06 : 0;
    }
    v.root.rotation.y = v.heading;
    if (v.smoke > 0) {
      v.smoke -= dt;
      this.audio.noise(.04, .02, 90);
    }
    v.model.update(dt, { speed: v.speed, steering: steer * .55, siren: !!v.patrol });
    this.player.position.copy(v.root.position);
    this.player.heading = v.heading;
    this.audio.updateEngine(Math.abs(v.speed), spec.max, Math.max(0, throttle));
    this.moveSpeed = Math.abs(v.speed);
    if (v.speed > 12 && Math.random() < .05) this.haptic(4);
  }

  damageVehicle(v, amount) {
    if (!v) return;
    v.health = Math.max(0, (v.health ?? 100) - amount);
    if (v.health < 45) v.smoke = Math.max(v.smoke || 0, 1.5);
    if (v.health <= 0) this.explodeVehicle(v);
  }

  explodeVehicle(v) {
    if (!v || v.exploded) return;
    v.exploded = true;
    const pos = v.root.position.clone();
    this.audio.noise(.9, .6, 60);
    this.audio.error?.();
    this.ui.notify('✹', this.ui.language === 'pt' ? 'Veículo destruído.' : 'Vehicle destroyed.');
    if (this.distanceTo(pos) < 12) this.damagePlayer(25);
    v.root.parent?.remove(v.root);
    const i = this.vehicles.indexOf(v);
    if (i >= 0) this.vehicles.splice(i, 1);
    if (this.activeVehicle === v) {
      this.inVehicle = false;
      this.activeVehicle = null;
      this.audio.engineOn(false);
      this.player.position.set(pos.x, this.world.getGroundHeight(pos.x, pos.z), pos.z);
      this.activeChar.root.visible = true;
      this.activeChar.root.position.copy(this.player.position);
      this.updateTouchContext();
      this.damagePlayer(20);
    }
  }

  resolveCollision(pos, radius, maxZ = 148) {
    const b = this.world.bounds;
    pos.x = clamp(pos.x, b.minX + radius, b.maxX - radius);
    pos.z = clamp(pos.z, b.minZ + radius, maxZ - radius);
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
        h.fireTimer = (h.kind === 'army' ? .92 : h.kind === 'police' ? 1.35 : 1.55) + Math.random() * .7;
        const from = new THREE.Vector3(h.root.position.x, h.root.position.y + 1.25, h.root.position.z);
        const to = new THREE.Vector3(p.x, p.y + 1.15, p.z);
        if (dist < 55) this.tracer?.fire(from, to, 0xffd28a);
        this.audio.shoot('pistol');
        const chance = h.kind === 'army' ? .52 : h.kind === 'police' ? .4 : .33;
        if (Math.random() < chance) {
          this.damagePlayer((h.kind === 'army' ? 5 : 3) + Math.random() * 4);
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
    const maxCars = Math.min(5, Math.ceil(this.wanted / 2) + (this.wanted >= 4 ? 2 : 0));
    if (this.policeCars.length < maxCars && this.policeSpawnTimer <= 0) {
      this.spawnPolice();
      this.policeSpawnTimer = Math.max(2.1, 5.2 - this.wanted * .4);
    }
    if (this.wanted >= 3 && !this.policeHeli) this.spawnPoliceHeli();
    if (this.wanted >= 4 && !this.armySpawned) {
      this.armySpawned = true;
      this.armyHostiles = this.spawnHostiles(3 + Math.min(3, this.wanted - 3), this.player.position, 'army', 24);
      this.ui.notify('★', this.ui.language === 'pt' ? 'Exército entrou na caçada.' : 'Army joined the hunt.');
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
    this.updatePoliceHeli(dt);
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

  bindContext() {
    const layer = document.querySelector('#context-layer');
    if (!layer || this.contextBtn) return;
    const btn = document.createElement('button');
    btn.id = 'context-action';
    btn.className = 'context-action';
    btn.type = 'button';
    btn.setAttribute('aria-live', 'polite');
    btn.innerHTML = '<span class="ctx-symbol">△</span><span class="ctx-copy"><b></b><small></small></span>';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.audio.init();
      this.audio.resume?.();
      this.useContextTarget();
    });
    layer.appendChild(btn);
    this.contextBtn = btn;
  }

  nearestInteractable(radius = 4.6) {
    let best = null, bestD = radius;
    for (const item of this.interactables) {
      if (item.used && (item.respawnAt || 0) > this.sessionTime) continue;
      const d = Math.hypot(item.x - this.player.position.x, item.z - this.player.position.z);
      if (d < bestD) { bestD = d; best = item; }
    }
    return best;
  }

  contextTargetFor() {
    if (this.state !== 'playing' || this.ui.dialogueActive) return null;
    const pt = this.ui.language !== 'en';
    if (this.inVehicle) {
      const v = this.activeVehicle;
      if (!v) return null;
      if (Math.abs(v.speed) > 3) return null;
      return {
        type: 'exit', icon: 'cross', label: pt ? 'SAIR DO VEÍCULO' : 'EXIT VEHICLE',
        sub: this.vehicleLabel(v), distance: 0, position: v.root.position
      };
    }
    const npc = this.nearestNPC(3.4);
    const vehicle = this.nearestVehicle(6.4);
    const item = this.nearestInteractable(4.6);
    const options = [];
    if (npc) options.push({ type: 'npc', npc, distance: this.distanceTo(npc.root.position), position: npc.root.position, icon: 'cross', label: pt ? 'FALAR / CONVERSAR' : 'TALK / CONVERSE', sub: `${npc.name}${npc.role ? ` · ${npc.role.toUpperCase()}` : ''}` });
    if (vehicle) {
      const vt = vehicle.type;
      const action = vt === 'police' ? (pt ? 'ROUBAR VIATURA' : 'STEAL POLICE CAR')
        : vt === 'motorcycle' ? (pt ? 'ENTRAR NA MOTO' : 'GET ON MOTORCYCLE')
        : (vt === 'helicopter' || vt === 'plane') ? (pt ? `PILOTAR ${this.vehicleLabel(vehicle)}` : `PILOT ${this.vehicleLabel(vehicle)}`)
        : (vt === 'boat' || vt === 'jetski' || vt === 'yacht') ? (pt ? `PILOTAR ${this.vehicleLabel(vehicle)}` : `PILOT ${this.vehicleLabel(vehicle)}`)
        : (pt ? 'ENTRAR NO CARRO' : 'ENTER CAR');
      options.push({ type: 'vehicle', vehicle, distance: this.distanceTo(vehicle.root.position), position: vehicle.root.position, icon: 'triangle', label: action, sub: this.vehicleLabel(vehicle) });
    }
    if (item) options.push({ type: 'interactable', item, distance: Math.hypot(item.x - this.player.position.x, item.z - this.player.position.z), position: new THREE.Vector3(item.x, item.y + 1, item.z), icon: item.icon, label: pt ? item.labelPt : item.labelEn, sub: pt ? item.subPt : item.subEn });
    if (!options.length) return null;
    options.sort((a, b) => a.distance - b.distance);
    return options[0];
  }

  updateContextAction() {
    const target = this.contextTargetFor();
    this.contextTarget = target;
    const btn = this.contextBtn;
    if (!btn) return;
    if (!target || this.state !== 'playing') {
      btn.classList.remove('on');
      if (this.lastContextKey) { this.lastContextKey = ''; }
      return;
    }
    const key = `${target.type}:${target.label}:${target.sub}:${target.item?.id || target.vehicle?.type || target.npc?.name || ''}`;
    if (key !== this.lastContextKey) {
      this.lastContextKey = key;
      btn.dataset.icon = target.icon;
      btn.querySelector('.ctx-symbol').textContent = target.icon === 'triangle' ? '△' : target.icon === 'square' ? '□' : target.icon === 'circle' ? '○' : target.icon === 'dpad' ? '✚' : '✕';
      btn.querySelector('b').textContent = target.label;
      btn.querySelector('small').textContent = target.sub || '';
    }
    const p = target.position?.clone ? target.position.clone() : new THREE.Vector3(target.position.x, target.position.y, target.position.z);
    p.y += target.type === 'vehicle' ? (target.vehicle?.isAir ? 2.2 : 2.15) : 2.15;
    const projected = p.project(this.camera);
    if (projected.z > 1 || projected.x < -1.15 || projected.x > 1.15 || projected.y < -1.2 || projected.y > 1.2) {
      btn.classList.remove('on');
      return;
    }
    const x = (projected.x * .5 + .5) * innerWidth;
    const y = (-projected.y * .5 + .5) * innerHeight;
    btn.style.setProperty('--x', `${x}px`);
    btn.style.setProperty('--y', `${y}px`);
    btn.classList.add('on');
  }

  updatePrompt() {
    const ui = this.ui;
    const target = this.contextTargetFor();
    if (!target) { ui.hidePrompt(); return; }
    ui.showPrompt(target.label, target.sub);
  }

  useContextTarget() {
    const target = this.contextTarget || this.contextTargetFor();
    if (!target) return;
    if (target.type === 'exit') { this.exitVehicle(); return; }
    if (target.type === 'vehicle') { this.enterVehicle(target.vehicle); return; }
    if (target.type === 'npc') { this.talkToNPC(target.npc); return; }
    if (target.type === 'interactable') { this.runInteractable(target.item); return; }
    this.interact();
  }

  talkToNPC(npc) {
    if (!npc) return;
    const pt = this.ui.language !== 'en';
    const role = npc.role || 'resident';
    const dialogues = {
      friend: [
        { name: npc.name.toUpperCase(), gender: 'male', pt: 'Caio! O morro tá te esperando. Já separou a moto?', en: "Caio! The hill is waiting. Got the bike ready?" },
        { name: 'CAIO', gender: 'male', pt: 'Tô pronto. Só me diz qual é a missão de hoje.', en: "I'm ready. Just tell me today's mission." },
        { name: npc.name.toUpperCase(), gender: 'male', pt: 'Abre o menu de missões e segue a linha no mapa. Eu vou na garupa.', en: 'Open the mission menu and follow the map line. I ride with you.' }
      ],
      girlfriend: [
        { name: npc.name.toUpperCase(), gender: 'female', pt: 'Caio, você prometeu que ia passar na praia hoje.', en: 'Caio, you promised you would come to the beach today.' },
        { name: 'CAIO', gender: 'male', pt: 'Eu passei. Só cheguei com a polícia atrás de mim.', en: 'I did. I just arrived with the police behind me.' },
        { name: npc.name.toUpperCase(), gender: 'female', pt: 'Então resolve isso e volta. A maré não espera.', en: 'Then fix it and come back. The tide does not wait.' }
      ],
      vendor: [
        { name: 'VENDEDOR', gender: 'male', pt: 'E aí, vai levar? Tenho carro, arma, roupa e mansão no catálogo.', en: 'So, buying? I have cars, guns, clothes and a mansion in the catalog.' },
        { name: 'CAIO', gender: 'male', pt: 'Depende do preço, patrão.', en: 'Depends on the price, boss.' },
        { name: 'VENDEDOR', gender: 'male', pt: 'Perto do balcão tem o botão. Aperta e o dinheiro fala.', en: 'There is a button by the counter. Press it and money talks.' }
      ],
      cop: [
        { name: 'POLICIAL', gender: 'male', pt: 'Se eu te ver com uma estrela, você já sabe o que acontece.', en: 'If I see you with one star, you know what happens.' },
        { name: 'CAIO', gender: 'male', pt: 'Relaxa, agente. Hoje eu tô só passeando.', en: "Relax, officer. Today I'm just cruising." },
        { name: 'POLICIAL', gender: 'male', pt: 'É o que todos dizem antes de correr.', en: 'That is what everyone says before they run.' }
      ],
      rival: [
        { name: 'RIVAL', gender: 'male', pt: 'Esse morro não é seu, garoto. Ainda.', en: 'This hill is not yours, kid. Not yet.' },
        { name: 'CAIO', gender: 'male', pt: 'Então vem buscar.', en: 'Then come get it.' }
      ],
      mother: [
        { name: 'DONA NEIDE', gender: 'female', pt: 'Caio, come alguma coisa antes de sair. Você não é de ferro.', en: "Caio, eat something before you go. You're not made of iron." },
        { name: 'CAIO', gender: 'male', pt: 'Já comi, mãe. Prometo que volto antes da noite.', en: "I ate, mom. I promise I'll be back before night." }
      ],
      resident: [
        { name: npc.name.toUpperCase(), gender: 'male', pt: pt ? 'A cidade tá doida hoje. Melhor andar armado.' : 'The city is crazy today. Better go armed.' },
        { name: 'CAIO', gender: 'male', pt: pt ? 'Sempre.' : 'Always.' }
      ]
    };
    const lines = (dialogues[role] || dialogues.resident).map(l => ({ ...l, pt: l.pt, en: l.en }));
    this.audio.click();
    this.ui.speak(lines);
    this.ui.hidePrompt();
    this.haptic(8);
  }

  runInteractable(item) {
    if (!item) return;
    const pt = this.ui.language !== 'en';
    const now = performance.now();
    if ((item.cooldownUntil || 0) > now) {
      this.ui.hudToast(pt ? 'AGUARDE UM POUCO' : 'PLEASE WAIT');
      return;
    }
    item.cooldownUntil = now + 1800;
    const money = this.money;
    const toast = (text, type = 'ok') => this.ui.toast(text, type);
    const spend = (cost) => {
      if (money < cost) { toast(pt ? `Faltam R$ ${Math.ceil(cost - money)}.` : `You need R$ ${Math.ceil(cost - money)} more.`, 'warn'); return false; }
      this.addMoney(-cost);
      return true;
    };
    switch (item.kind) {
      case 'shop':
        if (!spend(item.cost || 300)) return;
        this.outfits.push('BR');
        toast(pt ? 'Roupa BR comprada: boné, camisa e tatuagem.' : 'BR outfit bought: cap, shirt and tattoo.');
        this.ui.speak([{ name: 'CAIO', gender: 'male', pt: 'Agora sim. Estilo de favela, atitude de rei.', en: 'Now we are talking. Hood style, king attitude.' }]);
        break;
      case 'food':
      case 'drink': {
        if (!spend(item.cost || 25)) return;
        this.hunger = clamp(this.hunger + (item.kind === 'drink' ? 28 : 55), 0, 100);
        this.player.health = clamp(this.player.health + 10, 0, 100);
        toast(pt ? 'Lanche comprado. Fome recuperada.' : 'Snack bought. Hunger restored.');
        this.audio.pickup();
        break;
      }
      case 'bed':
        this.hunger = clamp(this.hunger + 40, 0, 100);
        this.player.health = 100;
        this.player.armor = Math.max(this.player.armor, 50);
        this.timeOfDay = 8 * 60;
        this.save();
        toast(pt ? 'Você dormiu. Jogo salvo e vida cheia.' : 'You slept. Game saved and health full.');
        this.ui.speak([{ name: 'CAIO', gender: 'male', pt: 'Dormir de consciência limpa. Quase isso.', en: 'Sleeping with a clean conscience. Almost.' }]);
        break;
      case 'atm': {
        const amount = Math.min(item.amount || 500, this.bank || 0);
        if (amount <= 0) { toast(pt ? 'Conta vazia. Faça missões para depositar.' : 'Account empty. Do missions to deposit.', 'warn'); return; }
        this.bank -= amount;
        this.addMoney(amount);
        toast(pt ? `Saque de R$ ${amount} realizado.` : `Withdrew R$ ${amount}.`);
        this.audio.cash?.();
        break;
      }
      case 'heal':
        if (this.player.health >= 100 && this.player.armor >= 100) { toast(pt ? 'Você já está inteiro.' : 'You are already healthy.'); return; }
        if (!spend(item.cost || 200)) return;
        this.player.health = 100;
        this.player.armor = 100;
        toast(pt ? 'Tratamento completo.' : 'Treatment complete.');
        break;
      case 'repair': {
        const v = this.activeVehicle || this.nearestVehicle(10);
        if (!v) { toast(pt ? 'Traga um veículo para a oficina.' : 'Bring a vehicle to the garage.', 'warn'); return; }
        if (!spend(item.cost || 150)) return;
        v.health = v.maxHealth || 100;
        v.fuel = 100;
        v.smoke = 0;
        toast(pt ? 'Veículo reparado e abastecido.' : 'Vehicle repaired and refueled.');
        break;
      }
      case 'buycar': {
        if (!spend(item.cost || 5000)) return;
        const spot = this.freeSpot(item.x + 6, item.z + 6, 8);
        const car = this.makeVehicle({ x: spot.x, z: spot.z, rotY: Math.random() * 6, type: 'super', color: 0x1f6fff }, { hero: true });
        this.ownedVehicles.push('super');
        toast(pt ? 'Carro de luxo comprado e estacionado na oficina.' : 'Luxury car bought and parked at the garage.');
        this.audio.pickup();
        car.health = car.maxHealth;
        break;
      }
      case 'mansion':
        if (this.mansionOwned) { toast(pt ? 'A mansão já é sua.' : 'The mansion is already yours.'); return; }
        if (!spend(item.cost || 25000)) return;
        this.mansionOwned = true;
        this.outfits.push('KING');
        this.save();
        toast(pt ? 'Mansão comprada. A cobertura é sua.' : 'Mansion bought. The penthouse is yours.');
        this.ui.notify('♛', pt ? 'MANSÃO DA SERRA ADQUIRIDA' : 'HILL MANSION ACQUIRED');
        break;
      case 'weapon': {
        const weapon = item.weapon || 'smg';
        this.player.weapon = weapon;
        if (weapon === 'smg') {
          this.player.mag = 30;
          this.player.reserve = clamp((this.player.reserve || 0) + 90, 0, 240);
          this.weapons.smg = { mag: 30, reserve: this.player.reserve };
        }
        this.activeChar.setWeapon(weapon);
        item.used = true;
        item.respawnAt = this.sessionTime + 120;
        if (item.beacon) item.beacon.visible = false;
        toast(pt ? 'Arma equipada. Munição reforçada.' : 'Weapon equipped. Ammo replenished.');
        this.audio.pickup();
        break;
      }
      case 'item':
        this.addMoney(item.reward || 250);
        this.hunger = clamp(this.hunger + 10, 0, 100);
        item.used = true;
        item.respawnAt = this.sessionTime + 150;
        if (item.beacon) item.beacon.visible = false;
        toast(pt ? `Item pego. +R$ ${item.reward || 250}.` : `Item picked up. +R$ ${item.reward || 250}.`);
        this.audio.pickup();
        break;
      case 'door':
        toast(pt ? `${item.subPt}: porta aberta.` : `${item.subEn}: door opened.`);
        if (item.key === 'home') { this.save(); toast(pt ? 'Casa do Caio. Jogo salvo.' : "Caio's place. Game saved."); }
        this.ui.speak([{ name: 'CAIO', gender: 'male', pt: 'Porta aberta. Se alguém perguntar, eu moro aqui.', en: 'Door open. If anyone asks, I live here.' }]);
        break;
      default:
        toast(pt ? 'Ação concluída.' : 'Action complete.');
    }
    this.haptic(10);
    this.ui.hidePrompt();
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

  vehicleLabel(v) {
    const t = v?.type || 'hatch';
    const pt = this.ui?.language !== 'en';
    const ptLabels = {
      hatch: 'CARRO POPULAR', muscle: 'CARRO ESPORTIVO', super: 'CARRO DE LUXO', pickup: 'PICAPE',
      suv: 'SUV', van: 'VAN', taxi: 'TÁXI', police: 'VIATURA', ambulance: 'AMBULÂNCIA',
      truck: 'CAMINHÃO', bus: 'ÔNIBUS', tank: 'TANQUE', motorcycle: 'MOTO',
      helicopter: 'HELICÓPTERO', plane: 'AVIÃO', boat: 'LANCHA', jetski: 'JETSKI', yacht: 'IATE'
    };
    const enLabels = {
      hatch: 'STREET CAR', muscle: 'MUSCLE CAR', super: 'LUXURY CAR', pickup: 'PICKUP',
      suv: 'SUV', van: 'VAN', taxi: 'TAXI', police: 'POLICE CAR', ambulance: 'AMBULANCE',
      truck: 'TRUCK', bus: 'BUS', tank: 'TANK', motorcycle: 'MOTORCYCLE',
      helicopter: 'HELICOPTER', plane: 'PLANE', boat: 'BOAT', jetski: 'JETSKI', yacht: 'YACHT'
    };
    return (pt ? ptLabels : enLabels)[t] || (pt ? 'VEÍCULO' : 'VEHICLE');
  }

  enterVehicle(v) {
    if (!v || this.inVehicle) return;
    this.activeVehicle = v;
    v.occupied = true;
    v.ai = false;
    v.lane = null;
    this.traffic = this.traffic.filter(t => t !== v);
    this.inVehicle = true;
    this.touchSprint = false;
    this.touchBrake = false;
    this.touchFireHeld = false;
    this.setAiming(false);
    document.querySelector('#touch-l3')?.classList.remove('on');
    document.querySelector('#stick-zone')?.classList.remove('sprint');
    if (v.isAir) v.altitude = Math.max(v.altitude || 0, 5.5);
    if (v.isWater) v.root.position.y = 0;
    this.player.position.copy(v.root.position);
    this.player.heading = v.heading;
    this.camYaw = v.heading + Math.PI;
    this.camPitch = .14;
    this.activeChar.root.visible = false;
    this.audio.engineOn(true);
    this.updateTouchContext();
    const label = this.vehicleLabel(v);
    this.ui.hudToast(this.ui.language === 'pt' ? `${label} · ADQUIRIDO` : `${label} · ACQUIRED`);
    this.ui.hidePrompt();
    this.audio.pickup();
    this.haptic(12);
    if (v.type === 'police') this.crime(1.5);
  }

  exitVehicle() {
    const v = this.activeVehicle;
    if (!v) return;
    let placed = false;
    if (!v.isAir && !v.isWater) {
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
    }
    if (!placed) {
      if (v.isWater) this.player.position.set(v.root.position.x, 0, 137);
      else this.player.position.set(v.root.position.x, this.world.getGroundHeight(v.root.position.x, v.root.position.z), v.root.position.z);
    }
    if (v.isAir && v.altitude > 4) {
      this.damagePlayer(18);
      this.ui.hudToast(this.ui.language === 'pt' ? 'SALTO DE HELICÓPTERO' : 'HELICOPTER JUMP');
    }
    this.player.heading = v.heading;
    v.occupied = false;
    v.speed = 0;
    this.inVehicle = false;
    this.activeVehicle = null;
    this.touchBrake = false;
    this.touchFireHeld = false;
    this.camYaw = this.player.heading + Math.PI;
    this.activeChar.root.visible = true;
    this.activeChar.root.position.copy(this.player.position);
    this.audio.engineOn(false);
    this.updateTouchContext();
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
    const order = ['Caio', 'Luiza', 'Carlos'];
    const next = order[(order.indexOf(this.activeChar.name) + 1) % order.length];
    this.setActiveCharacter(next);
    this.ui.hudToast(`${this.ui.t('switchTo')} ${next.toUpperCase()}`);
    this.audio.click();
  }

  setActiveCharacter(name) {
    const next = name === 'Carlos' ? this.carlos : name === 'Caio' ? this.caio : this.luiza;
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
      this.updateTouchContext();
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
    if (this.inVehicle) { this.exitVehicle(); return; }
    const target = this.contextTargetFor();
    if (target && target.type !== 'exit') { this.useContextTarget(); return; }
    const npc = this.nearestNPC(3.4);
    if (npc) {
      this.talkToNPC(npc);
      return;
    }
    const item = this.nearestInteractable(4.6);
    if (item) this.runInteractable(item);
  }

  spawnHostiles(count, center, kind = 'gang', spread = 12, opts = {}) {
    const names = ['Vini', 'Igor', 'Nina', 'Léo', 'Rui', 'Bia', 'Duda', 'Caio'];
    const list = [];
    for (let i = 0; i < count; i++) {
      const pos = this.freeSpot(center.x, center.z, spread);
      const char = createRandomNPC(kind === 'army' ? 'Soldado' : kind === 'police' ? 'Agente' : names[Math.floor(Math.random() * names.length)]);
      char.root.position.set(pos.x, this.world.getGroundHeight(pos.x, pos.z), pos.z);
      char.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
      char.setAiming(true);
      this.scene.add(char.root);
      const toughness = kind === 'army' ? 150 : kind === 'police' ? 95 : 60;
      const h = {
        char, root: char.root, position: char.root.position,
        health: toughness, maxHealth: toughness,
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

  spawnPoliceHeli() {
    const p = this.player.position;
    const model = createVehicle('helicopter', 0x142b3a, {});
    const heli = {
      root: model.root, model, health: 180, fireTimer: 2.2,
      heading: Math.random() * Math.PI * 2, speed: 0, altitude: 32
    };
    heli.root.position.set(p.x + 70, heli.altitude, p.z + 70);
    heli.root.rotation.y = heli.heading;
    this.scene.add(heli.root);
    this.policeHeli = heli;
    this.ui.notify('★', this.ui.language === 'pt' ? 'Helicóptero da polícia no céu.' : 'Police helicopter overhead.');
  }

  updatePoliceHeli(dt) {
    const heli = this.policeHeli;
    if (!heli) return;
    const p = this.player.position;
    const dx = p.x - heli.root.position.x;
    const dz = p.z - heli.root.position.z;
    const dist = Math.hypot(dx, dz);
    heli.heading = angleLerp(heli.heading, Math.atan2(dx, dz), clamp(dt * 1.4, 0, 1));
    const targetSpeed = dist > 45 ? 22 : dist < 26 ? 4 : 12;
    heli.speed = damp(heli.speed, targetSpeed, 1.4, dt);
    heli.root.position.x += Math.sin(heli.heading) * heli.speed * dt;
    heli.root.position.z += Math.cos(heli.heading) * heli.speed * dt;
    heli.root.position.y = damp(heli.root.position.y, 26 + Math.sin(this.elapsed * .8) * 4, 1.2, dt);
    heli.root.rotation.y = heli.heading;
    heli.model.update(dt, { speed: heli.speed, steering: 0 });
    heli.fireTimer -= dt;
    if (dist < 60 && heli.fireTimer <= 0 && this.grace <= 0) {
      heli.fireTimer = 1.6 + Math.random() * .6;
      const from = heli.root.position.clone(); from.y -= 1;
      const to = new THREE.Vector3(p.x, p.y + 1.1, p.z);
      this.tracer?.fire(from, to, 0x9ec1ff);
      this.audio.shoot('pistol');
      if (Math.random() < .34) this.damagePlayer(4 + Math.random() * 4);
    }
    if (heli.health <= 0 || dist > 360) {
      heli.root.parent?.remove(heli.root);
      this.policeHeli = null;
      if (heli.health <= 0) this.ui.notify('✹', this.ui.language === 'pt' ? 'Helicóptero abatido.' : 'Helicopter down.');
    }
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
    this.bank = (this.bank || 0) + Math.round((mission.reward || 0) * .25);
    this.waypoint = null;
    this.waypointMeta = null;
    if (mission.campaign === 'gta7') {
      const done = this.missions.filter(m => m.campaign === 'gta7' && this.completedMissions.includes(m.index)).length;
      this.ui.notify('♛', this.ui.language === 'pt' ? `TROFÉU ${done}/91 · ${mission.title.pt}` : `TROPHY ${done}/91 · ${mission.title.en}`);
      this.ui.hudToast(this.ui.language === 'pt' ? `TROFÉU ${done}/91` : `TROPHY ${done}/91`);
      if (done >= 91 && !this.gta7Complete) {
        this.gta7Complete = true;
        this.kingUnlocked = true;
        this.mansionOwned = true;
        this.addMoney(1000000);
        this.grantKingRewards();
        this.ui.notify('♛', this.ui.language === 'pt' ? '91/91 · REI DO BRASIL. Carro dourado, mansão e roupa de rei liberados.' : '91/91 · KING OF BRAZIL. Golden car, mansion and king outfit unlocked.');
        this.ui.hudToast(this.ui.language === 'pt' ? 'TROFÉU 91/91 · REI DO BRASIL' : 'TROPHY 91/91 · KING OF BRAZIL');
      }
    }
    const stars = Math.max(2, 5 - Math.min(3, stats.wanted || 0));
    const starString = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    if (mission.campaign === 'gta7') {
      const nextIndex = mission.index + 1;
      const nextMission = MISSIONS[nextIndex];
      this.pendingNextMission = nextMission && nextMission.campaign === 'gta7' ? nextIndex : null;
    } else {
      const nextPrologue = MISSIONS.find((m, i) => i < 5 && !this.completedMissions.includes(m.index));
      this.pendingNextMission = nextPrologue ? MISSIONS.indexOf(nextPrologue) : (MISSIONS[5] ? 5 : null);
    }
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

  grantKingRewards() {
    this.kingUnlocked = true;
    this.mansionOwned = true;
    this.hunger = 100;
    this.player.health = 100;
    this.player.armor = 100;
    try { this.caio?.setCrown?.(true); } catch { /* noop */ }
    if (!this.goldenCarSpawned) {
      this.goldenCarSpawned = true;
      const mansion = this.world?.locations?.mansion;
      if (mansion) {
        const car = this.makeVehicle({
          x: mansion.x + 10, z: mansion.z + 14, rotY: Math.PI / 2,
          type: 'super', color: 0xffd34d, hero: true
        });
        car.golden = true;
        car.health = 300;
        car.fuel = 100;
        this.ui?.notify('◆', this.ui.language === 'pt' ? 'Carro dourado estacionado na mansão.' : 'Golden car parked at the mansion.');
      }
    }
    this.save();
  }

  gta7Progress() {
    const total = this.missions.filter(m => m.campaign === 'gta7').length || 91;
    const done = this.missions.filter(m => m.campaign === 'gta7' && this.completedMissions.includes(m.index)).length;
    return { done, total, pct: Math.round((done / total) * 100) };
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
    this.ui.clearDialogue?.();
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
        // A campanha do Caio tem prioridade; o prólogo original continua acessível no menu de missões.
        let next = MISSIONS.findIndex(m => m.campaign === 'gta7' && !this.completedMissions.includes(m.index));
        if (next === -1) next = MISSIONS.findIndex(m => !this.completedMissions.includes(m.index));
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
    const mission = MISSIONS[index];
    if (!this.isMissionUnlocked(mission)) {
      this.ui.toast(this.ui.language === 'pt' ? 'Conclua a missão anterior primeiro.' : 'Finish the previous mission first.', 'warn');
      return;
    }
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
    if (mission.weapon && /SMG|Fuzil|Metralhadora/i.test(mission.weapon)) {
      this.player.weapon = 'smg';
      this.player.mag = 30;
      this.player.reserve = 180;
      this.weapons.smg = { mag: 30, reserve: 180 };
      this.activeChar.setWeapon('smg');
    }
    const spawn = mission.spawnKey
      ? (() => {
          const base = this.world.locations[mission.spawnKey] || this.world.locations.beachKiosk;
          const dist = mission.spawnDistance || 28;
          const a = (mission.gta7Index || 1) * 2.39996;
          const spot = this.freeSpot(base.x + Math.cos(a) * dist, base.z + Math.sin(a) * dist, 9);
          return { x: spot.x, z: spot.z, heading: mission.heading };
        })()
      : mission.spawn;
    this.teleport(spawn.x, spawn.z, spawn.heading);
    this.waypoint = new THREE.Vector3(spawn.x, 0, spawn.z);
    this.waypointMeta = { title: pt ? mission.title.pt : mission.title.en, missionIndex: mission.index };
    this.spawnMissionVehicle(mission, spawn);
    await delay(1500);
    this.ui.startHUD();
    this.state = 'playing';
    this.snapCamera();
    await this.ui.showMissionCard(mission, mission.protag);
    this.state = 'playing';
    if (mission.wanted) this.crime(mission.wanted);
    this.missionManager.start(index);
    this.grace = 1.6;
    this.captureInput();
    this.save();
  }

  missionVehicleType(name) {
    const n = String(name || '').toLowerCase();
    if (!n || n.includes('nenhum')) return null;
    if (n.includes('moto')) return 'motorcycle';
    if (n.includes('helic')) return 'helicopter';
    if (n.includes('lancha')) return 'boat';
    if (n.includes('jetski')) return 'jetski';
    if (n.includes('iate')) return 'yacht';
    if (n.includes('avião') || n.includes('aviao')) return 'plane';
    if (n.includes('tanque')) return 'tank';
    if (n.includes('ambul')) return 'ambulance';
    if (n.includes('caminh')) return 'truck';
    if (n.includes('ônibus') || n.includes('onibus')) return 'bus';
    if (n.includes('táxi') || n.includes('taxi')) return 'taxi';
    if (n.includes('viatura')) return 'police';
    if (n.includes('van')) return 'van';
    if (n.includes('suv') || n.includes('blindado')) return 'suv';
    if (n.includes('picape')) return 'pickup';
    if (n.includes('lamborghini') || n.includes('ferrari') || n.includes('dourado') || n.includes('esportivo') || n.includes('luxo')) return 'super';
    if (n.includes('muscle')) return 'muscle';
    return 'hatch';
  }

  spawnMissionVehicle(mission, spawn) {
    const type = this.missionVehicleType(mission.vehicle);
    if (!type) return null;
    const spot = this.freeSpot(spawn.x + Math.sin(spawn.heading + Math.PI) * 10, spawn.z + Math.cos(spawn.heading + Math.PI) * 10, 7);
    const color = type === 'super' ? 0xffd34d : type === 'police' ? 0x172326 : [0xd6594e, 0x2c8d8b, 0xefb94e, 0xf1eee3][Math.floor(Math.random() * 4)];
    const v = this.makeVehicle({ x: spot.x, z: spot.z, rotY: spawn.heading + Math.PI / 2, type, color }, { hero: true });
    v.health = v.maxHealth;
    v.fuel = 100;
    if (v.isAir) v.altitude = 0;
    return v;
  }

  async startFreeRoam(continuePosition = false) {
    const pt = this.ui.language === 'pt';
    this.ui.showLoading('COSTA DOURADA', pt ? 'Explore sem limites.' : 'Explore without limits.', pt ? 'Dica: o mapa completo abre com M.' : 'Tip: open the full map with M.');
    this.state = 'loading';
    this.ui.hideObjective();
    this.resetRun();
    this.setPlayMode('free');
    this.setActiveCharacter('Caio');
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
    this.setActiveCharacter('Caio');
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
    this.ui.clearDialogue?.();
  }

  // ---------------- MAP + SAVE ----------------
  isMissionUnlocked(mission) {
    if (!mission) return false;
    if (this.completedMissions.includes(mission.index)) return true;
    if (mission.campaign === 'gta7') {
      if (mission.gta7Index <= 1) return true;
      return this.completedMissions.includes(mission.index - 1);
    }
    return mission.index <= 0 || this.completedMissions.includes(mission.index - 1);
  }

  setWaypoint(mission) {
    if (!mission) return;
    const base = mission.spawnKey ? this.world.locations[mission.spawnKey] : null;
    const target = base ? base.clone() : (mission.spawn ? new THREE.Vector3(mission.spawn.x, 0, mission.spawn.z) : null);
    if (!target) return;
    this.waypoint = target;
    this.waypointMeta = {
      title: this.ui.language === 'pt' ? mission.title.pt : mission.title.en,
      missionIndex: mission.index
    };
    this.ui.toast(this.ui.language === 'pt' ? 'Rota marcada no mapa. Siga a linha.' : 'Route marked on the map. Follow the line.', 'ok');
    this.ui.notify('▧', this.ui.language === 'pt' ? `Mapa: ${mission.title.pt}` : `Map: ${mission.title.en}`);
    this.ui.drawMinimap();
    if (this.ui.mapOpen) this.ui.drawBigMap();
  }

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
    if (this.waypoint && this.waypointMeta) push(this.waypointMeta.title, this.waypointMeta.title, '#f6c768', this.waypoint);
    const locs = [
      ['hospital', 'Hospital da Maré', 'Maré Hospital', '#ff7058'],
      ['garage', 'Oficina do Zeca', "Zeca's Garage", '#71c7ff'],
      ['marina', 'Marina Azul', 'Blue Marina', '#43ddbe'],
      ['pier', 'Pier de Costa', 'Costa Pier', '#e6ddc8'],
      ['ferris', 'Roda-Gigante', 'Ferris Wheel', '#ff8bc1'],
      ['lighthouse', 'Farol Velho', 'Old Lighthouse', '#f6c768'],
      ['park', 'Parque das Salinas', 'Salt Park', '#89c67a'],
      ['club', 'Neon 88', 'Neon 88', '#b48cff'],
      ['delivery', 'Morro do Som', 'Sound Hill', '#ffb457'],
      ['bank', 'Banco Maré', 'Maré Bank', '#43ddbe'],
      ['police', 'Delegacia Central', 'Central Precinct', '#71c7ff'],
      ['mansion', 'Mansão da Serra', 'Hill Mansion', '#f6c768'],
      ['airport', 'Aeroporto de Costa', 'Costa Airport', '#c8d2ce'],
      ['shop', 'Loja da Orla', 'Shore Shop', '#ff8bc1'],
      ['home', 'Barraco do Caio', "Caio's Place", '#ffb457'],
      ['lanchonete', 'Lanchonete da Praia', 'Beach Diner', '#ff7058'],
      ['port', 'Porto Maré', 'Maré Harbor', '#e6ddc8']
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
        hunger: this.hunger,
        gta7Complete: this.gta7Complete,
        kingUnlocked: this.kingUnlocked,
        mansionOwned: this.mansionOwned,
        bank: this.bank,
        outfits: this.outfits,
        ownedVehicles: this.ownedVehicles,
        waypoint: this.waypoint ? { x: this.waypoint.x, z: this.waypoint.z } : null,
        waypointMeta: this.waypointMeta,
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

