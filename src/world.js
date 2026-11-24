import * as THREE from 'three';
import {
  rand, pick, noiseTexture, textureFromCanvas, makeCanvas, makeRadialTexture,
  makeTextTexture, makeBillboard, createInstanced, setInstance, clamp, lerp
} from './utils.js';

export const WORLD = {
  oceanZ: 146,
  beachMinZ: 108,
  beachMaxZ: 146,
  promenadeMinZ: 89,
  promenadeMaxZ: 108,
  coastRoadZ: 82,
  minX: -390,
  maxX: 390,
  minZ: -390,
  roadXs: [-340, -230, -120, -10, 100, 210, 320],
  roadZs: [-340, -230, -120, -10, 100, 82].sort((a, b) => a - b),
  districts: [
    { id: 'orla', namePt: 'Orla Central', nameEn: 'Central Shore', descPt: 'Areia, neon e dinheiro fácil. O coração de Costa Dourada.', descEn: 'Sand, neon and easy money. The heart of Costa Dourada.', test: (x, z) => z > 55 },
    { id: 'marina', namePt: 'Marina Azul', nameEn: 'Blue Marina', descPt: 'Iates, bares e negócios que não aparecem nos livros.', descEn: 'Yachts, bars and business that never makes the books.', test: (x, z) => x > 205 && z > -130 },
    { id: 'centro', namePt: 'Centro Maré', nameEn: 'Maré Center', descPt: 'Torres de vidro e ambição a perder de vista.', descEn: 'Glass towers and ambition as far as the eye can see.', test: (x, z) => Math.abs(x) < 175 && z <= -100 },
    { id: 'jardins', namePt: 'Jardins de Sal', nameEn: 'Salt Gardens', descPt: 'A parte da cidade que aprendeu a respirar devagar.', descEn: 'The part of town that learned to breathe slowly.', test: (x, z) => x <= -120 && z > -130 },
    { id: 'morro', namePt: 'Morro do Som', nameEn: 'Sound Hill', descPt: 'Casas coloridas, música alta e memória longa.', descEn: 'Colorful houses, loud music and long memories.', test: (x, z) => x <= -220 && z <= -100 },
    { id: 'porto', namePt: 'Porto Maré', nameEn: 'Maré Harbor', descPt: 'Contêineres, guindastes e o cheiro de partida.', descEn: 'Containers, cranes and the smell of departure.', test: (x, z) => x > 200 && z <= -100 }
  ]
};

const COLORS = {
  sand: 0xd8bd8d,
  asphalt: 0x1c2425,
  concrete: 0x757b76,
  curb: 0xcbd0c6,
  grass: 0x4c6850,
  trunk: 0x5a4432,
  leaf: 0x2d7253,
  windowWarm: [0xffd59a, 0xffbc75, 0xffe6b9, 0x9bd4d2],
  building: [0xd7d2c7, 0xc7bfae, 0xe1d8c6, 0xb7ada2, 0xc8d2ce, 0xe3c3a8, 0xaebdbb, 0xcfc6b9, 0xdccab1, 0xb9c7c3, 0xe4d5cb, 0xb2a79b, 0xd9cdbd],
  neon: [0xff7058, 0x43ddbe, 0xf6c768, 0xff8bc1, 0x71c7ff],
  favela: [0xf3ba4e, 0xec7157, 0x4cc9a4, 0x5aa4de, 0xe8d9ad, 0xdf7ca6, 0x8fd27b]
};

export function createWorld(scene, renderer, settings = {}) {
  const quality = settings.qualityPreset || 'balanced';
  const world = {
    scene,
    colliders: [],
    colliderMeshes: [],
    roads: [],
    blocks: [],
    npcSpawns: [],
    vehicleSpawns: [],
    locations: {},
    districts: WORLD.districts,
    animate: [],
    quality,
    time: 0
  };

  scene.background = new THREE.Color(0x152730);
  scene.fog = new THREE.FogExp2(0x8d7770, quality === 'performance' ? 0.0025 : 0.00135);

  const sandTex = noiseTexture(256, '#d4b987', ['#f1d8a5', '#b29166', '#e6cc99', '#8e7454'], .28, 28, 5);
  sandTex.anisotropy = 8;
  const groundTex = noiseTexture(256, '#455148', ['#596452', '#333d37', '#6b705e', '#2b3430'], .32, 35, 20);
  const asphaltTex = noiseTexture(256, '#333d3e', ['#434c4c', '#232b2d', '#4b5352', '#1b2224'], .32, 14, 8);

  // ---------------- LIGHTS ----------------
  const hemi = new THREE.HemisphereLight(0xb8d4d8, 0x4e3b2f, 1.24);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0xffd4b3, 0.5);
  scene.add(ambient);

  const sunDir = new THREE.Vector3(-0.65, 0.24, 1).normalize();
  const sunLight = new THREE.DirectionalLight(0xffc58f, 2.45);
  sunLight.position.copy(sunDir).multiplyScalar(170);
  sunLight.castShadow = quality !== 'performance';
  sunLight.shadow.mapSize.set(quality === 'ultra' ? 2048 : 1024, quality === 'ultra' ? 2048 : 1024);
  sunLight.shadow.camera.left = -130;
  sunLight.shadow.camera.right = 130;
  sunLight.shadow.camera.top = 130;
  sunLight.shadow.camera.bottom = -130;
  sunLight.shadow.camera.near = 5;
  sunLight.shadow.camera.far = 500;
  sunLight.shadow.bias = -0.0006;
  sunLight.target.position.set(0, 0, 0);
  scene.add(sunLight, sunLight.target);
  world.sunLight = sunLight;
  world.hemi = hemi;
  world.sunDir = sunDir;

  // warm fill from the sea
  const fill = new THREE.DirectionalLight(0x6ba3b5, 0.38);
  fill.position.set(80, 50, 180);
  scene.add(fill);

  // ---------------- SKY ----------------
  const skyUniforms = {
    uTop: { value: new THREE.Color(0x1d3150) },
    uHorizon: { value: new THREE.Color(0xf29a73) },
    uBottom: { value: new THREE.Color(0x7e6a68) },
    uSunDir: { value: sunDir.clone() },
    uTime: { value: 0 }
  };
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vDir;
      void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uBottom; uniform vec3 uSunDir; uniform float uTime;
      varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }
      void main(){
        float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(uBottom, uHorizon, smoothstep(0.42, 0.535, h));
        col = mix(col, uTop, smoothstep(0.52, 0.96, h));
        float sd = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
        col += vec3(1.0, .55, .28) * pow(sd, 90.0) * 1.4;
        col += vec3(1.0, .5, .3) * pow(sd, 8.0) * .32;
        float horizonGlow = exp(-abs(vDir.y) * 7.0) * .2;
        col += vec3(1.0,.55,.35) * horizonGlow;
        float n = noise(vDir.xz * 5.0 + vec2(uTime * .012, uTime * .006));
        float n2 = noise(vDir.xz * 13.0 - vec2(uTime * .008, 0.0));
        float clouds = smoothstep(.56, .83, n * .65 + n2 * .42) * smoothstep(.02, .2, vDir.y) * .25;
        col = mix(col, vec3(.96,.73,.65), clouds);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(880, 40, 24), skyMat);
  sky.frustumCulled = false;
  scene.add(sky);
  world.sky = sky;

  // Sun glow sprite
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeRadialTexture('#fff8d9', 'rgba(255,143,90,0)'),
    color: 0xffeac0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .95
  }));
  sunSprite.position.copy(sunDir).multiplyScalar(700);
  sunSprite.scale.setScalar(170);
  scene.add(sunSprite);
  world.sunSprite = sunSprite;

  // stars
  const starCount = 240;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const a = rand() * Math.PI * 2, y = 0.34 + rand() * 0.62, r = 720 * Math.sqrt(1 - y * y);
    starPos[i * 3] = Math.cos(a) * r;
    starPos[i * 3 + 1] = y * 720;
    starPos[i * 3 + 2] = Math.sin(a) * r;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffe8d0, size: 1.7, transparent: true, opacity: .5, depthWrite: false }));
  scene.add(stars);
  world.stars = stars;

  // clouds
  const cloudC = makeCanvas(256);
  const cctx = cloudC.getContext('2d');
  for (let i = 0; i < 22; i++) {
    const g = cctx.createRadialGradient(50 + rand() * 156, 90 + rand() * 76, 1, 50 + rand() * 156, 100 + rand() * 50, 20 + rand() * 44);
    g.addColorStop(0, 'rgba(255,226,210,.30)'); g.addColorStop(1, 'rgba(255,190,160,0)');
    cctx.fillStyle = g; cctx.fillRect(0, 0, 256, 256);
  }
  const cloudTex = new THREE.CanvasTexture(cloudC);
  for (let i = 0; i < 9; i++) {
    const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: .34, depthWrite: false, color: i % 3 === 0 ? 0xffc9ac : 0xf6d7ca }));
    cloud.position.set(-500 + rand() * 1000, 95 + rand() * 100, -250 + rand() * 750);
    cloud.scale.set(180 + rand() * 260, 45 + rand() * 60, 1);
    scene.add(cloud);
  }

  // ---------------- GROUND ----------------
  const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: .98, metalness: 0, color: 0x9c9a84 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1050, 600), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.05, -120);
  ground.receiveShadow = true;
  scene.add(ground);
  world.ground = ground;

  const promenadeTexCanvas = makeCanvas(256);
  {
    const ctx = promenadeTexCanvas.getContext('2d');
    ctx.fillStyle = '#e6dcc8'; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#6d6255'; ctx.lineWidth = 5;
    for (let y = 0; y < 256; y += 64) {
      ctx.beginPath();
      for (let x = 0; x <= 256; x += 4) ctx.lineTo(x, y + Math.sin((x / 256) * Math.PI * 4) * 18);
      ctx.stroke();
    }
    ctx.globalAlpha = .3;
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = rand() > .5 ? '#b2a78f' : '#f7efd9';
      ctx.fillRect(rand() * 256, rand() * 256, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
  }
  const promenadeTex = textureFromCanvas(promenadeTexCanvas, 38, 1);
  const promenade = new THREE.Mesh(new THREE.PlaneGeometry(900, 19), new THREE.MeshStandardMaterial({ map: promenadeTex, roughness: .92 }));
  promenade.rotation.x = -Math.PI / 2;
  promenade.position.set(0, 0.035, 98.5);
  promenade.receiveShadow = true;
  scene.add(promenade);

  const beach = new THREE.Mesh(new THREE.PlaneGeometry(900, 38), new THREE.MeshStandardMaterial({ map: sandTex, roughness: 1, color: 0xffffff }));
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(0, 0.02, 127);
  beach.receiveShadow = true;
  scene.add(beach);
  world.beach = beach;

  const wetSand = new THREE.Mesh(new THREE.PlaneGeometry(900, 9), new THREE.MeshStandardMaterial({ color: 0x9c8765, roughness: .35, metalness: .05, transparent: true, opacity: .8 }));
  wetSand.rotation.x = -Math.PI / 2;
  wetSand.position.set(0, 0.028, 142.5);
  scene.add(wetSand);

  // low seawall
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xbab6a8, roughness: .9 });
  for (let i = 0; i < 18; i++) {
    const x = -425 + i * 50;
    if (i % 6 === 4) continue;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(38, .55, .8), wallMat);
    wall.position.set(x, .27, 108.4);
    wall.castShadow = true; wall.receiveShadow = true;
    scene.add(wall);
  }

  // ---------------- ROADS ----------------
  const roadGroup = new THREE.Group();
  scene.add(roadGroup);
  const roadW = 14;
  const roadMat = new THREE.MeshStandardMaterial({ map: asphaltTex, color: 0x8f9692, roughness: .88, metalness: .04 });
  const laneMat = new THREE.MeshBasicMaterial({ color: 0xe8e2c9 });
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xe2ad4b });

  for (const x of WORLD.roadXs) {
    const length = 480;
    const tex = asphaltTex.clone();
    tex.repeat.set(14, 4);
    tex.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(roadW, length), new THREE.MeshStandardMaterial({ map: tex, color: 0xd5dbd4, roughness: .9 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.01, -145);
    m.receiveShadow = true;
    roadGroup.add(m);
    world.roads.push({ type: 'v', x, z1: -385, z2: 89, width: roadW });
  }
  for (const z of WORLD.roadZs) {
    const length = 790;
    const tex = asphaltTex.clone();
    tex.repeat.set(20, 4);
    tex.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(790, roadW), new THREE.MeshStandardMaterial({ map: tex, color: 0xd5dbd4, roughness: .9 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, 0.012, z);
    m.receiveShadow = true;
    roadGroup.add(m);
    world.roads.push({ type: 'h', z, x1: -385, x2: 385, width: roadW });
  }

  // road markings
  const dashes = [];
  const centers = [];
  for (const x of WORLD.roadXs) {
    for (let z = -382; z < 88; z += 11) {
      dashes.push({ x: x + 3.55, z, sx: .16, sz: 4.6, ry: 0 });
      dashes.push({ x: x - 3.55, z: z + 5.5, sx: .16, sz: 4.6, ry: 0 });
    }
    for (let z = -382; z < 88; z += 5) centers.push({ x: x + .18, z, sx: .13, sz: 5, ry: 0, yellow: true });
  }
  for (const z of WORLD.roadZs) {
    for (let x = -382; x < 382; x += 11) {
      dashes.push({ x, z: z + 3.55, sx: 4.6, sz: .16, ry: 0 });
      dashes.push({ x: x + 5.5, z: z - 3.55, sx: 4.6, sz: .16, ry: 0 });
    }
    for (let x = -382; x < 382; x += 5) centers.push({ x, z: z + .18, sx: 5, sz: .13, ry: 0, yellow: true });
  }
  const dashMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .012, 1), laneMat, dashes.length);
  const dObj = new THREE.Object3D();
  dashes.forEach((d, i) => { dObj.position.set(d.x, .025, d.z); dObj.scale.set(d.sx, 1, d.sz); dObj.rotation.y = d.ry; dObj.updateMatrix(); dashMesh.setMatrixAt(i, dObj.matrix); });
  dashMesh.instanceMatrix.needsUpdate = true;
  roadGroup.add(dashMesh);
  const centerMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .012, 1), yellowMat, centers.length);
  centers.forEach((d, i) => { dObj.position.set(d.x, .026, d.z); dObj.scale.set(d.sx, 1, d.sz); dObj.updateMatrix(); centerMesh.setMatrixAt(i, dObj.matrix); });
  roadGroup.add(centerMesh);

  // Crosswalks
  const crossings = [];
  for (const x of WORLD.roadXs) for (const z of WORLD.roadZs) {
    if (rand() > .7) continue;
    for (let i = -2; i <= 2; i++) {
      crossings.push({ x: x + i * 2.1, z: z + 9, sx: 1.1, sz: 3.8 });
      crossings.push({ x: x + 9, z: z + i * 2.1, sx: 3.8, sz: 1.1 });
    }
  }
  const crossMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .012, 1), new THREE.MeshBasicMaterial({ color: 0xd8d1ba, transparent: true, opacity: .8 }), crossings.length);
  crossings.forEach((c, i) => { dObj.position.set(c.x, .028, c.z); dObj.scale.set(c.sx, 1, c.sz); dObj.rotation.y = 0; dObj.updateMatrix(); crossMesh.setMatrixAt(i, dObj.matrix); });
  roadGroup.add(crossMesh);

  // ---------------- CITY BLOCKS + BUILDINGS ----------------
  const blockBounds = [];
  const xs = WORLD.roadXs;
  const zs = WORLD.roadZs;
  const cityMinX = -388, cityMaxX = 388, cityMinZ = -388;
  for (let i = -1; i < xs.length; i++) {
    let x1 = i < 0 ? cityMinX : xs[i] + roadW / 2 + 2;
    let x2 = i === xs.length - 1 ? cityMaxX : xs[i + 1] - roadW / 2 - 2;
    for (let j = -1; j < zs.length; j++) {
      let z1 = j < 0 ? cityMinZ : zs[j] + roadW / 2 + 2;
      let z2 = j === zs.length - 1 ? 89 : zs[j + 1] - roadW / 2 - 2;
      if (x2 - x1 < 18 || z2 - z1 < 18) continue;
      blockBounds.push({ minX: x1 + 2, maxX: x2 - 2, minZ: z1 + 2, maxZ: z2 - 2 });
    }
  }

  const blockSlabs = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x8a8c83, roughness: .95 }), blockBounds.length);
  const slabObj = new THREE.Object3D();
  blockBounds.forEach((b, i) => {
    slabObj.position.set((b.minX + b.maxX) / 2, .07, (b.minZ + b.maxZ) / 2);
    slabObj.scale.set(b.maxX - b.minX, .15, b.maxZ - b.minZ);
    slabObj.updateMatrix();
    blockSlabs.setMatrixAt(i, slabObj.matrix);
    world.blocks.push(b);
  });
  blockSlabs.receiveShadow = true;
  scene.add(blockSlabs);

  const buildings = [];
  const windows = [];
  const neonStrips = [];
  const rooftop = [];
  const parkRect = { minX: -235, maxX: -122, minZ: -18, maxZ: 78 };
  const exclusion = [
    { minX: 278, maxX: 388, minZ: -10, maxZ: 70 },
    { minX: -388, maxX: -295, minZ: 30, maxZ: 85 },
    { minX: -50, maxX: 80, minZ: -145, maxZ: -85 }
  ];

  const overlaps = (a, b) => a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;

  for (const b of blockBounds) {
    if (overlaps(b, parkRect) || exclusion.some(e => overlaps(b, e))) continue;
    const w = b.maxX - b.minX, d = b.maxZ - b.minZ;
    const cols = w > 85 ? 2 : 1;
    const rows = d > 85 ? 2 : 1;
    for (let cx = 0; cx < cols; cx++) {
      for (let cz = 0; cz < rows; cz++) {
        if (rand() < .12) continue;
        const cellW = w / cols, cellD = d / rows;
        const bw = cellW * (0.52 + rand() * .31);
        const bd = cellD * (0.52 + rand() * .31);
        const bx = b.minX + cellW * (cx + .5) + (rand() - .5) * (cellW - bw) * .5;
        const bz = b.minZ + cellD * (cz + .5) + (rand() - .5) * (cellD - bd) * .5;
        const centerX = (b.minX + b.maxX) / 2;
        const downtown = bz < -100 && Math.abs(bx - 30) < 290;
        const beachfront = bz > 34;
        let height = beachfront ? 13 + rand() * 24 : downtown ? 35 + rand() * 100 : 20 + rand() * 46;
        if (bw > 33 && height > 70) height *= .75;
        const color = new THREE.Color(pick(COLORS.building));
        buildings.push({ x: bx, z: bz, w: bw, d: bd, h: height, color, beachfront, downtown });
        world.colliders.push({ minX: bx - bw / 2, maxX: bx + bw / 2, minZ: bz - bd / 2, maxZ: bz + bd / 2, height, type: 'building' });

        // windows
        const floorH = 3.4;
        const floors = Math.max(2, Math.min(downtown ? 18 : 9, Math.floor((height - 4.5) / floorH)));
        const winColorBase = downtown && rand() > .45 ? 0x9ed8db : pick(COLORS.windowWarm);
        const winCols = Math.max(2, Math.floor(bw / 3.5));
        const winColsZ = Math.max(2, Math.floor(bd / 3.5));
        for (let f = 0; f < floors; f++) {
          const wy = 3.1 + f * floorH;
          if (wy > height - 2) break;
          for (let c = 0; c < winCols; c++) {
            const wx = bx - bw / 2 + (c + .5) * (bw / winCols);
            if (rand() > .18) windows.push({ x: wx, y: wy, z: bz + bd / 2 + .035, sx: Math.min(1.7, bw / winCols * .48), sy: 1.35, sz: .07, color: new THREE.Color(winColorBase).offsetHSL(0, 0, (rand() - .5) * .2), lit: rand() > .25 });
            if (rand() > .48) windows.push({ x: wx, y: wy, z: bz - bd / 2 - .035, sx: Math.min(1.7, bw / winCols * .48), sy: 1.35, sz: .07, color: new THREE.Color(winColorBase).offsetHSL(0, 0, (rand() - .5) * .2), lit: rand() > .55 });
          }
          for (let c = 0; c < winColsZ; c++) {
            const wz = bz - bd / 2 + (c + .5) * (bd / winColsZ);
            if (rand() > .35) windows.push({ x: bx + bw / 2 + .035, y: wy, z: wz, sx: .07, sy: 1.35, sz: Math.min(1.7, bd / winColsZ * .48), color: new THREE.Color(winColorBase).offsetHSL(0, 0, (rand() - .5) * .2), lit: rand() > .35 });
          }
        }
        // Art-deco neon edging / rooftop
        if (height > 22 && rand() > .55) {
          const nColor = new THREE.Color(pick(COLORS.neon));
          neonStrips.push({ x: bx + bw / 2 + .1, y: 1.4, z: bz + bd / 2 + .1, sx: .13, sy: height * .72, sz: .13, color: nColor });
          if (rand() > .5) neonStrips.push({ x: bx + bw / 2 + .1, y: 1.4, z: bz - bd / 2 - .1, sx: .13, sy: height * .72, sz: .13, color: nColor });
        }
        if (height > 45 && rand() > .5) {
          neonStrips.push({ x: bx, y: height - .45, z: bz + bd / 2, sx: bw * .85, sy: .16, sz: .18, color: new THREE.Color(pick(COLORS.neon)) });
        }
        // rooftop tanks / AC
        const rtCount = 1 + Math.floor(rand() * 3);
        for (let r = 0; r < rtCount; r++) {
          rooftop.push({
            x: bx + (rand() - .5) * (bw - 4), z: bz + (rand() - .5) * (bd - 4), y: height,
            sx: .9 + rand() * 1.3, sy: 1.3 + rand() * 1.4, sz: .9 + rand() * 1.3,
            water: rand() > .55
          });
        }
        // ground-floor awning on beachfront
        if (beachfront && height < 45 && rand() > .35) {
          neonStrips.push({ x: bx, y: 3.35, z: bz + bd / 2 + .7, sx: bw * .7, sy: .14, sz: 1.5, color: new THREE.Color(pick([0x43ddbe, 0xff7058, 0xf6c768, 0xff8bc1])) });
        }
      }
    }
  }

  const buildingMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .68, metalness: .06 }), buildings.length);
  buildings.forEach((b, i) => {
    setInstance(buildingMesh, i, { x: b.x, y: b.h / 2, z: b.z }, { x: b.w, y: b.h, z: b.d }, null, b.color);
  });
  buildingMesh.instanceMatrix.needsUpdate = true;
  if (buildingMesh.instanceColor) buildingMesh.instanceColor.needsUpdate = true;
  buildingMesh.castShadow = true;
  buildingMesh.receiveShadow = true;
  scene.add(buildingMesh);
  world.buildingMesh = buildingMesh;

  // make windows: only lit at dusk but basic looks luminous
  const winMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), windows.length);
  windows.forEach((w, i) => {
    const col = w.lit ? w.color.clone().multiplyScalar(1.1) : new THREE.Color(0x3b4b4d);
    setInstance(winMesh, i, { x: w.x, y: w.y, z: w.z }, { x: w.sx, y: w.sy, z: w.sz }, null, col);
  });
  winMesh.instanceMatrix.needsUpdate = true;
  if (winMesh.instanceColor) winMesh.instanceColor.needsUpdate = true;
  scene.add(winMesh);

  const neonMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), neonStrips.length);
  neonStrips.forEach((n, i) => setInstance(neonMesh, i, { x: n.x, y: n.y + n.sy / 2, z: n.z }, { x: n.sx, y: n.sy, z: n.sz }, null, n.color));
  neonMesh.instanceMatrix.needsUpdate = true;
  if (neonMesh.instanceColor) neonMesh.instanceColor.needsUpdate = true;
  scene.add(neonMesh);

  const tankParts = rooftop.filter(r => r.water);
  const tankMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(.65, .8, 1, 8), new THREE.MeshStandardMaterial({ color: 0x5f6f6c, roughness: .7, metalness: .25 }), tankParts.length);
  tankParts.forEach((r, i) => setInstance(tankMesh, i, { x: r.x, y: r.y + .9, z: r.z }, { x: r.sx, y: r.sy, z: r.sz }, null, new THREE.Color(0x687a76)));
  tankMesh.castShadow = true;
  scene.add(tankMesh);
  const acParts = rooftop.filter(r => !r.water);
  const acMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x9ea39c, roughness: .8, metalness: .2 }), acParts.length);
  acParts.forEach((r, i) => setInstance(acMesh, i, { x: r.x, y: r.y + .35, z: r.z }, { x: r.sx, y: .7, z: r.sz }, null, new THREE.Color(0x9ca39d)));
  acMesh.castShadow = true;
  scene.add(acMesh);

  // ---------------- LANDMARK TOWER ----------------
  const landmarkGroup = new THREE.Group();
  {
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x2b6268, roughness: .28, metalness: .65 });
    const tower = new THREE.Mesh(new THREE.BoxGeometry(34, 145, 34), glassMat);
    tower.position.set(17, 72.5, -244);
    tower.castShadow = true; tower.receiveShadow = true;
    landmarkGroup.add(tower);
    const crown = new THREE.Mesh(new THREE.BoxGeometry(38, 7, 38), new THREE.MeshStandardMaterial({ color: 0x112b30, roughness: .3, metalness: .6 }));
    crown.position.set(17, 146.5, -244); landmarkGroup.add(crown);
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(.18, 1.4, 25, 5), new THREE.MeshStandardMaterial({ color: 0xf0c377, metalness: .8, roughness: .24, emissive: 0xffb557, emissiveIntensity: .3 }));
    spire.position.set(17, 162, -244); landmarkGroup.add(spire);
    const led = new THREE.Mesh(new THREE.BoxGeometry(37, .28, 37), new THREE.MeshBasicMaterial({ color: 0x43ddbe, toneMapped: false }));
    led.position.set(17, 143.3, -244); landmarkGroup.add(led);
    world.colliders.push({ minX: 0, maxX: 34, minZ: -261, maxZ: -227, height: 145, type: 'building' });
    world.locations.matteoTower = new THREE.Vector3(17, 0, -227);
  }
  scene.add(landmarkGroup);

  // ---------------- PARK ----------------
  {
    const park = new THREE.Group();
    const grassTex = noiseTexture(256, '#3f6249', ['#52765a', '#2e4a39', '#688164'], .3, 8, 8);
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(108, 93), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }));
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(-178, .17, 30);
    grass.receiveShadow = true;
    park.add(grass);
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xd8c8a9, roughness: .9 });
    const path = new THREE.Mesh(new THREE.PlaneGeometry(7, 86), pathMat);
    path.rotation.x = -Math.PI / 2; path.position.set(-178, .18, 30); park.add(path);
    const cPath = new THREE.Mesh(new THREE.PlaneGeometry(84, 6), pathMat);
    cPath.rotation.x = -Math.PI / 2; cPath.position.set(-178, .185, 31); park.add(cPath);
    const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(7, 8, .8, 24), new THREE.MeshStandardMaterial({ color: 0xc8c0ab, roughness: .8 }));
    fountainBase.position.set(-178, .55, 31); fountainBase.castShadow = true; fountainBase.receiveShadow = true; park.add(fountainBase);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, .2, 24), new THREE.MeshPhysicalMaterial({ color: 0x3aabb0, roughness: .08, metalness: .1, transparent: true, opacity: .85 }));
    water.position.set(-178, .98, 31); park.add(water);
    const spray = new THREE.Mesh(new THREE.CylinderGeometry(.15, 1.2, 4.5, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xbcf7f0, transparent: true, opacity: .15, depthWrite: false, side: THREE.DoubleSide }));
    spray.position.set(-178, 3.2, 31); park.add(spray);
    world.animate.push((dt, t) => { spray.scale.y = 1 + Math.sin(t * 2.2) * .08; spray.rotation.y += dt * .3; });
    world.locations.park = new THREE.Vector3(-178, 0, 30);
    scene.add(park);
  }

  // ---------------- FAVELA HILL ----------------
  const favelaGroup = new THREE.Group();
  {
    const hillMat = new THREE.MeshStandardMaterial({ color: 0x395c45, roughness: 1, flatShading: true });
    const hill = new THREE.Mesh(new THREE.ConeGeometry(160, 83, 24, 4), hillMat);
    hill.position.set(-310, 17, -302);
    hill.scale.set(1, 1, .8);
    hill.receiveShadow = true;
    favelaGroup.add(hill);
    const hill2 = new THREE.Mesh(new THREE.ConeGeometry(105, 48, 20, 3), new THREE.MeshStandardMaterial({ color: 0x315541, roughness: 1, flatShading: true }));
    hill2.position.set(-130, 2, -390); hill2.scale.set(1.2, 1, .8); favelaGroup.add(hill2);

    const houseGeo = new THREE.BoxGeometry(1, 1, 1);
    const houseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .92 });
    const count = 105;
    const houses = new THREE.InstancedMesh(houseGeo, houseMat, count);
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const ang = rand() * Math.PI * 2, r = 26 + rand() * 125;
      const hx = -310 + Math.cos(ang) * r, hz = -302 + Math.sin(ang) * r * .72;
      const elevation = Math.max(0, (1 - r / 170) * 40) + rand() * 2;
      const h = 3.5 + rand() * 8;
      o.position.set(hx, elevation + h / 2, hz);
      o.scale.set(4 + rand() * 8, h, 4 + rand() * 7);
      o.rotation.y = rand() * .7;
      o.updateMatrix();
      houses.setMatrixAt(i, o.matrix);
      houses.setColorAt(i, c.setHex(pick(COLORS.favela)));
    }
    houses.castShadow = true;
    houses.receiveShadow = true;
    houses.instanceMatrix.needsUpdate = true;
    if (houses.instanceColor) houses.instanceColor.needsUpdate = true;
    favelaGroup.add(houses);

    const roofLights = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .18, 1), new THREE.MeshBasicMaterial({ color: 0xffe1a5, toneMapped: false }), 46);
    for (let i = 0; i < 46; i++) {
      const ang = rand() * Math.PI * 2, r = 35 + rand() * 112;
      const hx = -310 + Math.cos(ang) * r, hz = -302 + Math.sin(ang) * r * .72;
      const elevation = Math.max(0, (1 - r / 170) * 40) + 5;
      setInstance(roofLights, i, { x: hx, y: elevation, z: hz }, { x: 4 + rand() * 5, y: 1, z: 4 + rand() * 4 }, null, new THREE.Color(pick([0xffd58f, 0x6be3cd, 0xff9b7d])));
    }
    favelaGroup.add(roofLights);

    // distant hills
    for (let i = 0; i < 5; i++) {
      const h = new THREE.Mesh(new THREE.ConeGeometry(150 + i * 20, 55 + i * 9, 8), new THREE.MeshStandardMaterial({ color: 0x2c4a40, roughness: 1, flatShading: true }));
      h.position.set(-440 + i * 230, 5, -500 - (i % 2) * 60);
      h.scale.z = .75;
      favelaGroup.add(h);
    }
    world.locations.favela = new THREE.Vector3(-350, 0, -222);
  }
  scene.add(favelaGroup);

  // ---------------- FERRIS WHEEL ----------------
  const ferris = new THREE.Group();
  {
    const wheel = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({ color: 0xe8d8b8, metalness: .75, roughness: .3 });
    const neonMat = new THREE.MeshBasicMaterial({ color: 0xff7058, toneMapped: false });
    const neonMat2 = new THREE.MeshBasicMaterial({ color: 0xf6c768, toneMapped: false });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(27, .42, 8, 64), steel);
    wheel.add(rim);
    const rim2 = rim.clone(); rim2.position.z = 2.2; wheel.add(rim2);
    const rim3 = rim.clone(); rim3.position.z = -2.2; wheel.add(rim3);
    const lightRing = new THREE.Mesh(new THREE.TorusGeometry(27.8, .1, 6, 80), neonMat);
    wheel.add(lightRing);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(.22, 54, .22), steel);
      spoke.position.set(0, 0, 0);
      spoke.rotation.z = a;
      wheel.add(spoke);
      const gondola = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.5, 3.2), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x43ddbe : 0xff7058, roughness: .45 }));
      gondola.position.set(Math.cos(a) * 27.6, Math.sin(a) * 27.6, 0);
      wheel.add(gondola);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 6.2, 12), steel);
    hub.rotation.x = Math.PI / 2;
    wheel.add(hub);
    wheel.position.y = 31;
    ferris.add(wheel);
    const supportMat = new THREE.MeshStandardMaterial({ color: 0xd8ccb3, metalness: .6, roughness: .4 });
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 44, 1.2), supportMat);
      leg.position.set(sx * 12, 16, 0); leg.rotation.z = sx * .28; ferris.add(leg);
    }
    const base = new THREE.Mesh(new THREE.BoxGeometry(38, 1.2, 14), new THREE.MeshStandardMaterial({ color: 0x4e5b55, roughness: .9 }));
    base.position.y = .6; ferris.add(base);
    const glow = new THREE.PointLight(0xff9870, 3.4, 95, 2);
    glow.position.set(0, 31, 0); ferris.add(glow);
    ferris.position.set(350, 0, 30);
    ferris.rotation.y = -.25;
    world.animate.push((dt) => { wheel.rotation.z += dt * .045; });
    world.locations.ferris = new THREE.Vector3(335, 0, 35);
    world.colliders.push({ minX: 334, maxX: 366, minZ: 14, maxZ: 46, height: 60, type: 'building' });
  }
  scene.add(ferris);

  // ---------------- LIGHTHOUSE ----------------
  const lighthouse = new THREE.Group();
  {
    const white = new THREE.MeshStandardMaterial({ color: 0xf1eadb, roughness: .75 });
    const coral = new THREE.MeshStandardMaterial({ color: 0xd8594e, roughness: .7 });
    for (let i = 0; i < 7; i++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(4.1 - i * .13, 4.35 - i * .13, 5.2, 18), i % 2 ? white : coral);
      seg.position.y = 2.6 + i * 5.2;
      seg.castShadow = true; seg.receiveShadow = true;
      lighthouse.add(seg);
    }
    const top = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 4.4, 10), new THREE.MeshStandardMaterial({ color: 0x13282c, metalness: .4, roughness: .2 }));
    top.position.y = 38.4; lighthouse.add(top);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffedb2, toneMapped: false }));
    lamp.position.y = 38.6; lighthouse.add(lamp);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(4.4, 4, 16), new THREE.MeshStandardMaterial({ color: 0xb8453f, metalness: .3, roughness: .5 }));
    cap.position.y = 42.6; lighthouse.add(cap);
    const light = new THREE.PointLight(0xffc977, 4.5, 100, 2);
    light.position.y = 38.8; lighthouse.add(light);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(12, 95, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe0a2, transparent: true, opacity: .055, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    beam.rotation.z = Math.PI / 2; beam.position.set(46, 38.8, 0); lighthouse.add(beam);
    world.animate.push((dt, t) => {
      beam.rotation.x = Math.sin(t * .28) * .7;
      beam.material.opacity = .04 + Math.sin(t * 2) * .018;
    });
    lighthouse.position.set(-352, 0, 50);
    world.locations.lighthouse = new THREE.Vector3(-352, 0, 50);
    world.colliders.push({ minX: -359, maxX: -345, minZ: 43, maxZ: 57, height: 44, type: 'building' });
  }
  scene.add(lighthouse);

  // ---------------- PALMS / TREES ----------------
  const palmPositions = [];
  for (let x = -410; x <= 410; x += 22) {
    if (Math.abs(x) < 20) continue;
    palmPositions.push({ x: x + (rand() - .5) * 5, z: 101.6 + (rand() - .5) * 2.5, s: .9 + rand() * .35, rot: rand() * Math.PI * 2 });
  }
  for (let i = 0; i < 25; i++) {
    palmPositions.push({ x: -240 + rand() * 120, z: -10 + rand() * 78, s: .85 + rand() * .45, rot: rand() * 6 });
  }
  for (let i = 0; i < 20; i++) {
    palmPositions.push({ x: -380 + rand() * 760, z: -360 + rand() * 240, s: .6 + rand() * .4, rot: rand() * 6 });
  }

  function leafGeometry() {
    const positions = [], normals = [], colors = [];
    const colorA = new THREE.Color(0x397d54), colorB = new THREE.Color(0x1e513b);
    for (let f = 0; f < 9; f++) {
      const a = (f / 9) * Math.PI * 2 + .1;
      const segs = 5;
      for (let s = 0; s < segs; s++) {
        const t0 = s / segs, t1 = (s + 1) / segs;
        const r0 = .35 + t0 * 4.0, r1 = .35 + t1 * 4.0;
        const y0 = .15 + Math.sin(t0 * Math.PI) * .75 - t0 * t0 * 1.25;
        const y1 = .15 + Math.sin(t1 * Math.PI) * .75 - t1 * t1 * 1.25;
        const w0 = .5 * (1 - t0) + .06, w1 = .5 * (1 - t1) + .04;
        const cx0 = Math.cos(a) * r0, cz0 = Math.sin(a) * r0;
        const cx1 = Math.cos(a) * r1, cz1 = Math.sin(a) * r1;
        const perpX = -Math.sin(a), perpZ = Math.cos(a);
        const p = [
          [cx0 + perpX * w0, y0, cz0 + perpZ * w0],
          [cx0 - perpX * w0, y0, cz0 - perpZ * w0],
          [cx1 + perpX * w1, y1, cz1 + perpZ * w1],
          [cx1 - perpX * w1, y1, cz1 - perpZ * w1]
        ];
        positions.push(...p[0], ...p[1], ...p[2], ...p[1], ...p[3], ...p[2]);
        for (let k = 0; k < 6; k++) {
          normals.push(0, 1, 0);
          const c = (k === 2 || k === 4) ? colorB : colorA;
          colors.push(c.r, c.g, c.b);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return g;
  }

  const trunkMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(.17, .32, 1, 6), new THREE.MeshStandardMaterial({ color: 0x6d553b, roughness: .92 }), palmPositions.length);
  const leafMesh = new THREE.InstancedMesh(leafGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .78 }), palmPositions.length);
  palmPositions.forEach((p, i) => {
    const h = 7.5 * p.s;
    setInstance(trunkMesh, i, { x: p.x, y: h / 2, z: p.z }, { x: p.s, y: h, z: p.s }, { x: Math.sin(p.rot) * .06, y: p.rot, z: Math.cos(p.rot) * .04 }, new THREE.Color(0x6d553b));
    setInstance(leafMesh, i, { x: p.x, y: h + .25, z: p.z }, { x: p.s, y: p.s, z: p.s }, { x: 0, y: p.rot, z: 0 });
  });
  trunkMesh.castShadow = true; leafMesh.castShadow = true;
  scene.add(trunkMesh, leafMesh);
  world.palmCount = palmPositions.length;

  // park trees
  const treePositions = [];
  for (let i = 0; i < 18; i++) treePositions.push({ x: -226 + rand() * 88, z: -10 + rand() * 80, s: .7 + rand() * .5, rot: rand() * 6 });
  const treeTrunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.2, .35, 4, 6), new THREE.MeshStandardMaterial({ color: 0x5a4633, roughness: .9 }), treePositions.length);
  const treeCrown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3.2, 1), new THREE.MeshStandardMaterial({ color: 0x3f734c, roughness: .9, flatShading: true }), treePositions.length);
  treePositions.forEach((p, i) => {
    setInstance(treeTrunk, i, { x: p.x, y: 2, z: p.z }, { x: p.s, y: p.s, z: p.s }, null, new THREE.Color(0x5a4633));
    setInstance(treeCrown, i, { x: p.x, y: 4.8 * p.s, z: p.z }, { x: p.s, y: p.s * 1.2, z: p.s }, { x: 0, y: p.rot, z: 0 }, new THREE.Color(pick([0x3f734c, 0x4a825a, 0x356848])));
  });
  treeTrunk.castShadow = true; treeCrown.castShadow = true;
  scene.add(treeTrunk, treeCrown);

  // ---------------- BEACH PROPS ----------------
  const umbrellaPositions = [];
  for (let i = 0; i < 34; i++) umbrellaPositions.push({ x: -405 + rand() * 810, z: 116 + rand() * 22, color: pick([0xff7058, 0xf6c768, 0x43ddbe, 0xf1eee3]), rot: rand() * 6 });
  const umbCanopy = new THREE.InstancedMesh(new THREE.ConeGeometry(2.2, .6, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .8, side: THREE.DoubleSide }), umbrellaPositions.length);
  const umbPole = new THREE.InstancedMesh(new THREE.CylinderGeometry(.045, .045, 3.4, 5), new THREE.MeshStandardMaterial({ color: 0xe9e2d4, roughness: .7 }), umbrellaPositions.length);
  umbrellaPositions.forEach((p, i) => {
    setInstance(umbCanopy, i, { x: p.x, y: 3.2, z: p.z }, { x: 1, y: 1, z: 1 }, { x: 0, y: p.rot, z: 0 }, new THREE.Color(p.color));
    setInstance(umbPole, i, { x: p.x, y: 1.6, z: p.z }, { x: 1, y: 1, z: 1 }, null, new THREE.Color(0xe9e2d4));
  });
  umbCanopy.castShadow = true;
  scene.add(umbCanopy, umbPole);

  const towels = [];
  for (let i = 0; i < 20; i++) towels.push({ x: -390 + rand() * 780, z: 115 + rand() * 20, color: pick([0xff7058, 0x43ddbe, 0xf6c768, 0xffffff]), rot: rand() * 6 });
  const towelMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.7, 1.4), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 1 }), towels.length);
  towels.forEach((p, i) => setInstance(towelMesh, i, { x: p.x, y: .055, z: p.z }, { x: 1, y: 1, z: 1 }, { x: -Math.PI / 2, y: p.rot, z: 0 }, new THREE.Color(p.color)));
  scene.add(towelMesh);

  // kiosks
  world.kiosks = [];
  const kioskLocs = [-62, 48, 168, -260, 285];
  const kioskName = i => i % 2 ? 'AÇAÍ DO SOL' : 'ÁGUA & MAR';
  const kioskAccent = i => i % 2 ? 0xd75c4d : 0x2e9b88;
  kioskLocs.forEach((x, i) => {
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x6d4d36, roughness: .88 });
    const accent = kioskAccent(i);
    const name = kioskName(i);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(7.5, .3, 4.7), new THREE.MeshStandardMaterial({ color: 0x4b5049, roughness: .95 }));
    plinth.position.y = .15; plinth.receiveShadow = true; g.add(plinth);

    const body = new THREE.Mesh(new THREE.BoxGeometry(7, 3.2, 4.2), new THREE.MeshStandardMaterial({ color: 0xe7dfcf, roughness: .8 }));
    body.position.y = 1.75; body.castShadow = true; body.receiveShadow = true; g.add(body);

    // corner posts and fascia
    for (const sx of [-3.42, 3.42]) {
      for (const sz of [-2.02, 2.02]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(.2, 3.35, .2), wood);
        post.position.set(sx, 1.68, sz); post.castShadow = true; g.add(post);
      }
    }
    const fascia = new THREE.Mesh(new THREE.BoxGeometry(7.24, .22, 4.44), new THREE.MeshStandardMaterial({ color: accent, roughness: .7 }));
    fascia.position.y = 3.12; g.add(fascia);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(8.2, .28, 5.4), new THREE.MeshStandardMaterial({ color: accent, roughness: .7 }));
    roof.position.y = 3.42; roof.castShadow = true; g.add(roof);

    // street-facing awning
    const awning = new THREE.Mesh(new THREE.BoxGeometry(8.4, .18, 2.2), new THREE.MeshStandardMaterial({ color: pick([0xf6c768, 0xff7058, 0x43ddbe]) }));
    awning.position.set(0, 2.86, 2.55); awning.rotation.x = .12; awning.castShadow = true; g.add(awning);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 1.6), new THREE.MeshBasicMaterial({ color: 0x9ad8d8, transparent: true, opacity: .6 }));
    glass.position.set(0, 2.2, 2.13); g.add(glass);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.6, .86), new THREE.MeshBasicMaterial({ map: makeTextTexture(name, { width: 512, height: 128, font: '700 58px "Barlow Condensed", sans-serif', padding: 24, bg: i % 2 ? '#e95f4e' : '#148b80', color: '#fff8e4', accent: '#fff8e4', sub: '' }), toneMapped: false }));
    sign.position.set(0, 3.66, 2.2); g.add(sign);

    // side service counter facing the promenade (local +X)
    const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.45), new THREE.MeshBasicMaterial({ color: 0x9ad8d8, transparent: true, opacity: .58 }));
    sideGlass.position.set(3.56, 1.92, .15); sideGlass.rotation.y = Math.PI / 2; g.add(sideGlass);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(.46, .14, 3.4), wood);
    counter.position.set(3.74, 1.12, .15); counter.castShadow = true; g.add(counter);
    const sideBoard = new THREE.Mesh(new THREE.PlaneGeometry(2.7, .72), new THREE.MeshBasicMaterial({ map: makeTextTexture(name, { width: 512, height: 128, font: '700 54px "Barlow Condensed", sans-serif', padding: 24, bg: i % 2 ? '#b6453a' : '#0e756c', color: '#fff8e4', accent: '#f6c768', sub: i % 2 ? 'AÇAÍ · FRUTAS · SUCO' : 'ÁGUA · COCO · PETISCOS' }), toneMapped: false }));
    sideBoard.position.set(3.57, 2.72, .15); sideBoard.rotation.y = Math.PI / 2; g.add(sideBoard);

    // side awning, posts and warm string bulbs
    const sideAwning = new THREE.Mesh(new THREE.BoxGeometry(2.05, .16, 4.9), new THREE.MeshStandardMaterial({ color: accent, roughness: .72 }));
    sideAwning.position.set(4.55, 2.92, .15); sideAwning.rotation.z = -.09; sideAwning.castShadow = true; g.add(sideAwning);
    for (const sz of [-2.2, 2.2]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2.8, 4), wood);
      leg.position.set(5.46, 1.4, sz); g.add(leg);
    }
    for (let s = -2; s <= 2; s++) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.075, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffd98a, toneMapped: false }));
      bulb.position.set(5.28, 2.58, .15 + s * .88); g.add(bulb);
    }

    g.position.set(x, 0, 95.5);
    g.rotation.y = Math.PI;
    scene.add(g);
    world.kiosks.push({ x, z: 95.5, pos: new THREE.Vector3(x, 0, 95.5), namePt: i % 2 ? 'Quiosque Açaí do Sol' : 'Quiosque Água & Mar', nameEn: i % 2 ? 'Sun Açaí Kiosk' : 'Water & Sea Kiosk' });
    world.colliders.push({ minX: x - 4, maxX: x + 4, minZ: 93, maxZ: 98, height: 3.4, type: 'kiosk' });
  });

  // Pier
  const pier = new THREE.Group();
  {
    const wood = new THREE.MeshStandardMaterial({ color: 0x86694b, roughness: .92 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(11, .5, 78), wood);
    deck.position.set(108, .42, 180); deck.castShadow = true; deck.receiveShadow = true; pier.add(deck);
    for (let z = 146; z < 220; z += 6) {
      for (const x of [103, 113]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 4, 6), new THREE.MeshStandardMaterial({ color: 0x5a432e, roughness: .9 }));
        post.position.set(x, -1, z); pier.add(post);
      }
    }
    for (let z = 150; z < 218; z += 11) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(.17, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffd287, toneMapped: false }));
      lamp.position.set(103.4, 3.2, z); pier.add(lamp);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 3.2, 5), new THREE.MeshStandardMaterial({ color: 0x1d2a2b }));
      pole.position.set(103.4, 1.6, z); pier.add(pole);
    }
    const end = new THREE.Mesh(new THREE.BoxGeometry(24, .45, 20), wood);
    end.position.set(108, .42, 220); end.receiveShadow = true; pier.add(end);
    const glow = new THREE.PointLight(0xffb56e, 2, 35, 2);
    glow.position.set(108, 4, 212); pier.add(glow);
    world.locations.pier = new THREE.Vector3(108, 0, 205);
    world.pierBounds = { minX: 96, maxX: 120, minZ: 145, maxZ: 232 };
  }
  scene.add(pier);

  // boat
  const boats = [];
  for (const [bx, bz, scale, color] of [[250, 310, 1, 0xf1eee3], [-110, 400, 1.5, 0xe3d7bf], [330, 470, .8, 0xe96052]]) {
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(7, 2, 18), new THREE.MeshStandardMaterial({ color, roughness: .5, metalness: .1 }));
    hull.position.y = .5; boat.add(hull);
    const bow = new THREE.Mesh(new THREE.ConeGeometry(3.5, 7, 4), new THREE.MeshStandardMaterial({ color, roughness: .5 }));
    bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.position.set(0, .5, 12.2); boat.add(bow);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(4, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0x233f47, roughness: .2, metalness: .4 }));
    cabin.position.set(0, 2.5, -2); boat.add(cabin);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 12, 5), new THREE.MeshStandardMaterial({ color: 0xc4bda9 }));
    mast.position.set(0, 8, 2); boat.add(mast);
    boat.position.set(bx, -.4, bz); boat.scale.setScalar(scale); scene.add(boat);
    boats.push({ group: boat, baseY: -.4, phase: rand() * 6 });
  }
  world.animate.push((dt, t) => boats.forEach(b => { b.group.position.y = b.baseY + Math.sin(t * .7 + b.phase) * .28; b.group.rotation.z = Math.sin(t * .45 + b.phase) * .025; }));

  // ---------------- STREET LIGHTS / PROPS ----------------
  const lampPositions = [];
  for (let x = -410; x <= 410; x += 30) lampPositions.push({ x, z: 106, rot: 0 });
  for (const x of WORLD.roadXs) {
    for (let z = -370; z <= 60; z += 42) {
      if (Math.abs(z - 82) < 12) continue;
      lampPositions.push({ x: x + 7.6, z, rot: Math.PI / 2 });
      lampPositions.push({ x: x - 7.6, z: z + 21, rot: -Math.PI / 2 });
    }
  }
  const lampPole = new THREE.InstancedMesh(new THREE.CylinderGeometry(.075, .13, 6.5, 6), new THREE.MeshStandardMaterial({ color: 0x203033, metalness: .5, roughness: .5 }), lampPositions.length);
  const lampHead = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, .16, .34), new THREE.MeshBasicMaterial({ color: 0xffd58e, toneMapped: false }), lampPositions.length);
  lampPositions.forEach((p, i) => {
    setInstance(lampPole, i, { x: p.x, y: 3.25, z: p.z }, { x: 1, y: 1, z: 1 }, null, new THREE.Color(0x263b3c));
    setInstance(lampHead, i, { x: p.x, y: 6.45, z: p.z }, { x: 1, y: 1, z: 1 }, { x: 0, y: p.rot, z: 0 });
  });
  lampPole.castShadow = true;
  scene.add(lampPole, lampHead);

  // bollards on promenade
  const bollards = [];
  for (let x = -390; x <= 390; x += 15) bollards.push({ x, z: 108, s: .9 });
  const bolMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(.14, .18, .7, 6), new THREE.MeshStandardMaterial({ color: 0x9c9e90, roughness: .6, metalness: .2 }), bollards.length);
  bollards.forEach((b, i) => setInstance(bolMesh, i, { x: b.x, y: .35, z: b.z }, { x: b.s, y: b.s, z: b.s }, null, new THREE.Color(0xa5a696)));
  scene.add(bolMesh);

  // ---------------- BILLBOARDS ----------------
  makeBillboard(scene, makeTextTexture(['SOL', 'SEM FILTRO'], {
    width: 1024, height: 512, bg: '#171e26', color: '#f7c76a', accent: '#ff7058',
    font: '800 140px "Barlow Condensed", sans-serif', sub: 'COSTA DOURADA · VERÃO 2026', gradient: ['#212d3e', '#172027']
  }), { x: -205, y: 13, z: 78, w: 17, h: 8, rotY: 0 });
  makeBillboard(scene, makeTextTexture(['COSTA', 'RP'], {
    width: 1024, height: 512, bg: '#0e2220', color: '#89ffe8', accent: '#ff7058',
    font: '800 165px "Barlow Condensed", sans-serif', sub: 'SUA SEGUNDA VIDA COMEÇA AQUI', gradient: ['#112f2f', '#081617']
  }), { x: 175, y: 15, z: 73, w: 18, h: 9, rotY: 0 });
  makeBillboard(scene, makeTextTexture(['NEON', '88'], {
    width: 1024, height: 512, bg: '#1b1024', color: '#ffacd0', accent: '#43ddbe',
    font: '800 170px "Barlow Condensed", sans-serif', sub: 'SÓ HOJE · SÓ AQUI', gradient: ['#3b163d', '#160d1c']
  }), { x: 345, y: 14, z: -10, w: 16, h: 8, rotY: Math.PI / 2 });
  makeBillboard(scene, makeTextTexture(['MATTEO', '5'], {
    width: 1024, height: 512, bg: '#1a1711', color: '#f6c768', accent: '#43ddbe',
    font: '800 180px "Barlow Condensed", sans-serif', sub: 'JOGUE SEM LIMITES', gradient: ['#2b2418', '#11100c']
  }), { x: -60, y: 17, z: -70, w: 20, h: 10, rotY: -.2 });

  // ---------------- OCEAN ----------------
  const oceanUniforms = {
    uTime: { value: 0 },
    uDeep: { value: new THREE.Color(0x062238) },
    uShallow: { value: new THREE.Color(0x1d8f8d) },
    uFoam: { value: new THREE.Color(0xdff7ea) },
    uSunDir: { value: sunDir.clone() },
    uHorizon: { value: new THREE.Color(0xd88d73) },
    uShore: { value: WORLD.oceanZ }
  };
  const oceanMat = new THREE.ShaderMaterial({
    uniforms: oceanUniforms,
    side: THREE.DoubleSide,
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying float vWave;
      varying float vCrest;
      float w1(vec2 p){ return sin(p.x * .045 + uTime * .62) * .85 + sin(p.y * .065 - uTime * .42 + 1.2) * .55; }
      float w2(vec2 p){ return sin(p.x * .022 - p.y * .031 + uTime * .33) * 1.15; }
      void main(){
        vec3 pos = position;
        float a = sin(pos.x * .052 + uTime * .68) * .6;
        float b = sin(pos.z * .074 - uTime * .53 + 1.4) * .38;
        float c = sin((pos.x + pos.z) * .023 + uTime * .34) * .9;
        float d = sin(pos.x * .16 + pos.z * .11 + uTime * 1.25) * .12;
        pos.y += a + b + c + d;
        float dx = cos(pos.x * .052 + uTime * .68) * .6 * .052 + cos((pos.x+pos.z) * .023 + uTime * .34) * .9 * .023 + cos(pos.x * .16 + pos.z*.11 + uTime*1.25)*.12*.16;
        float dz = sin(pos.z * .074 - uTime * .53 + 1.4) * .38 * .074 + cos((pos.x+pos.z) * .023 + uTime * .34) * .9 * .023 + cos(pos.x * .16 + pos.z*.11 + uTime*1.25)*.12*.11;
        vec3 n = normalize(vec3(-dx, 1.0, -dz));
        vNormal = normalize(mat3(modelMatrix) * n);
        vec4 wp = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = wp.xyz;
        vWave = a + b + c;
        vCrest = d * 2.0 + c;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uFoam; uniform vec3 uSunDir; uniform vec3 uHorizon; uniform float uShore;
      varying vec3 vWorldPosition; varying vec3 vNormal; varying float vWave; varying float vCrest;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y); }
      void main(){
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 N = normalize(vNormal);
        float shoreDist = clamp((vWorldPosition.z - uShore) / 150.0, 0.0, 1.0);
        vec3 base = mix(uShallow, uDeep, smoothstep(0.02, .6, shoreDist));
        base = mix(base, vec3(.055,.20,.26), smoothstep(.75, 1.0, shoreDist) * .5);
        float fres = pow(1.0 - max(dot(N, viewDir), 0.0), 3.4);
        vec3 refl = mix(uHorizon, vec3(.32,.47,.58), smoothstep(0.05, .6, abs(N.y)));
        vec3 color = mix(base, refl, fres * .72);
        vec3 R = reflect(-viewDir, N);
        float spec = pow(max(dot(R, normalize(uSunDir)), 0.0), 120.0);
        float broad = pow(max(dot(R, normalize(uSunDir)), 0.0), 10.0);
        color += vec3(1.0, .67, .38) * spec * 2.6 + vec3(1.0,.55,.3) * broad * .12;
        float sparkle = step(.982, vnoise(vWorldPosition.xz * 1.9 + uTime * .7));
        color += vec3(1.0,.86,.62) * sparkle * .9;
        float foamNoise = vnoise(vWorldPosition.xz * .25 + vec2(uTime*.2, -uTime*.17));
        float shoreFoam = smoothstep(.07, 0.0, shoreDist) * smoothstep(.34, .7, foamNoise + sin(vWorldPosition.x * .34 + uTime*1.7)*.25) * 1.4;
        float crest = smoothstep(1.25, 1.9, abs(vWave)) * .16;
        float lines = smoothstep(.85, .98, sin(vWorldPosition.z * .24 - uTime * .8 + vWorldPosition.x * .08) * .5 + .5);
        color = mix(color, uFoam, clamp(shoreFoam + crest + lines * .02, 0.0, .9));
        float alpha = .98;
        float fog = smoothstep(280.0, 760.0, distance(cameraPosition, vWorldPosition));
        color = mix(color, uHorizon * .8, fog * .65);
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
  const oceanGeo = new THREE.PlaneGeometry(1500, 920, quality === 'performance' ? 80 : 128, quality === 'performance' ? 45 : 74);
  oceanGeo.rotateX(-Math.PI / 2);
  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.position.set(0, -0.55, 600);
  scene.add(ocean);
  world.ocean = ocean;
  world.oceanUniforms = oceanUniforms;

  // island silhouettes
  for (const [ix, iz, s] of [[300, 420, 1], [-245, 520, 1.5], [520, 650, 1.8]]) {
    const island = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.ConeGeometry(50, 25, 9), new THREE.MeshStandardMaterial({ color: 0x244d42, roughness: 1, flatShading: true }));
    rock.position.y = 9; island.add(rock);
    for (let i = 0; i < 5; i++) {
      const tree = new THREE.Mesh(new THREE.ConeGeometry(5 + rand() * 8, 15 + rand() * 10, 6), new THREE.MeshStandardMaterial({ color: 0x1f5c45, roughness: 1 }));
      tree.position.set(-15 + rand() * 30, 22 + rand() * 6, -10 + rand() * 20); island.add(tree);
    }
    island.position.set(ix, -.6, iz); island.scale.setScalar(s); scene.add(island);
  }

  // ---------------- NPC SPAWNS ----------------
  const firstNames = ['Rafa', 'Bia', 'Duda', 'Tati', 'Nando', 'Júlia', 'Caio', 'Mila', 'Diego', 'Léo', 'Sofia', 'Igor', 'Nina', 'Tom', 'Cris', 'Vini', 'Aline', 'Rui'];
  for (let i = 0; i < 26; i++) {
    const onBeach = i < 13;
    world.npcSpawns.push({
      x: onBeach ? -380 + rand() * 760 : -330 + rand() * 650,
      z: onBeach ? 112 + rand() * 24 : 92 + rand() * 12,
      name: pick(firstNames),
      walking: true,
      axis: rand() > .5 ? 'x' : 'z'
    });
  }
  for (let i = 0; i < 9; i++) {
    world.npcSpawns.push({ x: -280 + rand() * 560, z: -330 + rand() * 260, name: pick(firstNames), walking: false });
  }

  // ---------------- VEHICLE SPAWNS ----------------
  const carColors = [0xf1eee3, 0xd6594e, 0x2c8d8b, 0xefb94e, 0x2d6da3, 0x7d4c8c, 0x343a3c, 0xc37b4e];
  for (let i = 0; i < 10; i++) {
    const alongBeach = i < 5;
    world.vehicleSpawns.push({
      x: alongBeach ? -330 + i * 135 : -300 + rand() * 600,
      z: alongBeach ? 76.5 : -300 + rand() * 340,
      rotY: alongBeach ? Math.PI / 2 : (rand() > .5 ? Math.PI / 2 : 0),
      color: pick(carColors),
      type: pick(['hatch', 'muscle', 'pickup', 'suv', 'van'])
    });
  }
  world.vehicleSpawns.push({ x: -76, z: 70, rotY: Math.PI / 2, color: 0xff7058, type: 'muscle', hero: true });
  world.vehicleSpawns.push({ x: 102, z: 40, rotY: 0, color: 0x53b8b1, type: 'suv', hero: true });

  // ---------------- NPC GATHERING SPOTS / LOCATIONS ----------------
  world.locations.club = new THREE.Vector3(187, 0, -26);
  world.locations.hospital = new THREE.Vector3(-36, 0, -58);
  world.locations.garage = new THREE.Vector3(126, 0, -6);
  world.locations.beachKiosk = new THREE.Vector3(-62, 0, 95.5);
  world.locations.pier = new THREE.Vector3(108, 0, 202);
  world.locations.matteoTower = new THREE.Vector3(17, 0, -224);
  world.locations.delivery = new THREE.Vector3(-350, 0, -228);
  world.locations.marina = new THREE.Vector3(290, 0, 25);
  world.locations.ferris = new THREE.Vector3(350, 0, 35);
  world.locations.park = new THREE.Vector3(-178, 0, 30);
  world.locations.favela = new THREE.Vector3(-350, 0, -222);
  // GTA 7 BR: novos pontos de missão e serviços espalhados por Costa Dourada.
  world.locations.shop = new THREE.Vector3(-120, 0, 30);
  world.locations.bank = new THREE.Vector3(100, 0, -120);
  world.locations.police = new THREE.Vector3(-230, 0, -120);
  world.locations.mansion = new THREE.Vector3(-10, 0, -230);
  world.locations.airport = new THREE.Vector3(320, 0, -230);
  world.locations.home = new THREE.Vector3(-340, 0, -230);
  world.locations.lanchonete = new THREE.Vector3(-120, 0, 82);
  world.locations.port = new THREE.Vector3(230, 0, -230);

  // add invisible colliders for lighthouse base etc done. Keep player on land side.
  world.bounds = { minX: -430, maxX: 430, minZ: -410, maxZ: 150 };

  // Add under-city environment sign props, bus stops
  const busStops = [-190, 30, 260];
  busStops.forEach(x => {
    const g = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.BoxGeometry(5, 2.7, 1.4), new THREE.MeshPhysicalMaterial({ color: 0x84c5c2, roughness: .12, metalness: .2, transparent: true, opacity: .3 }));
    glass.position.y = 1.7; g.add(glass);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(5.4, .18, 2), new THREE.MeshStandardMaterial({ color: 0x304447, metalness: .4, roughness: .6 }));
    roof.position.y = 3.1; g.add(roof);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .6), new THREE.MeshBasicMaterial({ map: makeTextTexture('COSTA BUS', { width: 512, height: 128, font: '700 58px "Barlow Condensed", sans-serif', padding: 24, bg: '#1b3434', color: '#baffef', accent: '#43ddbe', sub: '' }), toneMapped: false }));
    sign.position.set(0, 2.45, .72); g.add(sign);
    g.position.set(x, 0, 90.2); g.rotation.y = Math.PI;
    scene.add(g);
  });

  // floating dust / seagulls
  const gullGeo = new THREE.BufferGeometry();
  const gp = [];
  for (let i = 0; i < 32; i++) {
    const x = -300 + rand() * 600, y = 24 + rand() * 45, z = 80 + rand() * 300;
    gp.push(x - .7, y, z, x, y + .22, z, x + .7, y, z);
  }
  gullGeo.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
  const gulls = new THREE.LineSegments(gullGeo, new THREE.LineBasicMaterial({ color: 0x263638, transparent: true, opacity: .6 }));
  scene.add(gulls);
  world.animate.push((dt, t) => { gulls.position.x = Math.sin(t * .06) * 12; gulls.position.y = Math.sin(t * .16) * 1.5; });

  // eucalyptus / leaf scent details: small rocks and beach debris
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.5, 0), new THREE.MeshStandardMaterial({ color: 0x736b5b, roughness: 1, flatShading: true }), 30);
  for (let i = 0; i < 30; i++) {
    const x = -420 + rand() * 840, z = 112 + rand() * 30;
    setInstance(rocks, i, { x, y: .22, z }, { x: .5 + rand() * 1.8, y: .2 + rand() * .7, z: .5 + rand() * 1.6 }, { x: rand(), y: rand() * 6, z: rand() }, new THREE.Color(0x6d6759));
  }
  rocks.castShadow = true;
  scene.add(rocks);

  // ---------------- UPDATE ----------------
  world.getGroundHeight = (x, z) => {
    if (world.pierBounds && x > world.pierBounds.minX && x < world.pierBounds.maxX && z > world.pierBounds.minZ && z < world.pierBounds.maxZ) return .7;
    return 0;
  };

  world.districtAt = (x, z) => {
    for (const d of WORLD.districts) if (d.test(x, z)) return d;
    return WORLD.districts[0];
  };

  world.update = (dt, elapsed, playerPos, camera) => {
    world.time += dt;
    oceanUniforms.uTime.value = elapsed;
    skyUniforms.uTime.value = elapsed;
    stars.material.opacity = .2 + Math.sin(elapsed * .03) * .08;
    for (const fn of world.animate) fn(dt, elapsed);
    // keep the sun shadow frustum around the player
    if (playerPos) {
      sunLight.position.set(playerPos.x + sunDir.x * 170, sunDir.y * 170, playerPos.z + sunDir.z * 170);
      sunLight.target.position.set(playerPos.x, 0, playerPos.z);
      sunLight.target.updateMatrixWorld();
      sky.position.set(camera.position.x, 0, camera.position.z);
      sunSprite.position.set(camera.position.x + sunDir.x * 700, sunDir.y * 700, camera.position.z + sunDir.z * 700);
    }
    world.gulls = gulls;
  };

  world.setQuality = (preset) => {
    world.quality = preset;
    const high = preset !== 'performance';
    sunLight.castShadow = high;
    sunLight.shadow.mapSize.set(preset === 'ultra' ? 2048 : 1024, preset === 'ultra' ? 2048 : 1024);
    scene.fog.density = preset === 'performance' ? .0025 : .00135;
    if (preset === 'performance') {
      ocean.geometry.setDrawRange(0, Math.floor(ocean.geometry.attributes.position.count * .55) * 6);
    } else {
      ocean.geometry.setDrawRange(0, Infinity);
    }
  };

  return world;
}
