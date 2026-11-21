import * as THREE from 'three';
import { World, LANDMARKS, ROADS_X, ROADS_Z, WATER_LEVEL, SHORE_X, WORLD_BOUNDS, DISTRICTS } from './world.js';
import { AudioSystem } from './audio.js';

const _domCache = new Map();
const $ = (id) => {
  let el = _domCache.get(id);
  if (!el || !el.isConnected) {
    el = document.getElementById(id);
    if (el) _domCache.set(id, el);
  }
  return el;
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const nowSec = () => performance.now() / 1000;

/* ============================================================
   DIALOGUE LIBRARY (PT + EN)
   ============================================================ */
const DIALOGUES = {
  m1_1: [
    { who: 'LUIZA', pt: 'Zeca! Cadê o pacote que a Marina deixou no quiosque?', en: "Zeca! Where's the package Marina left at the kiosk?" },
    { who: 'ZECA', pt: 'O moleque da moto levou, Luiza. Disse que era entrega expressa. Expressa pra ele.', en: 'The bike kid took it, Luiza. Said it was express delivery. Express for him.' },
    { who: 'LUIZA', pt: 'Se ele chegou antes de mim, é porque roubou. E ninguém rouba na minha orla.', en: 'If he got here before me, he stole it. And nobody steals on my shoreline.' }
  ],
  m1_2: [
    { who: 'LUIZA', pt: 'Entregador na Avenida das Palmeiras. Vou atrás. Se o pacote cair, ele vai junto.', en: "Courier on Palm Avenue. I'm on him. If the package drops, he drops with it." }
  ],
  m1_3: [
    { who: 'LUIZA', pt: 'Pacote recuperado. Agora é só não abrir.', en: "Package recovered. Now let's just not open it." }
  ],
  m1_4: [
    { who: 'MARINA', pt: 'Chegou inteiro. O cliente vai gostar. E o seu pagamento também.', en: "It arrived in one piece. The client will be pleased. So will your wallet." },
    { who: 'LUIZA', pt: 'Diz pro cliente que a Orla Dourada cobra caro. Mas entrega.', en: 'Tell the client Orla Dourada charges a lot. But delivers.' }
  ],
  m2_1: [
    { who: 'CARLOS', pt: 'Seu Anselmo, carga do porto. Tá tudo aqui?', en: 'Anselmo, port cargo. Is it all here?' },
    { who: 'ANSELMO', pt: 'Tá. Mas a polícia já sabe. Leva pelo Morro, sem parar.', en: "It is. But the police already know. Take it through the hill. Don't stop." },
    { who: 'CARLOS', pt: 'Ninguém para o Carlos Mendes.', en: 'Nobody stops Carlos Mendes.' }
  ],
  m2_2: [
    { who: 'RÁDIO POLÍCIA', pt: 'Atenção, unidades. Veículo suspeito saindo do Porto Velho. Abordagem imediata.', en: 'Attention, units. Suspicious vehicle leaving Porto Velho. Immediate intercept.' },
    { who: 'CARLOS', pt: 'Dois graus. Tranquilo. Só mais dois graus.', en: 'Two stars. Easy. Just two more stars.' }
  ],
  m2_3: [
    { who: 'DONA ROSA', pt: 'Carlos! Tá todo mundo atrás de você. Entra, rápido.', en: "Carlos! Everyone's after you. Get inside, quick." },
    { who: 'CARLOS', pt: 'Relaxa, tia. A mercadoria chegou. O resto é conversa.', en: "Relax, auntie. The cargo's here. The rest is talk." }
  ],
  m3_1: [
    { who: 'LUIZA', pt: 'Barco pronto, Marina?', en: 'Boat ready, Marina?' },
    { who: 'MARINA', pt: 'Motor cheio. Cinco boias, uma volta, e você me deve um drinque.', en: 'Tank full. Five buoys, one lap, and you owe me a drink.' },
    { who: 'LUIZA', pt: 'Se eu ganhar, o drinque é seu.', en: "If I win, the drink's on me." }
  ],
  m3_2: [
    { who: 'MARINA', pt: 'Cinco boias. Sem atalho, Luiza. Eu estou vendo.', en: 'Five buoys. No shortcuts, Luiza. I am watching.' }
  ],
  m3_3: [
    { who: 'MARINA', pt: 'Você cortou a última boia. Isso não vale.', en: 'You cut the last buoy. That does not count.' },
    { who: 'LUIZA', pt: 'Vale se ninguém viu.', en: 'It counts if nobody saw.' },
    { who: 'MARINA', pt: 'Pagamento na mesa. E da próxima vez, sem atalho.', en: 'Payment is on the table. And next time, no shortcuts.' }
  ],
  m4_1: [
    { who: 'CARLOS', pt: 'Cassino Aurora. Bonito por fora, podre por dentro.', en: 'Cassino Aurora. Pretty outside, rotten inside.' },
    { who: 'RECEPCIONISTA', pt: 'O Galpão 12 está esperando. Seis homens. Nenhum deles quer conversar.', en: 'Warehouse 12 is waiting. Six men. None of them want to talk.' },
    { who: 'CARLOS', pt: 'Ótimo. Eu também não.', en: "Great. Neither do I." }
  ],
  m4_2: [
    { who: 'CARLOS', pt: 'Seis contra um. A conta tá justa.', en: "Six against one. That's a fair count." }
  ],
  m4_3: [
    { who: 'CARLOS', pt: 'Seis. E ainda sobrou munição.', en: 'Six. And I still have ammo left.' },
    { who: 'RÁDIO POLÍCIA', pt: 'Todas as unidades, suspeito armado no Porto Velho.', en: 'All units, armed suspect in Porto Velho.' },
    { who: 'CARLOS', pt: 'Hora de sumir.', en: 'Time to vanish.' }
  ],
  m4_4: [
    { who: 'CARLOS', pt: 'Casa da Orla. Luz apagada, porta dos fundos.', en: 'Casa da Orla. Lights off, back door.' }
  ],
  m5_1: [
    { who: 'LUIZA', pt: 'Carlos, o mirante. Agora.', en: 'Carlos, the overlook. Now.' },
    { who: 'CARLOS', pt: 'Tô indo. E dessa vez, sem parar na polícia.', en: "On my way. And this time, no stopping for the cops." },
    { who: 'LUIZA', pt: 'O servidor do cassino está aqui. Se eu derrubar, a cidade perde o controle.', en: 'The casino server is here. If I take it down, the city loses control.' },
    { who: 'CARLOS', pt: 'E a polícia vai tentar impedir. Eu seguro.', en: 'And the police will try to stop us. I hold the line.' }
  ],
  m5_2: [
    { who: 'LUIZA', pt: 'Vai! Eu preciso de dois minutos.', en: 'Go! I need two minutes.' },
    { who: 'CARLOS', pt: 'Você tem até o sol cair.', en: 'You have until the sun goes down.' }
  ],
  m5_3: [
    { who: 'CARLOS', pt: 'Ainda tô de pé, Luiza!', en: "Still standing, Luiza!" },
    { who: 'LUIZA', pt: 'Consegui. A cidade é nossa.', en: "I got it. The city is ours." },
    { who: 'CARLOS', pt: 'Sempre foi.', en: 'It always was.' }
  ],
  m5_4: [
    { who: 'LUIZA', pt: 'Casa da Orla. Se a polícia nos seguir até lá, o sol não vai ser o único a cair.', en: "Casa da Orla. If the cops follow us there, the sun won't be the only thing going down." }
  ]
};

const NPC_LINES = [
  { pt: 'Esse sol não perdoa, né?', en: "This sun doesn't forgive, does it?" },
  { pt: 'Dizem que o Cassino Aurora lava dinheiro até a lua.', en: 'They say Cassino Aurora launders money all the way to the moon.' },
  { pt: 'Já viu o mirante no fim da tarde? Vale a pena.', en: 'Have you seen the overlook at sunset? Worth it.' },
  { pt: 'A polícia tá em todo canto hoje.', en: 'Police are everywhere today.' },
  { pt: 'Se for pra orla, leva protetor. E paciência.', en: 'If you go to the shore, bring sunscreen. And patience.' },
  { pt: 'O Carlos? Aquele entregador do morro? Nunca deve nada a ninguém.', en: "Carlos? That courier from the hill? He never owes anyone anything." },
  { pt: 'A Luiza tem a voz mais bonita do rádio. E o pé mais pesado.', en: 'Luiza has the prettiest voice on radio. And the heaviest foot.' },
  { pt: 'Cuidado com a maré. Ela sobe rápido.', en: 'Watch the tide. It comes up fast.' },
  { pt: 'O Matteo 5 roda tudo. Até a saudade.', en: 'The Matteo 5 runs everything. Even homesickness.' },
  { pt: 'Santo Matteo não dorme. Só finge.', en: "Santo Matteo doesn't sleep. It just pretends." },
  { pt: 'Ouviu o barulho no porto? Melhor não ouvir.', en: 'Did you hear that noise at the port? Better not to.' },
  { pt: 'A Roda do Sol tá mais bonita hoje.', en: 'The Sun Wheel is prettier today.' }
];

const MISSIONS = [
  {
    id: 'm1', num: 1, title: 'Onda de Calor', char: 'luiza', reward: 2500,
    location: 'ORLA DE MATTEO', time: '18:42', start: LANDMARKS.kiosk,
    sub: 'Toda cidade tem um preço. A orla acabou de cobrar o dela.',
    steps: [
      { type: 'goto', pos: LANDMARKS.kiosk, r: 6, desc: 'Encontre Zeca no Quiosque da Orla', descEn: 'Meet Zeca at the Shore Kiosk', dialogOnArrive: 'm1_1' },
      { type: 'chase', desc: 'Alcance o entregador e recupere o pacote', descEn: 'Catch the courier and recover the package', dialog: 'm1_2', target: { x: 430, z: 0, type: 'sports', color: 0xff7a59, name: 'ENTREGADOR' } },
      { type: 'goto', pos: LANDMARKS.pier, r: 7, desc: 'Entregue o pacote no Píer do Sol', descEn: 'Deliver the package at Sun Pier', dialogOnArrive: 'm1_4' }
    ]
  },
  {
    id: 'm2', num: 2, title: 'Entrega no Morro', char: 'carlos', reward: 4000,
    location: 'PORTO VELHO', time: '19:10', start: LANDMARKS.port,
    sub: 'A carga é pesada. A cidade inteira está olhando.',
    steps: [
      { type: 'goto', pos: LANDMARKS.port, r: 7, desc: 'Pegue a carga no Porto Velho', descEn: 'Pick up the cargo at Porto Velho', dialogOnArrive: 'm2_1' },
      { type: 'goto', pos: { x: -140, z: 420 }, r: 8, desc: 'Atravesse o Centro com a carga', descEn: 'Cross Downtown with the cargo', dialog: 'm2_2', wanted: 2 },
      { type: 'goto', pos: { x: -280, z: 140 }, r: 8, desc: 'Siga para a saída do Morro', descEn: 'Head for the hill exit' },
      { type: 'goto', pos: LANDMARKS.favela, r: 9, desc: 'Entregue a carga no Morro da Lua', descEn: 'Deliver the cargo at Morro da Lua', dialogOnArrive: 'm2_3', clearWanted: true }
    ]
  },
  {
    id: 'm3', num: 3, title: 'Maré Alta', char: 'luiza', reward: 6000,
    location: 'MARINA MARÉ', time: '16:25', start: LANDMARKS.marina,
    sub: 'Cinco boias, um barco e um drinque em jogo.',
    timeLimit: 260,
    steps: [
      { type: 'goto', pos: LANDMARKS.marina, r: 8, desc: 'Encontre Marina na Marina Maré', descEn: 'Meet Marina at Marina Maré', dialogOnArrive: 'm3_1', spawnBoat: true },
      { type: 'enterBoat', desc: 'Entre no barco da Marina', descEn: 'Get in Marina\'s boat', dialog: 'm3_2' },
      { type: 'buoys', points: [{ x: 900, z: 120 }, { x: 1040, z: -80 }, { x: 1180, z: 140 }, { x: 1000, z: 320 }, { x: 850, z: 210 }], r: 14, desc: 'Contorne as cinco boias', descEn: 'Round all five buoys' },
      { type: 'goto', pos: { x: 812, z: 10 }, r: 16, desc: 'Volte para a Marina Maré', descEn: 'Return to Marina Maré', dialogOnArrive: 'm3_3', boat: true }
    ]
  },
  {
    id: 'm4', num: 4, title: 'Noite no Cassino', char: 'carlos', reward: 8000,
    location: 'CENTRO DOURADO', time: '22:05', start: LANDMARKS.casino,
    sub: 'A casa sempre ganha. Até alguém virar a mesa.',
    steps: [
      { type: 'goto', pos: LANDMARKS.casino, r: 7, desc: 'Vá ao Cassino Aurora', descEn: 'Go to Cassino Aurora', dialogOnArrive: 'm4_1' },
      { type: 'goto', pos: LANDMARKS.warehouse, r: 9, desc: 'Siga para o Galpão 12', descEn: 'Head to Warehouse 12', dialogOnArrive: 'm4_2', spawnEnemies: 'gang' },
      { type: 'combat', desc: 'Elimine os homens do Galpão 12', descEn: 'Take out the Warehouse 12 crew', count: 6, dialogOnDone: 'm4_3', wantedOnDone: 3 },
      { type: 'goto', pos: LANDMARKS.safehouse, r: 9, desc: 'Chegue à Casa da Orla', descEn: 'Reach Casa da Orla', dialogOnArrive: 'm4_4' },
      { type: 'escape', desc: 'Despiste a polícia', descEn: 'Lose the police' }
    ]
  },
  {
    id: 'm5', num: 5, title: 'O Último Pôr do Sol', char: 'luiza', reward: 25000,
    location: 'MIRANTE DO SOL', time: '17:58', start: LANDMARKS.monument,
    sub: 'Dois destinos, uma cidade e um horizonte que não espera.',
    steps: [
      { type: 'goto', pos: LANDMARKS.monument, r: 9, desc: 'Encontre Carlos no Mirante do Sol', descEn: 'Meet Carlos at Sun Overlook', dialogOnArrive: 'm5_1' },
      { type: 'switch', char: 'carlos', desc: 'Prepare-se para a defesa', descEn: 'Prepare for the defense', dialog: 'm5_2' },
      { type: 'defend', seconds: 50, desc: 'Defenda Luiza no Mirante', descEn: 'Defend Luiza at the Overlook', wanted: 4 },
      { type: 'goto', pos: LANDMARKS.safehouse, r: 9, desc: 'Fuja para a Casa da Orla', descEn: 'Escape to Casa da Orla', dialogOnArrive: 'm5_4' },
      { type: 'escape', desc: 'Despiste a polícia e desapareça', descEn: 'Lose the police and disappear' }
    ]
  }
];

const RP_JOB_DEFS = [
  { type: 'delivery', title: 'Entrega Expressa', pt: 'Leve o pacote ao destino antes que o cliente perca a paciência.', en: 'Deliver the package before the client loses patience.', reward: 1800, time: 150, rep: 12 },
  { type: 'security', title: 'Segurança de Rua', pt: 'Três valentões estão causando no point. Resolva a situação.', en: 'Three troublemakers are causing a scene. Handle it.', reward: 2200, time: 180, rep: 18 },
  { type: 'race', title: 'Corrida da Orla', pt: 'Quatro checkpoints pela cidade. O asfalto decide quem manda.', en: 'Four checkpoints across the city. The asphalt decides.', reward: 2600, time: 120, rep: 20 },
  { type: 'photo', title: 'Fotógrafo da Cidade', pt: 'Registre três cartões-postais de Santo Matteo para a revista Orla.', en: 'Capture three Santo Matteo postcards for Orla magazine.', reward: 1600, time: 140, rep: 10 }
];

/* ============================================================
   CHARACTER MODEL
   ============================================================ */
class CharacterModel {
  constructor(charId, opts = {}) {
    this.charId = charId;
    this.simple = !!opts.simple;
    this.cop = !!opts.cop;
    this.gang = !!opts.gang;
    this.group = new THREE.Group();
    this.parts = {};
    this.materials = [];
    this.flashTimer = 0;
    this.walkPhase = 0;
    this._build(opts);
  }

  _mat(color, rough = 0.78, metal = 0.02) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
    this.materials.push(m);
    return m;
  }

  _build(opts) {
    const luiza = this.charId === 'luiza';
    const skin = this.cop ? 0xb9815a : this.gang ? 0x9b6a45 : luiza ? 0xa86a44 : 0xb87c50;
    const shirt = this.cop ? 0x1f3550 : this.gang ? (opts.color || 0x2a2c30) : luiza ? 0x14b8a6 : 0xe85d45;
    const pants = this.cop ? 0x17222f : this.gang ? 0x23252a : luiza ? 0xe8e2d2 : 0x27313a;
    const shoe = this.cop ? 0x10161c : 0x1b1f23;
    const skinMat = this._mat(skin, 0.72);
    const shirtMat = this._mat(shirt, 0.85);
    const pantsMat = this._mat(pants, 0.9);
    const shoeMat = this._mat(shoe, 0.8);
    const hairMat = this._mat(this.cop ? 0x17120f : luiza ? 0x191210 : 0x24160f, 0.9);

    if (this.simple) {
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.72, 0.3), shirtMat);
      torso.position.y = 1.22; this.group.add(torso);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 7), skinMat);
      head.position.y = 1.76; this.group.add(head);
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.21, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
      hair.position.y = 1.79; this.group.add(hair);
      const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.75, 0.19), pantsMat);
      l1.position.set(-0.14, 0.55, 0); this.group.add(l1);
      const l2 = l1.clone(); l2.position.x = 0.14; this.group.add(l2);
      const a1 = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.66, 0.15), shirtMat);
      a1.position.set(-0.36, 1.2, 0); this.group.add(a1);
      const a2 = a1.clone(); a2.position.x = 0.36; this.group.add(a2);
      this.parts = { torso, head, l1, l2, a1, a2 };
      if (this.cop) {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8), this._mat(0x14253a, 0.7));
        cap.position.y = 1.96; this.group.add(cap);
        const badge = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.02), this._mat(0xffcf5c, 0.4, 0.6));
        badge.position.set(-0.13, 1.32, 0.16); this.group.add(badge);
      }
      return;
    }

    // hips + torso
    const hips = new THREE.Group(); hips.position.y = 0.94; this.group.add(hips);
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.26, 0.28), pantsMat);
    pelvis.position.y = -0.05; hips.add(pelvis);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.66, 0.3), shirtMat);
    torso.position.y = 0.34; hips.add(torso);
    const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.16, 0.3), shirtMat);
    shoulders.position.y = 0.63; hips.add(shoulders);
    this.parts.hips = hips; this.parts.torso = torso;

    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.205, 12, 10), skinMat);
    head.position.y = 1.72; this.group.add(head);
    this.parts.head = head;
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.06), skinMat);
    nose.position.set(0, 1.7, 0.2); this.group.add(nose);
    // eyes
    const eyeMat = this._mat(0x17100e, 0.5);
    for (const x of [-0.08, 0.08]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.023, 5, 4), eyeMat);
      eye.position.set(x, 1.75, 0.19); this.group.add(eye);
    }
    if (luiza) {
      const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 9), hairMat);
      hairBase.position.set(0, 1.79, -0.085); hairBase.scale.set(1.04, 0.98, 0.84); this.group.add(hairBase);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.075 + Math.random() * 0.035, 6, 5), hairMat);
        puff.position.set(Math.cos(a) * 0.19, 1.8 + Math.sin(a * 2) * 0.09, -0.075 + Math.sin(a) * 0.15);
        this.group.add(puff);
      }
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 7), hairMat);
      bun.position.set(0, 1.9, -0.2); bun.scale.set(1.05, 0.9, 0.85); this.group.add(bun);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.3, 5), this._mat(0xfff0d2, 0.7));
      top.position.set(0.11, 1.96, 0.05); top.rotation.z = -0.3; this.group.add(top);
      const hoopMat = this._mat(0xffcf5c, 0.35, 0.8);
      for (const x of [-0.2, 0.2]) {
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 5, 10), hoopMat);
        hoop.position.set(x, 1.65, 0.02); this.group.add(hoop);
      }
      const topTrim = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.07, 0.31), this._mat(0xffd7a1, 0.7));
      topTrim.position.y = 0.55; hips.add(topTrim);
    } else {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.212, 10, 8), hairMat);
      hair.position.set(0, 1.8, -0.085); hair.scale.set(1.02, 0.85, 0.9); this.group.add(hair);
      const capMat = this._mat(0x1c2a2e, 0.75);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.12, 10), capMat);
      cap.position.set(0, 1.94, 0.01); this.group.add(cap);
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.2), capMat);
      brim.position.set(0, 1.9, 0.19); this.group.add(brim);
      const beard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.08), this._mat(0x1d130e, 0.9));
      beard.position.set(0, 1.63, 0.16); this.group.add(beard);
      const chain = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 4, 10), this._mat(0xffd27a, 0.3, 0.8));
      chain.position.set(0, 1.48, 0.15); chain.rotation.x = Math.PI / 2; this.group.add(chain);
    }

    // arms with pivots
    const mkArm = (x) => {
      const pivot = new THREE.Group(); pivot.position.set(x, 1.55, 0); this.group.add(pivot);
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.16), skinMat);
      upper.position.y = -0.16; pivot.add(upper);
      const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.18), shirtMat);
      sleeve.position.y = 0.02; pivot.add(sleeve);
      const fore = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.14), skinMat);
      fore.position.y = -0.48; pivot.add(fore);
      return pivot;
    };
    const armL = mkArm(-0.36), armR = mkArm(0.36);
    this.parts.armL = armL; this.parts.armR = armR;
    // legs
    const mkLeg = (x) => {
      const pivot = new THREE.Group(); pivot.position.set(x, 0.92, 0); this.group.add(pivot);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.76, 0.22), pantsMat);
      leg.position.y = -0.38; pivot.add(leg);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.13, 0.32), shoeMat);
      shoe.position.set(0, -0.8, 0.05); pivot.add(shoe);
      return pivot;
    };
    const legL = mkLeg(-0.14), legR = mkLeg(0.14);
    this.parts.legL = legL; this.parts.legR = legR;

    // pistol in right hand
    const gun = new THREE.Group();
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.28), this._mat(0x23282c, 0.4, 0.7));
    gunBody.position.z = 0.12; gun.add(gunBody);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.15, 0.08), this._mat(0x15191c, 0.6));
    grip.position.set(0, -0.09, 0.02); grip.rotation.x = -0.2; gun.add(grip);
    gun.position.set(0.02, -0.58, 0.05); gun.visible = false;
    armR.add(gun);
    this.parts.gun = gun;

    if (this.gang) {
      const bandana = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.05), this._mat(0xb8453a, 0.8));
      bandana.position.set(0, 1.58, 0.17); this.group.add(bandana);
    }
    if (this.cop) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.22, 0.11, 10), this._mat(0x14253a, 0.7));
      cap.position.set(0, 1.95, 0.01); this.group.add(cap);
      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.02), this._mat(0xffcf5c, 0.4, 0.6));
      badge.position.set(-0.15, 1.35, 0.16); this.group.add(badge);
    }
  }

  setGun(v) { if (this.parts.gun) this.parts.gun.visible = v; }

  update(dt, speed = 0, state = 'idle') {
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    if (this.flashTimer <= 0) {
      for (const m of this.materials) if (m.emissive && m.emissive.getHex() !== 0) m.emissive.setHex(0x000000);
    }
    const sp = Math.min(1, speed / 4.5);
    this.walkPhase += dt * (3.2 + speed * 1.5);
    const swing = Math.sin(this.walkPhase) * 0.7 * sp;
    if (this.parts.legL) {
      this.parts.legL.rotation.x = swing;
      this.parts.legR.rotation.x = -swing;
    } else if (this.parts.l1) {
      this.parts.l1.rotation.x = swing * 0.7;
      this.parts.l2.rotation.x = -swing * 0.7;
    }
    if (this.parts.armL) {
      this.parts.armL.rotation.x = -swing * 0.75;
      if (state === 'aim') {
        this.parts.armR.rotation.x = -1.5;
        this.parts.armL.rotation.x = -1.25;
        this.parts.armL.rotation.z = 0.45;
        this.parts.gun.visible = true;
      } else if (state === 'shoot') {
        this.parts.armR.rotation.x = -1.62;
        this.parts.armL.rotation.x = -1.3;
        this.parts.gun.visible = true;
      } else {
        this.parts.armR.rotation.x = swing * 0.75;
        this.parts.armL.rotation.z = 0;
        this.parts.gun.visible = false;
      }
    } else if (this.parts.a1) {
      this.parts.a1.rotation.x = swing * 0.6;
      this.parts.a2.rotation.x = -swing * 0.6;
    }
    const bob = state === 'idle' ? Math.sin(this.walkPhase * 0.5) * 0.012 : Math.abs(Math.sin(this.walkPhase)) * 0.035 * sp;
    if (this.parts.hips) this.parts.hips.position.y = 0.94 + bob;
    else if (this.parts.torso) this.parts.torso.position.y = 1.22 + bob;
    if (this.parts.head) this.parts.head.position.y = 1.72 + bob * 0.6;
  }

  flash() {
    this.flashTimer = 0.09;
    for (const m of this.materials) if (m.emissive) m.emissive.setHex(0x661111);
  }

  dispose() {
    this.group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
        else o.material.dispose();
      }
    });
  }
}

/* ============================================================
   VEHICLE MESH
   ============================================================ */
function buildCarMesh(type, color, name) {
  const g = new THREE.Group();
  const wheels = [];
  const mats = [];
  const mat = (c, r = 0.42, m = 0.2) => { const mm = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m }); mats.push(mm); return mm; };
  const bodyMat = mat(color, 0.34, 0.35);
  const darkMat = mat(0x131a1e, 0.5, 0.3);
  const glassMat = mat(0x17303a, 0.12, 0.55);
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff2c8, emissive: 0xffe0a0, emissiveIntensity: 0.8, roughness: 0.3 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff3b2f, emissive: 0xaa1100, emissiveIntensity: 0.7, roughness: 0.4 });

  let L = 4.4, W = 1.9, H = 0.62;
  if (type === 'sports') { L = 4.5; W = 2.0; H = 0.48; }
  if (type === 'suv') { L = 4.7; W = 2.0; H = 0.8; }
  if (type === 'pickup') { L = 5.0; W = 2.0; H = 0.72; }
  if (type === 'taxi') { L = 4.4; W = 1.9; H = 0.62; }
  if (type === 'police') { L = 4.6; W = 1.95; H = 0.64; }

  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, L), bodyMat);
  body.position.y = 0.52 + H / 2; g.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(W * 0.94, 0.14, L * 0.3), bodyMat);
  hood.position.set(0, 0.58 + H, L * 0.33); g.add(hood);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(W * 0.82, 0.56, L * (type === 'pickup' ? 0.3 : 0.42)), glassMat);
  cabin.position.set(0, 0.58 + H + 0.27, type === 'pickup' ? L * 0.14 : -L * 0.02);
  g.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(W * 0.84, 0.09, L * (type === 'pickup' ? 0.31 : 0.4)), bodyMat);
  roof.position.set(0, 0.58 + H + 0.56, cabin.position.z); g.add(roof);

  if (type === 'pickup') {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, 0.25, L * 0.32), darkMat);
    bed.position.set(0, 0.58 + H + 0.12, -L * 0.29); g.add(bed);
  }
  if (type === 'taxi') {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.3), new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffc46b, emissiveIntensity: 0.5 }));
    sign.position.set(0, 0.58 + H + 0.7, -L * 0.02); g.add(sign);
  }
  if (type === 'police') {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(W * 0.7, 0.16, 0.32), darkMat);
    bar.position.set(0, 0.58 + H + 0.68, -L * 0.02); g.add(bar);
    const red = new THREE.Mesh(new THREE.BoxGeometry(W * 0.3, 0.13, 0.28), new THREE.MeshStandardMaterial({ color: 0xff2d3d, emissive: 0xff1122, emissiveIntensity: 2 }));
    red.position.set(-W * 0.18, 0.58 + H + 0.78, -L * 0.02); g.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(W * 0.3, 0.13, 0.28), new THREE.MeshStandardMaterial({ color: 0x2d7dff, emissive: 0x1155ff, emissiveIntensity: 2 }));
    blue.position.set(W * 0.18, 0.58 + H + 0.78, -L * 0.02); g.add(blue);
    g.userData.lightRed = red; g.userData.lightBlue = blue;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(W * 1.01, 0.2, L * 0.34), mat(0xf2efe4, 0.5));
    stripe.position.set(0, 0.58 + H * 0.55, 0); g.add(stripe);
  }

  // lights
  for (const x of [-W * 0.32, W * 0.32]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.08), lightMat);
    hl.position.set(x, 0.64 + H * 0.5, L / 2 + 0.01); g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.08), tailMat);
    tl.position.set(x, 0.64 + H * 0.5, -L / 2 - 0.01); g.add(tl);
  }
  // wheels
  const wheelGeo = new THREE.CylinderGeometry(0.37, 0.37, 0.24, 10);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = mat(0x121619, 0.85, 0.1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const wh = new THREE.Mesh(wheelGeo, wheelMat);
    wh.position.set(sx * (W / 2 - 0.06), 0.37, sz * (L * 0.32));
    g.add(wh); wheels.push(wh);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.26, 8), mat(0x9aa4a6, 0.3, 0.8));
    hub.rotation.z = Math.PI / 2;
    hub.position.copy(wh.position); g.add(hub);
  }
  // shadow
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.8, L + 0.6), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; g.add(shadow);
  // bumpers
  const bump = new THREE.Mesh(new THREE.BoxGeometry(W * 0.98, 0.16, 0.16), darkMat);
  bump.position.set(0, 0.45, L / 2 + 0.06); g.add(bump);
  const bump2 = bump.clone(); bump2.position.z = -L / 2 - 0.06; g.add(bump2);

  g.userData.wheels = wheels;
  g.userData.bodyMat = bodyMat;
  g.userData.mats = mats;
  g.userData.lights = { head: lightMat, tail: tailMat };
  g.userData.name = name || type;
  return g;
}

function buildBoatMesh(color) {
  const g = new THREE.Group();
  const mat = (c, r = 0.4, m = 0.2) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const hullMat = mat(color, 0.4, 0.15);
  const white = mat(0xf1eee2, 0.5);
  const dark = mat(0x1a272d, 0.4, 0.4);
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.5, 9.5), hullMat);
  hull.position.y = 0.55; g.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 4), hullMat);
  bow.rotation.x = Math.PI / 2; bow.rotation.z = Math.PI / 4;
  bow.position.set(0, 0.55, 5.7); bow.scale.x = 0.72; g.add(bow);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.14, 8.6), white);
  deck.position.y = 1.36; g.add(deck);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.45, 2.6), white);
  cabin.position.set(0, 2.1, -1.2); g.add(cabin);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.55, 2.66), dark);
  glass.position.set(0, 2.35, -1.2); g.add(glass);
  const motor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 1.1), dark);
  motor.position.set(0, 0.7, -5.2); g.add(motor);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.9), dark);
  seat.position.set(0, 1.65, 1.6); g.add(seat);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4, 11), new THREE.MeshBasicMaterial({ color: 0x001018, transparent: true, opacity: 0.25, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02; g.add(shadow);
  g.userData.mats = [hullMat, white, dark];
  return g;
}

/* ============================================================
   GAME
   ============================================================ */
export class Game {
  constructor(opts = {}) {
    this.canvas = opts.canvas || $('game-canvas');
    this.settings = opts.settings || {};
    this.save = opts.save || {};
    this.callbacks = opts.callbacks || {};
    this.audio = opts.audio || new AudioSystem(this.settings);
    this.mode = 'attract';
    this.paused = false;
    this.cutscene = false;
    this.dialogueActive = false;
    this.mapOpen = false;
    this.resultOpen = false;
    this.waypoint = this.save.waypoint || null;
    this.mission = null;
    this.rpJob = null;
    this.completed = new Set(this.save.completed || []);
    this.wanted = 0;
    this.rp = this.save.rp || { rep: 0, done: 0 };
    this.rpJobs = null;
    this._lastMoney = this.save.money ?? 2450;
    this._objectivePos = null;
    this._subTimer = 0;
    this.vehicles = [];
    this.traffic = [];
    this.npcs = [];
    this.enemies = [];
    this.cops = [];
    this.pickups = [];
    this.effects = [];
    this.markers = [];
    this.keys = {};
    this.input = {
      x: 0, y: 0, joyX: 0, joyY: 0,
      sprint: false, aim: false, shoot: false,
      brake: false, throttle: false, handbrake: false, boost: false,
      lookBack: false, lookDX: 0, lookDY: 0
    };
    this.mouse = { down: false, right: false, lastX: 0, lastY: 0 };
    this.touch = { lookId: null, joyId: null, lastX: 0, lastY: 0 };
    this.clockMinutes = 18 * 60 + 42;
    this.playtime = this.save.playtime || 0;
    this.lastSaveAt = 0;
    this.hudTick = 0;
    this.frameCount = 0;
    this.fps = 60;
    this._fpsAccum = 0; this._fpsFrames = 0;
    this._last = performance.now();
    this._accum = 0;
    this._camYaw = Math.PI / 2;
    this._camPitch = 0.16;
    this._camDist = 5.4;
    this._camSide = 1;
    this._camTarget = new THREE.Vector3();
    this._camFwd = new THREE.Vector3();
    this._camRight = new THREE.Vector3();
    this._camDesired = new THREE.Vector3();
    this._camLook = new THREE.Vector3();
    this._camShake = 0;
    this._flashDamage = 0;
    this._noiseTime = 0;
    this._helpShown = false;
    this._missionTargetPos = null;
    this._lastWanted = 0;
    this._wantedEvade = 0;
    this._policeSpawnTimer = 0;
    this._bustedTimer = 0;
    this._heli = null;
    this._boat = null;
    this._activeBoat = null;
    this._targetCar = null;
    this._buoys = [];
    this._buoyIndex = 0;
    this._defendTimer = 0;
    this._defendWave = 0;
    this._rpTargets = [];
    this._rpIndex = 0;
    this._rpTimer = 0;
    this._missionCheckpoint = new THREE.Vector3();
    this._pendingAdvance = null;
    this._lastSub = 0;
    this._lastObjective = '';
    this._district = '';
    this._fpsLimitAccum = 0;
    this._qualityAuto = false;
    this._lowFpsTime = 0;
    this._highFpsTime = 0;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: (this.settings.quality || 'high') !== 'low',
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.world = new World(this.renderer, this.settings);
    this.scene = this.world.scene;
    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 4200);
    this.camera.position.set(450, 30, 160);

    this.effectGroup = new THREE.Group();
    this.scene.add(this.effectGroup);
    this.markerGroup = new THREE.Group();
    this.scene.add(this.markerGroup);
    this.objectiveMarker = this._makeMarker(0xffc46b, 'OBJETIVO');
    this.objectiveMarker.visible = false;
    this.scene.add(this.objectiveMarker);

    this._initAttract();
    this._bindInput();
    this._bindUI();
    this.applySettings(this.settings);
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.mode !== 'attract' && !this.paused) this.togglePause(true);
    });
    this.resize();
    requestAnimationFrame((t) => this._loop(t));
  }

  /* ---------- attract mode ---------- */
  _initAttract() {
    this.mode = 'attract';
    this.camera.position.set(492, 26, 206);
    this.camera.lookAt(760, 8, 120);
    this._attractT = 0;
    this.hideHUD();
  }

  _updateAttract(dt) {
    this._attractT += dt;
    const t = this._attractT;
    const x = 470 + Math.sin(t * 0.045) * 60;
    const z = 190 + Math.cos(t * 0.032) * 90;
    const y = 23 + Math.sin(t * 0.06) * 7;
    this.camera.position.set(x, y, z);
    this.camera.lookAt(735 + Math.sin(t * 0.02) * 30, 9 + Math.sin(t * 0.05) * 3, 130 + Math.cos(t * 0.03) * 50);
    this.camera.fov = 58;
    this.camera.updateProjectionMatrix();
  }

  /* ---------- lifecycle ---------- */
  showMenu() {
    this.mode = 'attract';
    this.paused = false;
    this.mission = null;
    this.rpJob = null;
    this.dialogueActive = false;
    this.cutscene = false;
    this.keys = {};
    this.input.sprint = false; this.input.aim = false; this.input.shoot = false;
    this.input.brake = false; this.input.throttle = false; this.input.handbrake = false;
    this.input.boost = false; this.input.lookBack = false;
    this._hideAllOverlays();
    this.hideHUD();
    this._clearMissionEntities();
    this._clearPolice();
    this._clearObjectiveMarker();
    this._initAttract();
    this.audio.play('ui-back');
  }

  startStory(charId, saveState = null) {
    this.audio.init();
    const fresh = !saveState;
    this.mode = 'story';
    this.paused = false;
    this.cutscene = false;
    this.dialogueActive = false;
    this.completed = new Set(saveState?.completed || (fresh ? [] : this.save.completed) || []);
    this.ensurePlayer(charId, saveState);
    this.ensureWorldActors();
    this.player.money = saveState?.money ?? (fresh ? 2450 : this.save.money) ?? 2450;
    this.player.health = 100; this.player.armor = saveState?.armor ?? (fresh ? 40 : 40);
    this.player.stamina = 100;
    this.player.dead = false;
    this.player.inVehicle = null;
    this.player.weapon.mag = 12; this.player.weapon.reserve = 48;
    this.setWanted(0, true);
    this.clockMinutes = saveState?.clock ?? 18 * 60 + 42;
    this.playtime = saveState?.playtime || (fresh ? 0 : this.playtime) || 0;
    this.waypoint = saveState?.waypoint || (fresh ? null : this.save.waypoint) || null;
    if (saveState?.x != null) {
      this.player.pos.set(saveState.x, 0, saveState.z);
      this.player.yaw = saveState.yaw ?? Math.PI / 2;
      this._camYaw = this.player.yaw;
    } else if (fresh) {
      this.player.pos.set(LANDMARKS.spawn.x, 0, LANDMARKS.spawn.z);
      this.player.yaw = Math.PI / 2;
      this._camYaw = this.player.yaw;
      this._camPitch = 0.16;
    }
    this._placePlayer();
    this.setCharacter(charId, true);
    this.showHUD();
    this._rebuildStaticMarkers();
    this._snapCamera();
    this.notify(
      'SANTO MATTEO',
      this._touchEnabled()
        ? 'Use o analógico para andar, ○ para interagir, L1 para rolar e o touchpad para abrir o mapa.'
        : 'Use WASD para andar, E para interagir e M para o mapa.',
      'good'
    );
    if (!this._helpShown) { this._helpShown = true; setTimeout(() => this._showTutorial(), 900); }
    this._autosave();
  }

  startRP(charId, saveState = null) {
    this.audio.init();
    this.mode = 'rp';
    this.paused = false;
    this.cutscene = false;
    this.completed = new Set(saveState?.completed || this.save.completed || []);
    this.ensurePlayer(charId, saveState);
    this.ensureWorldActors();
    this.player.money = saveState?.money ?? this.save.money ?? 2450;
    this.player.health = 100; this.player.armor = 40;
    this.rp = saveState?.rp || this.save.rp || { rep: 0, done: 0 };
    this.waypoint = saveState?.waypoint || this.save.waypoint || null;
    this.setWanted(0, true);
    if (saveState?.x != null) {
      this.player.pos.set(saveState.x, 0, saveState.z);
      this.player.yaw = saveState.yaw ?? Math.PI / 2;
      this._camYaw = this.player.yaw;
    }
    this._placePlayer();
    this.setCharacter(charId, true);
    this.showHUD();
    this._rebuildStaticMarkers();
    this._snapCamera();
    this.notify('ROLEPLAY ONLINE', 'Santo Matteo está aberto. Aceite trabalhos pelo mural RP ou pela pausa.', 'rp');
    this._autosave();
  }

  ensurePlayer(charId, saveState) {
    if (this.player) {
      if (charId && charId !== this.player.charId) this.setCharacter(charId, true);
      return;
    }
    const spawn = saveState?.x != null ? { x: saveState.x, z: saveState.z } : LANDMARKS.spawn;
    this.player = {
      charId: charId || 'luiza',
      model: null,
      pos: new THREE.Vector3(spawn.x, 0, spawn.z),
      vel: new THREE.Vector3(),
      yaw: saveState?.yaw ?? Math.PI / 2,
      vy: 0, onGround: true,
      health: 100, armor: 40, stamina: 100,
      money: saveState?.money ?? 2450,
      weapon: { mag: 12, reserve: 48, magSize: 12, fireRate: 0.26, damage: 34, reloadTime: 1.25 },
      reloading: 0, fireCooldown: 0,
      inVehicle: null, aim: false, sprinting: false, swimming: false,
      lastDamage: -99, kills: 0, shots: 0, hits: 0, package: false,
      dead: false, deadTimer: 0, busted: false,
      meleeCooldown: 0, meleeTime: 0, interactCooldown: 0,
      walkPhase: 0, lastVehicle: null
    };
    this.player.model = new CharacterModel(this.player.charId);
    this.scene.add(this.player.model.group);
    // blob shadow
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 8, 64, 64, 62);
    gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    this.player.shadow = shadow;
    this.scene.add(shadow);
    this._placePlayer();
    this._snapCamera();
  }

  setCharacter(charId, silent = false) {
    if (!this.player || !this.player.model) return;
    if (this.player.charId === charId) { this._updateCharHUD(); return; }
    const pos = this.player.model.group.position.clone();
    const rot = this.player.model.group.rotation.y;
    this.scene.remove(this.player.model.group);
    this.player.model.dispose();
    this.player.charId = charId;
    this.player.model = new CharacterModel(charId);
    this.player.model.group.position.copy(pos);
    this.player.model.group.rotation.y = rot;
    this.player.model.group.visible = !this.player.inVehicle;
    this.scene.add(this.player.model.group);
    this._updateCharHUD();
    if (!silent) {
      this.audio.play('switch');
      this.notify('TROCA DE PERSONAGEM', charId === 'luiza' ? 'Luiza assume. A orla é dela.' : 'Carlos assume. O morro responde.', 'good');
      this._autosave();
    }
  }

  _placePlayer() {
    if (!this.player) return;
    const p = this.player;
    p.model.group.position.set(p.pos.x, p.pos.y, p.pos.z);
    p.model.group.rotation.y = p.yaw;
    if (p.shadow) p.shadow.position.set(p.pos.x, Math.max(0.02, p.pos.y + 0.02), p.pos.z);
  }

  _updateCharHUD() {
    if (!this.player) return;
    const isL = this.player.charId === 'luiza';
    const portrait = $('char-portrait');
    if (portrait) portrait.innerHTML = `<svg><use href="#portrait-${isL ? 'luiza' : 'carlos'}"/></svg>`;
    $('char-name').textContent = isL ? 'LUIZA' : 'CARLOS';
    $('char-role').textContent = isL ? 'A VOZ DA ORLA' : 'O BRAÇO DO MORRO';
    const pp = $('pause-char');
    if (pp) pp.innerHTML = `<svg><use href="#portrait-${isL ? 'luiza' : 'carlos'}"/></svg>`;
    $('pause-char-name').textContent = isL ? 'LUIZA' : 'CARLOS';
    $('pause-char-role').textContent = isL ? 'A VOZ DA ORLA' : 'O BRAÇO DO MORRO';
    const rpA = $('rp-avatar'); if (rpA) rpA.innerHTML = `<svg><use href="#portrait-${isL ? 'luiza' : 'carlos'}"/></svg>`;
    const rpN = $('rp-name'); if (rpN) rpN.textContent = isL ? 'LUIZA ANDRADE' : 'CARLOS MENDES';
    const pc = $('pause-char-name'); if (pc) pc.textContent = isL ? 'LUIZA' : 'CARLOS';
    const msChar = $('ms-char'); if (msChar) msChar.innerHTML = `<svg><use href="#portrait-${isL ? 'luiza' : 'carlos'}"/></svg>`;
    const msName = $('ms-name'); if (msName) msName.textContent = isL ? 'LUIZA' : 'CARLOS';
  }

  ensureWorldActors() {
    if (!this._parkedSpawned) { this._parkedSpawned = true; this._spawnParkedCars(); }
    if (!this._trafficSpawned) { this._trafficSpawned = true; this._spawnTraffic(); }
    if (!this._npcSpawned) { this._npcSpawned = true; this._spawnNPCs(); }
    if (!this._pickupsSpawned) { this._pickupsSpawned = true; this._spawnPickups(); }
  }

  _spawnParkedCars() {
    const defs = [
      { x: 548, z: 26, type: 'sports', color: 0xff7a59, angle: Math.PI / 2 },
      { x: 522, z: -62, type: 'sports', color: 0x5cc8ff, angle: 0 },
      { x: 506, z: 92, type: 'sedan', color: 0x2ec4b6, angle: 0 },
      { x: 300, z: 22, type: 'suv', color: 0xd8c7a4, angle: Math.PI / 2 },
      { x: -62, z: 268, type: 'sports', color: 0x5cc8ff, angle: Math.PI / 2 },
      { x: 142, z: -142, type: 'pickup', color: 0xb8453a, angle: 0 },
      { x: -422, z: -78, type: 'sedan', color: 0xe9d6b8, angle: 0 },
      { x: -576, z: -356, type: 'hatch', color: 0xffd166, angle: Math.PI / 2 },
      { x: 422, z: -422, type: 'sports', color: 0xef476f, angle: 0 },
      { x: 6, z: -424, type: 'suv', color: 0x27313a, angle: 0 },
      { x: -142, z: 562, type: 'pickup', color: 0x3d7a52, angle: 0 },
      { x: -698, z: 142, type: 'sedan', color: 0xf1eee2, angle: Math.PI / 2 },
      { x: 282, z: 422, type: 'taxi', color: 0xffc46b, angle: 0 },
      { x: 62, z: 702, type: 'hatch', color: 0x7b5a8c, angle: 0 },
      { x: 602, z: -302, type: 'sports', color: 0xf1eee2, angle: 0 }
    ];
    for (const d of defs) {
      this._makeVehicle({ ...d, name: 'VEÍCULO', driver: null, parked: true });
    }
  }

  _spawnTraffic() {
    const types = ['sedan', 'hatch', 'suv', 'pickup', 'taxi', 'sports'];
    const colors = [0xd8c7a4, 0x2ec4b6, 0xe85d45, 0xf1eee2, 0x5cc8ff, 0xffd166, 0x27313a, 0xb8453a];
    for (let i = 0; i < 12; i++) {
      const rp = this.world.randomRoadPoint(Math.random);
      const axis = rp.axis;
      const dir = Math.random() > 0.5 ? 1 : -1;
      const lane = (Math.random() > 0.5 ? 4.5 : -4.5);
      const v = this._makeVehicle({
        x: rp.x, z: rp.z, type: types[Math.floor(Math.random() * types.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: axis === 'x' ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI),
        name: 'TRÂNSITO', driver: 'ai'
      });
      v.traffic = { axis, dir, lane, speed: rand(8, 14), road: axis === 'x' ? rp.x : rp.z };
      this.traffic.push(v);
    }
  }

  _makeVehicle(o) {
    const isBoat = o.type === 'boat';
    const mesh = isBoat ? buildBoatMesh(o.color) : buildCarMesh(o.type, o.color, o.name);
    mesh.position.set(o.x, isBoat ? WATER_LEVEL + 0.02 : 0, o.z);
    mesh.rotation.y = o.angle || 0;
    this.scene.add(mesh);
    const typeStats = {
      sedan: { max: 38, accel: 15, handling: 1.5, mass: 1 },
      hatch: { max: 34, accel: 16, handling: 1.7, mass: 0.9 },
      sports: { max: 56, accel: 25, handling: 1.9, mass: 1 },
      suv: { max: 40, accel: 14, handling: 1.25, mass: 1.3 },
      pickup: { max: 36, accel: 13, handling: 1.15, mass: 1.35 },
      taxi: { max: 38, accel: 15, handling: 1.5, mass: 1 },
      police: { max: 50, accel: 22, handling: 1.75, mass: 1.05 },
      boat: { max: 30, accel: 12, handling: 1.3, mass: 1 }
    };
    const st = typeStats[o.type] || typeStats.sedan;
    const modelNames = {
      sedan: 'SEDAN MATTEO', hatch: 'HATCH ORLA', sports: 'VECTOR GT',
      suv: 'TROLLER 4X4', pickup: 'CARRETA LITORAL', taxi: 'TAXI SOL',
      police: 'VIATURA', boat: 'MARÉ 01'
    };
    const genericName = !o.name || o.name === 'VEÍCULO';
    const v = {
      mesh, type: o.type || 'sedan', name: genericName ? (modelNames[o.type] || 'VEÍCULO') : o.name, color: o.color,
      pos: new THREE.Vector3(o.x, isBoat ? WATER_LEVEL + 0.02 : 0, o.z),
      angle: o.angle || 0, speed: 0, health: 100, maxHealth: 100,
      maxSpeed: st.max, accel: st.accel, handling: st.handling, mass: st.mass,
      isBoat, isPolice: o.type === 'police', driver: o.driver || null, parked: !!o.parked,
      traffic: null, ai: null, wheels: mesh.userData.wheels || [], sirenPhase: Math.random() * 10,
      exploded: false, fireTimer: 0, stuck: 0, destroyed: false, occupiedBy: null,
      lightRed: mesh.userData.lightRed, lightBlue: mesh.userData.lightBlue,
      lastPos: new THREE.Vector3(o.x, 0, o.z)
    };
    this.vehicles.push(v);
    return v;
  }

  _removeVehicle(v) {
    this.scene.remove(v.mesh);
    v.destroyed = true;
    this.vehicles = this.vehicles.filter(x => x !== v);
    this.traffic = this.traffic.filter(x => x !== v);
    if (this.player && this.player.inVehicle === v) this.player.inVehicle = null;
  }

  _spawnNPCs() {
    const colors = [0x2ec4b6, 0xff7a59, 0xffd166, 0xef476f, 0x5cc8ff, 0xf1eee2, 0x7bd389, 0xb388eb];
    for (let i = 0; i < 16; i++) {
      const rp = this.world.randomRoadPoint(Math.random);
      const x = rp.axis === 'x' ? rp.x + rand(-8, 8) : rp.x + rand(-30, 30);
      const z = rp.axis === 'z' ? rp.z + rand(-8, 8) : rp.z + rand(-30, 30);
      const model = new CharacterModel('npc', { simple: true, color: colors[i % colors.length] });
      model.group.position.set(x, 0, z);
      this.scene.add(model.group);
      const npc = {
        model, pos: new THREE.Vector3(x, 0, z), axis: rp.axis, dir: Math.random() > 0.5 ? 1 : -1,
        speed: rand(1.2, 2.2), phase: Math.random() * 6, flee: 0, dead: false,
        line: Math.floor(Math.random() * NPC_LINES.length), talkCooldown: 0
      };
      this.npcs.push(npc);
    }
  }

  _spawnPickups() {
    const defs = [
      { x: 560, z: 0, type: 'cash' }, { x: 560, z: -220, type: 'health' },
      { x: 250, z: 130, type: 'armor' }, { x: -210, z: 210, type: 'cash' },
      { x: -420, z: 420, type: 'ammo' }, { x: 140, z: -280, type: 'health' },
      { x: 0, z: 560, type: 'cash' }, { x: -700, z: -140, type: 'armor' },
      { x: 420, z: 140, type: 'ammo' }, { x: -140, z: -700, type: 'cash' },
      { x: 560, z: 420, type: 'health' }, { x: -280, z: -420, type: 'cash' }
    ];
    for (const d of defs) {
      const color = d.type === 'health' ? 0x7dfba7 : d.type === 'armor' ? 0x5cc8ff : d.type === 'ammo' ? 0xffc46b : 0xffd166;
      const g = new THREE.Group();
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, roughness: 0.3 }));
      g.add(core);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.04, 5, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }));
      ring.rotation.x = Math.PI / 2; g.add(ring);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 3, 8, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }));
      beam.position.y = 1.5; g.add(beam);
      g.position.set(d.x, 1.1, d.z);
      this.scene.add(g);
      this.pickups.push({ g, core, ring, type: d.type, x: d.x, z: d.z, active: true, respawn: 0, baseY: 1.1 });
    }
  }

  /* ---------- markers ---------- */
  _makeMarker(color, label) {
    const g = new THREE.Group();
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 34, 18, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    beam.position.y = 17; g.add(beam);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.12, 6, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.12; g.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.06, 5, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45 }));
    ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.15; g.add(ring2);
    const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, roughness: 0.3 }));
    diamond.position.y = 4.2; g.add(diamond);
    g.userData = { beam, ring, ring2, diamond, color, baseY: 4.2 };
    if (label) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 128;
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(3,10,14,.82)';
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(8, 20, 496, 88, 10) : ctx.rect(8, 20, 496, 88); ctx.fill();
      ctx.strokeStyle = '#' + new THREE.Color(color).getHexString();
      ctx.lineWidth = 4; ctx.stroke();
      ctx.font = '800 44px "Barlow Condensed", Arial, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff3da';
      ctx.fillText(label, 256, 66);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: true }));
      sprite.scale.set(7.2, 1.8, 1);
      sprite.position.y = 7.4;
      g.add(sprite);
    }
    return g;
  }

  _rebuildStaticMarkers() {
    for (const m of this.markers) this.markerGroup.remove(m);
    this.markers = [];
    if (this.mode === 'attract' || !this.player) return;
    if (this.mode === 'story' && !this.mission) {
      const next = this.nextMission();
      if (next) {
        const m = this._makeMarker(0xffc46b, 'MISSÃO ' + next.num);
        m.position.set(next.start.x, 0, next.start.z);
        m.userData.kind = 'mission';
        m.userData.missionId = next.id;
        this.markerGroup.add(m); this.markers.push(m);
      }
    }
    if (!this.mission && !this.rpJob) {
      const rp = this._makeMarker(0x2ee6c8, 'TRABALHOS RP');
      rp.position.set(LANDMARKS.rpBoard.x, 0, LANDMARKS.rpBoard.z);
      rp.userData.kind = 'rp';
      this.markerGroup.add(rp); this.markers.push(rp);
    }
    const garage = this._makeMarker(0xb58cff, 'GARAGEM');
    garage.position.set(LANDMARKS.garage.x, 0, LANDMARKS.garage.z);
    garage.userData.kind = 'garage';
    this.markerGroup.add(garage); this.markers.push(garage);
  }

  _setObjectiveMarker(x, z, visible = true, color = 0xffc46b) {
    if (!visible) { this.objectiveMarker.visible = false; return; }
    this.objectiveMarker.visible = true;
    this.objectiveMarker.position.set(x, 0, z);
    const beam = this.objectiveMarker.userData.beam;
    beam.material.color.setHex(color);
    this.objectiveMarker.userData.ring.material.color.setHex(color);
    this.objectiveMarker.userData.diamond.material.color.setHex(color);
    this.objectiveMarker.userData.diamond.material.emissive.setHex(color);
  }

  _clearObjectiveMarker() { if (this.objectiveMarker) this.objectiveMarker.visible = false; }

  /* ---------- settings ---------- */
  applySettings(s) {
    this.settings = { ...this.settings, ...s };
    const st = this.settings;
    this._applyRenderScale();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    if (this.camera) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }
    const shadows = st.shadows !== false;
    const touchOn = this._touchEnabled();
    const shadowSize = shadows ? (touchOn ? 1024 : 2048) : 512;
    this.renderer.shadowMap.enabled = shadows;
    if (this.world.sunLight) {
      this.world.sunLight.castShadow = shadows;
      this.world.sunLight.shadow.mapSize.set(shadowSize, shadowSize);
    }
    if (this.world.scene.fog) {
      const base = (this.world.tod === 'night' ? 1050 : this.world.tod === 'day' ? 1900 : 1650);
      this.world.scene.fog.far = base * (0.55 + (st.distance ?? 80) / 100 * 0.45);
    }
    if (this.world.tod !== st.tod) this.world.setTimeOfDay(st.tod || 'golden');
    if (this._waterQ !== st.water) { this._waterQ = st.water; this.world.setWaterQuality(st.water || 'medium'); }
    document.body.classList.toggle('no-vignette', st.vignette === false);
    document.body.classList.toggle('no-grain', st.grain === false);
    document.body.classList.toggle('high-contrast', !!st.contrast);
    document.documentElement.style.setProperty('--hud-scale', ((st.hudScale ?? 100) / 100).toString());
    const mm = $('minimap-wrap');
    if (mm) {
      const size = st.minimap === 'small' ? 142 : st.minimap === 'large' ? 218 : 184;
      mm.style.setProperty('--mm-size', size + 'px');
    }
    $('fps-counter').classList.toggle('hidden', !st.showFps);
    this.audio.setVolumes(st);
    if (this.world.sunLight) this.world.sunLight.shadow.needsUpdate = true;
    this._syncTouchMode();
  }

  _applyRenderScale() {
    const cap = this._touchEnabled() ? 1.5 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, cap);
    const scale = clamp((this.settings.resScale ?? 100) / 100, 0.5, 1);
    this.renderer.setPixelRatio(dpr * scale);
  }

  _touchEnabled() {
    const t = this.settings.touch || 'auto';
    if (t === 'on') return true;
    if (t === 'off') return false;
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;
  }

  _syncTouchMode() {
    const on = this._touchEnabled();
    document.body.classList.toggle('touch-mode', on);
    const tc = $('touch-controls');
    const hud = $('hud');
    const visible = on && this.mode !== 'attract' && hud && !hud.classList.contains('hidden');
    if (tc) {
      tc.classList.toggle('hidden', !visible);
      tc.style.setProperty('--touch-scale', ((this.settings.touchScale ?? 100) / 100).toString());
    }
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this._applyRenderScale();
    // Re-evaluate touch layout on rotation and responsive resizes.
    this._syncTouchMode();
  }

  showHUD() {
    $('hud').classList.remove('hidden');
    this._syncTouchMode();
    if (this._touchHint) this._touchHint.classList.remove('hide');
    this._updateCharHUD();
    this._updateMoneyHUD();
  }

  hideHUD() {
    $('hud').classList.add('hidden');
    $('touch-controls').classList.add('hidden');
  }

  notify(title, text, type = '') {
    const layer = $('toast-layer');
    if (!layer) return;
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = `<div><b>${title}</b>${text}</div>`;
    layer.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 4200);
    while (layer.children.length > 5) layer.firstChild.remove();
  }

  _showTutorial() {
    if (this.mode === 'attract') return;
    const grid = document.querySelector('#tutorial .tut-grid');
    if (grid) {
      if (this._touchEnabled()) {
        grid.innerHTML = `
          <div><kbd>◀</kbd><b>Mover</b><small>Joystick virtual</small></div>
          <div><kbd>○</kbd><b>Interagir</b><small>Veículos e pessoas</small></div>
          <div><kbd>L2 + R2</kbd><b>Mirar &amp; atirar</b><small>Segure R2 para atirar</small></div>
          <div><kbd>▭</kbd><b>Mapa</b><small>Touchpad / D-pad</small></div>`;
      } else {
        grid.innerHTML = `
          <div><kbd>WASD</kbd><b>Mover</b><small>Shift para correr</small></div>
          <div><kbd>E</kbd><b>Interagir</b><small>Entrar em veículos, falar</small></div>
          <div><kbd>BOTÃO DIR.</kbd><b>Mirar &amp; atirar</b><small>Clique para disparar</small></div>
          <div><kbd>M</kbd><b>Mapa completo</b><small>Missões e distritos</small></div>`;
      }
    }
    $('tutorial').classList.remove('hidden');
  }

  _autosave() {
    if (!this.player || this.mode === 'attract') return;
    this.lastSaveAt = nowSec();
    const state = this.getSaveState();
    if (this.callbacks.onSave) this.callbacks.onSave(state);
  }

  getSaveState() {
    const p = this.player;
    return {
      version: 1, mode: this.mode, char: p ? p.charId : 'luiza',
      x: p ? p.pos.x : LANDMARKS.spawn.x, z: p ? p.pos.z : LANDMARKS.spawn.z,
      yaw: p ? p.yaw : Math.PI / 2, money: p ? p.money : 2450,
      armor: p ? p.armor : 40, completed: [...this.completed],
      rp: this.rp || this.save.rp || { rep: 0, done: 0 },
      clock: this.clockMinutes, playtime: this.playtime,
      waypoint: this.waypoint || null,
      updated: Date.now()
    };
  }

  /* ============================================================
     INPUT
     ============================================================ */
  _bindInput() {
    const isField = (t) => {
      const tag = (t && t.tagName ? t.tagName : '').toLowerCase();
      return tag === 'input' || tag === 'select' || tag === 'textarea';
    };

    window.addEventListener('keydown', (e) => {
      if (isField(e.target)) return;
      this.keys[e.code] = true;
      if (e.code === 'Escape') {
        if (this.dialogueActive) return;
        if (this.mapOpen) { this.closeMap(); e.preventDefault(); return; }
        if (this.resultOpen) return;
        if (this.paused) this.togglePause(false);
        else if (this.mode !== 'attract') this.togglePause(true);
        e.preventDefault();
        return;
      }
      if (this.mode === 'attract') return;
      if (this.dialogueActive) {
        if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          this._advanceDialogue();
        }
        return;
      }
      if (this.mapOpen) {
        if (e.code === 'KeyM') this.closeMap();
        return;
      }
      if (this.resultOpen) return;
      if (e.code === 'KeyM') { this.openMap(); e.preventDefault(); return; }
      if (e.code === 'Tab') { e.preventDefault(); this.openSwitch(); return; }
      if (this.paused) return;
      if (this.cutscene) return;
      if (e.code === 'KeyE') this._interact();
      if (e.code === 'KeyF') this._melee();
      if (e.code === 'Space') { e.preventDefault(); this._jump(); }
      if (e.code === 'KeyR') this._reload();
      if (e.code === 'KeyH' && this.player && this.player.inVehicle) this.audio.play('horn');
      if (e.code === 'Digit1' || e.code === 'Digit2') this._switchTo(e.code === 'Digit1' ? 'luiza' : 'carlos');
      if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)) e.preventDefault();
    }, { passive: false });

    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => {
      this.keys = {};
      this.input.joyX = 0; this.input.joyY = 0;
      this.input.brake = false; this.input.throttle = false; this.input.handbrake = false; this.input.boost = false;
    });

    const canvas = this.canvas;
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('mousedown', (e) => {
      if (this.mode === 'attract' || this.paused || this.mapOpen || this.resultOpen) return;
      if (e.button === 2) {
        this.input.aim = true;
        this._requestLock();
        e.preventDefault();
        return;
      }
      if (e.button === 0) {
        if (document.pointerLockElement === canvas) this._shoot();
        else if (this._touchEnabled()) this._shoot();
        else this._requestLock();
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) this.input.aim = false;
    });
    window.addEventListener('mousemove', (e) => {
      if (this.mode === 'attract' || this.paused || this.mapOpen) return;
      const locked = document.pointerLockElement === canvas;
      if (!locked && !this.mouse.right) return;
      // Chromium can emit one synthetic mousemove with a huge delta when the
      // pointer lock engages (movement = -cursor position). Ignore that frame
      // and clamp outliers so the camera never snaps on lock.
      if (performance.now() < (this._lockGrace || 0)) return;
      const rawX = e.movementX || 0, rawY = e.movementY || 0;
      // A single real mouse event should never jump hundreds of pixels.
      // This rejects the synthetic pointer-lock event on every browser.
      if (Math.abs(rawX) > 180 || Math.abs(rawY) > 180) return;
      const sens = (this.settings.sens ?? 100) / 100 * 0.0024;
      const mx = clamp(rawX, -90, 90);
      const my = clamp(rawY, -90, 90);
      this._camYaw -= mx * sens;
      this._camPitch = clamp(this._camPitch + my * sens * (this.settings.invert ? -1 : 1), -0.42, 1.02);
      this._lastLookAt = performance.now();
    });
    canvas.addEventListener('wheel', (e) => {
      if (this.mode === 'attract' || this.paused) return;
      this._camDist = clamp(this._camDist + Math.sign(e.deltaY) * 0.45, 2.6, 10.5);
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === canvas) {
        // Give the browser a beat to flush its synthetic lock event.
        this._lockGrace = performance.now() + 320;
      } else this.input.aim = false;
    });
    document.addEventListener('mousedown', (e) => { if (e.button === 2) this.mouse.right = true; });
    document.addEventListener('mouseup', (e) => { if (e.button === 2) this.mouse.right = false; });

    this._bindTouch();
  }

  _requestLock() {
    if (this._touchEnabled()) return;
    try {
      if (document.pointerLockElement !== this.canvas) {
        const p = this.canvas.requestPointerLock();
        if (p && p.catch) p.catch(() => {});
      }
    } catch (_) {}
  }

  _bindTouch() {
    const joy = $('joystick');
    const knob = $('stick-knob');
    if (joy) {
      const move = (e) => {
        if (this.touch.joyId !== e.pointerId) return;
        const r = joy.getBoundingClientRect();
        let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        const len = Math.hypot(dx, dy);
        if (len > 1) { dx /= len; dy /= len; }
        this.input.joyX = dx; this.input.joyY = dy;
        if (knob) knob.style.transform = `translate(${dx * 28}px,${dy * 28}px)`;
      };
      joy.addEventListener('pointerdown', (e) => {
        this.touch.joyId = e.pointerId;
        try { joy.setPointerCapture(e.pointerId); } catch (_) {}
        move(e);
      });
      joy.addEventListener('pointermove', move);
      const end = (e) => {
        if (this.touch.joyId !== e.pointerId) return;
        this.touch.joyId = null; this.input.joyX = 0; this.input.joyY = 0;
        if (knob) knob.style.transform = 'translate(0,0)';
      };
      joy.addEventListener('pointerup', end);
      joy.addEventListener('pointercancel', end);
    }

    // Look area: right side of the screen
    this.canvas.addEventListener('pointerdown', (e) => {
      if (!this._touchEnabled() || this.mode === 'attract' || this.paused || this.mapOpen) return;
      if (e.pointerType === 'mouse') return;
      if (e.clientX < window.innerWidth * 0.42) return;
      if (this._touchHint) this._touchHint.classList.add('hide');
      this.touch.lookId = e.pointerId;
      this.touch.lastX = e.clientX; this.touch.lastY = e.clientY;
      try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (this.touch.lookId !== e.pointerId) return;
      const dx = e.clientX - this.touch.lastX;
      const dy = e.clientY - this.touch.lastY;
      this.touch.lastX = e.clientX; this.touch.lastY = e.clientY;
      const sens = (this.settings.sens ?? 100) / 100 * 0.006;
      this._camYaw -= dx * sens;
      this._camPitch = clamp(this._camPitch + dy * sens * (this.settings.invert ? -1 : 1), -0.42, 1.02);
    });
    const endLook = (e) => { if (this.touch.lookId === e.pointerId) this.touch.lookId = null; };
    this.canvas.addEventListener('pointerup', endLook);
    this.canvas.addEventListener('pointercancel', endLook);

    document.querySelectorAll('[data-touch]').forEach((btn) => {
      const action = btn.dataset.touch;
      const stopFire = () => {
        if (this._touchFireTimer) { clearInterval(this._touchFireTimer); this._touchFireTimer = null; }
      };
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        try { btn.setPointerCapture(e.pointerId); } catch (_) {}
        btn.classList.add('pressed');
        if (this.paused || this.dialogueActive) return;
        const p = this.player;
        const driving = !!(p && p.inVehicle);
        if (action === 'aim') {
          if (driving) { this.input.brake = true; this._haptic(8); return; }
          this.input.aim = true; this._haptic(8); return;
        }
        if (action === 'shoot') {
          if (driving) { this.input.throttle = true; this._haptic(10); return; }
          this.input.aim = true;
          this._shoot();
          this._haptic(14);
          stopFire();
          const rate = Math.max(90, (this.player?.weapon?.fireRate || 0.26) * 1000);
          this._touchFireTimer = setInterval(() => {
            if (!this.paused && !this.dialogueActive && this.mode !== 'attract') this._shoot();
          }, rate);
          return;
        }
        if (action === 'sprint') {
          if (driving) { this.input.boost = true; this._haptic(10); return; }
          this.input.sprint = true; this._haptic(6); return;
        }
        if (action === 'dodge') {
          if (driving) this.input.lookBack = true;
          else this._dodge();
          this._haptic(8);
          return;
        }
        if (action === 'interact') { this._interact(); this._haptic(8); }
        if (action === 'melee') {
          if (driving) { this.audio.play('horn'); this._haptic(10); return; }
          this._melee(); this._haptic(12);
        }
        if (action === 'jump') {
          if (driving) { this.input.handbrake = true; this._haptic(8); return; }
          this._jump(); this._haptic(8);
        }
        if (action === 'switch') { this.openSwitch(); this._haptic(8); }
        if (action === 'l3') { this._shoulderSwap(); this._haptic(6); return; }
        if (action === 'r3') { this._resetCamera(); this._haptic(6); return; }
        if (action === 'dpad-up') { this._quickMissions(); this._haptic(8); return; }
        if (action === 'dpad-down') {
          if (driving) this.audio.play('horn');
          else this._reload();
          this._haptic(8);
          return;
        }
        if (action === 'dpad-left') { this._switchTo('luiza'); this._haptic(8); return; }
        if (action === 'dpad-right') { this._switchTo('carlos'); this._haptic(8); return; }
        if (action === 'dpad-center') { this.openMap(); this._haptic(8); return; }
        if (action === 'create') { this._toggleTutorial(); this._haptic(6); return; }
        if (action === 'options') { this._openSettings(); this._haptic(6); return; }
        if (action === 'ps') { this.togglePause(true); this._haptic(8); return; }
      });
      const release = () => {
        btn.classList.remove('pressed');
        if (action === 'aim') { this.input.aim = false; this.input.brake = false; }
        if (action === 'shoot') { stopFire(); this.input.aim = false; this.input.throttle = false; }
        if (action === 'sprint') { this.input.sprint = false; this.input.boost = false; }
        if (action === 'jump') this.input.handbrake = false;
        if (action === 'dodge') this.input.lookBack = false;
      };
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('lostpointercapture', release);
    });
    // Mobile HUD quick actions.
    const mhReload = $('mh-reload');
    if (mhReload) mhReload.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (this.paused || this.dialogueActive) return;
      this._reload(); this._haptic(8);
    });
    const mhHorn = $('mh-horn');
    if (mhHorn) mhHorn.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (this.paused || this.dialogueActive) return;
      this.audio.play('horn'); this._haptic(10);
    });

    this._updateTouchLabels();
    this._touchHint = $('touch-look-hint');
  }

  _updateTouchLabels() {
    const driving = !!(this.player && this.player.inVehicle);
    const tc = $('touch-controls');
    if (tc) tc.classList.toggle('vehicle-mode', driving);
    document.querySelectorAll('[data-touch]').forEach((btn) => {
      const small = btn.querySelector('small');
      if (!small) return;
      const label = driving ? btn.dataset.labelVehicle : btn.dataset.label;
      if (label) small.textContent = label;
    });
  }

  _haptic(ms = 10) {
    if (this.settings.vibration === false) return;
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (_) {}
  }

  /* ============================================================
     UI BINDING (in-game overlays)
     ============================================================ */
  _bindUI() {
    const dlgNext = $('dlg-next');
    if (dlgNext) dlgNext.addEventListener('click', () => this._advanceDialogue());

    const expand = $('btn-expand-map');
    if (expand) expand.addEventListener('click', () => this.openMap());
    const tMap = $('tbtn-map');
    if (tMap) tMap.addEventListener('click', () => this.openMap());

    const zoomIn = $('map-zoom-in'), zoomOut = $('map-zoom-out');
    if (zoomIn) zoomIn.addEventListener('click', () => this._zoomMap(1.25));
    if (zoomOut) zoomOut.addEventListener('click', () => this._zoomMap(0.8));

    document.querySelectorAll('[data-district]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const d = DISTRICTS.find(x => x.id === btn.dataset.district);
        if (d) { this.mapView.x = d.x; this.mapView.z = d.z; this.drawFullMap(); }
      });
    });

    const mapWrap = document.querySelector('.map-canvas-wrap');
    if (mapWrap) {
      mapWrap.addEventListener('pointerdown', (e) => {
        if (!this.mapOpen) return;
        this.touch.mapId = e.pointerId; this.touch.mapX = e.clientX; this.touch.mapY = e.clientY;
        this.touch.mapMoved = 0;
        try { mapWrap.setPointerCapture(e.pointerId); } catch (_) {}
      });
      mapWrap.addEventListener('pointermove', (e) => {
        if (this.touch.mapId !== e.pointerId || !this.mapOpen) return;
        const dx = e.clientX - this.touch.mapX, dy = e.clientY - this.touch.mapY;
        this.touch.mapMoved = (this.touch.mapMoved || 0) + Math.abs(dx) + Math.abs(dy);
        this.touch.mapX = e.clientX; this.touch.mapY = e.clientY;
        const scale = 2000 / (this.mapView.zoom * 1200);
        this.mapView.x -= dx * scale;
        this.mapView.z -= dy * scale;
        this.mapView.x = clamp(this.mapView.x, -1000, 1000);
        this.mapView.z = clamp(this.mapView.z, -1000, 1000);
        this.drawFullMap();
      });
      mapWrap.addEventListener('pointerup', (e) => {
        if (this.touch.mapId !== e.pointerId) return;
        this.touch.mapId = null;
        if ((this.touch.mapMoved || 0) < 7) this._setWaypointFromScreen(e.clientX, e.clientY);
      });
      mapWrap.addEventListener('pointercancel', () => { this.touch.mapId = null; });
      mapWrap.addEventListener('wheel', (e) => {
        if (!this.mapOpen) return;
        e.preventDefault();
        this._zoomMap(e.deltaY < 0 ? 1.12 : 0.89);
      }, { passive: false });
    }

    const wpClear = $('map-wp-clear');
    if (wpClear) wpClear.addEventListener('click', () => this._clearWaypoint());
    const mapTouchClear = $('map-touch-clear');
    if (mapTouchClear) mapTouchClear.addEventListener('click', () => this._clearWaypoint());
    const mapTouchIn = $('map-touch-in');
    if (mapTouchIn) mapTouchIn.addEventListener('click', () => this._zoomMap(1.25));
    const mapTouchOut = $('map-touch-out');
    if (mapTouchOut) mapTouchOut.addEventListener('click', () => this._zoomMap(0.8));
    const mapTouchClose = $('map-touch-close');
    if (mapTouchClose) mapTouchClose.addEventListener('click', () => this.closeMap());

    document.querySelectorAll('.switch-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.char;
        this._switchTo(id);
        this.closeOverlay('switch-overlay');
      });
    });
    const swNote = $('switch-note');
    if (swNote) swNote.addEventListener('click', () => this.closeOverlay('switch-overlay'));

    const tutClose = $('tut-close');
    const tutStart = $('tut-start');
    if (tutClose) tutClose.addEventListener('click', () => $('tutorial').classList.add('hidden'));
    if (tutStart) tutStart.addEventListener('click', () => {
      $('tutorial').classList.add('hidden');
      this._requestLock();
    });

    this.mapView = { x: 0, z: 0, zoom: 1 };
  }

  /* ============================================================
     MAIN LOOP
     ============================================================ */
  _loop(t) {
    requestAnimationFrame((tt) => this._loop(tt));
    const dtRaw = (t - this._last) / 1000;
    this._last = t;
    const dt = clamp(dtRaw || 0.016, 0.0001, 0.05);
    this.frameCount++;
    this._fpsAccum += dtRaw; this._fpsFrames++;
    if (this._fpsAccum > 0.5) {
      this.fps = this._fpsFrames / this._fpsAccum;
      this._fpsAccum = 0; this._fpsFrames = 0;
      const fc = $('fps-counter');
      if (fc) fc.textContent = Math.round(this.fps) + ' FPS';
      const pf = $('perf-fps'); if (pf) pf.textContent = Math.round(this.fps);
      this._autoQuality(dt);
    }

    if (this.mode === 'attract') {
      this._updateAttract(dt);
      this.world.update(dt, this.camera, null);
      this._updateEffects(dt);
      this.audio.update(dt, { music: true });
    } else if (!this.paused && !this.mapOpen && !this.resultOpen) {
      this._update(dt);
    } else {
      this.world.update(dt, this.camera, this.player ? this.player.pos : null);
      this._updateEffects(dt);
    }
    this.renderer.render(this.scene, this.camera);
  }

  _autoQuality(dt) {
    if (this.mode === 'attract') return;
    if (this.settings.autoQuality === false) return;
    if (this.fps < 38) {
      this._lowFpsTime += dt;
      if (this._lowFpsTime > 4 && (this.settings.resScale ?? 100) > 60) {
        this._lowFpsTime = 0;
        this.settings.resScale = Math.max(60, (this.settings.resScale ?? 100) - 10);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2) * this.settings.resScale / 100);
        const o = $('out-res'); if (o) o.textContent = this.settings.resScale + '%';
        const r = $('set-res'); if (r) r.value = this.settings.resScale;
      }
    } else if (this.fps > 57) {
      this._lowFpsTime = 0;
    }
  }

  _update(dt) {
    this._elapsed = (this._elapsed || 0) + dt;
    this.clockMinutes = (this.clockMinutes + dt * 0.32) % 1440;
    this.world.update(dt, this.camera, this.player ? this.player.pos : null);
    this._updatePlayer(dt);
    this._updateVehicles(dt);
    this._updateTraffic(dt);
    this._updatePoliceCars(dt);
    this.playtime = (this.playtime || 0) + dt;
    this._updateNPCs(dt);
    this._updateEnemies(dt);
    this._updatePolice(dt);
    this._updatePickups(dt);
    this._updateEffects(dt);
    this._updateMarkers(dt);
    this._updateMission(dt);
    this._updateRP(dt);
    this._updateWanted(dt);
    this._updateCamera(dt);
    this._updateHUD(dt);

    const p = this.player;
    const v = p && p.inVehicle;
    this.audio.update(dt, {
      driving: !!v, speed: v ? Math.abs(v.speed) : 0,
      siren: this.wanted > 0 ? Math.min(1, 0.3 + this.wanted * 0.13) : 0,
      music: true
    });

    if (this._elapsed - (this._lastSaveTick || 0) > 22) {
      this._lastSaveTick = this._elapsed;
      this._autosave();
    }
  }

  /* ============================================================
     CAMERA
     ============================================================ */
  _snapCamera() {
    if (!this.player) return;
    this._camYaw = this.player.inVehicle ? this.player.inVehicle.angle : this.player.yaw;
    this._camPitch = 0.2;
    this._camDist = this.player.inVehicle ? 8.2 : 6.6;
    this._updateCamera(0.016, true);
  }

  _updateCamera(dt, snap = false) {
    const p = this.player;
    if (!p) return;
    const v = p.inVehicle;
    const target = this._camTarget;
    let baseYaw = this._camYaw;

    if (v) {
      target.set(v.pos.x, v.pos.y + (v.isBoat ? 2.4 : 1.35), v.pos.z);
      if (!snap && performance.now() - (this._lastLookAt || 0) > 1400) {
        let diff = ((v.angle - this._camYaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        this._camYaw += diff * Math.min(1, dt * 2.1);
      }
      this._camDist += ((this._camDist < 4 ? 4 : 8.2) - this._camDist) * Math.min(1, dt * 2);
    } else {
      target.set(p.pos.x, p.pos.y + 1.5, p.pos.z);
      if (p.aim) this._camDist += (3.4 - this._camDist) * Math.min(1, dt * 6);
      else this._camDist += (6.6 - this._camDist) * Math.min(1, dt * 4);
    }
    if (this.input.aim) this._camDist += (3.2 - this._camDist) * Math.min(1, dt * 7);

    baseYaw = this._camYaw;
    if (this.input.lookBack && v) baseYaw += Math.PI;
    const fwd = this._camFwd.set(Math.sin(baseYaw), 0, Math.cos(baseYaw));
    const right = this._camRight.set(Math.cos(baseYaw), 0, -Math.sin(baseYaw));
    const horiz = Math.cos(this._camPitch) * this._camDist;
    const desired = this._camDesired.set(
      target.x - fwd.x * horiz,
      target.y + 0.55 + Math.sin(this._camPitch) * this._camDist,
      target.z - fwd.z * horiz
    );
    const aiming = !!(p.aim || this.input.aim);
    desired.addScaledVector(right, (aiming ? 0.95 : 0.72) * this._camSide);
    const safe = this.world.cameraCollision(target, desired);
    if (snap) this.camera.position.copy(safe);
    else this.camera.position.lerp(safe, Math.min(1, dt * 9));

    const look = this._camLook.copy(target).addScaledVector(right, (aiming ? 0.5 : 0.35) * this._camSide);
    if (aiming) { look.addScaledVector(fwd, 7); look.y += 0.18; }
    else look.addScaledVector(fwd, 2.1);

    if (this._camShake > 0.001) {
      this._camShake = Math.max(0, this._camShake - dt * 2.4);
      const s = this._camShake;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
      this.camera.position.z += (Math.random() - 0.5) * s;
    }
    this.camera.lookAt(look);
    if (Math.abs(this.camera.fov - 62) > 0.05) {
      this.camera.fov += (62 - this.camera.fov) * Math.min(1, dt * 4);
      this.camera.updateProjectionMatrix();
    }
  }

  /* ============================================================
     PLAYER
     ============================================================ */
  _jump() {
    const p = this.player;
    if (!p || p.inVehicle || !p.onGround || this.dialogueActive) return;
    p.vy = 4.7;
    p.onGround = false;
    this.audio.play('ui');
  }

  _dodge() {
    const p = this.player;
    if (!p || p.inVehicle || p.dead || this.dialogueActive) return;
    if ((p.dodgeCooldown || 0) > 0 || p.stamina < 10) return;
    const axes = this._moveAxes();
    let dx, dz;
    if (axes.len > 0.1) {
      const cy = this._camYaw;
      dx = Math.sin(cy) * axes.y + Math.cos(cy) * axes.x;
      dz = Math.cos(cy) * axes.y - Math.sin(cy) * axes.x;
      const len = Math.hypot(dx, dz) || 1;
      dx /= len; dz /= len;
    } else {
      dx = Math.sin(p.yaw); dz = Math.cos(p.yaw);
    }
    p.dodgeX = dx; p.dodgeZ = dz;
    p.dodgeTime = 0.3; p.dodgeCooldown = 0.9;
    p.stamina = Math.max(0, p.stamina - 10);
    this.audio.play('ui');
  }

  _shoulderSwap() {
    if (!this.player) return;
    this._camSide = this._camSide === 1 ? -1 : 1;
    this._lastLookAt = performance.now();
    this.audio.play('ui');
  }

  _resetCamera() {
    if (!this.player) return;
    this._camSide = 1;
    this._snapCamera();
    this.audio.play('ui');
  }

  _quickMissions() {
    if (this.mode === 'attract' || this.dialogueActive || this.mapOpen || this.resultOpen) return;
    if (!this.paused) this.togglePause(true);
    if (this.callbacks.onOpenMissions) this.callbacks.onOpenMissions();
  }

  _openSettings() {
    if (this.mode === 'attract' || this.dialogueActive || this.mapOpen || this.resultOpen) return;
    if (!this.paused) this.togglePause(true);
    if (this.callbacks.onOpenSettings) this.callbacks.onOpenSettings();
  }

  _toggleTutorial() {
    if (this.mode === 'attract') return;
    this._showTutorial();
  }

  _moveAxes() {
    let x = (this.keys.KeyD || this.keys.ArrowRight ? 1 : 0) - (this.keys.KeyA || this.keys.ArrowLeft ? 1 : 0);
    let y = (this.keys.KeyW || this.keys.ArrowUp ? 1 : 0) - (this.keys.KeyS || this.keys.ArrowDown ? 1 : 0);
    x += this.input.joyX;
    y -= this.input.joyY;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y, len: Math.min(1, len) };
  }

  _updatePlayer(dt) {
    const p = this.player;
    if (!p) return;
    p.fireCooldown = Math.max(0, p.fireCooldown - dt);
    p.meleeCooldown = Math.max(0, p.meleeCooldown - dt);
    p.meleeTime = Math.max(0, p.meleeTime - dt);
    p.interactCooldown = Math.max(0, p.interactCooldown - dt);
    p.dodgeCooldown = Math.max(0, (p.dodgeCooldown || 0) - dt);
    p.dodgeTime = Math.max(0, (p.dodgeTime || 0) - dt);
    if (p.reloading > 0) {
      p.reloading -= dt;
      if (p.reloading <= 0) {
        const need = p.weapon.magSize - p.weapon.mag;
        const take = Math.min(need, p.weapon.reserve);
        p.weapon.mag += take; p.weapon.reserve -= take;
      }
    }

    const blocked = this.dialogueActive || this.cutscene;
    if (p.dead) {
      p.deadTimer -= dt;
      if (p.deadTimer <= 0) this._respawn();
      p.model.group.visible = false;
      if (p.shadow) p.shadow.visible = false;
      return;
    }
    if (p.inVehicle) {
      p.model.group.visible = false;
      if (p.shadow) p.shadow.visible = false;
      p.pos.set(p.inVehicle.pos.x, p.inVehicle.pos.y, p.inVehicle.pos.z);
      p.yaw = p.inVehicle.angle;
      if (!blocked && (this.input.aim || this.mouse.right)) p.aim = true;
      return;
    }

    p.model.group.visible = true;
    if (p.shadow) p.shadow.visible = true;

    const axes = blocked ? { x: 0, y: 0, len: 0 } : this._moveAxes();
    const moving = axes.len > 0.05;
    const wantSprint = (this.keys.ShiftLeft || this.keys.ShiftRight || this.input.sprint) && moving && p.stamina > 2;
    p.sprinting = wantSprint;
    p.aim = !blocked && (this.input.aim || this.mouse.right);

    if (p.sprinting) p.stamina = Math.max(0, p.stamina - dt * 17);
    else p.stamina = Math.min(100, p.stamina + dt * (p.aim ? 6 : 12));

    const water = this.world.isWater(p.pos.x, p.pos.z) && !this._onDock(p.pos.x, p.pos.z);
    p.swimming = water;

    let speed = p.swimming ? 2.5 : p.aim ? 2.4 : p.sprinting ? 8.6 : 4.3;
    if (p.sprinting && p.stamina <= 0) speed = 4.0;

    let dx = 0, dz = 0;
    const dodging = p.dodgeTime > 0;
    if (dodging) {
      dx = p.dodgeX || Math.sin(p.yaw);
      dz = p.dodgeZ || Math.cos(p.yaw);
      speed = 12.5;
      p.yaw = Math.atan2(dx, dz);
    } else if (moving) {
      const cy = this._camYaw;
      const fx = Math.sin(cy), fz = Math.cos(cy);
      const rx = Math.cos(cy), rz = -Math.sin(cy);
      dx = fx * axes.y + rx * axes.x;
      dz = fz * axes.y + rz * axes.x;
      const l = Math.hypot(dx, dz) || 1;
      dx /= l; dz /= l;
      const targetYaw = Math.atan2(dx, dz);
      if (p.aim) p.yaw = this._camYaw;
      else {
        let diff = ((targetYaw - p.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        p.yaw += diff * Math.min(1, dt * 13);
      }
    } else if (p.aim) {
      p.yaw = this._camYaw;
    }

    const nx = p.pos.x + dx * speed * dt;
    const nz = p.pos.z + dz * speed * dt;
    const res = this.world.resolveCircle(nx, nz, 0.44);
    p.pos.x = res.x; p.pos.z = res.z;

    const gh = this.world.groundHeight(p.pos.x, p.pos.z);
    if (water) {
      const targetY = WATER_LEVEL - 0.72;
      p.pos.y += (targetY - p.pos.y) * Math.min(1, dt * 6);
      p.vy = 0; p.onGround = true;
      if ((moving || dodging) && Math.random() < dt * 6) this.audio.play('splash');
    } else {
      if (!p.onGround) {
        p.vy -= 17 * dt;
        p.pos.y += p.vy * dt;
        if (p.pos.y <= gh) { p.pos.y = gh; p.vy = 0; p.onGround = true; }
      } else {
        p.pos.y += (gh - p.pos.y) * Math.min(1, dt * 18);
        if (Math.abs(gh - p.pos.y) < 0.01) p.pos.y = gh;
      }
    }

    p.model.group.position.set(p.pos.x, p.pos.y, p.pos.z);
    p.model.group.rotation.y = p.yaw;
    if (p.shadow) p.shadow.position.set(p.pos.x, Math.max(0.02, gh + 0.02), p.pos.z);
    const animState = p.meleeTime > 0 ? 'shoot' : p.aim ? 'aim' : 'idle';
    p.model.update(dt, moving || dodging ? speed : 0, animState);
    if (p.aim && p.model.parts.armR) p.model.parts.armR.rotation.x = -1.5;

    // Auto interaction prompts
    this._updateInteractPrompt();

    if (p.aim && this.mouse.down && p.fireCooldown <= 0) this._shoot();
    if (this.input.shoot && p.fireCooldown <= 0) this._shoot();

    if (p.health < 100 && this._elapsed - p.lastDamage > 9) p.health = Math.min(100, p.health + dt * 2.2);
  }

  _onDock(x, z) {
    for (const d of this.world.docks) if (x > d.x1 && x < d.x2 && z > d.z1 && z < d.z2) return true;
    return false;
  }

  _updateInteractPrompt() {
    const p = this.player;
    if (!p) return;
    const prompt = $('interact-prompt');
    const txt = $('interact-text');
    if (!prompt || !txt) return;
    if (this.dialogueActive || this.paused || p.dead) { prompt.classList.add('hidden'); return; }
    const key = prompt.querySelector('.key');
    if (key) key.textContent = this._touchEnabled() ? '○' : 'E';
    let text = '';
    if (p.inVehicle) text = p.inVehicle.isBoat ? 'Sair do barco' : 'Sair do veículo';
    else {
      const nearMission = this._nearestMissionMarker(5.2);
      const nearRP = dist2(p.pos, LANDMARKS.rpBoard) < 5.5;
      const nearVeh = this._nearestVehicle(4.2);
      const nearNpc = this._nearestNpc(3.4);
      if (nearMission) text = 'Iniciar ' + nearMission.title;
      else if (nearRP) text = 'Ver trabalhos de Roleplay';
      else if (nearVeh) text = 'Entrar no ' + (nearVeh.isBoat ? 'barco' : nearVeh.name);
      else if (nearNpc) text = 'Conversar';
      else if (dist2(p.pos, LANDMARKS.garage) < 6) text = 'Reparar veículo';
      else if (dist2(p.pos, LANDMARKS.safehouse) < 6) text = 'Salvar na Casa da Orla';
    }
    if (text) { txt.textContent = text; prompt.classList.remove('hidden'); }
    else prompt.classList.add('hidden');
  }

  _nearestVehicle(radius) {
    const p = this.player;
    if (!p) return null;
    let best = null, bd = radius;
    for (const v of this.vehicles) {
      if (v.destroyed || v === p.inVehicle) continue;
      const d = dist2(p.pos, v.pos);
      if (d < bd) { bd = d; best = v; }
    }
    return best;
  }

  _nearestNpc(radius) {
    const p = this.player;
    if (!p) return null;
    let best = null, bd = radius;
    for (const n of this.npcs) {
      if (n.dead) continue;
      const d = dist2(p.pos, n.pos);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  _nearestMissionMarker(radius) {
    const p = this.player;
    if (!p) return null;
    for (const m of this.markers) {
      if (m.userData.kind !== 'mission' || !m.userData.missionId) continue;
      if (dist2(p.pos, m.position) < radius) {
        return MISSIONS.find(x => x.id === m.userData.missionId) || null;
      }
    }
    return null;
  }

  _interact() {
    const p = this.player;
    if (!p || this.dialogueActive || p.dead) return;
    if (p.interactCooldown > 0) return;
    p.interactCooldown = 0.3;
    if (p.inVehicle) { this._exitVehicle(); return; }

    const nearMission = this._nearestMissionMarker(5.2);
    if (nearMission) { this.startMissionById(nearMission.id); return; }
    if (dist2(p.pos, LANDMARKS.rpBoard) < 5.5) {
      if (this.callbacks.onOpenRP) this.callbacks.onOpenRP();
      return;
    }
    if (dist2(p.pos, LANDMARKS.garage) < 6) {
      const v = this._nearestVehicle(8);
      if (v) { v.health = v.maxHealth; this.notify('GARAGEM CENTRAL', 'Veículo reparado.', 'good'); this.audio.play('checkpoint'); }
      else this.notify('GARAGEM CENTRAL', 'Nenhum veículo por perto.', '');
      return;
    }
    if (dist2(p.pos, LANDMARKS.safehouse) < 6) {
      this.saveGame();
      return;
    }
    const veh = this._nearestVehicle(4.2);
    if (veh) { this._enterVehicle(veh); return; }
    const npc = this._nearestNpc(3.4);
    if (npc) {
      const line = NPC_LINES[npc.line % NPC_LINES.length];
      this.showSubtitle('MORADOR', line.pt, line.en, 4);
      npc.talkCooldown = 8;
      this.audio.play('ui');
    }
  }

  _enterVehicle(v) {
    const p = this.player;
    if (!p || v.destroyed) return;
    if (v.isBoat && !this.world.isWater(v.pos.x, v.pos.z)) {
      this.notify('BARCO ENCALHADO', 'Este barco precisa de água para navegar.', 'bad');
      return;
    }
    if (v.driver === 'ai' || v.driver === 'police' || v.driver === 'target') {
      if (v.driver === 'police') { this.addWanted(1); this.notify('POLÍCIA', 'Você roubou uma viatura!', 'bad'); }
      v.driver = 'player';
    }
    p.inVehicle = v;
    v.occupiedBy = 'player';
    v.driver = 'player';
    this.input.brake = false;
    this.input.throttle = false;
    this.input.handbrake = false;
    this.input.boost = false;
    this.input.aim = false;
    this.input.lookBack = false;
    this._updateTouchLabels();
    const ip = $('interact-prompt'); if (ip) ip.classList.add('hidden');
    p.model.group.visible = false;
    if (p.shadow) p.shadow.visible = false;
    this._snapCamera();
    this.audio.play(v.isBoat ? 'boat' : 'engine-start');
    this.notify(v.isBoat ? 'BARCO' : 'VEÍCULO', v.name + ' pronto para partir.', 'good');
    const speedo = $('speedo'); if (speedo) speedo.classList.remove('hidden');
    const vn = $('vehicle-name'); if (vn) vn.textContent = v.name;
    this._updateMissionVehicle();
  }

  _exitVehicle() {
    const p = this.player;
    if (!p || !p.inVehicle) return;
    const v = p.inVehicle;
    v.driver = null; v.occupiedBy = null;
    v.speed = 0;
    p.inVehicle = null;
    this.input.brake = false;
    this.input.throttle = false;
    this.input.handbrake = false;
    this.input.boost = false;
    this.input.aim = false;
    this.input.lookBack = false;
    this._updateTouchLabels();
    const side = new THREE.Vector3(Math.cos(v.angle), 0, -Math.sin(v.angle)).multiplyScalar(2.4);
    let x = v.pos.x + side.x, z = v.pos.z + side.z;
    if (this.world.isWater(x, z) && !v.isBoat) { x = v.pos.x - side.x; z = v.pos.z - side.z; }
    if (v.isBoat) {
      // step onto nearest dock if possible
      const dock = this.world.docks.find(d => x > d.x1 - 2 && x < d.x2 + 2 && z > d.z1 - 2 && z < d.z2 + 2);
      if (!dock) { this.notify('MAR ABERTO', 'Nade até a costa ou volte ao barco.', 'bad'); }
    }
    p.pos.set(x, this.world.groundHeight(x, z), z);
    p.model.group.visible = true;
    if (p.shadow) p.shadow.visible = true;
    const speedo = $('speedo'); if (speedo) speedo.classList.add('hidden');
    this._snapCamera();
    this.audio.play('enter');
  }

  /* ============================================================
     COMBAT
     ============================================================ */
  _reload() {
    const p = this.player;
    if (!p || p.inVehicle || p.reloading > 0) return;
    if (p.weapon.mag >= p.weapon.magSize || p.weapon.reserve <= 0) return;
    p.reloading = p.weapon.reloadTime;
    this.audio.play('reload');
  }

  _melee() {
    const p = this.player;
    if (!p || p.inVehicle || p.meleeCooldown > 0 || this.dialogueActive) return;
    p.meleeCooldown = 0.55;
    p.meleeTime = 0.22;
    this.audio.play('punch');
    this._camShake = Math.max(this._camShake, 0.06);
    const fwd = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
    let hit = false;
    for (const e of [...this.enemies, ...this.cops]) {
      if (e.dead) continue;
      const to = new THREE.Vector3().subVectors(e.pos, p.pos);
      const d = to.length();
      if (d < 2.5 && to.normalize().dot(fwd) > 0.35) {
        this._damageEnemy(e, 34, 'melee');
        hit = true;
      }
    }
    if (hit) { this.audio.play('hit'); this._hitmarker(); }
  }

  _shoot() {
    const p = this.player;
    if (!p || p.inVehicle || this.dialogueActive || p.dead) return;
    if (p.fireCooldown > 0 || p.reloading > 0) return;
    if (p.weapon.mag <= 0) { this.audio.play('reload'); this._reload(); return; }
    p.weapon.mag--;
    p.fireCooldown = p.weapon.fireRate;
    p.shots++;
    this.audio.play('gun');
    this._camShake = Math.max(this._camShake, 0.07);
    if (p.model.parts.gun) {
      p.model.parts.gun.visible = true;
      if (p.model.parts.armR) p.model.parts.armR.rotation.x = -1.62;
    }

    const origin = new THREE.Vector3(p.pos.x, p.pos.y + 1.45, p.pos.z);
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const assist = this.settings.aimassist === 'off' ? 0.985 : this.settings.aimassist === 'low' ? 0.955 : 0.91;
    let best = null, bestScore = Infinity;
    const consider = (e) => {
      if (e.dead) return;
      const to = new THREE.Vector3().subVectors(e.pos, origin);
      const d = to.length();
      if (d > 65 || d < 0.5) return;
      to.normalize();
      const dot = to.dot(dir);
      if (dot < assist) return;
      const score = d * (1.25 - dot);
      if (score < bestScore) { bestScore = score; best = e; }
    };
    for (const e of this.enemies) consider(e);
    for (const c of this.cops) consider(c);

    const hitPoint = new THREE.Vector3();
    if (best) {
      hitPoint.copy(best.pos).add(new THREE.Vector3(0, 1.1, 0));
      const dmg = p.weapon.damage * (best.type === 'cop' ? 1 : 1);
      this._damageEnemy(best, dmg, 'gun');
      p.hits++;
      this._hitmarker();
      this.audio.play('hit');
      if (best.type === 'cop') this.addWanted(2);
      else if (this.wanted > 0) this.addWanted(0.5);
    } else {
      hitPoint.copy(origin).addScaledVector(dir, 55);
      if (this.wanted === 0 && this.mode !== 'attract' && Math.random() < 0.5) this.addWanted(1);
    }
    this._spawnTracer(origin, hitPoint, 0xffe0a0);
    this._spawnMuzzle(origin, dir);
    this._updateHUD(0.016);
  }

  _damageEnemy(e, dmg, source) {
    if (e.dead) return;
    e.health -= dmg;
    if (e.model) e.model.flash();
    if (e.health <= 0) {
      e.dead = true;
      e.deadTimer = 1.1;
      if (e.model && e.model.group) {
        e.model.group.rotation.z = Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);
        e.model.group.position.y = 0.2;
      }
      if (this.player) this.player.kills++;
      if (this.mission) this.mission.stats.kills++;
      if (e.type === 'cop') { this.addWanted(2); this.notify('POLÍCIA', 'Agente abatido. A resposta será pesada.', 'bad'); }
      this._spawnBlood(e.pos);
      this.audio.play('hit');
    }
  }

  _damagePlayer(amount, source = '') {
    const p = this.player;
    if (!p || p.dead) return;
    let dmg = amount;
    if (p.armor > 0) {
      const absorbed = Math.min(p.armor, dmg * 0.6);
      p.armor -= absorbed; dmg -= absorbed;
    }
    p.health = Math.max(0, p.health - dmg);
    p.lastDamage = this._elapsed || 0;
    this._flashDamage = 0.55;
    this._camShake = Math.max(this._camShake, 0.16);
    this.audio.play('hurt');
    if (p.health <= 0) this._playerDied(source);
  }

  _playerDied(source) {
    const p = this.player;
    if (!p || p.dead) return;
    p.dead = true;
    p.deadTimer = 2.8;
    this.audio.play('fail');
    if (p.inVehicle) { p.inVehicle.driver = null; p.inVehicle = null; }
    const speedo = $('speedo'); if (speedo) speedo.classList.add('hidden');
    if (this.mission) this._failMission('Você foi nocauteado.');
    else this.notify('WASTED', 'Você apagou. A cidade não espera ninguém.', 'bad');
    this._hideCrosshair();
  }

  _respawn() {
    const p = this.player;
    if (!p) return;
    p.dead = false;
    p.health = 100;
    p.armor = 0;
    p.money = Math.max(0, Math.floor(p.money * 0.9));
    p.pos.set(LANDMARKS.hospital.x, 0, LANDMARKS.hospital.z);
    p.vy = 0; p.onGround = true;
    p.model.group.visible = true;
    if (p.shadow) p.shadow.visible = true;
    this.setWanted(0, true);
    this._placePlayer();
    this._snapCamera();
    this.notify('HOSPITAL MARÉ', 'Você acordou. Perdeu 10% do dinheiro.', 'bad');
    this._autosave();
  }

  _spawnEnemy(x, z, opts = {}) {
    const model = new CharacterModel('npc', { gang: true, color: opts.color || 0x2a2c30 });
    model.group.position.set(x, 0, z);
    model.setGun(true);
    this.scene.add(model.group);
    const e = {
      type: opts.type || 'gang', model, pos: new THREE.Vector3(x, 0, z),
      health: opts.health || 62, maxHealth: opts.health || 62, dead: false, deadTimer: 0,
      fireTimer: rand(0.6, 1.6), speed: opts.speed || 3.6, yaw: 0, mission: !!opts.mission,
      home: new THREE.Vector3(x, 0, z), wave: opts.wave || 0
    };
    this.enemies.push(e);
    return e;
  }

  _spawnCop(x, z, opts = {}) {
    const model = new CharacterModel('npc', { cop: true });
    model.group.position.set(x, 0, z);
    model.setGun(true);
    this.scene.add(model.group);
    const c = {
      type: 'cop', model, pos: new THREE.Vector3(x, 0, z), health: 70, maxHealth: 70,
      dead: false, deadTimer: 0, fireTimer: rand(0.5, 1.4), speed: 3.9, yaw: 0
    };
    this.cops.push(c);
    return c;
  }

  _updateEnemies(dt) {
    const p = this.player;
    if (!p) return;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) {
        e.deadTimer -= dt;
        if (e.deadTimer <= 0) {
          this.scene.remove(e.model.group);
          e.model.dispose();
          this.enemies.splice(i, 1);
        }
        continue;
      }
      const to = new THREE.Vector3().subVectors(p.pos, e.pos);
      const d = to.length();
      e.yaw = Math.atan2(to.x, to.z);
      e.model.group.rotation.y = e.yaw;
      const aggro = e.mission ? 70 : 42;
      if (d < aggro && d > 4.2) {
        to.normalize();
        const nx = e.pos.x + to.x * e.speed * dt;
        const nz = e.pos.z + to.z * e.speed * dt;
        const res = this.world.resolveCircle(nx, nz, 0.45);
        e.pos.x = res.x; e.pos.z = res.z;
      }
      e.model.group.position.set(e.pos.x, this.world.groundHeight(e.pos.x, e.pos.z), e.pos.z);
      e.model.update(dt, d < aggro ? e.speed : 0, 'aim');
      e.fireTimer -= dt;
      if (d < 34 && e.fireTimer <= 0 && !p.dead) {
        e.fireTimer = rand(1.0, 1.9);
        const origin = new THREE.Vector3(e.pos.x, e.pos.y + 1.4, e.pos.z);
        const target = new THREE.Vector3(p.pos.x, p.pos.y + 1.2, p.pos.z);
        this._spawnTracer(origin, target, 0xff9a66);
        this.audio.play('silenced');
        const chance = clamp(1 - d / 45, 0.18, 0.6);
        if (Math.random() < chance) this._damagePlayer(rand(4, 9), 'tiro');
      }
    }
  }

  _updatePolice(dt) {
    const p = this.player;
    if (!p) return;
    for (let i = this.cops.length - 1; i >= 0; i--) {
      const c = this.cops[i];
      if (c.dead) {
        c.deadTimer -= dt;
        if (c.deadTimer <= 0) {
          this.scene.remove(c.model.group); c.model.dispose(); this.cops.splice(i, 1);
        }
        continue;
      }
      const to = new THREE.Vector3().subVectors(p.pos, c.pos);
      const d = to.length();
      c.yaw = Math.atan2(to.x, to.z);
      c.model.group.rotation.y = c.yaw;
      if (d > 3.4) {
        to.normalize();
        const res = this.world.resolveCircle(c.pos.x + to.x * c.speed * dt, c.pos.z + to.z * c.speed * dt, 0.45);
        c.pos.x = res.x; c.pos.z = res.z;
      }
      c.model.group.position.set(c.pos.x, this.world.groundHeight(c.pos.x, c.pos.z), c.pos.z);
      c.model.update(dt, d > 3.4 ? c.speed : 0, 'aim');
      c.fireTimer -= dt;
      if (d < 30 && c.fireTimer <= 0 && !p.dead) {
        c.fireTimer = rand(0.9, 1.7);
        const origin = new THREE.Vector3(c.pos.x, c.pos.y + 1.4, c.pos.z);
        const target = new THREE.Vector3(p.pos.x, p.pos.y + 1.2, p.pos.z);
        this._spawnTracer(origin, target, 0x9fd8ff);
        this.audio.play('gun');
        if (Math.random() < clamp(0.7 - d / 55, 0.15, 0.6)) this._damagePlayer(rand(5, 10), 'polícia');
      }
    }
  }

  /* ============================================================
     VEHICLES
     ============================================================ */
  _updateVehicles(dt) {
    const p = this.player;
    for (const v of this.vehicles) {
      if (v.destroyed) continue;
      if (p && p.inVehicle === v) {
        this._drivePlayerVehicle(v, dt);
      } else if (v.driver === 'ai' || v.driver === 'target' || v.driver === 'police') {
        // handled in traffic / police update
      } else {
        v.speed *= Math.max(0, 1 - dt * 4);
        if (Math.abs(v.speed) < 0.05) v.speed = 0;
      }
      v.mesh.position.set(v.pos.x, v.isBoat ? v.pos.y : 0, v.pos.z);
      v.mesh.rotation.y = v.angle;
      if (v.wheels && v.wheels.length) {
        const wr = v.speed * dt * 2.2;
        for (const w of v.wheels) w.rotation.x += wr;
      }
      if (v.isPolice) {
        v.sirenPhase += dt * 8;
        const on = Math.sin(v.sirenPhase) > 0;
        if (v.lightRed) v.lightRed.material.emissiveIntensity = on ? 3 : 0.2;
        if (v.lightBlue) v.lightBlue.material.emissiveIntensity = on ? 0.2 : 3;
      }
    }
  }

  _drivePlayerVehicle(v, dt) {
    const axes = this._moveAxes();
    // Virtual pads expose dedicated accelerator/brake buttons; the left stick
    // still works as a full analogue throttle.
    const throttle = clamp(axes.y + (this.input.throttle ? 1 : 0), -1, 1);
    const steer = axes.x;
    const brake = this.keys.Space || this.input.brake || this.input.handbrake;
    const boost = this.input.boost ? 1.42 : 1;
    const max = v.maxSpeed * (this.input.boost ? 1.12 : 1);
    const accel = v.accel;

    if (this.dialogueActive || this.cutscene) { v.speed *= 0.96; return; }
    if (throttle > 0) v.speed += accel * throttle * boost * dt;
    else if (throttle < 0) {
      if (v.speed > 0.5) v.speed += accel * 1.6 * throttle * dt;
      else v.speed += accel * 0.55 * throttle * dt;
    }
    if (brake) v.speed *= Math.max(0, 1 - dt * 4.5);
    v.speed *= Math.max(0, 1 - dt * 0.55);
    v.speed = clamp(v.speed, -max * 0.34, max);
    if (Math.abs(v.speed) < 0.06 && throttle === 0) v.speed = 0;

    const steerPower = v.handling * clamp(Math.abs(v.speed) / 9, 0, 1) * (v.speed < 0 ? -1 : 1);
    v.angle -= steer * steerPower * dt * 1.5;

    const fx = Math.sin(v.angle), fz = Math.cos(v.angle);
    const nx = v.pos.x + fx * v.speed * dt;
    const nz = v.pos.z + fz * v.speed * dt;

    if (v.isBoat) {
      if (!this.world.isWater(nx, nz) && !this._onDock(nx, nz)) {
        v.speed *= -0.2;
      } else {
        v.pos.x = nx; v.pos.z = nz;
      }
      v.pos.y = WATER_LEVEL + 0.02 + Math.sin((this._elapsed || 0) * 2.2) * 0.05;
    } else {
      if (this.world.isWater(nx, nz) && !this._onDock(nx, nz)) {
        v.speed *= -0.3;
        this.notify('MOTOR AFOGADO', 'A água não é para este carro.', 'bad');
      } else {
        const res = this.world.resolveCircle(nx, nz, 1.65);
        if (res.hit) {
          if (Math.abs(v.speed) > 16) { this._camShake = Math.max(this._camShake, 0.18); this.audio.play('hit'); }
          v.speed *= -0.18;
        }
        v.pos.x = res.x; v.pos.z = res.z;
      }
      v.pos.y = this.world.groundHeight(v.pos.x, v.pos.z);
    }
    if (this._elapsed - (v._hornAt || 0) > 1) {
      const near = this.npcs.find(n => dist2(n.pos, v.pos) < 7);
      if (near && Math.abs(v.speed) > 8) {
        near.flee = 2.4;
        v._hornAt = this._elapsed;
      }
    }
  }

  _updateTraffic(dt) {
    const p = this.player;
    for (const v of this.traffic) {
      if (v.destroyed || v.driver !== 'ai' || !v.traffic) continue;
      const tr = v.traffic;
      if (tr.axis === 'x') {
        v.pos.z += tr.dir * tr.speed * dt;
        v.angle = tr.dir > 0 ? 0 : Math.PI;
        v.pos.x += (tr.road + tr.lane - v.pos.x) * Math.min(1, dt * 1.4);
        if (v.pos.z > 900 || v.pos.z < -900) {
          v.pos.z = tr.dir > 0 ? -890 : 890;
          v.pos.x = tr.road + tr.lane;
        }
      } else {
        v.pos.x += tr.dir * tr.speed * dt;
        v.angle = tr.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        v.pos.z += (tr.road + tr.lane - v.pos.z) * Math.min(1, dt * 1.4);
        if (v.pos.x > 1500 || v.pos.x < -940) {
          v.pos.x = tr.dir > 0 ? -930 : 1490;
          v.pos.z = tr.road + tr.lane;
        }
      }
      if (this.world.isWater(v.pos.x, v.pos.z)) {
        v.pos.x = Math.min(v.pos.x, SHORE_X - 10);
      }
      if (p && dist2(p.pos, v.pos) < 8) v.speed *= Math.max(0, 1 - dt * 1.5);
      else v.speed += (tr.speed - v.speed) * Math.min(1, dt * 0.6);
      v.speed = clamp(v.speed, 2, 16);
    }
  }

  /* ============================================================
     NPCs, PICKUPS, EFFECTS, MARKERS
     ============================================================ */
  _updateNPCs(dt) {
    const p = this.player;
    for (const n of this.npcs) {
      if (n.dead) continue;
      n.flee = Math.max(0, n.flee - dt);
      n.talkCooldown = Math.max(0, n.talkCooldown - dt);
      const danger = n.flee > 0 || (p && (this.wanted > 1 || (p.aim && dist2(p.pos, n.pos) < 12)));
      const speed = danger ? 4.6 : n.speed;
      if (n.axis === 'x') n.pos.z += n.dir * speed * dt;
      else n.pos.x += n.dir * speed * dt;
      if (n.pos.z > 820 || n.pos.z < -820) n.dir *= -1;
      if (n.pos.x > 520 || n.pos.x < -880) n.dir *= -1;
      if (this.world.isWater(n.pos.x, n.pos.z)) n.pos.x = Math.min(n.pos.x, SHORE_X - 6);
      const res = this.world.resolveCircle(n.pos.x, n.pos.z, 0.4);
      n.pos.x = res.x; n.pos.z = res.z;
      n.model.group.position.set(n.pos.x, this.world.groundHeight(n.pos.x, n.pos.z), n.pos.z);
      n.model.group.rotation.y = n.axis === 'x' ? (n.dir > 0 ? 0 : Math.PI) : (n.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      n.model.update(dt, speed, danger ? 'idle' : 'idle');
    }
  }

  _updatePickups(dt) {
    const p = this.player;
    if (!p) return;
    for (const it of this.pickups) {
      if (!it.active) {
        it.respawn -= dt;
        if (it.respawn <= 0) { it.active = true; it.g.visible = true; }
        continue;
      }
      it.g.rotation.y += dt * 1.2;
      it.core.position.y = Math.sin((this._elapsed || 0) * 2 + it.x) * 0.16;
      it.ring.rotation.z += dt * 0.8;
      if (p.inVehicle) continue;
      if (dist2(p.pos, { x: it.x, z: it.z }) < 2.2) {
        it.active = false; it.g.visible = false; it.respawn = 35;
        if (it.type === 'cash') { p.money += 250; this.notify('DINHEIRO', '+ R$ 250', 'good'); this.audio.play('cash'); }
        if (it.type === 'health') { p.health = Math.min(100, p.health + 35); this.notify('SAÚDE', '+35 de vida', 'good'); this.audio.play('pickup'); }
        if (it.type === 'armor') { p.armor = Math.min(100, p.armor + 35); this.notify('COLETE', '+35 de armadura', 'good'); this.audio.play('pickup'); }
        if (it.type === 'ammo') { p.weapon.reserve += 24; this.notify('MUNIÇÃO', '+24 balas', 'good'); this.audio.play('reload'); }
        this._updateMoneyHUD();
      }
    }
  }

  _spawnTracer(a, b, color = 0xffe0a0) {
    const geo = new THREE.BufferGeometry().setFromPoints([a.clone(), b.clone()]);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 });
    const line = new THREE.Line(geo, mat);
    this.effectGroup.add(line);
    this.effects.push({ obj: line, life: 0.1, max: 0.1, kind: 'tracer' });
  }

  _spawnMuzzle(pos, dir) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.95 });
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 5, 4), mat);
    m.position.copy(pos).addScaledVector(dir, 0.55);
    this.effectGroup.add(m);
    this.effects.push({ obj: m, life: 0.07, max: 0.07, kind: 'flash' });
  }

  _spawnBlood(pos) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xb3202a, transparent: true, opacity: 0.75 });
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(rand(0.05, 0.12), 4, 3), mat.clone());
      m.position.set(pos.x + rand(-0.3, 0.3), 1.1 + rand(-0.2, 0.4), pos.z + rand(-0.3, 0.3));
      m.userData.v = new THREE.Vector3(rand(-1.4, 1.4), rand(0.8, 2.4), rand(-1.4, 1.4));
      this.effectGroup.add(m);
      this.effects.push({ obj: m, life: 0.7, max: 0.7, kind: 'blood', v: m.userData.v });
    }
  }

  _updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.life -= dt;
      if (e.obj.material) e.obj.material.opacity = Math.max(0, e.life / e.max);
      if (e.kind === 'blood') {
        e.v.y -= 7 * dt;
        e.obj.position.addScaledVector(e.v, dt);
      }
      if (e.life <= 0) {
        this.effectGroup.remove(e.obj);
        if (e.obj.geometry) e.obj.geometry.dispose();
        if (e.obj.material) e.obj.material.dispose();
        this.effects.splice(i, 1);
      }
    }
  }

  _updateMarkers(dt) {
    for (const m of this.markers) {
      const ud = m.userData;
      if (ud.ring) ud.ring.rotation.z += dt * 0.8;
      if (ud.ring2) ud.ring2.rotation.z -= dt * 1.2;
      if (ud.diamond) {
        ud.diamond.rotation.y += dt * 1.5;
        ud.diamond.position.y = ud.baseY + Math.sin((this._elapsed || 0) * 2) * 0.28;
      }
      if (ud.beam) ud.beam.material.opacity = 0.07 + Math.sin((this._elapsed || 0) * 1.5) * 0.03;
    }
    const om = this.objectiveMarker;
    if (om && om.visible) {
      om.userData.ring.rotation.z += dt * 1.1;
      om.userData.diamond.rotation.y += dt * 2;
      om.userData.diamond.position.y = om.userData.baseY + Math.sin((this._elapsed || 0) * 2.4) * 0.3;
    }
  }

  _updateMissionVehicle() {
    if (!this.mission) return;
    const step = this.mission.def.steps[this.mission.step];
    if (step && step.type === 'enterBoat' && this.player && this.player.inVehicle && this.player.inVehicle.isBoat) {
      this._advanceStep();
    }
  }

  /* ============================================================
     MISSIONS
     ============================================================ */
  nextMission() {
    return MISSIONS.find(m => !this.completed.has(m.id)) || null;
  }

  startMissionById(id) {
    const def = MISSIONS.find(m => m.id === id);
    if (!def) return;
    if (this.mission) return;
    this.audio.init();
    this.mode = 'story';
    this.resultOpen = false;
    this._hideAllOverlays();
    this.showHUD();
    if (def.char && this.player.charId !== def.char) this.setCharacter(def.char, true);
    this.mission = {
      def, step: 0, startTime: this._elapsed || 0, stepStart: this._elapsed || 0,
      stats: { kills: 0, shots: this.player.shots || 0, hits: this.player.hits || 0 },
      dialogShown: false, failed: false, defended: 0
    };
    this._checkpoint = {
      step: 0, x: this.player.pos.x, z: this.player.pos.z, char: this.player.charId, wanted: 0
    };
    this._showChapter(def);
    this.audio.play('mission');
    this._enterStep();
    this._autosave();
  }

  _showChapter(def) {
    const el = $('chapter-intro');
    if (!el) return;
    $('chapter-kicker').textContent = 'CAPÍTULO ' + def.num;
    $('chapter-title').textContent = def.title.toUpperCase();
    $('chapter-char').textContent = def.char === 'luiza' ? 'LUIZA' : 'CARLOS';
    $('chapter-loc').textContent = def.location;
    $('chapter-time').textContent = def.time;
    $('chapter-sub').textContent = def.sub;
    el.classList.remove('hidden');
    this.cutscene = true;
    clearTimeout(this._chapterTO);
    this._chapterTO = setTimeout(() => {
      el.classList.add('hidden');
      this.cutscene = false;
      this._last = performance.now();
    }, 2900);
  }

  _enterStep() {
    const m = this.mission;
    if (!m) return;
    const def = m.def;
    const step = def.steps[m.step];
    if (!step) { this._completeMission(); return; }
    m.stepStart = this._elapsed || 0;
    m.dialogShown = false;
    this._clearStepEntities();
    this._checkpoint = {
      step: m.step, x: this.player.pos.x, z: this.player.pos.z,
      char: this.player.charId, wanted: this.wanted
    };

    if (step.type === 'goto') {
      this._setObjectiveMarker(step.pos.x, step.pos.z, true);
      if (step.spawnBoat) this._ensureMissionBoat();
      if (step.dialog) this.showDialogue(step.dialog);
    } else if (step.type === 'chase') {
      const t = step.target || { x: this.player.pos.x + 80, z: this.player.pos.z, type: 'sports' };
      this._targetCar = this._makeVehicle({
        x: t.x, z: t.z, type: t.type || 'sports', color: t.color || 0xff7a59,
        angle: Math.PI / 2, name: t.name || 'ALVO', driver: 'target'
      });
      this._targetCar.traffic = null;
      this._setObjectiveMarker(t.x, t.z, true, 0xff7a59);
      if (step.dialog) this.showDialogue(step.dialog);
    } else if (step.type === 'combat') {
      const base = this._objectivePos || this.player.pos;
      const count = step.count || 4;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const x = clamp(base.x + Math.cos(a) * rand(6, 14), -900, 1450);
        const z = clamp(base.z + Math.sin(a) * rand(6, 14), -900, 900);
        this._spawnEnemy(x, z, { mission: true, health: 60, wave: 0 });
      }
      this._setObjectiveMarker(base.x, base.z, false);
    } else if (step.type === 'escape') {
      this._setObjectiveMarker(0, 0, false);
      this.setWanted(Math.max(this.wanted, step.wanted || 3), true);
      this.notify('FUGA', 'Desapareça do raio de busca da polícia.', 'bad');
    } else if (step.type === 'switch') {
      this._setObjectiveMarker(0, 0, false);
      this.setCharacter(step.char || 'carlos', true);
      if (step.dialog) this.showDialogue(step.dialog, () => this._advanceStep());
      else this._advanceStep();
      return;
    } else if (step.type === 'defend') {
      this._defendTimer = step.seconds || 45;
      this._defendWave = 0;
      this._setObjectiveMarker(this.player.pos.x, this.player.pos.z, true, 0xff6b6b);
      this.setWanted(Math.max(this.wanted, step.wanted || 4), true);
      this._spawnDefendWave();
      this.notify('DEFESA', 'Sobreviva até o fim do cerco.', 'bad');
    } else if (step.type === 'buoys') {
      this._buoys = [];
      this._buoyIndex = 0;
      for (const pt of step.points) {
        const ring = new THREE.Group();
        const torus = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.3, 6, 26), new THREE.MeshBasicMaterial({ color: 0x2ee6c8, transparent: true, opacity: 0.9 }));
        torus.rotation.x = Math.PI / 2; ring.add(torus);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 4.5, 6), new THREE.MeshStandardMaterial({ color: 0xffc46b, emissive: 0xffa63b, emissiveIntensity: 0.6 }));
        pole.position.y = 2.2; ring.add(pole);
        ring.position.set(pt.x, WATER_LEVEL + 0.35, pt.z);
        this.scene.add(ring);
        this._buoys.push({ g: ring, x: pt.x, z: pt.z, passed: false });
      }
      this._setObjectiveMarker(step.points[0].x, step.points[0].z, true, 0x2ee6c8);
      if (step.dialog) this.showDialogue(step.dialog);
    } else if (step.type === 'enterBoat') {
      this._ensureMissionBoat();
      if (this._activeBoat) this._setObjectiveMarker(this._activeBoat.pos.x, this._activeBoat.pos.z, true, 0x2ee6c8);
      if (step.dialog) this.showDialogue(step.dialog);
    }
    this._updateObjectiveHUD(true);
  }

  _ensureMissionBoat() {
    if (this._activeBoat && !this._activeBoat.destroyed) return this._activeBoat;
    this._activeBoat = this._makeVehicle({
      x: 748, z: 12, type: 'boat', color: 0x1f7f8f, angle: -Math.PI / 2, name: 'MARÉ 01'
    });
    this._activeBoat.pos.set(748, WATER_LEVEL + 0.02, 12);
    this._activeBoat.mesh.position.copy(this._activeBoat.pos);
    return this._activeBoat;
  }

  _spawnDefendWave() {
    const p = this.player;
    if (!p) return;
    const n = 2 + Math.min(3, this._defendWave);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + this._defendWave;
      const x = p.pos.x + Math.cos(a) * rand(22, 38);
      const z = p.pos.z + Math.sin(a) * rand(22, 38);
      if (this._defendWave % 2 === 0) this._spawnCop(x, z);
      else this._spawnEnemy(x, z, { mission: true, health: 55, wave: this._defendWave });
    }
    this._defendWave++;
  }

  _arriveStep() {
    const m = this.mission;
    if (!m || m.stepDone) return;
    m.stepDone = true;
    const step = m.def.steps[m.step];
    if (step.dialogOnArrive) {
      this.showDialogue(step.dialogOnArrive, () => this._advanceStep());
    } else {
      this._advanceStep();
    }
  }

  _advanceStep() {
    const m = this.mission;
    if (!m) return;
    m.stepDone = false;
    m.step++;
    m.dialogShown = false;
    if (m.step >= m.def.steps.length) {
      this._completeMission();
      return;
    }
    this.audio.play('checkpoint');
    this._enterStep();
  }

  _updateMission(dt) {
    const m = this.mission;
    const p = this.player;
    if (!m || !p || m.failed || this.resultOpen) return;
    const step = m.def.steps[m.step];
    if (!step) return;
    const elapsed = (this._elapsed || 0) - m.stepStart;

    if (m.def.timeLimit && (this._elapsed || 0) - m.startTime > m.def.timeLimit) {
      this._failMission('O tempo acabou.');
      return;
    }

    if (step.type === 'goto') {
      if (dist2(p.pos, step.pos) < (step.r || 7)) this._arriveStep();
    } else if (step.type === 'chase') {
      const t = this._targetCar;
      if (t && !t.destroyed) {
        const to = new THREE.Vector3().subVectors(t.pos, p.pos);
        const d = to.length();
        to.normalize();
        const away = new THREE.Vector3(t.pos.x - p.pos.x, 0, t.pos.z - p.pos.z).normalize();
        t.angle = Math.atan2(away.x, away.z) + Math.sin((this._elapsed || 0) * 0.9) * 0.35;
        t.speed = 17;
        const nx = t.pos.x + Math.sin(t.angle) * t.speed * dt;
        const nz = t.pos.z + Math.cos(t.angle) * t.speed * dt;
        const res = this.world.resolveCircle(nx, nz, 1.6);
        t.pos.x = res.x; t.pos.z = res.z;
        t.mesh.position.set(t.pos.x, 0, t.pos.z);
        t.mesh.rotation.y = t.angle;
        this._setObjectiveMarker(t.pos.x, t.pos.z, true, 0xff7a59);
        this._objectivePos = { x: t.pos.x, z: t.pos.z };
        if (d < 10 && !m.stepDone) {
          m.stepDone = true;
          this._targetCar = null;
          this._setObjectiveMarker(0, 0, false);
          this.showDialogue('m1_3', () => this._advanceStep());
          this.audio.play('objective');
        }
      } else if (!this._targetCar && !m.stepDone) {
        m.stepDone = true;
        this.showDialogue('m1_3', () => this._advanceStep());
      }
    } else if (step.type === 'combat') {
      if (this.enemies.length === 0 && !m.stepDone) {
        m.stepDone = true;
        if (step.dialogOnDone) this.showDialogue(step.dialogOnDone, () => {
          if (step.wantedOnDone) this.setWanted(step.wantedOnDone);
          this._advanceStep();
        });
        else {
          if (step.wantedOnDone) this.setWanted(step.wantedOnDone);
          this._advanceStep();
        }
      }
    } else if (step.type === 'escape') {
      if (this.wanted === 0) this._advanceStep();
    } else if (step.type === 'defend') {
      this._defendTimer -= dt;
      if (Math.floor(elapsed) > 0 && Math.floor(elapsed) % 14 === 0 && !m._waveAt) {
        m._waveAt = Math.floor(elapsed);
        this._spawnDefendWave();
      }
      if (Math.floor(elapsed) % 14 !== 0) m._waveAt = null;
      this._setObjectiveMarker(p.pos.x, p.pos.z, true, 0xff6b6b);
      if (this._defendTimer <= 0) {
        this._setObjectiveMarker(0, 0, false);
        this.setWanted(0, true);
        this._advanceStep();
      }
    } else if (step.type === 'buoys') {
      const b = this._buoys[this._buoyIndex];
      if (b) {
        b.g.rotation.z += dt * 0.7;
        if (dist2(p.pos, b) < 13) {
          b.passed = true;
          b.g.visible = false;
          this._buoyIndex++;
          this.audio.play('checkpoint');
          if (this._buoyIndex >= this._buoys.length) {
            this._setObjectiveMarker(0, 0, false);
            this._advanceStep();
          } else {
            const nb = this._buoys[this._buoyIndex];
            this._setObjectiveMarker(nb.x, nb.z, true, 0x2ee6c8);
          }
        }
      }
    } else if (step.type === 'enterBoat') {
      if (p.inVehicle && p.inVehicle.isBoat) this._advanceStep();
    }
  }

  _completeMission() {
    const m = this.mission;
    if (!m) return;
    const def = m.def;
    const p = this.player;
    const total = (this._elapsed || 0) - m.startTime;
    const acc = p.shots > m.stats.shots ? Math.round((p.hits - m.stats.hits) / Math.max(1, p.shots - m.stats.shots) * 100) : 100;
    let stars = 3;
    if (this.wanted === 0) stars++;
    if (p.health > 55) stars++;
    stars = clamp(stars, 1, 5);
    p.money += def.reward;
    this.completed.add(def.id);
    this.mission = null;
    this._clearStepEntities();
    this._clearPolice();
    this._clearObjectiveMarker();
    this._rebuildStaticMarkers();
    this.audio.play('mission');
    this._updateMoneyHUD();
    this._showResult({
      win: true, title: def.title, text: def.num === 5 ? 'A cidade mudou de dono. Luiza e Carlos venceram.' : 'Objetivo cumprido. Santo Matteo sente o impacto.',
      stars, money: def.reward, time: total, acc: clamp(acc, 0, 100), kills: m.stats.kills
    });
    this._autosave();
  }

  _failMission(reason) {
    const m = this.mission;
    if (!m || m.failed) return;
    m.failed = true;
    this.audio.play('fail');
    this._showResult({
      win: false, title: m.def.title, text: reason || 'A missão falhou. Tente novamente do checkpoint.',
      stars: 0, money: 0, time: (this._elapsed || 0) - m.startTime, acc: 0, kills: m.stats.kills
    });
    this.resultOpen = true;
  }

  _showResult(data) {
    this.resultOpen = true;
    this._hideCrosshair();
    const el = $('mission-result');
    if (!el) return;
    $('result-kicker').textContent = data.win ? 'MISSÃO CONCLUÍDA' : 'MISSÃO FALHOU';
    $('result-title').textContent = data.title.toUpperCase();
    $('result-text').textContent = data.text;
    const starsEl = $('result-stars');
    if (starsEl) {
      starsEl.innerHTML = '';
      for (let i = 0; i < 5; i++) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.innerHTML = '<use href="#star"/>';
        if (i < data.stars) svg.classList.add('on');
        starsEl.appendChild(svg);
      }
    }
    $('result-money').textContent = data.win ? 'R$ ' + data.money.toLocaleString('pt-BR') : '—';
    $('result-time').textContent = this._formatTime(data.time);
    $('result-acc').textContent = data.win ? data.acc + '%' : '—';
    $('result-kills').textContent = String(data.kills).padStart(2, '0');
    const retry = $('btn-result-retry');
    if (retry) retry.classList.toggle('hidden', data.win || !this.mission);
    const next = $('btn-result-next');
    if (next) next.textContent = data.win ? 'Continuar' : 'Tentar de novo';
    el.classList.remove('hidden');
    document.exitPointerLock && document.exitPointerLock();
  }

  _closeResult() {
    this.resultOpen = false;
    $('mission-result').classList.add('hidden');
    this._last = performance.now();
    if (this.mission && this.mission.failed) this.restartCheckpoint();
  }

  restartCheckpoint() {
    if (!this.mission || !this._checkpoint) {
      this._respawn();
      return;
    }
    const cp = this._checkpoint;
    this.resultOpen = false;
    $('mission-result').classList.add('hidden');
    this.mission.step = cp.step;
    this.mission.failed = false;
    this.mission.stepDone = false;
    this.mission.stats.kills = 0;
    this.mission.startTime = this._elapsed || 0;
    this.player.health = 100;
    this.player.armor = 40;
    this.player.dead = false;
    this.player.pos.set(cp.x, 0, cp.z);
    this.player.yaw = this.player.yaw;
    this.setCharacter(cp.char || this.player.charId, true);
    this.setWanted(0, true);
    this._clearPolice();
    this._placePlayer();
    this._snapCamera();
    this._enterStep();
    this.notify('CHECKPOINT', 'Missão reiniciada do último ponto seguro.', 'good');
    this._autosave();
  }

  _clearStepEntities() {
    for (const e of this.enemies) {
      this.scene.remove(e.model.group);
      e.model.dispose();
    }
    this.enemies = [];
    if (this._targetCar) { this._removeVehicle(this._targetCar); this._targetCar = null; }
    if (this._buoys) {
      for (const b of this._buoys) this.scene.remove(b.g);
      this._buoys = [];
    }
    this._clearObjectiveMarker();
  }

  _clearMissionEntities() {
    this._clearStepEntities();
    this.mission = null;
    this.rpJob = null;
  }

  /* ============================================================
     WANTED / POLICE
     ============================================================ */
  setWanted(level, silent = false) {
    const n = clamp(Math.round(level), 0, 6);
    const prev = this.wanted || 0;
    this.wanted = n;
    if (n > prev) this._lastCrime = this._elapsed || 0;
    this._updateWantedHUD();
    if (!silent && n !== prev) {
      if (n > prev) this.audio.play('wanted');
      else if (n === 0) { this.audio.play('unwanted'); this._removePoliceCars(); }
    }
    if (n === 0) { this._removePoliceCars(); this._wantedEvade = 0; }
    if (n > 0 && n > prev) this._policeSpawnTimer = Math.min(this._policeSpawnTimer, 1.2);
  }

  addWanted(n) {
    if (n <= 0) return;
    this._lastCrime = this._elapsed || 0;
    this._wantedEvade = 0;
    this.setWanted((this.wanted || 0) + n);
  }

  _updateWantedHUD() {
    const row = $('wanted-stars');
    if (!row) return;
    const n = this.wanted || 0;
    if (row.children.length !== 6) {
      row.innerHTML = '';
      for (let i = 0; i < 6; i++) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.innerHTML = '<use href="#star"/>';
        row.appendChild(svg);
      }
    }
    [...row.children].forEach((svg, i) => {
      svg.classList.toggle('on', i < n);
      svg.classList.toggle('hot', i < n && n >= 5);
    });
    const label = $('wanted-label');
    const names = ['LIMPO', 'PROCURADO', 'ATENÇÃO', 'ALERTA', 'PERSEGUIÇÃO', 'CAÇADA', 'MÁXIMO'];
    if (label) {
      label.textContent = names[n] || 'PROCURADO';
      label.classList.toggle('on', n > 0);
    }
  }

  _updateWanted(dt) {
    const p = this.player;
    if (!p || this.wanted <= 0) return;
    const sinceCrime = (this._elapsed || 0) - (this._lastCrime || 0);
    const copNear = this.cops.some(c => !c.dead && dist2(c.pos, p.pos) < 70) ||
      this.vehicles.some(v => v.isPolice && !v.destroyed && dist2(v.pos, p.pos) < 75);
    if (sinceCrime > 9 && !copNear) {
      this._wantedEvade += dt;
      if (this._wantedEvade > 11) {
        this._wantedEvade = 0;
        this.setWanted(this.wanted - 1, true);
        if (this.wanted === 0) {
          this.audio.play('unwanted');
          this.notify('PROCURADO', 'Você despistou a polícia.', 'good');
        }
      }
    } else {
      this._wantedEvade = Math.max(0, this._wantedEvade - dt * 0.5);
    }

    this._policeSpawnTimer -= dt;
    if (this._policeSpawnTimer <= 0) {
      this._policeSpawnTimer = Math.max(2.5, 7 - this.wanted * 0.7);
      const cars = this.vehicles.filter(v => v.isPolice && !v.destroyed).length;
      const wantCars = Math.min(6, this.wanted + 1);
      if (cars < wantCars) this._spawnPoliceCar();
      if (this.wanted >= 3 && this.cops.length < this.wanted) {
        const a = Math.random() * Math.PI * 2;
        this._spawnCop(p.pos.x + Math.cos(a) * rand(32, 55), p.pos.z + Math.sin(a) * rand(32, 55));
      }
    }
  }

  _spawnPoliceCar() {
    const p = this.player;
    if (!p) return;
    const rp = this.world.randomRoadPoint(Math.random);
    let x = rp.x, z = rp.z;
    const d = Math.hypot(x - p.pos.x, z - p.pos.z);
    if (d < 70) { x += (x - p.pos.x) * 1.6; z += (z - p.pos.z) * 1.6; }
    x = clamp(x, -900, 1400); z = clamp(z, -900, 900);
    if (this.world.isWater(x, z)) x = SHORE_X - 40;
    const v = this._makeVehicle({ x, z, type: 'police', color: 0xf1eee2, angle: 0, name: 'VIATURA', driver: 'police' });
    v.ai = { stuck: 0 };
  }

  _removePoliceCars() {
    for (const v of [...this.vehicles]) if (v.isPolice) this._removeVehicle(v);
  }

  _clearPolice() {
    for (const c of this.cops) { this.scene.remove(c.model.group); c.model.dispose(); }
    this.cops = [];
    this._removePoliceCars();
    this.setWanted(0, true);
  }

  /* ============================================================
     RP JOBS
     ============================================================ */
  getRPJobs() {
    const spots = [LANDMARKS.park, LANDMARKS.port, LANDMARKS.casino, LANDMARKS.monument,
      LANDMARKS.hospital, LANDMARKS.safehouse, LANDMARKS.favela, LANDMARKS.pier, LANDMARKS.warehouse];
    const pickSpots = (n, seed) => {
      const out = [];
      for (let i = 0; i < n; i++) out.push(spots[(seed * 3 + i * 2) % spots.length]);
      return out;
    };
    this.rpJobs = RP_JOB_DEFS.map((d, i) => {
      const targets = pickSpots(d.type === 'race' ? 4 : d.type === 'photo' ? 3 : 1, i + 1);
      return { ...d, id: 'rp' + i, targets, target: targets[0] };
    });
    return this.rpJobs;
  }

  startRPJob(index) {
    if (!this.rpJobs) this.getRPJobs();
    const job = this.rpJobs[index];
    if (!job) return;
    if (this.rpJob) this._endRPJob(false);
    this.audio.init();
    this.mode = 'rp';
    this._hideAllOverlays();
    this.showHUD();
    this.rpJob = {
      def: job, step: 0, startTime: this._elapsed || 0, targets: job.targets,
      timer: job.time, total: job.time
    };
    const mini = $('rp-mini');
    if (mini) mini.classList.remove('hidden');
    const jt = $('rp-mini-job');
    if (jt) jt.textContent = job.title;
    if (job.type === 'security') {
      const t = job.target;
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        this._spawnEnemy(t.x + Math.cos(a) * 5, t.z + Math.sin(a) * 5, { health: 55 });
      }
      this._setObjectiveMarker(t.x, t.z, true, 0xff7a59);
    } else {
      this._setObjectiveMarker(job.targets[0].x, job.targets[0].z, true, 0x2ee6c8);
    }
    this.notify('TRABALHO RP', job.title + ' iniciado. ' + job.pt, 'rp');
    this._autosave();
  }

  _updateRP(dt) {
    const r = this.rpJob;
    const p = this.player;
    if (!r || !p) return;
    r.timer -= dt;
    const miniBar = $('rp-mini-bar');
    if (miniBar) miniBar.style.width = clamp(r.timer / r.total * 100, 0, 100) + '%';
    if (r.timer <= 0) { this._endRPJob(false, 'O tempo do trabalho acabou.'); return; }
    const def = r.def;
    if (def.type === 'security') {
      if (this.enemies.length === 0) this._endRPJob(true);
      return;
    }
    const target = r.targets[r.step];
    if (!target) { this._endRPJob(true); return; }
    this._objectivePos = { x: target.x, z: target.z };
    this._setObjectiveMarker(target.x, target.z, true, 0x2ee6c8);
    if (dist2(p.pos, target) < 8) {
      r.step++;
      this.audio.play('checkpoint');
      if (r.step >= r.targets.length) this._endRPJob(true);
      else this.notify('RP', 'Checkpoint ' + r.step + ' de ' + r.targets.length, 'rp');
    }
  }

  _endRPJob(success, reason = '') {
    const r = this.rpJob;
    if (!r) return;
    const def = r.def;
    this.rpJob = null;
    this._setObjectiveMarker(0, 0, false);
    const mini = $('rp-mini'); if (mini) mini.classList.add('hidden');
    if (success) {
      const p = this.player;
      p.money += def.reward;
      if (!this.rp) this.rp = { rep: 0, done: 0 };
      this.rp.rep = Math.min(100, (this.rp.rep || 0) + (def.rep || 10));
      this.rp.done = (this.rp.done || 0) + 1;
      this.audio.play('cash');
      this.notify('TRABALHO CONCLUÍDO', def.title + ' • +R$ ' + def.reward.toLocaleString('pt-BR'), 'good');
      this._updateMoneyHUD();
      this._autosave();
    } else {
      this.audio.play('fail');
      this.notify('TRABALHO FALHOU', reason || 'O trabalho foi interrompido.', 'bad');
    }
    this._rebuildStaticMarkers();
  }

  /* ============================================================
     DIALOGUE / SUBTITLES
     ============================================================ */
  showDialogue(key, onDone) {
    const lines = DIALOGUES[key];
    if (!lines || !lines.length) { if (onDone) onDone(); return; }
    this.dialogueActive = true;
    document.body.classList.add('dialogue-open');
    this._dialogue = { lines, index: 0, onDone };
    this._renderDialogueLine();
    $('dialogue').classList.remove('hidden');
    $('interact-prompt').classList.add('hidden');
    this._hideCrosshair();
    document.exitPointerLock && document.exitPointerLock();
    this.audio.play('ui');
  }

  _renderDialogueLine() {
    const d = this._dialogue;
    if (!d) return;
    const line = d.lines[d.index];
    if (!line) return;
    const who = (line.who || '').toLowerCase();
    const isL = who.includes('luiza');
    const isC = who.includes('carlos');
    const enFirst = this.settings.language === 'en';
    $('dlg-name').textContent = line.who;
    $('dlg-loc').textContent = this.world.districtAt(this.player.pos.x, this.player.pos.z);
    $('dlg-pt').textContent = enFirst ? line.en : line.pt;
    $('dlg-en').textContent = enFirst ? line.pt : line.en;
    const portrait = $('dlg-portrait');
    if (portrait) {
      const id = isL ? 'luiza' : isC ? 'carlos' : (this.player.charId === 'carlos' ? 'carlos' : 'luiza');
      portrait.innerHTML = `<svg><use href="#portrait-${id}"/></svg>`;
      portrait.style.opacity = isL || isC ? '1' : '.55';
    }
    const next = $('dlg-next');
    if (next) next.querySelector('span').textContent = d.index >= d.lines.length - 1 ? 'ENCERRAR' : 'CONTINUAR';
    this.audio.tone(isL ? 420 : isC ? 300 : 340, 0.05, 'sine', 0.025);
  }

  _advanceDialogue() {
    const d = this._dialogue;
    if (!d) return;
    d.index++;
    if (d.index >= d.lines.length) {
      this._closeDialogue();
    } else {
      this._renderDialogueLine();
      this.audio.play('ui');
    }
  }

  _closeDialogue() {
    const d = this._dialogue;
    this.dialogueActive = false;
    document.body.classList.remove('dialogue-open');
    this._dialogue = null;
    $('dialogue').classList.add('hidden');
    this._last = performance.now();
    if (d && d.onDone) d.onDone();
  }

  showSubtitle(speaker, pt, en, secs = 4) {
    if (this.settings.subtitles === false) return;
    const el = $('subtitle');
    if (!el) return;
    $('sub-speaker').textContent = speaker;
    $('sub-text').textContent = pt;
    $('sub-en').textContent = en || '';
    el.classList.remove('hidden');
    this._subTimer = secs;
  }

  _hideCrosshair() {
    const c = $('crosshair'); if (c) c.classList.add('hidden');
    const h = $('hitmarker'); if (h) h.classList.remove('show');
  }

  _hitmarker() {
    const h = $('hitmarker');
    if (!h) return;
    h.classList.remove('show');
    void h.offsetWidth;
    h.classList.add('show');
  }

  /* ============================================================
     HUD
     ============================================================ */
  _formatTime(sec) {
    const s = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(s / 60), r = s % 60;
    return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  }

  _updateMoneyHUD() {
    const p = this.player;
    if (!p) return;
    const el = $('hud-money');
    if (el) el.textContent = Math.floor(p.money).toLocaleString('pt-BR');
    const ms = $('ms-money');
    if (ms) ms.textContent = Math.floor(p.money).toLocaleString('pt-BR');
    const delta = $('cash-delta');
    if (delta) {
      const d = p.money - (this._lastMoney ?? p.money);
      if (d > 0) { delta.textContent = '+R$ ' + Math.floor(d); delta.classList.add('show'); }
      else if (d < 0) { delta.textContent = '-R$ ' + Math.floor(-d); delta.classList.add('show'); }
      this._lastMoney = p.money;
    }
  }

  _updateMobileHUD(p) {
    if (!p) return;
    const ctx = $('mh-context');
    if (!ctx) return;
    const veh = p.inVehicle;
    const driving = !!veh;
    if (driving !== this._mhDriving) {
      this._mhDriving = driving;
      ctx.classList.toggle('vehicle', driving);
      this._updateTouchLabels();
    }

    if (this._mhMag !== p.weapon.mag) {
      this._mhMag = p.weapon.mag;
      const ma = $('mh-ammo'); if (ma) ma.textContent = p.weapon.mag;
    }
    if (this._mhReserve !== p.weapon.reserve) {
      this._mhReserve = p.weapon.reserve;
      const mr = $('mh-reserve'); if (mr) mr.textContent = p.weapon.reserve;
    }

    if (veh) {
      const kmh = Math.round(Math.abs(veh.speed) * 3.6);
      if (this._mhKmh !== kmh) {
        this._mhKmh = kmh;
        const sv = $('mh-speed-val'); if (sv) sv.textContent = kmh;
        const arc = $('mh-speed-arc');
        if (arc) arc.style.strokeDashoffset = String(207 - clamp(kmh / 220, 0, 1) * 207);
      }
      if (this._mhVehicleName !== veh.name) {
        this._mhVehicleName = veh.name;
        const vn = $('mh-vehicle-name'); if (vn) vn.textContent = veh.name;
      }
      const gear = veh.speed < -0.5 ? 'R' : veh.speed < 0.5 ? 'N' : 'D';
      if (this._mhGear !== gear) {
        this._mhGear = gear;
        const g = $('mh-gear'); if (g) g.textContent = gear;
      }
    } else if (this._mhWeaponName !== 'PISTOLA MATTEO .40') {
      this._mhWeaponName = 'PISTOLA MATTEO .40';
      const wn = $('mh-weapon-name'); if (wn) wn.textContent = this._mhWeaponName;
    }

    const low = p.health <= 30 && !p.dead;
    if (low !== this._mhLow) {
      this._mhLow = low;
      document.body.classList.toggle('low-health', low);
    }
    const wantedHigh = (this.wanted || 0) >= 3;
    if (wantedHigh !== this._mhWantedHigh) {
      this._mhWantedHigh = wantedHigh;
      document.body.classList.toggle('high-wanted', wantedHigh);
    }
  }

  _updateHUD(dt) {
    const p = this.player;
    if (!p) return;
    this._updateMobileHUD(p);
    const bar = (id, v) => { const el = $(id); if (el) el.style.width = clamp(v, 0, 100) + '%'; };
    bar('bar-health', p.health);
    bar('bar-armor', p.armor);
    bar('bar-stamina', p.stamina);
    const vh = $('val-health'); if (vh) vh.textContent = Math.round(p.health);
    const va = $('val-armor'); if (va) va.textContent = Math.round(p.armor);
    const am = $('ammo-mag'); if (am) am.textContent = p.weapon.mag;
    const ar = $('ammo-reserve'); if (ar) ar.textContent = p.weapon.reserve;
    const msH = $('ms-health'); if (msH) msH.style.width = clamp(p.health, 0, 100) + '%';
    const msA = $('ms-armor'); if (msA) msA.style.width = clamp(p.armor, 0, 100) + '%';
    const msS = $('ms-stamina'); if (msS) msS.style.width = clamp(p.stamina, 0, 100) + '%';
    const msM = $('ms-ammo'); if (msM) msM.textContent = p.weapon.mag;
    const msR = $('ms-ammo-reserve'); if (msR) msR.textContent = p.weapon.reserve;

    const cross = $('crosshair');
    if (cross) {
      const aiming = p.aim || this.input.aim;
      cross.classList.toggle('hidden', !aiming || p.inVehicle || this.dialogueActive);
      cross.classList.toggle('aiming', !!aiming);
    }

    const speedo = $('speedo');
    if (speedo) {
      speedo.classList.toggle('hidden', !p.inVehicle);
      if (p.inVehicle) {
        const v = p.inVehicle;
        const kmh = Math.round(Math.abs(v.speed) * 3.6);
        const sv = $('speedo-val'); if (sv) sv.textContent = kmh;
        const arc = $('speedo-arc');
        if (arc) arc.style.strokeDashoffset = String(314 - clamp(kmh / 220, 0, 1) * 314);
        const vn = $('vehicle-name'); if (vn) vn.textContent = v.name;
        const vg = $('vehicle-gear'); if (vg) vg.textContent = v.speed < -0.5 ? 'R' : v.speed < 0.5 ? 'N' : 'D';
      }
    }

    this.hudTick += dt;
    if (this.hudTick < 0.12) return;
    this.hudTick = 0;

    this._updateMoneyHUD();
    const clock = Math.floor(this.clockMinutes / 60) % 24;
    const mins = Math.floor(this.clockMinutes % 60);
    const clockStr = String(clock).padStart(2, '0') + ':' + String(mins).padStart(2, '0');
    const hc = $('hud-clock'); if (hc) hc.textContent = clockStr;
    const mc = $('menu-clock'); if (mc) mc.textContent = clockStr;

    const dist = this.world.districtAt(p.pos.x, p.pos.z);
    if (dist !== this._district) {
      this._district = dist;
      const md = $('minimap-district'); if (md) md.textContent = dist;
    }

    const strip = $('compass-strip');
    if (strip) strip.style.transform = `translateX(calc(-50% + ${(-this._camYaw / (Math.PI * 2)) * 720}px))`;
    const mhStrip = $('mh-compass-strip');
    if (mhStrip) mhStrip.style.transform = `translateX(calc(-50% + ${(-this._camYaw / (Math.PI * 2)) * 360}px))`;

    this._updateObjectiveHUD();
    this._updateWantedHUD();
    this._drawMinimap();

    if (this._subTimer > 0) {
      this._subTimer -= 0.12;
      if (this._subTimer <= 0) $('subtitle').classList.add('hidden');
    }
    if (this._flashDamage > 0) {
      this._flashDamage = Math.max(0, this._flashDamage - 0.12);
      const g = $('vignette');
      if (g) g.style.background = `radial-gradient(circle at 50% 55%, transparent 40%, rgba(160,10,20,${this._flashDamage * 0.5}) 100%)`;
      if (this._flashDamage <= 0 && g) g.style.background = '';
    }
  }

  _updateObjectiveHUD(force = false) {
    const p = this.player;
    if (!p) return;
    const obj = $('objective-panel');
    if (!obj) return;
    let kicker = 'MODO LIVRE', title = 'SANTO MATTEO', text = 'Explore a cidade, aceite trabalhos ou inicie a próxima missão.', progress = 0, distText = '';
    let target = null;

    if (this.mission) {
      const m = this.mission;
      const step = m.def.steps[m.step];
      kicker = 'MISSÃO ' + m.def.num + ' / 5';
      title = m.def.title;
      text = step ? (step.desc || '') : '';
      progress = ((m.step + (m.stepDone ? 1 : 0)) / m.def.steps.length) * 100;
      if (step) {
        if (step.type === 'goto') target = step.pos;
        else if (step.type === 'chase' && this._targetCar) target = this._targetCar.pos;
        else if (step.type === 'combat') { text = step.desc + ' (' + this.enemies.length + ' restantes)'; }
        else if (step.type === 'defend') { text = step.desc + ' • ' + Math.ceil(this._defendTimer) + 's'; }
        else if (step.type === 'escape') { text = 'Despiste a polícia. Nível ' + this.wanted + ' de 6.'; }
        else if (step.type === 'buoys') { text = 'Boia ' + Math.min(this._buoyIndex + 1, 5) + ' de 5'; }
        else if (step.type === 'enterBoat') target = this._activeBoat ? this._activeBoat.pos : LANDMARKS.marina;
        else if (step.type === 'switch') target = this.player.pos;
      }
      const clock = $('mission-clock');
      if (clock) {
        const timeLimit = m.def.timeLimit;
        clock.classList.toggle('hidden', !timeLimit);
        if (timeLimit) {
          const left = Math.max(0, timeLimit - ((this._elapsed || 0) - m.startTime));
          $('mission-clock-value').textContent = this._formatTime(left);
          $('mission-clock-label').textContent = 'TEMPO';
        }
      }
    } else if (this.rpJob) {
      kicker = 'ROLEPLAY • ' + this.rpJob.def.title.toUpperCase();
      title = 'TRABALHO ATIVO';
      text = this.rpJob.def.pt;
      progress = (this.rpJob.step / Math.max(1, this.rpJob.targets.length)) * 100;
      target = this.rpJob.targets[this.rpJob.step];
    } else {
      const next = this.mode === 'story' ? this.nextMission() : null;
      if (next) {
        kicker = 'PRÓXIMA MISSÃO';
        title = next.title;
        text = 'Vá até ' + next.location + ' para começar.';
        target = next.start;
      } else if (this.mode === 'story') {
        kicker = 'HISTÓRIA CONCLUÍDA';
        title = 'SANTO MATTEO É SEU';
        text = 'Você terminou as cinco missões. Continue explorando ou viva o Roleplay.';
      }
      const clock = $('mission-clock'); if (clock) clock.classList.add('hidden');
    }

    $('obj-kicker').textContent = kicker;
    $('obj-title').textContent = title;
    $('obj-text').textContent = text;
    const op = $('obj-progress'); if (op) op.style.width = clamp(progress, 0, 100) + '%';
    if (target) {
      const d = dist2(p.pos, target);
      distText = d > 1000 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m';
      this._objectivePos = { x: target.x, z: target.z };
    } else {
      this._objectivePos = null;
    }
    const od = $('obj-distance'); if (od) od.textContent = distText || (this.mode === 'rp' ? 'SANTO MATTEO' : '—');
    const ot = $('obj-timer'); if (ot) ot.textContent = this.rpJob ? this._formatTime(this.rpJob.timer) : '';
  }

  _drawMinimap() {
    const cv = $('minimap');
    const p = this.player;
    if (!cv || !p) return;
    const ctx = cv.getContext('2d');
    const size = cv.width;
    const span = 300;
    const map = this.world.mapCanvas;
    const mapScale = map.width / 2000;
    const cx = (p.pos.x + 1000) * mapScale;
    const cz = (p.pos.z + 1000) * mapScale;
    const sw = span * mapScale;
    const half = size / 2;
    const radius = half - 5;
    const t = performance.now() / 1000;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath(); ctx.arc(half, half, radius, 0, Math.PI * 2); ctx.clip();
    const bg = ctx.createRadialGradient(half, half, 4, half, half, radius);
    bg.addColorStop(0, '#0d3440');
    bg.addColorStop(1, '#061a22');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(map, cx - sw / 2, cz - sw / 2, sw, sw, 0, 0, size, size);

    // Soft vignette so the circular crop reads like a radar.
    const vg = ctx.createRadialGradient(half, half, radius * 0.55, half, half, radius);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(2,9,13,.42)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, size, size);

    const toScreen = (x, z) => ({
      x: (x - p.pos.x) / span * size + half,
      y: (z - p.pos.z) / span * size + half
    });
    const clampToRing = (s, pad = 18) => {
      const dx = s.x - half, dy = s.y - half;
      const d = Math.hypot(dx, dy);
      const max = radius - pad;
      if (d <= max) return s;
      return { x: half + dx / d * max, y: half + dy / d * max };
    };
    const dot = (x, z, color, r = 5, glow = true) => {
      const s = clampToRing(toScreen(x, z), r + 3);
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 2; ctx.stroke();
      if (glow) {
        ctx.beginPath(); ctx.arc(s.x, s.y, r + 3, 0, Math.PI * 2);
        ctx.strokeStyle = color; ctx.globalAlpha = 0.28; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };
    const diamond = (x, z, color, r = 6) => {
      const s = clampToRing(toScreen(x, z), r + 3);
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = color; ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 2; ctx.strokeRect(-r, -r, r * 2, r * 2);
      ctx.restore();
    };
    const star = (x, z, color, r = 7) => {
      const s = clampToRing(toScreen(x, z), r + 4);
      ctx.save(); ctx.translate(s.x, s.y);
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const rr = i % 2 === 0 ? r : r * 0.44;
        if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    };

    // Route to the active objective, clipped at the minimap rim.
    if (this._objectivePos) {
      const target = toScreen(this._objectivePos.x, this._objectivePos.z);
      const edge = clampToRing(target, 10);
      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.lineDashOffset = -t * 22;
      ctx.strokeStyle = 'rgba(255,196,107,.85)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(half, half); ctx.lineTo(edge.x, edge.y); ctx.stroke();
      ctx.restore();
      const pulse = 5 + Math.sin(t * 4) * 1.6;
      ctx.beginPath(); ctx.arc(edge.x, edge.y, pulse + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,196,107,.45)'; ctx.lineWidth = 2; ctx.stroke();
      star(this._objectivePos.x, this._objectivePos.z, '#ffc46b', 7);
    }

    // Custom waypoint: dashed route and cyan diamond, clamped to the rim.
    if (this.waypoint) {
      const target = toScreen(this.waypoint.x, this.waypoint.z);
      const edge = clampToRing(target, 10);
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -t * 18;
      ctx.strokeStyle = 'rgba(46,230,200,.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(half, half); ctx.lineTo(edge.x, edge.y); ctx.stroke();
      ctx.restore();
      const pulse = 4 + Math.sin(t * 3.4) * 1.4;
      ctx.beginPath(); ctx.arc(edge.x, edge.y, pulse + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(46,230,200,.45)'; ctx.lineWidth = 2; ctx.stroke();
      diamond(this.waypoint.x, this.waypoint.z, '#2ee6c8', 6);
    }

    for (const m of this.markers) {
      if (m.userData.kind === 'mission') star(m.position.x, m.position.z, '#ffd27a', 6);
      if (m.userData.kind === 'rp') diamond(m.position.x, m.position.z, '#2ee6c8', 5);
      if (m.userData.kind === 'garage') diamond(m.position.x, m.position.z, '#b58cff', 4);
    }
    for (const v of this.vehicles) if (v.isPolice && !v.destroyed) dot(v.pos.x, v.pos.z, '#5cc8ff', 4);
    for (const c of this.cops) if (!c.dead) dot(c.pos.x, c.pos.z, '#5cc8ff', 4);
    if (this._targetCar) dot(this._targetCar.pos.x, this._targetCar.pos.z, '#ff8a5c', 6);

    // Player arrow: canvas up maps to world +z, so heading = PI - yaw.
    ctx.save();
    ctx.translate(half, half);
    ctx.rotate(Math.PI - p.yaw);
    ctx.shadowColor = 'rgba(255,196,107,.9)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -15); ctx.lineTo(10, 11); ctx.lineTo(0, 6); ctx.lineTo(-10, 11); ctx.closePath();
    ctx.fillStyle = '#ffc46b'; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();

    // Compass ticks around the rim.
    ctx.save();
    ctx.translate(half, half);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const major = i % 6 === 0;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (radius - (major ? 9 : 4)), Math.sin(a) * (radius - (major ? 9 : 4)));
      ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
      ctx.strokeStyle = major ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.2)';
      ctx.lineWidth = major ? 2 : 1;
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();

    ctx.beginPath(); ctx.arc(half, half, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; ctx.stroke();
  }

  /* ============================================================
     MAP
     ============================================================ */
  openMap() {
    if (this.mode === 'attract' || this.resultOpen || this.dialogueActive) return;
    this.mapOpen = true;
    this.paused = false;
    $('pause-menu').classList.add('hidden');
    $('map-overlay').classList.remove('hidden');
    this.mapView = this.mapView || { x: 0, z: 0, zoom: 1 };
    if (this.player) { this.mapView.x = this.player.pos.x; this.mapView.z = this.player.pos.z; }
    this.drawFullMap();
    document.exitPointerLock && document.exitPointerLock();
  }

  closeMap() {
    this.mapOpen = false;
    $('map-overlay').classList.add('hidden');
    this._last = performance.now();
  }

  _zoomMap(f) {
    if (!this.mapView) this.mapView = { x: 0, z: 0, zoom: 1 };
    this.mapView.zoom = clamp(this.mapView.zoom * f, 0.65, 4.5);
    this.drawFullMap();
  }

  _setWaypointFromScreen(clientX, clientY) {
    const cv = $('fullmap');
    if (!cv || !this.mapView) return;
    const rect = cv.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const u = clamp((clientX - rect.left) / rect.width, 0, 1);
    const v = clamp((clientY - rect.top) / rect.height, 0, 1);
    const W = cv.width, H = cv.height;
    const z = this.mapView.zoom;
    const px = (this.mapView.x + 1000) / 2000 * W;
    const pz = (this.mapView.z + 1000) / 2000 * H;
    const mx = (u * W - W / 2) / z + px;
    const my = (v * H - H / 2) / z + pz;
    const wx = mx / W * 2000 - 1000;
    const wz = my / H * 2000 - 1000;
    this.waypoint = {
      x: clamp(wx, -980, 1520),
      z: clamp(wz, -980, 980)
    };
    this.drawFullMap();
    this._autosave();
    this.audio.play('ui');
    this.notify('PONTO MARCADO', 'Rota criada até o ponto no mapa. Toque em LIMPAR para remover.', 'good');
  }

  _clearWaypoint() {
    if (!this.waypoint) return;
    this.waypoint = null;
    this.drawFullMap();
    this._autosave();
    this.audio.play('ui-back');
  }

  _waypointDistance() {
    if (!this.waypoint || !this.player) return 0;
    return Math.hypot(this.waypoint.x - this.player.pos.x, this.waypoint.z - this.player.pos.z);
  }

  drawFullMap() {
    const cv = $('fullmap');
    const p = this.player;
    if (!cv || !this.mapView) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const z = this.mapView.zoom;
    const px = (this.mapView.x + 1000) / 2000 * W;
    const pz = (this.mapView.z + 1000) / 2000 * H;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-px, -pz);
    ctx.drawImage(this.world.mapCanvas, 0, 0, W, H);

    const worldToMap = (x, zz) => ({ x: (x + 1000) / 2000 * W, y: (zz + 1000) / 2000 * H });
    const dot = (x, zz, color, r) => {
      const s = worldToMap(x, zz);
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2; ctx.stroke();
    };

    // Animated route from the player to the active objective.
    if (this._objectivePos && p) {
      const a = worldToMap(p.pos.x, p.pos.z);
      const b = worldToMap(this._objectivePos.x, this._objectivePos.z);
      ctx.save();
      ctx.setLineDash([16, 12]);
      ctx.lineDashOffset = -performance.now() / 55;
      ctx.strokeStyle = 'rgba(255,196,107,.9)';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.restore();
    }

    // Custom waypoint route and marker.
    if (this.waypoint) {
      const b = worldToMap(this.waypoint.x, this.waypoint.z);
      if (p) {
        const a = worldToMap(p.pos.x, p.pos.z);
        ctx.save();
        ctx.setLineDash([14, 10]);
        ctx.lineDashOffset = -performance.now() / 42;
        ctx.strokeStyle = 'rgba(46,230,200,.92)';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.restore();
      }
      const pulse = 11 + Math.sin(performance.now() / 260) * 3;
      ctx.beginPath(); ctx.arc(b.x, b.y, pulse + 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(46,230,200,.5)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.save();
      ctx.translate(b.x, b.y); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#2ee6c8';
      ctx.fillRect(-10, -10, 20, 20);
      ctx.strokeStyle = '#062026'; ctx.lineWidth = 3; ctx.strokeRect(-10, -10, 20, 20);
      ctx.restore();
    }

    for (const m of this.markers) {
      if (m.userData.kind === 'mission') dot(m.position.x, m.position.z, '#ffd27a', 9);
      if (m.userData.kind === 'rp') dot(m.position.x, m.position.z, '#2ee6c8', 7);
      if (m.userData.kind === 'garage') dot(m.position.x, m.position.z, '#b58cff', 6);
    }
    if (this._objectivePos) dot(this._objectivePos.x, this._objectivePos.z, '#ffc46b', 9);
    for (const v of this.vehicles) if (v.isPolice && !v.destroyed) dot(v.pos.x, v.pos.z, '#5cc8ff', 6);
    ctx.restore();

    const wrap = document.querySelector('.map-canvas-wrap');
    const rect = cv.getBoundingClientRect();
    const wrapRect = wrap ? wrap.getBoundingClientRect() : rect;
    const playerEl = $('map-player');
    if (playerEl && p) {
      const s = { x: (p.pos.x + 1000) / 2000 * W, y: (p.pos.z + 1000) / 2000 * H };
      const tx = (s.x - px) * z + W / 2;
      const ty = (s.y - pz) * z + H / 2;
      const sx = (rect.left - wrapRect.left) + tx / W * rect.width;
      const sy = (rect.top - wrapRect.top) + ty / H * rect.height;
      playerEl.style.display = 'block';
      playerEl.style.left = sx + 'px';
      playerEl.style.top = sy + 'px';
      playerEl.style.transform = `translate(-50%,-50%) rotate(${Math.PI - p.yaw}rad)`;
    }
    const zl = $('map-zoom-level');
    if (zl) zl.textContent = z.toFixed(1) + '×';
    const wp = $('map-wp');
    const wpClear = $('map-wp-clear');
    if (wp) {
      wp.hidden = !this.waypoint;
      if (this.waypoint) wp.textContent = 'PONTO • ' + Math.round(this._waypointDistance()) + ' m';
    }
    if (wpClear) wpClear.classList.toggle('hidden', !this.waypoint);
    this._updateMapMissions();
  }

  _updateMapMissions() {
    const el = $('map-missions');
    if (!el) return;
    el.innerHTML = '<h3>MISSÕES</h3>';
    MISSIONS.forEach((m, i) => {
      const done = this.completed.has(m.id);
      const active = this.mission && this.mission.def.id === m.id;
      const prevDone = i === 0 || this.completed.has(MISSIONS[i - 1].id);
      const row = document.createElement('div');
      row.className = 'map-mission-row';
      row.innerHTML = `<b>${m.num}. ${m.title}</b><span>${active ? 'ATIVA' : done ? 'CONCLUÍDA' : prevDone ? 'DISPONÍVEL' : 'BLOQUEADA'}</span>`;
      el.appendChild(row);
    });
  }

  /* ============================================================
     PAUSE / SWITCH / OVERLAYS
     ============================================================ */
  togglePause(force) {
    if (this.mode === 'attract') return;
    const want = force === undefined ? !this.paused : force;
    if (want && (this.dialogueActive || this.mapOpen || this.resultOpen)) return;
    this.paused = want;
    const el = $('pause-menu');
    if (el) el.classList.toggle('hidden', !want);
    if (want) {
      if (this._touchFireTimer) { clearInterval(this._touchFireTimer); this._touchFireTimer = null; }
      this.input.aim = false; this.input.sprint = false; this.input.lookBack = false;
      this._populatePause();
      document.exitPointerLock && document.exitPointerLock();
      this.audio.play('ui-back');
    } else {
      this._last = performance.now();
      this.audio.play('ui');
    }
  }

  _populatePause() {
    const p = this.player;
    if (!p) return;
    const isL = p.charId === 'luiza';
    const pc = $('pause-char');
    if (pc) pc.innerHTML = `<svg><use href="#portrait-${isL ? 'luiza' : 'carlos'}"/></svg>`;
    $('pause-char-name').textContent = isL ? 'LUIZA' : 'CARLOS';
    $('pause-char-role').textContent = isL ? 'A VOZ DA ORLA' : 'O BRAÇO DO MORRO';
    $('pause-money').textContent = 'R$ ' + Math.floor(p.money).toLocaleString('pt-BR');
    $('pause-wanted').textContent = this.wanted ? this.wanted + ' / 6' : 'Limpo';
    $('pause-missions').textContent = this.completed.size + ' / 5';
    $('pause-time').textContent = this._formatTime(this.playtime || 0);
    const list = $('pause-mission-list');
    if (list) {
      list.innerHTML = '';
      MISSIONS.forEach((m, i) => {
        const done = this.completed.has(m.id);
        const prevDone = i === 0 || this.completed.has(MISSIONS[i - 1].id);
        const available = !done && prevDone;
        const row = document.createElement('div');
        row.className = 'pm-row' + (done ? ' done' : available ? ' available' : '');
        row.innerHTML = `<i class="pm-dot"></i><b>${String(m.num).padStart(2, '0')} · ${m.title}</b><em>${done ? 'CONCLUÍDA' : available ? 'DISPONÍVEL' : 'BLOQUEADA'}</em>`;
        list.appendChild(row);
      });
    }
  }

  openSwitch() {
    if (this.mode === 'attract' || this.paused || this.mapOpen || this.resultOpen || this.dialogueActive) return;
    if (this.mission) {
      const step = this.mission.def.steps[this.mission.step];
      if (!step || step.type !== 'switch') {
        this.notify('MISSÃO EM ANDAMENTO', 'Não é possível trocar de personagem agora.', 'bad');
        return;
      }
    }
    const el = $('switch-overlay');
    if (!el) return;
    el.classList.remove('hidden');
    document.querySelectorAll('.switch-card').forEach((c) => {
      c.classList.toggle('active', c.dataset.char === this.player.charId);
    });
    const note = $('switch-note');
    if (note) note.textContent = this.mission ? 'Escolha Carlos para continuar a missão' : 'Troca instantânea • TAB ou ESC para voltar';
    this.audio.play('ui');
  }

  _switchTo(id) {
    if (!this.player || !id) return;
    if (this.player.charId === id) {
      this.closeOverlay('switch-overlay');
      return;
    }
    this.setCharacter(id, false);
    this.closeOverlay('switch-overlay');
    if (this.mission) {
      const step = this.mission.def.steps[this.mission.step];
      if (step && step.type === 'switch' && step.char === id) {
        setTimeout(() => this._advanceStep(), 450);
      }
    }
  }

  closeOverlay(id) {
    const el = $(id);
    if (el) el.classList.add('hidden');
    if (id === 'map-overlay') this.mapOpen = false;
    if (id === 'pause-menu') this.paused = false;
    if (id === 'switch-overlay') this._last = performance.now();
  }

  _hideAllOverlays() {
    const ids = ['map-overlay', 'pause-menu', 'settings-modal', 'missions-modal', 'rp-modal',
      'char-select', 'switch-overlay', 'mission-result', 'download-modal', 'credits-modal', 'tutorial'];
    for (const id of ids) {
      const el = $(id);
      if (el) el.classList.add('hidden');
    }
    this.mapOpen = false;
    this.paused = false;
    this.resultOpen = false;
    document.body.classList.remove('dialogue-open');
  }

  saveGame() {
    this._autosave();
    this.notify('JOGO SALVO', 'Seu progresso foi gravado neste dispositivo.', 'good');
    this.audio.play('checkpoint');
  }

  /* ============================================================
     POLICE CAR AI
     ============================================================ */
  _updatePoliceCars(dt) {
    const p = this.player;
    if (!p || this.wanted <= 0) return;
    for (const v of this.vehicles) {
      if (!v.isPolice || v.destroyed || v.driver !== 'police') continue;
      const to = new THREE.Vector3().subVectors(p.pos, v.pos);
      const d = to.length();
      if (d < 1) continue;
      to.normalize();
      const targetAngle = Math.atan2(to.x, to.z);
      let diff = ((targetAngle - v.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      v.angle += clamp(diff, -1, 1) * Math.min(1, dt * 2.2);
      const chaseSpeed = d > 16 ? 24 : d > 7 ? 12 : 0;
      v.speed += (chaseSpeed - v.speed) * Math.min(1, dt * 2.4);
      const nx = v.pos.x + Math.sin(v.angle) * v.speed * dt;
      const nz = v.pos.z + Math.cos(v.angle) * v.speed * dt;
      const res = this.world.resolveCircle(nx, nz, 1.6);
      v.pos.x = res.x; v.pos.z = res.z;
      v.pos.y = this.world.groundHeight(v.pos.x, v.pos.z);
      if (d < 6 && !p.dead) {
        if (p.inVehicle) {
          p.inVehicle.speed *= 0.985;
          if (Math.random() < dt * 0.8) this._damagePlayer(rand(3, 6), 'viatura');
        } else if (Math.random() < dt * 0.5) {
          this._damagePlayer(rand(2, 5), 'viatura');
        }
      }
      if (this.world.isWater(v.pos.x, v.pos.z)) {
        v.pos.x = Math.min(v.pos.x, SHORE_X - 15);
        v.speed = 0;
      }
    }
  }
}

export { MISSIONS };
