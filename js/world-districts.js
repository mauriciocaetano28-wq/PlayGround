import { THREE, COLORS, rand, pick, addBox, addPlane, mergeToMesh, textTexture } from './world-utils.js';
import {
  mat, makeBuilding, addLabel, addGlowSign, makePalm, makeTreeInstances,
  makeTrafficLight, makeLamps, makeStaticCar, makeDirtRoad, makeWater
} from './district-utils.js';
import { buildZones } from './district-zones.js';

export function buildWorld(w) {
  buildRoads(w);
  buildCentro(w);
  buildStreetCommerce(w);
  buildZones(w);
  makeLamps(w);
  makeTreeInstances(w, w.quality === 'low' ? 130 : 240);
  buildTrafficLights(w);
  buildAirplane(w);
  buildBirdsOverCity(w);
}

function buildRoads(w) {
  const roads = [], walks = [], marks = [], yellow = [];
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x14171b, roughness: .58, metalness: .08, envMapIntensity: .5 });
  w.roadMat = roadMat;
  const walkMat = new THREE.MeshStandardMaterial({ color: 0x8d8d86, roughness: .9 });
  w.walkMat = walkMat;
  const markMat = new THREE.MeshBasicMaterial({ color: 0xf4f0d8 });
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffcb35 });

  for (const c of w.roadCoords) {
    const width = c === 0 ? 24 : 14;
    addBox(roads, 1120, .06, width, 0, .02, c);
    addBox(roads, width, .06, 1120, c, .02, 0);
    addBox(walks, 1120, .16, 4, 0, .08, c + width / 2 + 2);
    addBox(walks, 1120, .16, 4, 0, .08, c - width / 2 - 2);
    addBox(walks, 4, .16, 1120, c + width / 2 + 2, .08, 0);
    addBox(walks, 4, .16, 1120, c - width / 2 - 2, .08, 0);
    // faixas amarelas centrais
    addBox(yellow, 1120, .035, .14, 0, .075, c - .18);
    addBox(yellow, 1120, .035, .14, 0, .075, c + .18);
    addBox(yellow, .14, .035, 1120, c - .18, .075, 0);
    addBox(yellow, .14, .035, 1120, c + .18, .075, 0);
    // faixas brancas tracejadas
    for (let t = -550; t < 550; t += 12) {
      addBox(marks, 4.5, .03, .16, t, .075, c - 4.2);
      addBox(marks, 4.5, .03, .16, t, .075, c + 4.2);
      addBox(marks, .16, .03, 4.5, c - 4.2, .075, t);
      addBox(marks, .16, .03, 4.5, c + 4.2, .075, t);
    }
  }
  // faixa de pedestre no centro
  for (let i = -5; i <= 5; i++) {
    addBox(marks, .7, .04, 7, i * 1.35, .08, 8.2);
    addBox(marks, .7, .04, 7, i * 1.35, .08, -8.2);
    addBox(marks, 7, .04, .7, 8.2, .08, i * 1.35);
    addBox(marks, 7, .04, .7, -8.2, .08, i * 1.35);
  }
  // faixas em outros cruzamentos principais
  for (const c of [-240, 240, 400, -400]) {
    for (let i = -4; i <= 4; i++) {
      addBox(marks, .6, .04, 6, i * 1.2, .08, c + 8.2);
      addBox(marks, .6, .04, 6, i * 1.2, .08, c - 8.2);
    }
  }
  const roadMesh = mergeToMesh(roads, roadMat, { castShadow: false });
  const walkMesh = mergeToMesh(walks, walkMat);
  const markMesh = mergeToMesh(marks, markMat, { castShadow: false });
  const yellowMesh = mergeToMesh(yellow, yellowMat, { castShadow: false });
  if (roadMesh) w.scene.add(roadMesh);
  if (walkMesh) w.scene.add(walkMesh);
  if (markMesh) w.scene.add(markMesh);
  if (yellowMesh) w.scene.add(yellowMesh);

  // placas de rua
  const signs = [
    ['AV. BRASIL', 20, 24, -18, .2], ['RUA DA PRAIA', 420, 24, 34, -.4],
    ['AV. CENTRAL', -180, 24, 20, 1.2], ['RUA DO MORRO', -260, 24, -220, .6],
    ['AV. INDUSTRIAL', 330, 24, -190, -.1], ['RUA JAPÃO', 160, 24, 290, 1.4],
    ['RODOVIA DO AEROPORTO', 40, 24, -380, 0], ['RUA DO COMÉRCIO', 120, 24, 190, .9]
  ];
  signs.forEach(([txt, x, y, z, ry]) => {
    const m = w.addSign(txt, x, y, z, ry, 8, 1.4, { bg: '#0d3a2a', color: '#fff', border: '#f4f4f4', font: 'bold 54px Arial', sub: 'BRASIL · CIDADE CAIO', subColor: '#bfe8cf' });
    m.material.depthTest = true;
  });

  // faixa BRASIL no chão da avenida central
  const flag = w.addSign('BRASIL', 0, .09, 58, 0, 18, 4.5, { bg: 'rgba(0,120,60,.9)', color: '#ffdf3d', border: '#ffdf3d', font: 'bold 100px Arial', sub: 'ORDEM E PROGRESSO', subColor: '#fff' });
  flag.rotation.x = -Math.PI / 2;
  flag.rotation.z = Math.PI;
}

function buildCentro(w) {
  const reserved = [];
  const addReserved = (x, z, ww, dd) => reserved.push({ x, z, ww, dd });
  const blocked = (x, z, ww, dd) => {
    if (Math.abs(x) < 26 || Math.abs(z) < 26) return true;
    for (const r of reserved) {
      if (Math.abs(x - r.x) < (ww + r.ww) / 2 + 8 && Math.abs(z - r.z) < (dd + r.dd) / 2 + 8) return true;
    }
    return false;
  };

  // Landmarks do Centro
  makeBuilding(w, -120, 60, 38, 30, 26, 0xd7d1bd, { roofColor: 0x8f897a, lit: .62 });
  addReserved(-120, 60, 38, 30);
  addLabel(w, 'BANCO DO BRASIL', -120, 15, 75.2, 0, 26, 4, { bg: '#123b7a', color: '#ffe14d', border: '#ffe14d', font: 'bold 54px Arial', sub: 'AGÊNCIA CENTRO', subColor: '#fff' });
  for (let i = 0; i < 5; i++) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 10, 10), mat(0xe9e2cd, { roughness: .65 }));
    col.position.set(-134 + i * 7, 5, 74); col.castShadow = true; w.scene.add(col);
  }

  makeBuilding(w, 120, 60, 44, 36, 32, 0xe9ece9, { roofColor: 0xbcc3c1, lit: .7, tank: false });
  addReserved(120, 60, 44, 36);
  addLabel(w, 'HOSPITAL CENTRAL', 120, 19, 78.2, 0, 30, 4, { bg: '#f2f4f1', color: '#c21f2a', border: '#c21f2a', font: 'bold 48px Arial', sub: 'SUS · ATENDIMENTO 24H', subColor: '#23334d' });
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8, .7), new THREE.MeshBasicMaterial({ color: 0xd9202f }));
  crossV.position.set(120, 25, 78.4); w.scene.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(8, 2.4, .7), new THREE.MeshBasicMaterial({ color: 0xd9202f }));
  crossH.position.set(120, 25, 78.4); w.scene.add(crossH);

  makeBuilding(w, 40, -120, 36, 30, 20, 0x4a6688, { roofColor: 0x33485f, lit: .55 });
  addReserved(40, -120, 36, 30);
  addLabel(w, 'DELEGACIA', 40, 12, -104.8, 0, 22, 3.6, { bg: '#112b4d', color: '#9ed6ff', border: '#4ba7e8', font: 'bold 58px Arial', sub: 'POLÍCIA CIVIL · 3º DP', subColor: '#fff' });
  addGlowSign(w, 'POLÍCIA', 40, 18, -104.5, 0, 12, 2.2, '#57b9ff');

  makeBuilding(w, -40, -120, 48, 36, 28, 0xd8ccb5, { roofColor: 0x9b8d75, lit: .6 });
  addReserved(-40, -120, 48, 36);
  addLabel(w, 'PREFEITURA', -40, 16, -101.8, 0, 24, 3.6, { bg: '#1b3b5b', color: '#fff', border: '#f4d26d', font: 'bold 54px Arial', sub: 'CIDADE CAIO · BRASIL', subColor: '#ffe8a3' });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x7c9a8a, { metalness: .4, roughness: .4 }));
  dome.position.set(-40, 28, -120); dome.castShadow = true; w.scene.add(dome);

  makeBuilding(w, 160, -140, 58, 46, 24, 0xb7b1a4, { roofColor: 0x706b61, lit: .8 });
  addReserved(160, -140, 58, 46);
  addLabel(w, 'SHOPPING CENTRAL', 160, 14, -116.8, 0, 34, 4, { bg: '#4a133e', color: '#ff7ac8', border: '#ff7ac8', font: 'bold 50px Arial', sub: 'CINEMA · PRAÇA DE ALIMENTAÇÃO', subColor: '#fff' });

  makeBuilding(w, -160, -140, 34, 30, 22, 0x2b2532, { roofColor: 0x16121b, lit: .3 });
  addReserved(-160, -140, 34, 30);
  addGlowSign(w, 'CINEMA', -160, 13, -124.8, 0, 18, 3, '#ff3f65');

  makeBuilding(w, 50, 120, 20, 22, 11, 0xf3efe0, { lit: .5 });
  addReserved(50, 120, 20, 22);
  addLabel(w, 'FARMÁCIA', 50, 7, 131.2, 0, 14, 2.5, { bg: '#0c6d3b', color: '#fff', border: '#5cff9d', font: 'bold 52px Arial', sub: '24 HORAS', subColor: '#d9ffe9' });

  makeBuilding(w, -50, 120, 20, 22, 10, 0xe0c49a, { lit: .45 });
  addReserved(-50, 120, 20, 22);
  addLabel(w, 'PADARIA', -50, 6.5, 131.2, 0, 14, 2.4, { bg: '#6b3c12', color: '#ffd98d', border: '#ffb24b', font: 'bold 52px Arial', sub: 'PÃO NA CHAPA · CAFÉ', subColor: '#fff0d0' });

  // torres do centro
  const towerColors = [0x8493a8, 0xb8c4d2, 0x5c7290, 0xc9c2b4, 0x6d7c8a, 0x9ca9b9, 0x4e6680, 0xd1c9b8];
  let placed = 0;
  for (let tries = 0; tries < 300 && placed < 30; tries++) {
    const x = rand(-250, 250), z = rand(-250, 250);
    const ww = rand(20, 38), dd = rand(20, 34);
    if (blocked(x, z, ww, dd)) continue;
    if (Math.hypot(x, z) < 70) continue;
    const h = rand(32, 100);
    makeBuilding(w, x, z, ww, dd, h, pick(towerColors), { glass: Math.random() < .35, lit: rand(.35, .75), stripes: Math.random() < .25 ? 3 : 0, stripeColor: 0xd7d2c4 });
    addReserved(x, z, ww, dd);
    placed++;
  }

  // praça central
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(18, 24), mat(0x9d9b8e, { roughness: .9 }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, .11, 0); plaza.receiveShadow = true; w.scene.add(plaza);
  const monument = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 9, 8), mat(0x9fa6a0, { metalness: .4, roughness: .45 }));
  monument.position.set(0, 4.6, 0); monument.castShadow = true; w.scene.add(monument);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffd45c, metalness: .8, roughness: .18, envMapIntensity: 1.4 }));
  orb.position.set(0, 9.5, 0); w.scene.add(orb);
  w.spawnPoint = new THREE.Vector3(14, 0, 26);

  // ponto de ônibus
  const bus = new THREE.Group();
  const roof = new THREE.Mesh(new THREE.BoxGeometry(7, .2, 2.4), mat(0x303a42, { metalness: .3 }));
  roof.position.y = 2.8; bus.add(roof);
  for (const sx of [-3.2, 3.2]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 2.8, 6), mat(0x59666d));
    p.position.set(sx, 1.4, 0); bus.add(p);
  }
  const bench = new THREE.Mesh(new THREE.BoxGeometry(5.4, .18, .7), mat(0x7a4f2b));
  bench.position.set(0, .6, .6); bus.add(bench);
  const sign = w.addSign('PONTO DE ÔNIBUS', 28, 3.6, 18, .2, 6, 1.2, { bg: '#1457a3', color: '#fff', font: 'bold 48px Arial' });
  bus.add(sign); sign.position.set(0, 3.2, 0); sign.rotation.y = 0;
  bus.position.set(28, 0, 18); w.scene.add(bus);
}

function buildStreetCommerce(w) {
  // Posto de gasolina
  const gx = 100, gz = 190;
  const station = new THREE.Group();
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(24, 1.2, 16), mat(0xf4f1e6, { roughness: .55 }));
  canopy.position.y = 6; canopy.castShadow = true; station.add(canopy);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(24.4, .5, 16.4), mat(0x167a3f, { roughness: .5 }));
  stripe.position.y = 5.4; station.add(stripe);
  for (const [px, pz] of [[-9, -5], [9, -5], [-9, 5], [9, 5]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.28, .32, 6, 8), mat(0xd6d8d5, { metalness: .35, roughness: .4 }));
    pole.position.set(px, 3, pz); pole.castShadow = true; station.add(pole);
  }
  for (const px of [-4.5, 4.5]) {
    const pump = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, .8), mat(0xe9e7df));
    pump.position.set(px, 1.2, 0); station.add(pump);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(.8, .55, .06), new THREE.MeshBasicMaterial({ color: 0x2bd7ff }));
    screen.position.set(px, 1.8, .43); station.add(screen);
  }
  const store = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 8), mat(0xe9e4d6));
  store.position.set(15, 2.5, 8); store.castShadow = true; station.add(store);
  station.position.set(gx, 0, gz); w.scene.add(station);
  w.addSign('POSTO BRASIL', gx + 15, 5.2, gz + 12.1, 0, 13, 2.5, { bg: '#0a5c32', color: '#fff', border: '#ffd33c', font: 'bold 55px Arial', sub: 'CONVENIÊNCIA 24H', subColor: '#ffeaa2' });
  w.addSign('GASOLINA R$ 6,50', gx - 2, 7.5, gz + 8.2, 0, 12, 2.3, { bg: '#081b10', color: '#66ff9d', border: '#ffd33c', font: 'bold 50px Arial', sub: 'ETANOL R$ 4,39 · DIESEL R$ 6,89', subColor: '#fff' });
  w.pois.push({ type: 'gas', name: 'Posto Brasil', x: gx, z: gz, radius: 18, icon: '⛽' });

  // Loja de roupas
  makeBuilding(w, -110, 190, 24, 22, 12, 0xf3b3cf, { lit: .6 });
  addLabel(w, 'MODA CAIO', -110, 7.5, 201.2, 0, 18, 3, { bg: '#3c0f2b', color: '#ff9ed4', border: '#ff5fb2', font: 'bold 55px Arial', sub: '100 ROUPAS · ESTILO BR', subColor: '#fff' });
  w.pois.push({ type: 'clothing', name: 'Loja de Roupas', x: -110, z: 190, radius: 16, icon: '👕' });

  // Barbearia
  makeBuilding(w, 160, 100, 18, 18, 10, 0x29252d, { lit: .4 });
  addGlowSign(w, 'BARBEARIA', 160, 6, 109.2, 0, 14, 2.4, '#6dd7ff');
  w.pois.push({ type: 'barber', name: 'Barbearia', x: 160, z: 100, radius: 14, icon: '💈' });

  // Academia
  makeBuilding(w, -160, 100, 26, 24, 14, 0x3e4a52, { lit: .5 });
  addGlowSign(w, 'ACADEMIA', -160, 8, 112.2, 0, 16, 2.6, '#a6ff4f');
  w.pois.push({ type: 'gym', name: 'Academia', x: -160, z: 100, radius: 15, icon: '🏋' });

  // Ammu-Nation
  makeBuilding(w, 200, 60, 22, 20, 12, 0x323232, { lit: .3 });
  addGlowSign(w, 'AMMU-NATION', 200, 7, 70.2, 0, 18, 3, '#ffcf3d');
  w.pois.push({ type: 'gun', name: 'Ammu-Nation', x: 200, z: 60, radius: 15, icon: '🔫' });

  // Mecânica
  const mx = 220, mz = -100;
  const shop = new THREE.Mesh(new THREE.BoxGeometry(24, 7, 18), mat(0x667278, { roughness: .8 }));
  shop.position.set(mx, 3.5, mz); shop.castShadow = true; w.scene.add(shop);
  const door = new THREE.Mesh(new THREE.BoxGeometry(14, 5.5, .2), mat(0x22272a));
  door.position.set(mx, 2.75, mz + 9.1); w.scene.add(door);
  w.addSign('MECÂNICA DO ZÉ', mx, 8.6, mz + 9.3, 0, 20, 3, { bg: '#101820', color: '#ffb24b', border: '#ffb24b', font: 'bold 50px Arial', sub: 'CONSERTO · PINTURA · TURBO', subColor: '#fff' });
  w.pois.push({ type: 'mechanic', name: 'Mecânica do Zé', x: mx, z: mz, radius: 16, icon: '🔧' });

  // Borracharia, lava-jato, celular, lanchonete
  makeBuilding(w, 250, -180, 16, 14, 7, 0x8b7b62, { lit: .3, windows: false });
  w.addSign('BORRACHARIA', 250, 5, -172.2, 0, 14, 2.4, { bg: '#241b12', color: '#ffe0a3', border: '#ff9a3d', font: 'bold 48px Arial' });
  makeBuilding(w, 270, -40, 18, 16, 8, 0x3a5d70, { lit: .3, windows: false });
  w.addSign('LAVA-JATO', 270, 5.4, -31.2, 0, 14, 2.4, { bg: '#062435', color: '#5ee0ff', border: '#5ee0ff', font: 'bold 48px Arial' });
  makeBuilding(w, 120, 230, 14, 14, 8, 0x4b4a54, { lit: .4, windows: false });
  w.addSign('CELULAR BR', 120, 5.2, 237.2, 0, 12, 2.2, { bg: '#150a2e', color: '#b993ff', border: '#9d6bff', font: 'bold 46px Arial' });
  makeBuilding(w, 40, 230, 18, 15, 8, 0xd8a43b, { lit: .4, windows: false });
  w.addSign('LANCHONETE', 40, 5.4, 237.2, 0, 14, 2.4, { bg: '#3d1d07', color: '#ffd04f', border: '#ff9d2e', font: 'bold 48px Arial', sub: 'X-TUDO · AÇAÍ · PASTEL', subColor: '#fff2ce' });
  w.pois.push({ type: 'food', name: 'Lanchonete', x: 40, z: 230, radius: 14, icon: '🍔' });

  // Casa do jogador
  makeBuilding(w, 290, 250, 24, 20, 9, 0xe1d7c4, { lit: .4 });
  w.addSign('CASA DO CAIO', 290, 5.8, 260.2, 0, 16, 2.6, { bg: '#183a2a', color: '#baffd0', border: '#5aff9d', font: 'bold 48px Arial', sub: 'SALVAR · DORMIR · GARAGEM', subColor: '#fff' });
  w.pois.push({ type: 'house', name: 'Casa do Caio', x: 290, z: 250, radius: 16, icon: '🏠' });

  // Banco extra, joalheria, prefeitura já no centro
  makeBuilding(w, -220, 160, 22, 20, 14, 0xc9b37e, { lit: .5 });
  w.addSign('JOALHERIA', -220, 7.5, 170.2, 0, 14, 2.4, { bg: '#3a2b09', color: '#ffe16b', border: '#ffd23d', font: 'bold 48px Arial' });
  w.pois.push({ type: 'jewelry', name: 'Joalheria', x: -220, z: 160, radius: 14, icon: '💎' });

  // faixas de ônibus e placas de trânsito
  for (const [x, z, txt] of [[30, 60, '30 km/h'], [-60, -180, 'PARE'], [180, 20, '30 km/h'], [-200, 60, 'PARE']]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.7, 6), mat(0x666d70));
    pole.position.set(x, 1.35, z); w.scene.add(pole);
    w.addSign(txt, x, 2.9, z + .08, 0, 1.6, 1.1, { bg: '#f2f2ec', color: '#b3171f', border: '#b3171f', font: 'bold 64px Arial' });
  }
}

function buildTrafficLights(w) {
  const tl = [
    [14, 14, 'x', Math.PI], [-14, -14, 'x', 0], [14, -14, 'z', -Math.PI / 2], [-14, 14, 'z', Math.PI / 2]
  ];
  tl.forEach(([x, z, axis, ry]) => makeTrafficLight(w, x, z, axis, ry));
  w.updateTrafficLights();
}

function buildAirplane(w) {
  const g = new THREE.Group();
  const white = mat(0xf1f3f2, { metalness: .25, roughness: .35 });
  const blue = mat(0x1b5bb5, { metalness: .3, roughness: .35 });
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(3, 2.2, 38, 12), white);
  fuselage.rotation.x = Math.PI / 2; fuselage.castShadow = true; g.add(fuselage);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5, 12), white);
  nose.rotation.x = -Math.PI / 2; nose.position.z = 21.5; g.add(nose);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(2.1, 6, 8), white);
  tail.rotation.x = Math.PI / 2; tail.position.z = -21.5; g.add(tail);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(42, .45, 7), white);
  wing.position.set(0, -.4, 2); wing.castShadow = true; g.add(wing);
  const wingStripe = new THREE.Mesh(new THREE.BoxGeometry(42.2, .12, 1.4), blue);
  wingStripe.position.set(0, -.12, 2); g.add(wingStripe);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(.4, 7, 5), blue);
  fin.position.set(0, 4.5, -17); g.add(fin);
  const horStab = new THREE.Mesh(new THREE.BoxGeometry(12, .25, 3), white);
  horStab.position.set(0, 1.4, -19); g.add(horStab);
  for (const sx of [-7, 7]) {
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 3.2, 10), mat(0x9099a2, { metalness: .5, roughness: .4 }));
    engine.rotation.x = Math.PI / 2; engine.position.set(sx, -1.6, 3); g.add(engine);
  }
  for (let i = 0; i < 8; i++) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(.7, .5), new THREE.MeshBasicMaterial({ color: 0x1a2630 }));
    win.position.set(0, .8, -12 + i * 3); win.rotation.y = Math.PI / 2; win.position.x = 2.55; g.add(win);
  }
  g.position.set(0, 8, -760);
  w.scene.add(g);
  w.plane = g;
  // helicóptero parado no aeroporto
  const heli = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 7), mat(0x203b4c, { metalness: .4, roughness: .35 }));
  body.scale.set(1, .8, 1.7); body.position.y = 1.4; heli.add(body);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(.25, .16, 7, 6), mat(0x203b4c));
  boom.rotation.x = Math.PI / 2; boom.position.set(0, 1.5, -5); heli.add(boom);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(14, .1, .5), mat(0x151a1e));
  rotor.position.y = 3.2; heli.add(rotor);
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(.1, 3, .4), mat(0x151a1e));
  tailRotor.position.set(0, 1.9, -8.3); heli.add(tailRotor);
  heli.position.set(120, 0, -370); w.scene.add(heli);
  w.helicopter = heli;
}

function buildBirdsOverCity(w) {
  // gaivotas extras no porto
  const gullMat = new THREE.MeshBasicMaterial({ color: 0xe9f2f7 });
  for (let i = 0; i < 14; i++) {
    const g = new THREE.Group();
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.4, .05, .3), gullMat);
    wingL.position.x = -.7; wingL.rotation.z = .25; g.add(wingL);
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(1.4, .05, .3), gullMat);
    wingR.position.x = .7; wingR.rotation.z = -.25; g.add(wingR);
    g.position.set(rand(520, 750), rand(12, 40), rand(-420, -240));
    g.userData = { a: Math.random() * 6, r: rand(10, 50), cx: g.position.x, cz: g.position.z, s: rand(.2, .5) };
    w.scene.add(g);
    w.gulls = w.gulls || [];
    w.gulls.push(g);
  }
}
