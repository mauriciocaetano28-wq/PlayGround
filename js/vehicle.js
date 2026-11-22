import { THREE } from './world-utils.js';

export const CAR_NAMES = [
  'GOL QUADRADO', 'UNO COM ESCADA', 'FUSCA AZUL', 'KOMBI', 'PALIO', 'CELTA', 'BMW LUXO', 'LAMBORGHINI', 'FERRARI',
  'VIATURA PM', 'VIATURA FEDERAL', 'POLÍCIA RODOVIÁRIA', 'AMBULÂNCIA', 'BOMBEIRO', 'ÔNIBUS', 'CAMINHÃO', 'CAMINHÃO DE LIXO',
  'MOTO CG 160', 'MOTO ESPORTIVA', 'MOTO POLÍCIA', 'BICICLETA', 'HELICÓPTERO PM', 'HELICÓPTERO DE LUXO', 'AVIÃO', 'BARCO',
  'JET SKI', 'TRATOR', 'TREM', 'GOL TURBO', 'CAIO MOBILE'
];

export class Vehicle {
  constructor(game, opts = {}) {
    this.game = game;
    this.scene = game.scene;
    this.name = opts.name || 'GOL QUADRADO';
    this.color = opts.color ?? 0xd8d4c8;
    this.type = opts.type || 'popular';
    this.position = new THREE.Vector3(opts.x ?? 24, 0, opts.z ?? 42);
    this.heading = opts.heading ?? 0;
    this.speed = 0;
    this.steer = 0;
    this.fuel = 100;
    this.damage = 0;
    this.gear = 0;
    this.rpm = 800;
    this.nitro = 100;
    this.maxSpeed = this.type === 'sport' ? 96 : this.type === 'luxury' ? 74 : 55;
    this.engineOn = false;
    this.isPolice = !!opts.police;
    this.occupied = false;
    this.exploded = false;
    this.smokeTimer = 0;
    this.wheelSpin = 0;
    this.drift = 0;
    this.cameraInside = false;
    this.build();
  }

  build() {
    const g = new THREE.Group();
    this.group = g;
    const paint = new THREE.MeshStandardMaterial({ color: this.color, metalness: .65, roughness: .28, envMapIntensity: 1.25 });
    this.paintMat = paint;
    const dark = new THREE.MeshStandardMaterial({ color: 0x14181e, roughness: .6, metalness: .3 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x163247, metalness: .55, roughness: .06, transparent: true, opacity: .78, envMapIntensity: 1.6 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, .58, 4.35), paint);
    body.position.y = .68; body.castShadow = true; body.receiveShadow = true; g.add(body);
    const lower = new THREE.Mesh(new THREE.BoxGeometry(1.94, .26, 4.1), dark);
    lower.position.y = .38; lower.castShadow = true; g.add(lower);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.78, .16, 1.28), paint);
    hood.position.set(0, .99, 1.38); hood.rotation.x = -.06; g.add(hood);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, .56, 1.9), glass);
    cabin.position.set(0, 1.16, -.1); cabin.castShadow = true; g.add(cabin);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.48, .1, 1.7), paint);
    roof.position.set(0, 1.46, -.12); g.add(roof);
    const pillarMat = new THREE.MeshStandardMaterial({ color: this.color, metalness: .5, roughness: .35 });
    for (const sx of [-.76, .76]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(.06, .5, .1), pillarMat);
      p.position.set(sx, 1.16, .78); g.add(p);
    }
    // faróis
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfff4c8, emissive: 0xffe6a8, emissiveIntensity: .4, roughness: .2 });
    this.headMat = headMat;
    for (const sx of [-.62, .62]) {
      const h = new THREE.Mesh(new THREE.BoxGeometry(.46, .18, .08), headMat);
      h.position.set(sx, .73, 2.2); g.add(h);
    }
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2b35, emissive: 0xff1a25, emissiveIntensity: .8, roughness: .3 });
    this.tailMat = tailMat;
    for (const sx of [-.64, .64]) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(.4, .16, .06), tailMat);
      t.position.set(sx, .73, -2.2); g.add(t);
    }
    // rodas
    const wheelGeo = new THREE.CylinderGeometry(.37, .37, .28, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.MeshStandardMaterial({ color: 0x0d0d10, roughness: .9 });
    const rim = new THREE.MeshStandardMaterial({ color: 0x9da6ad, metalness: .9, roughness: .25 });
    this.wheels = [];
    for (const [sx, sz] of [[-.93, 1.35], [.93, 1.35], [-.93, -1.35], [.93, -1.35]]) {
      const wg = new THREE.Group();
      const w = new THREE.Mesh(wheelGeo, tire); w.castShadow = true; wg.add(w);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .3, 10), rim); hub.rotation.z = Math.PI / 2; wg.add(hub);
      wg.position.set(sx, .39, sz); g.add(wg); this.wheels.push(wg);
    }
    // placa
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(.72, .2), new THREE.MeshBasicMaterial({ color: 0xe7edf0 }));
    plate.position.set(0, .5, -2.21); plate.rotation.y = Math.PI; g.add(plate);

    if (this.type === 'sport' || this.type === 'luxury') {
      const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.5, .07, .35), dark);
      spoiler.position.set(0, 1.13, -2.0); g.add(spoiler);
      for (const sx of [-.55, .55]) {
        const sup = new THREE.Mesh(new THREE.BoxGeometry(.07, .25, .1), dark);
        sup.position.set(sx, .99, -2.0); g.add(sup);
      }
    }

    if (this.isPolice) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, .18, .3), dark);
      bar.position.set(0, 1.58, -.1); g.add(bar);
      this.redLight = new THREE.Mesh(new THREE.BoxGeometry(.45, .14, .24), new THREE.MeshBasicMaterial({ color: 0xff2030 }));
      this.redLight.position.set(-.32, 1.62, -.1); g.add(this.redLight);
      this.blueLight = new THREE.Mesh(new THREE.BoxGeometry(.45, .14, .24), new THREE.MeshBasicMaterial({ color: 0x2a6bff }));
      this.blueLight.position.set(.32, 1.62, -.1); g.add(this.blueLight);
      this.sirenLight = new THREE.PointLight(0xff2030, 0, 20, 2);
      this.sirenLight.position.set(0, 2, 0); g.add(this.sirenLight);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.96, .2, 2.8), new THREE.MeshStandardMaterial({ color: 0x0d1b33, roughness: .6 }));
      stripe.position.set(0, .72, 0); g.add(stripe);
    }

    // luzes reais
    this.headlight = new THREE.SpotLight(0xffedb8, 0, 70, Math.PI / 5, .5, 1.5);
    this.headlight.position.set(0, .9, 2.2);
    this.headlight.target.position.set(0, 0, 25);
    g.add(this.headlight); g.add(this.headlight.target);
    this.underglow = new THREE.PointLight(this.isPolice ? 0x2f6bff : 0x40c8ff, 0, 8, 2);
    this.underglow.position.set(0, .3, 0); g.add(this.underglow);

    // fumaça
    this.smoke = new THREE.Mesh(new THREE.SphereGeometry(.5, 7, 5), new THREE.MeshBasicMaterial({ color: 0x777777, transparent: true, opacity: 0 }));
    this.smoke.position.set(0, 1.2, 1.3); g.add(this.smoke);
    this.fire = new THREE.Mesh(new THREE.SphereGeometry(.35, 7, 5), new THREE.MeshBasicMaterial({ color: 0xff7a1e, transparent: true, opacity: 0 }));
    this.fire.position.set(0, 1.1, 1.3); g.add(this.fire);

    g.position.copy(this.position);
    g.rotation.y = this.heading;
    this.scene.add(g);
  }

  setColor(hex) {
    this.color = hex;
    this.paintMat.color.setHex(hex);
  }

  enter() {
    this.occupied = true;
    this.engineOn = true;
    this.game.audio.startEngine();
  }
  exit() {
    this.occupied = false;
    this.engineOn = false;
    this.speed = 0;
    this.game.audio.stopEngine();
  }

  repair() {
    this.damage = 0; this.exploded = false;
    this.smoke.material.opacity = 0; this.fire.material.opacity = 0;
    this.group.visible = true;
  }
  refuel() { this.fuel = 100; }
  paint(hex) { this.setColor(hex); this.damage = 0; }

  damageBy(v) {
    if (this.exploded) return;
    this.damage = Math.min(120, this.damage + v);
    if (this.damage > 75 && Math.random() < .2) this.game.audio.crash();
    if (this.damage >= 120 && this.occupied) this.explode();
  }

  explode() {
    if (this.exploded) return;
    this.exploded = true;
    this.game.audio.explosion();
    this.game.spawnExplosion(this.position);
    this.fire.material.opacity = .9;
    this.smoke.material.opacity = .8;
    this.speed = 0;
    this.engineOn = false;
    this.game.player.takeDamage(55, 'explosão');
    if (this.occupied) {
      this.game.notify('O carro explodiu! Saia rápido!');
      setTimeout(() => { if (this.occupied) this.game.exitCar(true); }, 900);
    }
  }

  update(dt, input) {
    const p = this.game.player;
    this.smokeTimer += dt;
    // luzes
    const night = this.game.world.night || 0;
    const lightsOn = night > .3 || this.game.world.weather === 'chuva';
    this.headMat.emissiveIntensity = lightsOn ? 2.4 : .2;
    this.tailMat.emissiveIntensity = input.brake ? 2.5 : .7;
    this.headlight.intensity = lightsOn ? 55 : 0;
    this.underglow.intensity = this.game.settings.quality === 'high' ? .8 : 0;

    if (this.exploded) {
      this.fire.material.opacity = .7 + Math.sin(performance.now() * .01) * .2;
      this.fire.scale.setScalar(1 + Math.sin(performance.now() * .013) * .3);
      return;
    }

    const throttle = input.accelerate ? 1 : 0;
    const brake = input.brake ? 1 : 0;
    const steerInput = input.steer || 0;
    const nitro = input.nitro && this.nitro > 0;
    const handbrake = input.handbrake;

    if (this.fuel <= 0) { this.engineOn = false; }
    else if (this.occupied) {
      this.engineOn = true;
      this.fuel = Math.max(0, this.fuel - dt * (.07 + Math.abs(this.speed) * .0035 + throttle * .05));
    }

    if (this.engineOn && this.fuel > 0) {
      if (throttle) {
        const accel = this.type === 'sport' ? 23 : this.type === 'luxury' ? 17 : 13;
        this.speed += accel * (nitro ? 1.8 : 1) * dt;
        this.nitro = Math.max(0, this.nitro - (nitro ? 22 : 0) * dt);
      }
      if (brake) {
        if (this.speed > .6) this.speed -= 30 * dt;
        else this.speed = Math.max(-13, this.speed - 7 * dt);
      }
      if (!throttle && !brake) this.speed *= Math.pow(.55, dt);
      if (handbrake) this.speed *= Math.pow(.22, dt);
      if (this.speed > this.maxSpeed * (nitro ? 1.25 : 1)) this.speed *= .985;
      if (this.speed < -14) this.speed = -14;
    } else {
      this.speed *= Math.pow(.35, dt);
    }

    const steerFactor = Math.min(1, Math.abs(this.speed) / 4);
    const turnRate = (this.speed >= 0 ? 1 : -1) * steerInput * (1.55 + Math.min(1.5, Math.abs(this.speed) / 22)) * steerFactor;
    this.heading -= turnRate * dt * (handbrake ? 1.5 : 1);
    this.steer += (steerInput - this.steer) * Math.min(1, dt * 8);

    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const nextX = this.position.x + forward.x * this.speed * dt;
    const nextZ = this.position.z + forward.z * this.speed * dt;
    const obs = this.game.world.collideCircle(nextX, nextZ, 1.25);
    if (obs) {
      this.speed *= -.22;
      this.damageBy(Math.abs(this.speed) * .8 + 2);
      this.game.audio.crash();
      if (Math.abs(this.speed) > 12) this.game.notify('Batida forte! O carro está amassado.');
    } else {
      this.position.x = nextX; this.position.z = nextZ;
    }
    if (this.position.x > 680) { this.position.x = 680; this.speed *= -.2; }
    if (this.position.x < -690) { this.position.x = -690; this.speed *= -.2; }
    if (this.position.z > 690) { this.position.z = 690; this.speed *= -.2; }
    if (this.position.z < -690) { this.position.z = -690; this.speed *= -.2; }

    // atropelamentos
    if (Math.abs(this.speed) > 3.5) {
      const near = this.game.world.peds.nearby(this.position.x, this.position.z, 2.3);
      if (near.length) {
        if (!this._hitPedCooldown || performance.now() - this._hitPedCooldown > 1000) {
          this._hitPedCooldown = performance.now();
          this.game.onPedHit(near[0]);
          this.speed *= .82;
          this.damageBy(2);
        }
      }
    }

    // marchas e RPM
    const kmh = Math.abs(this.speed) * 3.6;
    this.gear = this.speed < -.5 ? -1 : Math.min(6, Math.max(0, Math.floor(kmh / 42) + 1));
    const gearBase = Math.max(0, (kmh - (this.gear - 1) * 42) / 42);
    this.rpm = 800 + gearBase * 6200 + (throttle ? 500 : 0);
    this.wheelSpin += this.speed * dt * 2.2;
    this.wheels.forEach((w, i) => {
      w.rotation.x = this.wheelSpin;
      if (i < 2) w.rotation.y = this.steer * .45;
    });

    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;
    this.group.rotation.z = this.steer * -0.025 * Math.min(1, Math.abs(this.speed) / 20);

    if (this.isPolice) {
      const t = performance.now() * .008;
      const flash = Math.sin(t) > 0;
      this.redLight.material.color.setHex(flash ? 0xff2030 : 0x30060a);
      this.blueLight.material.color.setHex(flash ? 0x101830 : 0x2a6bff);
      this.sirenLight.color.setHex(flash ? 0xff2030 : 0x2a6bff);
      this.sirenLight.intensity = 3;
    }

    if (this.damage > 55) {
      this.smoke.material.opacity = Math.min(.55, (this.damage - 55) / 50);
      this.smoke.position.y = 1.3 + (this.smokeTimer % 1) * 1.6;
      this.smoke.scale.setScalar(1 + (this.smokeTimer % 1) * 1.5);
      if (this.damage > 92) {
        this.fire.material.opacity = .6 + Math.sin(performance.now() * .015) * .2;
        this.fire.scale.setScalar(1 + Math.sin(performance.now() * .011) * .25);
      }
    } else {
      this.smoke.material.opacity = 0;
      this.fire.material.opacity = 0;
    }

    this.game.audio.updateEngine(Math.abs(this.speed) * 3.6, this.rpm, throttle);
  }

  get speedKmh() { return Math.round(Math.abs(this.speed) * 3.6); }
  get gearLabel() { return this.gear <= 0 ? (this.speed < -.3 ? 'R' : 'N') : String(this.gear); }
}
