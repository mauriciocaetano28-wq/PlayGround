import { THREE, COLORS, rand, pick, addBox, addPlane, mergeToMesh } from './world-utils.js';
import {
  mat, makeBuilding, addLabel, addGlowSign, makePalm, makeStaticCar, makeDirtRoad, makeWater
} from './district-utils.js';

export function buildZones(w) {
  buildFavela(w);
  buildBeach(w);
  buildAirport(w);
  buildInterior(w);
  buildRich(w);
  buildPort(w);
  buildSerra(w);
  buildIndustrial(w);
  buildJapanese(w);
  buildDistrictArches(w);
}

/* ============================ FAVELA ============================ */
function buildFavela(w) {
  const cx = -320, cz = -250;
  const count = w.quality === 'low' ? 170 : 300;
  const houseGeo = new THREE.BoxGeometry(1, 1, 1);
  const houseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85 });
  const houses = new THREE.InstancedMesh(houseGeo, houseMat, count);
  houses.castShadow = true; houses.receiveShadow = true;
  const roofGeo = new THREE.BoxGeometry(1, .12, 1);
  const roofs = new THREE.InstancedMesh(roofGeo, mat(0x77736a, { roughness: .95 }), count);
  roofs.castShadow = true;
  const d = new THREE.Object3D(); const c = new THREE.Color();
  let n = 0;
  const colors = COLORS.favela;
  for (let tries = 0; tries < count * 8 && n < count; tries++) {
    const x = cx + rand(-128, 128);
    const z = cz + rand(-118, 118);
    if (Math.abs(x - cx) < 12 && Math.abs(z - cz) < 12) continue;
    if (w.isOnRoad(x, z, 12) && Math.random() < .6) continue;
    const ww = rand(5, 10), dd = rand(5, 10), hh = rand(3.8, 11);
    const y = Math.max(0, Math.sin((x + 300) * .03) * 4 + Math.cos((z + 260) * .04) * 3);
    d.position.set(x, y + hh / 2, z); d.scale.set(ww, hh, dd); d.rotation.y = Math.random() < .25 ? rand(-.2, .2) : 0; d.updateMatrix();
    houses.setMatrixAt(n, d.matrix);
    c.setHex(pick(colors)); houses.setColorAt(n, c);
    d.position.set(x, y + hh + .06, z); d.scale.set(ww + .4, 1, dd + .4); d.rotation.y = 0; d.updateMatrix();
    roofs.setMatrixAt(n, d.matrix);
    w.addObstacle(x - ww / 2, x + ww / 2, z - dd / 2, z + dd / 2, y + hh);
    n++;
  }
  houses.count = n; roofs.count = n;
  houses.instanceMatrix.needsUpdate = true; roofs.instanceMatrix.needsUpdate = true;
  if (houses.instanceColor) houses.instanceColor.needsUpdate = true;
  w.scene.add(houses, roofs);

  // becos e escadarias
  const stairs = [];
  for (let i = 0; i < 26; i++) {
    const x = cx + rand(-120, 120), z = cz + rand(-110, 110);
    for (let s = 0; s < 5; s++) addBox(stairs, 3.2, .32, 1.2, x, .2 + s * .3, z + s * 1.1);
  }
  const stairMesh = mergeToMesh(stairs, mat(0x9a9285, { roughness: .9 }));
  if (stairMesh) w.scene.add(stairMesh);

  // bar e adega
  makeBuilding(w, -270, -200, 20, 16, 7, 0x42a7c7, { lit: .5, windows: false });
  w.addSign('BAR DO ZÉ', -270, 5, -191.8, 0, 15, 2.4, { bg: '#081b28', color: '#4ee5ff', border: '#ffdb4d', font: 'bold 52px Arial', sub: 'GELADA · FUNK · PETISCO', subColor: '#fff' });
  w.addSign('ADEGA', -270, 8.2, -191.8, 0, 9, 2, { bg: '#1f0a24', color: '#ff9cf2', border: '#ff58d8', font: 'bold 54px Arial' });

  // quadra de futebol
  const field = new THREE.Mesh(new THREE.PlaneGeometry(34, 22), mat(0x5e6e45, { roughness: 1 }));
  field.rotation.x = -Math.PI / 2; field.position.set(-360, .09, -320); w.scene.add(field);
  for (const gx of [-377, -343]) {
    const goal = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.BoxGeometry(.16, 2.4, .16), mat(0xf0f0e8));
    bar.position.y = 1.2; goal.add(bar);
    const top = new THREE.Mesh(new THREE.BoxGeometry(.16, .16, 5), mat(0xf0f0e8)); top.position.y = 2.4; goal.add(top);
    goal.position.set(gx, 0, -320); w.scene.add(goal);
  }

  // pipas no céu
  const kiteGeo = new THREE.OctahedronGeometry(1.4, 0);
  for (let i = 0; i < 8; i++) {
    const kite = new THREE.Mesh(kiteGeo, new THREE.MeshBasicMaterial({ color: pick([0xff3d84, 0x45d7ff, 0xffdc3d, 0x7dff5a, 0xff7d2d]) }));
    kite.scale.set(1.1, .45, 1.1);
    kite.position.set(cx + rand(-90, 90), rand(28, 58), cz + rand(-80, 80));
    kite.userData.baseY = kite.position.y;
    const tailMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .4 });
    const tailGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(rand(-2, 2), -8, rand(-2, 2))]);
    kite.add(new THREE.Line(tailGeo, tailMat));
    w.scene.add(kite); w.kites.push(kite);
  }

  // cachorros
  for (let i = 0; i < 10; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(.65, .38, 1), mat(pick([0x8b5b2e, 0x3b2b1f, 0xd8b06a, 0x2b2b2b])));
    body.position.y = .55; g.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.4, .4, .4), body.material); head.position.set(0, .7, .62); g.add(head);
    g.position.set(cx + rand(-100, 100), 0, cz + rand(-90, 90)); g.rotation.y = rand(0, 6);
    w.scene.add(g);
  }

  // caixa d'água e antenas no morro
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 3.5, 8), mat(0x4d7fa1, { metalness: .3 }));
  tower.position.set(cx + 50, 10, cz - 40); w.scene.add(tower);
  const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, 10, 6), mat(0x77736a));
  towerBase.position.set(cx + 50, 5, cz - 40); w.scene.add(towerBase);

  w.addSign('FAVELA DO MORRO', cx, 13, cz + 122, 0, 30, 4.4, { bg: 'rgba(30,6,30,.75)', color: '#ffdf4d', border: '#ff5bbd', font: 'bold 62px Arial', sub: 'COMUNIDADE · RESPEITO · FUNK', subColor: '#fff' });
}

/* ============================ PRAIA ============================ */
function buildBeach(w) {
  const x = 560;
  // calçadão
  const board = new THREE.Mesh(new THREE.PlaneGeometry(16, 620), new THREE.MeshStandardMaterial({ color: 0xc9c1aa, roughness: .9 }));
  board.rotation.x = -Math.PI / 2; board.position.set(558, .08, 0); board.receiveShadow = true; w.scene.add(board);
  for (let z = -300; z < 300; z += 14) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(.25, 7), new THREE.MeshBasicMaterial({ color: 0x9f9883 }));
    line.rotation.x = -Math.PI / 2; line.position.set(552 + (Math.abs(z) % 2 ? 4 : -4), .1, z); w.scene.add(line);
  }

  for (let i = 0; i < 22; i++) makePalm(w, rand(590, 650), rand(-260, 260), rand(.8, 1.25));
  // quiosques
  for (let i = 0; i < 5; i++) {
    const kx = 575, kz = -220 + i * 110;
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 6), mat(0xe4d6b2)); base.position.y = 1.5; base.castShadow = true; g.add(base);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6, 2.2, 4), mat(0xcf6f33)); roof.position.y = 4; roof.rotation.y = Math.PI / 4; g.add(roof);
    g.position.set(kx, 0, kz); w.scene.add(g);
    w.addSign(i % 2 ? 'ÁGUA DE COCO' : 'QUIOSQUE DO CAIO', kx, 4.4, kz + 3.1, 0, 8, 1.6, { bg: '#0a5e44', color: '#fff', border: '#ffd23c', font: 'bold 40px Arial', sub: 'AÇAÍ · COCO · CAMARÃO', subColor: '#ffe9a8' });
    w.addObstacle(kx - 4, kx + 4, kz - 3, kz + 3, 5);
  }

  // salva-vidas
  const life = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(4, .4, 4), mat(0xe5d7b8)); base.position.y = 2.4; life.add(base);
  for (const sx of [-1.7, 1.7]) for (const sz of [-1.7, 1.7]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 4.8, 5), mat(0xd6d1c4)); leg.position.set(sx, 2.4, sz); life.add(leg);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.6, 4), mat(0xe33d2e)); roof.position.y = 5.5; roof.rotation.y = Math.PI / 4; life.add(roof);
  life.position.set(610, 0, 95); w.scene.add(life);
  w.addSign('SALVA-VIDAS', 610, 4.3, 97.6, 0, 7, 1.5, { bg: '#a91f16', color: '#fff', font: 'bold 46px Arial' });

  // guarda-sóis
  for (let i = 0; i < 14; i++) {
    const ux = 640 + rand(0, 30), uz = rand(-240, 240);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 3, 5), mat(0xdedede)); pole.position.set(ux, 1.5, uz); w.scene.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1, 12), mat(pick([0xff4d5e, 0x2e8bff, 0xffd23c, 0xff8a2e, 0x47d9a0]), { side: THREE.DoubleSide }));
    top.position.set(ux, 3, uz); w.scene.add(top);
    const towel = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 3), mat(pick([0x2c75d8, 0xff7a45, 0x6bdb76, 0xff4f98])));
    towel.rotation.x = -Math.PI / 2; towel.position.set(ux + 1.6, .1, uz + 1); w.scene.add(towel);
  }

  // barcos e jet skis
  for (let i = 0; i < 4; i++) {
    const bx = 760 + i * 36, bz = -180 + i * 120;
    const hull = new THREE.Mesh(new THREE.BoxGeometry(5, 1.8, 15), mat(0xf0f0e8));
    hull.position.set(bx, .5, bz); hull.rotation.y = rand(-.4, .4); w.scene.add(hull);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(3, 1.7, 4), mat(0x3d6d94)); cabin.position.set(bx, 2, bz - 2); w.scene.add(cabin);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 8, 5), mat(0xdedede)); mast.position.set(bx, 5, bz + 2); w.scene.add(mast);
  }
  for (let i = 0; i < 3; i++) {
    const jx = 700 + i * 12, jz = 40 + i * 35;
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, .5, 2.6), mat(pick([0xff3b4f, 0x2cc9ff, 0xffd23c]), { metalness: .3, roughness: .4 }));
    body.position.set(jx, .3, jz); w.scene.add(body);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(.7, .4, .8), mat(0x1b1b1f)); seat.position.set(jx, .7, jz - .2); w.scene.add(seat);
  }

  // vendedor de coco
  const cart = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.2), mat(0xe0c29a)); box.position.y = 1; cart.add(box);
  for (const sx of [-.8, .8]) { const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .15, 8), mat(0x292929)); wheel.rotation.z = Math.PI / 2; wheel.position.set(sx, .4, .4); cart.add(wheel); }
  const coco = new THREE.Mesh(new THREE.SphereGeometry(.45, 8, 6), mat(0x4c7a35)); coco.position.y = 1.85; cart.add(coco);
  cart.position.set(620, 0, -20); w.scene.add(cart);
  w.addSign('COCO GELADO R$ 5', 620, 3.1, -18, 0, 9, 1.6, { bg: '#124a1e', color: '#eaffd5', border: '#8dff5c', font: 'bold 46px Arial' });

  w.addSign('PRAIA DO CAIO', 620, 12, 200, -.2, 36, 5, { bg: 'rgba(4,55,78,.7)', color: '#fff5c2', border: '#3dd7ff', font: 'bold 72px Arial', sub: 'MAR AZUL · SOL FORTE · BRASIL', subColor: '#c7f5ff' });
  w.seaEdge = 690;
}

/* ============================ AEROPORTO ============================ */
function buildAirport(w) {
  const z = -430;
  makeBuilding(w, 160, z + 80, 76, 38, 18, 0xc8d3da, { glass: true, lit: .7, roofColor: 0x7e8a93 });
  w.addSign('AEROPORTO INTERNACIONAL', 160, 11, z + 99.2, 0, 50, 5, { bg: '#092640', color: '#d9f3ff', border: '#56c8ff', font: 'bold 58px Arial', sub: 'CIDADE CAIO · BRASIL', subColor: '#9fe5ff' });
  w.addObstacle(122, 198, z + 61, z + 99, 18);

  const tower = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3, 34, 8), mat(0xb7c1c7, { roughness: .6 }));
  shaft.position.y = 17; shaft.castShadow = true; tower.add(shaft);
  const cabin = new THREE.Mesh(new THREE.CylinderGeometry(6, 5, 6, 8), mat(0x3d5e78, { glass: true, metalness: .3, roughness: .2 }));
  cabin.position.y = 36; tower.add(cabin);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, .5, 8), mat(0x8b969c)); top.position.y = 39.3; tower.add(top);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(.4, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3030 })); beacon.position.y = 40; tower.add(beacon);
  tower.position.set(80, 0, -400); w.scene.add(tower);
  w.addObstacle(76, 84, -404, -396, 40);

  // hangar
  const hangar = new THREE.Mesh(new THREE.BoxGeometry(50, 16, 34), mat(0x8c9aa0, { metalness: .3, roughness: .6 }));
  hangar.position.set(-110, 8, -390); hangar.castShadow = true; w.scene.add(hangar);
  const hRoof = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 34, 12, 1, false, 0, Math.PI), mat(0x69777d));
  hRoof.rotation.z = Math.PI / 2; hRoof.rotation.x = Math.PI / 2; hRoof.position.set(-110, 16, -390); w.scene.add(hRoof);
  w.addSign('HANGAR 1', -110, 12, -372.8, 0, 16, 2.6, { bg: '#24343d', color: '#ffce54', border: '#ffce54', font: 'bold 54px Arial' });

  // malas
  for (let i = 0; i < 20; i++) {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(rand(.6, 1.2), .6, rand(.4, .8)), mat(pick([0x8a3b2c, 0x2e4d7a, 0x303030, 0xb88a3e])));
    bag.position.set(rand(110, 200), .35, rand(-360, -320)); bag.rotation.y = rand(0, 3); bag.castShadow = true; w.scene.add(bag);
  }

  // luzes da pista
  const lights = [];
  for (let zz = -740; zz <= -260; zz += 22) {
    lights.push([-36, zz], [36, zz]);
  }
  const lg = new THREE.BoxGeometry(.3, .3, .3);
  const lm = new THREE.MeshBasicMaterial({ color: 0xffe68a });
  const inst = new THREE.InstancedMesh(lg, lm, lights.length);
  const d = new THREE.Object3D();
  lights.forEach(([x, zz], i) => { d.position.set(x, .2, zz); d.updateMatrix(); inst.setMatrixAt(i, d.matrix); });
  inst.instanceMatrix.needsUpdate = true; w.scene.add(inst);

  w.addSign('PISTA 09 · DECOLAGEM', 0, 2.4, -270, 0, 30, 3, { bg: 'rgba(20,25,30,.85)', color: '#ffe66b', border: '#ffe66b', font: 'bold 60px Arial' });
}

/* ============================ INTERIOR ============================ */
function buildInterior(w) {
  // fazenda
  const barn = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(34, 16, 24), mat(0x9f3a2e, { roughness: .9 })); base.position.y = 8; base.castShadow = true; barn.add(base);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 35, 3, 1, false, 0, Math.PI), mat(0x5e2820)); roof.rotation.z = Math.PI / 2; roof.position.y = 20; barn.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(10, 10, .4), mat(0x5b2018)); door.position.set(0, 5, 12.1); barn.add(door);
  barn.position.set(-540, 0, 300); w.scene.add(barn);
  w.addSign('FAZENDA BOA VISTA', -540, 18, 313, 0, 26, 4, { bg: '#3a1a12', color: '#ffe6ad', border: '#ffb24b', font: 'bold 54px Arial', sub: 'LEITE · QUEIJO · CAFÉ', subColor: '#fff' });
  w.addObstacle(-557, -523, 288, 312, 22);

  makeBuilding(w, -430, 380, 30, 24, 9, 0xdad0b4, { lit: .5, windows: false });
  w.addSign('CASA DA ROÇA', -430, 6, 392.2, 0, 18, 2.6, { bg: '#4b3014', color: '#ffe8b0', font: 'bold 48px Arial' });

  // plantação de milho
  const cornCount = w.quality === 'low' ? 260 : 500;
  const stalkGeo = new THREE.ConeGeometry(.22, 2.4, 4);
  const stalkMat = new THREE.MeshStandardMaterial({ color: 0x6c9c35, roughness: .9 });
  const corn = new THREE.InstancedMesh(stalkGeo, stalkMat, cornCount);
  const d = new THREE.Object3D();
  let n = 0;
  for (let r = 0; r < 22 && n < cornCount; r++) {
    for (let cc = 0; cc < 24 && n < cornCount; cc++) {
      const x = -590 + cc * 2.4 + (r % 2) * .7;
      const z = 410 + r * 2.2;
      d.position.set(x, 1.2, z); d.rotation.y = rand(0, 1); d.scale.setScalar(rand(.8, 1.2)); d.updateMatrix();
      corn.setMatrixAt(n++, d.matrix);
    }
  }
  corn.count = n; corn.instanceMatrix.needsUpdate = true; corn.castShadow = true; w.scene.add(corn);

  // animais
  const cowSpots = [[-500, 330], [-470, 350], [-550, 360], [-510, 390], [-460, 420]];
  cowSpots.forEach(([x, z]) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.5, 1.3), mat(0xe8e1d2)); body.position.y = 1.5; g.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.9, .8, .9), mat(0xd8cebb)); head.position.set(0, 1.9, .9); g.add(head);
    const spot = new THREE.Mesh(new THREE.BoxGeometry(.6, .5, .1), mat(0x2b2b2b)); spot.position.set(.7, 1.8, .66); g.add(spot);
    for (const [lx, lz] of [[-.9, -.4], [.9, -.4], [-.9, .4], [.9, .4]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(.24, 1.1, .24), mat(0xcfc5b2)); leg.position.set(lx, .55, lz); g.add(leg);
    }
    g.position.set(x, 0, z); g.rotation.y = rand(0, 6); w.scene.add(g);
  });
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, .9), mat(0x6d4327)); body.position.y = 1.6; g.add(body);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(.6, 1.4, .6), mat(0x6d4327)); neck.position.set(0, 2.4, .8); g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, 1), mat(0x6d4327)); head.position.set(0, 3, 1.2); g.add(head);
    for (const [lx, lz] of [[-.8, -.3], [.8, -.3], [-.8, .3], [.8, .3]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(.2, 1.5, .2), mat(0x5b351d)); leg.position.set(lx, .75, lz); g.add(leg);
    }
    g.position.set(-450 + i * 18, 0, 310 + i * 15); g.rotation.y = rand(0, 6); w.scene.add(g);
  }
  for (let i = 0; i < 16; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(.3, 6, 4), mat(0xf1f0e8)); body.scale.y = .8; body.position.y = .4; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.16, 6, 4), mat(0xf1f0e8)); head.position.set(0, .8, .22); g.add(head);
    g.position.set(-560 + rand(0, 80), 0, 330 + rand(0, 70)); w.scene.add(g);
  }

  // trator
  const tr = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.4, 2), mat(0x2d7d3a)); body.position.y = 1.4; tr.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 1.5), mat(0x3b8d45)); cab.position.set(0, 2.8, -.2); tr.add(cab);
  for (const [x, z, r] of [[-1.2, 1.1, .9], [1.2, 1.1, .9], [-1.2, -1.1, .5], [1.2, -1.1, .5]]) {
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .4, 10), mat(0x1b1b1b)); wh.rotation.z = Math.PI / 2; wh.position.set(x, r, z); tr.add(wh);
  }
  tr.position.set(-600, 0, 330); w.scene.add(tr);

  // rio, ponte e cachoeira
  makeWater(w, -430, 420, 34, 210, 0x2f89a8, .08);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(48, 1.1, 12), mat(0x8b7b62));
  bridge.position.set(-430, 2.2, 390); bridge.castShadow = true; w.scene.add(bridge);
  for (const zz of [384, 396]) for (const xx of [-450, -410]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 2), mat(0x6d604e)); leg.position.set(xx, 1.2, zz); w.scene.add(leg);
  }
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(12, 32), new THREE.MeshBasicMaterial({ color: 0x9fe5ff, transparent: true, opacity: .72, side: THREE.DoubleSide }));
  fall.position.set(-500, 16, 500); w.scene.add(fall);
  const fall2 = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshBasicMaterial({ color: 0xd9f7ff, transparent: true, opacity: .5, side: THREE.DoubleSide }));
  fall2.position.set(-500, 2, 500); fall2.rotation.x = -Math.PI / 2; w.scene.add(fall2);

  // cerca
  const fence = [];
  for (let x = -600; x <= -400; x += 8) {
    addBox(fence, .16, 1.6, .16, x, .8, 460);
  }
  addBox(fence, 200, .12, .12, -500, 1.3, 460);
  const fm = mergeToMesh(fence, mat(0x6b5c45));
  if (fm) w.scene.add(fm);
}

/* ============================ BAIRRO RICO ============================ */
function buildRich(w) {
  const cx = 320, cz = 320;
  const positions = [];
  for (let i = 0; i < 20; i++) {
    const ang = i / 20 * Math.PI * 2;
    const r = 78 + (i % 3) * 18;
    positions.push([cx + Math.cos(ang) * r, cz + Math.sin(ang) * r]);
  }
  positions.forEach(([x, z], i) => {
    const ww = rand(20, 30), dd = rand(16, 24), hh = rand(8, 14);
    makeBuilding(w, x, z, ww, dd, hh, pick([0xf0eee6, 0xddd5c5, 0xc9d4d6, 0xe8dfd0]), { lit: .4, roofColor: 0x5b6468, tank: false });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(ww * .45, dd * .35), new THREE.MeshStandardMaterial({ color: 0x2bb7e8, metalness: .25, roughness: .08, envMapIntensity: 1.4 }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(x + ww * .35, .16, z + dd * .35); w.scene.add(pool);
    const hedge = new THREE.Mesh(new THREE.BoxGeometry(ww + 6, 1.2, .8), mat(0x2f6b3c)); hedge.position.set(x, .6, z - dd / 2 - 2); w.scene.add(hedge);
    if (i % 3 === 0) makeStaticCar(w, x + rand(-8, 8), z + dd / 2 + 6, Math.PI / 2, pick([0x101010, 0xf0f0f0, 0xb31f2b, 0x1a3d7a]), true);
  });
  const helipad = new THREE.Mesh(new THREE.CircleGeometry(14, 32), mat(0x3a3e40, { roughness: .8 }));
  helipad.rotation.x = -Math.PI / 2; helipad.position.set(390, .12, 390); w.scene.add(helipad);
  const hCircle = new THREE.Mesh(new THREE.RingGeometry(10, 11, 32), new THREE.MeshBasicMaterial({ color: 0xffd33c, side: THREE.DoubleSide }));
  hCircle.rotation.x = -Math.PI / 2; hCircle.position.set(390, .14, 390); w.scene.add(hCircle);
  w.addSign('H', 390, .2, 390, 0, 8, 8, { color: '#ffd33c', font: 'bold 200px Arial' });
  w.addSign('BAIRRO RICO', cx, 14, cz + 130, 0, 30, 4, { bg: 'rgba(30,24,6,.7)', color: '#ffe8a0', border: '#ffd23c', font: 'bold 66px Arial', sub: 'MANSÕES · PISCINAS · SEGURANÇA', subColor: '#fff' });
}

/* ============================ PORTO ============================ */
function buildPort(w) {
  const x = 540, z = -330;
  // navio gigante
  const ship = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(34, 14, 150), mat(0x1d344d, { metalness: .35, roughness: .5 }));
  hull.position.y = 4; ship.add(hull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(32, 1.2, 148), mat(0x59636a)); deck.position.y = 11.3; ship.add(deck);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(22, 14, 18), mat(0xe4e2da)); bridge.position.set(0, 18, -55); ship.add(bridge);
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 10, 8), mat(0x8c2c27)); funnel.position.set(0, 28, -60); ship.add(funnel);
  for (let i = 0; i < 32; i++) {
    const cont = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 12), mat(pick([0xd8442e, 0x2a72c8, 0xf1b83a, 0x35a56b, 0xdddddd, 0x9b4dc4])));
    cont.position.set(-9 + (i % 4) * 6, 13.5 + Math.floor(i / 16) * 3.2, 30 - Math.floor((i % 16) / 4) * 14);
    ship.add(cont);
  }
  ship.position.set(740, 0, z); w.scene.add(ship);

  // guindastes
  for (let i = 0; i < 3; i++) {
    const gx = 560, gz = -400 + i * 80;
    const crane = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 8), mat(0xe0a52e, { metalness: .4 })); base.position.y = 1; crane.add(base);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(2, 38, 2), mat(0xe0a52e, { metalness: .4 })); mast.position.y = 20; crane.add(mast);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(44, 1.5, 2), mat(0xe0a52e, { metalness: .4 })); arm.position.set(14, 37, 0); crane.add(arm);
    crane.position.set(gx, 0, gz); w.scene.add(crane);
    w.addObstacle(gx - 5, gx + 5, gz - 5, gz + 5, 38);
  }

  // containers no pátio
  const colors = [0xd8442e, 0x2a72c8, 0xf1b83a, 0x35a56b, 0xdddddd, 0x9b4dc4, 0xea6f1e];
  for (let i = 0; i < 70; i++) {
    const gx = 460 + (i % 7) * 16 + rand(-2, 2);
    const gz = -450 + Math.floor(i / 7) * 24;
    const stack = i % 3;
    for (let s = 0; s <= stack; s++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(12, 3, 20), mat(colors[(i + s) % colors.length], { metalness: .35, roughness: .5 }));
      c.position.set(gx, 1.6 + s * 3.05, gz); c.castShadow = true; w.scene.add(c);
    }
  }
  const shed = new THREE.Mesh(new THREE.BoxGeometry(70, 14, 40), mat(0x6f7a80, { metalness: .25, roughness: .65 }));
  shed.position.set(500, 7, -230); shed.castShadow = true; w.scene.add(shed);
  w.addSign('PORTO DE CAIO', 500, 15, -209.8, 0, 34, 4, { bg: '#081c2b', color: '#5ee0ff', border: '#5ee0ff', font: 'bold 60px Arial', sub: 'CONTAINERS · LOGÍSTICA · EXPORTAÇÃO', subColor: '#c8f6ff' });

  for (let i = 0; i < 3; i++) {
    const t = new THREE.Group();
    const cab = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 3), mat(pick([0xd8442e, 0x2a72c8, 0xf1b83a]))); cab.position.set(0, 1.8, 3.8); t.add(cab);
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(3, 2.8, 8), mat(0xdcdcd6)); cargo.position.set(0, 2.1, -1); t.add(cargo);
    for (const [wx, wz] of [[-1.4, 3], [1.4, 3], [-1.4, -2], [1.4, -2]]) { const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .4, 8), mat(0x181818)); wheel.rotation.z = Math.PI / 2; wheel.position.set(wx, .6, wz); t.add(wheel); }
    t.position.set(430 + i * 16, 0, -300 + i * 12); t.rotation.y = rand(0, 6); w.scene.add(t);
  }
}

/* ============================ SERRA ============================ */
function buildSerra(w) {
  const mountainMat = new THREE.MeshStandardMaterial({ color: 0x4c5e50, roughness: .96, flatShading: true });
  const mountains = [
    [-430, -520, 130, 190], [-340, -560, 100, 150], [-520, -470, 90, 125], [-300, -470, 70, 90]
  ];
  mountains.forEach(([x, z, r, h]) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), mountainMat);
    m.position.set(x, h / 2 - 4, z); m.castShadow = true; m.receiveShadow = true; w.scene.add(m);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * .4, h * .18, 8), mat(0x8c9d95, { roughness: 1 }));
    cap.position.set(x, h - h * .09 - 4, z); w.scene.add(cap);
  });
  const trail = makeDirtRoad(w, -390, -420, 10, 180, .35);
  trail.rotation.z = .2;
  // caverna
  const cave = new THREE.Mesh(new THREE.SphereGeometry(8, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x050708, side: THREE.BackSide }));
  cave.position.set(-385, 0, -440); w.scene.add(cave);
  const caveRock = new THREE.Mesh(new THREE.DodecahedronGeometry(10, 0), mat(0x4d5a50, { roughness: 1 }));
  caveRock.position.set(-390, 5, -450); caveRock.scale.set(1.2, .8, 1); w.scene.add(caveRock);
  // cachoeira
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(16, 44), new THREE.MeshBasicMaterial({ color: 0xa9ecff, transparent: true, opacity: .68, side: THREE.DoubleSide }));
  fall.position.set(-350, 22, -510); w.scene.add(fall);
  const pool = makeWater(w, -350, -488, 30, 18, 0x2f8fa8, .1);
  // animais
  for (let i = 0; i < 3; i++) {
    const wolf = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, .7, .7), mat(0x7a7d80)); body.position.y = .8; wolf.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, .5), mat(0x8d9092)); head.position.set(0, 1.15, .55); wolf.add(head);
    for (const [x, z] of [[-.5, .25], [.5, .25], [-.5, -.25], [.5, -.25]]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(.14, .8, .14), mat(0x6b6e70)); leg.position.set(x, .4, z); wolf.add(leg); }
    wolf.position.set(-340 + i * 16, 0, -420 + i * 12); wolf.rotation.y = rand(0, 6); w.scene.add(wolf);
  }
  const jaguar = new THREE.Group();
  const jbody = new THREE.Mesh(new THREE.BoxGeometry(1.8, .8, .9), mat(0xc99b3c)); jbody.position.y = .8; jaguar.add(jbody);
  const jhead = new THREE.Mesh(new THREE.BoxGeometry(.6, .55, .55), mat(0xd6a94a)); jhead.position.set(0, 1.15, .7); jaguar.add(jhead);
  jaguar.position.set(-300, 0, -430); w.scene.add(jaguar);
  w.addSign('SERRA DO CAIO', -420, 18, -390, 0, 30, 4, { bg: 'rgba(10,18,20,.6)', color: '#d8f4ff', border: '#7d9dab', font: 'bold 60px Arial', sub: 'MONTANHA · CACHOEIRA · NEBLINA', subColor: '#b9d6df' });
}

/* ============================ INDUSTRIAL ============================ */
function buildIndustrial(w) {
  const cx = 350, cz = -170;
  for (let i = 0; i < 4; i++) {
    const x = cx + (i % 2) * 80 - 30;
    const z = cz + Math.floor(i / 2) * 70 - 30;
    const h = rand(16, 26);
    makeBuilding(w, x, z, rand(36, 50), rand(28, 40), h, pick([0x737a7c, 0x8c8172, 0x60696c]), { lit: .25, windows: false, roofColor: 0x4e5556 });
    for (let s = 0; s < 2; s++) {
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.2, rand(18, 30), 8), mat(0x5a5550, { roughness: .9 }));
      stack.position.set(x + (s ? 12 : -12), stack.geometry.parameters.height / 2 + h, z - 8);
      stack.castShadow = true; w.scene.add(stack);
      const smoke = new THREE.Mesh(new THREE.SphereGeometry(2.5, 7, 5), new THREE.MeshBasicMaterial({ color: 0x9aa0a0, transparent: true, opacity: .2, depthWrite: false }));
      smoke.position.set(stack.position.x, stack.position.y + 4, stack.position.z);
      w.scene.add(smoke);
      w.smokeEmitters.push({ mesh: smoke, baseY: stack.position.y + 4, phase: Math.random() });
    }
  }
  // galpões
  for (let i = 0; i < 4; i++) {
    const shed = new THREE.Mesh(new THREE.BoxGeometry(34, 9, 24), mat(0x8a8c84, { metalness: .3, roughness: .6 }));
    shed.position.set(cx - 70 + i * 40, 4.5, cz + 100); shed.castShadow = true; w.scene.add(shed);
  }
  // tanques
  for (let i = 0; i < 4; i++) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 14, 12), mat(0xb3b6b2, { metalness: .55, roughness: .4 }));
    tank.position.set(cx - 90, 7, cz - 30 + i * 20); tank.castShadow = true; w.scene.add(tank);
  }
  // fumaça de chaminé extra
  const factorySign = w.addSign('DISTRITO INDUSTRIAL', cx, 20, cz + 140, 0, 34, 4.2, { bg: 'rgba(30,20,8,.7)', color: '#ffb24b', border: '#ff8a2e', font: 'bold 62px Arial', sub: 'FÁBRICA · FERRO · AÇO', subColor: '#fff' });
  // piscina tóxica
  const toxic = new THREE.Mesh(new THREE.CircleGeometry(12, 20), new THREE.MeshBasicMaterial({ color: 0x6cff3d, transparent: true, opacity: .65 }));
  toxic.rotation.x = -Math.PI / 2; toxic.position.set(cx + 60, .1, cz + 50); w.scene.add(toxic);
}

/* ============================ BAIRRO JAPONÊS ============================ */
function buildJapanese(w) {
  const cx = 170, cz = 330;
  const redMat = mat(0xd22f2f, { roughness: .65 });
  const darkMat = mat(0x2d2526, { roughness: .8 });
  const woodMat = mat(0x6b4328, { roughness: .85 });
  for (let i = 0; i < 7; i++) {
    const x = cx - 60 + (i % 4) * 38;
    const z = cz + Math.floor(i / 4) * 46 - 20;
    const h = rand(8, 18);
    makeBuilding(w, x, z, rand(16, 26), rand(14, 22), h, pick([0xd9d2c0, 0xb74a4a, 0x3f4c5c, 0xe4ddcc]), { lit: .7, roofColor: 0x2e2523, tank: false });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(16, 5, 4), darkMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(x, h + 2.4, z);
    roof.scale.set(1, 1, .8);
    roof.castShadow = true; w.scene.add(roof);
    // lanternas
    for (const sx of [-6, 6]) {
      const lantern = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff1a1a, emissiveIntensity: 2.6, roughness: .5 }));
      lantern.position.set(x + sx, 5.5, z + 8); w.scene.add(lantern);
      const gl = new THREE.PointLight(0xff3b3b, 3, 12, 2); gl.position.copy(lantern.position); w.scene.add(gl);
    }
  }
  // torii
  const torii = new THREE.Group();
  for (const sx of [-7, 7]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.7, .9, 10, 8), redMat); p.position.set(sx, 5, 0); p.castShadow = true; torii.add(p);
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(18, 1, 1.4), redMat); top.position.y = 10; torii.add(top);
  const top2 = new THREE.Mesh(new THREE.BoxGeometry(14, .7, 1.1), redMat); top2.position.y = 8.4; torii.add(top2);
  torii.position.set(cx - 80, 0, cz + 60); torii.rotation.y = .2; w.scene.add(torii);
  w.addObstacle(cx - 88, cx - 72, cz + 58, cz + 62, 10);
  w.addSign('BAIRRO JAPONÊS', cx - 80, 12, cz + 60, .2, 20, 3.2, { bg: 'rgba(40,6,6,.8)', color: '#ffcf5c', border: '#ff3b3b', font: 'bold 52px Arial', sub: 'SUSHI · ANIME · LANTERNAS', subColor: '#fff' });
  // placas
  addGlowSign(w, 'SUSHI', cx + 20, 8, cz - 20, 0, 10, 2.2, '#ff6b6b');
  addGlowSign(w, 'ANIME STORE', cx - 20, 9, cz + 12, 0, 14, 2.4, '#7d9dff');
  // cerejeiras
  for (let i = 0; i < 8; i++) {
    const x = cx + rand(-50, 50), z = cz + rand(-40, 40);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18, .26, 3, 5), woodMat); trunk.position.set(x, 1.5, z); w.scene.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(1.8, 2.8), 0), new THREE.MeshStandardMaterial({ color: 0xffb7d7, roughness: .9 })); crown.position.set(x, 4, z); w.scene.add(crown);
  }
}

/* ============================ ARCHES ============================ */
function buildDistrictArches(w) {
  const arches = [
    ['CENTRO', 0, 290, 0, '#55b5ff'], ['FAVELA', -200, -250, .3, '#ff6eb4'],
    ['PRAIA', 500, 250, -.2, '#ffd45c'], ['AEROPORTO', 0, -320, 0, '#7ad8ff'],
    ['INTERIOR', -500, 220, 0, '#79df7d'], ['BAIRRO RICO', 320, 220, 0, '#ffd98e'],
    ['PORTO', 470, -240, .1, '#5fe0c8'], ['SERRA', -410, -330, 0, '#a4b6c9'],
    ['INDUSTRIAL', 350, -80, 0, '#ff9e54'], ['JAPONÊS', 160, 250, 0, '#ff6478']
  ];
  arches.forEach(([name, x, z, ry, color]) => {
    const g = new THREE.Group();
    for (const sx of [-7, 7]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(.45, .55, 9, 6), mat(0x3a4146, { metalness: .4 })); p.position.set(sx, 4.5, 0); g.add(p);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(18, .6, .8), mat(0x3a4146, { metalness: .4 })); top.position.y = 9; g.add(top);
    g.position.set(x, 0, z); g.rotation.y = ry; w.scene.add(g);
    w.addSign(name, x, 10, z + .5, ry, 14, 2.2, { bg: 'rgba(4,8,16,.8)', color, border: color, font: 'bold 52px Arial' });
  });
}
