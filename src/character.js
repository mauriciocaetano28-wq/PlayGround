import * as THREE from 'three';
import { addShadowBlob, clamp, damp, angleLerp } from './utils.js';

const SKIN = [0x8d583d, 0x6f412e, 0xb87b58, 0x5b3526, 0xd29b76, 0x9b6146, 0x4a2a20];
const SHIRTS = [0xf2e8d6, 0xd95a4b, 0x2e8c83, 0xf0ba4f, 0x314c72, 0x7b4b84, 0xc9c1af, 0x3b3b3f, 0xea8a5f];
const PANTS = [0x27343d, 0x3d3b48, 0xd6cbb5, 0x1f3a4a, 0x5b4a3c, 0x2e4e53, 0x38312f];

function mat(color, roughness = .85, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function makeLimb(w, h, d, m, pos) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(pos.x, pos.y, pos.z);
  mesh.castShadow = true;
  return mesh;
}

function createPistol() {
  const g = new THREE.Group();
  const metal = mat(0x252d31, .3, .8);
  const grip = mat(0x242021, .85, .1);
  const slide = new THREE.Mesh(new THREE.BoxGeometry(.09, .13, .42), metal);
  slide.position.set(0, .04, -.16); g.add(slide);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .18, 6), metal);
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, .04, -.47); g.add(barrel);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(.1, .25, .13), grip);
  handle.position.set(0, -.12, .0); handle.rotation.x = -.22; g.add(handle);
  const guard = new THREE.Mesh(new THREE.TorusGeometry(.07, .012, 4, 8, Math.PI), metal);
  guard.rotation.y = Math.PI / 2; guard.rotation.z = Math.PI; guard.position.set(0, -.06, -.1); g.add(guard);
  g.userData.muzzle = new THREE.Object3D(); g.userData.muzzle.position.set(0, .04, -.56); g.add(g.userData.muzzle);
  g.visible = false;
  return g;
}

function createSMG() {
  const g = new THREE.Group();
  const metal = mat(0x272d2d, .35, .75);
  const body = new THREE.Mesh(new THREE.BoxGeometry(.13, .18, .6), metal); body.position.set(0, .04, -.2); g.add(body);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .34, 7), metal); barrel.rotation.x = Math.PI / 2; barrel.position.set(0, .04, -.62); g.add(barrel);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(.08, .32, .11), mat(0x202b27, .8)); mag.position.set(0, -.18, -.15); mag.rotation.x = .15; g.add(mag);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(.09, .12, .28), mat(0x302b28, .9)); stock.position.set(0, .01, .23); g.add(stock);
  g.userData.muzzle = new THREE.Object3D(); g.userData.muzzle.position.set(0, .04, -.8); g.add(g.userData.muzzle);
  g.visible = false;
  return g;
}

export function createCharacter(options = {}) {
  const female = options.female ?? false;
  const skin = options.skin ?? (female ? 0x8d583d : 0x6f412e);
  const shirt = options.shirt ?? (female ? 0xe4a33c : 0x2c8f85);
  const pants = options.pants ?? (female ? 0x384a61 : 0x343e45);
  const hair = options.hair ?? 0x211914;
  const accent = options.accent ?? 0xff7058;
  const isPlayer = options.isPlayer ?? false;
  const name = options.name ?? 'Cidadão';

  const root = new THREE.Group();
  root.name = 'character-' + name;
  const visual = new THREE.Group();
  root.add(visual);

  const skinM = mat(skin, .88);
  const shirtM = mat(shirt, .8);
  const pantsM = mat(pants, .9);
  const shoeM = mat(options.shoes ?? 0x1d1a19, .7);
  const hairM = mat(hair, .95);
  const eyeM = new THREE.MeshBasicMaterial({ color: 0x12100e });
  const lipM = mat(0x7a3b34, .9);

  // torso
  const torso = new THREE.Group();
  torso.position.y = .95;
  visual.add(torso);
  const chest = makeLimb(female ? .43 : .49, .58, .26, shirtM, { x: 0, y: .21, z: 0 });
  chest.geometry = new THREE.CylinderGeometry(female ? .23 : .255, female ? .2 : .22, .58, 7);
  chest.geometry.scale(1, 1, .7);
  chest.position.y = .2;
  torso.add(chest);
  if (female) {
    const waist = new THREE.Mesh(new THREE.CylinderGeometry(.18, .19, .24, 7), skinM);
    waist.scale.z = .68; waist.position.y = -.18; waist.castShadow = true; torso.add(waist);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, .15, 7), skinM);
  neck.position.y = .57; neck.castShadow = true; torso.add(neck);

  // head
  const head = new THREE.Group();
  head.position.y = .76;
  torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.155, 12, 10), skinM);
  skull.scale.set(.9, 1.08, .92); skull.castShadow = true; head.add(skull);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), skinM);
  jaw.scale.set(.95, .8, .9); jaw.position.set(0, -.09, .02); head.add(jaw);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.026, .07, 5), skinM);
  nose.rotation.x = Math.PI / 2; nose.position.set(0, -.015, .15); head.add(nose);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.019, 6, 5), eyeM);
    eye.position.set(sx * .055, .03, .135); head.add(eye);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(.055, .01, .012), hairM);
    brow.position.set(sx * .055, .075, .138); brow.rotation.z = sx * -.1; head.add(brow);
  }
  const lips = new THREE.Mesh(new THREE.BoxGeometry(female ? .068 : .06, .018, .012), lipM);
  lips.position.set(0, -.075, .14); head.add(lips);

  if (options.curly) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const curl = new THREE.Mesh(new THREE.SphereGeometry(.07 + (i % 3) * .012, 7, 6), hairM);
      curl.position.set(Math.cos(a) * .13, .09 + Math.sin(a * 2) * .05 + (i > 7 ? .02 : 0), Math.sin(a) * .11 - .03);
      curl.scale.set(1, 1.2, 1); curl.castShadow = true; head.add(curl);
    }
    const backHair = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), hairM);
    backHair.scale.set(1, 1.35, .8); backHair.position.set(0, .02, -.06); head.add(backHair);
  } else {
    const capMat = mat(options.capColor ?? accent, .8);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.166, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    cap.scale.set(1, .85, 1); cap.position.y = .055; cap.castShadow = true; head.add(cap);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(.28, .022, .17), capMat);
    brim.position.set(0, .07, .14); brim.rotation.x = .07; head.add(brim);
    const hairFront = new THREE.Mesh(new THREE.BoxGeometry(.25, .03, .04), hairM);
    hairFront.position.set(0, .035, .125); head.add(hairFront);
  }

  // arms
  const arms = [];
  for (const sx of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(sx * (female ? .25 : .29), .38, 0);
    torso.add(shoulder);
    const upper = makeLimb(female ? .11 : .125, .3, .13, shirtM, { x: 0, y: -.14, z: 0 });
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -.29;
    shoulder.add(elbow);
    const lower = makeLimb(female ? .09 : .1, .28, .11, skinM, { x: 0, y: -.13, z: 0 });
    elbow.add(lower);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(.085, .11, .12), skinM);
    hand.position.set(0, -.3, .01); hand.castShadow = true; elbow.add(hand);
    if (options.chain && sx === 1) {
      const chain = new THREE.Mesh(new THREE.TorusGeometry(.07, .007, 4, 10), mat(0xf1c253, .3, .8));
      chain.rotation.x = Math.PI / 2; chain.position.set(0, .02, 0); shoulder.add(chain);
    }
    arms.push({ shoulder, elbow, hand });
  }
  // right arm is index 1, weapon attached
  const weapon = createPistol();
  weapon.position.set(0, -.32, -.02);
  weapon.rotation.x = -Math.PI / 2;
  arms[1].elbow.add(weapon);
  const smg = createSMG();
  smg.position.set(0, -.32, -.02);
  smg.rotation.x = -Math.PI / 2;
  arms[1].elbow.add(smg);

  // legs
  const legs = [];
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(sx * .11, .92, 0);
    visual.add(hip);
    const upper = makeLimb(female ? .14 : .17, .42, .16, pantsM, { x: 0, y: -.2, z: 0 });
    hip.add(upper);
    const knee = new THREE.Group();
    knee.position.y = -.4;
    hip.add(knee);
    const lower = makeLimb(female ? .115 : .14, .39, .14, pantsM, { x: 0, y: -.18, z: 0 });
    knee.add(lower);
    const shoe = makeLimb(female ? .12 : .145, .1, .25, shoeM, { x: 0, y: -.39, z: .05 });
    knee.add(shoe);
    legs.push({ hip, knee, shoe });
  }

  // accessories
  if (options.earrings) {
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.TorusGeometry(.028, .006, 4, 8), mat(0xf3c24c, .3, .9));
      e.position.set(sx * .145, -.01, .01); e.rotation.y = Math.PI / 2; head.add(e);
    }
  }
  if (options.backpack) {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(.32, .36, .16), mat(0x3c3530, .95));
    bag.position.set(0, .22, -.2); bag.castShadow = true; torso.add(bag);
    const strap = new THREE.Mesh(new THREE.BoxGeometry(.05, .5, .03), mat(0x272321, .95));
    strap.position.set(-.13, .3, .15); strap.rotation.z = .2; torso.add(strap);
  }

  if (options.tattoo) {
    const ink = mat(0x241c1a, .95);
    for (const [w, h, y, z, rz] of [[.09, .012, -.1, .062, .35], [.07, .012, -.155, .062, -.5], [.05, .012, -.205, .06, .2]]) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(w, h, .008), ink);
      line.position.set(0, y, z); line.rotation.z = rz; arms[1].elbow.add(line);
    }
  }


  const crown = new THREE.Group();
  {
    const gold = mat(0xf6c768, .25, .85);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.155, .16, .07, 10, 1, true), gold);
    band.position.y = .17; crown.add(band);
    for (let i = 0; i < 5; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(.035, .12, 4), gold);
      const a = (i / 5) * Math.PI * 2;
      spike.position.set(Math.cos(a) * .13, .26, Math.sin(a) * .13);
      crown.add(spike);
    }
    crown.visible = false;
    head.add(crown);
  }
  const shadow = addShadowBlob(root, isPlayer ? 1.5 : 1.15);
  shadow.position.y = .015;

  const state = {
    root, visual, torso, head, arms, legs, weapon, smg, shadow,
    time: Math.random() * 10,
    aiming: false,
    speed: 0,
    phase: 0,
    currentWeapon: 'pistol',
    isPlayer,
    female,
    name,
    crown
  };

  state.setWeapon = (kind) => {
    state.currentWeapon = kind;
    weapon.visible = kind === 'pistol' && (state.aiming || state.speed < .002);
    smg.visible = kind === 'smg' && (state.aiming || state.speed < .002);
  };

  state.setAiming = (aiming) => {
    state.aiming = aiming;
    state.setWeapon(state.currentWeapon);
  };

  state.update = (dt, opts = {}) => {
    state.time += dt;
    const speed = opts.speed ?? state.speed;
    const moving = speed > .08;
    const running = speed > 4.2;
    state.speed = speed;
    if (opts.aiming !== undefined) state.aiming = opts.aiming;
    state.setWeapon(state.currentWeapon);
    const period = running ? 7.8 : 5.4;
    if (moving) state.phase += dt * period * clamp(speed / 2.5, .6, 1.6);
    const swing = Math.sin(state.phase);
    const swing2 = Math.cos(state.phase);
    const amt = moving ? clamp(speed / 6.5, .2, 1) : 0;
    legs[0].hip.rotation.x = swing * .62 * amt;
    legs[1].hip.rotation.x = -swing * .62 * amt;
    legs[0].knee.rotation.x = Math.max(0, -swing) * .73 * amt;
    legs[1].knee.rotation.x = Math.max(0, swing) * .73 * amt;
    torso.position.y = .95 + Math.abs(swing2) * .025 * amt;
    torso.rotation.z = Math.sin(state.phase * .5) * .025 * amt;
    visual.rotation.z = Math.sin(state.phase) * .012 * amt;
    if (state.aiming) {
      arms[1].shoulder.rotation.x = -1.27;
      arms[1].shoulder.rotation.z = -.12;
      arms[1].elbow.rotation.x = -.1;
      arms[0].shoulder.rotation.x = -.9;
      arms[0].shoulder.rotation.z = .38;
      arms[0].elbow.rotation.x = -.65;
    } else {
      arms[0].shoulder.rotation.x = -swing * .55 * amt + Math.sin(state.time * 1.4) * .02;
      arms[1].shoulder.rotation.x = swing * .55 * amt + Math.sin(state.time * 1.35 + 1) * .02;
      arms[0].shoulder.rotation.z = .06;
      arms[1].shoulder.rotation.z = -.06;
      arms[0].elbow.rotation.x = -.1 - Math.max(0, -swing) * .2 * amt;
      arms[1].elbow.rotation.x = -.1 - Math.max(0, swing) * .2 * amt;
    }
    head.rotation.y = damp(head.rotation.y, opts.lookYaw || 0, 5, dt);
    head.rotation.x = damp(head.rotation.x, (opts.lookPitch || 0) * .4, 5, dt);
    if (opts.rotationY !== undefined) visual.rotation.y = angleLerp(visual.rotation.y, opts.rotationY, clamp(dt * 10, 0, 1));
    const dead = opts.dead;
    if (dead) {
      visual.rotation.z = damp(visual.rotation.z, Math.PI / 2, 4, dt);
      visual.position.y = damp(visual.position.y, .12, 4, dt);
      state.shadow.material.opacity = .3;
    } else {
      visual.position.y = damp(visual.position.y, 0, 8, dt);
    }
  };

  state.setVisibility = (v) => { root.visible = v; };
  state.setCrown = (v) => { crown.visible = !!v; };

  state.dispose = () => {
    root.traverse(o => { if (o.isMesh) { o.geometry?.dispose?.(); if (Array.isArray(o.material)) o.material.forEach(m => m.dispose()); else o.material?.dispose?.(); } });
    root.parent?.remove(root);
  };

  return state;
}

export function createLuiza() {
  return createCharacter({
    name: 'Luiza', female: true, isPlayer: true,
    skin: 0x8d583d, shirt: 0xe4a23d, pants: 0x3b465b,
    hair: 0x1b1411, accent: 0xff7058, curly: true, earrings: true, shoes: 0xe6ded0
  });
}

export function createCarlos() {
  return createCharacter({
    name: 'Carlos', female: false, isPlayer: true,
    skin: 0x6f412e, shirt: 0x2d8d84, pants: 0x343c43,
    hair: 0x16110f, accent: 0x43ddbe, capColor: 0x245b55, chain: true,
    shoes: 0x1d1a19, backpack: false
  });
}

export function createCaio() {
  return createCharacter({
    name: 'Caio', female: false, isPlayer: true,
    skin: 0x8a5334, shirt: 0xf0b23c, pants: 0x26333d,
    hair: 0x14100d, accent: 0x3d8bff, capColor: 0x1f4fa8,
    chain: true, tattoo: true, backpack: false, shoes: 0x1d1a19
  });
}

export function createRandomNPC(name) {
  const female = Math.random() > .5;
  return createCharacter({
    name,
    female,
    skin: SKIN[Math.floor(Math.random() * SKIN.length)],
    shirt: SHIRTS[Math.floor(Math.random() * SHIRTS.length)],
    pants: PANTS[Math.floor(Math.random() * PANTS.length)],
    hair: [0x17110e, 0x382316, 0x0e0c0b, 0x6b4b2c][Math.floor(Math.random() * 4)],
    accent: [0xff7058, 0x43ddbe, 0xf6c768][Math.floor(Math.random() * 3)],
    curly: female && Math.random() > .55,
    cap: !female && Math.random() > .6,
    earrings: female && Math.random() > .5,
    backpack: Math.random() > .7,
    capColor: SHIRTS[Math.floor(Math.random() * SHIRTS.length)]
  });
}
