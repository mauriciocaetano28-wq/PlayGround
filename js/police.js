import { THREE, rand, clamp } from './world-utils.js';
import { Vehicle } from './vehicle.js';

export class PoliceSystem {
  constructor(game) {
    this.game = game;
    this.units = [];
    this.helicopter = null;
    this.tank = null;
    this.arrestTimer = 0;
    this.shootTimer = 2;
    this.lastCrime = 0;
    this.decayTimer = 0;
    this.active = false;
  }

  setWanted(level) {
    const p = this.game.player;
    const newLevel = clamp(Math.round(level), 0, 6);
    if (newLevel > p.wanted) this.lastCrime = performance.now();
    p.wanted = newLevel;
    this.game.ui.buildWanted();
    if (newLevel === 0) this.clear();
    else {
      this.active = true;
      this.ensureUnits(newLevel);
      this.game.audio.sirenStart();
    }
  }

  ensureUnits(stars) {
    const carCount = stars <= 1 ? 1 : stars <= 2 ? 2 : stars <= 4 ? 3 : 5;
    while (this.units.length < carCount) this.spawnCar();
    if (stars >= 3 && !this.helicopter) this.spawnHelicopter();
    if (stars >= 5 && !this.tank) this.spawnTank();
  }

  spawnCar() {
    const p = this.game.player;
    const a = Math.random() * Math.PI * 2;
    const dist = rand(45, 75);
    const x = clamp(p.position.x + Math.cos(a) * dist, -650, 650);
    const z = clamp(p.position.z + Math.sin(a) * dist, -650, 650);
    const car = new Vehicle(this.game, { police: true, x, z, name: 'VIATURA PM', color: 0x101c30, type: 'luxury' });
    car.aiSpeed = rand(14, 22);
    car.aiShoot = rand(1, 3);
    car.heading = Math.atan2(p.position.x - x, p.position.z - z);
    this.units.push(car);
    this.game.notify('Polícia na área!');
  }

  spawnHelicopter() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(2.4, 10, 7), new THREE.MeshStandardMaterial({ color: 0x13233b, metalness: .4, roughness: .4 }));
    body.scale.set(1, .8, 1.6); g.add(body);
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(.28, .16, 8, 6), new THREE.MeshStandardMaterial({ color: 0x13233b }));
    boom.rotation.x = Math.PI / 2; boom.position.z = -6; g.add(boom);
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(18, .08, .4), new THREE.MeshStandardMaterial({ color: 0x20262d }));
    rotor.position.y = 2.8; g.add(rotor);
    const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(.08, 3.5, .4), new THREE.MeshStandardMaterial({ color: 0x20262d }));
    tailRotor.position.set(0, 0, -10); g.add(tailRotor);
    const light = new THREE.SpotLight(0xdfefff, 80, 90, .38, .45, 1);
    light.position.set(0, 0, 2); light.target.position.set(0, -20, 20); g.add(light, light.target);
    const red = new THREE.Mesh(new THREE.SphereGeometry(.18, 6, 5), new THREE.MeshBasicMaterial({ color: 0xff2030 }));
    red.position.set(0, -1, 2); g.add(red);
    const blue = new THREE.Mesh(new THREE.SphereGeometry(.18, 6, 5), new THREE.MeshBasicMaterial({ color: 0x2a6bff }));
    blue.position.set(0, -1, -2); g.add(blue);
    g.position.set(this.game.player.position.x + 45, 30, this.game.player.position.z + 45);
    this.game.scene.add(g);
    this.helicopter = { group: g, rotor, tailRotor, light, shoot: 3 };
    this.game.notify('Helicóptero da polícia no céu!');
  }

  spawnTank() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(6, 2.4, 9), new THREE.MeshStandardMaterial({ color: 0x3d4b36, metalness: .35, roughness: .65 }));
    body.position.y = 1.8; g.add(body);
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.3, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x35412e }));
    turret.position.y = 3.4; g.add(turret);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.3, .36, 8, 8), new THREE.MeshStandardMaterial({ color: 0x2a3325 }));
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 3.5, 5); g.add(barrel);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x1a1e19 });
    for (const sx of [-2.8, 2.8]) {
      const track = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 8), trackMat);
      track.position.set(sx, 1, 0); g.add(track);
    }
    g.position.set(this.game.player.position.x - 60, 0, this.game.player.position.z - 60);
    this.game.scene.add(g);
    this.tank = { group: g, shoot: 4 };
    this.game.notify('O Exército enviou um tanque!');
  }

  clear() {
    this.units.forEach(u => { this.game.scene.remove(u.group); });
    this.units = [];
    if (this.helicopter) { this.game.scene.remove(this.helicopter.group); this.helicopter = null; }
    if (this.tank) { this.game.scene.remove(this.tank.group); this.tank = null; }
    this.arrestTimer = 0;
    this.active = false;
    this.game.audio.sirenStop();
  }

  update(dt) {
    const p = this.game.player;
    if (p.wanted <= 0) { if (this.active) this.clear(); return; }
    this.active = true;
    this.ensureUnits(p.wanted);
    this.shootTimer -= dt;

    let near = false;
    this.units.forEach((u, idx) => {
      const dx = p.position.x - u.position.x;
      const dz = p.position.z - u.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 14) near = true;
      if (dist > 7) {
        const heading = Math.atan2(dx, dz);
        let diff = heading - u.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        u.heading += clamp(diff, -dt * 2.2, dt * 2.2);
        const spd = Math.min(u.aiSpeed || 16, dist * .8);
        u.position.x += Math.sin(u.heading) * spd * dt;
        u.position.z += Math.cos(u.heading) * spd * dt;
      }
      u.group.position.copy(u.position);
      u.group.rotation.y = u.heading;
      const t = performance.now() * .009;
      const flash = Math.sin(t) > 0;
      if (u.redLight) u.redLight.material.color.setHex(flash ? 0xff2030 : 0x2a0508);
      if (u.blueLight) u.blueLight.material.color.setHex(flash ? 0x14264f : 0x2a6bff);
      if (u.sirenLight) { u.sirenLight.color.setHex(flash ? 0xff2030 : 0x2a6bff); u.sirenLight.intensity = 2.5; }
      if (dist < 38 && this.shootTimer <= 0 && Math.random() < .35) {
        this.game.audio.gunshot();
        this.game.muzzleFlash(u.position.clone().add(new THREE.Vector3(0, 1.4, 0)), new THREE.Vector3(dx, 0, dz).normalize());
        if (Math.random() < .5) p.takeDamage(3.5 + p.wanted, 'polícia');
      }
    });

    if (this.helicopter) {
      const h = this.helicopter;
      const targetX = p.position.x + Math.sin(performance.now() * .0006) * 18;
      const targetZ = p.position.z + Math.cos(performance.now() * .0007) * 18;
      h.group.position.x += (targetX - h.group.position.x) * Math.min(1, dt * .7);
      h.group.position.z += (targetZ - h.group.position.z) * Math.min(1, dt * .7);
      h.group.position.y += (24 - h.group.position.y) * Math.min(1, dt * .5);
      h.group.rotation.y = Math.atan2(p.position.x - h.group.position.x, p.position.z - h.group.position.z);
      h.rotor.rotation.y += dt * 25;
      h.tailRotor.rotation.x += dt * 30;
      h.shoot -= dt;
      if (h.shoot <= 0) {
        h.shoot = rand(2.2, 4);
        this.game.audio.gunshot();
        this.game.muzzleFlash(h.group.position.clone(), new THREE.Vector3(0, -1, 0));
        if (Math.random() < .4) p.takeDamage(6, 'helicóptero');
      }
    }
    if (this.tank) {
      const t = this.tank;
      const dx = p.position.x - t.group.position.x, dz = p.position.z - t.group.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 24) {
        t.group.position.x += dx / dist * dt * 5;
        t.group.position.z += dz / dist * dt * 5;
      }
      t.group.rotation.y = Math.atan2(dx, dz);
      t.shoot -= dt;
      if (t.shoot <= 0 && dist < 80) {
        t.shoot = rand(4, 7);
        this.game.audio.explosion();
        this.game.spawnExplosion(new THREE.Vector3(p.position.x + rand(-8, 8), 0, p.position.z + rand(-8, 8)), .8);
        p.takeDamage(22, 'tanque');
      }
    }

    if (this.shootTimer <= 0) this.shootTimer = rand(1.4, 3.2);
    // prisão
    const closeUnit = this.units.some(u => Math.hypot(u.position.x - p.position.x, u.position.z - p.position.z) < 4.2);
    if (!p.inCar && closeUnit) {
      this.arrestTimer += dt;
      if (this.arrestTimer > 2.2) {
        this.arrestTimer = 0;
        this.game.onArrested();
      }
    } else this.arrestTimer = Math.max(0, this.arrestTimer - dt * 2);

    // perde procurado com o tempo
    this.decayTimer += dt;
    if (performance.now() - this.lastCrime > 42000 && this.decayTimer > 5) {
      this.decayTimer = 0;
      if (p.wanted > 0) {
        p.wanted--;
        this.game.ui.buildWanted();
        if (p.wanted === 0) this.clear();
        this.game.notify('A polícia perdeu seu rastro. Estrela reduzida.');
      }
    }
  }
}
