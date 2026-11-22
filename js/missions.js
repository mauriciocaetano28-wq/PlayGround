import { THREE, rand, pick } from './world-utils.js';

const MISSION_NAMES = [
  ['Tutorial', 'Aprenda a andar e dirigir', 'tutorial', 250],
  ['Roubo na Oficina', 'Leve o carro roubado para a oficina', 'delivery', 800],
  ['Fuga de 1 Estrela', 'Fuja da polícia e perca a perseguição', 'chase', 900],
  ['Pizza em 10 Casas', 'Entregue as pizzas antes que esfrie', 'delivery', 1200],
  ['Assalto ao Banco', 'Pegue R$ 100.000 e fuja de helicóptero', 'combat', 100000],
  ['Corrida na Favela', 'Vença a corrida de rua', 'race', 5000],
  ['Resgate no Prédio', 'Salve o refém no alto do prédio', 'combat', 3500],
  ['Entrega Clandestina', 'Entregue a encomenda sem ser visto', 'delivery', 1800],
  ['Carro de Luxo', 'Sequestre o carro de luxo do bairro rico', 'delivery', 4200],
  ['Joalheria', 'Roube a joalheria do centro', 'combat', 6500],
  ['Fuga do Morro', 'Saia da favela com a polícia atrás', 'chase', 3000],
  ['Proteja a Favela', 'Proteja a comunidade do ataque rival', 'combat', 5500],
  ['Grau na Moto', 'Faça manobras e vença a corrida', 'race', 2800],
  ['Táxi do Caio', 'Leve 10 passageiros', 'delivery', 2200],
  ['Uber BR', 'Leve 10 passageiros com estilo', 'delivery', 2400],
  ['iFood Turbinado', 'Entregue 10 lanches na cidade', 'delivery', 2100],
  ['Polícia Federal', 'Prenda 10 ladrões procurados', 'combat', 7000],
  ['Bombeiro Herói', 'Apague 5 incêndios', 'delivery', 3200],
  ['Ambulância 192', 'Salve 5 pessoas', 'delivery', 3400],
  ['Caça ao Tesouro', 'Encontre 10 tesouros escondidos', 'collect', 4500],
  ['Chefe da Favela', 'Enfrente o chefe do morro', 'combat', 9000],
  ['Chefe do Morro', 'Tiroteio gigante na laje', 'combat', 12000],
  ['Chefe Final', 'Tanque, helicóptero e explosão', 'combat', 50000],
  ['Corrida do Porto', 'Corra entre os containers', 'race', 3800],
  ['Entrega no Aeroporto', 'Leve a mala sem perder o voo', 'delivery', 2600],
  ['Salva-vidas', 'Resgate o banhista no mar', 'delivery', 2200],
  ['Trator da Roça', 'Leve o trator para a fazenda', 'delivery', 1900],
  ['Mansão Assombrada', 'Investigue a mansão do bairro rico', 'combat', 4800],
  ['Contrabando no Porto', 'Proteja a carga dos piratas', 'combat', 7200],
  ['Neblina na Serra', 'Encontre o lobo na montanha', 'combat', 3900],
  ['Fábrica Fantasma', 'Invada a fábrica abandonada', 'combat', 5200],
  ['Yakuza no Japão', 'Enfrente a máfia do bairro japonês', 'combat', 6100],
  ['Racha na Avenida', 'Corrida proibida no centro', 'race', 4400],
  ['Entrega Expressa', '3 entregas em 3 minutos', 'delivery', 3000],
  ['Mototáxi', 'Leve o passageiro até a praia', 'delivery', 1800],
  ['Ônibus Lotado', 'Dirija o ônibus até o ponto final', 'delivery', 2500],
  ['Caminhão de Lixo', 'Faça a coleta do bairro', 'delivery', 2100],
  ['Vigilância da Serra', 'Elimine os caçadores ilegais', 'combat', 4600],
  ['Pescaria no Porto', 'Proteja o pescador', 'combat', 3300],
  ['Desafio do Helicóptero', 'Pouse no heliponto do rico', 'delivery', 5500],
  ['Corrida da Serra', 'Corra pela estrada da montanha', 'race', 4800],
  ['Entrega no Morro', 'Suba a favela com a encomenda', 'delivery', 2900],
  ['Emboscada Industrial', 'Sobreviva à emboscada', 'combat', 6800],
  ['Fuga para a Praia', 'Fuja da polícia até o mar', 'chase', 5200],
  ['Caçador de Recompensas', 'Capture 5 foragidos', 'combat', 7500],
  ['Aeroporto Fechado', 'Escape do aeroporto cercado', 'chase', 8000],
  ['Lenda da Serra', 'Encontre a onça lendária', 'combat', 10000],
  ['Duelo no Centro', 'Duelo de sniper no topo do prédio', 'combat', 8500],
  ['O Último Golpe', 'O assalto definitivo da cidade', 'combat', 100000],
  ['Modo Infinito', 'Missões secundárias infinitas', 'delivery', 1500],
];

const DISTRICTS = [
  { x: 0, z: 0, name: 'Centro' }, { x: -320, z: -250, name: 'Favela' }, { x: 570, z: 0, name: 'Praia' },
  { x: 0, z: -470, name: 'Aeroporto' }, { x: -500, z: 340, name: 'Interior' }, { x: 320, z: 320, name: 'Bairro Rico' },
  { x: 520, z: -330, name: 'Porto' }, { x: -410, z: -470, name: 'Serra' }, { x: 350, z: -170, name: 'Industrial' },
  { x: 170, z: 330, name: 'Japonês' }
];

class Enemy {
  constructor(game, x, z) {
    this.game = game;
    this.health = 45;
    this.dead = false;
    this.lastShot = 0;
    this.group = new THREE.Group();
    const shirt = new THREE.MeshStandardMaterial({ color: pick([0xb51f2b, 0x1d1d22, 0x702f8f]), roughness: .8 });
    const skin = new THREE.MeshStandardMaterial({ color: pick([0x8a5534, 0xb47b4f, 0xd9a273]), roughness: .8 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(.5, .68, .3), shirt); torso.position.y = 1.2; torso.castShadow = true; this.group.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.18, 7, 5), skin); head.position.y = 1.7; this.group.add(head);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(.38, .12, .38), new THREE.MeshStandardMaterial({ color: 0x111111 })); cap.position.y = 1.84; this.group.add(cap);
    for (const sx of [-.15, .15]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(.16, .7, .18), new THREE.MeshStandardMaterial({ color: 0x20242a })); leg.position.set(sx, .55, 0); this.group.add(leg);
    }
    this.group.position.set(x, 0, z);
    game.scene.add(this.group);
    this.position = this.group.position;
  }
  hit(dmg) {
    if (this.dead) return;
    this.health -= dmg;
    if (this.health <= 0) {
      this.dead = true;
      this.game.spawnExplosion(this.position, .35, true);
      this.game.scene.remove(this.group);
      this.game.audio.hit();
      this.game.missions.checkEnemies();
    } else {
      this.group.children[0].material.color.setHex(0xff3333);
      setTimeout(() => { if (this.group.children[0]) this.group.children[0].material.color.setHex(0x551115); }, 100);
    }
  }
  update(dt, player) {
    if (this.dead) return;
    const dx = player.position.x - this.position.x;
    const dz = player.position.z - this.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 10 && dist < 40) {
      this.position.x += dx / dist * dt * 2.4;
      this.position.z += dz / dist * dt * 2.4;
    }
    this.group.rotation.y = Math.atan2(dx, dz);
    if (dist < 34 && performance.now() - this.lastShot > 1400) {
      this.lastShot = performance.now();
      this.game.audio.gunshot();
      this.game.muzzleFlash(this.position.clone().add(new THREE.Vector3(0, 1.4, 0)), new THREE.Vector3(dx, 0, dz).normalize());
      if (Math.random() < .55) player.takeDamage(4, 'tiro');
    }
  }
}

export class MissionSystem {
  constructor(game) {
    this.game = game;
    this.index = -1;
    this.active = null;
    this.enemies = [];
    this.marker = this.buildMarker();
    this.cooldown = 0;
    this.started = false;
    this.missionLimit = MISSION_NAMES.length;
  }

  buildMarker() {
    const g = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.55, 1.9, 22, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd23c, transparent: true, opacity: .1, side: THREE.DoubleSide, depthWrite: false }));
    beam.position.y = 11; g.add(beam);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.95, 1.35, 24), new THREE.MeshBasicMaterial({ color: 0xffd23c, transparent: true, opacity: .75, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .12; g.add(ring);
    const icon = new THREE.Mesh(new THREE.OctahedronGeometry(.55, 0), new THREE.MeshBasicMaterial({ color: 0xffd23c }));
    icon.position.y = 3.6; g.add(icon);
    const light = new THREE.PointLight(0xffc93c, 2, 14, 2); light.position.y = 3; g.add(light);
    g.visible = false;
    this.game.scene.add(g);
    this.beam = beam; this.ring = ring; this.icon = icon;
    return g;
  }

  start(index = null) {
    if (index !== null) this.index = index;
    else this.index++;
    if (this.index >= this.missionLimit) {
      const n = this.index - MISSION_NAMES.length;
      this.index = 49;
      const base = MISSION_NAMES[49];
      const d = pick(DISTRICTS);
      this.active = {
        index: this.index, name: n > 0 ? `Modo Infinito ${n + 1}` : base[0], desc: base[1], type: base[2], reward: 1500 + n * 350,
        district: d, step: 0, steps: 1, target: new THREE.Vector3(d.x + rand(-50, 50), 0, d.z + rand(-50, 50)), timer: 0
      };
    } else {
      const [name, desc, type, reward] = MISSION_NAMES[this.index];
      const d = DISTRICTS[this.index % DISTRICTS.length];
      const steps = type === 'delivery' ? 3 : type === 'race' ? 3 : type === 'collect' ? 3 : 1;
      const target = this.pickTarget(d, this.index);
      this.active = {
        index: this.index, name, desc, type, reward, district: d, step: 0, steps,
        target, timer: 0, timeLimit: type === 'race' ? 80 : 0
      };
    }
    this.clearEnemies();
    this.marker.visible = true;
    this.marker.position.copy(this.active.target);
    if (this.active.type === 'combat') {
      const lvl = this.game.scaleLevel || 1;
      const baseCount = this.active.index >= 22 ? 6 : 3;
      this.spawnEnemies(this.active.target, Math.round(baseCount * (1 + (lvl - 1) * 2)));
    }
    if (this.active.type === 'chase') { this.game.police.setWanted(Math.max(1, this.game.player.wanted)); }
    this.updateHUD();
    this.game.audio.speak(`${this.active.name}. ${this.active.desc}`);
    this.game.notify(`NOVA MISSÃO: ${this.active.name}`);
    this.started = true;
  }

  pickTarget(d, seed) {
    const a = (seed * 2.399 + 1.2) % (Math.PI * 2);
    const r = 55 + (seed % 4) * 25;
    let x = d.x + Math.cos(a) * r;
    let z = d.z + Math.sin(a) * r;
    if (this.game.world.collideCircle(x, z, 3)) { x = d.x; z = d.z + 24; }
    return new THREE.Vector3(x, 0, z);
  }

  spawnEnemies(target, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, r = rand(5, 18);
      this.enemies.push(new Enemy(this.game, target.x + Math.cos(a) * r, target.z + Math.sin(a) * r));
    }
    this.game.notify(`${count} inimigos na área!`);
  }

  clearEnemies() {
    this.enemies.forEach(e => { if (!e.dead) this.game.scene.remove(e.group); });
    this.enemies = [];
  }

  checkEnemies() {
    if (!this.active || this.active.type !== 'combat') return;
    if (this.enemies.every(e => e.dead)) this.complete();
  }

  update(dt) {
    if (!this.active) return;
    this.active.timer += dt;
    this.icon.rotation.y += dt * 1.2;
    this.ring.scale.setScalar(1 + Math.sin(performance.now() * .004) * .12);
    this.beam.material.opacity = .12 + Math.sin(performance.now() * .003) * .05;
    this.enemies.forEach(e => e.update(dt, this.game.player));

    if (this.active.type === 'combat') {
      if (this.enemies.length && this.enemies.every(e => e.dead)) this.complete();
      return;
    }
    if (this.active.type === 'chase') {
      if (this.game.player.wanted === 0) this.complete();
      return;
    }
    const p = this.game.player;
    const d = Math.hypot(p.position.x - this.active.target.x, p.position.z - this.active.target.z);
    if (d < 4.2) {
      this.active.step++;
      if (this.active.step >= this.active.steps) this.complete();
      else {
        this.active.target = this.pickTarget(this.active.district, this.active.step + this.index * 2 + 3);
        this.marker.position.copy(this.active.target);
        this.updateHUD();
        this.game.audio.cash();
        this.game.notify(`Ponto ${this.active.step}/${this.active.steps} concluído!`);
      }
    }
    if (this.active.timeLimit && this.active.timer > this.active.timeLimit) {
      this.game.notify('Tempo esgotado! Missão reiniciada.');
      this.active.timer = 0;
    }
  }

  complete() {
    if (!this.active || this.active.completed) return;
    this.active.completed = true;
    const reward = this.active.reward;
    this.game.player.addMoney(reward);
    this.marker.visible = false;
    this.clearEnemies();
    this.game.audio.cash();
    this.game.audio.speak(`Missão concluída. Você ganhou ${reward} reais.`);
    this.game.onMissionComplete(this.active, reward);
    this.cooldown = 6;
    setTimeout(() => {
      if (!this.game.dead) this.start();
    }, 6500);
  }

  updateHUD() {
    if (!this.active) return;
    const a = this.active;
    this.game.setMissionHUD(a);
  }

  get target() { return this.active ? this.active.target : null; }
}
