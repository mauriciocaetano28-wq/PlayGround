import { THREE } from './world-utils.js';

export const WEAPONS = {
  soco: { name: 'Soco', damage: 12, rate: .38, range: 2.2, ammo: Infinity, auto: false, sound: 'punch' },
  taco: { name: 'Taco', damage: 24, rate: .55, range: 2.8, ammo: Infinity, auto: false, sound: 'punch' },
  faca: { name: 'Faca', damage: 38, rate: .7, range: 2.4, ammo: Infinity, auto: false, sound: 'punch' },
  pistola: { name: 'Pistola', damage: 28, rate: .32, range: 90, ammo: 60, auto: false, sound: 'gun' },
  metralhadora: { name: 'Metralhadora', damage: 18, rate: .09, range: 110, ammo: 180, auto: true, sound: 'gun' },
  escopeta: { name: 'Escopeta', damage: 55, rate: .85, range: 45, ammo: 24, auto: false, sound: 'gun' },
  sniper: { name: 'Sniper', damage: 120, rate: 1.2, range: 260, ammo: 12, auto: false, sound: 'gun' },
  bazuca: { name: 'Bazuca', damage: 250, rate: 1.8, range: 200, ammo: 4, auto: false, sound: 'explosion' },
  granada: { name: 'Granada', damage: 180, rate: 1.5, range: 40, ammo: 6, auto: false, sound: 'explosion' },
  molotov: { name: 'Molotov', damage: 100, rate: 1.5, range: 35, ammo: 6, auto: false, sound: 'explosion' },
  rpg: { name: 'RPG', damage: 280, rate: 2, range: 220, ammo: 4, auto: false, sound: 'explosion' },
  minigun: { name: 'Minigun', damage: 20, rate: .06, range: 120, ammo: 500, auto: true, sound: 'gun' }
};

export class Player {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.position = new THREE.Vector3(8, 0, 30);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.vy = 0;
    this.grounded = true;
    this.health = 100;
    this.maxHealth = 100;
    this.hunger = 82;
    this.thirst = 76;
    this.money = 2500;
    this.wanted = 0;
    this.weapon = 'soco';
    this.ammo = { pistola: 60, metralhadora: 180, escopeta: 24, sniper: 12, bazuca: 4, granada: 6, molotov: 6, rpg: 4, minigun: 500 };
    this.crouch = false;
    this.roll = 0;
    this.dancing = false;
    this.greeting = 0;
    this.inCar = false;
    this.aiming = false;
    this.shootCooldown = 0;
    this.walkPhase = 0;
    this.speed = 0;
    this.swimming = false;
    this.stamina = 100;
    this.food = 0;
    this.houseOwned = false;
    this.barberLevel = 0;
    this.gymLevel = 0;
    this.clothes = 'Camiseta Branca';
    this.shirtColor = 0xf4f4f0;
    this.pantsColor = 0x2b4266;
    this.capColor = 0x111111;
    this.shooting = false;
    this.lastDamage = 0;
    this.buildModel();
  }

  buildModel() {
    const root = new THREE.Group();
    this.root = root;
    const skin = new THREE.MeshStandardMaterial({ color: 0x8a5534, roughness: .78 });
    const shirt = new THREE.MeshStandardMaterial({ color: this.shirtColor, roughness: .85 });
    const pants = new THREE.MeshStandardMaterial({ color: this.pantsColor, roughness: .88 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: .7 });
    const white = new THREE.MeshStandardMaterial({ color: 0xf2f2ed, roughness: .6 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xffc83d, metalness: .9, roughness: .22 });
    this.skinMat = skin; this.shirtMat = shirt; this.pantsMat = pants;

    const torso = new THREE.Mesh(new THREE.BoxGeometry(.56, .7, .32), shirt);
    torso.position.y = 1.23; torso.castShadow = true; root.add(torso);
    this.torso = torso;
    const shorts = new THREE.Mesh(new THREE.BoxGeometry(.53, .28, .33), pants);
    shorts.position.y = .86; shorts.castShadow = true; root.add(shorts);
    const belt = new THREE.Mesh(new THREE.BoxGeometry(.55, .07, .34), dark);
    belt.position.y = 1.0; root.add(belt);

    const headGroup = new THREE.Group();
    headGroup.position.y = 1.77;
    const head = new THREE.Mesh(new THREE.SphereGeometry(.215, 10, 8), skin);
    head.scale.set(.92, 1.06, .92); head.castShadow = true; headGroup.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(.23, 9, 7), dark);
    hair.scale.set(.98, .72, 1.0); hair.position.y = .09; headGroup.add(hair);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.225, .23, .11, 10), new THREE.MeshStandardMaterial({ color: this.capColor, roughness: .75 }));
    cap.position.y = .18; headGroup.add(cap);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(.32, .035, .22), cap.material);
    brim.position.set(0, .13, .17); headGroup.add(brim);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    for (const sx of [-.075, .075]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(.025, 6, 5), eyeMat);
      eye.position.set(sx, .015, .195); headGroup.add(eye);
    }
    const chain = new THREE.Mesh(new THREE.TorusGeometry(.18, .018, 5, 14, Math.PI), gold);
    chain.rotation.x = Math.PI / 2; chain.rotation.z = Math.PI; chain.position.y = 1.51; root.add(chain);
    const watch = new THREE.Mesh(new THREE.TorusGeometry(.048, .012, 5, 10), gold);
    watch.position.set(-.38, 1.0, .02); watch.rotation.y = Math.PI / 2; root.add(watch);
    this.headGroup = headGroup; root.add(headGroup);

    const armGeo = new THREE.BoxGeometry(.135, .56, .14);
    const handGeo = new THREE.SphereGeometry(.08, 7, 5);
    const makeArm = (side) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * .36, 1.49, 0);
      const arm = new THREE.Mesh(armGeo, skin); arm.position.y = -.29; arm.castShadow = true; pivot.add(arm);
      const sleeve = new THREE.Mesh(new THREE.BoxGeometry(.16, .22, .17), shirt); sleeve.position.y = -.1; pivot.add(sleeve);
      const hand = new THREE.Mesh(handGeo, skin); hand.position.y = -.61; hand.castShadow = true; pivot.add(hand);
      if (side < 0) {
        const tattoo = new THREE.Mesh(new THREE.PlaneGeometry(.12, .2), new THREE.MeshBasicMaterial({ color: 0x1e1115, transparent: true, opacity: .85 }));
        tattoo.position.set(0, -.38, .073); pivot.add(tattoo);
        const tattoo2 = new THREE.Mesh(new THREE.PlaneGeometry(.06, .1), new THREE.MeshBasicMaterial({ color: 0x111111 }));
        tattoo2.position.set(.055, -.36, .074); pivot.add(tattoo2);
      }
      root.add(pivot);
      return { pivot, hand };
    };
    const la = makeArm(-1), ra = makeArm(1);
    this.leftArm = la.pivot; this.rightArm = ra.pivot; this.rightHand = ra.hand;
    this.leftArm.rotation.z = .06; this.rightArm.rotation.z = -.06;

    const legGeo = new THREE.BoxGeometry(.18, .78, .2);
    const shoeGeo = new THREE.BoxGeometry(.2, .12, .3);
    const makeLeg = (side) => {
      const pivot = new THREE.Group(); pivot.position.set(side * .145, .83, 0);
      const leg = new THREE.Mesh(legGeo, skin); leg.position.y = -.39; leg.castShadow = true; pivot.add(leg);
      const shortLeg = new THREE.Mesh(new THREE.BoxGeometry(.2, .32, .22), pants); shortLeg.position.y = -.08; pivot.add(shortLeg);
      const shoe = new THREE.Mesh(shoeGeo, white); shoe.position.set(0, -.78, .05); shoe.castShadow = true; pivot.add(shoe);
      root.add(pivot); return pivot;
    };
    this.leftLeg = makeLeg(-1); this.rightLeg = makeLeg(1);

    // arma na mão
    const weapon = new THREE.Group();
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(.09, .12, .34), dark); gunBody.position.set(0, 0, .18); weapon.add(gunBody);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(.08, .18, .1), dark); grip.position.set(0, -.11, .06); grip.rotation.x = -.2; weapon.add(grip);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .2, 6), new THREE.MeshStandardMaterial({ color: 0x44484d, metalness: .8, roughness: .3 }));
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, .03, .38); weapon.add(barrel);
    weapon.position.set(0, -.62, .08); weapon.rotation.x = .1;
    weapon.visible = false;
    this.weaponModel = weapon;
    this.rightArm.add(weapon);

    this.root.position.copy(this.position);
    this.scene.add(this.root);
  }

  get y() { return this.position.y; }
  set y(v) { this.position.y = v; }

  setWeapon(name) {
    if (!WEAPONS[name]) return;
    this.weapon = name;
    this.weaponModel.visible = name !== 'soco' && name !== 'taco' && name !== 'faca';
    this.game.notify(`Arma equipada: ${WEAPONS[name].name}`);
  }

  applyOutfit(item) {
    if (item.color) this.shirtMat.color.setHex(item.color);
    if (item.pants) this.pantsMat.color.setHex(item.pants);
    if (item.cap) this.capColor = item.cap;
    this.clothes = item.name || this.clothes;
  }

  addMoney(v) {
    this.money = Math.max(0, this.money + v);
    this.game.updateHUD();
  }

  takeDamage(amount, reason = '') {
    if (this.game.dead || this.game.paused) return;
    this.health = Math.max(0, this.health - amount);
    this.lastDamage = performance.now();
    this.game.damageFlash();
    if (this.game.audio) this.game.audio.hit();
    if (navigator.vibrate && this.game.settings.vibration) navigator.vibrate(80);
    if (this.health <= 0) this.game.onPlayerDeath(reason);
  }

  heal(v) { this.health = Math.min(this.maxHealth, this.health + v); }

  update(dt, input, camYaw) {
    if (this.inCar) return;
    const moveX = input.moveX || 0;
    const moveY = input.moveY || 0;
    const mag = Math.min(1, Math.hypot(moveX, moveY));
    const wantSprint = input.run || input.moveMag > .92 || (input.keyboard && input.sprintKey);
    const crouch = this.crouch;

    const forward = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    const dir = new THREE.Vector3().addScaledVector(forward, moveY).addScaledVector(right, moveX);
    if (dir.lengthSq() > 0) dir.normalize();
    if (this.dancing && mag < .1) dir.set(0, 0, 0);

    let targetSpeed = 0;
    if (mag > .05) {
      targetSpeed = crouch ? 2.1 : wantSprint ? 12.6 : 6.4;
      if (this.swimming) targetSpeed *= .45;
      if (this.greeting > 0) targetSpeed = 0;
    }
    if (this.roll > 0) targetSpeed = 13;
    this.speed += (targetSpeed - this.speed) * Math.min(1, dt * 8);
    if (dir.lengthSq() > 0) this.yaw = Math.atan2(dir.x, dir.z);
    const move = dir.multiplyScalar(this.speed * dt);

    const nx = this.position.x + move.x;
    const nz = this.position.z + move.z;
    const obs = this.game.world.collideCircle(nx, nz, .42);
    if (!obs) { this.position.x = nx; this.position.z = nz; }
    else {
      if (!this.game.world.collideCircle(nx, this.position.z, .42)) this.position.x = nx;
      if (!this.game.world.collideCircle(this.position.x, nz, .42)) this.position.z = nz;
    }

    // natação
    this.swimming = this.position.x > (this.game.world.seaEdge || 690) && this.position.z > -560 && this.position.z < 560;
    if (this.swimming) {
      this.position.y = Math.sin(performance.now() * .002) * .08 - .25;
      this.vy = 0; this.grounded = false;
      if (mag > .1 && Math.random() < .02) this.game.audio.splash();
    } else {
      this.vy -= 24 * dt;
      this.position.y += this.vy * dt;
      if (this.position.y <= 0) { this.position.y = 0; this.vy = 0; this.grounded = true; }
    }

    // pulo
    if (input.jump && this.grounded && !this.swimming) {
      this.vy = 8.2; this.grounded = false; input.jump = false;
      this.game.audio.jump();
    }
    // rolamento
    if (input.roll && this.roll <= 0) {
      this.roll = .55; input.roll = false;
      this.crouch = false;
      this.game.audio.punch();
    }
    if (this.roll > 0) this.roll -= dt;

    // animação
    this.walkPhase += dt * (2 + this.speed * .85);
    if (this.speed > .1) this.game.audio.footstep(this.speed > 8);
    this.animate(dt, mag, wantSprint);
    this.root.position.copy(this.position);
    this.root.rotation.y = this.yaw;

    // fome e sede
    this.hunger = Math.max(0, this.hunger - dt * .075);
    this.thirst = Math.max(0, this.thirst - dt * .11);
    if (this.hunger <= 0 || this.thirst <= 0) this.takeDamage(dt * 1.5, 'fome');
    this.stamina = Math.min(100, this.stamina + dt * 4);
  }

  animate(dt, mag, sprint) {
    const speedRatio = Math.min(1.4, this.speed / 6.4);
    const swing = Math.sin(this.walkPhase) * (.62 * speedRatio);
    if (this.roll > 0) {
      const t = 1 - this.roll / .55;
      this.root.rotation.x = Math.sin(t * Math.PI) * -1.8;
      this.root.position.y = this.position.y + Math.sin(t * Math.PI) * .4;
    } else {
      this.root.rotation.x += (0 - this.root.rotation.x) * Math.min(1, dt * 12);
      this.root.position.y = this.position.y;
    }
    if (this.dancing) {
      this.leftArm.rotation.x = -2.3 + Math.sin(performance.now() * .009) * .5;
      this.rightArm.rotation.x = -2.3 + Math.cos(performance.now() * .009) * .5;
      this.leftArm.rotation.z = .4; this.rightArm.rotation.z = -.4;
      this.leftLeg.rotation.x = Math.sin(performance.now() * .008) * .35;
      this.rightLeg.rotation.x = -Math.sin(performance.now() * .008) * .35;
      this.root.rotation.z = Math.sin(performance.now() * .004) * .08;
      this.torso.rotation.y = Math.sin(performance.now() * .005) * .15;
      return;
    }
    this.root.rotation.z += (0 - this.root.rotation.z) * Math.min(1, dt * 8);
    this.torso.rotation.y += (0 - this.torso.rotation.y) * Math.min(1, dt * 8);
    if (this.greeting > 0) {
      this.greeting -= dt;
      this.rightArm.rotation.x = -2.4 + Math.sin(performance.now() * .018) * .35;
      this.rightArm.rotation.z = -.45;
    } else if (this.aiming) {
      this.rightArm.rotation.x += (-1.55 - this.rightArm.rotation.x) * Math.min(1, dt * 14);
      this.rightArm.rotation.z += (-.1 - this.rightArm.rotation.z) * Math.min(1, dt * 14);
      this.leftArm.rotation.x += (-1.35 - this.leftArm.rotation.x) * Math.min(1, dt * 14);
      this.leftArm.rotation.z += (.35 - this.leftArm.rotation.z) * Math.min(1, dt * 14);
      this.leftLeg.rotation.x *= .4; this.rightLeg.rotation.x *= .4;
    } else if (this.speed > .2) {
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
      this.leftArm.rotation.x = -swing * .75;
      this.rightArm.rotation.x = swing * .75;
      this.leftArm.rotation.z = .06; this.rightArm.rotation.z = -.06;
      this.torso.rotation.x = sprint ? .12 : .03;
      this.headGroup.rotation.x = sprint ? -.08 : 0;
    } else {
      this.leftLeg.rotation.x += (0 - this.leftLeg.rotation.x) * Math.min(1, dt * 10);
      this.rightLeg.rotation.x += (0 - this.rightLeg.rotation.x) * Math.min(1, dt * 10);
      this.leftArm.rotation.x += (Math.sin(performance.now() * .0018) * .03 - this.leftArm.rotation.x) * Math.min(1, dt * 6);
      this.rightArm.rotation.x += (Math.sin(performance.now() * .0018 + 1) * .03 - this.rightArm.rotation.x) * Math.min(1, dt * 6);
      this.leftArm.rotation.z += (.06 - this.leftArm.rotation.z) * Math.min(1, dt * 8);
      this.rightArm.rotation.z += (-.06 - this.rightArm.rotation.z) * Math.min(1, dt * 8);
      this.torso.rotation.x += (0 - this.torso.rotation.x) * Math.min(1, dt * 8);
      this.headGroup.rotation.x += (0 - this.headGroup.rotation.x) * Math.min(1, dt * 8);
    }
    if (this.crouch) {
      this.root.scale.y += (0.72 - this.root.scale.y) * Math.min(1, dt * 10);
      this.root.position.y = this.position.y - .05;
    } else {
      this.root.scale.y += (1 - this.root.scale.y) * Math.min(1, dt * 10);
    }
    if (this.swimming) {
      this.root.rotation.x = -.65;
      this.root.position.y = this.position.y + .55;
      this.leftArm.rotation.x = -2.2 + Math.sin(this.walkPhase * 1.6) * .5;
      this.rightArm.rotation.x = -2.2 - Math.sin(this.walkPhase * 1.6) * .5;
    }
    if (this.vy > .2) {
      this.leftLeg.rotation.x = .45; this.rightLeg.rotation.x = -.35;
      this.leftArm.rotation.x = -1.2; this.rightArm.rotation.x = -1.2;
    }
  }

  startDance() {
    this.dancing = !this.dancing;
    if (this.dancing) { this.game.notify('Dança funk ativada! 🕺'); this.game.audio.setGenre('funk'); }
    else this.game.notify('Dança encerrada.');
  }
  greet() { this.greeting = 1.6; this.game.notify('E aí, irmão! 🤝'); }

  respawnAt(x, z) {
    this.position.set(x, 0, z);
    this.health = this.maxHealth;
    this.vy = 0;
    this.inCar = false;
    this.root.visible = true;
    this.root.position.copy(this.position);
    this.dancing = false;
  }
}
