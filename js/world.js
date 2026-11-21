import * as THREE from 'three';

/* ============================================================
   GTA 6 BR — Santo Matteo world builder
   Original procedural coastal city. No external game assets.
   ============================================================ */

export const WORLD_BOUNDS = { minX: -980, maxX: 1550, minZ: -980, maxZ: 980 };
export const WATER_LEVEL = -0.35;
export const SHORE_X = 650;

export const ROADS_X = [-840, -700, -560, -420, -280, -140, 0, 140, 280, 420, 560];
export const ROADS_Z = [-840, -700, -560, -420, -280, -140, 0, 140, 280, 420, 560, 700];

export const LANDMARKS = {
  spawn:      { x: 580, z: 24, name: 'Orla de Matteo' },
  kiosk:      { x: 596, z: 120, name: 'Quiosque da Orla' },
  pier:       { x: 782, z: 146, name: 'Píer do Sol' },
  marina:     { x: 748, z: 10, name: 'Marina Maré' },
  port:       { x: -210, z: 560, name: 'Porto Velho' },
  favela:     { x: -560, z: -280, name: 'Morro da Lua' },
  casino:     { x: 0, z: 280, name: 'Cassino Aurora' },
  warehouse:  { x: -280, z: 420, name: 'Galpão 12' },
  safehouse:  { x: 500, z: -140, name: 'Casa da Orla' },
  monument:   { x: -840, z: 0, name: 'Mirante do Sol' },
  hospital:   { x: 140, z: -700, name: 'Hospital Maré' },
  garage:     { x: 280, z: 140, name: 'Garagem Central' },
  park:       { x: -210, z: 210, name: 'Parque Aurora' },
  rpBoard:    { x: 590, z: 46, name: 'Mural RP' }
};

export const DISTRICTS = [
  { id: 'orla',     name: 'ORLA DE MATTEO',        x: 618, z: 20,  color: '#e7bd7f' },
  { id: 'centro',   name: 'CENTRO DOURADO',        x: -120, z: 20, color: '#c9a56c' },
  { id: 'morro',    name: 'MORRO DA LUA',          x: -690, z: -520, color: '#d7826d' },
  { id: 'porto',    name: 'PORTO VELHO',           x: -160, z: 640, color: '#9aa7a3' },
  { id: 'jardim',   name: 'JARDIM DAS PALMEIRAS',  x: 250, z: -620, color: '#8fb08a' },
  { id: 'mirante',  name: 'MIRANTE DO SOL',        x: -890, z: 60,  color: '#d7a35c' },
  { id: 'parque',   name: 'PARQUE AURORA',         x: -210, z: 210, color: '#6f9a64' },
  { id: 'marina',   name: 'MARINA MARÉ',           x: 760, z: 20,  color: '#75aab5' }
];

export const TIME_PRESETS = {
  golden: {
    skyTop: '#2a6a8a', skyHorizon: '#ffb27d', skyGlow: '#ffd7a1',
    sun: '#fff1cb', sunDir: [0.58, 0.18, 0.42], sunInt: 2.15,
    hemiSky: '#ffd6ae', hemiGround: '#3b4034', hemiInt: 0.72,
    ambient: '#ffb98a', ambientInt: 0.22,
    fog: '#e9a87e', fogNear: 160, fogFar: 1650,
    waterDeep: '#0a4050', waterShallow: '#249a9c', waterFoam: '#f4f7ee',
    exposure: 1.03, night: 0, star: 0,
    lamp: 0.3, cloud: '#ffe0c4', billboard: 0.25
  },
  day: {
    skyTop: '#2a7fc2', skyHorizon: '#cde8ef', skyGlow: '#fff6d8',
    sun: '#fffbe8', sunDir: [0.34, 0.78, 0.35], sunInt: 2.35,
    hemiSky: '#d8f0ff', hemiGround: '#4a5545', hemiInt: 0.9,
    ambient: '#c9e8ff', ambientInt: 0.3,
    fog: '#b7d6df', fogNear: 260, fogFar: 1900,
    waterDeep: '#0a5d75', waterShallow: '#2fb3b4', waterFoam: '#ffffff',
    exposure: 1.0, night: 0, star: 0,
    lamp: 0, cloud: '#ffffff', billboard: 0.1
  },
  night: {
    skyTop: '#030814', skyHorizon: '#12283f', skyGlow: '#ff8c52',
    sun: '#a9c7ff', sunDir: [-0.35, 0.62, 0.5], sunInt: 0.42,
    hemiSky: '#29406b', hemiGround: '#0a1016', hemiInt: 0.35,
    ambient: '#3d5c8c', ambientInt: 0.22,
    fog: '#0a1a28', fogNear: 100, fogFar: 1050,
    waterDeep: '#031521', waterShallow: '#0a3346', waterFoam: '#9cc5c8',
    exposure: 1.22, night: 1, star: 1,
    lamp: 1.6, cloud: '#2a3347', billboard: 0.75
  }
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const randRange = (r, a, b) => a + r() * (b - a);
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoiseTexture(base, specks, size = 256, count = 2600) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  for (let i = 0; i < count; i++) {
    g.fillStyle = specks[Math.floor(Math.random() * specks.length)];
    const s = Math.random() * 2.2 + 0.4;
    g.globalAlpha = Math.random() * 0.5 + 0.12;
    g.fillRect(Math.random() * size, Math.random() * size, s, s);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function makeCloudTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 256);
  for (let i = 0; i < 42; i++) {
    const x = 60 + Math.random() * 392;
    const y = 90 + Math.random() * 90;
    const r = 22 + Math.random() * 60;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,.38)');
    gr.addColorStop(0.55, 'rgba(255,255,255,.17)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeTextTexture(lines, opts = {}) {
  const w = opts.w || 512, h = opts.h || 256;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = opts.bg || '#0a1a20';
  g.fillRect(0, 0, w, h);
  if (opts.border !== false) {
    g.strokeStyle = opts.accent || '#ffc46b';
    g.lineWidth = 6;
    g.strokeRect(8, 8, w - 16, h - 16);
  }
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, opts.fg || '#fff4dc');
  grad.addColorStop(1, opts.fg2 || '#ffc46b');
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const n = lines.length;
  lines.forEach((line, i) => {
    const size = line.size || (i === 0 ? h * 0.25 : h * 0.15);
    g.font = `${line.weight || 800} ${size}px "Arial Narrow", "Barlow Condensed", sans-serif`;
    g.fillStyle = line.color || grad;
    g.fillText(line.text, w / 2, h * (line.y != null ? line.y : (n === 1 ? 0.5 : 0.3 + i * 0.28)));
  });
  if (opts.sub) {
    g.font = '600 22px Manrope, Arial, sans-serif';
    g.fillStyle = opts.accent || '#ffc46b';
    g.fillText(opts.sub, w / 2, h * 0.82);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export class World {
  constructor(renderer, settings = {}) {
    this.renderer = renderer;
    this.settings = settings;
    this.scene = new THREE.Scene();
    this.rand = mulberry32(20260214);
    this.colliders = [];
    this.colliderGrid = new Map();
    this.buildings = [];
    this.containers = [];
    this.palms = [];
    this.lamps = [];
    this.landmarkMeshes = [];
    this.wheels = [];
    this.billboards = [];
    this.docks = [
      // Píer do Sol: passarela estreita + praça na ponta.
      { x1: 634, x2: 858, z1: 136, z2: 146, h: 0.62 },
      { x1: 858, x2: 882, z1: 120, z2: 168, h: 0.62 },
      // Marina Maré: dock principal + dedos de atracação.
      { x1: 634, x2: 798, z1: 4, z2: 12, h: 0.55 },
      { x1: 734, x2: 740, z1: -28, z2: 44, h: 0.55 },
      { x1: 764, x2: 770, z1: -28, z2: 44, h: 0.55 },
      { x1: 794, x2: 798, z1: -28, z2: 44, h: 0.55 }
    ];
    this.tod = settings.tod || 'golden';
    this.time = 0;
    this.sunDir = new THREE.Vector3(0.58, 0.18, 0.42).normalize();
    this._colliderStamp = 0;
    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.width = this.mapCanvas.height = 2048;
    this.mapScale = 2048 / 2000;
    this.mapOrigin = -1000;
    this.textures = {
      sand: makeNoiseTexture('#e6c68c', ['#d4ae72', '#f2d9a8', '#c79d60', '#fff0c8']),
      grass: makeNoiseTexture('#587a4b', ['#6b8f58', '#46653d', '#7fa368', '#3d5735']),
      concrete: makeNoiseTexture('#8f9694', ['#7d8583', '#a3aaa8', '#6c7472', '#b3b9b6']),
      asphalt: makeNoiseTexture('#2c3236', ['#252a2d', '#353b3f', '#1f2427', '#41474b']),
      dirt: makeNoiseTexture('#8a7153', ['#795f43', '#9b8160', '#6a533a', '#b0946e'])
    };
    this._buildScene();
    this._buildCity();
    this._buildVegetation();
    this._buildLandmarks();
    this._buildMountains();
    this._buildMap();
    this.setTimeOfDay(this.tod, true);
  }

  _buildScene() {
    const r = this.renderer;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.03;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.fog = new THREE.Fog(0xe9a87e, 160, 1650);

    this.hemi = new THREE.HemisphereLight(0xffd6ae, 0x3b4034, 0.72);
    this.scene.add(this.hemi);
    this.ambient = new THREE.AmbientLight(0xffb98a, 0.22);
    this.scene.add(this.ambient);

    this.sunLight = new THREE.DirectionalLight(0xffc78a, 2.15);
    this.sunLight.position.set(240, 190, 160);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.left = -95;
    this.sunLight.shadow.camera.right = 95;
    this.sunLight.shadow.camera.top = 95;
    this.sunLight.shadow.camera.bottom = -95;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 500;
    this.sunLight.shadow.bias = -0.0006;
    this.sunLight.shadow.normalBias = 0.04;
    this.scene.add(this.sunLight);
    this.sunLight.target.position.set(0, 0, 0);
    this.scene.add(this.sunLight.target);

    this._buildSky();
    this._buildWater();
    this._buildGround();
    this._buildRoads();
    this._buildStreetLights();
    this._buildBillboards();
  }

  _buildSky() {
    const geo = new THREE.SphereGeometry(2800, 32, 20);
    this.skyUniforms = {
      uTop: { value: new THREE.Color('#2a6a8a') },
      uHorizon: { value: new THREE.Color('#ffb27d') },
      uGlow: { value: new THREE.Color('#ffd7a1') },
      uSunDir: { value: this.sunDir.clone() },
      uSunColor: { value: new THREE.Color('#fff1cb') },
      uNight: { value: 0 },
      uTime: { value: 0 }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: `
        varying vec3 vDir;
        void main(){
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }`,
      fragmentShader: `
        uniform vec3 uTop, uHorizon, uGlow, uSunColor;
        uniform vec3 uSunDir;
        uniform float uNight, uTime;
        varying vec3 vDir;
        float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
        float noise(vec2 p){
          vec2 i=floor(p), f=fract(p);
          f=f*f*(3.0-2.0*f);
          float a=hash(vec3(i,1.0)), b=hash(vec3(i+vec2(1.0,0.0),1.0));
          float c=hash(vec3(i+vec2(0.0,1.0),1.0)), d=hash(vec3(i+vec2(1.0,1.0),1.0));
          return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
        }
        void main(){
          vec3 d = normalize(vDir);
          float h = clamp(d.y, -0.08, 1.0);
          vec3 col = mix(uHorizon, uTop, smoothstep(0.0, 0.38, h));
          col = mix(col, uGlow, smoothstep(0.14, -0.03, abs(h)) * 0.24);
          float sd = max(dot(d, normalize(uSunDir)), 0.0);
          col += uSunColor * pow(sd, 520.0) * 2.2;
          col += uSunColor * pow(sd, 9.0) * 0.16;
          float cl = noise(d.xz * 3.2 + vec2(uTime*0.004, 0.0)) * 0.6 + noise(d.xz * 7.0 - vec2(uTime*0.002, 0.0)) * 0.4;
          float cloud = smoothstep(0.56, 0.84, cl) * smoothstep(0.04, 0.24, h) * (1.0 - smoothstep(0.55, 0.85, h));
          vec3 cloudCol = mix(vec3(1.0,0.87,0.74), vec3(0.56,0.66,0.75), uNight*0.7);
          col = mix(col, cloudCol, cloud * (0.32 + uNight*0.12));
          if (uNight > 0.01) {
            float st = hash(floor(d*420.0));
            float stars = step(0.9965, st) * smoothstep(0.1, 0.5, h) * (1.0 - smoothstep(0.72, 0.95, h));
            stars *= 0.55 + 0.45*sin(uTime*2.2 + st*40.0);
            col += vec3(0.85,0.92,1.0) * stars * uNight;
            col += vec3(1.0,0.45,0.22) * smoothstep(0.12,0.0,h) * 0.06;
          }
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    });
    this.sky = new THREE.Mesh(geo, mat);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -100;
    this.scene.add(this.sky);

    // Sun / moon sprite
    const sc = document.createElement('canvas'); sc.width = sc.height = 256;
    const sg = sc.getContext('2d');
    const grd = sg.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(255,255,245,1)');
    grd.addColorStop(0.14, 'rgba(255,244,205,.98)');
    grd.addColorStop(0.32, 'rgba(255,196,120,.5)');
    grd.addColorStop(1, 'rgba(255,160,90,0)');
    sg.fillStyle = grd; sg.fillRect(0, 0, 256, 256);
    const sunTex = new THREE.CanvasTexture(sc);
    sunTex.colorSpace = THREE.SRGBColorSpace;
    this.sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: sunTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false
    }));
    this.sunSprite.scale.set(330, 330, 1);
    this.scene.add(this.sunSprite);

    // Clouds
    const cloudTex = makeCloudTexture();
    this.clouds = [];
    for (let i = 0; i < 16; i++) {
      const m = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.32, depthWrite: false, fog: false });
      const s = new THREE.Sprite(m);
      const ang = this.rand() * Math.PI * 2;
      const rad = 700 + this.rand() * 1400;
      s.position.set(Math.cos(ang) * rad + 300, 190 + this.rand() * 180, Math.sin(ang) * rad);
      const sc2 = 260 + this.rand() * 420;
      s.scale.set(sc2, sc2 * 0.5, 1);
      s.userData.speed = 0.6 + this.rand() * 1.6;
      this.clouds.push(s);
      this.scene.add(s);
    }
  }

  _buildWater() {
    const q = this.settings.water || 'medium';
    const seg = q === 'high' ? 220 : q === 'low' ? 72 : 144;
    const geo = new THREE.PlaneGeometry(2500, 2600, seg, seg);
    geo.rotateX(-Math.PI / 2);
    this.waterUniforms = {
      uTime: { value: 0 },
      uSunDir: { value: this.sunDir.clone() },
      uSunColor: { value: new THREE.Color('#ffe6b8') },
      uDeep: { value: new THREE.Color('#0a4050') },
      uShallow: { value: new THREE.Color('#249a9c') },
      uFoam: { value: new THREE.Color('#f4f7ee') },
      uFog: { value: new THREE.Color('#e9a87e') },
      uSkyTop: { value: new THREE.Color('#2a6a8a') },
      uSkyHorizon: { value: new THREE.Color('#ffb27d') },
      uCamPos: { value: new THREE.Vector3() },
      uNight: { value: 0 },
      uShoreX: { value: SHORE_X },
      uDetail: { value: q === 'low' ? 0.85 : 1.0 }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.waterUniforms,
      fog: false,
      vertexShader: `
        uniform float uTime;
        uniform float uDetail;
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying float vWave;

        // Directional swell: long Pacific-style rollers crossing the bay.
        float swell(vec2 p, float t){
          float h = 0.0;
          h += sin(dot(p, vec2( 0.052, 0.031)) + t * 1.05) * 0.180;
          h += sin(dot(p, vec2(-0.028, 0.074)) - t * 0.82) * 0.120;
          h += sin(dot(p, vec2( 0.016, 0.018)) + t * 0.52) * 0.200;
          h += sin(dot(p, vec2( 0.110,-0.090)) + t * 1.55) * 0.035;
          h += sin(dot(p, vec2(-0.190, 0.060)) + t * 2.20) * 0.020;
          return h;
        }

        void main(){
          vec3 pos = position;
          vec4 wp = modelMatrix * vec4(pos, 1.0);
          float t = uTime;
          float w = swell(wp.xz, t) * uDetail;
          wp.y += w;

          // Analytic-ish normal from finite differences on the swell field.
          float e = 1.25;
          float hL = swell(wp.xz - vec2(e, 0.0), t) * uDetail;
          float hR = swell(wp.xz + vec2(e, 0.0), t) * uDetail;
          float hD = swell(wp.xz - vec2(0.0, e), t) * uDetail;
          float hU = swell(wp.xz + vec2(0.0, e), t) * uDetail;
          vNormal = normalize(vec3((hL - hR) / (2.0 * e), 1.0, (hD - hU) / (2.0 * e)));
          vWorld = wp.xyz;
          vWave = w;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        uniform float uTime, uNight, uShoreX, uDetail;
        uniform vec3 uSunDir, uSunColor, uDeep, uShallow, uFoam, uFog, uSkyTop, uSkyHorizon, uCamPos;
        varying vec3 vWorld;
        varying vec3 vNormal;
        varying float vWave;

        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        float fbm(vec2 p){
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 3; i++) {
            v += a * noise(p);
            p = p * 2.03 + vec2(17.1, 9.7);
            a *= 0.5;
          }
          return v;
        }

        void main(){
          vec3 viewDir = normalize(uCamPos - vWorld);
          vec3 N = normalize(vNormal);

          // Two scales of moving capillary ripples on top of the swell.
          vec2 q = vWorld.xz;
          float n1 = fbm(q * 0.30 + vec2(uTime * 0.34, uTime * 0.11));
          float n2 = fbm(q * 1.05 - vec2(uTime * 0.58, uTime * 0.24));
          vec3 detail = vec3(
            (n1 - 0.5) * 0.34 * uDetail + (n2 - 0.5) * 0.13 * uDetail,
            0.0,
            (n2 - 0.5) * 0.30 * uDetail - (n1 - 0.5) * 0.10 * uDetail
          );
          N = normalize(N + detail);

          float ndv = clamp(dot(N, viewDir), 0.0, 1.0);
          // Schlick Fresnel, water F0 ~0.02.
          float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);

          // Sky reflection tinted by the time-of-day gradient.  Grazing angles
          // reflect the warm horizon band; blending a little of the upper sky
          // in keeps the sea reading blue instead of dissolving into the haze.
          vec3 R = reflect(-viewDir, N);
          float skyMix = smoothstep(0.28, -0.04, R.y);
          vec3 skyRef = mix(uSkyTop, uSkyHorizon, skyMix * 0.62);
          vec3 sunDir = normalize(uSunDir);
          float sunR = max(dot(R, sunDir), 0.0);
          skyRef += uSunColor * pow(sunR, 120.0) * 1.1;
          skyRef += uSunColor * pow(sunR, 12.0) * 0.08;

          // Depth: turquoise shallows fading to deep Atlantic blue.
          float shoreDist = max(0.0, vWorld.x - uShoreX);
          float depthMix = smoothstep(0.0, 300.0, shoreDist);
          vec3 body = mix(uShallow, uDeep, depthMix);
          // Sub-surface glow on wave crests.
          body += uShallow * smoothstep(0.35, 1.15, vWave) * 0.14;

          // Sun specular + broad glitter path.
          vec3 H = normalize(sunDir + viewDir);
          float ndh = max(dot(N, H), 0.0);
          float spec = pow(ndh, 620.0);
          float glint = pow(ndh, 46.0);
          body += uSunColor * spec * 2.4;
          body += uSunColor * glint * 0.10;
          float sparkle = pow(ndh, 130.0) * smoothstep(0.55, 0.95, noise(q * 2.6 + uTime * 0.9));
          body += uSunColor * sparkle * 0.32;

          vec3 col = mix(body, skyRef, fres * 0.54);

          // Shore foam: lacy lines rolling up the wet sand.
          float shoreBand = 1.0 - smoothstep(0.0, 42.0, shoreDist);
          float drift = fbm(q * 0.48 + vec2(uTime * 0.5, -uTime * 0.2));
          float lines = sin(shoreDist * 0.85 - uTime * 2.3 + drift * 4.2) * 0.5 + 0.5;
          float lace = smoothstep(0.55, 0.93, lines)
                     * smoothstep(0.28, 0.76, fbm(q * 1.35 - vec2(uTime * 0.3, uTime * 0.22)));
          float wash = (1.0 - smoothstep(0.0, 8.0, shoreDist)) * 0.55;
          float foamShore = shoreBand * (lace * 0.9 + wash);
          // Whitecaps only on the tallest crests, kept small and broken up.
          float crestFoam = smoothstep(0.72, 1.0, vWave * 0.5 + 0.5)
                          * smoothstep(0.58, 0.92, fbm(q * 0.62 + vec2(uTime * 0.7, uTime * 0.3)))
                          * 0.14;
          float foam = clamp(foamShore + crestFoam, 0.0, 1.0);
          col = mix(col, uFoam, foam * 0.85);

          // Moonlit cool shift at night.
          col = mix(col, col * vec3(0.58, 0.72, 1.0), uNight * 0.38);

          // Aerial perspective.  The far Atlantic keeps a cool blue body and
          // only picks up a touch of warm haze, so the horizon stays a crisp
          // ocean line instead of blending into the sky.
          float dist = length(uCamPos - vWorld);
          vec3 farSea = mix(uDeep, uSkyTop, 0.38);
          float haze = smoothstep(650.0, 3400.0, dist);
          col = mix(col, farSea, haze * 0.62);
          col = mix(col, uFog, smoothstep(2400.0, 5200.0, dist) * 0.28);

          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    });
    this.water = new THREE.Mesh(geo, mat);
    // A borda oeste fica sob a areia molhada: as cristas lambem a praia
    // em vez de formar uma parede d'água na linha da maré.
    this.water.position.set(1890, -0.5, 0);
    this.water.frustumCulled = false;
    this.scene.add(this.water);
  }

  _buildGround() {
    // Land base
    const baseGeo = new THREE.PlaneGeometry(1659, 2100, 1, 1);
    baseGeo.rotateX(-Math.PI / 2);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x6c7c5c, roughness: 1 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(-195.5, -0.02, 0);
    base.receiveShadow = true;
    this.scene.add(base);

    // Sand
    const sandTex = this.textures.sand.clone(); sandTex.repeat.set(5, 160); sandTex.needsUpdate = true;
    const sand = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 2050),
      new THREE.MeshStandardMaterial({ map: sandTex, color: 0xffffff, roughness: 1 })
    );
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(612, 0.01, 0);
    sand.receiveShadow = true;
    this.scene.add(sand);

    // Wet sand ramps down into the water so waves can wash over the edge
    // instead of ending on a hard step.
    const wetGeo = new THREE.PlaneGeometry(16, 2050);
    wetGeo.rotateX(-Math.PI / 2);
    wetGeo.rotateZ(-0.0325);
    const wet = new THREE.Mesh(
      wetGeo,
      new THREE.MeshStandardMaterial({ color: 0xb69a6d, roughness: 0.55, metalness: 0.08 })
    );
    wet.position.set(642, -0.24, 0);
    this.scene.add(wet);

    // Promenade stone
    const prom = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 2050),
      new THREE.MeshStandardMaterial({ color: 0xb9b09a, roughness: 0.9 })
    );
    prom.rotation.x = -Math.PI / 2;
    prom.position.set(581, 0.025, 0);
    prom.receiveShadow = true;
    this.scene.add(prom);

    // Bike lane
    const bike = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 2050),
      new THREE.MeshStandardMaterial({ color: 0xb8563f, roughness: 0.85 })
    );
    bike.rotation.x = -Math.PI / 2;
    bike.position.set(593, 0.03, 0);
    this.scene.add(bike);

    // Promenade tiling lines
    const lineGeo = new THREE.BoxGeometry(0.08, 0.012, 1.6);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x8b8472 });
    const lines = new THREE.InstancedMesh(lineGeo, lineMat, 240);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 240; i++) {
      m.makeTranslation(566 + (i % 4) * 7.4, 0.035, -1000 + Math.floor(i / 4) * 33.5);
      lines.setMatrixAt(i, m);
    }
    lines.instanceMatrix.needsUpdate = true;
    this.scene.add(lines);
  }

  _buildRoads() {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x2e3438, roughness: 0.97, metalness: 0.02 });
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x9a9c92, roughness: 0.92 });
    const w = 26;

    for (const x of ROADS_X) {
      const road = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 2040), roadMat);
      road.position.set(x, 0.02, 0);
      road.receiveShadow = true;
      this.scene.add(road);
      const sw1 = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 2040), sidewalkMat);
      sw1.position.set(x - w / 2 - 2, 0.05, 0);
      this.scene.add(sw1);
      const sw2 = sw1.clone(); sw2.position.x = x + w / 2 + 2; this.scene.add(sw2);
    }
    for (const z of ROADS_Z) {
      const road = new THREE.Mesh(new THREE.BoxGeometry(1480, 0.08, w), roadMat);
      road.position.set(-150, 0.021, z);
      road.receiveShadow = true;
      this.scene.add(road);
      const sw1 = new THREE.Mesh(new THREE.BoxGeometry(1480, 0.1, 4), sidewalkMat);
      sw1.position.set(-150, 0.05, z - w / 2 - 2);
      this.scene.add(sw1);
      const sw2 = sw1.clone(); sw2.position.z = z + w / 2 + 2; this.scene.add(sw2);
    }

    // Lane dashes
    const dashGeo = new THREE.BoxGeometry(0.16, 0.015, 5);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xd9d2b8 });
    const dashes = [];
    for (const x of ROADS_X) for (let z = -1000; z < 1000; z += 14) dashes.push([x, z, 0]);
    for (const z of ROADS_Z) for (let x = -860; x < 566; x += 14) dashes.push([x, z, 1]);
    const dashMesh = new THREE.InstancedMesh(dashGeo, dashMat, dashes.length);
    const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const s = new THREE.Vector3(1, 1, 1);
    dashes.forEach((d, i) => {
      const e = new THREE.Euler(0, d[2] ? Math.PI / 2 : 0, 0);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(d[0], 0.075, d[1]), q, s);
      dashMesh.setMatrixAt(i, m);
    });
    dashMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(dashMesh);

    // Center double lines on main avenues
    const centerMat = new THREE.MeshBasicMaterial({ color: 0xe8c46f });
    for (const x of [0, 280, -280, 560]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 2040), centerMat);
      l.position.set(x - 0.4, 0.078, 0); this.scene.add(l);
      const l2 = l.clone(); l2.position.x = x + 0.4; this.scene.add(l2);
    }

    // Crosswalks at central intersections
    const cwMat = new THREE.MeshBasicMaterial({ color: 0xe4ded0 });
    const cwGeo = new THREE.BoxGeometry(1.6, 0.012, 6);
    const cw = new THREE.InstancedMesh(cwGeo, cwMat, 12 * 12 * 2);
    let ci = 0;
    for (const x of [0, 280, -280, 140, -140, 560]) {
      for (const z of [0, 280, -280, 140, -140, 420]) {
        for (let k = 0; k < 2; k++) {
          const mm = new THREE.Matrix4();
          if (k === 0) {
            for (let s2 = -5; s2 <= 5; s2 += 2.5) {
              if (ci >= cw.count) break;
              mm.makeTranslation(x + s2, 0.08, z - 16);
              cw.setMatrixAt(ci++, mm);
            }
          }
        }
      }
    }
    cw.count = ci;
    cw.instanceMatrix.needsUpdate = true;
    this.scene.add(cw);
  }

  _buildStreetLights() {
    const positions = [];
    for (const x of ROADS_X) {
      for (let z = -840; z <= 700; z += 120) {
        positions.push([x - 17, z, 0]);
        positions.push([x + 17, z + 60, 0]);
      }
    }
    for (const z of ROADS_Z) {
      for (let x = -840; x <= 560; x += 120) {
        positions.push([x, z - 17, 1]);
        positions.push([x + 60, z + 17, 1]);
      }
    }
    const n = positions.length;
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.4, 5);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x39434a, roughness: 0.7, metalness: 0.4 });
    const poles = new THREE.InstancedMesh(poleGeo, poleMat, n);
    const armGeo = new THREE.BoxGeometry(2.4, 0.14, 0.14);
    const arms = new THREE.InstancedMesh(armGeo, poleMat, n);
    const lampGeo = new THREE.BoxGeometry(0.85, 0.24, 0.42);
    this.lampMat = new THREE.MeshStandardMaterial({ color: 0x1c252b, emissive: 0xffd7a0, emissiveIntensity: 0.4, roughness: 0.5 });
    const lamps = new THREE.InstancedMesh(lampGeo, this.lampMat, n);
    const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const s = new THREE.Vector3(1, 1, 1);
    positions.forEach((p, i) => {
      m.compose(new THREE.Vector3(p[0], 3.7, p[1]), new THREE.Quaternion(), s);
      poles.setMatrixAt(i, m);
      const dir = p[2] ? (p[0] % 2 === 0 ? 1 : -1) : (p[1] % 2 === 0 ? 1 : -1);
      q.setFromEuler(new THREE.Euler(0, p[2] ? Math.PI / 2 : 0, 0));
      m.compose(new THREE.Vector3(p[0] + (p[2] ? 0 : dir * 1.1), 7.3, p[1] + (p[2] ? dir * 1.1 : 0)), q, s);
      arms.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(p[0] + (p[2] ? 0 : dir * 2.1), 7.18, p[1] + (p[2] ? dir * 2.1 : 0)), q, s);
      lamps.setMatrixAt(i, m);
    });
    poles.instanceMatrix.needsUpdate = true;
    arms.instanceMatrix.needsUpdate = true;
    lamps.instanceMatrix.needsUpdate = true;
    poles.castShadow = false;
    this.scene.add(poles, arms, lamps);
  }

  _buildBillboards() {
    const defs = [
      { x: 545, z: -240, ry: -Math.PI / 2, lines: [{ text: 'ORLA DOURADA', size: 84 }, { text: 'VIVA O PÔR DO SOL', size: 34, color: '#ffe3ad' }], bg: '#0d2b34', accent: '#ffc46b' },
      { x: 300, z: 140, ry: Math.PI, lines: [{ text: 'SUNSET FM', size: 86 }, { text: '98.7 · O SOM DA CIDADE', size: 30, color: '#8ff5e4' }], bg: '#0a1f2c', accent: '#2ee6c8' },
      { x: -420, z: 280, ry: Math.PI / 2, lines: [{ text: 'MATTEO 5', size: 86 }, { text: 'JOGUE SEM LIMITES', size: 32, color: '#ffd9a1' }], bg: '#101a2c', accent: '#ffb347' },
      { x: -140, z: 560, ry: 0, lines: [{ text: 'PORTO VELHO', size: 76 }, { text: 'O TRABALHO NUNCA PARA', size: 27, color: '#b8f0d7' }], bg: '#182321', accent: '#7dfba7' },
      { x: 140, z: -420, ry: 0, lines: [{ text: 'MORRO DA LUA', size: 78 }, { text: 'A CIDADE É SUA', size: 30, color: '#ffc7b4' }], bg: '#291a19', accent: '#ff6b57' },
      { x: -840, z: 140, ry: Math.PI / 2, lines: [{ text: 'MIRANTE', size: 86 }, { text: 'DO SOL · ABERTO 24H', size: 28, color: '#ffe4a6' }], bg: '#1c2430', accent: '#ffc46b' }
    ];
    for (const d of defs) {
      const tex = makeTextTexture(d.lines, { bg: d.bg, accent: d.accent });
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.15 });
      const board = new THREE.Mesh(new THREE.PlaneGeometry(24, 12), mat);
      board.position.set(d.x, 14, d.z);
      board.rotation.y = d.ry;
      this.scene.add(board);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a3238, roughness: 0.6, metalness: 0.5 });
      const back = new THREE.Mesh(new THREE.BoxGeometry(25, 13, 0.6), frameMat);
      back.position.set(d.x, 14, d.z);
      back.rotation.y = d.ry;
      this.scene.add(back);
      for (const off of [-9, 9]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 9, 6), frameMat);
        post.position.set(d.x + Math.cos(d.ry) * off, 4.5, d.z - Math.sin(d.ry) * off);
        this.scene.add(post);
      }
      this.billboards.push(mat);
    }
  }

  setTimeOfDay(id, initial = false) {
    const p = TIME_PRESETS[id] || TIME_PRESETS.golden;
    this.tod = id;
    this.sunDir.set(...p.sunDir).normalize();
    this.scene.fog.color.set(p.fog);
    this.scene.fog.near = p.fogNear;
    this.scene.fog.far = p.fogFar;
    this.hemi.color.set(p.hemiSky);
    this.hemi.groundColor.set(p.hemiGround);
    this.hemi.intensity = p.hemiInt;
    this.ambient.color.set(p.ambient);
    this.ambient.intensity = p.ambientInt;
    this.sunLight.color.set(p.sun);
    this.sunLight.intensity = p.sunInt;
    this.renderer.toneMappingExposure = p.exposure;
    if (this.skyUniforms) {
      this.skyUniforms.uTop.value.set(p.skyTop);
      this.skyUniforms.uHorizon.value.set(p.skyHorizon);
      this.skyUniforms.uGlow.value.set(p.skyGlow);
      this.skyUniforms.uSunColor.value.set(p.sun);
      this.skyUniforms.uSunDir.value.copy(this.sunDir);
      this.skyUniforms.uNight.value = p.night;
    }
    if (this.waterUniforms) {
      this.waterUniforms.uDeep.value.set(p.waterDeep);
      this.waterUniforms.uShallow.value.set(p.waterShallow);
      this.waterUniforms.uFoam.value.set(p.waterFoam);
      this.waterUniforms.uFog.value.set(p.fog);
      this.waterUniforms.uSkyTop.value.set(p.skyTop);
      this.waterUniforms.uSkyHorizon.value.set(p.skyHorizon);
      this.waterUniforms.uSunColor.value.set(p.sun);
      this.waterUniforms.uSunDir.value.copy(this.sunDir);
      this.waterUniforms.uNight.value = p.night;
    }
    if (this.lampMat) this.lampMat.emissiveIntensity = p.lamp;
    for (const b of this.billboards) b.emissiveIntensity = p.billboard;
    if (this.facadeShader) this.facadeShader.uniforms.uNight.value = p.night;
    for (const c of this.clouds) {
      c.material.color.set(p.cloud);
      c.material.opacity = p.night ? 0.18 : 0.3;
    }
    if (this.sunSprite) {
      this.sunSprite.material.color.set(p.night ? '#bcd4ff' : '#ffffff');
      this.sunSprite.scale.setScalar(p.night ? 120 : 330);
    }
    if (this.lighthouseBeam) this.lighthouseBeam.visible = p.night > 0.5;
  }

  update(dt, camera, playerPos) {
    this.time += dt;
    const t = this.time;
    if (this.waterUniforms) {
      this.waterUniforms.uTime.value = t;
      this.waterUniforms.uCamPos.value.copy(camera.position);
    }
    if (this.skyUniforms) this.skyUniforms.uTime.value = t;
    if (this.sky) this.sky.position.copy(camera.position);
    if (this.sunSprite) {
      this.sunSprite.position.copy(camera.position).addScaledVector(this.sunDir, 2300);
    }
    for (const c of this.clouds) {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 2200) c.position.x = -2200;
    }
    if (this.sunLight) {
      const p = playerPos || new THREE.Vector3();
      this.sunLight.position.set(p.x + this.sunDir.x * 260, this.sunDir.y * 320 + 60, p.z + this.sunDir.z * 260);
      this.sunLight.target.position.set(p.x, 0, p.z);
      this.sunLight.target.updateMatrixWorld();
    }
    for (const w of this.wheels) w.rotation.z += dt * 0.055;
    if (this.gondolas) {
      for (const g of this.gondolas) g.rotation.z = -this.wheelGroup.rotation.z;
    }
    if (this.lighthouseBeam) {
      this.lighthouseBeam.rotation.y += dt * 0.5;
    }
  }
}

/* ============================================================
   CITY GENERATION
   ============================================================ */
World.prototype._districtAt = function (cx, cz) {
  if (cx > -280 && cx < -140 && cz > 140 && cz < 280) return 'parque';
  if (cx < -420 && cz < -140) return 'morro';
  if (cz > 420 && cx < 280) return 'porto';
  if (cx > 420) return 'orla';
  if (cx > -420 && cx < 280 && cz > -280 && cz < 420) return 'centro';
  return 'jardim';
};

World.prototype._addCollider = function (x, z, w, d, h, type = 'building') {
  const c = { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, h, type };
  this.colliders.push(c);
  const cs = 80;
  const i0 = Math.floor(c.minX / cs), i1 = Math.floor(c.maxX / cs);
  const j0 = Math.floor(c.minZ / cs), j1 = Math.floor(c.maxZ / cs);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const key = i + ':' + j;
    let arr = this.colliderGrid.get(key);
    if (!arr) { arr = []; this.colliderGrid.set(key, arr); }
    arr.push(c);
  }
  return c;
};

World.prototype._addBuilding = function (x, z, w, d, h, color, kind = 'res', y0 = 0, solid = true) {
  const b = { x, z, w, d, h, color, kind, y0 };
  this.buildings.push(b);
  if (solid && y0 === 0) this._addCollider(x, z, w, d, h, 'building');
  return b;
};

World.prototype._addBlockGround = function (cx, cz, district) {
  const colors = {
    centro: 0x9b9d95, jardim: 0xa9a693, morro: 0x8b7355,
    porto: 0x7f8784, orla: 0xc7bda6, parque: 0x5a7f4e
  };
  const map = district === 'parque' ? this.textures.grass.clone()
    : district === 'morro' ? this.textures.dirt.clone()
      : this.textures.concrete.clone();
  map.repeat.set(8, 8); map.needsUpdate = true;
  const mat = new THREE.MeshStandardMaterial({ map, color: colors[district] || 0x9b9d95, roughness: 1 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(106, 106), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(cx, 0.03, cz);
  mesh.receiveShadow = true;
  this.scene.add(mesh);
};

World.prototype._buildCity = function () {
  this.parkBlocks = [];
  const downtownColors = ['#c9c3b6', '#b7c2c4', '#d8cfbd', '#9fb3b7', '#c7b49a', '#e0d6c2', '#a9b6b8', '#cfc8b8'];
  const resColors = ['#d8c7a8', '#c98f6f', '#e3d3b8', '#b7c3a8', '#d9b9a0', '#c2a98c', '#d6b9a8'];
  const beachColors = ['#f0e7d5', '#e9d6b8', '#f2ddc0', '#d9c1a4', '#f4e9d8', '#e5d3b9'];
  const favelaColors = ['#2ec4b6', '#ff7a59', '#ffd166', '#ef476f', '#118ab2', '#f78c6b', '#b388eb', '#7bd389', '#f2b5d4'];
  const portColors = ['#8d9793', '#a46a4f', '#7a8684', '#b0a08b', '#8d7d6b'];

  for (let i = 0; i < ROADS_X.length - 1; i++) {
    for (let j = 0; j < ROADS_Z.length - 1; j++) {
      const cx = (ROADS_X[i] + ROADS_X[i + 1]) / 2;
      const cz = (ROADS_Z[j] + ROADS_Z[j + 1]) / 2;
      const d = this._districtAt(cx, cz);
      this._addBlockGround(cx, cz, d);
      if (d === 'parque') { this.parkBlocks.push({ cx, cz }); continue; }

      if (d === 'centro') {
        const tall = 1 - Math.min(1, Math.hypot(cx + 80, cz - 60) / 460);
        const cells = [[-26, -26], [26, -26], [-26, 26], [26, 26]];
        const count = 1 + Math.floor(this.rand() * 3);
        for (let k = 0; k < count; k++) {
          const c = cells[(k + Math.floor(this.rand() * 4)) % 4];
          const w = 28 + this.rand() * 15, dd = 28 + this.rand() * 15;
          const h = 32 + this.rand() * 60 + tall * 48;
          const color = pick(this.rand, downtownColors);
          this._addBuilding(cx + c[0], cz + c[1], w, dd, h, color, 'tower');
          if (h > 72) {
            this._addBuilding(cx + c[0], cz + c[1], w * 0.66, dd * 0.66, 7 + this.rand() * 12, color, 'tower', h, false);
            if (this.rand() > 0.45) this._addBuilding(cx + c[0], cz + c[1], w * 0.3, dd * 0.3, 4, '#5c6a6d', 'tower', h + 12, false);
          }
        }
        if (this.rand() > 0.55) {
          const px = cx + randRange(this.rand, -34, 34), pz = cz + randRange(this.rand, -34, 34);
          this._addBuilding(px, pz, 13, 10, 6, '#cbbfa8', 'shop');
        }
      } else if (d === 'orla') {
        const h = 19 + this.rand() * 27;
        this._addBuilding(cx + 27, cz, 32, 56 + this.rand() * 24, h, pick(this.rand, beachColors), 'hotel');
        this._addBuilding(cx - 27, cz - 24, 30, 34, 9 + this.rand() * 10, pick(this.rand, beachColors), 'res');
        if (this.rand() > 0.5) this._addBuilding(cx - 26, cz + 30, 26, 22, 6 + this.rand() * 5, '#d9c1a4', 'shop');
        if (this.rand() > 0.55) {
          const pool = new THREE.Mesh(
            new THREE.BoxGeometry(14, 0.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x3fd2d0, roughness: 0.15, metalness: 0.2, emissive: 0x0b5157, emissiveIntensity: 0.3 })
          );
          pool.position.set(cx + 27, h + 0.3, cz - 14);
          this.scene.add(pool);
        }
      } else if (d === 'morro') {
        const cells = [-34, 0, 34];
        for (const ox of cells) for (const oz of cells) {
          if (this.rand() < 0.18) continue;
          const w = 15 + this.rand() * 7, dd = 15 + this.rand() * 7;
          const h = 4.5 + this.rand() * 8;
          const color = pick(this.rand, favelaColors);
          const bx = cx + ox + randRange(this.rand, -3, 3);
          const bz = cz + oz + randRange(this.rand, -3, 3);
          this._addBuilding(bx, bz, w, dd, h, color, 'favela');
          if (this.rand() > 0.7) this._addBuilding(bx + 1, bz + 1, w * 0.7, dd * 0.7, 3.2 + this.rand() * 3, color, 'favela', h, false);
          if (this.rand() > 0.82) {
            this._addBuilding(bx + 2, bz - 2, w * 0.5, dd * 0.5, 2.6, '#d7d0bc', 'favela', h + 3, false);
          }
        }
      } else if (d === 'porto') {
        const wh = 9 + this.rand() * 8;
        this._addBuilding(cx - 8, cz - 6, 68, 46, wh, pick(this.rand, portColors), 'warehouse');
        const cCols = ['#b8453a', '#2d6e8c', '#3d7a52', '#c08a32', '#7b5a8c', '#b85d2f'];
        for (let k = 0; k < 3; k++) {
          for (let q = 0; q < 2; q++) {
            if (this.rand() < 0.25) continue;
            const sx = cx + 42 + q * 3, sz = cz - 38 + k * 13;
            const stack = 1 + Math.floor(this.rand() * 3);
            for (let s = 0; s < stack; s++) {
              this.containers.push({ x: sx, z: sz, y: s * 2.7, w: 12, h: 2.55, d: 2.55, color: pick(this.rand, cCols) });
            }
            this._addCollider(sx, sz, 12, 2.6, stack * 2.7, 'container');
          }
        }
        if (this.rand() > 0.5) this._addBuilding(cx + 30, cz + 38, 18, 14, 5, '#8b7355', 'shop');
      } else {
        const cells = [[-25, -25], [25, -25], [-25, 25], [25, 25]];
        const count = 2 + Math.floor(this.rand() * 2);
        for (let k = 0; k < count; k++) {
          const c = cells[k % 4];
          if (this.rand() < 0.12) continue;
          const w = 24 + this.rand() * 14, dd = 24 + this.rand() * 14;
          const h = 8 + this.rand() * 17;
          this._addBuilding(cx + c[0] + randRange(this.rand, -3, 3), cz + c[1] + randRange(this.rand, -3, 3), w, dd, h, pick(this.rand, resColors), 'res');
        }
        if (this.rand() > 0.7) {
          this._addBuilding(cx + randRange(this.rand, -30, 30), cz + randRange(this.rand, -30, 30), 10, 9, 4.5, '#b8a27f', 'shop');
        }
      }
    }
  }

  this._buildBuildingMesh();
  this._buildRooftops();
  this._buildContainers();
  this._buildBaseShadows();
};

World.prototype._buildBuildingMesh = function () {
  const n = this.buildings.length;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const colors = new Float32Array(n * 3);
  const color = new THREE.Color();
  this.buildings.forEach((b, i) => {
    color.set(b.color);
    color.toArray(colors, i * 3);
  });
  geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3));

  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.74, metalness: 0.13 });
  mat.onBeforeCompile = (shader) => {
    this.facadeShader = shader;
    shader.uniforms.uNight = { value: this.tod === 'night' ? 1 : 0 };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec3 aColor;
        varying vec3 vTint;
        varying vec3 vFacade;
        varying vec3 vFacadeNormal;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vTint = aColor;
        vFacade = (instanceMatrix * vec4(position, 1.0)).xyz;
        vFacadeNormal = normalize(mat3(instanceMatrix) * normal);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vTint;
        varying vec3 vFacade;
        varying vec3 vFacadeNormal;
        uniform float uNight;
        float bHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 bn = normalize(vFacadeNormal);
        float sideMask = 1.0 - step(0.55, abs(bn.y));
        float bu = abs(bn.x) > 0.55 ? vFacade.z : vFacade.x;
        float floorH = 3.55;
        float colW = 3.15;
        float fy = fract(vFacade.y / floorH);
        float fx = fract(bu / colW);
        float win = step(0.2, fx) * step(fx, 0.8) * step(0.3, fy) * step(fy, 0.78) * sideMask;
        float cell = floor(vFacade.y / floorH) * 19.0 + floor(bu / colW) * 37.0;
        float rnd = bHash(vec2(cell, 3.7));
        vec3 glass = mix(vec3(0.055, 0.115, 0.14), vec3(0.22, 0.34, 0.38), rnd * 0.6);
        diffuseColor.rgb *= vTint;
        diffuseColor.rgb *= 1.0 - 0.1 * sideMask * step(0.88, fy);
        diffuseColor.rgb = mix(diffuseColor.rgb, glass, win * 0.72);
        diffuseColor.rgb = mix(diffuseColor.rgb, vTint * 0.62, step(0.55, abs(bn.y)) * 0.5);
        float shop = step(vFacade.y, 3.4) * sideMask * step(0.42, fract(bu / 5.2));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.09, 0.14, 0.15), shop * 0.35);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float lit = step(0.52, bHash(vec2(cell * 1.7, 9.1))) * uNight;
        totalEmissiveRadiance += vec3(1.0, 0.68, 0.36) * win * lit * 0.62;
        totalEmissiveRadiance += vec3(0.22, 0.52, 0.66) * win * uNight * 0.05;
        totalEmissiveRadiance += vec3(0.18, 0.45, 0.55) * shop * uNight * 0.22;`);
  };
  mat.customProgramCacheKey = () => 'matteo-facade-v2';
  this.buildingMesh = new THREE.InstancedMesh(geo, mat, n);
  this.buildingMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const m = new THREE.Matrix4();
  this.buildings.forEach((b, i) => {
    m.makeScale(b.w, b.h, b.d);
    m.setPosition(b.x, b.y0 + b.h / 2, b.z);
    this.buildingMesh.setMatrixAt(i, m);
  });
  this.buildingMesh.instanceMatrix.needsUpdate = true;
  this.buildingMesh.receiveShadow = true;
  this.scene.add(this.buildingMesh);
};

World.prototype._buildRooftops = function () {
  const props = [];
  for (const b of this.buildings) {
    if (b.y0 > 0 || b.h < 7) continue;
    const count = b.h > 40 ? 2 + Math.floor(this.rand() * 3) : Math.floor(this.rand() * 2);
    for (let i = 0; i < count; i++) {
      const w = 2.5 + this.rand() * 3;
      props.push({
        x: b.x + randRange(this.rand, -b.w * 0.25, b.w * 0.25),
        z: b.z + randRange(this.rand, -b.d * 0.25, b.d * 0.25),
        y: b.h, w, h: 1.2 + this.rand() * 1.8, d: w * (0.7 + this.rand() * 0.6)
      });
    }
  }
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0x586264, roughness: 0.8, metalness: 0.25 });
  const mesh = new THREE.InstancedMesh(geo, mat, props.length);
  const m = new THREE.Matrix4();
  props.forEach((p, i) => {
    m.makeScale(p.w, p.h, p.d);
    m.setPosition(p.x, p.y + p.h / 2, p.z);
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  this.scene.add(mesh);

  // water tanks / antennas on tall towers
  const tanks = [];
  for (const b of this.buildings) {
    if (b.kind === 'tower' && b.y0 === 0 && b.h > 50 && this.rand() > 0.4) {
      tanks.push({ x: b.x + randRange(this.rand, -6, 6), z: b.z + randRange(this.rand, -6, 6), y: b.h });
    }
  }
  if (tanks.length) {
    const tGeo = new THREE.CylinderGeometry(1.5, 1.8, 2.4, 8);
    const tMat = new THREE.MeshStandardMaterial({ color: 0x8a9496, roughness: 0.6, metalness: 0.3 });
    const tMesh = new THREE.InstancedMesh(tGeo, tMat, tanks.length);
    tanks.forEach((t, i) => {
      m.makeTranslation(t.x, t.y + 1.2, t.z);
      tMesh.setMatrixAt(i, m);
    });
    tMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(tMesh);
  }
  const antennas = [];
  for (const b of this.buildings) {
    if (b.kind === 'tower' && b.y0 === 0 && b.h > 76 && this.rand() > 0.35) {
      antennas.push({ x: b.x, z: b.z, y: b.h + 8 });
    }
  }
  if (antennas.length) {
    const aGeo = new THREE.CylinderGeometry(0.12, 0.2, 16, 4);
    const aMat = new THREE.MeshStandardMaterial({ color: 0x3b464c, roughness: 0.5, metalness: 0.6 });
    const aMesh = new THREE.InstancedMesh(aGeo, aMat, antennas.length);
    antennas.forEach((a, i) => {
      m.makeTranslation(a.x, a.y, a.z);
      aMesh.setMatrixAt(i, m);
    });
    aMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(aMesh);
  }
};

World.prototype._buildContainers = function () {
  if (!this.containers.length) return;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const colors = new Float32Array(this.containers.length * 3);
  const col = new THREE.Color();
  this.containers.forEach((c, i) => { col.set(c.color); col.toArray(colors, i * 3); });
  geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3));
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0.35 });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aColor; varying vec3 vTint;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTint = aColor;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTint;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vTint;');
  };
  mat.customProgramCacheKey = () => 'container-tint';
  const mesh = new THREE.InstancedMesh(geo, mat, this.containers.length);
  const m = new THREE.Matrix4();
  this.containers.forEach((c, i) => {
    m.makeScale(c.w, c.h, c.d);
    m.setPosition(c.x, c.y + c.h / 2, c.z);
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.receiveShadow = true;
  this.scene.add(mesh);
};

World.prototype._buildBaseShadows = function () {
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false });
  const list = this.buildings.filter(b => b.y0 === 0);
  const mesh = new THREE.InstancedMesh(geo, mat, list.length);
  const m = new THREE.Matrix4();
  list.forEach((b, i) => {
    m.makeScale(b.w + 4, 1, b.d + 4);
    m.setPosition(b.x, 0.041, b.z);
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.renderOrder = 1;
  this.scene.add(mesh);
};

/* ============================================================
   VEGETATION, PARK AND BEACH DRESSING
   ============================================================ */
World.prototype._buildVegetation = function () {
  const palms = [];
  for (let z = -920; z <= 920; z += 38) palms.push({ x: 575 + randRange(this.rand, -1.5, 1.5), z: z + randRange(this.rand, -3, 3), s: 0.86 + this.rand() * 0.3 });
  for (let z = -880; z <= 880; z += 66) palms.push({ x: 624 + randRange(this.rand, -6, 6), z: z + randRange(this.rand, -8, 8), s: 0.8 + this.rand() * 0.42 });
  for (let k = 0; k < 30; k++) {
    const roadX = pick(this.rand, ROADS_X);
    const roadZ = pick(this.rand, ROADS_Z);
    const x = roadX + (this.rand() > 0.5 ? 20 : -20) + randRange(this.rand, -3, 3);
    const z = roadZ + randRange(this.rand, -55, 55);
    if (x > 520 || this._insideBuilding(x, z, 5)) continue;
    palms.push({ x, z, s: 0.8 + this.rand() * 0.35 });
  }
  // park palms
  for (let k = 0; k < 10; k++) {
    palms.push({ x: -210 + randRange(this.rand, -42, 42), z: 210 + randRange(this.rand, -42, 42), s: 0.9 + this.rand() * 0.3 });
  }
  this.palms = palms;

  const trunkGeo = new THREE.CylinderGeometry(0.17, 0.38, 7.2, 5);
  trunkGeo.translate(0, 3.6, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7b5c3d, roughness: 0.95 });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, palms.length);

  // Frond geometry: drooping tapered blade along +X
  const seg = 7;
  const pos = [], idx = [], nrm = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const x = t * 4.8;
    const y = 0.35 - t * t * 2.15;
    const w = (1 - t) * 0.72 + 0.06;
    pos.push(x, y, -w, x, y + 0.06, 0, x, y, w);
    nrm.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
  }
  for (let i = 0; i < seg; i++) {
    const a = i * 3, b = (i + 1) * 3;
    idx.push(a, b, a + 2, b, b + 2, a + 2);
    idx.push(a + 1, b + 1, a + 2, b + 1, b + 2, a + 2);
  }
  const frondGeo = new THREE.BufferGeometry();
  frondGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  frondGeo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  frondGeo.setIndex(idx);

  const frondCount = palms.length * 9;
  const fColors = new Float32Array(frondCount * 3);
  const c = new THREE.Color();
  for (let i = 0; i < frondCount; i++) {
    c.setHSL(0.28 + Math.random() * 0.06, 0.42 + Math.random() * 0.18, 0.24 + Math.random() * 0.12);
    c.toArray(fColors, i * 3);
  }
  frondGeo.setAttribute('aColor', new THREE.InstancedBufferAttribute(fColors, 3));
  const frondMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.86, side: THREE.DoubleSide });
  frondMat.onBeforeCompile = (shader) => {
    this.palmShader = shader;
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aColor; varying vec3 vTint; uniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vTint = aColor;
        float sway = sin(uTime * 1.25 + instanceMatrix[3].x * 0.12 + instanceMatrix[3].z * 0.09 + position.x * 0.7);
        transformed.y += sway * 0.07 * position.x;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTint;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vTint;');
  };
  frondMat.customProgramCacheKey = () => 'palm-frond-v1';
  const fronds = new THREE.InstancedMesh(frondGeo, frondMat, frondCount);

  const cocoGeo = new THREE.SphereGeometry(0.19, 5, 4);
  const cocoMat = new THREE.MeshStandardMaterial({ color: 0x5b4428, roughness: 0.9 });
  const cocos = new THREE.InstancedMesh(cocoGeo, cocoMat, palms.length * 3);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  let fi = 0, ci = 0;
  palms.forEach((p, i) => {
    q.setFromEuler(new THREE.Euler(randRange(this.rand, -0.05, 0.05), this.rand() * Math.PI * 2, randRange(this.rand, -0.06, 0.06)));
    s.set(p.s, p.s, p.s);
    m.compose(new THREE.Vector3(p.x, 0, p.z), q, s);
    trunks.setMatrixAt(i, m);
    const topY = 7.1 * p.s;
    for (let f = 0; f < 9; f++) {
      const ang = (f / 9) * Math.PI * 2 + this.rand() * 0.3;
      const tilt = randRange(this.rand, -0.2, 0.12);
      const qq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ang, tilt, 'YZX'));
      const ss = new THREE.Vector3(p.s * randRange(this.rand, 0.8, 1.08), p.s, p.s * randRange(this.rand, 0.8, 1.08));
      m.compose(new THREE.Vector3(p.x, topY, p.z), qq, ss);
      fronds.setMatrixAt(fi++, m);
    }
    for (let cc = 0; cc < 3; cc++) {
      const a = this.rand() * Math.PI * 2;
      m.makeTranslation(p.x + Math.cos(a) * 0.35, topY - 0.22, p.z + Math.sin(a) * 0.35);
      cocos.setMatrixAt(ci++, m);
    }
  });
  trunks.instanceMatrix.needsUpdate = true;
  fronds.instanceMatrix.needsUpdate = true;
  cocos.instanceMatrix.needsUpdate = true;
  trunks.castShadow = false;
  this.scene.add(trunks, fronds, cocos);

  // Beach umbrellas
  const umbCols = [0xef476f, 0xffd166, 0x2ec4b6, 0xff8a5c, 0xf4f1de];
  const poleGeo = new THREE.CylinderGeometry(0.05, 0.06, 2.3, 4);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xcfc8b4, roughness: 0.8 });
  const canopyGeo = new THREE.ConeGeometry(1.75, 0.55, 9, 1, true);
  const umbrellas = [];
  for (let k = 0; k < 54; k++) {
    const x = randRange(this.rand, 606, 632), z = randRange(this.rand, -940, 940);
    umbrellas.push({ x, z, color: pick(this.rand, umbCols), rot: this.rand() * Math.PI });
  }
  const poles = new THREE.InstancedMesh(poleGeo, poleMat, umbrellas.length);
  umbrellas.forEach((u, i) => {
    m.makeTranslation(u.x, 1.15, u.z);
    poles.setMatrixAt(i, m);
  });
  poles.instanceMatrix.needsUpdate = true;
  this.scene.add(poles);
  for (const col of umbCols) {
    const list = umbrellas.filter(u => u.color === col);
    if (!list.length) continue;
    const cm = new THREE.MeshStandardMaterial({ color: col, roughness: 0.85, side: THREE.DoubleSide });
    const mesh = new THREE.InstancedMesh(canopyGeo, cm, list.length);
    list.forEach((u, i) => {
      q.setFromEuler(new THREE.Euler(0, u.rot, 0));
      m.compose(new THREE.Vector3(u.x, 2.3, u.z), q, new THREE.Vector3(1, 1, 1));
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    this.scene.add(mesh);
  }

  // Towels
  const towelGeo = new THREE.PlaneGeometry(1.9, 0.95);
  towelGeo.rotateX(-Math.PI / 2);
  const towelCols = [0x2ec4b6, 0xff7a59, 0xffd166, 0xef476f, 0x7bd389];
  for (const col of towelCols) {
    const count = 7;
    const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.95, side: THREE.DoubleSide });
    const mesh = new THREE.InstancedMesh(towelGeo, mat, count);
    for (let i = 0; i < count; i++) {
      const x = randRange(this.rand, 612, 632), z = randRange(this.rand, -900, 900);
      q.setFromEuler(new THREE.Euler(0, this.rand() * Math.PI, 0));
      m.compose(new THREE.Vector3(x, 0.055, z), q, new THREE.Vector3(1, 1, 1));
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    this.scene.add(mesh);
  }

  // Park trees, paths, pond, fountain, benches
  this._buildPark();

  // Promenade benches
  const benchPositions = [];
  for (let z = -860; z <= 860; z += 74) benchPositions.push([586, z, 0]);
  for (let z = -820; z <= 820; z += 96) benchPositions.push([614, z, Math.PI]);
  const seatGeo = new THREE.BoxGeometry(2.8, 0.14, 0.62);
  const backGeo = new THREE.BoxGeometry(2.8, 0.62, 0.12);
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x7b5c3d, roughness: 0.9 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x343d40, roughness: 0.6, metalness: 0.4 });
  const seats = new THREE.InstancedMesh(seatGeo, benchMat, benchPositions.length);
  const backs = new THREE.InstancedMesh(backGeo, benchMat, benchPositions.length);
  benchPositions.forEach((b, i) => {
    q.setFromEuler(new THREE.Euler(0, b[2], 0));
    m.compose(new THREE.Vector3(b[0], 0.55, b[1]), q, new THREE.Vector3(1, 1, 1));
    seats.setMatrixAt(i, m);
    m.compose(new THREE.Vector3(b[0], 0.9, b[1] + (b[2] ? 0.28 : -0.28)), q, new THREE.Vector3(1, 1, 1));
    backs.setMatrixAt(i, m);
  });
  seats.instanceMatrix.needsUpdate = true;
  backs.instanceMatrix.needsUpdate = true;
  this.scene.add(seats, backs);
};

World.prototype._buildPark = function () {
  const cx = -210, cz = 210;
  // Paths
  const pathMat = new THREE.MeshStandardMaterial({ color: 0xc3b28c, roughness: 0.95 });
  const p1 = new THREE.Mesh(new THREE.PlaneGeometry(9, 96), pathMat);
  p1.rotation.x = -Math.PI / 2; p1.position.set(cx, 0.045, cz); this.scene.add(p1);
  const p2 = new THREE.Mesh(new THREE.PlaneGeometry(96, 9), pathMat);
  p2.rotation.x = -Math.PI / 2; p2.position.set(cx, 0.046, cz); this.scene.add(p2);

  // Pond
  const pond = new THREE.Mesh(
    new THREE.CircleGeometry(16, 32),
    new THREE.MeshStandardMaterial({ color: 0x1e7d83, roughness: 0.15, metalness: 0.25, emissive: 0x08363d, emissiveIntensity: 0.3 })
  );
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(cx + 22, 0.06, cz - 22);
  this.scene.add(pond);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(16.4, 0.55, 6, 40), new THREE.MeshStandardMaterial({ color: 0x9a9482, roughness: 0.9 }));
  rim.rotation.x = -Math.PI / 2; rim.position.set(cx + 22, 0.12, cz - 22); this.scene.add(rim);

  // Fountain
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.8, 0.9, 24), new THREE.MeshStandardMaterial({ color: 0xb5ac97, roughness: 0.85 }));
  basin.position.set(cx - 24, 0.45, cz + 24); this.scene.add(basin);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(4.9, 4.9, 0.12, 24), new THREE.MeshStandardMaterial({ color: 0x3fd2d0, roughness: 0.15, metalness: 0.3 }));
  water.position.set(cx - 24, 0.94, cz + 24); this.scene.add(water);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.8, 4.6, 10), new THREE.MeshStandardMaterial({ color: 0xc7bda6, roughness: 0.8 }));
  col.position.set(cx - 24, 3.1, cz + 24); this.scene.add(col);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd9cbb2, roughness: 0.7 }));
  top.position.set(cx - 24, 5.5, cz + 24); this.scene.add(top);
  this._addCollider(cx - 24, cz + 24, 11, 11, 5, 'prop');
  this._addCollider(cx + 22, cz - 22, 33, 33, 1.2, 'pond');

  // Park trees
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.28, 3.2, 5);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4c32, roughness: 0.95 });
  const canopyGeo = new THREE.IcosahedronGeometry(2.3, 1);
  const positions = [];
  for (let i = 0; i < 34; i++) {
    const x = cx + randRange(this.rand, -46, 46), z = cz + randRange(this.rand, -46, 46);
    if (Math.abs(x - cx) < 8 || Math.abs(z - cz) < 8) continue;
    if (Math.hypot(x - (cx + 22), z - (cz - 22)) < 20) continue;
    if (Math.hypot(x - (cx - 24), z - (cz + 24)) < 9) continue;
    positions.push({ x, z, s: 0.8 + this.rand() * 0.7 });
  }
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, positions.length);
  const canopies = new THREE.InstancedMesh(canopyGeo, new THREE.MeshStandardMaterial({ color: 0x3f7345, roughness: 0.9, flatShading: true }), positions.length);
  const m = new THREE.Matrix4();
  positions.forEach((p, i) => {
    m.makeTranslation(p.x, 1.6, p.z); trunks.setMatrixAt(i, m);
    m.makeScale(p.s, p.s * (0.8 + Math.random() * 0.3), p.s);
    m.setPosition(p.x, 4.2 * p.s, p.z);
    canopies.setMatrixAt(i, m);
    this._addCollider(p.x, p.z, 1.1, 1.1, 3, 'tree');
  });
  trunks.instanceMatrix.needsUpdate = true;
  canopies.instanceMatrix.needsUpdate = true;
  this.scene.add(trunks, canopies);
};

/* ============================================================
   LANDMARKS
   ============================================================ */
World.prototype._insideBuilding = function (x, z, pad = 0) {
  for (const c of this.colliders) {
    if (x > c.minX - pad && x < c.maxX + pad && z > c.minZ - pad && z < c.maxZ + pad) return true;
  }
  return false;
};

World.prototype._makeBoat = function (x, z, rot, color, len = 10) {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.15 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf1eee2, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a272d, roughness: 0.4, metalness: 0.4 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(len, 1.5, len * 0.34), hullMat);
  hull.position.y = 0.35; g.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(len * 0.17, len * 0.32, 4), hullMat);
  bow.rotation.x = Math.PI / 2;
  bow.rotation.z = Math.PI / 4;
  bow.position.set(len * 0.5 + len * 0.1, 0.35, 0);
  bow.scale.y = 0.55; g.add(bow);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(len * 0.92, 0.14, len * 0.32), white);
  deck.position.y = 1.12; g.add(deck);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(len * 0.3, 1.5, len * 0.24), white);
  cabin.position.set(-len * 0.15, 1.9, 0); g.add(cabin);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(len * 0.31, 0.55, len * 0.25), dark);
  glass.position.set(-len * 0.13, 2.2, 0); g.add(glass);
  const motor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 1.0), dark);
  motor.position.set(-len * 0.55, 0.55, 0); g.add(motor);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 4), dark);
  mast.position.set(-len * 0.02, 3.1, 0); g.add(mast);
  g.position.set(x, WATER_LEVEL + 0.05, z);
  g.rotation.y = rot;
  this.scene.add(g);
  this.boats = this.boats || [];
  this.boats.push({ g, baseY: WATER_LEVEL + 0.05, phase: Math.random() * 6.28 });
  return g;
};

World.prototype._buildLandmarks = function () {
  this.boats = [];
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x2c373c, roughness: 0.5, metalness: 0.55 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x9a7248, roughness: 0.9 });

  // --- Beach kiosks ---
  const kioskSign = makeTextTexture([{ text: 'ÁGUA DE COCO', size: 54 }, { text: 'PETISCOS · GELO · SOL', size: 24, color: '#ffe4ae' }], { w: 512, h: 180, bg: '#12333a', accent: '#ffc46b' });
  for (const z of [-300, -64, 120, 336]) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(8.6, 3.1, 6.2), new THREE.MeshStandardMaterial({ color: 0xd8c7a4, roughness: 0.9 }));
    base.position.y = 1.55; g.add(base);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 7.6), new THREE.MeshStandardMaterial({ color: 0xb8453a, roughness: 0.8 }));
    roof.position.y = 3.35; g.add(roof);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(9, 0.16, 1.2), wood);
    counter.position.set(0, 1.45, 3.1); g.add(counter);
    const awning = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.12, 2.6), new THREE.MeshStandardMaterial({ color: 0x2ec4b6, roughness: 0.8 }));
    awning.position.set(0, 2.9, 3.4); awning.rotation.x = 0.14; g.add(awning);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.0), new THREE.MeshStandardMaterial({ map: kioskSign, roughness: 0.7, emissive: 0xffffff, emissiveMap: kioskSign, emissiveIntensity: 0.2 }));
    sign.position.set(0, 4.25, 3.8); sign.rotation.y = Math.PI; g.add(sign);
    for (let s = 0; s < 3; s++) {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.65, 8), wood);
      stool.position.set(-2.4 + s * 2.4, 0.32, 4.4); g.add(stool);
    }
    g.position.set(600, 0, z);
    g.rotation.y = Math.PI / 2;
    this.scene.add(g);
    this._addCollider(600, z, 8.8, 6.4, 4.2, 'kiosk');
  }

  // --- Beach arch sign at promenade ---
  {
    const g = new THREE.Group();
    const pMat = new THREE.MeshStandardMaterial({ color: 0x2c373c, roughness: 0.55, metalness: 0.4 });
    for (const off of [-6.4, 6.4]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 8.5, 6), pMat);
      p.position.set(0, 4.25, off); g.add(p);
    }
    const tex = makeTextTexture([{ text: 'ORLA DOURADA', size: 90 }], { w: 768, h: 170, bg: '#08191f', accent: '#ffc46b' });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(13.6, 3.0), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25 }));
    sign.position.set(0, 7.2, 0); sign.rotation.y = Math.PI / 2; g.add(sign);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 14), pMat);
    bar.position.y = 8.6; g.add(bar);
    g.position.set(573, 0, -34);
    this.scene.add(g);
  }

  // --- Pier & marina docks ---
  const deckBase = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x5d452d, roughness: 0.95 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x8b6a44, roughness: 0.9 });

  // Procedural deck planks, in both grain directions.
  const makePlanks = (vertical) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const c2 = cv.getContext('2d');
    c2.fillStyle = '#a37a4c'; c2.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 4; i++) {
      const o = i * 32;
      c2.fillStyle = i % 2 ? 'rgba(58,38,20,.16)' : 'rgba(255,235,200,.07)';
      if (vertical) c2.fillRect(o, 0, 32, 128); else c2.fillRect(0, o, 128, 32);
      c2.strokeStyle = 'rgba(52,34,18,.6)'; c2.lineWidth = 2;
      c2.beginPath();
      if (vertical) { c2.moveTo(o, 0); c2.lineTo(o, 128); } else { c2.moveTo(0, o); c2.lineTo(128, o); }
      c2.stroke();
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  };
  const plankV = makePlanks(true), plankH = makePlanks(false);

  const buildDock = (x1, x2, z1, z2, h, railEdges = [], lights = false) => {
    const w = x2 - x1, d = z2 - z1;
    const alongX = w >= d;
    const tex = (alongX ? plankH : plankV).clone();
    tex.needsUpdate = true;
    tex.repeat.set(alongX ? Math.max(1, w / 12) : Math.max(1, w / 2.4), alongX ? Math.max(1, d / 2.4) : Math.max(1, d / 12));
    const deckMat = deckBase.clone();
    deckMat.map = tex;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(w, 0.32, d), deckMat);
    deck.position.set((x1 + x2) / 2, h - 0.16, (z1 + z2) / 2);
    deck.receiveShadow = true;
    this.scene.add(deck);

    // Perimeter piles.
    for (let x = x1 + 3; x < x2; x += 8) {
      for (const z of [z1 + 0.4, z2 - 0.4]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 4.2, 6), postMat);
        post.position.set(x, h - 2.1, z); this.scene.add(post);
      }
    }
    for (let z = z1 + 3; z < z2; z += 8) {
      for (const x of [x1 + 0.4, x2 - 0.4]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 4.2, 6), postMat);
        post.position.set(x, h - 2.1, z); this.scene.add(post);
      }
    }

    // Guard rails only on the edges that meet open water.
    for (const edge of railEdges) {
      const isZ = edge === 'z1' || edge === 'z2';
      const len = isZ ? w : d;
      const cx = isZ ? (x1 + x2) / 2 : (edge === 'x1' ? x1 + 0.2 : x2 - 0.2);
      const cz = isZ ? (edge === 'z1' ? z1 + 0.2 : z2 - 0.2) : (z1 + z2) / 2;
      const rail = new THREE.Mesh(
        isZ ? new THREE.BoxGeometry(len, 0.1, 0.1) : new THREE.BoxGeometry(0.1, 0.1, len),
        railMat
      );
      rail.position.set(cx, h + 0.95, cz); this.scene.add(rail);
      for (let t = 2; t < len; t += 4) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.0, 0.09), railMat);
        p.position.set(isZ ? x1 + t : cx, h + 0.48, isZ ? cz : z1 + t);
        this.scene.add(p);
      }
    }

    if (lights) {
      this.lightString = this.lightString || [];
      for (let x = x1 + 4; x < x2; x += 9) {
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), new THREE.MeshStandardMaterial({ color: 0xfff1c0, emissive: 0xffc46b, emissiveIntensity: 1.2 }));
        bulb.position.set(x, h + 2.1, z1 + 1.2); this.scene.add(bulb);
        this.lightString.push(bulb);
      }
    }
  };

  // Píer do Sol: passarela + praça na ponta.
  buildDock(634, 858, 136, 146, 0.62, ['z1', 'z2'], true);
  buildDock(858, 882, 120, 168, 0.62, ['x2', 'z1', 'z2']);
  // Marina Maré: dock principal + dedos de atracação.
  buildDock(634, 798, 4, 12, 0.55, ['z1', 'z2'], true);
  for (const [fx1, fx2] of [[734, 740], [764, 770], [794, 798]]) {
    buildDock(fx1, fx2, -28, 4, 0.55, ['x1', 'x2']);
    buildDock(fx1, fx2, 12, 44, 0.55, ['x1', 'x2']);
  }

  // Pier arch at the beach entrance
  {
    const tex = makeTextTexture([{ text: 'PÍER DO SOL', size: 80 }, { text: 'SUNSET · DRINKS · MAR', size: 26, color: '#ffd9a1' }], { w: 640, h: 220, bg: '#0d2b34', accent: '#ffc46b' });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.1), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35 }));
    sign.position.set(636, 5.5, 141); sign.rotation.y = -Math.PI / 2; this.scene.add(sign);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.5, 9.4), darkMetal);
    back.position.set(636.2, 5.5, 141); this.scene.add(back);
    for (const off of [-4.5, 4.5]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 6.4, 6), darkMetal);
      p.position.set(636, 3.2, 141 + off); this.scene.add(p);
    }
  }

  // Marina boats, moored in the slips.
  this._makeBoat(752, -10, Math.PI / 2, 0xf1eee2, 10);
  this._makeBoat(782, -14, Math.PI / 2, 0x2ec4b6, 9);
  this._makeBoat(752, 30, Math.PI / 2, 0xff7a59, 9);
  this._makeBoat(782, 32, Math.PI / 2, 0xf1eee2, 11);
  this._makeBoat(824, 208, 0.2, 0xf1eee2, 14);
  this._makeBoat(862, 232, -0.1, 0x2d6e8c, 10);

  // --- Ferris wheel ---
  {
    const g = new THREE.Group();
    const wheel = new THREE.Group();
    wheel.position.y = 23;
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xe9e1cf, roughness: 0.4, metalness: 0.6 });
    for (const zz of [-1.6, 1.6]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(17, 0.32, 8, 48), ringMat);
      ring.position.z = zz; wheel.add(ring);
    }
    const spokeMat = new THREE.MeshStandardMaterial({ color: 0xc9c0ad, roughness: 0.5, metalness: 0.5 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 34, 4), spokeMat);
      spoke.rotation.z = a;
      spoke.position.set(0, 0, 0);
      wheel.add(spoke);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 4.2, 12), darkMetal);
    hub.rotation.x = Math.PI / 2; wheel.add(hub);
    this.gondolas = [];
    const gCols = [0xff6b57, 0xffd166, 0x2ec4b6, 0xef476f, 0x7bd389, 0x5cc8ff];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const gd = new THREE.Group();
      gd.position.set(Math.cos(a) * 17, Math.sin(a) * 17, 0);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.3, 2.0), new THREE.MeshStandardMaterial({ color: gCols[i % gCols.length], roughness: 0.6 }));
      cab.position.y = -1.4; gd.add(cab);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 2.4), new THREE.MeshStandardMaterial({ color: 0xf3ecdb, roughness: 0.6 }));
      roof.position.y = -0.15; gd.add(roof);
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 2.05), new THREE.MeshStandardMaterial({ color: 0x22333a, roughness: 0.2, metalness: 0.4 }));
      win.position.y = -1.2; gd.add(win);
      wheel.add(gd); this.gondolas.push(gd);
    }
    this.wheelGroup = wheel;
    this.wheels.push(wheel);
    g.add(wheel);
    for (const zz of [-3.4, 3.4]) {
      for (const xx of [-7, 7]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 27, 0.8), darkMetal);
        leg.position.set(xx, 12.5, zz);
        leg.rotation.z = xx > 0 ? -0.22 : 0.22;
        g.add(leg);
      }
    }
    const base = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0x8d8574, roughness: 0.9 }));
    base.position.y = 0.6; g.add(base);
    const signTex = makeTextTexture([{ text: 'RODA DO SOL', size: 72 }], { w: 640, h: 140, bg: '#102c39', accent: '#ffc46b' });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.4), new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.3 }));
    sign.position.set(0, 8.5, 6.1); g.add(sign);
    g.position.set(610, 0, 420);
    this.scene.add(g);
    this._addCollider(610, 420, 22, 12, 2, 'prop');
  }

  // --- Lighthouse ---
  {
    const g = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x4b5350, roughness: 0.95, flatShading: true });
    for (let i = 0; i < 8; i++) {
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(randRange(this.rand, 3, 8), 0), rockMat);
      rock.position.set(randRange(this.rand, -13, 13), randRange(this.rand, -1, 2), randRange(this.rand, -13, 13));
      rock.scale.y = randRange(this.rand, 0.5, 1.1);
      g.add(rock);
    }
    const bands = [0xf2eee2, 0xc94a3d, 0xf2eee2, 0xc94a3d];
    let y = 0;
    bands.forEach((c, i) => {
      const r0 = 3.6 - i * 0.45, r1 = 3.15 - i * 0.45;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, 5.4, 14), new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 }));
      band.position.y = y + 2.7; g.add(band); y += 5.4;
    });
    const gallery = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.3, 14), darkMetal);
    gallery.position.y = y + 0.2; g.add(gallery);
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.9, 2.6, 10), new THREE.MeshStandardMaterial({ color: 0xfff4c8, emissive: 0xffcf6a, emissiveIntensity: 1.4, roughness: 0.2 }));
    lantern.position.y = y + 1.7; g.add(lantern);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.8, 12), darkMetal);
    roof.position.y = y + 3.9; g.add(roof);
    const beamGroup = new THREE.Group();
    beamGroup.position.y = y + 1.7;
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(9, 60, 18, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe2a1, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    beam.rotation.z = -Math.PI / 2;
    beam.position.x = 29;
    beamGroup.add(beam);
    g.add(beamGroup);
    this.lighthouseBeam = beamGroup;
    g.position.set(644, this.groundHeight(644, -520), -520);
    this.scene.add(g);
    this._addCollider(644, -520, 10, 10, 24, 'prop');
  }

  // --- Monument ---
  {
    const g = new THREE.Group();
    const gold = new THREE.MeshStandardMaterial({ color: 0xffc46b, roughness: 0.25, metalness: 0.85, emissive: 0x5a340c, emissiveIntensity: 0.25 });
    const stone = new THREE.MeshStandardMaterial({ color: 0xd8cdb6, roughness: 0.85 });
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 0.35, 32), stone);
    plaza.position.y = 0.17; g.add(plaza);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(11.5, 1.15, 12, 48), gold);
    ring.position.y = 17; g.add(ring);
    const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(7.5, 32), new THREE.MeshStandardMaterial({ color: 0xffe0a1, emissive: 0xffb347, emissiveIntensity: 0.55, roughness: 0.3, side: THREE.DoubleSide }));
    sunDisc.position.set(0, 17, 0.4); g.add(sunDisc);
    for (const off of [-11.5, 11.5]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 17, 8), stone);
      col.position.set(0, 8.5, off); g.add(col);
    }
    const tex = makeTextTexture([{ text: 'MIRANTE DO SOL', size: 68 }, { text: 'SANTO MATTEO · FUNDADO 1912', size: 24, color: '#ffe3ad' }], { w: 768, h: 180, bg: '#0c222b', accent: '#ffc46b' });
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.8), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    plaque.position.set(0, 3.2, 12.2); g.add(plaque);
    g.position.set(-906, 0, 0);
    this.scene.add(g);
  }

  // --- Port cranes ---
  for (const cz of [560, 640, 700]) {
    const g = new THREE.Group();
    const yellow = new THREE.MeshStandardMaterial({ color: 0xd99b37, roughness: 0.55, metalness: 0.4 });
    for (const ox of [-7, 7]) for (const oz of [-4, 4]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 26, 0.7), yellow);
      leg.position.set(ox, 13, oz); g.add(leg);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(34, 1.1, 1.2), yellow);
    beam.position.set(0, 26, 0); g.add(beam);
    const beam2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 10), yellow);
    beam2.position.set(9, 25, 0); g.add(beam2);
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 13, 4), darkMetal);
    cable.position.set(9, 18.5, 0); g.add(cable);
    const hook = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 2.2), darkMetal);
    hook.position.set(9, 11.6, 0); g.add(hook);
    g.position.set(-390, 0, cz);
    this.scene.add(g);
  }

  // --- Cargo ship offshore ---
  {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(170, 18, 42), new THREE.MeshStandardMaterial({ color: 0x22343d, roughness: 0.7, metalness: 0.2 }));
    hull.position.y = 3; g.add(hull);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(160, 2, 38), new THREE.MeshStandardMaterial({ color: 0x8e9a98, roughness: 0.8 }));
    deck.position.y = 13; g.add(deck);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(26, 22, 30), new THREE.MeshStandardMaterial({ color: 0xe8e3d6, roughness: 0.7 }));
    tower.position.set(-62, 25, 0); g.add(tower);
    const win = new THREE.Mesh(new THREE.BoxGeometry(27, 2, 31), new THREE.MeshStandardMaterial({ color: 0x182a32, roughness: 0.2, metalness: 0.4 }));
    win.position.set(-62, 30, 0); g.add(win);
    const cCols = [0xb8453a, 0x2d6e8c, 0x3d7a52, 0xc08a32, 0x7b5a8c];
    for (let i = 0; i < 18; i++) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(11, 5, 8), new THREE.MeshStandardMaterial({ color: cCols[i % cCols.length], roughness: 0.7 }));
      col.position.set(-35 + (i % 9) * 12, 16.5, i < 9 ? -9 : 9);
      g.add(col);
    }
    g.position.set(1080, -3, 620);
    g.rotation.y = 0.12;
    this.scene.add(g);
  }

  // --- Lifeguard towers ---
  for (const [x, z] of [[636, -280], [642, 330]]) {
    const g = new THREE.Group();
    const pMat = new THREE.MeshStandardMaterial({ color: 0xd8c7a4, roughness: 0.9 });
    for (const ox of [-1.6, 1.6]) for (const oz of [-1.6, 1.6]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.4, 0.22), pMat);
      p.position.set(ox, 1.7, oz); g.add(p);
    }
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 4.2), new THREE.MeshStandardMaterial({ color: 0xff7a59, roughness: 0.8 }));
    cabin.position.y = 4.4; g.add(cabin);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 1.4, 4), new THREE.MeshStandardMaterial({ color: 0xf2eee2, roughness: 0.8 }));
    roof.position.y = 6.4; roof.rotation.y = Math.PI / 4; g.add(roof);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.0, 4.25), new THREE.MeshStandardMaterial({ color: 0x22333a, roughness: 0.2 }));
    glass.position.y = 4.8; g.add(glass);
    g.position.set(x, this.groundHeight(x, z), z);
    this.scene.add(g);
    this._addCollider(x, z, 4.4, 4.4, 6.5, 'prop');
  }

  // --- Volleyball nets ---
  for (const [x, z] of [[628, 30], [628, -160]]) {
    const g = new THREE.Group();
    for (const off of [-5, 5]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.2, 5), darkMetal);
      p.position.set(off, 1.6, 0); g.add(p);
    }
    const net = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.4), new THREE.MeshBasicMaterial({ color: 0xf4f1e6, wireframe: true, transparent: true, opacity: 0.55 }));
    net.position.set(0, 2.3, 0); g.add(net);
    g.position.set(x, 0, z);
    this.scene.add(g);
  }
};

/* ============================================================
   MOUNTAINS & DISTANT SCENERY
   ============================================================ */
World.prototype._buildMountains = function () {
  const hillMats = [
    new THREE.MeshStandardMaterial({ color: 0x40583e, roughness: 1, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x4d6244, roughness: 1, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x5b6a4d, roughness: 1, flatShading: true })
  ];
  const hills = [
    { x: -1240, z: -460, r: 330, h: 230, m: 0 },
    { x: -1180, z: 560, r: 280, h: 180, m: 1 },
    { x: -900, z: -1060, r: 300, h: 200, m: 2 },
    { x: 120, z: -1260, r: 340, h: 170, m: 1 },
    { x: 900, z: -1160, r: 280, h: 140, m: 2 },
    { x: -1450, z: 80, r: 360, h: 290, m: 0 }
  ];
  // Break up the perfect cone silhouettes with deterministic vertex noise.
  const roughen = (geo, amp, seed) => {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const n = Math.sin(a * 3.1 + seed) * 0.5
              + Math.sin(a * 7.3 - seed * 1.7 + y * 0.03) * 0.3
              + Math.sin(y * 0.09 + seed) * 0.2;
      pos.setXYZ(i, x * (1 + n * amp), y + Math.sin(a * 5 + seed) * amp * y * 0.4, z * (1 + n * amp));
    }
    geo.computeVertexNormals();
    return geo;
  };
  for (const h of hills) {
    const geo = roughen(new THREE.ConeGeometry(h.r, h.h, 11, 3), 0.13, h.x * 0.01 + h.z * 0.02);
    const mesh = new THREE.Mesh(geo, hillMats[h.m]);
    mesh.position.set(h.x, h.h / 2 - 8, h.z);
    mesh.rotation.y = this.rand() * Math.PI;
    this.scene.add(mesh);
  }

  // Granite peaks rising from the sea (original "Pico do Matteo").
  const granite = new THREE.MeshStandardMaterial({ color: 0x7d8378, roughness: 0.95, flatShading: true });
  const peakGeo = (r, h, seed) => {
    const pts = [];
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const profile = Math.sqrt(Math.max(0, 1 - t * t)) * (0.94 + 0.06 * Math.sin(t * Math.PI));
      pts.push(new THREE.Vector2(Math.max(0.001, r * profile), t * h));
    }
    const geo = new THREE.LatheGeometry(pts, 20);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const n = Math.sin(a * 3.4 + seed) * 0.55
              + Math.sin(a * 8.1 - seed * 1.9 + y * 0.035) * 0.3
              + Math.sin(y * 0.08 + seed) * 0.15;
      const k = 1 + n * 0.11;
      pos.setXYZ(i, x * k, y, z * k);
    }
    geo.computeVertexNormals();
    return geo;
  };
  const peak = new THREE.Mesh(peakGeo(132, 244, 1.7), granite);
  peak.position.set(1320, -8, -480);
  this.scene.add(peak);
  const peak2 = new THREE.Mesh(peakGeo(74, 142, 4.3), granite);
  peak2.position.set(1450, -8, -390);
  this.scene.add(peak2);
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x35583c, roughness: 1, flatShading: true });
  const skirt = new THREE.Mesh(peakGeo(146, 78, 2.6), greenMat);
  skirt.position.set(1320, -8, -480);
  this.scene.add(skirt);
  const skirt2 = new THREE.Mesh(peakGeo(84, 48, 5.1), greenMat);
  skirt2.position.set(1450, -8, -390);
  this.scene.add(skirt2);

  // Hillside sign
  const tex = makeTextTexture([{ text: 'MATTEO 5', size: 116 }, { text: 'SANTO MATTEO · BRASIL', size: 30, color: '#ffe3ad' }], { w: 1024, h: 300, bg: '#102018', accent: '#ffc46b', border: false });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(250, 73), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.18 }));
  sign.position.set(-1035, 128, -540);
  sign.rotation.y = Math.PI / 2;
  sign.rotation.z = -0.06;
  this.scene.add(sign);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 76, 254), new THREE.MeshStandardMaterial({ color: 0x1a221c, roughness: 1 }));
  back.position.set(-1037, 128, -540);
  this.scene.add(back);

  // Favela hill backdrop with tiny houses
  const hill = new THREE.Mesh(new THREE.ConeGeometry(260, 150, 8, 1), hillMats[0]);
  hill.position.set(-980, 67, -720);
  this.scene.add(hill);
  const houseGeo = new THREE.BoxGeometry(1, 1, 1);
  const houseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const hc = new Float32Array(50 * 3);
  const col = new THREE.Color();
  for (let i = 0; i < 50; i++) {
    col.set(pick(this.rand, ['#ef476f', '#ffd166', '#2ec4b6', '#f4f1de', '#f78c6b', '#7bd389']));
    col.toArray(hc, i * 3);
  }
  houseGeo.setAttribute('aColor', new THREE.InstancedBufferAttribute(hc, 3));
  houseMat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aColor; varying vec3 vTint;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTint = aColor;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTint;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vTint;');
  };
  houseMat.customProgramCacheKey = () => 'hill-house-tint';
  const houses = new THREE.InstancedMesh(houseGeo, houseMat, 50);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 50; i++) {
    const a = this.rand() * Math.PI * 2;
    const rr = 90 + this.rand() * 150;
    const x = -980 + Math.cos(a) * rr;
    const z = -720 + Math.sin(a) * rr;
    const hh = 4 + this.rand() * 5;
    m.makeScale(7 + this.rand() * 6, hh, 7 + this.rand() * 5);
    m.setPosition(x, 30 + this.rand() * 65 + hh / 2, z);
    houses.setMatrixAt(i, m);
  }
  houses.instanceMatrix.needsUpdate = true;
  this.scene.add(houses);

  // A few distant sailboats
  for (let i = 0; i < 6; i++) {
    const x = 950 + this.rand() * 700, z = -700 + this.rand() * 1400;
    const b = new THREE.Mesh(new THREE.BoxGeometry(7, 1.2, 2.4), new THREE.MeshStandardMaterial({ color: 0xf1eee2, roughness: 0.6 }));
    b.position.set(x, WATER_LEVEL + 0.2, z); this.scene.add(b);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 5.4), new THREE.MeshBasicMaterial({ color: 0xf6f3e8, side: THREE.DoubleSide }));
    sail.position.set(x, WATER_LEVEL + 3.2, z); sail.rotation.y = 0.6; this.scene.add(sail);
  }
};

/* ============================================================
   MAP
   ============================================================ */
World.prototype._buildMap = function () {
  const c = this.mapCanvas, g = c.getContext('2d');
  const W = c.width, H = c.height;
  const mx = x => (x + 1000) / 2000 * W;
  const mz = z => (z + 1000) / 2000 * H;
  g.clearRect(0, 0, W, H);

  // Ocean
  const ocean = g.createLinearGradient(0, 0, W, H);
  ocean.addColorStop(0, '#0a2a38');
  ocean.addColorStop(0.55, '#0c3b49');
  ocean.addColorStop(1, '#08202c');
  g.fillStyle = ocean; g.fillRect(0, 0, W, H);

  // Subtle water contours
  g.strokeStyle = 'rgba(120,220,220,.06)';
  g.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    g.beginPath();
    for (let x = mx(SHORE_X); x <= W; x += 22) {
      const y = 300 + i * 130 + Math.sin(x * 0.02 + i) * 16;
      if (x === mx(SHORE_X)) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }

  // Land
  g.fillStyle = '#1b2a26';
  g.fillRect(0, 0, mx(SHORE_X), H);
  // Beach
  g.fillStyle = '#8d7a55';
  g.fillRect(mx(570), 0, mx(SHORE_X) - mx(570), H);
  g.fillStyle = '#b39a68';
  g.fillRect(mx(596), 0, mx(SHORE_X) - mx(596), H);
  // Beach hatching
  g.save();
  g.beginPath(); g.rect(mx(596), 0, mx(SHORE_X) - mx(596), H); g.clip();
  g.strokeStyle = 'rgba(92,70,40,.22)'; g.lineWidth = 1.5;
  for (let y = -W; y < H + W; y += 11) {
    g.beginPath(); g.moveTo(mx(596), y); g.lineTo(mx(SHORE_X), y + (mx(SHORE_X) - mx(596))); g.stroke();
  }
  g.restore();
  // Coastline glow
  g.strokeStyle = 'rgba(125,251,227,.5)'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(mx(SHORE_X), 0); g.lineTo(mx(SHORE_X), H); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(mx(SHORE_X), 0); g.lineTo(mx(SHORE_X), H); g.stroke();

  // District tints
  const tint = (x1, z1, x2, z2, color) => {
    g.fillStyle = color;
    g.fillRect(mx(x1), mz(z1), mx(x2) - mx(x1), mz(z2) - mz(z1));
  };
  tint(-980, -980, -420, -140, 'rgba(154,84,68,.20)');
  tint(-420, 420, 280, 760, 'rgba(130,148,144,.17)');
  tint(-420, -280, 280, 420, 'rgba(184,150,94,.14)');
  tint(420, -980, 570, 980, 'rgba(210,176,118,.10)');
  tint(-980, -980, 570, -700, 'rgba(110,150,104,.10)');
  tint(-280, 140, -140, 280, 'rgba(80,150,88,.34)');

  // Park details
  g.fillStyle = '#31543a';
  g.fillRect(mx(-268), mz(152), mx(-152) - mx(-268), mz(268) - mz(152));
  g.fillStyle = '#1d6f78';
  g.beginPath(); g.arc(mx(-188), mz(188), 16, 0, Math.PI * 2); g.fill();

  // Roads — dark casing + lighter asphalt for a readable GTA-style map.
  g.lineCap = 'butt';
  g.strokeStyle = '#26343a';
  g.lineWidth = 15;
  for (const x of ROADS_X) {
    g.beginPath(); g.moveTo(mx(x), mz(-860)); g.lineTo(mx(x), mz(720)); g.stroke();
  }
  for (const z of ROADS_Z) {
    g.beginPath(); g.moveTo(mx(-860), mz(z)); g.lineTo(mx(573), mz(z)); g.stroke();
  }
  g.strokeStyle = '#7b8a82';
  g.lineWidth = 10;
  for (const x of ROADS_X) {
    g.beginPath(); g.moveTo(mx(x), mz(-860)); g.lineTo(mx(x), mz(720)); g.stroke();
  }
  for (const z of ROADS_Z) {
    g.beginPath(); g.moveTo(mx(-860), mz(z)); g.lineTo(mx(573), mz(z)); g.stroke();
  }
  // Major avenues
  g.strokeStyle = '#3a3a30';
  g.lineWidth = 20;
  for (const x of [0, -280, 280, 560]) {
    g.beginPath(); g.moveTo(mx(x), mz(-860)); g.lineTo(mx(x), mz(720)); g.stroke();
  }
  g.beginPath(); g.moveTo(mx(-860), mz(0)); g.lineTo(mx(573), mz(0)); g.stroke();
  g.strokeStyle = '#c2b184';
  g.lineWidth = 14;
  for (const x of [0, -280, 280, 560]) {
    g.beginPath(); g.moveTo(mx(x), mz(-860)); g.lineTo(mx(x), mz(720)); g.stroke();
  }
  g.beginPath(); g.moveTo(mx(-860), mz(0)); g.lineTo(mx(573), mz(0)); g.stroke();
  g.save();
  g.setLineDash([12, 14]);
  g.strokeStyle = 'rgba(255,244,205,.55)';
  g.lineWidth = 2;
  for (const x of [0, -280, 280, 560]) {
    g.beginPath(); g.moveTo(mx(x), mz(-860)); g.lineTo(mx(x), mz(720)); g.stroke();
  }
  g.beginPath(); g.moveTo(mx(-860), mz(0)); g.lineTo(mx(573), mz(0)); g.stroke();
  g.restore();

  // Docks
  g.fillStyle = '#7b5f3c';
  for (const d of this.docks) {
    g.fillRect(mx(d.x1), mz(d.z1), Math.max(1.5, mx(d.x2) - mx(d.x1)), Math.max(1.5, mz(d.z2) - mz(d.z1)));
  }

  // Buildings
  const districtColor = (x, z) => {
    if (x > 570) return '#6b5b3f';
    if (x < -420 && z < -140) return '#b26a56';
    if (z > 420 && x < 280) return '#5d6d69';
    if (x > 420) return '#a08a62';
    if (x > -420 && z > -280 && z < 420) return '#8c8268';
    return '#5f6b5d';
  };
  for (const b of this.buildings) {
    const h = Math.min(1, b.h / 120);
    const base = districtColor(b.x, b.z);
    g.fillStyle = base;
    g.globalAlpha = 0.5 + h * 0.45;
    const x = mx(b.x - b.w / 2), z = mz(b.z - b.d / 2);
    const w = mx(b.x + b.w / 2) - x, d = mz(b.z + b.d / 2) - z;
    g.fillRect(x, z, Math.max(1, w), Math.max(1, d));
    if (b.h > 45) {
      g.globalAlpha = 0.18;
      g.fillStyle = '#fff1cc';
      g.fillRect(x + 1, z + 1, Math.max(1, w - 2), Math.max(1, d - 2));
    }
  }
  g.globalAlpha = 1;

  // District labels
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const d of DISTRICTS) {
    g.font = d.id === 'marina' ? '700 20px "Barlow Condensed", Arial, sans-serif' : '800 24px "Barlow Condensed", Arial, sans-serif';
    g.lineWidth = 5;
    g.strokeStyle = 'rgba(3,10,14,.72)';
    g.strokeText(d.name, mx(d.x), mz(d.z));
    g.fillStyle = d.id === 'marina' ? 'rgba(190,235,238,.8)' : 'rgba(255,226,173,.9)';
    g.fillText(d.name, mx(d.x), mz(d.z));
  }

  // Landmark dots
  const lm = [LANDMARKS.pier, LANDMARKS.marina, LANDMARKS.monument, LANDMARKS.park, LANDMARKS.hospital, LANDMARKS.casino];
  for (const p of lm) {
    g.beginPath(); g.arc(mx(p.x), mz(p.z), 5, 0, Math.PI * 2);
    g.fillStyle = '#ffd27a'; g.fill();
    g.strokeStyle = '#0a1a20'; g.lineWidth = 2; g.stroke();
  }

  // Grid
  g.strokeStyle = 'rgba(255,255,255,.035)';
  g.lineWidth = 1;
  for (let v = -1000; v <= 1000; v += 200) {
    g.beginPath(); g.moveTo(mx(v), 0); g.lineTo(mx(v), H); g.stroke();
    g.beginPath(); g.moveTo(0, mz(v)); g.lineTo(W, mz(v)); g.stroke();
  }

  // Frame
  g.strokeStyle = 'rgba(255,196,107,.35)';
  g.lineWidth = 6;
  g.strokeRect(3, 3, W - 6, H - 6);

  // Compass rose
  g.save();
  g.translate(W - 110, 110);
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2;
  g.beginPath(); g.arc(0, 0, 44, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#ffc46b';
  g.beginPath(); g.moveTo(0, -48); g.lineTo(11, 6); g.lineTo(0, 0); g.lineTo(-11, 6); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.6)';
  g.font = '700 18px "Barlow Condensed", Arial'; g.fillText('N', 0, -58);
  g.restore();

  // Scale
  g.fillStyle = 'rgba(255,255,255,.55)';
  g.fillRect(60, H - 64, 110, 3);
  g.font = '600 16px Manrope, Arial';
  g.textAlign = 'left';
  g.fillText('500 m', 60, H - 78);
  g.textAlign = 'center';
  g.font = '800 34px "Barlow Condensed", Arial';
  g.fillStyle = 'rgba(255,196,107,.5)';
  g.fillText('SANTO MATTEO', W / 2, H - 46);
};

/* ============================================================
   COLLISION / QUERIES
   ============================================================ */
World.prototype._nearColliders = function (x, z) {
  const cs = 80;
  const i = Math.floor(x / cs), j = Math.floor(z / cs);
  const out = [];
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
    const arr = this.colliderGrid.get((i + a) + ':' + (j + b));
    if (arr) for (const c of arr) out.push(c);
  }
  return out;
};

World.prototype.resolveCircle = function (x, z, r = 0.42) {
  let hit = false;
  const near = this._nearColliders(x, z);
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    for (const c of near) {
      const nx = clamp(x, c.minX, c.maxX);
      const nz = clamp(z, c.minZ, c.maxZ);
      let dx = x - nx, dz = z - nz;
      let d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        hit = true; moved = true;
        if (d2 > 1e-7) {
          const d = Math.sqrt(d2);
          const push = (r - d) + 0.001;
          x += dx / d * push;
          z += dz / d * push;
        } else {
          const dl = x - c.minX, dr = c.maxX - x, dt = z - c.minZ, db = c.maxZ - z;
          const mn = Math.min(dl, dr, dt, db);
          if (mn === dl) x = c.minX - r;
          else if (mn === dr) x = c.maxX + r;
          else if (mn === dt) z = c.minZ - r;
          else z = c.maxZ + r;
        }
      }
    }
    if (!moved) break;
  }
  x = clamp(x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
  z = clamp(z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);
  return { x, z, hit };
};

World.prototype.pointBlocked = function (x, y, z, margin = 0.25) {
  if (y < 0.12) return true;
  const near = this._nearColliders(x, z);
  for (const c of near) {
    if (c.type === 'pond') continue;
    if (x > c.minX - margin && x < c.maxX + margin && z > c.minZ - margin && z < c.maxZ + margin && y < c.h + margin) return true;
  }
  return false;
};

World.prototype.cameraCollision = function (from, to) {
  const steps = 18;
  const p = new THREE.Vector3();
  let last = from.clone();
  for (let i = 1; i <= steps; i++) {
    p.lerpVectors(from, to, i / steps);
    if (this.pointBlocked(p.x, p.y, p.z, 0.3)) {
      return last.clone().lerp(to, Math.max(0, (i - 1.5) / steps));
    }
    last.copy(p);
  }
  return to;
};

World.prototype.groundHeight = function (x, z) {
  for (const d of this.docks) {
    if (x > d.x1 && x < d.x2 && z > d.z1 && z < d.z2) return d.h;
  }
  if (x > SHORE_X) return WATER_LEVEL;
  // Wet-sand ramp from the dry beach down to the waterline.
  if (x > 634) return 0.02 - (x - 634) * (0.52 / 16);
  return 0;
};

World.prototype.isWater = function (x, z) {
  if (x <= SHORE_X) return false;
  for (const d of this.docks) {
    if (x > d.x1 && x < d.x2 && z > d.z1 && z < d.z2) return false;
  }
  return true;
};

World.prototype.districtAt = function (x, z) {
  if (x > SHORE_X) return 'MARINA MARÉ';
  if (x > 560) return 'ORLA DE MATTEO';
  if (x < -840) return 'MIRANTE DO SOL';
  if (x < -420 && z < -140) return 'MORRO DA LUA';
  if (z > 420 && x < 280) return 'PORTO VELHO';
  if (x > 420) return 'ORLA DE MATTEO';
  if (x > -280 && x < -140 && z > 140 && z < 280) return 'PARQUE AURORA';
  if (x > -420 && x < 280 && z > -280 && z < 420) return 'CENTRO DOURADO';
  return 'JARDIM DAS PALMEIRAS';
};

World.prototype.nearestRoad = function (x, z) {
  let best = { x, z, axis: 'x', dist: Infinity };
  for (const rx of ROADS_X) {
    const d = Math.abs(x - rx);
    if (d < best.dist) best = { x: rx, z, axis: 'x', dist: d, road: rx };
  }
  for (const rz of ROADS_Z) {
    const d = Math.abs(z - rz);
    if (d < best.dist) best = { x, z: rz, axis: 'z', dist: d, road: rz };
  }
  return best;
};

World.prototype.randomRoadPoint = function (rng = Math.random) {
  if (rng() > 0.5) {
    const x = ROADS_X[Math.floor(rng() * ROADS_X.length)];
    return { x, z: randRange(rng, -800, 660), axis: 'x' };
  }
  const z = ROADS_Z[Math.floor(rng() * ROADS_Z.length)];
  return { x: randRange(rng, -800, 540), z, axis: 'z' };
};

World.prototype.setWaterQuality = function (q) {
  if (!this.water) return;
  const seg = q === 'high' ? 220 : q === 'low' ? 72 : 144;
  this.water.geometry.dispose();
  const geo = new THREE.PlaneGeometry(2500, 2600, seg, seg);
  geo.rotateX(-Math.PI / 2);
  this.water.geometry = geo;
  if (this.waterUniforms && this.waterUniforms.uDetail) {
    this.waterUniforms.uDetail.value = q === 'low' ? 0.85 : 1.0;
  }
};

/* ============================================================
   UPDATE WRAPPER
   ============================================================ */
const _worldBaseUpdate = World.prototype.update;
World.prototype.update = function (dt, camera, playerPos) {
  _worldBaseUpdate.call(this, dt, camera, playerPos);
  if (this.palmShader && this.palmShader.uniforms.uTime) this.palmShader.uniforms.uTime.value = this.time;
  if (this.boats) {
    for (const b of this.boats) {
      b.g.position.y = b.baseY + Math.sin(this.time * 0.75 + b.phase) * 0.07;
      b.g.rotation.z = Math.sin(this.time * 0.55 + b.phase) * 0.012;
    }
  }
  if (this.lightString && this.tod === 'night') {
    const f = 0.85 + Math.sin(this.time * 3.1) * 0.15;
    for (const b of this.lightString) b.material.emissiveIntensity = f * 1.4;
  }
};
