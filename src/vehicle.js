import * as THREE from 'three';
import { addShadowBlob, makeRadialTexture, makeTextTexture } from './utils.js';

export const VEHICLE_SPECS = {
  hatch: { max: 28, accel: 10.5, brake: 23, turn: 1.25, label: 'POPULAR' },
  muscle: { max: 46, accel: 17, brake: 27, turn: 1.2, label: 'MUSCLE' },
  super: { max: 84, accel: 25, brake: 32, turn: 1.15, label: 'LUXO' },
  pickup: { max: 30, accel: 11, brake: 21, turn: 1.15, label: 'PICAPE' },
  suv: { max: 32, accel: 12, brake: 22, turn: 1.1, label: 'SUV' },
  van: { max: 25, accel: 9, brake: 18, turn: 1.0, label: 'VAN' },
  taxi: { max: 31, accel: 12, brake: 23, turn: 1.25, label: 'TÁXI' },
  police: { max: 42, accel: 16, brake: 26, turn: 1.2, label: 'VIATURA' },
  ambulance: { max: 27, accel: 10, brake: 20, turn: 1.05, label: 'AMBULÂNCIA' },
  truck: { max: 21, accel: 8, brake: 16, turn: .95, label: 'CAMINHÃO' },
  bus: { max: 18, accel: 6, brake: 14, turn: .85, label: 'ÔNIBUS' },
  tank: { max: 15, accel: 6, brake: 12, turn: .8, label: 'TANQUE' },
  motorcycle: { max: 47, accel: 20, brake: 28, turn: 1.65, label: 'MOTO' },
  helicopter: { max: 58, accel: 15, brake: 24, turn: 1.15, air: true, label: 'HELICÓPTERO' },
  plane: { max: 82, accel: 22, brake: 28, turn: .9, air: true, label: 'AVIÃO' },
  boat: { max: 30, accel: 11, brake: 18, turn: 1.1, water: true, label: 'LANCHA' },
  jetski: { max: 38, accel: 15, brake: 20, turn: 1.4, water: true, label: 'JETSKI' },
  yacht: { max: 22, accel: 7, brake: 12, turn: .8, water: true, label: 'IATE' }
};

const PAINT = (color) => new THREE.MeshPhysicalMaterial({ color, roughness: .28, metalness: .52, clearcoat: .75, clearcoatRoughness: .18 });
const GLASS = () => new THREE.MeshPhysicalMaterial({ color: 0x172629, roughness: .08, metalness: .2, transparent: true, opacity: .78, clearcoat: 1 });
const TRIM = () => new THREE.MeshStandardMaterial({ color: 0x1b2021, roughness: .55, metalness: .35 });
const TIRE = () => new THREE.MeshStandardMaterial({ color: 0x101112, roughness: .92 });
const RIM = () => new THREE.MeshStandardMaterial({ color: 0xc4c1b5, roughness: .3, metalness: .8 });
const HEAD = () => new THREE.MeshBasicMaterial({ color: 0xfff0bd, toneMapped: false });
const TAIL = () => new THREE.MeshBasicMaterial({ color: 0xff3f36, toneMapped: false });

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}

function wheel() {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .25, 12), TIRE());
  tire.rotation.z = Math.PI / 2; tire.castShadow = true; g.add(tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .27, 8), RIM());
  rim.rotation.z = Math.PI / 2; g.add(rim);
  return g;
}

export function createVehicle(type = 'hatch', color = 0xf1eee3, options = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const paint = options.paint || PAINT(color);
  const glass = GLASS();
  const trim = TRIM();
  const dims = { hatch: [1.85, 4.0], muscle: [1.98, 4.65], pickup: [2.02, 4.9], suv: [2.08, 4.8], van: [2.1, 5.3], police: [2.02, 4.75], super: [2.06, 4.55], taxi: [1.9, 4.3], ambulance: [2.12, 5.4], truck: [2.24, 6.9], bus: [2.42, 9.4], tank: [2.5, 6.2] }[type] || [1.9, 4.3];
  const [width, length] = dims;

  if (type === 'motorcycle') return buildMotorcycle(root, body, paint, trim, glass, color, options);
  if (type === 'helicopter' || type === 'plane') return buildAircraft(root, body, paint, trim, glass, color, options, type);
  if (type === 'boat' || type === 'jetski' || type === 'yacht') return buildWatercraft(root, body, paint, trim, glass, color, options, type);

  const lower = box(width, .48, length, paint, 0, .64, 0);
  body.add(lower);
  const hood = box(width * .92, .16, length * .31, paint, 0, .9, length * .31);
  body.add(hood);
  const trunk = box(width * .94, .15, length * .22, paint, 0, .9, -length * .36);
  body.add(trunk);
  const cabinH = type === 'van' ? 1.15 : type === 'muscle' ? .62 : .76;
  const cabin = box(width * .82, cabinH, length * .39, paint, 0, 1.07, -length * .06);
  body.add(cabin);
  // windows
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(width * .68, cabinH * .62), glass);
  windshield.position.set(0, 1.15, length * .135); windshield.rotation.x = -.38; body.add(windshield);
  const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(width * .64, cabinH * .55), glass);
  rearGlass.position.set(0, 1.15, -length * .255); rearGlass.rotation.x = .32; body.add(rearGlass);
  for (const sx of [-1, 1]) {
    const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(length * .32, cabinH * .48), glass);
    sideGlass.position.set(sx * width * .415, 1.17, -length * .06);
    sideGlass.rotation.y = sx * Math.PI / 2; body.add(sideGlass);
  }
  const roof = box(width * .8, .07, length * .34, paint, 0, 1.07 + cabinH / 2, -length * .06);
  body.add(roof);
  // bumpers
  body.add(box(width * .9, .15, .25, trim, 0, .46, length / 2 - .06));
  body.add(box(width * .9, .15, .22, trim, 0, .46, -length / 2 + .06));
  // lights
  for (const sx of [-1, 1]) {
    const hl = box(.34, .15, .05, HEAD(), sx * width * .3, .77, length / 2 + .008);
    body.add(hl);
    const tl = box(.3, .13, .05, TAIL(), sx * width * .31, .77, -length / 2 - .008);
    body.add(tl);
  }
  // grille
  body.add(box(width * .44, .18, .05, trim, 0, .61, length / 2 + .01));
  // mirrors
  for (const sx of [-1, 1]) {
    body.add(box(.14, .1, .19, trim, sx * width * .52, 1.1, length * .11));
  }
  // wheels
  const wheels = [];
  const axleZ = [length * .32, -length * .3];
  for (const z of axleZ) for (const sx of [-1, 1]) {
    const w = wheel();
    w.position.set(sx * (width / 2 + .01), .36, z);
    body.add(w); wheels.push(w);
  }
  // type options
  if (type === 'pickup') {
    const bed = box(width * .85, .35, length * .33, paint, 0, .82, -length * .32); body.add(bed);
  }
  if (type === 'van') {
    for (let i = 0; i < 4; i++) body.add(box(.05, .5, .7, trim, width * .405, 1.0, -length * .26 + i * .35));
  }
  if (type === 'muscle') {
    const spoiler = box(width * .8, .05, .3, trim, 0, 1.02, -length / 2 + .2); body.add(spoiler);
    for (const sx of [-1, 1]) body.add(box(.06, .25, .18, trim, sx * width * .35, .92, -length / 2 + .2));
  }
  // license plate
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(.5, .12), new THREE.MeshBasicMaterial({ map: makePlateTexture(), toneMapped: false }));
  plate.position.set(0, .52, -length / 2 - .06); plate.rotation.y = Math.PI; body.add(plate);

  if (options.taxi || type === 'taxi') {
    const sign = box(.9, .22, .34, new THREE.MeshBasicMaterial({ color: 0xffce61 }), 0, 1.75, -length * .06); body.add(sign);
  }

  const shadow = addShadowBlob(root, Math.max(width, length) * .95);
  shadow.position.y = .015;
  shadow.material.opacity = .9;

  const state = {
    root, body, wheels, type, color, width, length, speed: 0, steering: 0,
    seatHeight: .9, forward: new THREE.Vector3(0, 0, 1), shadow,
    glass: [windshield, rearGlass], lights: [], time: 0, health: 100, fuel: 100,
    occupied: false, patrol: false, siren: false,
    driver: null, label: options.label || '',
    update(dt, opts = {}) {
      state.time += dt;
      state.speed = opts.speed ?? state.speed;
      state.steering = opts.steering ?? state.steering;
      const spin = state.speed * dt / .36;
      for (let i = 0; i < wheels.length; i++) {
        wheels[i].rotation.x -= spin * (i < 2 ? 1 : 1);
        wheels[i].rotation.y = i < 2 ? state.steering * .45 : 0;
      }
      body.rotation.z = Math.sin(state.time * 2) * Math.min(.012, Math.abs(state.speed) * .0015) - state.steering * Math.min(.05, Math.abs(state.speed) * .006);
      body.rotation.x = Math.sin(state.time * 3.2) * Math.min(.006, Math.abs(state.speed) * .0007);
      body.position.y = Math.sin(state.time * 10) * Math.min(.008, Math.abs(state.speed) * .001);
      if (opts.siren !== undefined) state.siren = opts.siren;
      if (state.lightBar) {
        state.lightBar.forEach((light, i) => {
          const on = Math.floor(state.time * 7) % 2 === i % 2;
          light.material.color.setHex(state.siren && on ? (i % 2 ? 0x246bff : 0xff2c2c) : 0x2a2f30);
        });
      }
    },
    setOccupied(v) { state.occupied = v; }
  };

  if (type === 'super') {
    body.add(box(width * 1.04, .1, length * .46, trim, 0, .4, .05));
    const wing = box(width * .9, .06, .34, trim, 0, 1.2, -length / 2 + .28); body.add(wing);
    for (const sx of [-1, 1]) body.add(box(.05, .22, .16, trim, sx * width * .33, 1.06, -length / 2 + .28));
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(width * .9, length * .8), new THREE.MeshBasicMaterial({ map: makeRadialTexture(0x43ddbe, 'rgba(0,0,0,0)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .22 }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = .05; root.add(glow);
  }
  if (type === 'ambulance') {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(length * .78, .22), new THREE.MeshBasicMaterial({ color: 0xe23b32 }));
    for (const sx of [-1, 1]) {
      const p = stripe.clone(); p.position.set(sx * width * .48, .92, -.05); p.rotation.y = sx * Math.PI / 2; body.add(p);
    }
    const cross = new THREE.Mesh(new THREE.PlaneGeometry(.52, .52), new THREE.MeshBasicMaterial({ map: makeTextTexture('+', { width: 128, height: 128, font: '700 96px sans-serif', bg: '#e23b32', color: '#ffffff' }), toneMapped: false }));
    cross.position.set(width * .49, 1.25, 0); cross.rotation.y = Math.PI / 2; body.add(cross);
    const bar = box(width * .7, .12, .28, new THREE.MeshBasicMaterial({ color: 0xff3b32, toneMapped: false }), 0, 1.72, length * .05); body.add(bar);
    body.add(box(width * .7, .1, .24, new THREE.MeshBasicMaterial({ color: 0x3b7bff, toneMapped: false }), 0, 1.84, length * .05));
  }
  if (type === 'truck') {
    const cargo = box(width * .98, 2.05, length * .58, new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: .85 }), 0, 1.45, -length * .18);
    body.add(cargo);
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(length * .52, .18), new THREE.MeshBasicMaterial({ color: 0xd6594e }));
    for (const sx of [-1, 1]) { const p = stripe.clone(); p.position.set(sx * width * .5, 1.3, -length * .18); p.rotation.y = sx * Math.PI / 2; body.add(p); }
  }
  if (type === 'bus') {
    body.add(box(width, .9, length * .9, new THREE.MeshStandardMaterial({ color: 0xf0b23c, roughness: .75 }), 0, 1.55, 0));
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(length * .16, .62), new THREE.MeshBasicMaterial({ color: 0x27434a, transparent: true, opacity: .8 }));
        win.position.set(sx * (width / 2 + .005), 1.65, -length * .3 + i * length * .2);
        win.rotation.y = sx * Math.PI / 2; body.add(win);
      }
    }
    body.add(box(width * .8, .3, .06, new THREE.MeshBasicMaterial({ color: 0x1f2f33 }), 0, 1.95, length / 2 + .03));
  }
  if (type === 'tank') {
    const turret = box(width * .68, .55, length * .34, new THREE.MeshStandardMaterial({ color: 0x4a5940, roughness: .9 }), 0, 1.55, -length * .03); body.add(turret);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, 3.3, 8), new THREE.MeshStandardMaterial({ color: 0x39443a, roughness: .85 }));
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 1.65, length * .34); body.add(barrel);
  }

  // police livery
  if (type === 'police') {
    const white = PAINT(0xe8ece5); const black = PAINT(0x172326);
    body.add(box(width * .93, .3, length * .52, black, 0, .82, -.1));
    for (const sx of [-1, 1]) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(length * .48, .14), new THREE.MeshBasicMaterial({ color: 0xdde7e2 }));
      stripe.position.set(sx * width * .48, .8, 0); stripe.rotation.y = sx * Math.PI / 2; body.add(stripe);
    }
    const lightBar = new THREE.Group();
    for (const [sx, col] of [[-.3, 0xff2c2c], [.3, 0x246bff]]) {
      const light = new THREE.Mesh(new THREE.BoxGeometry(.5, .12, .22), new THREE.MeshBasicMaterial({ color: col, toneMapped: false }));
      light.position.set(sx, 1.62, -length * .04); lightBar.add(light); state.lights.push(light);
    }
    body.add(lightBar);
    state.lightBar = lightBar.children;
    const decalTex = makePoliceTexture();
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .42), new THREE.MeshBasicMaterial({ map: decalTex, transparent: true, toneMapped: false }));
    decal.position.set(width * .485, .78, .2); decal.rotation.y = Math.PI / 2; body.add(decal);
    state.siren = true;
  }

  if (options.neon) {
    const under = new THREE.Mesh(new THREE.PlaneGeometry(width * .9, length * .8), new THREE.MeshBasicMaterial({ map: makeRadialTexture(options.neon, 'rgba(0,0,0,0)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .55 }));
    under.rotation.x = -Math.PI / 2; under.position.y = .06; root.add(under);
  }

  return state;
}

function makePlateTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e9e7db'; ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#222'; ctx.font = '700 34px monospace'; ctx.textAlign = 'center';
  ctx.fillText('COS 2E26', 128, 44);
  ctx.fillStyle = '#2a6bb5'; ctx.fillRect(0, 0, 256, 9);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makePoliceTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 128);
  ctx.fillStyle = '#dce6e0'; ctx.font = '800 36px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('POLÍCIA', 128, 42);
  ctx.fillStyle = '#f6c768'; ctx.font = '700 20px Outfit, sans-serif';
  ctx.fillText('COSTA DOURADA', 128, 70);
  ctx.strokeStyle = '#43ddbe'; ctx.lineWidth = 3; ctx.strokeRect(8, 8, 240, 112);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createTrafficCar(color, type) {
  return createVehicle(type || 'hatch', color);
}

// ---------------- SPECIAL VEHICLES ----------------
function buildMotorcycle(root, body, paint, trim, glass, color, options) {
  const state = {
    root, body, wheels: [], type: 'motorcycle', color, width: .95, length: 2.25,
    speed: 0, steering: 0, seatHeight: .82, forward: new THREE.Vector3(0, 0, 1), shadow: null,
    glass: [], lights: [], time: 0, health: 100, fuel: 100, occupied: false, patrol: false, siren: false,
    driver: null, label: options.label || ''
  };
  const frame = box(.2, .16, 1.35, trim, 0, .64, 0); body.add(frame);
  const tank = box(.42, .3, .62, paint, 0, .9, .1); body.add(tank);
  const seat = box(.36, .12, .6, TRIM(), 0, .9, -.44); body.add(seat);
  const rearFender = box(.32, .1, .62, paint, 0, .78, -.82); body.add(rearFender);
  const frontFork = box(.07, .52, .07, trim, 0, .58, .76); frontFork.rotation.x = -.22; body.add(frontFork);
  const bars = box(.66, .06, .06, trim, 0, 1.06, .62); body.add(bars);
  const headlight = box(.24, .16, .08, HEAD(), 0, .96, .88); body.add(headlight);
  state.lights.push(headlight);
  const tail = box(.2, .1, .06, TAIL(), 0, .86, -1.06); body.add(tail);
  state.lights.push(tail);
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(.055, .07, 1.1, 7), trim);
  exhaust.rotation.x = Math.PI / 2; exhaust.position.set(.22, .52, -.35); body.add(exhaust);
  for (const z of [.78, -.78]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .18, 14), TIRE());
    w.rotation.z = Math.PI / 2; w.position.set(0, .36, z); w.castShadow = true; body.add(w); state.wheels.push(w);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .2, 8), RIM());
    rim.rotation.z = Math.PI / 2; rim.position.set(0, .36, z); body.add(rim);
  }
  state.shadow = addShadowBlob(root, 1.6); state.shadow.position.y = .015;
  state.update = (dt, opts = {}) => {
    state.time += dt;
    state.speed = opts.speed ?? state.speed;
    state.steering = opts.steering ?? state.steering;
    const spin = state.speed * dt / .36;
    state.wheels.forEach(w => { w.rotation.x -= spin; });
    body.rotation.z = -state.steering * Math.min(.55, Math.abs(state.speed) * .02) + Math.sin(state.time * 2) * .01;
    body.rotation.x = Math.sin(state.time * 3.4) * Math.min(.008, Math.abs(state.speed) * .001);
    body.position.y = Math.sin(state.time * 11) * Math.min(.01, Math.abs(state.speed) * .001);
  };
  return state;
}

function buildAircraft(root, body, paint, trim, glass, color, options, type) {
  const plane = type === 'plane';
  const width = plane ? 8.6 : 3.1;
  const length = plane ? 8.4 : 7.6;
  const state = {
    root, body, wheels: [], rotors: [], type, color, width, length,
    speed: 0, steering: 0, seatHeight: 1.4, forward: new THREE.Vector3(0, 0, 1), shadow: null,
    glass: [], lights: [], time: 0, health: 100, fuel: 100, occupied: false, patrol: false, siren: false,
    driver: null, label: options.label || '', isAir: true, altitude: plane ? 0 : 0
  };
  if (plane) {
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, 6.4, 10), paint);
    fuselage.rotation.x = Math.PI / 2; fuselage.position.set(0, 1.5, 0); fuselage.castShadow = true; body.add(fuselage);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(.42, 10, 8), paint); nose.position.set(0, 1.5, 3.2); body.add(nose);
    const wing = box(width, .12, 1.55, paint, 0, 1.55, .1); body.add(wing);
    body.add(box(2.8, .1, .9, paint, 0, 1.55, -3.0));
    body.add(box(.16, 1.2, 1.1, paint, 0, 2.0, -3.0));
    const canopy = box(.72, .42, 1.5, glass, 0, 1.88, .35); body.add(canopy); state.glass.push(canopy);
    const prop = new THREE.Group(); prop.position.set(0, 1.5, 3.62);
    const b1 = box(.12, 1.8, .05, trim, 0, 0, 0); prop.add(b1);
    const b2 = box(1.8, .12, .05, trim, 0, 0, 0); prop.add(b2);
    body.add(prop); state.rotors.push({ mesh: prop, axis: 'z', speed: 32 });
    for (const sx of [-1, 1]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .12, 10), TIRE());
      wheel.rotation.z = Math.PI / 2; wheel.position.set(sx * .85, .42, 1.1); body.add(wheel);
    }
  } else {
    const fuselage = box(1.9, 1.35, 3.2, paint, 0, 2.0, .15); body.add(fuselage);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(.85, 12, 9), paint); nose.scale.set(1, .78, 1.2); nose.position.set(0, 1.95, 1.7); body.add(nose);
    const cabin = box(1.55, .95, 1.25, glass, 0, 2.1, .55); body.add(cabin); state.glass.push(cabin);
    body.add(box(.32, .32, 4.4, paint, 0, 2.15, -3.1));
    const fin = box(.12, 1.15, 1.0, paint, 0, 2.55, -5.1); body.add(fin);
    const skidMat = TRIM();
    for (const sx of [-1, 1]) {
      body.add(box(.11, .11, 3.3, skidMat, sx * 1.05, .6, .1));
      body.add(box(.08, .55, .08, skidMat, sx * .72, .85, .9));
      body.add(box(.08, .55, .08, skidMat, sx * .72, .85, -.9));
    }
    const mast = box(.18, .55, .18, TRIM(), 0, 2.85, 0); body.add(mast);
    const rotor = new THREE.Group(); rotor.position.set(0, 3.1, 0);
    rotor.add(box(6.4, .06, .22, TRIM(), 0, 0, 0));
    rotor.add(box(.22, .06, 6.4, TRIM(), 0, 0, 0));
    body.add(rotor); state.rotors.push({ mesh: rotor, axis: 'y', speed: 24 });
    const tailRotor = new THREE.Group(); tailRotor.position.set(.22, 2.55, -5.15);
    tailRotor.add(box(.05, 1.3, .1, TRIM(), 0, 0, 0));
    tailRotor.add(box(.05, .1, 1.3, TRIM(), 0, 0, 0));
    body.add(tailRotor); state.rotors.push({ mesh: tailRotor, axis: 'x', speed: 38 });
    const light = new THREE.Mesh(new THREE.SphereGeometry(.12, 6, 5), new THREE.MeshBasicMaterial({ color: 0xff3b32, toneMapped: false }));
    light.position.set(0, 1.35, 1.9); body.add(light); state.lights.push(light);
  }
  state.shadow = addShadowBlob(root, plane ? 7 : 4.5); state.shadow.position.y = .02;
  state.update = (dt, opts = {}) => {
    state.time += dt;
    state.speed = opts.speed ?? state.speed;
    state.steering = opts.steering ?? state.steering;
    for (const r of state.rotors) r.mesh.rotation[r.axis] += dt * r.speed * (state.speed > -50 ? 1 : 1);
    body.rotation.z = -state.steering * Math.min(.4, Math.abs(state.speed) * .008);
    body.rotation.x = plane ? Math.sin(state.time * 2) * .01 : Math.sin(state.time * 2.2) * .02 - state.speed * .002;
    body.position.y = Math.sin(state.time * 9) * Math.min(.03, Math.abs(state.speed) * .002);
  };
  return state;
}

function buildWatercraft(root, body, paint, trim, glass, color, options, type) {
  const yacht = type === 'yacht';
  const jetski = type === 'jetski';
  const width = yacht ? 4.2 : jetski ? 1.35 : 2.5;
  const length = yacht ? 12 : jetski ? 3.1 : 7.2;
  const state = {
    root, body, wheels: [], type, color, width, length,
    speed: 0, steering: 0, seatHeight: .9, forward: new THREE.Vector3(0, 0, 1), shadow: null,
    glass: [], lights: [], time: 0, health: 100, fuel: 100, occupied: false, patrol: false, siren: false,
    driver: null, label: options.label || '', isWater: true
  };
  const hull = box(width, .78, length, paint, 0, .45, 0); body.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(width * .5, length * .32, 4), paint);
  bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4;
  bow.position.set(0, .45, length * .58); body.add(bow);
  const deck = box(width * .86, .1, length * .8, new THREE.MeshStandardMaterial({ color: 0xc9b68f, roughness: .85 }), 0, .88, -.05); body.add(deck);
  if (!jetski) {
    const cabin = box(width * .62, yacht ? 1.6 : .85, length * (yacht ? .42 : .3), paint, 0, yacht ? 1.7 : 1.2, -length * .1); body.add(cabin);
    const windshield = box(width * .55, .5, .05, glass, 0, yacht ? 2.2 : 1.55, length * .12); body.add(windshield); state.glass.push(windshield);
    if (yacht) {
      const upper = box(width * .52, 1.1, length * .26, paint, 0, 2.9, -length * .08); body.add(upper);
      const win = box(width * .46, .42, .05, glass, 0, 3.0, length * .06); body.add(win); state.glass.push(win);
    }
  } else {
    const seat = box(.62, .22, 1.1, TRIM(), 0, 1.0, -.25); body.add(seat);
    const bars = box(.7, .05, .05, trim, 0, 1.15, .55); body.add(bars);
  }
  const head = box(width * .5, .12, .08, HEAD(), 0, .95, length * .48); body.add(head); state.lights.push(head);
  const tail = box(width * .4, .1, .06, TAIL(), 0, .92, -length * .5); body.add(tail); state.lights.push(tail);
  state.shadow = addShadowBlob(root, Math.max(width, length) * .7); state.shadow.position.y = .02;
  state.update = (dt, opts = {}) => {
    state.time += dt;
    state.speed = opts.speed ?? state.speed;
    state.steering = opts.steering ?? state.steering;
    body.position.y = Math.sin(state.time * 1.6) * .08 + .02;
    body.rotation.z = Math.sin(state.time * 1.2) * .025 - state.steering * Math.min(.2, Math.abs(state.speed) * .01);
    body.rotation.x = Math.sin(state.time * 1.9) * .015 - Math.min(.08, Math.abs(state.speed) * .003);
  };
  return state;
}
