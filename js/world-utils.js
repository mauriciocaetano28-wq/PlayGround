import * as THREE from 'three';
import { mergeGeometries } from '../vendor/BufferGeometryUtils.js';

export { THREE, mergeGeometries };

export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const COLORS = {
  asphalt: 0x15181c, asphaltWet: 0x0d1116, sidewalk: 0x8a8b86, sidewalkDark: 0x626663,
  concrete: 0xb6b1a5, concreteDark: 0x77746d, white: 0xece9df, yellow: 0xffcf38,
  favela: [0xff5b9e, 0x39c8ff, 0x63e36b, 0xffd53d, 0xff8a3d, 0xa35cff, 0x44e0c0, 0xf4f1e7],
  car: [0xe8e8e8, 0x1b1b1f, 0xb51f2b, 0x1b4f9e, 0xdedede, 0x3e6b3c, 0xffc72c, 0xed7b22, 0x6c2f8c, 0x2c8c9e, 0x7d7d7d, 0x8e2a20],
  skin: [0x7a4a2b, 0x9b6238, 0xb47b4f, 0xd9a273, 0x6a3d24, 0xc78a5b],
  shirt: [0xf3f3f3, 0x1a1a1a, 0xe23a44, 0x2b64c9, 0xffcf33, 0x3aa65a, 0xff7f27, 0x9b42d4, 0x36c8c8, 0xeeeeee],
  pants: [0x1a2848, 0x222222, 0x4b3a2a, 0x31445f, 0x7a7a7a, 0x234b35],
};

export function textTexture(text, opts = {}) {
  const {
    width = 512, height = 160, bg = 'rgba(0,0,0,0)', color = '#ffffff', font = 'bold 62px Arial',
    border = null, sub = null, subColor = '#dceaff', align = 'center', lines = 1
  } = opts;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const g = c.getContext('2d');
  if (bg !== 'transparent') { g.fillStyle = bg; g.fillRect(0, 0, width, height); }
  if (border) {
    g.strokeStyle = border; g.lineWidth = 8; g.strokeRect(4, 4, width - 8, height - 8);
  }
  g.fillStyle = color;
  g.font = font;
  g.textAlign = align;
  g.textBaseline = 'middle';
  const x = align === 'left' ? 22 : width / 2;
  const y = sub ? height * .4 : height / 2;
  g.fillText(text, x, y);
  if (sub) {
    g.fillStyle = subColor;
    g.font = `bold ${Math.max(16, Math.round(height * .13))}px Arial`;
    g.fillText(sub, x, height * .73);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function signMesh(text, w = 12, h = 3, opts = {}) {
  const tex = textTexture(text, opts);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

export function addBox(list, w, h, d, x, y, z, rotY = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rotY) g.rotateY(rotY);
  g.translate(x, y, z);
  list.push(g);
  return g;
}

export function addPlane(list, w, d, x, y, z, rotY = 0) {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  if (rotY) g.rotateY(rotY);
  g.translate(x, y, z);
  list.push(g);
  return g;
}

export function mergeToMesh(list, material, opts = {}) {
  if (!list.length) return null;
  const merged = mergeGeometries(list, false);
  if (!merged) return null;
  const mesh = new THREE.Mesh(merged, material);
  mesh.castShadow = opts.castShadow ?? true;
  mesh.receiveShadow = opts.receiveShadow ?? true;
  return mesh;
}

export function disposeList(list) {
  list.forEach(g => g.dispose?.());
}

export function makeCanvasGradientTexture(top, bottom, size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, size);
  gr.addColorStop(0, top); gr.addColorStop(.55, bottom); gr.addColorStop(1, bottom);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return c;
}

export function createEnvMap() {
  const top = '#73b6ff', mid = '#b9d8f4', bottom = '#e7b07a';
  const faces = [];
  for (let i = 0; i < 6; i++) faces.push(makeCanvasGradientTexture(i === 2 ? top : mid, bottom));
  const tex = new THREE.CubeTexture(faces);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createSky() {
  const geo = new THREE.SphereGeometry(2300, 32, 18);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x1f5da8) },
      bottomColor: { value: new THREE.Color(0xffb562) },
      sunColor: { value: new THREE.Color(0xffd88c) },
      sunDir: { value: new THREE.Vector3(0.5, 0.25, 0.3) },
      sunIntensity: { value: 1.2 },
      offset: { value: .12 },
      exponent: { value: .72 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPosition = wp.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 topColor; uniform vec3 bottomColor; uniform vec3 sunColor;
      uniform vec3 sunDir; uniform float sunIntensity; uniform float offset; uniform float exponent;
      varying vec3 vWorldPosition;
      void main(){
        vec3 dir = normalize(vWorldPosition);
        float h = clamp((dir.y + offset) / (1.0 + offset), 0.0, 1.0);
        vec3 col = mix(bottomColor, topColor, pow(h, exponent));
        float d = max(dot(dir, normalize(sunDir)), 0.0);
        col += sunColor * pow(d, 220.0) * sunIntensity * 1.8;
        col += sunColor * pow(d, 7.0) * .12 * sunIntensity;
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.frustumCulled = false;
  return sky;
}

export function makeSeaMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x074d84) },
      uShallow: { value: new THREE.Color(0x19a9c9) },
      uSky: { value: new THREE.Color(0x79c4ff) },
      uSun: { value: new THREE.Color(0xffdf9b) },
      uSunDir: { value: new THREE.Vector3(.4, .5, .2) },
      uNight: { value: 0 }
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vPos; varying vec3 vNormal; varying float vWave;
      void main(){
        vec3 p = position;
        float w = sin(p.x*.055 + uTime*.8)*.55 + sin(p.y*.09 - uTime*.55)*.32 + sin((p.x+p.y)*.025 + uTime*.3)*.65;
        p.z += w;
        vWave = w;
        vPos = p;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSky; uniform vec3 uSun; uniform vec3 uSunDir; uniform float uNight;
      varying vec3 vPos; varying vec3 vNormal; varying float vWave;
      void main(){
        float band = smoothstep(.55, 1.15, sin(vPos.x*.12 + vPos.y*.08 + uTime*1.2)*.5+.5);
        float band2 = smoothstep(.72, 1.0, sin(vPos.x*.045 - vPos.y*.06 - uTime*.6)*.5+.5);
        vec3 col = mix(uDeep, uShallow, clamp(vWave*.42+.48,0.,1.));
        col = mix(col, uSky, .24 + band*.16);
        col += uSun * band2 * .22;
        col = mix(col, uDeep*.28, uNight*.65);
        float foam = smoothstep(.88, 1.0, band) * .28;
        col += vec3(foam);
        gl_FragColor = vec4(col, .94);
      }`
  });
}
