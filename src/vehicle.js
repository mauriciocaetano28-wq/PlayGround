import * as THREE from 'three';
import { addShadowBlob, makeRadialTexture } from './utils.js';

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
  const dims = { hatch: [1.85, 4.0], muscle: [1.98, 4.65], pickup: [2.02, 4.9], suv: [2.08, 4.8], van: [2.1, 5.3], police: [2.02, 4.75] }[type] || [1.9, 4.3];
  const [width, length] = dims;

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

  if (options.taxi) {
    const sign = box(.9, .22, .34, new THREE.MeshBasicMaterial({ color: 0xffce61 }), 0, 1.75, -length * .06); body.add(sign);
  }

  const shadow = addShadowBlob(root, Math.max(width, length) * .95);
  shadow.position.y = .015;
  shadow.material.opacity = .9;

  const state = {
    root, body, wheels, type, color, width, length, speed: 0, steering: 0,
    seatHeight: .9, forward: new THREE.Vector3(0, 0, 1), shadow,
    lights: [], time: 0, health: 100, occupied: false, patrol: false, siren: false,
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
