import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GAMES } from '../data/games.js';

function makeTextTexture(text, { width = 512, height = 128, color = '#ffffff', font = '700 64px Arial', bg = 'transparent' } = {}) {
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  if (bg !== 'transparent') { ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height); }
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2 + 3);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}


export class RoomScene {
  constructor(canvas, { onPower } = {}) {
    this.canvas = canvas;
    this.onPower = onPower;
    this.active = true;
    this.booted = false;
    this.pointer = new THREE.Vector2();
    this.pointerTarget = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.interactive = [];
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.hovered = false;
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.init();
  }

  init() {
    const { canvas } = this;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03050b);
    this.scene.fog = new THREE.FogExp2(0x03050b, 0.055);

    this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 60);
    this.camera.position.set(3.15, 1.95, 5.35);
    this.camera.lookAt(-0.55, 0.78, 0);

    this.buildBackdrop();
    this.buildFloor();
    this.buildConsole();
    this.buildController();
    this.buildShelf();
    this.buildAtmosphere();
    this.bindEvents();
    this.resize();
    this.animate();
  }

  buildBackdrop() {
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 10),
      new THREE.MeshStandardMaterial({ color: 0x070b14, roughness: 0.92, metalness: 0.05 })
    );
    back.position.set(0, 3.2, -4.4);
    back.receiveShadow = true;
    this.scene.add(back);

    const gradientCanvas = document.createElement('canvas');
    gradientCanvas.width = 1024; gradientCanvas.height = 512;
    const g = gradientCanvas.getContext('2d');
    const grad = g.createRadialGradient(512, 360, 20, 512, 360, 560);
    grad.addColorStop(0, 'rgba(40,106,196,0.32)');
    grad.addColorStop(0.45, 'rgba(20,49,104,0.12)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 512);
    const tex = new THREE.CanvasTexture(gradientCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(14, 7), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.position.set(0.2, 2.4, -4.3);
    this.scene.add(glow);

    const barMatBlue = new THREE.MeshBasicMaterial({ color: 0x2d8cff, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending });
    const barMatPink = new THREE.MeshBasicMaterial({ color: 0x9b5cff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 4.8, 0.035), barMatBlue);
    bar1.position.set(2.75, 2.1, -4.1); this.scene.add(bar1);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 3.2, 0.025), barMatPink);
    bar2.position.set(-2.75, 1.7, -4.15); this.scene.add(bar2);
    const bar3 = new THREE.Mesh(new THREE.BoxGeometry(0.018, 2.4, 0.018), barMatBlue);
    bar3.position.set(-2.3, 1.3, -4.2); this.scene.add(bar3);

    this.neonRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.12, 0.008, 8, 100),
      new THREE.MeshBasicMaterial({ color: 0x5cc8ff, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending })
    );
    this.neonRing.position.set(0.3, 0.9, -1.65);
    this.scene.add(this.neonRing);
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.38, 0.004, 8, 100),
      new THREE.MeshBasicMaterial({ color: 0x9b6bff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending })
    );
    ring2.position.set(0.3, 0.9, -1.7);
    this.scene.add(ring2);

    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 64),
      new THREE.MeshBasicMaterial({ color: 0x1f66c9, transparent: true, opacity: 0.055, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    halo.position.set(0.3, 1.0, -1.68);
    this.scene.add(halo);
  }

  buildFloor() {
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: 0x060a12, roughness: 0.24, metalness: 0.65, clearcoat: 0.7, clearcoatRoughness: 0.2,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(18, 36, 0x1f3e69, 0x0f1b2d);
    grid.position.y = 0.003;
    grid.material.opacity = 0.24;
    grid.material.transparent = true;
    this.scene.add(grid);

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.62, 1.72, 0.14, 64),
      new THREE.MeshPhysicalMaterial({ color: 0x080c14, roughness: 0.22, metalness: 0.8, clearcoat: 1 })
    );
    pedestal.position.y = 0.07;
    pedestal.receiveShadow = true;
    pedestal.castShadow = true;
    this.scene.add(pedestal);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.65, 0.006, 8, 128),
      new THREE.MeshBasicMaterial({ color: 0x54c8ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending })
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.141;
    this.scene.add(rim);
    this.rim = rim;

    const floorGlow = new THREE.Mesh(
      new THREE.CircleGeometry(2.3, 64),
      new THREE.MeshBasicMaterial({ color: 0x185dbd, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.position.y = 0.005;
    this.scene.add(floorGlow);
  }

  buildConsole() {
    const group = new THREE.Group();
    group.position.set(0.28, 0.14, 0);
    this.consoleGroup = group;
    this.scene.add(group);

    const whiteMat = new THREE.MeshPhysicalMaterial({
      color: 0xf3f6fb, roughness: 0.24, metalness: 0.02, clearcoat: 1, clearcoatRoughness: 0.12,
    });
    const blackMat = new THREE.MeshPhysicalMaterial({
      color: 0x07090e, roughness: 0.22, metalness: 0.7, clearcoat: 0.8,
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x11151d, roughness: 0.5, metalness: 0.5 });

    const core = new THREE.Mesh(new RoundedBoxGeometry(0.4, 1.12, 0.35, 6, 0.055), blackMat);
    core.position.y = 0.68;
    core.castShadow = true;
    group.add(core);

    const panelL = new THREE.Mesh(new RoundedBoxGeometry(0.16, 1.2, 0.5, 8, 0.075), whiteMat);
    panelL.position.set(-0.28, 0.7, 0.005);
    panelL.rotation.z = 0.035;
    panelL.castShadow = true;
    panelL.receiveShadow = true;
    group.add(panelL);

    const panelR = new THREE.Mesh(new RoundedBoxGeometry(0.16, 1.2, 0.5, 8, 0.075), whiteMat);
    panelR.position.set(0.28, 0.7, 0.005);
    panelR.rotation.z = -0.035;
    panelR.castShadow = true;
    panelR.receiveShadow = true;
    group.add(panelR);

    const topLip = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.025, 0.4, 4, 0.01), darkMat);
    topLip.position.set(0, 1.26, 0);
    group.add(topLip);

    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.012, 0.012), new THREE.MeshBasicMaterial({ color: 0x010204 }));
    slot.position.set(0, 0.57, 0.178);
    group.add(slot);
    const slotLip = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.003, 0.003), new THREE.MeshBasicMaterial({ color: 0x3c4658 }));
    slotLip.position.set(0, 0.577, 0.183);
    group.add(slotLip);

    const led = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.008, 0.008), new THREE.MeshBasicMaterial({ color: 0x49b8ff }));
    led.position.set(0, 0.48, 0.18);
    group.add(led);
    this.led = led;
    this.ledMat = led.material;
    const ledGlow = new THREE.PointLight(0x2d8cff, 0.45, 1.4, 2);
    ledGlow.position.set(0, 0.48, 0.3);
    group.add(ledGlow);
    this.ledGlow = ledGlow;

    const logoMat = new THREE.MeshBasicMaterial({ map: makeTextTexture('PS5', { width: 256, height: 96, font: '800 60px Arial', color: '#dbeaff' }), transparent: true });
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.064), logoMat);
    logo.position.set(0, 0.83, 0.183);
    group.add(logo);

    for (let i = 0; i < 5; i++) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.006, 0.006), new THREE.MeshBasicMaterial({ color: 0x020305 }));
      vent.position.set(0, 1.0 + i * 0.022, 0.181);
      group.add(vent);
    }

    const standNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.1, 32), darkMat);
    standNeck.position.y = 0.05;
    standNeck.castShadow = true;
    group.add(standNeck);
    const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.045, 48), blackMat);
    standBase.position.y = 0.015;
    standBase.receiveShadow = true;
    standBase.castShadow = true;
    group.add(standBase);
    const standRing = new THREE.Mesh(new THREE.TorusGeometry(0.385, 0.004, 6, 64), new THREE.MeshBasicMaterial({ color: 0x2d8cff, transparent: true, opacity: 0.6 }));
    standRing.rotation.x = Math.PI / 2;
    standRing.position.y = 0.041;
    group.add(standRing);

    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.4, 0.8), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 0.7;
    hit.userData.action = 'power';
    group.add(hit);
    this.interactive.push(hit);

    const glowSprite = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1.4),
      new THREE.MeshBasicMaterial({ color: 0x2d8cff, transparent: true, opacity: 0.045, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    glowSprite.position.set(0, 0.65, 0.25);
    group.add(glowSprite);
  }

  buildController() {
    const g = new THREE.Group();
    g.position.set(1.22, 0.17, 0.78);
    g.rotation.y = -0.55;
    g.rotation.x = 0.1;
    this.scene.add(g);
    this.controller = g;

    const white = new THREE.MeshPhysicalMaterial({ color: 0xf4f7fb, roughness: 0.3, metalness: 0.02, clearcoat: 1 });
    const black = new THREE.MeshStandardMaterial({ color: 0x0a0c12, roughness: 0.38, metalness: 0.4 });
    const blue = new THREE.MeshBasicMaterial({ color: 0x54c8ff });
    const grey = new THREE.MeshStandardMaterial({ color: 0x9ba7b8, roughness: 0.35, metalness: 0.2 });

    const body = new THREE.Mesh(new RoundedBoxGeometry(0.47, 0.075, 0.25, 6, 0.05), white);
    body.castShadow = true;
    g.add(body);
    const center = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.04, 0.17, 4, 0.03), black);
    center.position.y = 0.045;
    g.add(center);

    const gripL = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.09, 0.21, 5, 0.045), white);
    gripL.position.set(-0.24, -0.035, 0.02);
    gripL.rotation.z = 0.32;
    g.add(gripL);
    const gripR = gripL.clone();
    gripR.position.x = 0.24; gripR.rotation.z = -0.32;
    g.add(gripR);

    const stickGeo = new THREE.CylinderGeometry(0.027, 0.032, 0.025, 20);
    const stickL = new THREE.Mesh(stickGeo, black); stickL.position.set(-0.105, 0.075, 0.045); g.add(stickL);
    const stickR = new THREE.Mesh(stickGeo, black); stickR.position.set(0.105, 0.075, -0.045); g.add(stickR);

    const dpad = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.014, 0.016), grey);
    dpad.position.set(-0.16, 0.072, -0.055); g.add(dpad);
    const dpad2 = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.014, 0.05), grey);
    dpad2.position.set(-0.16, 0.072, -0.055); g.add(dpad2);

    const btnColors = [0x64d7ff, 0xff6a8e, 0x78e6a4, 0xff8fe0];
    btnColors.forEach((color, i) => {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.014, 12), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35 }));
      const angle = (i / 4) * Math.PI * 2;
      b.position.set(0.16 + Math.cos(angle) * 0.028, 0.074, -0.05 + Math.sin(angle) * 0.028);
      g.add(b);
    });

    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.006, 0.006), blue);
    bar.position.set(0, 0.055, 0.126);
    g.add(bar);
    const barLight = new THREE.PointLight(0x2d8cff, 0.2, 0.8, 2);
    barLight.position.set(0, 0.08, 0.2);
    g.add(barLight);
  }

  buildShelf() {
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x0b101a, roughness: 0.65, metalness: 0.25 });
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.045, 0.34), shelfMat);
    shelf.position.set(1.85, 0.9, -1.25);
    shelf.castShadow = true; shelf.receiveShadow = true;
    this.scene.add(shelf);
    [-0.58, 0.58].forEach((x) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, 0.26), shelfMat);
      l.position.set(1.85 + x, 0.45, -1.25);
      this.scene.add(l);
    });

    const loader = new THREE.TextureLoader();
    GAMES.forEach((game, i) => {
      const caseGroup = new THREE.Group();
      const x = 1.85 - 0.52 + i * 0.26;
      caseGroup.position.set(x, 1.095, -1.25);
      caseGroup.rotation.y = -0.06;
      const coverMat = new THREE.MeshStandardMaterial({ color: 0x222936, roughness: 0.4, metalness: 0.1 });
      const sideMat = new THREE.MeshStandardMaterial({ color: 0xe8edf5, roughness: 0.6 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.235, 0.34, 0.028), [sideMat, sideMat, sideMat, sideMat, coverMat, sideMat]);
      box.castShadow = true;
      caseGroup.add(box);
      loader.load(game.cover, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        coverMat.map = tex;
        coverMat.color.set(0xffffff);
        coverMat.needsUpdate = true;
      });
      this.scene.add(caseGroup);
    });

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.1),
      new THREE.MeshBasicMaterial({ map: makeTextTexture('GAME LIBRARY', { width: 512, height: 64, font: '700 34px Arial', color: '#6e829d' }), transparent: true, opacity: 0.8 })
    );
    label.position.set(1.85, 0.83, -1.07);
    this.scene.add(label);
  }

  buildAtmosphere() {
    const hemi = new THREE.HemisphereLight(0x9ac9ff, 0x080b12, 0.9);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xd7e8ff, 2.6);
    key.position.set(3.5, 5.5, 4.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -4; key.shadow.camera.right = 4;
    key.shadow.camera.top = 5; key.shadow.camera.bottom = -1;
    key.shadow.bias = -0.0005;
    this.scene.add(key);

    const blue = new THREE.SpotLight(0x2d8cff, 38, 9, 0.65, 0.8, 1.5);
    blue.position.set(-3.2, 3.4, 2.5);
    blue.target.position.set(0.3, 0.6, 0);
    this.scene.add(blue, blue.target);

    const violet = new THREE.SpotLight(0x8b5cff, 30, 10, 0.7, 0.9, 1.5);
    violet.position.set(3.2, 2.7, -2.2);
    violet.target.position.set(0.4, 0.8, 0);
    this.scene.add(violet, violet.target);

    const warm = new THREE.PointLight(0x7fb8ff, 1.2, 5, 2);
    warm.position.set(1.8, 1.5, 1.4);
    this.scene.add(warm);

    const rimLight = new THREE.PointLight(0x9b6bff, 1.4, 4, 2);
    rimLight.position.set(-1.6, 1.2, -1.4);
    this.scene.add(rimLight);

    const count = this.reduce ? 80 : 260;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = Math.random() * 4.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5 - 1;
      speeds[i] = 0.02 + Math.random() * 0.08;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x86c9ff, size: 0.014, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
    this.particles = new THREE.Points(geo, mat);
    this.particleSpeeds = speeds;
    this.scene.add(this.particles);
  }

  bindEvents() {
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);

    this.onPointerMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      this.pointerTarget.set(nx, ny);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObjects(this.interactive, false)[0];
      const isHover = !!hit;
      if (isHover !== this.hovered) {
        this.hovered = isHover;
        this.canvas.style.cursor = isHover ? 'pointer' : 'default';
      }
    };
    this.onPointerDown = (e) => {
      if (this.booted) return;
      this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObjects(this.interactive, false)[0];
      if (hit) this.onPower?.();
    };
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    const mobile = w < 760;
    if (mobile) {
      this.camera.fov = 46;
      this.camera.position.set(2.7, 2.3, 6.2);
      this.camera.lookAt(-0.55, 0.72, 0);
    } else {
      this.camera.fov = 35;
      this.camera.position.set(3.15, 1.95, 5.35);
      this.camera.lookAt(-0.55, 0.78, 0);
    }
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.6 : 1.8));
    this.renderer.setSize(w, h);
  }

  setActive(value) {
    this.active = value;
    if (value) this.clock.getDelta();
  }

  setBooted(value) {
    this.booted = value;
    if (value) {
      this.ledMat.color.setHex(0xffffff);
      this.ledGlow.color.setHex(0xbfe8ff);
      this.ledGlow.intensity = 1.4;
    } else {
      this.ledMat.color.setHex(0x49b8ff);
      this.ledGlow.color.setHex(0x2d8cff);
      this.ledGlow.intensity = 0.45;
    }
  }

  animate = () => {
    this.raf = requestAnimationFrame(this.animate);
    if (!this.active) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed += dt;

    this.pointer.lerp(this.pointerTarget, 0.045);
    const camX = (window.innerWidth < 760 ? 2.7 : 3.15) + this.pointer.x * 0.16;
    const camY = (window.innerWidth < 760 ? 2.3 : 1.95) + this.pointer.y * 0.08;
    this.camera.position.x += (camX - this.camera.position.x) * 0.03;
    this.camera.position.y += (camY - this.camera.position.y) * 0.03;
    this.camera.lookAt(-0.55 + this.pointer.x * 0.08, 0.78 + this.pointer.y * 0.05, 0);

    if (this.consoleGroup) {
      this.consoleGroup.rotation.y = Math.sin(this.elapsed * 0.3) * 0.018 + this.pointer.x * 0.035;
      this.consoleGroup.position.y = 0.14 + Math.sin(this.elapsed * 0.8) * 0.004;
    }
    if (this.rim) this.rim.material.opacity = 0.42 + Math.sin(this.elapsed * 1.4) * 0.14;
    if (this.ledMat && !this.booted) {
      const pulse = 0.55 + Math.sin(this.elapsed * 2.2) * 0.35;
      this.ledMat.color.setRGB(0.25 * pulse, 0.65 * pulse, 1 * pulse);
    }
    if (this.neonRing) this.neonRing.rotation.z = Math.sin(this.elapsed * 0.12) * 0.03;
    if (this.particles) {
      const pos = this.particles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + this.particleSpeeds[i] * dt;
        if (y > 4.4) y = 0;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }
    this.renderer.render(this.scene, this.camera);
  };

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.dispose();
  }
}
