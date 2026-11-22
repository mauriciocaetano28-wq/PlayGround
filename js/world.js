import {
  THREE, COLORS, rand, pick, clamp, createSky, createEnvMap, makeSeaMaterial, textTexture
} from './world-utils.js';
import { buildWorld } from './world-districts.js';
import { TrafficSystem, PedestrianSystem } from './world-life.js';

const PALETTES = [
  { h: 0, top: 0x02050f, bottom: 0x0a1430, sun: 0x9ebcff, hemi: 0x263c66, fog: 0x0b1424, sunI: .05, hemiI: .25, night: 1 },
  { h: 5.2, top: 0x0b1730, bottom: 0x2d3157, sun: 0xffb06b, hemi: 0x5c5f87, fog: 0x3a3d58, sunI: .1, hemiI: .3, night: .9 },
  { h: 6.7, top: 0x3c6b9e, bottom: 0xffb47b, sun: 0xffd29a, hemi: 0x9aacc8, fog: 0xb39a86, sunI: .7, hemiI: .55, night: .25 },
  { h: 9, top: 0x1670cf, bottom: 0x9ed7f5, sun: 0xfff4cf, hemi: 0x8fbfe8, fog: 0xb9d6e8, sunI: 1.55, hemiI: .75, night: 0 },
  { h: 12, top: 0x0c61c9, bottom: 0xb9e2fa, sun: 0xffffef, hemi: 0xa4cff0, fog: 0xc1ddec, sunI: 1.85, hemiI: .85, night: 0 },
  { h: 16.2, top: 0x2962a8, bottom: 0xffca8e, sun: 0xffe0a1, hemi: 0xbec4cc, fog: 0xd6b58d, sunI: 1.35, hemiI: .7, night: .05 },
  { h: 18, top: 0x273a77, bottom: 0xff7b35, sun: 0xff9d48, hemi: 0xb8878d, fog: 0xb06f58, sunI: .7, hemiI: .5, night: .35 },
  { h: 19.4, top: 0x101a42, bottom: 0x6b2e63, sun: 0xff6f52, hemi: 0x5e4773, fog: 0x382c4b, sunI: .18, hemiI: .36, night: .72 },
  { h: 21, top: 0x020610, bottom: 0x0a1228, sun: 0x91b5ff, hemi: 0x1f3157, fog: 0x081021, sunI: .04, hemiI: .25, night: 1 },
  { h: 24, top: 0x02050f, bottom: 0x0a1430, sun: 0x9ebcff, hemi: 0x263c66, fog: 0x0b1424, sunI: .05, hemiI: .25, night: 1 },
];

function paletteAt(hour) {
  let a = PALETTES[0], b = PALETTES[PALETTES.length - 1];
  for (let i = 0; i < PALETTES.length - 1; i++) {
    if (hour >= PALETTES[i].h && hour <= PALETTES[i + 1].h) { a = PALETTES[i]; b = PALETTES[i + 1]; break; }
  }
  const t = clamp((hour - a.h) / Math.max(.001, b.h - a.h), 0, 1);
  const ease = t * t * (3 - 2 * t);
  return {
    top: new THREE.Color(a.top).lerp(new THREE.Color(b.top), ease),
    bottom: new THREE.Color(a.bottom).lerp(new THREE.Color(b.bottom), ease),
    sun: new THREE.Color(a.sun).lerp(new THREE.Color(b.sun), ease),
    hemi: new THREE.Color(a.hemi).lerp(new THREE.Color(b.hemi), ease),
    fog: new THREE.Color(a.fog).lerp(new THREE.Color(b.fog), ease),
    sunI: a.sunI + (b.sunI - a.sunI) * ease,
    hemiI: a.hemiI + (b.hemiI - a.hemiI) * ease,
    night: a.night + (b.night - a.night) * ease,
  };
}

export class World {
  constructor(scene, renderer, audio, quality = 'high') {
    this.scene = scene;
    this.renderer = renderer;
    this.audio = audio;
    this.quality = quality;
    this.obstacles = [];
    this.windowData = [];
    this.lampMaterials = [];
    this.puddles = [];
    this.pois = [];
    this.districts = [
      { id: 'centro', name: 'CENTRO', x: 0, z: 0, r: 150, color: '#55b5ff' },
      { id: 'favela', name: 'FAVELA', x: -320, z: -250, r: 150, color: '#ff6eb4' },
      { id: 'praia', name: 'PRAIA', x: 550, z: 0, r: 160, color: '#ffd45c' },
      { id: 'aeroporto', name: 'AEROPORTO', x: 0, z: -490, r: 150, color: '#7ad8ff' },
      { id: 'interior', name: 'INTERIOR', x: -500, z: 340, r: 150, color: '#79df7d' },
      { id: 'rico', name: 'BAIRRO RICO', x: 320, z: 320, r: 140, color: '#ffd98e' },
      { id: 'porto', name: 'PORTO', x: 520, z: -330, r: 140, color: '#5fe0c8' },
      { id: 'serra', name: 'SERRA', x: -410, z: -500, r: 140, color: '#a4b6c9' },
      { id: 'industrial', name: 'INDUSTRIAL', x: 350, z: -170, r: 130, color: '#ff9e54' },
      { id: 'japones', name: 'BAIRRO JAPONÊS', x: 160, z: 330, r: 100, color: '#ff6478' },
    ];
    this.roadCoords = [];
    for (let v = -560; v <= 560; v += 80) this.roadCoords.push(v);
    this.hour = 17.25;
    this.weather = 'tarde';
    this.wetness = 0;
    this.windowPhase = -1;
    this.trafficLightTime = 0;
    this.trafficAxis = 'x';
    this.animTime = 0;
    this.lightningTimer = 8;
    this.plane = null;
    this.kites = [];
    this.smokeEmitters = [];
    this.clockTick = 0;

    scene.fog = new THREE.Fog(0xb9d6e8, 240, 1500);
    scene.environment = createEnvMap();

    this.setupSky();
    this.setupLights();
    this.setupTerrain();
    this.setupRain();
    this.setupPuddles();

    buildWorld(this);
    this.buildWindows();
    this.traffic = new TrafficSystem(this, 100);
    this.peds = new PedestrianSystem(this, 200);
    this.setupBirds();

    this.applyTime(true);
    this.setWeather('tarde', true);
  }

  setupSky() {
    this.sky = createSky();
    this.scene.add(this.sky);

    const starGeo = new THREE.BufferGeometry();
    const pos = [];
    for (let i = 0; i < 1800; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.random() * Math.PI * .47;
      const r = 2100;
      pos.push(Math.cos(th) * Math.cos(ph) * r, Math.sin(ph) * r + 80, Math.sin(th) * Math.cos(ph) * r);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.starMat = new THREE.PointsMaterial({ color: 0xcfe5ff, size: 3.2, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true });
    this.stars = new THREE.Points(starGeo, this.starMat);
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);

    this.sunMesh = new THREE.Mesh(new THREE.SphereGeometry(46, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff2b8, toneMapped: false }));
    this.sunMesh.frustumCulled = false;
    this.scene.add(this.sunMesh);
    this.moonMesh = new THREE.Mesh(new THREE.SphereGeometry(30, 16, 12), new THREE.MeshBasicMaterial({ color: 0xd8e6ff, toneMapped: false }));
    this.moonMesh.frustumCulled = false;
    this.scene.add(this.moonMesh);

    this.clouds = [];
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .74, roughness: 1, depthWrite: false, fog: false });
    for (let i = 0; i < 20; i++) {
      const g = new THREE.Group();
      const n = 3 + (i % 4);
      for (let j = 0; j < n; j++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(rand(18, 38), 7, 5), cloudMat);
        m.position.set(rand(-45, 45), rand(-7, 8), rand(-18, 18));
        m.scale.y = rand(.35, .6);
        g.add(m);
      }
      g.position.set(rand(-1000, 1000), rand(190, 330), rand(-1000, 1000));
      g.userData.speed = rand(1.2, 4.2);
      this.clouds.push(g);
      this.scene.add(g);
    }
  }

  setupLights() {
    this.hemi = new THREE.HemisphereLight(0x9ac7ff, 0x3b3b2b, .75);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffe5b5, 1.6);
    this.sun.castShadow = true;
    const mapSize = this.quality === 'low' ? 1024 : this.quality === 'medium' ? 1536 : 2048;
    this.sun.shadow.mapSize.set(mapSize, mapSize);
    this.sun.shadow.camera.left = -130;
    this.sun.shadow.camera.right = 130;
    this.sun.shadow.camera.top = 130;
    this.sun.shadow.camera.bottom = -130;
    this.sun.shadow.camera.near = 10;
    this.sun.shadow.camera.far = 520;
    this.sun.shadow.bias = -.0005;
    this.sun.shadow.normalBias = .04;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    this.fill = new THREE.DirectionalLight(0x7ba8ff, .2);
    this.fill.position.set(-100, 80, -100);
    this.scene.add(this.fill);
    this.spawnLight = new THREE.PointLight(0xffb35e, 0, 26, 2);
    this.spawnLight.position.set(0, 6, 0);
    this.scene.add(this.spawnLight);
  }

  setupTerrain() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(3400, 3400),
      new THREE.MeshStandardMaterial({ color: 0x2d4a33, roughness: .96, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -.05;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.ground = ground;

    const cityGround = new THREE.Mesh(
      new THREE.PlaneGeometry(1260, 1260),
      new THREE.MeshStandardMaterial({ color: 0x444844, roughness: .94 })
    );
    cityGround.rotation.x = -Math.PI / 2;
    cityGround.position.y = -.01;
    cityGround.receiveShadow = true;
    this.scene.add(cityGround);

    const seaMat = makeSeaMaterial();
    this.seaMat = seaMat;
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(2100, 2200, 72, 72), seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(1550, .02, 0);
    sea.receiveShadow = false;
    this.scene.add(sea);
    this.sea = sea;

    // areia da praia
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(180, 1100), new THREE.MeshStandardMaterial({ color: 0xe4d19c, roughness: .92 }));
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(630, .03, 0);
    sand.receiveShadow = true;
    this.scene.add(sand);

    // gramado do bairro rico e interior
    const grass1 = new THREE.Mesh(new THREE.PlaneGeometry(260, 240), new THREE.MeshStandardMaterial({ color: 0x386b3d, roughness: 1 }));
    grass1.rotation.x = -Math.PI / 2; grass1.position.set(320, .02, 320); grass1.receiveShadow = true; this.scene.add(grass1);
    const farm = new THREE.Mesh(new THREE.PlaneGeometry(300, 260), new THREE.MeshStandardMaterial({ color: 0x6e6d37, roughness: 1 }));
    farm.rotation.x = -Math.PI / 2; farm.position.set(-500, .02, 340); farm.receiveShadow = true; this.scene.add(farm);

    // pista do aeroporto
    const runway = new THREE.Mesh(new THREE.PlaneGeometry(70, 520), new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: .68 }));
    runway.rotation.x = -Math.PI / 2; runway.position.set(0, .025, -500); runway.receiveShadow = true; this.scene.add(runway);
    const marks = [];
    for (let z = -720; z <= -280; z += 24) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 12), new THREE.MeshBasicMaterial({ color: 0xf4f0d8 }));
      m.rotation.x = -Math.PI / 2; m.position.set(0, .04, z); this.scene.add(m);
    }
  }

  setupRain() {
    const count = this.quality === 'low' ? 1200 : 2600;
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = rand(-55, 55);
      arr[i * 3 + 1] = rand(0, 55);
      arr[i * 3 + 2] = rand(-55, 55);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    this.rainMat = new THREE.PointsMaterial({ color: 0xbfd9ff, size: .09, transparent: true, opacity: 0, depthWrite: false });
    this.rain = new THREE.Points(geo, this.rainMat);
    this.rain.frustumCulled = false;
    this.rainCount = count;
    this.scene.add(this.rain);
  }

  setupPuddles() {
    const puddleMat = new THREE.MeshPhysicalMaterial({
      color: 0x28313d, metalness: .82, roughness: .08, transparent: true, opacity: .78,
      envMapIntensity: 1.4, clearcoat: 1, clearcoatRoughness: .04, side: THREE.DoubleSide
    });
    this.puddleMat = puddleMat;
    for (let i = 0; i < 38; i++) {
      const horizontal = Math.random() < .5;
      const coord = pick(this.roadCoords);
      const along = rand(-520, 520);
      const m = new THREE.Mesh(new THREE.CircleGeometry(rand(1.2, 4.6), 14), puddleMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(horizontal ? along : coord + rand(-3, 3), .055, horizontal ? coord + rand(-3, 3) : along);
      m.scale.set(1, rand(.4, .9), 1);
      m.visible = false;
      this.puddles.push(m);
      this.scene.add(m);
    }
  }

  setupBirds() {
    const geo = new THREE.ConeGeometry(.25, 1.5, 4);
    geo.rotateZ(Math.PI / 2);
    this.birdMat = new THREE.MeshBasicMaterial({ color: 0x1b1b20 });
    this.birds = new THREE.InstancedMesh(geo, this.birdMat, 36);
    this.birdData = [];
    for (let i = 0; i < 36; i++) {
      this.birdData.push({ a: Math.random() * Math.PI * 2, r: rand(50, 260), h: rand(35, 95), s: rand(.12, .35), cx: rand(-300, 500), cz: rand(-400, 400), phase: Math.random() * 6 });
    }
    this.birds.castShadow = false;
    this.scene.add(this.birds);
  }

  addObstacle(minX, maxX, minZ, maxZ, height = 10) {
    this.obstacles.push({ minX, maxX, minZ, maxZ, height });
  }

  buildWindows() {
    if (!this.windowData.length) return;
    const geo = new THREE.PlaneGeometry(1.25, 1.75);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, side: THREE.DoubleSide });
    const mesh = new THREE.InstancedMesh(geo, mat, this.windowData.length);
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    this.windowData.forEach((w, i) => {
      d.position.set(w.x, w.y, w.z);
      d.rotation.set(w.rx || 0, w.ry || 0, 0);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
      const lit = Math.random() < w.lit;
      c.setHex(lit ? pick([0xffd98a, 0xffe9b8, 0xffc463, 0xc8e3ff]) : 0x182433);
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    this.windowMesh = mesh;
    this.scene.add(mesh);
  }

  setWeather(weather, silent = false) {
    this.weather = weather;
    if (weather === 'chuva') {
      this.hour = 19.1;
      this.rainMat.opacity = .72;
      this.puddles.forEach(p => p.visible = true);
      this.scene.fog.near = 80;
      this.scene.fog.far = 650;
      this.seaMat.uniforms.uNight.value = .5;
      if (this.roadMat) { this.roadMat.roughness = .2; this.roadMat.metalness = .35; }
      if (!silent) this.audio.speak('Chuva forte na cidade. Cuidado com as ruas molhadas.');
    } else if (weather === 'neblina') {
      this.hour = 6.4;
      this.rainMat.opacity = 0;
      this.puddles.forEach(p => p.visible = false);
      this.scene.fog.near = 25;
      this.scene.fog.far = 330;
      if (this.roadMat) { this.roadMat.roughness = .68; this.roadMat.metalness = .05; }
      if (!silent) this.audio.speak('Neblina na serra. Visibilidade reduzida.');
    } else if (weather === 'noite') {
      this.hour = 21.4;
      this.rainMat.opacity = 0;
      this.puddles.forEach(p => p.visible = false);
      this.scene.fog.near = 220; this.scene.fog.far = 1300;
      if (this.roadMat) { this.roadMat.roughness = .5; this.roadMat.metalness = .12; }
    } else if (weather === 'tarde') {
      this.hour = 17.35;
      this.rainMat.opacity = 0;
      this.puddles.forEach(p => p.visible = false);
      this.scene.fog.near = 260; this.scene.fog.far = 1600;
      if (this.roadMat) { this.roadMat.roughness = .55; this.roadMat.metalness = .08; }
    } else {
      this.hour = 11.5;
      this.rainMat.opacity = 0;
      this.puddles.forEach(p => p.visible = false);
      this.scene.fog.near = 300; this.scene.fog.far = 1800;
      if (this.roadMat) { this.roadMat.roughness = .55; this.roadMat.metalness = .08; }
    }
    this.applyTime(true);
    if (!silent) this.audio.thunder();
  }

  cycleWeather() {
    const order = ['tarde', 'noite', 'chuva', 'neblina', 'sol'];
    const next = order[(order.indexOf(this.weather) + 1) % order.length];
    this.setWeather(next);
    return next;
  }

  applyTime(force = false) {
    const p = paletteAt(this.hour);
    const night = p.night;
    this.sky.material.uniforms.topColor.value.copy(p.top);
    this.sky.material.uniforms.bottomColor.value.copy(p.bottom);
    this.sky.material.uniforms.sunColor.value.copy(p.sun);
    this.sky.material.uniforms.sunIntensity.value = .4 + p.sunI * .6;

    const ang = ((this.hour - 6) / 12) * Math.PI;
    const elev = Math.sin(ang);
    const az = Math.cos(ang);
    const sunDir = new THREE.Vector3(az * .75, Math.max(-.2, elev), .42).normalize();
    this.sky.material.uniforms.sunDir.value.copy(sunDir);
    this.sun.position.copy(sunDir).multiplyScalar(260);
    this.sun.position.y = Math.max(20, this.sun.position.y);
    this.sun.intensity = p.sunI * (this.weather === 'chuva' ? .35 : this.weather === 'neblina' ? .55 : 1);
    this.sun.color.copy(p.sun);
    this.hemi.color.copy(p.hemi);
    this.hemi.intensity = p.hemiI * (this.weather === 'chuva' ? .65 : 1);
    this.fill.intensity = .08 + night * .2;
    this.spawnLight.intensity = night * 18;

    const sunPos = sunDir.clone().multiplyScalar(2000);
    this.sunMesh.position.copy(sunPos);
    this.sunMesh.visible = sunPos.y > -100;
    this.sunMesh.material.color.copy(p.sun);
    this.moonMesh.position.set(-sunPos.x * .8, Math.abs(sunPos.y) * .75 + 300, -sunPos.z * .8);
    this.moonMesh.visible = night > .25;
    this.starMat.opacity = clamp((night - .25) * 1.5, 0, .95);
    this.stars.rotation.y += .00008;

    this.scene.fog.color.copy(p.fog);
    this.renderer.toneMappingExposure = this.weather === 'chuva' ? .8 : this.weather === 'noite' ? .95 : 1.04;
    this.seaMat.uniforms.uNight.value = night;
    this.seaMat.uniforms.uSky.value.copy(p.bottom);
    this.seaMat.uniforms.uSun.value.copy(p.sun);

    // janelas acendem à noite
    const phase = Math.round(night * 4) / 4;
    if (force || phase !== this.windowPhase) {
      this.windowPhase = phase;
      this.updateWindows(night);
    }
    this.lampMaterials.forEach(m => { m.emissiveIntensity = .4 + night * 5.2; });
    this.night = night;
    this.weatherDark = this.weather === 'chuva' ? .45 : 1;
  }

  updateWindows(night) {
    if (!this.windowMesh) return;
    const c = new THREE.Color();
    const d = new THREE.Object3D();
    this.windowData.forEach((w, i) => {
      const lit = Math.random() < w.lit * (0.25 + night * .95);
      if (night > .35) c.setHex(lit ? pick([0xffd58a, 0xffe6b1, 0xffbd57, 0xbcdcff]) : 0x101a27);
      else c.setHex(lit ? 0x4a5a6c : 0x1a2a3a);
      this.windowMesh.setColorAt(i, c);
    });
    if (this.windowMesh.instanceColor) this.windowMesh.instanceColor.needsUpdate = true;
  }

  update(dt, playerPos) {
    this.animTime += dt;
    this.hour += dt * (24 / 1100);
    if (this.hour >= 24) this.hour -= 24;
    this.applyTime();

    this.sky.position.set(playerPos.x, 0, playerPos.z);
    this.sun.position.add(new THREE.Vector3(playerPos.x, 0, playerPos.z));
    this.sun.target.position.set(playerPos.x, 0, playerPos.z);
    this.sun.target.updateMatrixWorld();

    this.sunMesh.position.x += playerPos.x; this.sunMesh.position.z += playerPos.z;
    this.moonMesh.position.x += playerPos.x; this.moonMesh.position.z += playerPos.z;
    this.stars.position.set(playerPos.x, 0, playerPos.z);
    this.rain.position.set(playerPos.x, 0, playerPos.z);

    this.clouds.forEach(c => {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 1200) c.position.x = -1200;
    });

    const seaT = this.animTime;
    this.seaMat.uniforms.uTime.value = seaT;
    this.seaMat.uniforms.uSunDir.value.copy(this.sky.material.uniforms.sunDir.value);

    if (this.rainMat.opacity > 0) {
      const pos = this.rain.geometry.attributes.position;
      for (let i = 0; i < this.rainCount; i++) {
        let y = pos.getY(i) - dt * 42;
        if (y < 0) { y = 55; pos.setX(i, rand(-55, 55)); pos.setZ(i, rand(-55, 55)); }
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = rand(6, 18);
        this.audio.thunder();
        this.hemi.intensity = 2.8;
        this.renderer.toneMappingExposure = 1.6;
        setTimeout(() => { this.applyTime(true); }, 140);
      }
    }

    if (this.plane) {
      const t = this.animTime * .035 % 1;
      this.plane.position.z = -760 + t * 720;
      this.plane.position.y = t < .22 ? 8 + Math.pow(t / .22, 2) * 65 : t > .82 ? 8 + Math.pow((1 - t) / .18, 2) * 65 : 73;
      this.plane.rotation.x = t < .22 ? -.18 * (1 - t / .22) : t > .82 ? .18 * ((t - .82) / .18) : 0;
      this.plane.rotation.z = Math.sin(this.animTime * .15) * .02;
    }

    this.kites.forEach((k, i) => {
      k.position.y = k.userData.baseY + Math.sin(this.animTime * 1.6 + i) * 1.4;
      k.rotation.z = Math.sin(this.animTime * .9 + i) * .25;
      k.rotation.y += dt * .2;
    });

    const dummy = new THREE.Object3D();
    this.birdData.forEach((b, i) => {
      b.a += b.s * dt;
      const x = b.cx + Math.cos(b.a) * b.r;
      const z = b.cz + Math.sin(b.a) * b.r;
      dummy.position.set(x, b.h + Math.sin(this.animTime * 2 + b.phase) * 2, z);
      dummy.rotation.set(0, -b.a + Math.PI / 2, Math.sin(this.animTime * 7 + b.phase) * .4);
      dummy.updateMatrix();
      this.birds.setMatrixAt(i, dummy.matrix);
    });
    this.birds.instanceMatrix.needsUpdate = true;

    this.trafficLightTime += dt;
    if (this.trafficLightTime > 8) {
      this.trafficLightTime = 0;
      this.trafficAxis = this.trafficAxis === 'x' ? 'z' : 'x';
      this.updateTrafficLights();
    }

    this.traffic.update(dt, playerPos);
    this.peds.update(dt, playerPos);

    // fumaça das fábricas
    this.smokeEmitters.forEach(e => {
      e.phase += dt;
      e.mesh.position.y = e.baseY + (e.phase % 1) * 20;
      e.mesh.scale.setScalar(1 + (e.phase % 1) * 4);
      e.mesh.material.opacity = .22 * (1 - (e.phase % 1));
    });

    this.updatePuddleReflection();
  }

  updatePuddleReflection() {
    if (this.weather === 'chuva') {
      this.puddleMat.roughness = .035 + Math.sin(this.animTime * 2) * .008;
    }
  }

  updateTrafficLights() {
    if (!this.trafficLights) return;
    this.trafficLights.forEach(tl => {
      const green = tl.axis === this.trafficAxis;
      tl.greenMat.color.setHex(green ? 0x2dff7d : 0x0b2a16);
      tl.yellowMat.color.setHex(0x3a2e06);
      tl.redMat.color.setHex(green ? 0x2a080c : 0xff2c3e);
      tl.light.color.setHex(green ? 0x2dff7d : 0xff2c3e);
      tl.light.intensity = 2.2;
    });
  }

  getDistrict(x, z) {
    let best = this.districts[0], bd = Infinity;
    for (const d of this.districts) {
      const dist = Math.hypot(x - d.x, z - d.z);
      if (dist < bd) { bd = dist; best = d; }
    }
    return bd < best.r + 100 ? best : null;
  }

  isOnRoad(x, z, margin = 8) {
    for (const c of this.roadCoords) {
      if (Math.abs(x - c) < margin || Math.abs(z - c) < margin) return true;
    }
    return false;
  }

  nearestPOI(x, z, type = null) {
    let best = null, bd = 8;
    for (const p of this.pois) {
      if (type && p.type !== type) continue;
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < (p.radius || bd)) { bd = d; best = p; }
    }
    return best;
  }

  addSign(text, x, y, z, ry = 0, w = 12, h = 3, opts = {}) {
    const mat = new THREE.MeshBasicMaterial({ map: textTexture(text, opts), transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry;
    this.scene.add(m);
    return m;
  }

  setQuality(q) {
    this.quality = q;
    const size = q === 'low' ? 1024 : q === 'medium' ? 1536 : 2048;
    if (this.sun.shadow.mapSize.x !== size) {
      this.sun.shadow.mapSize.set(size, size);
      if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    }
    this.rain.visible = q !== 'low' || this.weather === 'chuva';
    this.peds.setDensity(q === 'low' ? .55 : q === 'medium' ? .8 : 1);
    this.traffic.setDensity(q === 'low' ? .55 : q === 'medium' ? .8 : 1);
  }

  collideCircle(x, z, radius) {
    for (const o of this.obstacles) {
      if (x + radius > o.minX && x - radius < o.maxX && z + radius > o.minZ && z - radius < o.maxZ) return o;
    }
    return null;
  }
}
